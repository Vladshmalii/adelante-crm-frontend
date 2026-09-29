"""Записи: календарь и вкладка «Записи» на overview — один домен /records.

Права (ACCESS.md): мастер видит и меняет только свои записи, создаёт только
к себе и не может сменить мастера; оплату проводит только администратор.
"""

import uuid
from datetime import UTC, datetime
from datetime import date as date_type
from decimal import Decimal
from pathlib import Path as FsPath
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, status
from pydantic import Field
from sqlalchemy import exists, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.admin.deps import CurrentAuthor, ensure_own_record
from app.api.schemas import ApiModel, Envelope, PersonRef, page_meta
from app.api.security import AdminUser, CurrentUser, forbidden, require_salon_access
from app.config import get_settings
from app.models.master import Client
from app.models.shard import (
    AuditAction,
    AuditLog,
    PaymentStatus,
    Record,
    RecordImportance,
    RecordService,
    RecordSource,
    RecordStatus,
    Service,
    ShiftKind,
    StaffProfile,
    StaffShift,
)
from app.services import records as records_service
from app.services import slots as slots_service
from app.services import visits as visits_service
from app.services.audit import diff_fields, write_audit
from app.tenancy.deps import MasterSession, SalonId, TenantSession
from app.timeutils import LocalDatetime, now_local, to_local

router = APIRouter(tags=["records"], dependencies=[Depends(require_salon_access)])


# --- Схемы ------------------------------------------------------------------


class RecordServiceOut(ApiModel):
    """Услуга в записи: снапшот названия/цены/длительности + текущие категория и цвет."""

    id: uuid.UUID
    name: str
    price: Decimal
    duration_minutes: int
    category: str | None = None
    color: str | None = None


class MasterRef(ApiModel):
    id: uuid.UUID
    name: str
    color: str | None = None


class ClientRef(ApiModel):
    id: uuid.UUID
    name: str
    phone: str


class RecordOut(ApiModel):
    id: uuid.UUID
    status: RecordStatus
    source: RecordSource
    payment_status: PaymentStatus
    importance: RecordImportance
    start_at: datetime
    end_at: datetime
    actual_start_at: datetime | None
    actual_end_at: datetime | None
    # null — запись «Без майстра»
    master: MasterRef | None
    client: ClientRef
    services: list[RecordServiceOut]
    price: Decimal
    total_amount: Decimal
    visitor_name: str | None
    visitor_phone: str | None
    comment: str | None
    created_at: datetime
    created_by: PersonRef
    # Напоминание клиенту в Telegram за 30 минут: включено ли, когда ушло,
    # и привязан ли клиент к боту (без привязки напоминание не дойдёт)
    reminder_enabled: bool
    reminder_sent_at: datetime | None
    client_telegram_linked: bool
    # Запись мастера не помещается целиком в его смену этого дня (или смены нет).
    # Только для отображения: запись вне смены из админки разрешена
    outside_shift: bool


class HistoryItemOut(ApiModel):
    date: datetime
    author: str | None
    action: str
    details: dict | None


class PhotoOut(ApiModel):
    id: uuid.UUID
    url: str


class RecordDetailOut(RecordOut):
    internal_notes: str | None
    closed_by: PersonRef
    closed_at: datetime | None
    photos: list[PhotoOut]
    history: list[HistoryItemOut]


class _Refs:
    """Цвета мастеров и текущие категория/цвет услуг — для пачки записей."""

    def __init__(
        self,
        colors: dict[uuid.UUID, str | None],
        services: dict[uuid.UUID, Service],
        telegram_clients: set[uuid.UUID],
        shifts: dict[tuple[uuid.UUID, date_type], StaffShift],
    ) -> None:
        self.colors = colors
        self.services = services
        self.telegram_clients = telegram_clients
        self.shifts = shifts

    def outside_shift(self, record: Record) -> bool:
        if record.master_id is None:
            return False
        start, end = to_local(record.start_at), to_local(record.end_at)
        shift = self.shifts.get((record.master_id, start.date()))
        if shift is None or shift.kind != ShiftKind.SHIFT or end.date() != start.date():
            return True
        assert shift.start_time is not None and shift.end_time is not None
        return not (shift.start_time <= start.time() and end.time() <= shift.end_time)


