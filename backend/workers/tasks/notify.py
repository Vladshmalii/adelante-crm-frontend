"""Задачи-отправители (очередь `notifications`).

Кого уведомлять в Telegram (решения от 28–29.09.2026):
- мастеру — новая запись к нему, перенос и отмена его записи, передача
  записи другому мастеру; изменение его смен, если менял не он сам;
- администраторам салона — новая запись, перенос и отмена, но только тем,
  кто сейчас на смене; суперюзерам — всегда (backend/docs/shifts.md);
- клиенту — напоминание за 30 минут (workers.tasks.reminders) и после
  завершения визита — ссылка на отзыв.
Автору изменения уведомление о его же действии не отправляется.

Дедупликация: доставка at-least-once, поэтому перед отправкой — SETNX по
(event_id, канал, получатель); повторный прогон outbox/сканера не даёт
дубль получателю.
"""

import contextlib
import html
import json
import logging
from datetime import datetime
from typing import Any
from uuid import UUID

import httpx
import redis as redis_sync
from sqlalchemy import select

from app.config import get_settings
from app.models.master import Administrator, Client, Master, Salon, administrator_salons
from app.models.shard import Record, RecordStatus, ShiftKind, StaffShift
from app.notifications.outbox import RECORD_CREATED, RECORD_UPDATED
from app.timeutils import format_local, now_local
from workers import db, telegram
from workers.celery_app import celery

logger = logging.getLogger(__name__)

DEDUPE_TTL = 86400

# Изменения записи, о которых сообщаем в Telegram
MASTER_CHANGES = {"rescheduled", "reassigned", "cancelled"}


def _first_delivery(event_id: str, channel: str) -> bool:
    """True, если событие в этот канал ещё не отправлялось."""
    try:
        return bool(db.redis_client.set(f"sent:{event_id}:{channel}", "1", nx=True, ex=DEDUPE_TTL))
    except redis_sync.RedisError:
        # Redis недоступен — лучше рискнуть дублем, чем потерять уведомление
        return True


def _when(value: str | None) -> str:
    return format_local(datetime.fromisoformat(value)) if value else "—"


def _esc(value: Any) -> str:
    return html.escape(str(value)) if value else "—"


def _salon_name(salon_id: UUID) -> str | None:
    with db.master_session() as session:
        return session.scalar(select(Salon.name).where(Salon.id == salon_id))


def _record_lines(payload: dict[str, Any], *, with_master: bool) -> list[str]:
    lines = [f"Клієнт: {_esc(payload.get('client_name'))}"]
    if with_master:
        lines.append(f"Майстер: {_esc(payload.get('master_name') or 'без майстра')}")
    lines.append(f"Послуги: {_esc(payload.get('service_name'))}")
    return lines


def wants_master_notification(event_type: str, payload: dict[str, Any]) -> bool:
    if event_type == RECORD_CREATED:
        return payload.get("master_id") is not None
    if event_type == RECORD_UPDATED and payload.get("change") in MASTER_CHANGES:
        return bool(payload.get("master_id") or payload.get("previous_master_id"))
    return False


def wants_review_request(event_type: str, payload: dict[str, Any]) -> bool:
    return event_type == RECORD_UPDATED and payload.get("change") == "completed"


def wants_manager_notification(event_type: str, payload: dict[str, Any]) -> bool:
    """Новая запись, перенос (сменилось время) и отмена — администраторам на смене."""
    if event_type == RECORD_CREATED:
        return True
    if event_type != RECORD_UPDATED:
        return False
    change = payload.get("change")
    return change == "cancelled" or (
        change == "rescheduled" and payload.get("previous_start_at") is not None
    )


def _manager_text(event_type: str, payload: dict[str, Any]) -> str:
    if event_type == RECORD_CREATED:
        title = "🗓 <b>Новий запис</b>"
    elif payload.get("change") == "cancelled":
        title = "❌ <b>Запис скасовано</b>"
    else:
        title = "🔁 <b>Запис перенесено</b>"
    lines = [title, *_record_lines(payload, with_master=True)]
    if payload.get("previous_start_at"):
        lines.append(f"Було: {_when(payload['previous_start_at'])}")
    lines.append(f"Час: {_when(payload.get('start_at'))}")
    return "\n".join(lines)


