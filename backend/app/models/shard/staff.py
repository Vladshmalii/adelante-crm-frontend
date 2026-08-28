"""Пер-салонная часть персонала.

Анкета (ФИО, телефон, email) живёт в Master DB и общая для сети; условия
работы в конкретном салоне — зарплата, комиссия, статус, цвет в календаре,
расписание — здесь, в шард-БД. master_id ссылается на Master DB (валидация
в сервис-слое).
"""

import enum
import uuid
from datetime import date, time
from decimal import Decimal

from sqlalchemy import Date, Numeric, String, Time, Uuid
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import ShardBase, str_enum


class StaffStatus(enum.StrEnum):
    ACTIVE = "active"
    VACATION = "vacation"
    SICK = "sick"
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


class StaffSchedule(ShardBase):
    """Недельный шаблон работы: строка на день недели (0 = понедельник)."""

    __tablename__ = "staff_schedules"

    master_id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True)
    weekday: Mapped[int] = mapped_column(primary_key=True)

    is_work_day: Mapped[bool] = mapped_column(default=False)
    start_time: Mapped[time | None] = mapped_column(Time)
    end_time: Mapped[time | None] = mapped_column(Time)
    break_start: Mapped[time | None] = mapped_column(Time)
    break_end: Mapped[time | None] = mapped_column(Time)


class ScheduleExceptionType(enum.StrEnum):
    VACATION = "vacation"
    SICK = "sick"
    DAY_OFF = "day_off"
    EXTRA_SHIFT = "extra_shift"


class ScheduleException(ShardBase):
    """Исключения из шаблона: отпуск, больничный, выходной, доп. смена."""

    __tablename__ = "schedule_exceptions"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    master_id: Mapped[uuid.UUID] = mapped_column(Uuid, index=True)

    date_from: Mapped[date] = mapped_column(Date)
    date_to: Mapped[date] = mapped_column(Date)
    type: Mapped[ScheduleExceptionType] = mapped_column(str_enum(ScheduleExceptionType, 16))
    # Для extra_shift — рабочие часы в этот день
    start_time: Mapped[time | None] = mapped_column(Time)
    end_time: Mapped[time | None] = mapped_column(Time)
    comment: Mapped[str | None] = mapped_column(String(500))