async def _load_refs(
    tenant_session: AsyncSession, master_session: AsyncSession, records: list[Record]
) -> _Refs:
    master_ids = {r.master_id for r in records if r.master_id}
    service_ids = {s.service_id for r in records for s in r.services}
    colors: dict[uuid.UUID, str | None] = {}
    if master_ids:
        rows = await tenant_session.execute(
            select(StaffProfile.master_id, StaffProfile.color).where(
                StaffProfile.master_id.in_(master_ids)
            )
        )
        colors = {master_id: color for master_id, color in rows.all()}
    services: dict[uuid.UUID, Service] = {}
    if service_ids:
        services = {
            s.id: s
            for s in await tenant_session.scalars(
                select(Service).where(Service.id.in_(service_ids))
            )
        }
    client_ids = {r.client_id for r in records}
    telegram_clients: set[uuid.UUID] = set()
    if client_ids:
        telegram_clients = set(
            await master_session.scalars(
                select(Client.id).where(
                    Client.id.in_(client_ids), Client.telegram_user_id.is_not(None)
                )
            )
        )
    shifts: dict[tuple[uuid.UUID, date_type], StaffShift] = {}
    keys = {(r.master_id, to_local(r.start_at).date()) for r in records if r.master_id}
    if keys:
        for shift in await tenant_session.scalars(
            select(StaffShift).where(
                StaffShift.staff_id.in_({m for m, _ in keys}),
                StaffShift.date.in_({d for _, d in keys}),
            )
        ):
            shifts[(shift.staff_id, shift.date)] = shift
    return _Refs(colors, services, telegram_clients, shifts)


def _record_out(record: Record, refs: _Refs) -> RecordOut:
    services = []
    for item in record.services:
        current = refs.services.get(item.service_id)
        services.append(
            RecordServiceOut(
                id=item.service_id,
                name=item.name,
                price=item.price,
                duration_minutes=item.duration_minutes,
                category=current.category if current else None,
                color=current.color if current else None,
            )
        )
    return RecordOut(
        id=record.id,
        status=record.status,
        source=record.source,
        payment_status=record.payment_status,
        importance=record.importance,
        start_at=record.start_at,
        end_at=record.end_at,
        actual_start_at=record.actual_start_at,
        actual_end_at=record.actual_end_at,
        master=(
            MasterRef(
                id=record.master_id,
                name=record.master_name or "—",
                color=refs.colors.get(record.master_id),
            )
            if record.master_id
            else None
        ),
        client=ClientRef(id=record.client_id, name=record.client_name, phone=record.client_phone),
        services=services,
        price=record.price,
        total_amount=record.total_amount,
        visitor_name=record.visitor_name,
        visitor_phone=record.visitor_phone,
        comment=record.comment,
        created_at=record.created_at,
        created_by=PersonRef(
            id=str(record.created_by) if record.created_by else None,
            name=record.created_by_name,
        ),
        reminder_enabled=record.reminder_enabled,
        reminder_sent_at=record.reminder_sent_at,
        client_telegram_linked=record.client_id in refs.telegram_clients,
        outside_shift=refs.outside_shift(record),
    )


async def _one_out(
    tenant_session: AsyncSession, master_session: AsyncSession, record: Record
) -> RecordOut:
    await tenant_session.flush()
    await tenant_session.refresh(
        record, attribute_names=["services", "created_at", "reminder_enabled"]
    )
    return _record_out(record, await _load_refs(tenant_session, master_session, [record]))


# --- Список и создание ------------------------------------------------------


