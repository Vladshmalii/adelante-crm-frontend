"""Смены сотрудников по дням: проверки, конфликты с записями, запись, обрезка.

Правила — backend/docs/shifts.md:
- смена лежит внутри часов работы салона в этот день недели; график салона не
  заполнен или салон закрыт — смену поставить нельзя;
- прошлые даты не меняются никем;
- нельзя удалить смену, заменить её отметкой или сократить так, что запись,
  которая была внутри смены, окажется вне неё; отметку відпустка / лікарняний
  нельзя поставить на день с записями (отменённые не считаются);
- изменения — в журнал; уведомление мастеру — через outbox (shift.changed).
"""

import uuid
from dataclasses import dataclass, field
from datetime import date, datetime, time
from typing import Any

from pydantic import BaseModel, model_validator
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.security import Role
from app.models.master import Administrator, Master, administrator_salons, master_salons
from app.models.shard import (
    AuditAction,
    Record,
    RecordStatus,
    ShiftKind,
    StaffProfile,
    StaffShift,
    StaffStatus,
)
from app.notifications.outbox import SHIFT_CHANGED, add_outbox_event
from app.services.audit import write_audit
from app.services.salon_settings import WEEKDAYS, SalonDay
from app.timeutils import SALON_TZ, day_bounds, to_local

MARK_NAMES = {ShiftKind.VACATION: "відпустка", ShiftKind.SICK: "лікарняний"}


class ShiftSpec(BaseModel):
    """Что поставить в ячейку: смену (со временем) или отметку."""

    kind: ShiftKind = ShiftKind.SHIFT
    start: time | None = None
    end: time | None = None
    break_start: time | None = None
    break_end: time | None = None
    comment: str | None = None

    @model_validator(mode="after")
    def _check(self) -> "ShiftSpec":
        if self.kind != ShiftKind.SHIFT:
            self.start = self.end = self.break_start = self.break_end = None
            return self
        if self.start is None or self.end is None:
            raise ValueError("Для зміни потрібні час початку і закінчення")
        if self.start >= self.end:
            raise ValueError("Час закінчення зміни має бути пізніше за час початку")
        if (self.break_start is None) != (self.break_end is None):
            raise ValueError("Для перерви потрібні і початок, і кінець")
        if (
            self.break_start is not None
            and self.break_end is not None
            and not (self.start <= self.break_start < self.break_end <= self.end)
        ):
            raise ValueError("Перерва має бути всередині зміни")
        return self

    @classmethod
    def of(cls, shift: StaffShift) -> "ShiftSpec":
        return cls(
            kind=shift.kind,
            start=shift.start_time,
            end=shift.end_time,
            break_start=shift.break_start,
            break_end=shift.break_end,
            comment=shift.comment,
        )

    def same_as(self, shift: StaffShift | None) -> bool:
        return shift is not None and ShiftSpec.of(shift) == self


def describe(spec: ShiftSpec | None) -> str:
    """Текст ячейки для журнала и уведомлений."""
    if spec is None:
        return "вихідний"
    if spec.kind != ShiftKind.SHIFT:
        return MARK_NAMES[spec.kind]
    assert spec.start is not None and spec.end is not None
    text = f"{spec.start:%H:%M}–{spec.end:%H:%M}"
    if spec.break_start and spec.break_end:
        text += f" (перерва {spec.break_start:%H:%M}–{spec.break_end:%H:%M})"
    return text


# --- Ошибки и конфликты -----------------------------------------------------------


@dataclass
class RecordConflict:
    id: uuid.UUID
    start_at: datetime
    end_at: datetime
    client_name: str

    def as_dict(self) -> dict[str, Any]:
        return {
            "id": str(self.id),
            "startAt": self.start_at.isoformat(),
            "endAt": self.end_at.isoformat(),
            "clientName": self.client_name,
        }


class ShiftError(Exception):
    """reason — машинный код: past, salon_not_configured, salon_closed,
    outside_salon_hours, has_records."""

    def __init__(
        self, reason: str, message: str, records: list[RecordConflict] | None = None
    ) -> None:
        super().__init__(message)
        self.reason = reason
        self.message = message
        self.records = records or []

    @property
    def status_code(self) -> int:
        return 409 if self.reason == "has_records" else 422


def check_salon_hours(spec: ShiftSpec, day: date, salon_week: dict[str, SalonDay] | None) -> None:
    if spec.kind != ShiftKind.SHIFT:
        return
    if salon_week is None:
        raise ShiftError(
            "salon_not_configured", "Спочатку заповніть графік роботи салону в Налаштуваннях"
        )
    hours = salon_week[WEEKDAYS[day.weekday()]]
    if not hours.is_work_day or hours.start is None or hours.end is None:
        raise ShiftError("salon_closed", f"Салон не працює {day:%d.%m.%Y}")
    assert spec.start is not None and spec.end is not None
    if spec.start < hours.start or spec.end > hours.end:
        raise ShiftError(
            "outside_salon_hours",
            f"Зміна має бути в межах роботи салону: {hours.start:%H:%M}–{hours.end:%H:%M}",
        )


