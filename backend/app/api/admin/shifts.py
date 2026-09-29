"""График работы по дням: сетка смен, изменение ячейки, массовое заполнение.

ТЗ — backend/docs/shifts.md. Права:
- редактирование: суперюзер — все; администратор — свои и мастеров; мастер — свои;
- просмотр: суперюзер и администратор — все; мастер — только свои.
"""

import uuid
from datetime import date, time, timedelta
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Path, Query, status
from pydantic import Field, model_validator
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.admin.deps import CurrentAuthor
from app.api.errors import ApiError
from app.api.schemas import ApiModel, Envelope
from app.api.security import AuthenticatedUser, CurrentUser, Role, forbidden, require_salon_access
from app.models.shard import (
    Record,
    RecordStatus,
    ShiftKind,
    StaffShift,
)
from app.services import salon_settings
from app.services import shifts as shifts_service
from app.services.shifts import ShiftSpec
from app.tenancy.deps import MasterSession, SalonId, TenantSession
from app.timeutils import day_bounds, to_local

router = APIRouter(prefix="/shifts", tags=["shifts"], dependencies=[Depends(require_salon_access)])

MAX_PERIOD_DAYS = 62


# --- Сотрудники и права ------------------------------------------------------------


def _can_edit(user: AuthenticatedUser, target: shifts_service.StaffInfo) -> bool:
    if user.is_superuser or user.id == target.id:
        return True
    return user.is_admin and target.role == Role.MASTER


def _find(staff: list[shifts_service.StaffInfo], staff_id: uuid.UUID) -> shifts_service.StaffInfo:
    for person in staff:
        if person.id == staff_id:
            return person
    raise ApiError(404, "Співробітника не знайдено в цьому салоні", code="staff_not_found")


def _raise(exc: shifts_service.ShiftError) -> None:
    raise ApiError(
        exc.status_code,
        exc.message,
        code=exc.reason,
        details={"records": [r.as_dict() for r in exc.records]} if exc.records else None,
    )


def _check_period(date_from: date, date_to: date) -> None:
    if date_to < date_from:
        raise ApiError(422, "dateTo не може бути раніше за dateFrom", code="bad_period")
    if (date_to - date_from).days + 1 > MAX_PERIOD_DAYS:
        raise ApiError(422, f"Період — не більше {MAX_PERIOD_DAYS} днів", code="bad_period")


def _days(date_from: date, date_to: date) -> list[date]:
    return [date_from + timedelta(days=i) for i in range((date_to - date_from).days + 1)]


# --- Схемы ----------------------------------------------------------------------------


class ShiftCellOut(ApiModel):
    date: date
    # null — выходной (пустая ячейка)
    kind: ShiftKind | None
    start: time | None = None
    end: time | None = None
    break_start: time | None = None
    break_end: time | None = None
    comment: str | None = None
    # Записи мастера в этот день (кроме отменённых); у администраторов — 0
    records_count: int = 0


class StaffShiftsOut(ApiModel):
    staff_id: uuid.UUID
    name: str
    role: Role
    color: str | None
    can_edit: bool
    days: list[ShiftCellOut]


class SalonDayHoursOut(ApiModel):
    date: date
    # Часы салона — границы смен; null — салон закрыт или график не заполнен
    open: time | None
    close: time | None


class ShiftGridOut(ApiModel):
    salon_schedule_configured: bool
    days: list[SalonDayHoursOut]
    staff: list[StaffShiftsOut]


def _cell(day: date, shift: StaffShift | None, records_count: int = 0) -> ShiftCellOut:
    if shift is None:
        return ShiftCellOut(date=day, kind=None, records_count=records_count)
    return ShiftCellOut(
        date=day,
        kind=shift.kind,
        start=shift.start_time,
        end=shift.end_time,
        break_start=shift.break_start,
        break_end=shift.break_end,
        comment=shift.comment,
        records_count=records_count,
    )