@router.get("/records", response_model=Envelope[list[RecordOut]])
async def list_records(
    user: CurrentUser,
    master_session: MasterSession,
    tenant_session: TenantSession,
    date_from: Annotated[LocalDatetime | None, Query(alias="dateFrom")] = None,
    date_to: Annotated[LocalDatetime | None, Query(alias="dateTo")] = None,
    created_from: Annotated[LocalDatetime | None, Query(alias="createdFrom")] = None,
    created_to: Annotated[LocalDatetime | None, Query(alias="createdTo")] = None,
    master_id: Annotated[uuid.UUID | None, Query(alias="masterId")] = None,
    without_master: Annotated[bool, Query(alias="withoutMaster")] = False,
    record_status: Annotated[RecordStatus | None, Query(alias="status")] = None,
    source: RecordSource | None = None,
    payment_status: Annotated[PaymentStatus | None, Query(alias="paymentStatus")] = None,
    client_query: Annotated[str | None, Query(alias="clientQuery")] = None,
    service_category: Annotated[str | None, Query(alias="serviceCategory")] = None,
    page: int = 1,
    per_page: Annotated[int, Query(alias="perPage", le=500)] = 50,
) -> Envelope[list[RecordOut]]:
    query = select(Record)
    if user.is_master:
        # Мастер видит только свои записи; очередь «Без майстра» ему недоступна
        if without_master or (master_id is not None and master_id != user.id):
            return Envelope(data=[], meta=page_meta(page, per_page, 0))
        master_id = user.id
    if date_from is not None:
        query = query.where(Record.start_at >= date_from)
    if date_to is not None:
        query = query.where(Record.start_at < date_to)
    if created_from is not None:
        query = query.where(Record.created_at >= created_from)
    if created_to is not None:
        query = query.where(Record.created_at < created_to)
    if without_master:
        query = query.where(Record.master_id.is_(None))
    elif master_id is not None:
        query = query.where(Record.master_id == master_id)
    if record_status is not None:
        query = query.where(Record.status == record_status)
    if source is not None:
        query = query.where(Record.source == source)
    if payment_status is not None:
        query = query.where(Record.payment_status == payment_status)
    if client_query:
        pattern = f"%{client_query}%"
        query = query.where(Record.client_name.ilike(pattern) | Record.client_phone.ilike(pattern))
    if service_category:
        # Хотя бы одна услуга записи — из категории (категория — текущая у услуги)
        query = query.where(
            exists()
            .where(RecordService.record_id == Record.id)
            .where(Service.id == RecordService.service_id, Service.category == service_category)
        )

    total = await tenant_session.scalar(select(func.count()).select_from(query.subquery()))
    records = list(
        await tenant_session.scalars(
            query.order_by(Record.start_at).offset((page - 1) * per_page).limit(per_page)
        )
    )
    refs = await _load_refs(tenant_session, master_session, records)
    return Envelope(
        data=[_record_out(r, refs) for r in records],
        meta=page_meta(page, per_page, total or 0),
    )


class NewClientIn(ApiModel):
    name: str = Field(min_length=1, max_length=255)
    phone: str = Field(min_length=5, max_length=32)


class RecordCreateIn(ApiModel):
    client_id: uuid.UUID | None = None
    new_client: NewClientIn | None = None
    # Не указан — запись «Без майстра» (только администратор)
    master_id: uuid.UUID | None = None
    # Услуги по порядку выполнения; длительность и цена — сумма
    service_ids: list[uuid.UUID] = Field(min_length=1)
    start_at: LocalDatetime
    source: RecordSource = RecordSource.ADMIN
    importance: RecordImportance = RecordImportance.STANDARD
    comment: str | None = None
    visitor_name: str | None = None
    visitor_phone: str | None = None
    reminder_enabled: bool = True


@router.post("/records", response_model=Envelope[RecordOut], status_code=status.HTTP_201_CREATED)
async def create_record(
    body: RecordCreateIn,
    user: CurrentUser,
    author: CurrentAuthor,
    salon_id: SalonId,
    master_session: MasterSession,
    tenant_session: TenantSession,
) -> Envelope[RecordOut]:
    if body.source not in (RecordSource.ADMIN, RecordSource.PHONE, RecordSource.WALK_IN):
        raise HTTPException(422, "Недопустиме джерело для адмінки")
    if body.client_id is None and body.new_client is None:
        raise HTTPException(422, "Вкажіть clientId або newClient")

    master_id = body.master_id
    if user.is_master:
        if master_id is not None and master_id != user.id:
            raise forbidden("Майстер створює записи лише до себе")
        master_id = user.id

    try:
        if body.client_id is None:
            assert body.new_client is not None  # гарантировано проверкой выше
            client = await records_service.get_or_create_client(
                master_session, name=body.new_client.name, phone=body.new_client.phone
            )
            client_id = client.id
        else:
            client_id = body.client_id

        # Из админки проверка занятости слота не выполняется —
        # администратор может сознательно уплотнить расписание мастера
        record = await records_service.create_record(
            master_session=master_session,
            tenant_session=tenant_session,
            salon_id=salon_id,
            data=records_service.NewRecord(
                master_id=master_id,
                service_ids=body.service_ids,
                client_id=client_id,
                start_at=body.start_at,
                comment=body.comment,
                importance=body.importance,
                visitor_name=body.visitor_name,
                visitor_phone=body.visitor_phone,
                reminder_enabled=body.reminder_enabled,
                created_by=author.id,
                created_by_name=author.name,
            ),
            source=body.source,
        )
    except records_service.MasterUnavailable:
        raise HTTPException(422, "Майстра не знайдено, він неактивний або не працює в цьому салоні")
    except records_service.ClientInactive:
        raise HTTPException(422, "Клієнта не знайдено або деактивовано")
    except records_service.ServiceUnavailable:
        raise HTTPException(422, "Послугу не знайдено або вона неактивна")
    except records_service.MasterOnLeave as exc:
        raise HTTPException(409, str(exc))

    return Envelope(data=await _one_out(tenant_session, master_session, record))