def _inside(record: Record, spec: ShiftSpec | None) -> bool:
    """Запись целиком внутри смены (перерыв не учитывается)."""
    if spec is None or spec.kind != ShiftKind.SHIFT:
        return False
    assert spec.start is not None and spec.end is not None
    start, end = to_local(record.start_at), to_local(record.end_at)
    if end.date() != start.date():
        return False
    return spec.start <= start.time() and end.time() <= spec.end


async def day_records(session: AsyncSession, staff_id: uuid.UUID, day: date) -> list[Record]:
    start, end = day_bounds(day)
    return list(
        await session.scalars(
            select(Record)
            .where(
                Record.master_id == staff_id,
                Record.status != RecordStatus.CANCELLED,
                Record.start_at >= start,
                Record.start_at < end,
            )
            .order_by(Record.start_at)
        )
    )


def blocking_records(
    records: list[Record], old: ShiftSpec | None, new: ShiftSpec | None
) -> list[RecordConflict]:
    """Записи, которым мешает замена old → new."""
    if new is not None and new.kind != ShiftKind.SHIFT:
        blocked = records  # отметка на день с записями
    else:
        blocked = [r for r in records if _inside(r, old) and not _inside(r, new)]
    return [RecordConflict(r.id, r.start_at, r.end_at, r.client_name) for r in blocked]


# --- Запись смены --------------------------------------------------------------------


def today_local() -> date:
    return datetime.now(SALON_TZ).date()


@dataclass
class Author:
    id: uuid.UUID | None
    name: str | None


@dataclass
class ShiftChange:
    staff_id: uuid.UUID
    day: date
    old: ShiftSpec | None
    new: ShiftSpec | None


@dataclass
class ChangeLog:
    """Изменения за операцию — для журнала и уведомлений мастерам."""

    changes: list[ShiftChange] = field(default_factory=list)

    def for_staff(self, staff_id: uuid.UUID) -> list[ShiftChange]:
        return [c for c in self.changes if c.staff_id == staff_id]


async def apply(
    session: AsyncSession,
    *,
    staff_id: uuid.UUID,
    staff_name: str,
    day: date,
    new: ShiftSpec | None,
    author: Author,
    salon_week: dict[str, SalonDay] | None,
    log: ChangeLog,
    check_records: bool = True,
) -> StaffShift | None:
    """Поставить (new) или убрать (None) смену/отметку сотрудника на дату.

    Бросает ShiftError; при успехе пишет журнал и добавляет изменение в log.
    """
    if day < today_local():
        raise ShiftError("past", "Минулі дні змінювати не можна")
    if new is not None:
        check_salon_hours(new, day, salon_week)

    existing = await session.scalar(
        select(StaffShift).where(StaffShift.staff_id == staff_id, StaffShift.date == day)
    )
    old = ShiftSpec.of(existing) if existing else None
    if old == new:
        return existing

    if check_records:
        conflicts = blocking_records(await day_records(session, staff_id, day), old, new)
        if conflicts:
            reason = (
                f"У майстра є записи {day:%d.%m.%Y}"
                if new is not None and new.kind != ShiftKind.SHIFT
                else f"Записи {day:%d.%m.%Y} опиняться поза зміною"
            )
            raise ShiftError("has_records", reason, conflicts)

    if new is None:
        assert existing is not None
        await session.delete(existing)
        shift = None
    else:
        shift = existing or StaffShift(staff_id=staff_id, date=day)
        shift.kind = new.kind
        shift.start_time = new.start
        shift.end_time = new.end
        shift.break_start = new.break_start
        shift.break_end = new.break_end
        shift.comment = new.comment
        shift.updated_by = author.id
        shift.updated_by_name = author.name
        if existing is None:
            session.add(shift)

    write_audit(
        session,
        entity="shift",
        entity_id=f"{staff_id}:{day.isoformat()}",
        entity_name=f"Графік: {staff_name}, {day:%d.%m.%Y}",
        action=(
            AuditAction.CREATED
            if old is None
            else AuditAction.DELETED
            if new is None
            else AuditAction.UPDATED
        ),
        author_id=author.id,
        author_name=author.name,
        details={"shift": [describe(old) if old else None, describe(new) if new else None]},
    )
    log.changes.append(ShiftChange(staff_id, day, old, new))
    return shift


