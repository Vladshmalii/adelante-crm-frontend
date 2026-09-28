"""Публикация транзакционного outbox.

Каждые 10 секунд обходит шарды по реестру, забирает неопубликованные события
(FOR UPDATE SKIP LOCKED — параллельные прогоны не мешают друг другу) и
диспатчит fan-out: уведомления администраторам и мастерам в Telegram +
push в админку (WebSocket).
"""

import logging
from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import select

from app.models.shard import OutboxEvent
from app.notifications.outbox import RECORD_CREATED, RECORD_UPDATED, REVIEW_CREATED
from workers import db
from workers.celery_app import celery
from workers.tasks import notify

logger = logging.getLogger(__name__)

BATCH_SIZE = 200


@celery.task
def publish_outbox() -> None:
    for salon_id in db.list_active_salon_ids():
        try:
            _publish_salon(salon_id)
        except Exception:
            # Недоступный шард не должен останавливать обход остальных
            logger.exception("publish_outbox: сбой на салоне %s", salon_id)


def _publish_salon(salon_id: UUID) -> None:
    with db.shard_session(salon_id) as session:
        events = list(
            session.scalars(
                select(OutboxEvent)
                .where(OutboxEvent.published_at.is_(None))
                .order_by(OutboxEvent.created_at)
                .limit(BATCH_SIZE)
                .with_for_update(skip_locked=True)
            )
        )
        for event in events:
            envelope = event.payload
            if event.event_type in (RECORD_CREATED, RECORD_UPDATED):
                payload = envelope["payload"]
                if notify.wants_manager_notification(event.event_type, payload):
                    notify.notify_manager_telegram.delay(envelope)
                if notify.wants_master_notification(event.event_type, payload):
                    notify.notify_master_telegram.delay(envelope)
                if notify.wants_review_request(event.event_type, payload):
                    notify.notify_client_review.delay(envelope)
                notify.notify_web.delay(envelope)
            elif event.event_type == REVIEW_CREATED:
                notify.notify_web.delay(envelope)
            else:
                logger.warning("Неизвестный тип события в outbox: %s", event.event_type)
            event.published_at = datetime.now(UTC)
        session.commit()