async def _records_count(
    tenant_session: AsyncSession, staff_ids: list[uuid.UUID], date_from: date, date_to: date
) -> dict[tuple[uuid.UUID, date], int]:
    if not staff_ids:
        return {}
    start, _ = day_bounds(date_from)
    _, end = day_bounds(date_to)
    counts: dict[tuple[uuid.UUID, date], int] = {}
    rows = await tenant_session.execute(
        select(Record.master_id, Record.start_at).where(
            Record.master_id.in_(staff_ids),
            Record.status != RecordStatus.CANCELLED,
            Record.start_at >= start,
            Record.start_at < end,
        )
    )
    for master_id, start_at in rows.all():
        assert master_id is not None
        key = (master_id, to_local(start_at).date())
        counts[key] = counts.get(key, 0) + 1
    return counts


# --- Сетка ------------------------------------------------------------------------------


@router.get("", response_model=Envelope[ShiftGridOut])
async def shift_grid(
    user: CurrentUser,
    salon_id: SalonId,
    master_session: MasterSession,
    tenant_session: TenantSession,
    date_from: Annotated[date, Query(alias="dateFrom")],
    date_to: Annotated[date, Query(alias="dateTo")],
) -> Envelope[ShiftGridOut]:
    """Сетка графика: мастера, потом администраторы; мастеру — только его строка."""
    _check_period(date_from, date_to)
    staff = await shifts_service.active_staff(master_session, tenant_session, salon_id)
    if user.is_master:
        staff = [p for p in staff if p.id == user.id]
    ids = [p.id for p in staff]
    shifts = await _load(tenant_session, ids, date_from, date_to)
    counts = await _records_count(
        tenant_session, [p.id for p in staff if p.role == Role.MASTER], date_from, date_to
    )
    week = await salon_settings.load_schedule(tenant_session)
    days = _days(date_from, date_to)

    def hours(day: date) -> SalonDayHoursOut:
        salon_day = week[salon_settings.WEEKDAYS[day.weekday()]] if week else None
        if salon_day is None or not salon_day.is_work_day:
            return SalonDayHoursOut(date=day, open=None, close=None)
        return SalonDayHoursOut(date=day, open=salon_day.start, close=salon_day.end)

    return Envelope(
        data=ShiftGridOut(
            salon_schedule_configured=week is not None,
            days=[hours(d) for d in days],
            staff=[
                StaffShiftsOut(
                    staff_id=p.id,
                    name=p.name,
                    role=p.role,
                    color=p.color,
                    can_edit=_can_edit(user, p),
                    days=[_cell(d, shifts.get((p.id, d)), counts.get((p.id, d), 0)) for d in days],
                )
                for p in staff
            ],
        )
    )


async def _load(
    tenant_session: AsyncSession, ids: list[uuid.UUID], date_from: date, date_to: date
) -> dict[tuple[uuid.UUID, date], StaffShift]:
    if not ids:
        return {}
    return {
        (s.staff_id, s.date): s
        for s in await tenant_session.scalars(
            select(StaffShift).where(
                StaffShift.staff_id.in_(ids),
                StaffShift.date >= date_from,
                StaffShift.date <= date_to,
            )
        )
    }


# --- Одна ячейка --------------------------------------------------------------------------


class ShiftIn(ShiftSpec):
    """Смена (`kind: shift` + время) или отметка (`vacation` / `sick`)."""

    model_config = ApiModel.model_config

    comment: str | None = Field(default=None, max_length=500)


async def _prepare(
    user: AuthenticatedUser,
    salon_id: uuid.UUID,
    master_session: AsyncSession,
    tenant_session: AsyncSession,
    staff_ids: list[uuid.UUID],
) -> tuple[list[shifts_service.StaffInfo], list[shifts_service.StaffInfo]]:
    """Все сотрудники салона и целевые (с проверкой прав)."""
    staff = await shifts_service.active_staff(master_session, tenant_session, salon_id)
    targets = [_find(staff, staff_id) for staff_id in dict.fromkeys(staff_ids)]
    for target in targets:
        if not _can_edit(user, target):
            raise forbidden(
                "Змінювати можна лише свої зміни"
                if user.is_master
                else "Зміни адміністраторів змінює лише суперюзер"
            )
    return staff, targets


StaffIdPath = Annotated[uuid.UUID, Path(alias="staffId")]
DatePath = Annotated[date, Path(alias="date")]


