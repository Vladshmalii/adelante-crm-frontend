"""Публикация транзакционного outbox.

Каждые 10 секунд обходит шарды по реестру, забирает неопубликованные события
(FOR UPDATE SKIP LOCKED — параллельные прогоны не мешают друг другу) и
диспатчит fan-out: уведомление менеджеру в Telegram + push на сайт.
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
            if event.event_type == RECORD_CREATED:
                notify.notify_manager_telegram.delay(event.payload)
                notify.notify_web.delay(event.payload)
            elif event.event_type in (RECORD_UPDATED, REVIEW_CREATED):
                notify.notify_web.delay(event.payload)
            else:
                logger.warning("Неизвестный тип события в outbox: %s", event.event_type)
            event.published_at = datetime.now(UTC)
        session.commit()
