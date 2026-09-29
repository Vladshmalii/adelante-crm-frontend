"""Пер-салонная часть персонала.

Анкета (ФИО, телефон, email) живёт в Master DB и общая для сети; условия
работы в конкретном салоне — зарплата, комиссия, статус, цвет в календаре,
смены — здесь, в шард-БД. master_id ссылается на Master DB (валидация
в сервис-слое) — это id сотрудника: мастера или администратора (у
администраторов тоже есть должность, оклад и смены).
"""

import enum
import uuid
from datetime import date, datetime, time
from decimal import Decimal

from sqlalchemy import Date, DateTime, Numeric, String, Time, UniqueConstraint, Uuid, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import ShardBase, str_enum


class StaffStatus(enum.StrEnum):
    """Статус в салоне. Отпуск и больничный — отметки в графике (StaffShift)."""

    ACTIVE = "active"
    FIRED = "fired"


class StaffProfile(ShardBase):
    __tablename__ = "staff_profiles"

    master_id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True)

    position: Mapped[str | None] = mapped_column(String(128))
    specializations: Mapped[list[str]] = mapped_column(JSONB, default=list)
    status: Mapped[StaffStatus] = mapped_column(
        str_enum(StaffStatus, 16), default=StaffStatus.ACTIVE
    )
    salary: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    commission_percent: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    hire_date: Mapped[date | None] = mapped_column(Date)
    fired_at: Mapped[date | None] = mapped_column(Date)
    # Цветовая метка сотрудника в календаре
    color: Mapped[str | None] = mapped_column(String(16))


class ShiftKind(enum.StrEnum):
    SHIFT = "shift"  # смена: работает с start до end
    VACATION = "vacation"  # відпустка
    SICK = "sick"  # лікарняний


class StaffShift(ShardBase):
    """График по дням: одна строка на сотрудника и дату — смена или отметка.

    Нет строки — сотрудник в этот день не работает (выходной). Смена лежит
    внутри часов работы салона (settings.salon_schedule) в этот день недели;
    времена — киевские. Решения — backend/docs/shifts.md.
    """

    __tablename__ = "staff_shifts"
    __table_args__ = (UniqueConstraint("staff_id", "date", name="uq_staff_shifts_staff_date"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    # Мастер или администратор (id из Master DB)
    staff_id: Mapped[uuid.UUID] = mapped_column(Uuid, index=True)
    date: Mapped[date] = mapped_column(Date, index=True)
    kind: Mapped[ShiftKind] = mapped_column(str_enum(ShiftKind, 16))
    start_time: Mapped[time | None] = mapped_column(Time)
    end_time: Mapped[time | None] = mapped_column(Time)
    break_start: Mapped[time | None] = mapped_column(Time)
    break_end: Mapped[time | None] = mapped_column(Time)
    comment: Mapped[str | None] = mapped_column(String(500))
    updated_by: Mapped[uuid.UUID | None] = mapped_column(Uuid)
    updated_by_name: Mapped[str | None] = mapped_column(String(255))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
