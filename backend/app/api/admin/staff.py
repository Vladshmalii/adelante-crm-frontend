"""Персонал салона: анкета из Master DB + пер-салонный профиль из шарда."""

import uuid
from datetime import UTC, datetime, time
from datetime import date as date_type
from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import Field
from sqlalchemy import delete, func, insert, select

from app.api import security
from app.api.admin.deps import CurrentAuthor
from app.api.schemas import ApiModel, Envelope, page_meta
from app.api.security import Role, require_salon_access
from app.models.base import Gender
from app.models.master import Administrator, Master, administrator_salons, master_salons
from app.models.shard import (
    AuditAction,
    Record,
    RecordStatus,
    Review,
    ScheduleException,
    ScheduleExceptionType,
    StaffProfile,
    StaffSchedule,
    StaffStatus,
)
from app.services.audit import write_audit
from app.tenancy.deps import MasterSession, SalonId, TenantSession

router = APIRouter(prefix="/staff", tags=["staff"], dependencies=[Depends(require_salon_access)])

WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]


# --- Схемы ------------------------------------------------------------------


class StaffOut(ApiModel):
    id: uuid.UUID
    first_name: str
    middle_name: str | None
    last_name: str | None
    phone: str | None
    additional_phone: str | None
    email: str | None
    gender: Gender | None
    birth_date: date_type | None
    avatar_url: str | None
    role: Role
    # Пер-салонная часть (StaffProfile); для администраторов — значения по умолчанию
    position: str | None = None
    specializations: list[str] = Field(default_factory=list)
    status: StaffStatus = StaffStatus.ACTIVE
    salary: Decimal | None = None
    commission_percent: Decimal | None = None
    hire_date: date_type | None = None
    fired_at: date_type | None = None
    color: str | None = None


def _staff_out(
    person: Master | Administrator, role: Role, profile: StaffProfile | None
) -> StaffOut:
    out = StaffOut(
        id=person.id,
        first_name=person.first_name,
        middle_name=person.middle_name,
        last_name=person.last_name,
        phone=person.phone,
        additional_phone=person.additional_phone,
        email=person.email,
        gender=person.gender,
        birth_date=person.birth_date,
        avatar_url=person.avatar_url,
        role=role,
    )
    if profile is not None:
        out.position = profile.position
        out.specializations = profile.specializations or []
        out.status = profile.status
        out.salary = profile.salary
        out.commission_percent = profile.commission_percent
        out.hire_date = profile.hire_date
        out.fired_at = profile.fired_at
        out.color = profile.color
    return out


# --- Список / CRUD ----------------------------------------------------------


@router.get("", response_model=Envelope[list[StaffOut]])
async def list_staff(
    salon_id: SalonId,
    master_session: MasterSession,
    tenant_session: TenantSession,
    role: Role | None = None,
    staff_status: Annotated[StaffStatus | None, Query(alias="status")] = None,
    query_text: Annotated[str | None, Query(alias="query")] = None,
    page: int = 1,
    per_page: Annotated[int, Query(alias="perPage", le=200)] = 50,
) -> Envelope[list[StaffOut]]:
    people: list[tuple[Master | Administrator, Role]] = []

    if role in (None, Role.MASTER):
        query = (
            select(Master)
            .join(master_salons, master_salons.c.master_id == Master.id)
            .where(master_salons.c.salon_id == salon_id, Master.is_active.is_(True))
        )
        if query_text:
            pattern = f"%{query_text}%"
            query = query.where(
                Master.first_name.ilike(pattern)
                | Master.last_name.ilike(pattern)
                | Master.phone.ilike(pattern)
            )
        people += [(m, Role.MASTER) for m in await master_session.scalars(query)]

    if role in (None, Role.ADMINISTRATOR):
        admin_query = (
            select(Administrator)
            .join(
                administrator_salons,
                administrator_salons.c.administrator_id == Administrator.id,
            )
            .where(
                administrator_salons.c.salon_id == salon_id,
                Administrator.is_active.is_(True),
            )
        )
        if query_text:
            pattern = f"%{query_text}%"
            admin_query = admin_query.where(
                Administrator.first_name.ilike(pattern) | Administrator.last_name.ilike(pattern)
            )
        people += [(a, Role.ADMINISTRATOR) for a in await master_session.scalars(admin_query)]

    profiles = {
        p.master_id: p
        for p in await tenant_session.scalars(
            select(StaffProfile).where(
                StaffProfile.master_id.in_([p.id for p, _ in people] or [uuid.uuid4()])
            )
        )
    }
    items = [_staff_out(person, r, profiles.get(person.id)) for person, r in people]
    if staff_status is not None:
        items = [i for i in items if i.status == staff_status]

    items.sort(key=lambda i: (i.first_name, i.last_name or ""))
    total = len(items)
    start = (page - 1) * per_page
    return Envelope(data=items[start : start + per_page], meta=page_meta(page, per_page, total))


