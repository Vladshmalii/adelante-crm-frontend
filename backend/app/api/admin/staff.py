"""Персонал салона: анкета из Master DB + пер-салонный профиль из шарда.

Права (ACCESS.md): раздел — только администратор. Администраторов создаёт,
меняет и увольняет только суперюзер, он же выдаёт is_superuser. Зарплата,
комиссия, статистика выручки и экспорт — только суперюзер (для остальных
денежные поля в ответах null, в запросах — 403).

Увольнение — status=fired в профиле салона и неактивная привязка к салону:
сотрудник остаётся в списке «Звільнені», но войти в этот салон не может.
"""

import io
import uuid
from datetime import UTC, datetime, time
from datetime import date as date_type
from decimal import Decimal
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from pydantic import Field
from sqlalchemy import Table, delete, func, insert, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import security
from app.api.admin.deps import CurrentAuthor
from app.api.schemas import ApiModel, Envelope, page_meta
from app.api.security import AdminUser, Role, SuperUser, forbidden, require_admin
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
from app.services.audit import diff_fields, write_audit
from app.tenancy.deps import MasterSession, SalonId, TenantSession
from app.timeutils import LocalDatetime

router = APIRouter(prefix="/staff", tags=["staff"], dependencies=[Depends(require_admin)])

WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
MONEY_FIELDS = {"salary", "commission_percent"}


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
    address: str | None = None
    emergency_contact_name: str | None = None
    emergency_contact_phone: str | None = None
    role: Role
    is_superuser: bool = False
    telegram_linked: bool = False
    # Пер-салонная часть (StaffProfile)
    position: str | None = None
    specializations: list[str] = Field(default_factory=list)
    status: StaffStatus = StaffStatus.ACTIVE
    # Только для суперюзера; остальным — null
    salary: Decimal | None = None
    commission_percent: Decimal | None = None
    hire_date: date_type | None = None
    fired_at: date_type | None = None
    color: str | None = None


Person = Master | Administrator


def _staff_out(
    person: Person,
    role: Role,
    profile: StaffProfile | None,
    *,
    show_money: bool,
    binding_active: bool = True,
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
        address=person.address,
        emergency_contact_name=person.emergency_contact_name,
        emergency_contact_phone=person.emergency_contact_phone,
        role=role,
        is_superuser=isinstance(person, Administrator) and person.is_superuser,
        telegram_linked=person.telegram_user_id is not None,
    )
    if profile is not None:
        out.position = profile.position
        out.specializations = profile.specializations or []
        out.status = profile.status
        out.hire_date = profile.hire_date
        out.fired_at = profile.fired_at
        out.color = profile.color
        if show_money:
            out.salary = profile.salary
            out.commission_percent = profile.commission_percent
    if not binding_active:
        out.status = StaffStatus.FIRED
    return out


def _binding(role: Role) -> tuple[Table, str]:
    if role == Role.ADMINISTRATOR:
        return administrator_salons, "administrator_id"
    return master_salons, "master_id"


async def _find_staff(
    master_session: AsyncSession, salon_id: uuid.UUID, staff_id: uuid.UUID
) -> tuple[Person, Role, bool]:
    """Сотрудник салона (мастер или администратор) и активность его привязки."""
    row = (
        await master_session.execute(
            select(Master, master_salons.c.is_active)
            .join(master_salons, master_salons.c.master_id == Master.id)
            .where(Master.id == staff_id, master_salons.c.salon_id == salon_id)
        )
    ).first()
    if row is not None:
        return row[0], Role.MASTER, row[1]
    row = (
        await master_session.execute(
            select(Administrator, administrator_salons.c.is_active)
            .join(
                administrator_salons,
                administrator_salons.c.administrator_id == Administrator.id,
            )
            .where(Administrator.id == staff_id, administrator_salons.c.salon_id == salon_id)
        )
    ).first()
    if row is not None:
        return row[0], Role.ADMINISTRATOR, row[1]
    raise HTTPException(404, "Сотрудник не найден в этом салоне")