# --- Детали, изменение, статусы --------------------------------------------


async def _get_record(tenant_session, record_id: uuid.UUID, user: CurrentUser) -> Record:
    record = await tenant_session.get(Record, record_id)
    if record is None:
        raise HTTPException(404, "Запис не знайдено")
    ensure_own_record(user, record)
    return record


@router.get("/records/{record_id}", response_model=Envelope[RecordDetailOut])
async def get_record(
    record_id: uuid.UUID,
    user: CurrentUser,
    master_session: MasterSession,
    tenant_session: TenantSession,
) -> Envelope[RecordDetailOut]:
    record = await _get_record(tenant_session, record_id, user)
    history = await tenant_session.scalars(
        select(AuditLog)
        .where(AuditLog.entity == "record", AuditLog.entity_id == str(record_id))
        .order_by(AuditLog.created_at.desc())
    )
    base = _record_out(record, await _load_refs(tenant_session, master_session, [record]))
    return Envelope(
        data=RecordDetailOut(
            **base.model_dump(by_alias=False),
            internal_notes=record.internal_notes,
            closed_by=PersonRef(
                id=str(record.closed_by) if record.closed_by else None,
                name=record.closed_by_name,
            ),
            closed_at=record.closed_at,
            photos=[PhotoOut.model_validate(p) for p in record.photos],
            history=[
                HistoryItemOut(
                    date=h.created_at,
                    author=h.author_name,
                    action=h.action.value,
                    details=h.details,
                )
                for h in history
            ],
        )
    )


class RecordPatchIn(ApiModel):
    start_at: LocalDatetime | None = None
    # null — снять мастера (запись уходит в очередь «Без майстра»)
    master_id: uuid.UUID | None = None
    service_ids: list[uuid.UUID] | None = Field(default=None, min_length=1)
    importance: RecordImportance | None = None
    comment: str | None = None
    internal_notes: str | None = None
    visitor_name: str | None = None
    visitor_phone: str | None = None
    reminder_enabled: bool | None = None


PLAIN_PATCH_FIELDS = (
    "importance",
    "comment",
    "internal_notes",
    "visitor_name",
    "visitor_phone",
    "reminder_enabled",
)


