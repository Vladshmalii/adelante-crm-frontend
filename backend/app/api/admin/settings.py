"""Налаштування салону: інформація про салон и графік роботи салону.

Права (ACCESS.md): администратор и суперюзер; мастеру — 403.
Эти же данные (кроме юридического названия) отдаёт публичный сайт записи:
GET /api/booking/{slug}/salon.
"""

import uuid
from datetime import date, datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import Field, ValidationError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.admin.deps import CurrentAuthor
from app.api.schemas import ApiModel, Envelope
from app.api.security import require_admin
from app.models.master import Salon
from app.models.shard import AuditAction
from app.services import salon_settings
from app.services import shifts as shifts_service
from app.services.audit import write_audit
from app.tenancy.deps import MasterSession, SalonId, TenantSession

router = APIRouter(prefix="/settings", tags=["settings"], dependencies=[Depends(require_admin)])


# --- Інформація про салон -------------------------------------------------------


class SalonInfoOut(ApiModel):
    name: str
    legal_name: str | None
    city: str | None
    address: str | None
    phone: str | None
    email: str | None
    website: str | None
    instagram: str | None
    facebook: str | None
    opened_on: date | None
    description: str | None


class SalonInfoPatchIn(ApiModel):
    """Передаются только изменённые поля; null — очистить (кроме name)."""

    name: str | None = Field(default=None, min_length=1, max_length=255)
    legal_name: str | None = Field(default=None, max_length=255)
    city: str | None = Field(default=None, max_length=128)
    address: str | None = Field(default=None, max_length=500)
    phone: str | None = Field(default=None, max_length=32)
    # Проверяется как email после обрезки пробелов (пустая строка — очистить)
    email: str | None = Field(default=None, max_length=255)
    website: str | None = Field(default=None, max_length=255)
    instagram: str | None = Field(default=None, max_length=255)
    facebook: str | None = Field(default=None, max_length=255)
    opened_on: date | None = None
    description: str | None = Field(default=None, max_length=2000)


async def _salon(master_session: AsyncSession, salon_id: uuid.UUID) -> Salon:
    salon = await master_session.get(Salon, salon_id)
    if salon is None:
        raise HTTPException(404, "Салон не знайдено")
    return salon


def _info_out(salon: Salon, info: salon_settings.SalonInfo) -> SalonInfoOut:
    return SalonInfoOut(name=salon.name, **info.model_dump())


@router.get("/salon", response_model=Envelope[SalonInfoOut])
async def get_salon_info(
    salon_id: SalonId, master_session: MasterSession, tenant_session: TenantSession
) -> Envelope[SalonInfoOut]:
    salon = await _salon(master_session, salon_id)
    return Envelope(data=_info_out(salon, await salon_settings.load_info(tenant_session)))


def _clean(value: Any) -> Any:
    """Пустая строка — то же, что null."""
    if isinstance(value, str):
        value = value.strip()
        return value or None
    return value


@router.patch("/salon", response_model=Envelope[SalonInfoOut])
async def patch_salon_info(
    body: SalonInfoPatchIn,
    author: CurrentAuthor,
    salon_id: SalonId,
    master_session: MasterSession,
    tenant_session: TenantSession,
) -> Envelope[SalonInfoOut]:
    salon = await _salon(master_session, salon_id)
    updates = {k: _clean(v) for k, v in body.model_dump(exclude_unset=True).items()}
    changes: dict[str, list[Any]] = {}

    if "name" in updates:
        if not updates["name"]:
            raise HTTPException(422, "Назва салону обов'язкова")
        if updates["name"] != salon.name:
            changes["name"] = [salon.name, updates["name"]]
            salon.name = updates.pop("name")
        else:
            updates.pop("name")

    info = await salon_settings.load_info(tenant_session)
    current = info.model_dump(mode="json")
    try:
        merged = salon_settings.SalonInfo.model_validate({**current, **updates})
    except ValidationError as exc:
        fields = ", ".join(str(e["loc"][0]) for e in exc.errors())
        raise HTTPException(422, f"Некоректні поля: {fields}") from None
    new = merged.model_dump(mode="json")
    changes.update({k: [current[k], new[k]] for k in new if current[k] != new[k]})
    if changes:
        await salon_settings.save_info(tenant_session, merged)
        write_audit(
            tenant_session,
            entity="settings",
            entity_id="salon_info",
            entity_name="Інформація про салон",
            action=AuditAction.UPDATED,
            author_id=author.id,
            author_name=author.name,
            details=changes,
        )
    return Envelope(data=_info_out(salon, merged))