def _ensure_can_manage(user: security.AuthenticatedUser, role: Role) -> None:
    if role == Role.ADMINISTRATOR and not user.is_superuser:
        raise forbidden("Администраторами управляет только суперюзер")


def _ensure_money_allowed(user: security.AuthenticatedUser, fields: dict[str, Any]) -> None:
    if not user.is_superuser and any(fields.get(f) is not None for f in MONEY_FIELDS):
        raise forbidden("Зарплату и комиссию меняет только суперюзер")


async def _ensure_email_free(
    master_session: AsyncSession, email: str | None, exclude_id: uuid.UUID | None = None
) -> None:
    """Email — логин: один на всех администраторов и мастеров."""
    if not email:
        return
    for model in (Administrator, Master):
        query = select(model.id).where(func.lower(model.email) == email.lower())
        if exclude_id is not None:
            query = query.where(model.id != exclude_id)
        if await master_session.scalar(query) is not None:
            raise HTTPException(409, "Этот email уже используется другим сотрудником")


# --- Список / CRUD ----------------------------------------------------------


async def _staff_items(
    user: security.AuthenticatedUser,
    salon_id: uuid.UUID,
    master_session: AsyncSession,
    tenant_session: AsyncSession,
    role: Role | None = None,
    query_text: str | None = None,
) -> list[StaffOut]:
    people: list[tuple[Person, Role, bool]] = []
    pattern = f"%{query_text}%" if query_text else None

    if role in (None, Role.MASTER):
        query = (
            select(Master, master_salons.c.is_active)
            .join(master_salons, master_salons.c.master_id == Master.id)
            .where(master_salons.c.salon_id == salon_id, Master.is_active.is_(True))
        )
        if pattern:
            query = query.where(
                or_(
                    Master.first_name.ilike(pattern),
                    Master.last_name.ilike(pattern),
                    Master.phone.ilike(pattern),
                )
            )
        people += [(m, Role.MASTER, a) for m, a in (await master_session.execute(query)).all()]

    if role in (None, Role.ADMINISTRATOR):
        admin_query = (
            select(Administrator, administrator_salons.c.is_active)
            .join(
                administrator_salons,
                administrator_salons.c.administrator_id == Administrator.id,
            )
            .where(
                administrator_salons.c.salon_id == salon_id,
                Administrator.is_active.is_(True),
            )
        )
        if pattern:
            admin_query = admin_query.where(
                or_(
                    Administrator.first_name.ilike(pattern),
                    Administrator.last_name.ilike(pattern),
                    Administrator.phone.ilike(pattern),
                )
            )
        people += [
            (a, Role.ADMINISTRATOR, active)
            for a, active in (await master_session.execute(admin_query)).all()
        ]

    ids = [p.id for p, _, _ in people]
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
    items = [
        _staff_out(
            person,
            r,
            profiles.get(person.id),
            show_money=user.is_superuser,
            binding_active=active,
        )
        for person, r, active in people
    ]
    items.sort(key=lambda i: (i.first_name, i.last_name or ""))
    return items


@router.get("", response_model=Envelope[list[StaffOut]])
async def list_staff(
    user: AdminUser,
    salon_id: SalonId,
    master_session: MasterSession,
    tenant_session: TenantSession,
    role: Role | None = None,
    staff_status: Annotated[StaffStatus | None, Query(alias="status")] = None,
    query_text: Annotated[str | None, Query(alias="query")] = None,
    page: int = 1,
    per_page: Annotated[int, Query(alias="perPage", le=200)] = 50,
) -> Envelope[list[StaffOut]]:
    items = await _staff_items(user, salon_id, master_session, tenant_session, role, query_text)
    if staff_status is not None:
        items = [i for i in items if i.status == staff_status]
    total = len(items)
    start = (page - 1) * per_page
    return Envelope(data=items[start : start + per_page], meta=page_meta(page, per_page, total))