class StaffCreateIn(ApiModel):
    first_name: str = Field(min_length=1, max_length=128)
    middle_name: str | None = None
    last_name: str | None = None
    phone: str
    additional_phone: str | None = None
    email: str | None = None
    password: str | None = Field(default=None, min_length=8)
    gender: Gender | None = None
    birth_date: date_type | None = None
    role: Role = Role.MASTER
    position: str | None = None
    specializations: list[str] = Field(default_factory=list)
    salary: Decimal | None = None
    commission_percent: Decimal | None = None
    hire_date: date_type | None = None
    color: str | None = None


@router.post("", response_model=Envelope[StaffOut], status_code=status.HTTP_201_CREATED)
async def create_staff(
    body: StaffCreateIn,
    author: CurrentAuthor,
    salon_id: SalonId,
    master_session: MasterSession,
    tenant_session: TenantSession,
) -> Envelope[StaffOut]:
    person_fields = {
        "first_name": body.first_name,
        "middle_name": body.middle_name,
        "last_name": body.last_name,
        "phone": body.phone,
        "additional_phone": body.additional_phone,
        "email": body.email,
        "gender": body.gender,
        "birth_date": body.birth_date,
    }

    person: Administrator | Master
    if body.role == Role.ADMINISTRATOR:
        if not body.email or not body.password:
            raise HTTPException(422, "Администратору нужны email и пароль для входа")
        person = Administrator(
            **person_fields,
            password_hash=security.password_hasher.hash(body.password),
        )
        binding, binding_col = administrator_salons, "administrator_id"
    else:
        person = Master(**person_fields)
        if body.password:
            person.password_hash = security.password_hasher.hash(body.password)
        binding, binding_col = master_salons, "master_id"

    master_session.add(person)
    await master_session.flush()
    await master_session.execute(
        insert(binding).values(**{binding_col: person.id, "salon_id": salon_id})
    )

    profile: StaffProfile | None = None
    if body.role == Role.MASTER:
        profile = StaffProfile(
            master_id=person.id,
            position=body.position,
            specializations=body.specializations,
            status=StaffStatus.ACTIVE,
            salary=body.salary,
            commission_percent=body.commission_percent,
            hire_date=body.hire_date or datetime.now(UTC).date(),
            color=body.color,
        )
        tenant_session.add(profile)

    write_audit(
        tenant_session,
        entity="staff",
        entity_id=person.id,
        entity_name=person.full_name,
        action=AuditAction.CREATED,
        author_id=author.id,
        author_name=author.name,
    )
    return Envelope(data=_staff_out(person, body.role, profile))


async def _get_bound_master(master_session, salon_id, staff_id) -> Master:
    master = await master_session.scalar(
        select(Master)
        .join(master_salons, master_salons.c.master_id == Master.id)
        .where(Master.id == staff_id, master_salons.c.salon_id == salon_id)
    )
    if master is None:
        raise HTTPException(404, "Сотрудник не найден в этом салоне")
    return master


class StaffPatchIn(ApiModel):
    first_name: str | None = None
    middle_name: str | None = None
    last_name: str | None = None
    phone: str | None = None
    additional_phone: str | None = None
    email: str | None = None
    gender: Gender | None = None
    birth_date: date_type | None = None
    avatar_url: str | None = None
    position: str | None = None
    specializations: list[str] | None = None
    status: StaffStatus | None = None
    salary: Decimal | None = None
    commission_percent: Decimal | None = None
    hire_date: date_type | None = None
    color: str | None = None


