"""Time-triggered уведомления: напоминание клиенту за N минут до записи.

N — настройка салона reminder_lead_minutes (по умолчанию 30, «Налаштування»,
backend/docs/sms-reminders.md, раздел 4); сканер читает её каждый тик, так что
изменение действует на ещё не отправленные напоминания. Запись, созданная
позже момента напоминания, его не получает.

Celery Beat раз в минуту запускает диспетчер scan_upcoming_records — он ходит
только в Master DB и делает fan-out scan_shard по каждому активному салону
(изоляция сбоев: недоступный шард не валит обход остальных).

Ровно одно напоминание гарантируют: окно с перекрытием (margin больше
интервала beat), флаг reminder_sent_at, FOR UPDATE SKIP LOCKED и дедуп
по event_id на стороне отправителя.

Статусы доставки SMS (backend/docs/sms-reminders.md, раздел 7.2) — опросом
провайдера: poll_sms_statuses раз в 5 минут делает fan-out poll_shard_sms, тот
спрашивает статусы строк журнала в sent младше суток. Вебхук TurboSMS не
выбран: он настраивается один на кабинет, без callback-URL на сообщение, —
салон по нему не найти без отдельного глобального индекса message_id → салон.
Строки без финального статуса через сутки остаются sent.
"""

import logging
from datetime import UTC, datetime, timedelta
from uuid import UUID

from sqlalchemy import select

from app.models.shard import (
    DeliveryChannel,
    Record,
    RecordStatus,
    ReminderDelivery,
    ReminderDeliveryStatus,
)
from app.notifications.outbox import RECORD_REMINDER, build_envelope
from app.notifications.sms import DeliveryStatus, SmsError, get_provider
from app.services.salon_settings import load_notifications_sync
from workers import db
from workers.celery_app import celery
from workers.tasks import reminder_delivery

logger = logging.getLogger(__name__)

# Больше интервала beat (60с): пропущенный тик не означает пропущенное напоминание
WINDOW_MARGIN = timedelta(seconds=90)
# Опрос статусов SMS: только свежие отправки, финальный статус приходит за минуты
STATUS_POLL_AGE = timedelta(days=1)
STATUS_POLL_LIMIT = 1000


@celery.task
def scan_upcoming_records() -> None:
    for salon_id in db.list_active_salon_ids():
        scan_shard.delay(str(salon_id))


@celery.task
def scan_shard(salon_id: str) -> None:
    sid = UUID(salon_id)
    now = datetime.now(UTC)

    envelopes = []
    with db.shard_session(sid) as session:
        lead = timedelta(minutes=load_notifications_sync(session).reminder_lead_minutes)
        window_start = now + lead
        window_end = window_start + WINDOW_MARGIN
        records = list(
            session.scalars(
                select(Record)
                .where(
                    Record.status.in_([RecordStatus.SCHEDULED, RecordStatus.CONFIRMED]),
                    Record.reminder_enabled.is_(True),
                    Record.reminder_sent_at.is_(None),
                    Record.start_at >= window_start - WINDOW_MARGIN,
                    Record.start_at < window_end,
                )
                .with_for_update(skip_locked=True)
            )
        )
        for record in records:
            record.reminder_sent_at = now
            _, envelope = build_envelope(
                RECORD_REMINDER,
                sid,
                {
                    "record_id": str(record.id),
                    "client_id": str(record.client_id),
                    "client_name": record.client_name,
                    "master_id": str(record.master_id) if record.master_id else None,
                    "master_name": record.master_name,
                    "service_name": ", ".join(s.name for s in record.services),
                    "start_at": record.start_at.isoformat(),
                },
            )
            envelopes.append(envelope)
        session.commit()

    # Диспатч после commit: упавший до commit процесс не пометит записи,
    # следующий тик подберёт их снова (at-least-once + дедуп по event_id)
    for envelope in envelopes:
        reminder_delivery.deliver_reminder.delay(envelope)


# --- Статусы доставки SMS -------------------------------------------------------

_FINAL = {
    DeliveryStatus.DELIVERED: ReminderDeliveryStatus.DELIVERED,
    DeliveryStatus.UNDELIVERED: ReminderDeliveryStatus.UNDELIVERED,
}


@celery.task
def poll_sms_statuses() -> None:
    for salon_id in db.list_active_salon_ids():
        poll_shard_sms.delay(str(salon_id))


@celery.task
def poll_shard_sms(salon_id: str) -> None:
    """Обновляет sent → delivered | undelivered; неизвестные провайдеру id пропускаются."""
    provider = get_provider()
    since = datetime.now(UTC) - STATUS_POLL_AGE
    with db.shard_session(UUID(salon_id)) as session:
        rows = list(
            session.scalars(
                select(ReminderDelivery)
                .where(
                    ReminderDelivery.channel == DeliveryChannel.SMS,
                    ReminderDelivery.status == ReminderDeliveryStatus.SENT,
                    ReminderDelivery.provider == provider.name,
                    ReminderDelivery.provider_message_id.is_not(None),
                    ReminderDelivery.created_at >= since,
                )
                .order_by(ReminderDelivery.created_at)
                .limit(STATUS_POLL_LIMIT)
            )
        )
        if not rows:
            return
        try:
            statuses = provider.fetch_status(
                [r.provider_message_id for r in rows if r.provider_message_id]
            )
        except SmsError as exc:
            # Следующий тик спросит снова
            logger.warning("Салон %s: статуси SMS не отримано — %s", salon_id, exc)
            return
        updated = 0
        for row in rows:
            status = statuses.get(row.provider_message_id or "")
            final = _FINAL.get(status) if status is not None else None
            if final is not None:
                row.status = final
                updated += 1
        session.commit()
    if updated:
        logger.info("Салон %s: оновлено статусів SMS — %s", salon_id, updated)