@router.put("/{staffId}/{date}", response_model=Envelope[ShiftCellOut])
async def put_shift(
    staff_id: StaffIdPath,
    day: DatePath,
    body: ShiftIn,
    user: CurrentUser,
    author: CurrentAuthor,
    salon_id: SalonId,
    master_session: MasterSession,
    tenant_session: TenantSession,
) -> Envelope[ShiftCellOut]:
    staff, (target,) = await _prepare(user, salon_id, master_session, tenant_session, [staff_id])
    log = shifts_service.ChangeLog()
    try:
        shift = await shifts_service.apply(
            tenant_session,
            staff_id=target.id,
            staff_name=target.name,
            day=day,
            new=ShiftSpec(**body.model_dump(by_alias=False)),
            author=shifts_service.Author(author.id, author.name),
            salon_week=await salon_settings.load_schedule(tenant_session),
            log=log,
        )
    except shifts_service.ShiftError as exc:
        _raise(exc)
    shifts_service.emit_shift_changes(
        tenant_session,
        salon_id=salon_id,
        log=log,
        masters=shifts_service.master_ids(staff),
        actor_id=user.id,
    )
    count = len(await shifts_service.day_records(tenant_session, target.id, day))
    return Envelope(data=_cell(day, shift, count if target.role == Role.MASTER else 0))


@router.delete("/{staffId}/{date}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_shift(
    staff_id: StaffIdPath,
    day: DatePath,
    user: CurrentUser,
    author: CurrentAuthor,
    salon_id: SalonId,
    master_session: MasterSession,
    tenant_session: TenantSession,
) -> None:
    """Убрать смену или отметку (день становится выходным)."""
    staff, (target,) = await _prepare(user, salon_id, master_session, tenant_session, [staff_id])
    log = shifts_service.ChangeLog()
    try:
        await shifts_service.apply(
            tenant_session,
            staff_id=target.id,
            staff_name=target.name,
            day=day,
            new=None,
            author=shifts_service.Author(author.id, author.name),
            salon_week=None,
            log=log,
        )
    except shifts_service.ShiftError as exc:
        _raise(exc)
    shifts_service.emit_shift_changes(
        tenant_session,
        salon_id=salon_id,
        log=log,
        masters=shifts_service.master_ids(staff),
        actor_id=user.id,
    )


# --- Массовое заполнение --------------------------------------------------------------------


class ShiftTimesIn(ApiModel):
    start: time
    end: time
    break_start: time | None = None
    break_end: time | None = None

    def spec(self) -> ShiftSpec:
        return ShiftSpec(
            kind=ShiftKind.SHIFT,
            start=self.start,
            end=self.end,
            break_start=self.break_start,
            break_end=self.break_end,
        )


class CycleIn(ApiModel):
    work_days: int = Field(ge=1, le=31)
    off_days: int = Field(ge=0, le=31)
    # С какого дня считается цикл (первый рабочий); по умолчанию — dateFrom
    start_date: date | None = None
    shift: ShiftTimesIn


class CopyIn(ApiModel):
    date_from: date
    date_to: date


class MarkIn(ApiModel):
    kind: Literal[ShiftKind.VACATION, ShiftKind.SICK]
    comment: str | None = Field(default=None, max_length=500)


class FillIn(ApiModel):
    staff_ids: list[uuid.UUID] = Field(min_length=1)
    date_from: date
    date_to: date
    # weekdays — по дням недели; cycle — N рабочих / M выходных; copy — повторить
    # смены с другого периода; mark — відпустка / лікарняний на все дни
    mode: Literal["weekdays", "cycle", "copy", "mark"]
    # true — заменить то, что уже стоит (выходные шаблона очищают дни);
    # false — заполнить только пустые дни
    overwrite: bool = False
    weekdays: dict[str, ShiftTimesIn | None] | None = None
    cycle: CycleIn | None = None
    copy_from: CopyIn | None = None
    mark: MarkIn | None = None

    @model_validator(mode="after")
    def _check_mode(self) -> "FillIn":
        needed = {
            "weekdays": self.weekdays,
            "cycle": self.cycle,
            "copy": self.copy_from,
            "mark": self.mark,
        }[self.mode]
        if needed is None:
            field = "copyFrom" if self.mode == "copy" else self.mode
            raise ValueError(f"Для режиму {self.mode} потрібне поле {field}")
        if self.weekdays is not None:
            unknown = set(self.weekdays) - set(salon_settings.WEEKDAYS)
            if unknown:
                raise ValueError(f"Невідомі дні тижня: {', '.join(sorted(unknown))}")
        return self