@router.get("/export")
async def export_staff(
    _superuser: SuperUser,
    salon_id: SalonId,
    master_session: MasterSession,
    tenant_session: TenantSession,
) -> StreamingResponse:
    """Excel-выгрузка сотрудников салона (суперюзер)."""
    from openpyxl import Workbook

    items = await _staff_items(_superuser, salon_id, master_session, tenant_session)

    role_names = {Role.MASTER: "Майстер", Role.ADMINISTRATOR: "Адміністратор"}
    status_names = {
        StaffStatus.ACTIVE: "Активний",
        StaffStatus.VACATION: "У відпустці",
        StaffStatus.SICK: "На лікарняному",
        StaffStatus.FIRED: "Звільнений",
    }
    wb = Workbook()
    ws = wb.active
    ws.title = "Співробітники"
    ws.append(
        [
            "Ім'я",
            "Прізвище",
            "Роль",
            "Посада",
            "Спеціалізації",
            "Телефон",
            "Email",
            "Статус",
            "Дата прийому",
            "Дата звільнення",
            "Оклад",
            "Комісія %",
        ]
    )
    for i in items:
        ws.append(
            [
                i.first_name,
                i.last_name,
                role_names[i.role],
                i.position,
                ", ".join(i.specializations),
                i.phone,
                i.email,
                status_names[i.status],
                i.hire_date.isoformat() if i.hire_date else "",
                i.fired_at.isoformat() if i.fired_at else "",
                float(i.salary) if i.salary is not None else None,
                float(i.commission_percent) if i.commission_percent is not None else None,
            ]
        )
    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": 'attachment; filename="staff.xlsx"'},
    )


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
    address: str | None = None
    emergency_contact_name: str | None = None
    emergency_contact_phone: str | None = None
    role: Role = Role.MASTER
    # Только суперюзер и только для администратора
    is_superuser: bool = False
    position: str | None = None
    specializations: list[str] = Field(default_factory=list)
    salary: Decimal | None = None
    commission_percent: Decimal | None = None
    hire_date: date_type | None = None
    color: str | None = None


PERSON_FIELDS = {
    "first_name",
    "middle_name",
    "last_name",
    "phone",
    "additional_phone",
    "email",
    "gender",
    "birth_date",
    "avatar_url",
    "address",
    "emergency_contact_name",
    "emergency_contact_phone",
}

PROFILE_FIELDS = {
    "position",
    "specializations",
    "status",
    "salary",
    "commission_percent",
    "hire_date",
    "color",
}


@router.post("", response_model=Envelope[StaffOut], status_code=status.HTTP_201_CREATED)
async def create_staff(
    body: StaffCreateIn,
    user: AdminUser,
    author: CurrentAuthor,
    salon_id: SalonId,
    master_session: MasterSession,
    tenant_session: TenantSession,
) -> Envelope[StaffOut]:
    _ensure_can_manage(user, body.role)
    _ensure_money_allowed(user, body.model_dump(by_alias=False))
    if body.is_superuser and (body.role != Role.ADMINISTRATOR or not user.is_superuser):
        raise forbidden("Флаг суперюзера выдаёт суперюзер и только администратору")
    await _ensure_email_free(master_session, body.email)

    person_fields = body.model_dump(include=PERSON_FIELDS - {"avatar_url"}, by_alias=False)
    person: Person
    if body.role == Role.ADMINISTRATOR:
        if not body.email or not body.password:
            raise HTTPException(422, "Администратору нужны email и пароль для входа")
        person = Administrator(
            **person_fields,
            password_hash=security.password_hasher.hash(body.password),
            is_superuser=body.is_superuser,
        )
    else:
        person = Master(**person_fields)
        if body.password:
            person.password_hash = security.password_hasher.hash(body.password)

    binding, binding_col = _binding(body.role)
    master_session.add(person)
    await master_session.flush()
    await master_session.execute(
        insert(binding).values(**{binding_col: person.id, "salon_id": salon_id})
    )

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
        details={"role": [None, body.role.value]},
    )
    return Envelope(data=_staff_out(person, body.role, profile, show_money=user.is_superuser))


