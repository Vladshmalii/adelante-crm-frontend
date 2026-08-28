import enum
import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import DateTime, Index, String, Uuid, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import ShardBase, str_enum


class AuditAction(enum.StrEnum):
    CREATED = "created"
    UPDATED = "updated"
    DELETED = "deleted"


class AuditLog(ShardBase):
    """Лента изменений салона: вкладка «Изменения» на overview и history[]
    в карточке записи. Пишется сервис-слоем при каждой мутации.
    """

    __tablename__ = "audit_log"
    __table_args__ = (
        Index("ix_audit_entity", "entity", "entity_id"),
        Index("ix_audit_created", "created_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)

    # client | record | service | staff | finance
    entity: Mapped[str] = mapped_column(String(32))
    entity_id: Mapped[str] = mapped_column(String(64))
    entity_name: Mapped[str] = mapped_column(String(255))

    action: Mapped[AuditAction] = mapped_column(str_enum(AuditAction, 16))
    author_id: Mapped[uuid.UUID | None] = mapped_column(Uuid)
    author_name: Mapped[str | None] = mapped_column(String(255))
    # Диф изменённых полей: {"field": ["старое", "новое"]}
    details: Mapped[dict[str, Any] | None] = mapped_column(JSONB)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