def emit_shift_changes(
    session: AsyncSession,
    *,
    salon_id: uuid.UUID,
    log: ChangeLog,
    masters: set[uuid.UUID],
    actor_id: uuid.UUID | None,
) -> None:
    """Событие shift.changed на каждого затронутого сотрудника.

    Уведомление в Telegram получает мастер, если менял не он сам (notify=true);
    для админки событие уходит всегда — обновить сетку.
    """
    by_staff: dict[uuid.UUID, list[ShiftChange]] = {}
    for change in log.changes:
        by_staff.setdefault(change.staff_id, []).append(change)
    for staff_id, changes in by_staff.items():
        add_outbox_event(
            session,
            event_type=SHIFT_CHANGED,
            salon_id=salon_id,
            payload={
                "staff_id": str(staff_id),
                "actor_id": str(actor_id) if actor_id else None,
                "notify": staff_id in masters and staff_id != actor_id,
                "changes": [
                    {"date": c.day.isoformat(), "value": describe(c.new) if c.new else None}
                    for c in sorted(changes, key=lambda c: c.day)
                ],
            },
        )


# --- Обрезка по часам салона ---------------------------------------------------------


@dataclass
class TrimReport:
    trimmed: int = 0
    removed: int = 0
    conflicts: list[dict[str, Any]] = field(default_factory=list)


def _trimmed(spec: ShiftSpec, hours: SalonDay) -> ShiftSpec | None:
    """Смена в пределах новых часов салона; ничего не осталось — None."""
    if not hours.is_work_day or hours.start is None or hours.end is None:
        return None
    assert spec.start is not None and spec.end is not None
    start, end = max(spec.start, hours.start), min(spec.end, hours.end)
    if start >= end:
        return None
    break_start, break_end = spec.break_start, spec.break_end
    if break_start is not None and break_end is not None:
        break_start, break_end = max(break_start, start), min(break_end, end)
        if break_start >= break_end:
            break_start = break_end = None
    return spec.model_copy(
        update={"start": start, "end": end, "break_start": break_start, "break_end": break_end}
    )


async def trim_to_salon_hours(
    session: AsyncSession,
    *,
    salon_week: dict[str, SalonDay],
    names: dict[uuid.UUID, str],
    author: Author,
    log: ChangeLog,
) -> TrimReport:
    """Будущие смены (с сегодня) — в пределы новых часов салона.

    Смены, у которых на обрезаемое время есть записи, не меняются — конфликт.
    """
    report = TrimReport()
    shifts = list(
        await session.scalars(
            select(StaffShift)
            .where(StaffShift.date >= today_local(), StaffShift.kind == ShiftKind.SHIFT)
            .order_by(StaffShift.date)
        )
    )
    for shift in shifts:
        old = ShiftSpec.of(shift)
        new = _trimmed(old, salon_week[WEEKDAYS[shift.date.weekday()]])
        if new == old:
            continue
        try:
            await apply(
                session,
                staff_id=shift.staff_id,
                staff_name=names.get(shift.staff_id, "—"),
                day=shift.date,
                new=new,
                author=author,
                salon_week=None if new is None else salon_week,
                log=log,
            )
        except ShiftError as exc:
            if exc.reason != "has_records":
                raise
            report.conflicts.append(
                {
                    "staffId": str(shift.staff_id),
                    "staffName": names.get(shift.staff_id),
                    "date": shift.date.isoformat(),
                    "records": [r.as_dict() for r in exc.records],
                }
            )
            continue
        if new is None:
            report.removed += 1
        else:
            report.trimmed += 1
    return report


# --- Сотрудники салона ------------------------------------------------------------------


@dataclass
class StaffInfo:
    id: uuid.UUID
    name: str
    role: Role
    color: str | None


async def active_staff(
    master_session: AsyncSession, tenant_session: AsyncSession, salon_id: uuid.UUID
) -> list[StaffInfo]:
    """Не уволенные сотрудники салона: сначала мастера, потом администраторы."""
    masters = list(
        await master_session.scalars(
            select(Master)
            .join(master_salons, master_salons.c.master_id == Master.id)
            .where(
                master_salons.c.salon_id == salon_id,
                master_salons.c.is_active.is_(True),
                Master.is_active.is_(True),
            )
            .order_by(Master.first_name, Master.last_name)
        )
    )
    admins = list(
        await master_session.scalars(
            select(Administrator)
            .join(
                administrator_salons,
                administrator_salons.c.administrator_id == Administrator.id,
            )
            .where(
                administrator_salons.c.salon_id == salon_id,
                administrator_salons.c.is_active.is_(True),
                Administrator.is_active.is_(True),
            )
            .order_by(Administrator.first_name, Administrator.last_name)
        )
    )
    ids = [p.id for p in masters] + [p.id for p in admins]
    profiles = (
        {
            p.master_id: p
            for p in await tenant_session.scalars(
                select(StaffProfile).where(StaffProfile.master_id.in_(ids))
            )
        }
        if ids
        else {}
    )
    result = []
    for person, role in [(m, Role.MASTER) for m in masters] + [
        (a, Role.ADMINISTRATOR) for a in admins
    ]:
        profile = profiles.get(person.id)
        if profile is not None and profile.status == StaffStatus.FIRED:
            continue
        result.append(
            StaffInfo(person.id, person.full_name, role, profile.color if profile else None)
        )
    return result


def master_ids(staff: list[StaffInfo]) -> set[uuid.UUID]:
    return {p.id for p in staff if p.role == Role.MASTER}
