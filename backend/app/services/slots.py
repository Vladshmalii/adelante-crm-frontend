"""Расчёт свободных слотов мастера.

Источник: недельный шаблон StaffSchedule + исключения ScheduleException
(времена — локальные для салона), минус существующие записи (UTC).
Шаг сетки — 15 минут; слот подходит, если интервал услуги целиком
помещается в рабочее окно (за вычетом перерыва) и не пересекается
с не-отменёнными записями.
"""

import uuid
from datetime import UTC, date, datetime, time, timedelta
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.shard import (
    Record,
    RecordStatus,
    ScheduleException,
    ScheduleExceptionType,
    StaffSchedule,
)

SLOT_STEP = timedelta(minutes=15)


async def free_slots(
    tenant_session: AsyncSession,
    *,
    master_id: uuid.UUID,
    day: date,
    duration: timedelta,
    salon_tz: str,
) -> list[dict[str, str]]:
    tz = ZoneInfo(salon_tz)

    windows = await _work_windows(tenant_session, master_id, day)
    if not windows:
        return []

    day_start = datetime.combine(day, time.min, tzinfo=tz).astimezone(UTC)
    day_end = datetime.combine(day, time.max, tzinfo=tz).astimezone(UTC)
    busy = [
        (r.start_at, r.end_at)
        for r in await tenant_session.scalars(
            select(Record).where(
                Record.master_id == master_id,
                Record.status != RecordStatus.CANCELLED,
                Record.start_at < day_end,
                Record.end_at > day_start,
            )
        )
    ]

    slots: list[dict[str, str]] = []
    for win_start, win_end in windows:
        start = datetime.combine(day, win_start, tzinfo=tz)
        end = datetime.combine(day, win_end, tzinfo=tz)
        cursor = start
        while cursor + duration <= end:
            c_utc = cursor.astimezone(UTC)
            c_end = c_utc + duration
            if not any(b_start < c_end and b_end > c_utc for b_start, b_end in busy):
                slots.append({"start_at": c_utc.isoformat(), "label": cursor.strftime("%H:%M")})
            cursor += SLOT_STEP
    return slots


async def _work_windows(
    session: AsyncSession, master_id: uuid.UUID, day: date
) -> list[tuple[time, time]]:
    """Рабочие интервалы дня с учётом исключений (перерыв вырезан)."""
    exceptions = list(
        await session.scalars(
            select(ScheduleException).where(
                ScheduleException.master_id == master_id,
                ScheduleException.date_from <= day,
                ScheduleException.date_to >= day,
            )
        )
    )
    for exc in exceptions:
        if exc.type == ScheduleExceptionType.EXTRA_SHIFT:
            if exc.start_time and exc.end_time:
                return [(exc.start_time, exc.end_time)]
            return []
        # vacation / sick / day_off перекрывают шаблон
        return []

    template = await session.scalar(
        select(StaffSchedule).where(
            StaffSchedule.master_id == master_id,
            StaffSchedule.weekday == day.weekday(),
        )
    )
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
