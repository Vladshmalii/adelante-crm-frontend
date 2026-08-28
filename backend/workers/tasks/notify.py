"""Задачи-отправители (очередь `notifications`).

Дедупликация: доставка at-least-once, поэтому перед отправкой — SETNX по
(event_id, канал); повторный прогон outbox/сканера не даёт дубль получателю.
"""

import contextlib
import json
import logging
from typing import Any
from uuid import UUID

import httpx
import redis as redis_sync
from sqlalchemy import select

from app.models.master import Administrator, Client, administrator_salons
from workers import db, telegram
from workers.celery_app import celery

logger = logging.getLogger(__name__)

DEDUPE_TTL = 86400


def _first_delivery(event_id: str, channel: str) -> bool:
    """True, если событие в этот канал ещё не отправлялось."""
    try:
        return bool(db.redis_client.set(f"sent:{event_id}:{channel}", "1", nx=True, ex=DEDUPE_TTL))
    except redis_sync.RedisError:
        # Redis недоступен — лучше рискнуть дублем, чем потерять уведомление
        return True


@celery.task(autoretry_for=(httpx.HTTPError,), retry_backoff=True, max_retries=5)
def notify_manager_telegram(envelope: dict[str, Any]) -> None:
    if not _first_delivery(envelope["event_id"], "manager_tg"):
        return
    salon_id = UUID(envelope["salon_id"])
    payload = envelope["payload"]

    with db.master_session() as session:
        chat_ids = list(
            session.scalars(
                select(Administrator.telegram_user_id)
                .join(
                    administrator_salons,
                    administrator_salons.c.administrator_id == Administrator.id,
                )
                .where(
                    administrator_salons.c.salon_id == salon_id,
                    Administrator.is_active.is_(True),
                    Administrator.telegram_user_id.is_not(None),
                )
            )
        )
    if not chat_ids:
        logger.info("Салон %s: нет администраторов с Telegram — уведомление пропущено", salon_id)
        return

    text = (
        "🗓 <b>Новая запись</b>\n"
        f"Клиент: {payload['client_name']}\n"
        f"Мастер: {payload['master_name']}\n"
        f"Услуга: {payload['service_name']}\n"
        f"Время: {payload['start_at']}"
    )
    for chat_id in chat_ids:
        if chat_id is None:
            continue
        telegram.send_message(chat_id, text)


@celery.task(autoretry_for=(httpx.HTTPError,), retry_backoff=True, max_retries=5)
def notify_client_telegram(envelope: dict[str, Any]) -> None:
    if not _first_delivery(envelope["event_id"], "client_tg"):
        return
    payload = envelope["payload"]

    with db.master_session() as session:
        chat_id = session.scalar(
            select(Client.telegram_user_id).where(Client.id == UUID(payload["client_id"]))
        )
    if chat_id is None:
        logger.info("Клиент %s без Telegram — напоминание пропущено", payload["client_id"])
        return

    telegram.send_message(
        chat_id,
        "⏰ <b>Напоминание</b>\n"
        f"Через 30 минут запись к мастеру {payload['master_name']}.\n"
        f"Начало: {payload['start_at']}",
    )


@celery.task
def notify_web(envelope: dict[str, Any]) -> None:
    if not _first_delivery(envelope["event_id"], "web"):
        return
    channel = f"salon:{envelope['salon_id']}:events"
    with contextlib.suppress(redis_sync.RedisError):
        db.redis_client.publish(channel, json.dumps(envelope, ensure_ascii=False))
