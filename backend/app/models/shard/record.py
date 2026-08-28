import enum
import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Index, Numeric, String, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import ShardBase, str_enum


class RecordStatus(enum.StrEnum):
    SCHEDULED = "scheduled"
    CONFIRMED = "confirmed"
    ARRIVED = "arrived"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"


class RecordSource(enum.StrEnum):
    ADMIN = "admin"
    BOOKING = "booking"
    BOT = "bot"
    PHONE = "phone"
    WALK_IN = "walk_in"


class PaymentStatus(enum.StrEnum):
    UNPAID = "unpaid"
    PARTIAL = "partial"
    PAID = "paid"


class RecordImportance(enum.StrEnum):
    STANDARD = "standard"
    IMPORTANT = "important"
    SPECIAL = "special"


class Record(ShardBase):
    """Запись клиента к мастеру.

    master_id / client_id ссылаются на Master DB (FK между базами невозможен —
    валидация в сервис-слое). Снапшот-поля копируются при создании, чтобы
    история читалась без cross-DB JOIN.

    Уникального индекса на (master_id, start_at) сознательно НЕТ: из админки
    допустимы две записи на одно время; занятость слота для публичного сайта
    проверяется в сервис-слое под advisory lock.
    """

    __tablename__ = "records"
    __table_args__ = (
        Index("ix_records_master_start", "master_id", "start_at"),
        Index("ix_records_reminder_scan", "start_at", "reminder_sent_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    client_id: Mapped[uuid.UUID] = mapped_column(Uuid, index=True)
    master_id: Mapped[uuid.UUID] = mapped_column(Uuid)
    service_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("services.id"))

    start_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    end_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    # Фактическое время визита (аудит на вкладке «Записи»)
    actual_start_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    actual_end_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    status: Mapped[RecordStatus] = mapped_column(
        str_enum(RecordStatus, 16), default=RecordStatus.SCHEDULED
    )
    source: Mapped[RecordSource] = mapped_column(str_enum(RecordSource, 16))
    payment_status: Mapped[PaymentStatus] = mapped_column(
        str_enum(PaymentStatus, 16), default=PaymentStatus.UNPAID
    )
    importance: Mapped[RecordImportance] = mapped_column(
        str_enum(RecordImportance, 16),
        default=RecordImportance.STANDARD,
    )

    # Снапшот цены на момент записи: price — базовая цена услуги,
    # total_amount — итог со скидками (при создании равны)
    price: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal(0))
    total_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal(0))

    # Денормализованный снапшот из Master DB на момент создания
    client_name: Mapped[str] = mapped_column(String(255))
    client_phone: Mapped[str] = mapped_column(String(32))
    master_name: Mapped[str] = mapped_column(String(255))

    # «Запись для другого человека» (форма календаря)
    visitor_name: Mapped[str | None] = mapped_column(String(255))
    visitor_phone: Mapped[str | None] = mapped_column(String(32))

    comment: Mapped[str | None] = mapped_column(String(2000))
    internal_notes: Mapped[str | None] = mapped_column(String(4000))

    created_by: Mapped[uuid.UUID | None] = mapped_column(Uuid)
    created_by_name: Mapped[str | None] = mapped_column(String(255))
    closed_by: Mapped[uuid.UUID | None] = mapped_column(Uuid)
    closed_by_name: Mapped[str | None] = mapped_column(String(255))
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Одноразовый токен для отзыва — выдаётся клиенту при завершении визита
    review_token: Mapped[uuid.UUID | None] = mapped_column(Uuid, unique=True)

    reminder_sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    photos: Mapped[list["RecordPhoto"]] = relationship(
        back_populates="record", cascade="all, delete-orphan", lazy="selectin"
    )


class RecordPhoto(ShardBase):
    """Фото визита — загружаются в модалке завершения, видны в истории клиента."""

    __tablename__ = "record_photos"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    record_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("records.id"), index=True)
    url: Mapped[str] = mapped_column(String(1024))
    uploaded_by: Mapped[uuid.UUID | None] = mapped_column(Uuid)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    record: Mapped[Record] = relationship(back_populates="photos")