@celery.task(autoretry_for=(httpx.HTTPError,), retry_backoff=True, max_retries=5)
def notify_manager_telegram(envelope: dict[str, Any]) -> None:
    if not _first_delivery(envelope["event_id"], "manager_tg"):
        return
    salon_id = UUID(envelope["salon_id"])
    payload = envelope["payload"]
    actor_id = payload.get("actor_id")

    with db.master_session() as session:
        rows = session.execute(
            select(Administrator.id, Administrator.telegram_user_id, Administrator.is_superuser)
            .join(
                administrator_salons,
                administrator_salons.c.administrator_id == Administrator.id,
            )
            .where(
                administrator_salons.c.salon_id == salon_id,
                administrator_salons.c.is_active.is_(True),
                Administrator.is_active.is_(True),
                Administrator.telegram_user_id.is_not(None),
            )
        ).all()
    candidates = [(admin_id, chat_id, su) for admin_id, chat_id, su in rows if chat_id]
    # Суперюзер получает всегда, остальные администраторы — только на смене
    on_shift = _on_shift_now(salon_id, [a for a, _, su in candidates if not su])
    chat_ids = [
        chat_id
        for admin_id, chat_id, su in candidates
        if str(admin_id) != actor_id and (su or admin_id in on_shift)
    ]
    if not chat_ids:
        logger.info("Салон %s: на смене нет администраторов с Telegram — пропущено", salon_id)
        return

    text = _manager_text(envelope["event_type"], payload)
    for chat_id in chat_ids:
        telegram.send_message(chat_id, text)


def _on_shift_now(salon_id: UUID, staff_ids: list[UUID]) -> set[UUID]:
    """Сотрудники, у которых сейчас (по Киеву) идёт смена; перерыв не учитывается."""
    if not staff_ids:
        return set()
    now = now_local()
    with db.shard_session(salon_id) as session:
        return set(
            session.scalars(
                select(StaffShift.staff_id).where(
                    StaffShift.staff_id.in_(staff_ids),
                    StaffShift.date == now.date(),
                    StaffShift.kind == ShiftKind.SHIFT,
                    StaffShift.start_time <= now.time(),
                    StaffShift.end_time > now.time(),
                )
            )
        )


def _master_messages(event_type: str, payload: dict[str, Any]) -> list[tuple[str, str]]:
    """[(master_id, текст)] — кому из мастеров и что отправить."""
    master_id = payload.get("master_id")
    lines = _record_lines(payload, with_master=False)
    when = f"Час: {_when(payload.get('start_at'))}"
    new_record = "\n".join(["🆕 <b>Новий запис до вас</b>", *lines, when])

    if event_type == RECORD_CREATED:
        return [(master_id, new_record)] if master_id else []

    change = payload.get("change")
    if change == "cancelled" and master_id:
        return [(master_id, "\n".join(["❌ <b>Запис скасовано</b>", *lines, when]))]
    if change == "rescheduled" and master_id:
        body = ["🔁 <b>Запис змінено</b>", *lines]
        if payload.get("previous_start_at"):
            body.append(f"Було: {_when(payload['previous_start_at'])}")
            body.append(f"Стало: {_when(payload.get('start_at'))}")
        else:
            body.append(when)
        return [(master_id, "\n".join(body))]
    if change == "reassigned":
        messages = []
        previous = payload.get("previous_master_id")
        if previous:
            messages.append(
                (
                    previous,
                    "\n".join(["↪️ <b>Запис передано іншому майстру</b>", *lines, when]),
                )
            )
        if master_id:
            messages.append((master_id, new_record))
        return messages
    return []


@celery.task(autoretry_for=(httpx.HTTPError,), retry_backoff=True, max_retries=5)
def notify_master_telegram(envelope: dict[str, Any]) -> None:
    payload = envelope["payload"]
    messages = [
        (master_id, text)
        for master_id, text in _master_messages(envelope["event_type"], payload)
        if master_id != payload.get("actor_id")
    ]
    if not messages:
        return

    with db.master_session() as session:
        chats = dict(
            session.execute(
                select(Master.id, Master.telegram_user_id).where(
                    Master.id.in_([UUID(m) for m, _ in messages]),
                    Master.is_active.is_(True),
                    Master.telegram_user_id.is_not(None),
                )
            ).all()
        )
    salon = _salon_name(UUID(envelope["salon_id"]))
    for master_id, text in messages:
        chat_id = chats.get(UUID(master_id))
        if chat_id is None:
            logger.info("Мастер %s без Telegram — уведомление пропущено", master_id)
            continue
        if not _first_delivery(envelope["event_id"], f"master_tg:{master_id}"):
            continue
        telegram.send_message(chat_id, f"{text}\nСалон: {_esc(salon)}" if salon else text)


