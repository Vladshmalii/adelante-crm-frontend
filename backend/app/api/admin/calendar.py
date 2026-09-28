"""Данные для Розкладу: способы оплаты, графики на период, сводка записей по дням.

ТЗ — backend/docs/calendar.md. Регистрируется в router.py раньше records:
путь /records/daily-summary иначе перехватил бы /records/{record_id}.
"""

import uuid
from collections import defaultdict
from datetime import date, time, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.schemas import ApiModel, Envelope
from app.api.security import (
    AdminUser,
    AuthenticatedUser,
    CurrentUser,
    forbidden,
    require_salon_access,
)
from app.models.master import Master, master_salons
from app.models.shard import (
    CashRegister,
    PaymentMethod,
    PaymentMethodType,
    Record,
    RecordStatus,
    ScheduleExceptionType,
    StaffProfile,
    StaffStatus,
)
from app.services.slots import load_schedules
from app.tenancy.deps import MasterSession, SalonId, TenantSession
from app.timeutils import day_bounds, to_local

router = APIRouter(tags=["calendar"], dependencies=[Depends(require_salon_access)])

MAX_PERIOD_DAYS = 62


# --- Способы оплаты -------------------------------------------------------------


class PaymentMethodRefOut(ApiModel):
    id: uuid.UUID
    name: str
    type: PaymentMethodType


@router.get("/payment-methods", response_model=Envelope[list[PaymentMethodRefOut]])
async def list_payment_methods(
    _admin: AdminUser, tenant_session: TenantSession
) -> Envelope[list[PaymentMethodRefOut]]:
    """Способы оплаты для приёма оплаты визита (администратор).

    Только те, через которые оплата пройдёт: способ активен, у него есть
    касса и она не выключена. Финансовые настройки — в /finances/payment-methods.
    """
    methods = await tenant_session.scalars(
        select(PaymentMethod)
        .join(CashRegister, CashRegister.id == PaymentMethod.cash_register_id)
        .where(PaymentMethod.is_active.is_(True), CashRegister.is_active.is_(True))
        .order_by(PaymentMethod.sort_order, PaymentMethod.name)
    )
    return Envelope(data=[PaymentMethodRefOut.model_validate(m) for m in methods])


# --- Период и мастера -----------------------------------------------------------


def _check_period(date_from: date, date_to: date) -> None:
    if date_to < date_from:
        raise HTTPException(422, "dateTo не може бути раніше за dateFrom")
    if (date_to - date_from).days + 1 > MAX_PERIOD_DAYS:
        raise HTTPException(422, f"Період — не більше {MAX_PERIOD_DAYS} днів")


def _days(date_from: date, date_to: date) -> list[date]:
    return [date_from + timedelta(days=i) for i in range((date_to - date_from).days + 1)]


class _MasterInfo(ApiModel):
    id: uuid.UUID
    name: str
    color: str | None


async def _working_masters(
    master_session: AsyncSession,
    tenant_session: AsyncSession,
    salon_id: uuid.UUID,
    user: AuthenticatedUser,
    master_id: uuid.UUID | None,
) -> list[_MasterInfo]:
    """Не уволенные мастера салона (мастеру — только он сам)."""
    if user.is_master:
        if master_id is not None and master_id != user.id:
            raise forbidden()
        master_id = user.id

    query = (
        select(Master)
        .join(master_salons, master_salons.c.master_id == Master.id)
        .where(
            master_salons.c.salon_id == salon_id,
            master_salons.c.is_active.is_(True),
            Master.is_active.is_(True),
        )
        .order_by(Master.first_name, Master.last_name)
    )
    if master_id is not None:
        query = query.where(Master.id == master_id)
    masters = list(await master_session.scalars(query))
    profiles = (
        {
            p.master_id: p
            for p in await tenant_session.scalars(
                select(StaffProfile).where(StaffProfile.master_id.in_([m.id for m in masters]))
            )
        }
        if masters
        else {}
    )
    return [
        _MasterInfo(
            id=m.id,
            name=m.full_name,
            color=profiles[m.id].color if m.id in profiles else None,
        )
        for m in masters
        if m.id not in profiles or profiles[m.id].status != StaffStatus.FIRED
    ]


# --- Графики --------------------------------------------------------------------


class WindowOut(ApiModel):
    start: time
    end: time


class DayExceptionOut(ApiModel):
    type: ScheduleExceptionType
    comment: str | None


class ScheduleDayOut(ApiModel):
    date: date
    is_work_day: bool
    # Рабочие интервалы по Киеву; перерыв уже вырезан
    windows: list[WindowOut]
    exception: DayExceptionOut | None


class MasterScheduleOut(ApiModel):
    master_id: uuid.UUID
    name: str
    color: str | None
    days: list[ScheduleDayOut]