@router.get("/{staff_id}", response_model=Envelope[StaffOut])
async def get_staff(
    staff_id: uuid.UUID,
    user: AdminUser,
    salon_id: SalonId,
    master_session: MasterSession,
    tenant_session: TenantSession,
) -> Envelope[StaffOut]:
    person, role, active = await _find_staff(master_session, salon_id, staff_id)
    profile = await tenant_session.get(StaffProfile, staff_id)
    return Envelope(
        data=_staff_out(person, role, profile, show_money=user.is_superuser, binding_active=active)
    )


class StaffPatchIn(ApiModel):
    first_name: str | None = None
    middle_name: str | None = None
    last_name: str | None = None
    phone: str | None = None
    additional_phone: str | None = None
    email: str | None = None
    # Новый пароль для входа (пароль администратора меняет только суперюзер)
    password: str | None = Field(default=None, min_length=8)
    gender: Gender | None = None
    birth_date: date_type | None = None
    avatar_url: str | None = None
    address: str | None = None
    emergency_contact_name: str | None = None
    emergency_contact_phone: str | None = None
    is_superuser: bool | None = None
    position: str | None = None
    specializations: list[str] | None = None
    # fired — через DELETE /staff/{id}; active — восстановление уволенного
    status: StaffStatus | None = None
    salary: Decimal | None = None
    commission_percent: Decimal | None = None
    hire_date: date_type | None = None
    color: str | None = None


async def _get_or_create_profile(tenant_session: AsyncSession, staff_id: uuid.UUID) -> StaffProfile:
    profile = await tenant_session.get(StaffProfile, staff_id)
    if profile is None:
        profile = StaffProfile(master_id=staff_id, status=StaffStatus.ACTIVE)
        tenant_session.add(profile)
    return profile


async def _set_binding_active(
    master_session: AsyncSession,
    role: Role,
    staff_id: uuid.UUID,
    salon_id: uuid.UUID,
    active: bool,
) -> None:
    binding, binding_col = _binding(role)
    await master_session.execute(
        update(binding)
        .where(binding.c[binding_col] == staff_id, binding.c.salon_id == salon_id)
        .values(is_active=active)
    )


@router.patch("/{staff_id}", response_model=Envelope[StaffOut])
async def patch_staff(
    staff_id: uuid.UUID,
    body: StaffPatchIn,
    user: AdminUser,
    author: CurrentAuthor,
    salon_id: SalonId,
    master_session: MasterSession,
    tenant_session: TenantSession,
) -> Envelope[StaffOut]:
    person, role, active = await _find_staff(master_session, salon_id, staff_id)
    _ensure_can_manage(user, role)
    updates = body.model_dump(exclude_unset=True, by_alias=False)
    if not user.is_superuser and MONEY_FIELDS & set(updates):
        raise forbidden("Зарплату и комиссию меняет только суперюзер")

    if updates.get("status") == StaffStatus.FIRED:
        raise HTTPException(422, "Увольнение — через DELETE /staff/{id}")
    if "email" in updates:
        await _ensure_email_free(master_session, updates["email"], exclude_id=person.id)
        if role == Role.ADMINISTRATOR and not updates["email"]:
            raise HTTPException(422, "Email администратора — логин, его нельзя очистить")

    changes: dict[str, list] = {}
    if "is_superuser" in updates:
        flag = bool(updates.pop("is_superuser"))
        if role != Role.ADMINISTRATOR or not user.is_superuser:
            raise forbidden("Флаг суперюзера выдаёт суперюзер и только администратору")
        if person.id == user.id and not flag:
            raise HTTPException(409, "Нельзя снять флаг суперюзера с самого себя")
        assert isinstance(person, Administrator)
        if person.is_superuser != flag:
            changes["isSuperuser"] = [person.is_superuser, flag]
            person.is_superuser = flag

    password = updates.pop("password", None)
    if password:
        person.password_hash = security.password_hasher.hash(password)
        changes["password"] = [None, "змінено"]

    profile = await _get_or_create_profile(tenant_session, staff_id)
    person_updates = {k: v for k, v in updates.items() if k in PERSON_FIELDS}
    profile_updates = {k: v for k, v in updates.items() if k in PROFILE_FIELDS}
    changes.update(diff_fields(person, person_updates))
    changes.update(diff_fields(profile, profile_updates))
    for field, value in person_updates.items():
        setattr(person, field, value)
    for field, value in profile_updates.items():
        setattr(profile, field, value)

    # Восстановление уволенного: снова может входить в салон
    if profile_updates.get("status") not in (None, StaffStatus.FIRED) and not active:
        await _set_binding_active(master_session, role, staff_id, salon_id, True)
        profile.fired_at = None
        active = True
        changes.setdefault("status", [StaffStatus.FIRED.value, profile.status.value])

    if changes:
        # Деньги в журнал не пишем: журнал видит любой администратор
        for field in MONEY_FIELDS:
            if field in changes:
                changes[field] = [None, "змінено"]
        write_audit(
            tenant_session,
            entity="staff",
            entity_id=person.id,
            entity_name=person.full_name,
            action=AuditAction.UPDATED,
            author_id=author.id,
            author_name=author.name,
            details=changes,
        )
    return Envelope(
        data=_staff_out(person, role, profile, show_money=user.is_superuser, binding_active=active)
    )


