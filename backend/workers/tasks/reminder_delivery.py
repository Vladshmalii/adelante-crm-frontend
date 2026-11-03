"""Доставка напоминания о визите: Telegram или SMS (backend/docs/sms-reminders.md, раздел 7).

Канал выбирается по предпочтению клиента (раздел 3):

| reminder_channel | есть Telegram              | нет Telegram    |
|------------------|----------------------------|-----------------|
| auto, telegram   | Telegram, при неудаче → SMS | SMS             |
| sms              | SMS                        | SMS             |
| none             | не отправляем              | не отправляем   |

Неудача Telegram — постоянная ошибка 4xx (бот заблокирован, чат не найден) или
исчерпанные повторы временных сбоев (сеть, 429, 5xx): тогда сразу SMS.

Каждая попытка в канал — строка журнала reminder_deliveries в шарде салона,
уникальная по (event_id, channel): одно SMS на напоминание даже при повторном
прогоне. Перед вставкой — ещё и SETNX в Redis (sent:{event_id}:client_tg / :sms).
Строка SMS создаётся в статусе queued, отправку делает send_reminder_sms с
собственными повторами; TurboSMS дополнительно дедуплицирует по sequence_id
(= event_id), так что повтор после таймаута не даёт второго SMS.
"""

import html
import logging
import uuid
from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

from celery import Task
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models.master import Client, ReminderChannel, Salon
from app.models.shard import DeliveryChannel, ReminderDelivery, ReminderDeliveryStatus
from app.notifications.sms import SmsPermanentError, SmsTemporaryError, get_provider
from app.notifications.sms.text import reminder_text, skip_reason, sms_phone, visit_when
from workers import db, telegram
from workers.celery_app import celery
from workers.tasks.notify import _esc, _first_delivery

logger = logging.getLogger(__name__)

MAX_RETRIES = 5
# Напоминание привязано ко времени визита: повторы укладываются в ~5 минут
RETRY_BASE_SECONDS = 10
RETRY_MAX_SECONDS = 120
ERROR_MAX = 500


def _countdown(retries: int) -> int:
    return int(min(RETRY_BASE_SECONDS * 2**retries, RETRY_MAX_SECONDS))


def choose_channel(preference: ReminderChannel, has_telegram: bool) -> DeliveryChannel | None:
    """Первый канал напоминания; None — клиент отказался от напоминаний."""
    if preference == ReminderChannel.NONE:
        return None
    if preference == ReminderChannel.SMS or not has_telegram:
        return DeliveryChannel.SMS
    return DeliveryChannel.TELEGRAM


@dataclass
class _Target:
    client_id: UUID
    telegram_user_id: int | None
    phone: str | None
    preference: ReminderChannel
    salon_name: str | None
    salon_slug: str | None


def _load_target(salon_id: UUID, client_id: UUID) -> _Target | None:
    with db.master_session() as session:
        client = session.get(Client, client_id)
        salon = session.get(Salon, salon_id)
        if client is None or not client.is_active:
            return None
        return _Target(
            client_id=client.id,
            telegram_user_id=client.telegram_user_id,
            phone=client.phone,
            preference=client.reminder_channel,
            salon_name=salon.name if salon else None,
            salon_slug=salon.slug if salon else None,
        )


def _claim(session: Session, values: dict[str, Any]) -> UUID | None:
    """Вставка строки журнала; None — по (event_id, channel) строка уже есть."""
    statement = (
        insert(ReminderDelivery)
        .values(id=uuid.uuid4(), **values)
        .on_conflict_do_nothing(constraint="uq_reminder_deliveries_event_channel")
        .returning(ReminderDelivery.id)
    )
    return session.scalar(statement)


def _finish(row: ReminderDelivery, status: ReminderDeliveryStatus, error: str | None) -> None:
    row.status = status
    row.error = error[:ERROR_MAX] if error else None


# --- Telegram -----------------------------------------------------------------


def _telegram_text(payload: dict[str, Any], target: _Target) -> str:
    lines = [
        "⏰ <b>Нагадування про візит</b>",
        visit_when(datetime.fromisoformat(payload["start_at"])),
        f"Майстер: {_esc(payload.get('master_name'))}",
        f"Послуги: {_esc(payload.get('service_name'))}",
    ]
    if target.salon_name is not None and target.salon_slug is not None:
        lines.append(f"Салон: {_esc(target.salon_name)}")
        booking_url = get_settings().booking_url(target.salon_slug)
        lines.append(f'Записатися знову: <a href="{html.escape(booking_url)}">сайт запису</a>')
    return "\n".join(lines)


def _telegram_row(
    salon_id: UUID, envelope: dict[str, Any], target: _Target
) -> ReminderDeliveryStatus | None:
    """Строка Telegram в журнале: создаёт queued или возвращает статус существующей."""
    payload = envelope["payload"]
    with db.shard_session(salon_id) as session:
        created = _claim(
            session,
            {
                "record_id": UUID(payload["record_id"]),
                "client_id": target.client_id,
                "event_id": UUID(envelope["event_id"]),
                "channel": DeliveryChannel.TELEGRAM,
                "status": ReminderDeliveryStatus.QUEUED,
                "provider": "telegram",
            },
        )
        session.commit()
        if created is not None:
            return None
        return session.scalar(
            select(ReminderDelivery.status).where(
                ReminderDelivery.event_id == UUID(envelope["event_id"]),
                ReminderDelivery.channel == DeliveryChannel.TELEGRAM,
            )
        )


def _set_telegram_status(
    salon_id: UUID, event_id: str, status: ReminderDeliveryStatus, error: str | None = None
) -> None:
    with db.shard_session(salon_id) as session:
        row = session.scalar(
            select(ReminderDelivery).where(
                ReminderDelivery.event_id == UUID(event_id),
                ReminderDelivery.channel == DeliveryChannel.TELEGRAM,
            )
        )
        if row is not None:
            _finish(row, status, error)
            session.commit()