PROFILE_FIELDS = {
    "position",
    "specializations",
    "status",
    "salary",
    "commission_percent",
    "hire_date",
    "color",
}


@router.patch("/{staff_id}", response_model=Envelope[StaffOut])
async def patch_staff(
    staff_id: uuid.UUID,
    body: StaffPatchIn,
    author: CurrentAuthor,
    salon_id: SalonId,
    master_session: MasterSession,
    tenant_session: TenantSession,
) -> Envelope[StaffOut]:
    master = await _get_bound_master(master_session, salon_id, staff_id)
    updates = body.model_dump(exclude_unset=True, by_alias=False)

    profile = await tenant_session.get(StaffProfile, staff_id)
    if profile is None:
        profile = StaffProfile(master_id=staff_id)
        tenant_session.add(profile)

    for field, value in updates.items():
        target = profile if field in PROFILE_FIELDS else master
        setattr(target, field, value)

    write_audit(
        tenant_session,
        entity="staff",
        entity_id=master.id,
        entity_name=master.full_name,
        action=AuditAction.UPDATED,
        author_id=author.id,
        author_name=author.name,
        details={k: [None, str(v)] for k, v in updates.items()},
    )
    return Envelope(data=_staff_out(master, Role.MASTER, profile))


@router.delete("/{staff_id}", response_model=Envelope[StaffOut])
async def fire_staff(
    staff_id: uuid.UUID,
    author: CurrentAuthor,
    salon_id: SalonId,
    master_session: MasterSession,
    tenant_session: TenantSession,
) -> Envelope[StaffOut]:
    """Увольнение (status=fired). 409, если у мастера есть будущие записи."""
    master = await _get_bound_master(master_session, salon_id, staff_id)

    future = await tenant_session.scalar(
        select(func.count())
        .select_from(Record)
        .where(
            Record.master_id == staff_id,
            Record.start_at > datetime.now(UTC),
            Record.status.in_([RecordStatus.SCHEDULED, RecordStatus.CONFIRMED]),
        )
    )
    if future:
        raise HTTPException(409, f"У мастера {future} будущих записей — отмените или перенесите их")

    profile = await tenant_session.get(StaffProfile, staff_id)
    if profile is None:
        profile = StaffProfile(master_id=staff_id)
        tenant_session.add(profile)
    profile.status = StaffStatus.FIRED
    profile.fired_at = datetime.now(UTC).date()

    write_audit(
        tenant_session,
        entity="staff",
        entity_id=master.id,
        entity_name=master.full_name,
        action=AuditAction.UPDATED,
        author_id=author.id,
        author_name=author.name,
        details={"status": [None, "fired"]},
    )
    return Envelope(data=_staff_out(master, Role.MASTER, profile))


# --- Расписание -------------------------------------------------------------


class DayScheduleIn(ApiModel):
    is_work_day: bool = False
    start: time | None = None
    end: time | None = None
    break_start: time | None = None
    break_end: time | None = None


class ExceptionOut(ApiModel):
    id: uuid.UUID
    date_from: date_type
    date_to: date_type
    type: ScheduleExceptionType
    start: time | None = None
    end: time | None = None
    comment: str | None = None


class ScheduleOut(ApiModel):
    week: dict[str, DayScheduleIn]
    exceptions: list[ExceptionOut]


@router.get("/{staff_id}/schedule", response_model=Envelope[ScheduleOut])
async def get_schedule(staff_id: uuid.UUID, tenant_session: TenantSession) -> Envelope[ScheduleOut]:
    rows = {
        r.weekday: r
        for r in await tenant_session.scalars(
            select(StaffSchedule).where(StaffSchedule.master_id == staff_id)
        )
    }
    week = {}
    for i, name in enumerate(WEEKDAYS):
        row = rows.get(i)
        week[name] = DayScheduleIn(
            is_work_day=bool(row and row.is_work_day),
            start=row.start_time if row else None,
            end=row.end_time if row else None,
            break_start=row.break_start if row else None,
            break_end=row.break_end if row else None,
        )
    exceptions = [
        ExceptionOut(
            id=e.id,
            date_from=e.date_from,
            date_to=e.date_to,
            type=e.type,
            start=e.start_time,
            end=e.end_time,
            comment=e.comment,
        )
        for e in await tenant_session.scalars(
            select(ScheduleException)
            .where(ScheduleException.master_id == staff_id)
            .order_by(ScheduleException.date_from)
        )
    ]
    return Envelope(data=ScheduleOut(week=week, exceptions=exceptions))


