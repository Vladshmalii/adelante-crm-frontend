import enum
import uuid
from datetime import date, datetime

from sqlalchemy import BigInteger, Date, DateTime, String, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Gender, MasterBase, PersonNameMixin, str_enum


class ClientCategory(enum.StrEnum):
    VIP = "vip"
    REGULAR = "regular"
    NEW = "new"
    INACTIVE = "inactive"


class ClientImportance(enum.StrEnum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class Client(PersonNameMixin, MasterBase):
    """Клиент сети. База общая: все салоны видят весь список (решение от 25.08.2026).

    Только soft-delete (is_active=false) — на Client ссылаются Record во всех
    шард-БД. Агрегаты (визиты, потрачено, сегмент) не хранятся — считаются
    по записям текущего салона.
    """

    __tablename__ = "clients"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    phone: Mapped[str] = mapped_column(String(32), unique=True)
    additional_phone: Mapped[str | None] = mapped_column(String(32))
    email: Mapped[str | None] = mapped_column(String(255))
    telegram_user_id: Mapped[int | None] = mapped_column(BigInteger, unique=True)

    gender: Mapped[Gender | None] = mapped_column(str_enum(Gender, 16))
    birth_date: Mapped[date | None] = mapped_column(Date)
    avatar_url: Mapped[str | None] = mapped_column(String(1024))

    card_number: Mapped[str | None] = mapped_column(String(64))
    source: Mapped[str | None] = mapped_column(String(64))
    notes: Mapped[str | None] = mapped_column(String(4000))
    color: Mapped[str | None] = mapped_column(String(16))

    category: Mapped[ClientCategory] = mapped_column(
        str_enum(ClientCategory, 16), default=ClientCategory.NEW
    )
    importance: Mapped[ClientImportance] = mapped_column(
        str_enum(ClientImportance, 16), default=ClientImportance.MEDIUM
    )
    discount_percent: Mapped[int] = mapped_column(default=0)
    no_online_booking: Mapped[bool] = mapped_column(default=False)

    is_active: Mapped[bool] = mapped_column(default=True)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