@router.patch("/records/{record_id}", response_model=Envelope[RecordOut])
async def patch_record(
    record_id: uuid.UUID,
    body: RecordPatchIn,
    user: CurrentUser,
    author: CurrentAuthor,
    salon_id: SalonId,
    master_session: MasterSession,
    tenant_session: TenantSession,
) -> Envelope[RecordOut]:
    record = await _get_record(tenant_session, record_id, user)
    if record.status in (RecordStatus.COMPLETED, RecordStatus.CANCELLED):
        raise HTTPException(409, "Завершений або скасований запис не можна змінювати")

    changes: dict[str, list] = {}
    previous_master_id = record.master_id
    previous_start_at = record.start_at

    if "master_id" in body.model_fields_set and body.master_id != record.master_id:
        if user.is_master:
            raise forbidden("Майстер не може передати запис іншому майстру")
        new_name: str | None = None
        if body.master_id is not None:
            try:
                master = await records_service.validate_master(
                    master_session, body.master_id, salon_id
                )
            except records_service.MasterUnavailable:
                raise HTTPException(422, "Майстер недоступний")
            new_name = master.full_name
        changes["master"] = [record.master_name, new_name]
        record.master_id = body.master_id
        record.master_name = new_name

    if body.start_at is not None and body.start_at != record.start_at:
        changes["startAt"] = [record.start_at.isoformat(), body.start_at.isoformat()]
        records_service.reschedule(record, body.start_at)
        # Перенос на будущее — напоминание уйдёт заново к новому времени
        if record.start_at > datetime.now(UTC):
            record.reminder_sent_at = None

    if body.service_ids is not None:
        current = [s.service_id for s in record.services]
        if list(dict.fromkeys(body.service_ids)) != current:
            try:
                services = await records_service.load_services(tenant_session, body.service_ids)
            except records_service.ServiceUnavailable:
                raise HTTPException(422, "Послугу не знайдено або вона неактивна")
            changes["services"] = [
                [s.name for s in record.services],
                [s.name for s in services],
            ]
            records_service.apply_services(record, services)

    if record.master_id is not None and ("master" in changes or "startAt" in changes):
        try:
            await records_service.ensure_master_not_on_leave(
                tenant_session, record.master_id, record.start_at
            )
        except records_service.MasterOnLeave as exc:
            raise HTTPException(409, str(exc))

    plain = body.model_dump(include=set(PLAIN_PATCH_FIELDS), exclude_unset=True, by_alias=False)
    if plain.get("reminder_enabled", False) is None:
        raise HTTPException(422, "Поле reminderEnabled не можна очистити")
    changes.update(diff_fields(record, plain))
    for field, value in plain.items():
        setattr(record, field, value)

    if changes:
        write_audit(
            tenant_session,
            entity="record",
            entity_id=record.id,
            entity_name=records_service.record_title(record),
            action=AuditAction.UPDATED,
            author_id=author.id,
            author_name=author.name,
            details=changes,
        )
        if "master" in changes:
            change = "reassigned"
        elif "startAt" in changes or "services" in changes:
            change = "rescheduled"
        else:
            change = "updated"
        records_service.emit_record_updated(
            tenant_session,
            salon_id=salon_id,
            record=record,
            change=change,
            actor_id=author.id,
            previous_master_id=previous_master_id if "master" in changes else None,
            previous_start_at=previous_start_at if "startAt" in changes else None,
            extra={"changes": list(changes)},
        )

    return Envelope(data=await _one_out(tenant_session, master_session, record))


class StatusIn(ApiModel):
    status: RecordStatus


@router.post("/records/{record_id}/status", response_model=Envelope[RecordOut])
async def set_status(
    record_id: uuid.UUID,
    body: StatusIn,
    user: CurrentUser,
    author: CurrentAuthor,
    salon_id: SalonId,
    master_session: MasterSession,
    tenant_session: TenantSession,
) -> Envelope[RecordOut]:
    if body.status == RecordStatus.COMPLETED:
        raise HTTPException(422, "Завершення — через POST /records/{id}/complete")
    record = await _get_record(tenant_session, record_id, user)
    if record.status == RecordStatus.COMPLETED:
        raise HTTPException(409, "Запис уже завершено")
    if record.status == body.status:
        return Envelope(data=await _one_out(tenant_session, master_session, record))

    old = record.status
    record.status = body.status
    if body.status == RecordStatus.ARRIVED:
        record.actual_start_at = datetime.now(UTC)

    write_audit(
        tenant_session,
        entity="record",
        entity_id=record.id,
        entity_name=records_service.record_title(record),
        action=AuditAction.UPDATED,
        author_id=author.id,
        author_name=author.name,
        details={"status": [old.value, body.status.value]},
    )
    records_service.emit_record_updated(
        tenant_session,
        salon_id=salon_id,
        record=record,
        change="cancelled" if body.status == RecordStatus.CANCELLED else "status",
        actor_id=author.id,
        extra={"previous_status": old.value},
    )
    return Envelope(data=await _one_out(tenant_session, master_session, record))


class CompleteIn(ApiModel):
    notes: str | None = None
    photo_urls: list[str] = Field(default_factory=list)


@router.post("/records/{record_id}/complete", response_model=Envelope[RecordOut])
async def complete_record(
    record_id: uuid.UUID,
    body: CompleteIn,
    user: CurrentUser,
    author: CurrentAuthor,
    salon_id: SalonId,
    master_session: MasterSession,
    tenant_session: TenantSession,
) -> Envelope[RecordOut]:
    """Завершение визита — без оплаты: запись получает completed + unpaid."""
    record = await _get_record(tenant_session, record_id, user)
    try:
        await visits_service.complete_record(
            tenant_session,
            salon_id=salon_id,
            record=record,
            notes=body.notes,
            photo_urls=body.photo_urls,
            author_id=author.id,
            author_name=author.name,
        )
    except visits_service.CompletionError as exc:
        raise HTTPException(409, str(exc))
    return Envelope(data=await _one_out(tenant_session, master_session, record))