# --- Графік роботи салону --------------------------------------------------------


class SalonScheduleOut(ApiModel):
    # false — график ещё не заполняли (все дни — выходные)
    configured: bool
    week: dict[str, salon_settings.SalonDay]


class SalonScheduleIn(ApiModel):
    week: dict[str, salon_settings.SalonDay]


def _schedule_out(week: dict[str, salon_settings.SalonDay] | None) -> SalonScheduleOut:
    if week is None:
        return SalonScheduleOut(
            configured=False,
            week={day: salon_settings.SalonDay() for day in salon_settings.WEEKDAYS},
        )
    return SalonScheduleOut(configured=True, week=week)


@router.get("/schedule", response_model=Envelope[SalonScheduleOut])
async def get_salon_schedule(tenant_session: TenantSession) -> Envelope[SalonScheduleOut]:
    return Envelope(data=_schedule_out(await salon_settings.load_schedule(tenant_session)))


class ShiftConflictRecordOut(ApiModel):
    id: uuid.UUID
    start_at: datetime
    end_at: datetime
    client_name: str


class ShiftConflictOut(ApiModel):
    staff_id: uuid.UUID
    staff_name: str | None
    date: date
    records: list[ShiftConflictRecordOut]


class ShiftTrimOut(ApiModel):
    # Будущие смены, подогнанные под новые часы салона
    trimmed: int
    # Смены, от которых ничего не осталось (или салон в этот день закрыт)
    removed: int
    # Смены, которые не изменены: на обрезаемое время есть записи — перенести
    # записи и поправить смену вручную
    conflicts: list[ShiftConflictOut]


class SalonSchedulePutOut(SalonScheduleOut):
    shifts: ShiftTrimOut


@router.put("/schedule", response_model=Envelope[SalonSchedulePutOut])
async def put_salon_schedule(
    body: SalonScheduleIn,
    author: CurrentAuthor,
    salon_id: SalonId,
    master_session: MasterSession,
    tenant_session: TenantSession,
) -> Envelope[SalonSchedulePutOut]:
    """Весь график целиком: все семь дней недели.

    Будущие смены сотрудников обрезаются по новым часам, кроме смен, у которых
    на обрезаемое время есть записи (backend/docs/shifts.md).
    """
    unknown = set(body.week) - set(salon_settings.WEEKDAYS)
    missing = set(salon_settings.WEEKDAYS) - set(body.week)
    if unknown or missing:
        raise HTTPException(422, "Потрібні всі дні тижня: " + ", ".join(salon_settings.WEEKDAYS))
    old = await salon_settings.load_schedule(tenant_session)
    await salon_settings.save_schedule(tenant_session, body.week)
    changes = {
        day: [
            _day_text(old[day]) if old else None,
            _day_text(body.week[day]),
        ]
        for day in salon_settings.WEEKDAYS
        if old is None or old[day] != body.week[day]
    }
    if changes:
        write_audit(
            tenant_session,
            entity="settings",
            entity_id="salon_schedule",
            entity_name="Графік роботи салону",
            action=AuditAction.UPDATED,
            author_id=author.id,
            author_name=author.name,
            details=changes,
        )

    staff = await shifts_service.active_staff(master_session, tenant_session, salon_id)
    log = shifts_service.ChangeLog()
    report = await shifts_service.trim_to_salon_hours(
        tenant_session,
        salon_week=body.week,
        names={p.id: p.name for p in staff},
        author=shifts_service.Author(author.id, author.name),
        log=log,
    )
    shifts_service.emit_shift_changes(
        tenant_session,
        salon_id=salon_id,
        log=log,
        masters=shifts_service.master_ids(staff),
        actor_id=author.id,
    )
    return Envelope(
        data=SalonSchedulePutOut(
            **_schedule_out(body.week).model_dump(),
            shifts=ShiftTrimOut(
                trimmed=report.trimmed,
                removed=report.removed,
                conflicts=[ShiftConflictOut.model_validate(c) for c in report.conflicts],
            ),
        )
    )


def _day_text(day: salon_settings.SalonDay) -> str:
    if not day.is_work_day or day.start is None or day.end is None:
        return "вихідний"
    return f"{day.start:%H:%M}–{day.end:%H:%M}"