@router.delete("/{staff_id}", response_model=Envelope[StaffOut])
async def fire_staff(
    staff_id: uuid.UUID,
    user: AdminUser,
    author: CurrentAuthor,
    salon_id: SalonId,
    master_session: MasterSession,
    tenant_session: TenantSession,
) -> Envelope[StaffOut]:
    """Увольнение из салона. 409, если у мастера есть будущие записи."""
    person, role, _ = await _find_staff(master_session, salon_id, staff_id)
    _ensure_can_manage(user, role)
    if person.id == user.id:
        raise HTTPException(409, "Нельзя уволить самого себя")

    if role == Role.MASTER:
        future = await tenant_session.scalar(
            select(func.count())
            .select_from(Record)
            .where(
                Record.master_id == staff_id,
                Record.start_at > datetime.now(UTC),
                Record.status.in_(
                    [RecordStatus.SCHEDULED, RecordStatus.CONFIRMED, RecordStatus.ARRIVED]
                ),
            )
        )
        if future:
            raise HTTPException(
                409, f"У мастера {future} будущих записей — отмените или перенесите их"
            )

    profile = await _get_or_create_profile(tenant_session, staff_id)
    profile.status = StaffStatus.FIRED
    profile.fired_at = datetime.now(UTC).date()
    await _set_binding_active(master_session, role, staff_id, salon_id, False)

    write_audit(
        tenant_session,
        entity="staff",
        entity_id=person.id,
        entity_name=person.full_name,
        action=AuditAction.UPDATED,
        author_id=author.id,
        author_name=author.name,
        details={"status": [None, StaffStatus.FIRED.value]},
    )
    return Envelope(
        data=_staff_out(person, role, profile, show_money=user.is_superuser, binding_active=False)
    )


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


def _exception_out(e: ScheduleException) -> ExceptionOut:
    return ExceptionOut(
        id=e.id,
        date_from=e.date_from,
        date_to=e.date_to,
        type=e.type,
        start=e.start_time,
        end=e.end_time,
        comment=e.comment,
    )


@router.get("/{staff_id}/schedule", response_model=Envelope[ScheduleOut])
async def get_schedule(
    staff_id: uuid.UUID,
    salon_id: SalonId,
    master_session: MasterSession,
    tenant_session: TenantSession,
) -> Envelope[ScheduleOut]:
    await _find_staff(master_session, salon_id, staff_id)
    return Envelope(data=await _schedule(tenant_session, staff_id))


async def _schedule(tenant_session: AsyncSession, staff_id: uuid.UUID) -> ScheduleOut:
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
        _exception_out(e)
        for e in await tenant_session.scalars(
            select(ScheduleException)
            .where(ScheduleException.master_id == staff_id)
            .order_by(ScheduleException.date_from)
        )
    ]
    return ScheduleOut(week=week, exceptions=exceptions)