@router.get("/schedule", response_model=Envelope[list[MasterScheduleOut]])
async def schedule(
    user: CurrentUser,
    salon_id: SalonId,
    master_session: MasterSession,
    tenant_session: TenantSession,
    date_from: Annotated[date, Query(alias="dateFrom")],
    date_to: Annotated[date, Query(alias="dateTo")],
    master_id: Annotated[uuid.UUID | None, Query(alias="masterId")] = None,
) -> Envelope[list[MasterScheduleOut]]:
    """Рабочее время мастеров по дням (даты включительно) — сетка Розкладу."""
    _check_period(date_from, date_to)
    masters = await _working_masters(master_session, tenant_session, salon_id, user, master_id)
    calendars = await load_schedules(tenant_session, [m.id for m in masters], date_from, date_to)
    result = []
    for master in masters:
        calendar = calendars[master.id]
        days = []
        for day in _days(date_from, date_to):
            windows = calendar.windows(day)
            exc = calendar.exception_on(day)
            days.append(
                ScheduleDayOut(
                    date=day,
                    is_work_day=bool(windows),
                    windows=[WindowOut(start=s, end=e) for s, e in windows],
                    exception=DayExceptionOut(type=exc.type, comment=exc.comment) if exc else None,
                )
            )
        result.append(
            MasterScheduleOut(master_id=master.id, name=master.name, color=master.color, days=days)
        )
    return Envelope(data=result)


# --- Сводка записей по дням -------------------------------------------------------


class MasterDayOut(ApiModel):
    # null — очередь «Без майстра»
    master_id: uuid.UUID | None
    count: int
    booked_minutes: int
    # Рабочее время мастера в этот день; для очереди — null
    work_minutes: int | None


class DaySummaryOut(ApiModel):
    date: date
    total: int
    booked_minutes: int
    # Рабочее время всех не уволенных мастеров (или выбранного)
    work_minutes: int
    by_master: list[MasterDayOut]


@router.get("/records/daily-summary", response_model=Envelope[list[DaySummaryOut]])
async def daily_summary(
    user: CurrentUser,
    salon_id: SalonId,
    master_session: MasterSession,
    tenant_session: TenantSession,
    date_from: Annotated[date, Query(alias="dateFrom")],
    date_to: Annotated[date, Query(alias="dateTo")],
    master_id: Annotated[uuid.UUID | None, Query(alias="masterId")] = None,
) -> Envelope[list[DaySummaryOut]]:
    """Число и длительность записей по дням — вид «Місяць» и мини-календарь.

    Отменённые не считаются, «Не прийшов» — считаются (время мастера было занято).
    Запись относится к дню своего начала.
    """
    _check_period(date_from, date_to)
    masters = await _working_masters(master_session, tenant_session, salon_id, user, master_id)
    if user.is_master:
        master_id = user.id

    start, _ = day_bounds(date_from)
    _, end = day_bounds(date_to)
    query = select(Record.master_id, Record.start_at, Record.end_at).where(
        Record.status != RecordStatus.CANCELLED,
        Record.start_at >= start,
        Record.start_at < end,
    )
    if master_id is not None:
        query = query.where(Record.master_id == master_id)

    counts: dict[date, dict[uuid.UUID | None, list[int]]] = defaultdict(
        lambda: defaultdict(lambda: [0, 0])
    )
    for record_master, record_start, record_end in (await tenant_session.execute(query)).all():
        bucket = counts[to_local(record_start).date()][record_master]
        bucket[0] += 1
        bucket[1] += int((record_end - record_start).total_seconds() // 60)

    # Рабочее время: все работающие мастера + уволенные, у которых остались записи
    with_records = {m for per_day in counts.values() for m in per_day if m is not None}
    calendar_ids = list({m.id for m in masters} | with_records)
    calendars = await load_schedules(tenant_session, calendar_ids, date_from, date_to)
    working = {m.id for m in masters}

    result = []
    for day in _days(date_from, date_to):
        per_master = counts.get(day, {})
        by_master = [
            MasterDayOut(
                master_id=mid,
                count=count,
                booked_minutes=minutes,
                work_minutes=calendars[mid].work_minutes(day) if mid is not None else None,
            )
            for mid, (count, minutes) in sorted(
                per_master.items(), key=lambda item: (item[0] is None, -item[1][0])
            )
        ]
        result.append(
            DaySummaryOut(
                date=day,
                total=sum(c for c, _ in per_master.values()),
                booked_minutes=sum(m for _, m in per_master.values()),
                work_minutes=sum(calendars[mid].work_minutes(day) for mid in working),
                by_master=by_master,
            )
        )
    return Envelope(data=result)
