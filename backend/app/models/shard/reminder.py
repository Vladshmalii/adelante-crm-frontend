import enum
import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, Index, Numeric, String, UniqueConstraint, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import ShardBase, str_enum


class DeliveryChannel(enum.StrEnum):
    TELEGRAM = "telegram"
    SMS = "sms"


class ReminderDeliveryStatus(enum.StrEnum):
    QUEUED = "queued"  # строка создана, отправка ещё не завершилась
    SENT = "sent"  # провайдер принял; для Telegram — финальный статус
    DELIVERED = "delivered"
    UNDELIVERED = "undelivered"
    FAILED = "failed"  # ошибка отправки (постоянная или повторы исчерпаны)
    SKIPPED = "skipped"  # не отправляли: нет или неверный номер, причина в error


class ReminderDelivery(ShardBase):
    """Журнал отправок напоминаний (backend/docs/sms-reminders.md, раздел 7.2).

    Одна строка — одна попытка доставки напоминания в канал. Уникальность
    (event_id, channel) гарантирует одно SMS на напоминание даже при повторном
    прогоне задачи. client_id — ссылка на Master DB без FK.
    """

    __tablename__ = "reminder_deliveries"
    __table_args__ = (
        UniqueConstraint("event_id", "channel", name="uq_reminder_deliveries_event_channel"),
        Index("ix_reminder_deliveries_client", "client_id", "created_at"),
        Index("ix_reminder_deliveries_created", "created_at"),
        Index("ix_reminder_deliveries_status", "channel", "status", "created_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    record_id: Mapped[uuid.UUID] = mapped_column(Uuid)
    client_id: Mapped[uuid.UUID] = mapped_column(Uuid)
    event_id: Mapped[uuid.UUID] = mapped_column(Uuid)

    channel: Mapped[DeliveryChannel] = mapped_column(str_enum(DeliveryChannel, 16))
    # SMS после неудачи Telegram
    is_fallback: Mapped[bool] = mapped_column(default=False, server_default="false")
    phone: Mapped[str | None] = mapped_column(String(32))
    text: Mapped[str | None] = mapped_column(String(1024))

    status: Mapped[ReminderDeliveryStatus] = mapped_column(str_enum(ReminderDeliveryStatus, 16))
    provider: Mapped[str | None] = mapped_column(String(32))
    provider_message_id: Mapped[str | None] = mapped_column(String(64), index=True)
    segments: Mapped[int | None]
    cost: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    error: Mapped[str | None] = mapped_column(String(500))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