class SkippedOut(ApiModel):
    staff_id: uuid.UUID
    date: date
    # exists (не перезаписываем) | salon_closed | outside_salon_hours | has_records
    reason: str
    message: str


class FillReportOut(ApiModel):
    created: int
    updated: int
    removed: int
    skipped: list[SkippedOut]


def _desired(
    body: FillIn,
    day: date,
    source: dict[date, StaffShift],
) -> ShiftSpec | None:
    """Что по шаблону должно стоять в этот день; None — выходной."""
    if body.mode == "mark":
        assert body.mark is not None
        return ShiftSpec(kind=body.mark.kind, comment=body.mark.comment)
    if body.mode == "weekdays":
        assert body.weekdays is not None
        times = body.weekdays.get(salon_settings.WEEKDAYS[day.weekday()])
        return times.spec() if times else None
    if body.mode == "cycle":
        assert body.cycle is not None
        start = body.cycle.start_date or body.date_from
        period = body.cycle.work_days + body.cycle.off_days
        in_work = (day - start).days % period < body.cycle.work_days
        return body.cycle.shift.spec() if in_work else None
    assert body.copy_from is not None
    length = (body.copy_from.date_to - body.copy_from.date_from).days + 1
    src_day = body.copy_from.date_from + timedelta(days=(day - body.date_from).days % length)
    shift = source.get(src_day)
    return ShiftSpec.of(shift) if shift else None


@router.post("/fill", response_model=Envelope[FillReportOut])
async def fill_shifts(
    body: FillIn,
    user: CurrentUser,
    author: CurrentAuthor,
    salon_id: SalonId,
    master_session: MasterSession,
    tenant_session: TenantSession,
) -> Envelope[FillReportOut]:
    """Заполнить смены или отметки на период для нескольких сотрудников."""
    _check_period(body.date_from, body.date_to)
    if body.date_from < shifts_service.today_local():
        raise ApiError(422, "Минулі дні змінювати не можна", code="past")
    if body.copy_from is not None:
        _check_period(body.copy_from.date_from, body.copy_from.date_to)
    staff, targets = await _prepare(user, salon_id, master_session, tenant_session, body.staff_ids)

    week = await salon_settings.load_schedule(tenant_session)
    ids = [t.id for t in targets]
    existing = await _load(tenant_session, ids, body.date_from, body.date_to)
    source = (
        await _load(tenant_session, ids, body.copy_from.date_from, body.copy_from.date_to)
        if body.copy_from is not None
        else {}
    )
    log = shifts_service.ChangeLog()
    skipped: list[SkippedOut] = []
    created = updated = removed = 0
    for target in targets:
        own_source = {d: s for (sid, d), s in source.items() if sid == target.id}
        for day in _days(body.date_from, body.date_to):
            desired = _desired(body, day, own_source)
            current = existing.get((target.id, day))
            if current is not None and not body.overwrite:
                if desired is not None and not desired.same_as(current):
                    skipped.append(
                        SkippedOut(
                            staff_id=target.id,
                            date=day,
                            reason="exists",
                            message="Вже заповнено",
                        )
                    )
                continue
            if desired is None and current is None:
                continue
            before = shifts_service.ShiftSpec.of(current) if current else None
            if before == desired:
                continue
            try:
                await shifts_service.apply(
                    tenant_session,
                    staff_id=target.id,
                    staff_name=target.name,
                    day=day,
                    new=desired,
                    author=shifts_service.Author(author.id, author.name),
                    salon_week=week,
                    log=log,
                )
            except shifts_service.ShiftError as exc:
                if exc.reason == "salon_not_configured":
                    _raise(exc)
                skipped.append(
                    SkippedOut(staff_id=target.id, date=day, reason=exc.reason, message=exc.message)
                )
                continue
            if before is None:
                created += 1
            elif desired is None:
                removed += 1
            else:
                updated += 1

    shifts_service.emit_shift_changes(
        tenant_session,
        salon_id=salon_id,
        log=log,
        masters=shifts_service.master_ids(staff),
        actor_id=user.id,
    )
    return Envelope(
        data=FillReportOut(created=created, updated=updated, removed=removed, skipped=skipped)
    )
