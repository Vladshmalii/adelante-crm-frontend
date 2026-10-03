import enum
import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import Column, DateTime, ForeignKey, Index, Numeric, String, Table, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import ShardBase, str_enum


class ServiceStatus(enum.StrEnum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    ARCHIVED = "archived"


# Услугу выполняют несколько мастеров (форма услуги на фронте).
# master_id ссылается на masters.id в Master DB — FK между базами невозможен,
# целостность обеспечивается сервис-слоем.
service_masters = Table(
    "service_masters",
    ShardBase.metadata,
    Column("service_id", ForeignKey("services.id"), primary_key=True),
    Column("master_id", Uuid, primary_key=True),
)


class ServiceCategory(ShardBase):
    """Категория услуг. Системная «Інше» — одна на салон: не удаляется и не
    переименовывается, в неё попадают услуги без категории и услуги удалённых
    категорий. Название уникально без учёта регистра.
    """

    __tablename__ = "service_categories"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(128))
    is_system: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


Index("uq_service_categories_lower_name", func.lower(ServiceCategory.name), unique=True)


class Service(ShardBase):
    """Услуга салона."""

    __tablename__ = "services"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)

    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(String(2000))
    category_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("service_categories.id"), index=True)
    color: Mapped[str | None] = mapped_column(String(16))
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    duration_minutes: Mapped[int] = mapped_column(default=60)
    status: Mapped[ServiceStatus] = mapped_column(
        str_enum(ServiceStatus, 16), default=ServiceStatus.ACTIVE
    )

    category: Mapped[ServiceCategory] = relationship(lazy="joined", innerjoin=True)