@router.post("/{staff_id}/schedule", response_model=Envelope[ScheduleOut])
async def save_schedule(
    staff_id: uuid.UUID,
    body: dict[str, DayScheduleIn],
    salon_id: SalonId,
    master_session: MasterSession,
    tenant_session: TenantSession,
) -> Envelope[ScheduleOut]:
    await _get_bound_master(master_session, salon_id, staff_id)
    unknown = set(body) - set(WEEKDAYS)
    if unknown:
        raise HTTPException(422, f"Неизвестные дни недели: {', '.join(unknown)}")

    await tenant_session.execute(delete(StaffSchedule).where(StaffSchedule.master_id == staff_id))
    for name, day in body.items():
        tenant_session.add(
            StaffSchedule(
                master_id=staff_id,
                weekday=WEEKDAYS.index(name),
                is_work_day=day.is_work_day,
                start_time=day.start,
                end_time=day.end,
                break_start=day.break_start,
                break_end=day.break_end,
            )
        )
    await tenant_session.flush()
    return await get_schedule(staff_id, tenant_session)


class ExceptionIn(ApiModel):
    date_from: date_type
    date_to: date_type
    type: ScheduleExceptionType
    start: time | None = None
    end: time | None = None
    comment: str | None = None


@router.post(
    "/{staff_id}/schedule/exceptions",
    response_model=Envelope[ExceptionOut],
    status_code=status.HTTP_201_CREATED,
)
async def add_exception(
    staff_id: uuid.UUID,
    body: ExceptionIn,
    salon_id: SalonId,
    master_session: MasterSession,
    tenant_session: TenantSession,
) -> Envelope[ExceptionOut]:
    await _get_bound_master(master_session, salon_id, staff_id)
    exc = ScheduleException(
        master_id=staff_id,
        date_from=body.date_from,
        date_to=body.date_to,
        type=body.type,
        start_time=body.start,
        end_time=body.end,
        comment=body.comment,
    )
    tenant_session.add(exc)
    await tenant_session.flush()
    return Envelope(
        data=ExceptionOut(
            id=exc.id,
            date_from=exc.date_from,
            date_to=exc.date_to,
            type=exc.type,
            start=exc.start_time,
            end=exc.end_time,
            comment=exc.comment,
        )
    )


# --- Статистика -------------------------------------------------------------


class StaffStatsOut(ApiModel):
    visits: int
    revenue: Decimal
    avg_check: Decimal
    rating: float | None


@router.get("/{staff_id}/stats", response_model=Envelope[StaffStatsOut])
async def staff_stats(
    staff_id: uuid.UUID,
    tenant_session: TenantSession,
    date_from: Annotated[datetime | None, Query(alias="dateFrom")] = None,
    date_to: Annotated[datetime | None, Query(alias="dateTo")] = None,
) -> Envelope[StaffStatsOut]:
    query = select(
        func.count(),
        func.coalesce(func.sum(Record.total_amount), 0),
    ).where(Record.master_id == staff_id, Record.status == RecordStatus.COMPLETED)
    if date_from is not None:
        query = query.where(Record.start_at >= date_from)
    if date_to is not None:
        query = query.where(Record.start_at < date_to)
    visits, revenue = (await tenant_session.execute(query)).one()

    rating = await tenant_session.scalar(
        select(func.avg(Review.rating)).where(Review.master_id == staff_id)
    )
    return Envelope(
        data=StaffStatsOut(
            visits=visits,
            revenue=revenue,
            avg_check=(revenue / visits).quantize(Decimal("0.01")) if visits else Decimal(0),
            rating=round(float(rating), 2) if rating is not None else None,
        )
    )