@router.post("/{staff_id}/schedule", response_model=Envelope[ScheduleOut])
async def save_schedule(
    staff_id: uuid.UUID,
    body: dict[str, DayScheduleIn],
    user: AdminUser,
    salon_id: SalonId,
    master_session: MasterSession,
    tenant_session: TenantSession,
) -> Envelope[ScheduleOut]:
    _, role, _ = await _find_staff(master_session, salon_id, staff_id)
    _ensure_can_manage(user, role)
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
    return Envelope(data=await _schedule(tenant_session, staff_id))


class ExceptionIn(ApiModel):
    date_from: date_type
    date_to: date_type
    type: ScheduleExceptionType
    start: time | None = None
    end: time | None = None
    comment: str | None = None


def _validate_exception(date_from: date_type, date_to: date_type) -> None:
    if date_to < date_from:
        raise HTTPException(422, "Дата окончания раньше даты начала")


@router.post(
    "/{staff_id}/schedule/exceptions",
    response_model=Envelope[ExceptionOut],
    status_code=status.HTTP_201_CREATED,
)
async def add_exception(
    staff_id: uuid.UUID,
    body: ExceptionIn,
    user: AdminUser,
    salon_id: SalonId,
    master_session: MasterSession,
    tenant_session: TenantSession,
) -> Envelope[ExceptionOut]:
    _, role, _ = await _find_staff(master_session, salon_id, staff_id)
    _ensure_can_manage(user, role)
    _validate_exception(body.date_from, body.date_to)
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
    return Envelope(data=_exception_out(exc))


async def _get_exception(
    tenant_session: AsyncSession, staff_id: uuid.UUID, exception_id: uuid.UUID
) -> ScheduleException:
    exc = await tenant_session.get(ScheduleException, exception_id)
    if exc is None or exc.master_id != staff_id:
        raise HTTPException(404, "Исключение не найдено")
    return exc


class ExceptionPatchIn(ApiModel):
    date_from: date_type | None = None
    date_to: date_type | None = None
    type: ScheduleExceptionType | None = None
    start: time | None = None
    end: time | None = None
    comment: str | None = None


@router.patch(
    "/{staff_id}/schedule/exceptions/{exception_id}", response_model=Envelope[ExceptionOut]
)
async def patch_exception(
    staff_id: uuid.UUID,
    exception_id: uuid.UUID,
    body: ExceptionPatchIn,
    user: AdminUser,
    salon_id: SalonId,
    master_session: MasterSession,
    tenant_session: TenantSession,
) -> Envelope[ExceptionOut]:
    _, role, _ = await _find_staff(master_session, salon_id, staff_id)
    _ensure_can_manage(user, role)
    exc = await _get_exception(tenant_session, staff_id, exception_id)
    columns = {"start": "start_time", "end": "end_time"}
    for field, value in body.model_dump(exclude_unset=True, by_alias=False).items():
        setattr(exc, columns.get(field, field), value)
    _validate_exception(exc.date_from, exc.date_to)
    return Envelope(data=_exception_out(exc))


@router.delete(
    "/{staff_id}/schedule/exceptions/{exception_id}", status_code=status.HTTP_204_NO_CONTENT
)
async def delete_exception(
    staff_id: uuid.UUID,
    exception_id: uuid.UUID,
    user: AdminUser,
    salon_id: SalonId,
    master_session: MasterSession,
    tenant_session: TenantSession,
) -> None:
    _, role, _ = await _find_staff(master_session, salon_id, staff_id)
    _ensure_can_manage(user, role)
    exc = await _get_exception(tenant_session, staff_id, exception_id)
    await tenant_session.delete(exc)


# --- Статистика -------------------------------------------------------------


class StaffStatsOut(ApiModel):
    visits: int
    revenue: Decimal
    avg_check: Decimal
    rating: float | None


@router.get("/{staff_id}/stats", response_model=Envelope[StaffStatsOut])
async def staff_stats(
    staff_id: uuid.UUID,
    _superuser: SuperUser,
    tenant_session: TenantSession,
    date_from: Annotated[LocalDatetime | None, Query(alias="dateFrom")] = None,
    date_to: Annotated[LocalDatetime | None, Query(alias="dateTo")] = None,
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
