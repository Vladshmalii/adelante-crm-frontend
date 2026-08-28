"""Запись событий в транзакционный outbox шард-БД.

Конверт события (payload колонки outbox.payload):
{event_id, event_type, occurred_at, salon_id, payload} — event_id служит
ключом дедупликации у отправителей (гарантия доставки at-least-once).
"""

import uuid
from datetime import UTC, datetime
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.shard import OutboxEvent

RECORD_CREATED = "record.created"
RECORD_UPDATED = "record.updated"
RECORD_REMINDER = "record.reminder"
REVIEW_CREATED = "review.created"


def build_envelope(
    event_type: str, salon_id: uuid.UUID, payload: dict[str, Any]
) -> tuple[uuid.UUID, dict[str, Any]]:
    event_id = uuid.uuid4()
    envelope = {
        "event_id": str(event_id),
        "event_type": event_type,
        "occurred_at": datetime.now(UTC).isoformat(),
        "salon_id": str(salon_id),
        "payload": payload,
    }
    return event_id, envelope


def add_outbox_event(
    session: AsyncSession,
    *,
    event_type: str,
    salon_id: uuid.UUID,
    payload: dict[str, Any],
) -> OutboxEvent:
    """Добавляет событие в текущую (ещё не закоммиченную) транзакцию шард-сессии."""
    event_id, envelope = build_envelope(event_type, salon_id, payload)
    event = OutboxEvent(event_id=event_id, event_type=event_type, payload=envelope)
    session.add(event)
    return event
