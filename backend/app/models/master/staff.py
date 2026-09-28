import uuid
from datetime import date, datetime

from sqlalchemy import (
    BigInteger,
    Boolean,
    Column,
    Date,
    DateTime,
    ForeignKey,
    String,
    Table,
    Uuid,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Gender, MasterBase, PersonNameMixin, str_enum
from app.models.master.salon import Salon

# Привязка персонала к салонам: и администратор, и мастер могут работать
# в нескольких салонах сети. Пер-салонные атрибуты (зарплата, статус, цвет,
# расписание) живут в шард-БД: StaffProfile / StaffSchedule.
#
# is_active=false — сотрудник уволен из этого салона: остаётся в списке
# «Звільнені», но войти в салон не может (салон не попадает в токен).
administrator_salons = Table(
    "administrator_salons",
    MasterBase.metadata,
    Column("administrator_id", ForeignKey("administrators.id"), primary_key=True),
    Column("salon_id", ForeignKey("salons.id"), primary_key=True),
    Column("is_active", Boolean, nullable=False, server_default="true"),
)

master_salons = Table(
    "master_salons",
    MasterBase.metadata,
    Column("master_id", ForeignKey("masters.id"), primary_key=True),
    Column("salon_id", ForeignKey("salons.id"), primary_key=True),
    Column("is_active", Boolean, nullable=False, server_default="true"),
)


class ContactsMixin:
    """«Додаткова інформація» профиля: адрес и контакт на экстренный случай."""

    address: Mapped[str | None] = mapped_column(String(500))
    emergency_contact_name: Mapped[str | None] = mapped_column(String(255))
    emergency_contact_phone: Mapped[str | None] = mapped_column(String(32))


class Administrator(PersonNameMixin, ContactsMixin, MasterBase):
    """Администратор — пользователь админ-панели. Только soft-delete.

    is_superuser — доступ к финансам, выгрузкам, зарплатам и управлению
    администраторами (ACCESS.md). Первого суперюзера создаёт salonctl.
    """

    __tablename__ = "administrators"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    phone: Mapped[str | None] = mapped_column(String(32))
    additional_phone: Mapped[str | None] = mapped_column(String(32))
    telegram_user_id: Mapped[int | None] = mapped_column(BigInteger, unique=True)
    is_superuser: Mapped[bool] = mapped_column(default=False, server_default="false")

    gender: Mapped[Gender | None] = mapped_column(str_enum(Gender, 16))
    birth_date: Mapped[date | None] = mapped_column(Date)
    avatar_url: Mapped[str | None] = mapped_column(String(1024))

    is_active: Mapped[bool] = mapped_column(default=True)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Все привязки, включая уволенные; для входа — active_salons
    salons: Mapped[list[Salon]] = relationship(secondary=administrator_salons, lazy="selectin")
    active_salons: Mapped[list[Salon]] = relationship(
        secondary=administrator_salons,
        primaryjoin=lambda: Administrator.id == administrator_salons.c.administrator_id,
        secondaryjoin=lambda: (
            (Salon.id == administrator_salons.c.salon_id)
            & administrator_salons.c.is_active.is_(True)
        ),
        lazy="selectin",
        viewonly=True,
    )


class Master(PersonNameMixin, ContactsMixin, MasterBase):
    """Мастер (worker). На него ссылаются Service/Record в шард-БД — только soft-delete."""

    __tablename__ = "masters"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    phone: Mapped[str | None] = mapped_column(String(32))
    additional_phone: Mapped[str | None] = mapped_column(String(32))
    email: Mapped[str | None] = mapped_column(String(255), unique=True)
    password_hash: Mapped[str | None] = mapped_column(String(255))
    telegram_user_id: Mapped[int | None] = mapped_column(BigInteger, unique=True)

    gender: Mapped[Gender | None] = mapped_column(str_enum(Gender, 16))
    birth_date: Mapped[date | None] = mapped_column(Date)
    avatar_url: Mapped[str | None] = mapped_column(String(1024))

    is_active: Mapped[bool] = mapped_column(default=True)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    salons: Mapped[list[Salon]] = relationship(secondary=master_salons, lazy="selectin")
    active_salons: Mapped[list[Salon]] = relationship(
        secondary=master_salons,
        primaryjoin=lambda: Master.id == master_salons.c.master_id,
        secondaryjoin=lambda: (
            (Salon.id == master_salons.c.salon_id) & master_salons.c.is_active.is_(True)
        ),
        lazy="selectin",
        viewonly=True,
    )
