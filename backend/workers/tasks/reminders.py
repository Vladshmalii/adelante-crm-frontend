"""Time-triggered уведомления: напоминание клиенту за 30 минут до записи.

Celery Beat раз в минуту запускает диспетчер scan_upcoming_records — он ходит
только в Master DB и делает fan-out scan_shard по каждому активному салону
(изоляция сбоев: недоступный шард не валит обход остальных).

Ровно одно напоминание гарантируют: окно с перекрытием (margin больше
интервала beat), флаг reminder_sent_at, FOR UPDATE SKIP LOCKED и дедуп
по event_id на стороне отправителя.
"""

import logging
from datetime import UTC, datetime, timedelta
from uuid import UUID

from sqlalchemy import select

from app.models.shard import Record, RecordStatus
from app.notifications.outbox import RECORD_REMINDER, build_envelope
from workers import db
from workers.celery_app import celery
from workers.tasks import notify

logger = logging.getLogger(__name__)

REMINDER_LEAD = timedelta(minutes=30)
# Больше интервала beat (60с): пропущенный тик не означает пропущенное напоминание
WINDOW_MARGIN = timedelta(seconds=90)


@celery.task
def scan_upcoming_records() -> None:
    for salon_id in db.list_active_salon_ids():
        scan_shard.delay(str(salon_id))


@celery.task
def scan_shard(salon_id: str) -> None:
    sid = UUID(salon_id)
    now = datetime.now(UTC)
    window_start = now + REMINDER_LEAD
    window_end = window_start + WINDOW_MARGIN

    envelopes = []
    with db.shard_session(sid) as session:
        records = list(
            session.scalars(
                select(Record)
                .where(
                    Record.status == RecordStatus.SCHEDULED,
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
                    "master_name": record.master_name,
                    "start_at": record.start_at.isoformat(),
                },
            )
            envelopes.append(envelope)
        session.commit()

    # Диспатч после commit: упавший до commit процесс не пометит записи,
    # следующий тик подберёт их снова (at-least-once + дедуп по event_id)
    for envelope in envelopes:
        notify.notify_client_telegram.delay(envelope)