class PaymentIn(ApiModel):
    payment_method_id: uuid.UUID
    amount: Decimal = Field(gt=0)


class RecordPaymentIn(ApiModel):
    # Сумма оплат должна равняться сумме записи: частичной оплаты нет
    payments: list[PaymentIn] = Field(min_length=1)


class ReceiptRef(ApiModel):
    id: uuid.UUID
    number: str
    amount: Decimal


class RecordPaymentOut(ApiModel):
    record: RecordOut
    receipt: ReceiptRef


@router.post("/records/{record_id}/payment", response_model=Envelope[RecordPaymentOut])
async def pay_record(
    record_id: uuid.UUID,
    body: RecordPaymentIn,
    user: AdminUser,
    author: CurrentAuthor,
    salon_id: SalonId,
    master_session: MasterSession,
    tenant_session: TenantSession,
) -> Envelope[RecordPaymentOut]:
    """Оплата завершённого визита: чек с recordId на полную сумму (администратор)."""
    record = await _get_record(tenant_session, record_id, user)
    try:
        receipt = await visits_service.pay_record(
            tenant_session,
            salon_id=salon_id,
            record=record,
            payments=[
                visits_service.PaymentPart(payment_method_id=p.payment_method_id, amount=p.amount)
                for p in body.payments
            ],
            author_id=author.id,
            author_name=author.name,
        )
    except visits_service.PaymentError as exc:
        raise HTTPException(409, str(exc))
    return Envelope(
        data=RecordPaymentOut(
            record=await _one_out(tenant_session, master_session, record),
            receipt=ReceiptRef(id=receipt.id, number=receipt.number, amount=receipt.amount),
        )
    )


# --- Слоты и загрузки -------------------------------------------------------


class SlotOut(ApiModel):
    start_at: datetime
    label: str


@router.get("/masters/{master_id}/slots", response_model=Envelope[list[SlotOut]])
async def master_slots(
    master_id: uuid.UUID,
    day: Annotated[date_type, Query(alias="date")],
    user: CurrentUser,
    tenant_session: TenantSession,
    service_ids: Annotated[list[uuid.UUID], Query(alias="serviceIds", min_length=1)],
) -> Envelope[list[SlotOut]]:
    """Свободное время мастера на дату под набор услуг (длительность — сумма)."""
    if user.is_master and master_id != user.id:
        raise forbidden()
    try:
        services = await records_service.load_services(tenant_session, service_ids)
    except records_service.ServiceUnavailable:
        raise HTTPException(422, "Послугу не знайдено або вона неактивна")
    slots = await slots_service.free_slots(
        tenant_session,
        master_id=master_id,
        day=day,
        duration=records_service.total_duration(services),
        not_before=now_local() if day == now_local().date() else None,
    )
    return Envelope(data=[SlotOut(start_at=s.start_at, label=s.label) for s in slots])


class UploadOut(ApiModel):
    id: uuid.UUID
    url: str


ALLOWED_UPLOAD_TYPES = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}
MAX_UPLOAD_BYTES = 10 * 1024 * 1024


@router.post("/uploads", response_model=Envelope[UploadOut], status_code=status.HTTP_201_CREATED)
async def upload_file(file: UploadFile, salon_id: SalonId) -> Envelope[UploadOut]:
    ext = ALLOWED_UPLOAD_TYPES.get(file.content_type or "")
    if ext is None:
        raise HTTPException(422, "Допустимі лише зображення: JPEG, PNG, WebP")
    content = await file.read()
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(413, "Файл більший за 10 МБ")

    file_id = uuid.uuid4()
    directory = FsPath(get_settings().upload_dir) / str(salon_id)
    directory.mkdir(parents=True, exist_ok=True)
    (directory / f"{file_id}{ext}").write_bytes(content)
    return Envelope(data=UploadOut(id=file_id, url=f"/uploads/{salon_id}/{file_id}{ext}"))