# --- SMS ----------------------------------------------------------------------


def _queue_sms(
    salon_id: UUID, envelope: dict[str, Any], target: _Target, *, is_fallback: bool
) -> None:
    """Строка SMS в журнале (одна на напоминание) и задача отправки."""
    event_id = envelope["event_id"]
    if not _first_delivery(event_id, "sms"):
        return
    payload = envelope["payload"]
    phone = sms_phone(target.phone)
    text = reminder_text(datetime.fromisoformat(payload["start_at"]), target.salon_name)
    provider = get_provider()
    values: dict[str, Any] = {
        "record_id": UUID(payload["record_id"]),
        "client_id": target.client_id,
        "event_id": UUID(event_id),
        "channel": DeliveryChannel.SMS,
        "is_fallback": is_fallback,
        "phone": phone or (target.phone or None),
        "text": text,
        "provider": provider.name,
    }
    if phone is None:
        values.update(status=ReminderDeliveryStatus.SKIPPED, error=skip_reason(target.phone))
    else:
        values["status"] = ReminderDeliveryStatus.QUEUED

    with db.shard_session(salon_id) as session:
        delivery_id = _claim(session, values)
        session.commit()
    if delivery_id is None:
        logger.info("Напоминание %s: SMS уже в журнале — пропущено", event_id)
        return
    if phone is None:
        logger.info("Клиент %s: SMS не отправлено — %s", target.client_id, values["error"])
        return
    send_reminder_sms.delay(str(salon_id), str(delivery_id))


@celery.task(bind=True, max_retries=MAX_RETRIES)
def send_reminder_sms(self: Task, salon_id: str, delivery_id: str) -> None:
    """Отправка SMS по строке журнала в статусе queued.

    Временная ошибка — повтор с backoff; постоянная или исчерпанные повторы — failed.
    Строка блокируется на время отправки: параллельный дубль задачи её пропустит.
    """
    sid = UUID(salon_id)
    settings = get_settings()
    with db.shard_session(sid) as session:
        row = session.scalar(
            select(ReminderDelivery)
            .where(ReminderDelivery.id == UUID(delivery_id))
            .with_for_update(skip_locked=True)
        )
        if row is None or row.status != ReminderDeliveryStatus.QUEUED or not row.phone:
            return
        provider = get_provider()
        try:
            result = provider.send(row.phone, row.text or "", str(row.event_id))
        except SmsPermanentError as exc:
            _finish(row, ReminderDeliveryStatus.FAILED, str(exc))
            session.commit()
            logger.warning("SMS %s не відправлено: %s", delivery_id, exc)
            return
        except SmsTemporaryError as exc:
            if self.request.retries >= self.max_retries:
                _finish(row, ReminderDeliveryStatus.FAILED, f"{exc} (повтори вичерпано)")
                session.commit()
                logger.warning("SMS %s: повтори вичерпано — %s", delivery_id, exc)
                return
            row.error = str(exc)[:ERROR_MAX]
            session.commit()
            raise self.retry(countdown=_countdown(self.request.retries)) from None

        row.provider = provider.name
        row.provider_message_id = result.provider_message_id
        row.segments = result.segments
        row.cost = (
            result.cost
            if result.cost is not None
            else (Decimal(result.segments) * settings.sms_price_uah).quantize(Decimal("0.01"))
        )
        _finish(row, ReminderDeliveryStatus.SENT, None)
        session.commit()


# --- Точка входа --------------------------------------------------------------


@celery.task(bind=True, max_retries=MAX_RETRIES)
def deliver_reminder(self: Task, envelope: dict[str, Any]) -> None:
    """Напоминание клиенту о визите (конверт record.reminder от сканера)."""
    salon_id = UUID(envelope["salon_id"])
    payload = envelope["payload"]
    event_id = envelope["event_id"]

    target = _load_target(salon_id, UUID(payload["client_id"]))
    if target is None:
        logger.info("Напоминание %s: клиента %s нет — пропущено", event_id, payload["client_id"])
        return
    channel = choose_channel(target.preference, target.telegram_user_id is not None)
    if channel is None:
        logger.info("Клиент %s отказался от напоминаний", target.client_id)
        return
    if channel == DeliveryChannel.SMS:
        _queue_sms(salon_id, envelope, target, is_fallback=False)
        return

    assert target.telegram_user_id is not None
    # Повтор этой же задачи (retries > 0) дедуп уже прошёл
    if self.request.retries == 0 and not _first_delivery(event_id, "client_tg"):
        return
    existing = _telegram_row(salon_id, envelope, target)
    if existing is not None and existing != ReminderDeliveryStatus.QUEUED:
        return

    try:
        result = telegram.deliver(target.telegram_user_id, _telegram_text(payload, target))
    except telegram.TelegramTemporaryError as exc:
        if self.request.retries < self.max_retries:
            raise self.retry(countdown=_countdown(self.request.retries)) from None
        _set_telegram_status(
            salon_id, event_id, ReminderDeliveryStatus.FAILED, f"{exc} (повтори вичерпано)"
        )
        _queue_sms(salon_id, envelope, target, is_fallback=True)
        return

    if result.ok:
        _set_telegram_status(salon_id, event_id, ReminderDeliveryStatus.SENT)
        return
    logger.warning(
        "Telegram не доставив нагадування клієнту %s: %s", target.client_id, result.error
    )
    _set_telegram_status(salon_id, event_id, ReminderDeliveryStatus.FAILED, result.error)
    _queue_sms(salon_id, envelope, target, is_fallback=True)
