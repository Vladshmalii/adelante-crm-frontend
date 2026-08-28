import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, String, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import MasterBase, str_enum


class SalonStatus(enum.StrEnum):
    PROVISIONING = "provisioning"
    ACTIVE = "active"
    SUSPENDED = "suspended"


class Salon(MasterBase):
    """Реестр салонов: salon_id → параметры подключения к шард-БД."""

    __tablename__ = "salons"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    slug: Mapped[str] = mapped_column(String(64), unique=True)
    name: Mapped[str] = mapped_column(String(255))
    timezone: Mapped[str] = mapped_column(String(64), default="Europe/Kyiv")

    db_host: Mapped[str] = mapped_column(String(255))
    db_port: Mapped[int] = mapped_column(default=5432)
    db_name: Mapped[str] = mapped_column(String(64))
    db_user: Mapped[str] = mapped_column(String(64))
    # Имя переменной окружения с паролем роли шарда; сам пароль в БД не хранится
    secret_env: Mapped[str] = mapped_column(String(128))

    status: Mapped[SalonStatus] = mapped_column(
        str_enum(SalonStatus, 16),
        default=SalonStatus.PROVISIONING,
    )
    # Последняя применённая Alembic-ревизия — для наблюдаемости;
    # источник истины — alembic_version в самой шард-БД
    schema_version: Mapped[str | None] = mapped_column(String(64))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
