"""Свободное время мастера.

Источник: недельный шаблон StaffSchedule + исключения ScheduleException
(времена — киевские), минус записи, занимающие время мастера (UTC).
Шаг сетки — 15 минут; слот подходит, если интервал услуг целиком помещается
в рабочее окно (за вычетом перерыва) и не пересекается с записями.

Данные грузятся одним набором запросов на весь диапазон дат — календарь
доступности на месяц не делает запросов на каждый день.
"""

import uuid
from dataclasses import dataclass
from datetime import UTC, date, datetime, time, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.shard import (
    Record,
    ScheduleException,
    ScheduleExceptionType,
    StaffSchedule,
)
from app.services.records import BUSY_STATUSES
from app.timeutils import SALON_TZ, day_bounds

SLOT_STEP = timedelta(minutes=15)


@dataclass(frozen=True)
class Slot:
    start_at: datetime  # UTC
    label: str  # «14:30» по Киеву


@dataclass
class _MasterCalendar:
    templates: dict[int, StaffSchedule]
    exceptions: list[ScheduleException]
    busy: list[tuple[datetime, datetime]]

    def windows(self, day: date) -> list[tuple[time, time]]:
        """Рабочие интервалы дня с учётом исключений (перерыв вырезан)."""
        for exc in self.exceptions:
            if exc.date_from <= day <= exc.date_to:
                if (
                    exc.type == ScheduleExceptionType.EXTRA_SHIFT
                    and exc.start_time
                    and exc.end_time
                ):
                    return [(exc.start_time, exc.end_time)]
                # vacation / sick / day_off (и доп. смена без часов) перекрывают шаблон
                return []

        template = self.templates.get(day.weekday())
        if template is None or not template.is_work_day:
            return []
        if not template.start_time or not template.end_time:
            return []
        if template.break_start and template.break_end:
            return [
                (template.start_time, template.break_start),
                (template.break_end, template.end_time),
            ]
        return [(template.start_time, template.end_time)]

    def is_free(self, start: datetime, end: datetime) -> bool:
        return not any(b_start < end and b_end > start for b_start, b_end in self.busy)

    def slots(self, day: date, duration: timedelta, not_before: datetime | None) -> list[Slot]:
        result: list[Slot] = []
        for win_start, win_end in self.windows(day):
            cursor = datetime.combine(day, win_start, tzinfo=SALON_TZ)
            end = datetime.combine(day, win_end, tzinfo=SALON_TZ)
            while cursor + duration <= end:
                c_utc = cursor.astimezone(UTC)
                if (not_before is None or c_utc >= not_before) and self.is_free(
                    c_utc, c_utc + duration
                ):
                    result.append(Slot(start_at=c_utc, label=cursor.strftime("%H:%M")))
                cursor += SLOT_STEP
        return result

    def fits(self, start: datetime, end: datetime) -> bool:
        """Интервал внутри одного рабочего окна своего дня."""
        local_start, local_end = start.astimezone(SALON_TZ), end.astimezone(SALON_TZ)
        day = local_start.date()
        for win_start, win_end in self.windows(day):
            w_start = datetime.combine(day, win_start, tzinfo=SALON_TZ)
            w_end = datetime.combine(day, win_end, tzinfo=SALON_TZ)
            if w_start <= local_start and local_end <= w_end:
                return True
        return False


async def _load(
    session: AsyncSession,
    master_id: uuid.UUID,
    first_day: date,
    last_day: date,
) -> _MasterCalendar:
    templates = {
        t.weekday: t
        for t in await session.scalars(
            select(StaffSchedule).where(StaffSchedule.master_id == master_id)
        )
    }
    exceptions = list(
        await session.scalars(
            select(ScheduleException).where(
                ScheduleException.master_id == master_id,
                ScheduleException.date_from <= last_day,
                ScheduleException.date_to >= first_day,
            )
        )
    )
    range_start, _ = day_bounds(first_day)
    _, range_end = day_bounds(last_day)
    query = select(Record.start_at, Record.end_at).where(
        Record.master_id == master_id,
        Record.status.in_(BUSY_STATUSES),
        Record.start_at < range_end,
        Record.end_at > range_start,
    )
    busy = [(start, end) for start, end in (await session.execute(query)).all()]
    return _MasterCalendar(templates=templates, exceptions=exceptions, busy=busy)


async def free_slots(
    session: AsyncSession,
    *,
    master_id: uuid.UUID,
    day: date,
    duration: timedelta,
    not_before: datetime | None = None,
) -> list[Slot]:
    calendar = await _load(session, master_id, day, day)
    return calendar.slots(day, duration, not_before)


async def free_days(
    session: AsyncSession,
    *,
    master_id: uuid.UUID,
    first_day: date,
    last_day: date,
    duration: timedelta,
    not_before: datetime | None = None,
) -> set[date]:
    """Дни диапазона, в которых есть хотя бы один свободный слот."""
    calendar = await _load(session, master_id, first_day, last_day)
    days: set[date] = set()
    day = first_day
    while day <= last_day:
        if calendar.slots(day, duration, not_before):
            days.add(day)
        day += timedelta(days=1)
    return days


async def fits_schedule(
    session: AsyncSession,
    *,
    master_id: uuid.UUID,
    start_at: datetime,
    end_at: datetime,
) -> bool:
    """Время попадает в рабочие часы мастера (занятость не проверяется)."""
    day = start_at.astimezone(SALON_TZ).date()
    calendar = await _load(session, master_id, day, day)
    return calendar.fits(start_at, end_at)
