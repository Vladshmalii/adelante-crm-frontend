"""Рабочее и свободное время мастера — по сменам (StaffShift).

Смена на дату (киевское время) минус перерыв — рабочие окна; нет смены или
отметка (відпустка, лікарняний) — нерабочий день. Свободные слоты — окна
минус записи, занимающие время мастера (UTC). Шаг сетки — 15 минут.

Данные грузятся одним набором запросов на весь диапазон дат — календарь
доступности на месяц не делает запросов на каждый день.
"""

import uuid
from dataclasses import dataclass, field
from datetime import UTC, date, datetime, time, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.shard import Record, ShiftKind, StaffShift
from app.services.records import BUSY_STATUSES
from app.timeutils import SALON_TZ, day_bounds

SLOT_STEP = timedelta(minutes=15)


@dataclass(frozen=True)
class Slot:
    start_at: datetime  # UTC
    label: str  # «14:30» по Киеву


def shift_windows(shift: StaffShift | None) -> list[tuple[time, time]]:
    """Рабочие интервалы смены (перерыв вырезан); отметка или нет смены — []."""
    if shift is None or shift.kind != ShiftKind.SHIFT:
        return []
    if shift.start_time is None or shift.end_time is None:
        return []
    if shift.break_start and shift.break_end:
        return [(shift.start_time, shift.break_start), (shift.break_end, shift.end_time)]
    return [(shift.start_time, shift.end_time)]


@dataclass
class _MasterCalendar:
    shifts: dict[date, StaffShift] = field(default_factory=dict)
    busy: list[tuple[datetime, datetime]] = field(default_factory=list)

    def shift_on(self, day: date) -> StaffShift | None:
        return self.shifts.get(day)

    def windows(self, day: date) -> list[tuple[time, time]]:
        return shift_windows(self.shift_on(day))

    def work_minutes(self, day: date) -> int:
        return sum(
            (datetime.combine(day, end) - datetime.combine(day, start)).seconds // 60
            for start, end in self.windows(day)
        )

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
        """Интервал внутри одного рабочего окна своего дня (перерыв — вне окон)."""
        local_start, local_end = start.astimezone(SALON_TZ), end.astimezone(SALON_TZ)
        day = local_start.date()
        for win_start, win_end in self.windows(day):
            w_start = datetime.combine(day, win_start, tzinfo=SALON_TZ)
            w_end = datetime.combine(day, win_end, tzinfo=SALON_TZ)
            if w_start <= local_start and local_end <= w_end:
                return True
        return False


async def load_shifts(
    session: AsyncSession, staff_ids: list[uuid.UUID], first_day: date, last_day: date
) -> dict[uuid.UUID, dict[date, StaffShift]]:
    result: dict[uuid.UUID, dict[date, StaffShift]] = {staff_id: {} for staff_id in staff_ids}
    if not staff_ids:
        return result
    for shift in await session.scalars(
        select(StaffShift).where(
            StaffShift.staff_id.in_(staff_ids),
            StaffShift.date >= first_day,
            StaffShift.date <= last_day,
        )
    ):
        result[shift.staff_id][shift.date] = shift
    return result


async def _load(
    session: AsyncSession, master_id: uuid.UUID, first_day: date, last_day: date
) -> _MasterCalendar:
    shifts = (await load_shifts(session, [master_id], first_day, last_day))[master_id]
    range_start, _ = day_bounds(first_day)
    _, range_end = day_bounds(last_day)
    rows = await session.execute(
        select(Record.start_at, Record.end_at).where(
            Record.master_id == master_id,
            Record.status.in_(BUSY_STATUSES),
            Record.start_at < range_end,
            Record.end_at > range_start,
        )
    )
    return _MasterCalendar(shifts=shifts, busy=[(start, end) for start, end in rows.all()])


async def load_schedules(
    session: AsyncSession, master_ids: list[uuid.UUID], first_day: date, last_day: date
) -> dict[uuid.UUID, _MasterCalendar]:
    """Смены нескольких сотрудников на период — для календаря (без занятости)."""
    shifts = await load_shifts(session, master_ids, first_day, last_day)
    return {staff_id: _MasterCalendar(shifts=shifts[staff_id]) for staff_id in master_ids}


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
    """Время попадает в смену мастера (занятость не проверяется)."""
    day = start_at.astimezone(SALON_TZ).date()
    calendar = await _load(session, master_id, day, day)
    return calendar.fits(start_at, end_at)