@celery.task(autoretry_for=(httpx.HTTPError,), retry_backoff=True, max_retries=5)
def notify_client_telegram(envelope: dict[str, Any]) -> None:
    """Напоминание клиенту о визите."""
    if not _first_delivery(envelope["event_id"], "client_tg"):
        return
    payload = envelope["payload"]

    with db.master_session() as session:
        chat_id = session.scalar(
            select(Client.telegram_user_id).where(Client.id == UUID(payload["client_id"]))
        )
        salon = session.get(Salon, UUID(envelope["salon_id"]))
    if chat_id is None:
        logger.info("Клиент %s без Telegram — напоминание пропущено", payload["client_id"])
        return

    lines = [
        "⏰ <b>Нагадування про візит</b>",
        f"Через 30 хвилин: {_when(payload.get('start_at'))}",
        f"Майстер: {_esc(payload.get('master_name'))}",
        f"Послуги: {_esc(payload.get('service_name'))}",
    ]
    if salon is not None:
        lines.append(f"Салон: {_esc(salon.name)}")
        booking_url = get_settings().booking_url(salon.slug)
        lines.append(f'Записатися знову: <a href="{html.escape(booking_url)}">сайт запису</a>')
    telegram.send_message(chat_id, "\n".join(lines))


@celery.task(autoretry_for=(httpx.HTTPError,), retry_backoff=True, max_retries=5)
def notify_client_review(envelope: dict[str, Any]) -> None:
    """После завершения визита — клиенту ссылка на отзыв.

    Токен в outbox не кладётся (событие уходит и в WebSocket админки) —
    читается из записи. Отзыв уже оставлен (токена нет) — не отправляем.
    """
    if not _first_delivery(envelope["event_id"], "client_review"):
        return
    salon_id = UUID(envelope["salon_id"])
    payload = envelope["payload"]

    with db.shard_session(salon_id) as session:
        record = session.get(Record, UUID(payload["record_id"]))
        if record is None or record.status != RecordStatus.COMPLETED or not record.review_token:
            return
        token = str(record.review_token)
        master_name = record.master_name
        services = ", ".join(s.name for s in record.services)
        client_id = record.client_id
    with db.master_session() as session:
        chat_id = session.scalar(select(Client.telegram_user_id).where(Client.id == client_id))
        salon = session.get(Salon, salon_id)
    if chat_id is None or salon is None:
        logger.info("Клиент %s без Telegram — ссылка на отзыв не отправлена", client_id)
        return

    link = get_settings().review_url(salon.slug, token)
    telegram.send_message(
        chat_id,
        "\n".join(
            [
                "💐 <b>Дякуємо за візит!</b>",
                f"Майстер: {_esc(master_name)}",
                f"Послуги: {_esc(services)}",
                f"Салон: {_esc(salon.name)}",
                f'Будемо вдячні за відгук: <a href="{html.escape(link)}">оцінити візит</a>',
            ]
        ),
    )


MAX_SHIFT_LINES = 31


@celery.task(autoretry_for=(httpx.HTTPError,), retry_backoff=True, max_retries=5)
def notify_shift_telegram(envelope: dict[str, Any]) -> None:
    """Мастеру — сводка изменений его смен (поставил или изменил не он сам)."""
    payload = envelope["payload"]
    if not payload.get("notify") or not _first_delivery(envelope["event_id"], "shift_tg"):
        return
    with db.master_session() as session:
        chat_id = session.scalar(
            select(Master.telegram_user_id).where(
                Master.id == UUID(payload["staff_id"]), Master.is_active.is_(True)
            )
        )
    if chat_id is None:
        return
    salon = _salon_name(UUID(envelope["salon_id"]))
    changes = payload.get("changes") or []
    lines = ["🗓 <b>Ваш графік змінено</b>"]
    for change in changes[:MAX_SHIFT_LINES]:
        day = datetime.fromisoformat(change["date"]).strftime("%d.%m")
        lines.append(f"{day}: {_esc(change['value'] or 'вихідний')}")
    if len(changes) > MAX_SHIFT_LINES:
        lines.append(f"…і ще {len(changes) - MAX_SHIFT_LINES} дн.")
    if salon:
        lines.append(f"Салон: {_esc(salon)}")
    telegram.send_message(chat_id, "\n".join(lines))


@celery.task
def notify_web(envelope: dict[str, Any]) -> None:
    if not _first_delivery(envelope["event_id"], "web"):
        return
    channel = f"salon:{envelope['salon_id']}:events"
    with contextlib.suppress(redis_sync.RedisError):
        db.redis_client.publish(channel, json.dumps(envelope, ensure_ascii=False))
