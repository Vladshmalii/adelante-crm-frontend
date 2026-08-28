import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import DateTime, Index, String, Uuid, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import ShardBase


class OutboxEvent(ShardBase):
    """Транзакционный outbox: событие пишется в одной транзакции с бизнес-данными,
    публикуется периодической задачей publish_outbox (FOR UPDATE SKIP LOCKED).
    Гарантия «записалось в БД ⇒ уведомление уйдёт», at-least-once.
    """

    __tablename__ = "outbox"
    __table_args__ = (Index("ix_outbox_unpublished", "published_at", "created_at"),)

    event_id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    event_type: Mapped[str] = mapped_column(String(64))
    payload: Mapped[dict[str, Any]] = mapped_column(JSONB)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
