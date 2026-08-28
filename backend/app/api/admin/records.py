"""Записи: календарь и вкладка «Записи» на overview — один домен /records."""

import uuid
from datetime import UTC, datetime, timedelta
from datetime import date as date_type
from decimal import Decimal
from pathlib import Path as FsPath
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, status
from pydantic import Field
from sqlalchemy import func, select

from app.api.admin.deps import CurrentAuthor
from app.api.schemas import ApiModel, Envelope, PersonRef, page_meta
from app.api.security import require_salon_access
from app.config import get_settings
from app.models.master import Salon
from app.models.shard import (
    AuditAction,
    AuditLog,
    PaymentStatus,
    Record,
    RecordImportance,
    RecordSource,
    RecordStatus,
    Service,
    StaffProfile,
)
from app.notifications.outbox import RECORD_UPDATED, add_outbox_event
from app.services import records as records_service
from app.services import slots as slots_service
from app.services import visits as visits_service
from app.services.audit import diff_fields, write_audit
from app.tenancy.deps import MasterSession, SalonId, TenantSession

router = APIRouter(tags=["records"], dependencies=[Depends(require_salon_access)])


# --- Схемы ------------------------------------------------------------------


class ServiceRef(ApiModel):
    id: uuid.UUID
    name: str
    category: str
    color: str | None


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
    master: MasterRef
    client: ClientRef
    service: ServiceRef
    price: Decimal
    total_amount: Decimal
    visitor_name: str | None
    visitor_phone: str | None
    comment: str | None
    created_at: datetime
    created_by: PersonRef


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


def _record_out(
    record: Record, service: Service, master_colors: dict[uuid.UUID, str | None]
) -> RecordOut:
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
        master=MasterRef(
            id=record.master_id,
            name=record.master_name,
            color=master_colors.get(record.master_id),
        ),
        client=ClientRef(id=record.client_id, name=record.client_name, phone=record.client_phone),
        service=ServiceRef.model_validate(service),
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
    )


async def _master_colors(tenant_session, master_ids: set[uuid.UUID]) -> dict[uuid.UUID, str | None]:
    if not master_ids:
        return {}
    rows = await tenant_session.execute(
        select(StaffProfile.master_id, StaffProfile.color).where(
            StaffProfile.master_id.in_(master_ids)
        )
    )
    return dict(rows.all())


# --- Список и создание ------------------------------------------------------


@router.get("/records", response_model=Envelope[list[RecordOut]])
async def list_records(
    tenant_session: TenantSession,
    date_from: Annotated[datetime | None, Query(alias="dateFrom")] = None,
    date_to: Annotated[datetime | None, Query(alias="dateTo")] = None,
    created_from: Annotated[datetime | None, Query(alias="createdFrom")] = None,
    created_to: Annotated[datetime | None, Query(alias="createdTo")] = None,
    master_id: Annotated[uuid.UUID | None, Query(alias="masterId")] = None,
    record_status: Annotated[RecordStatus | None, Query(alias="status")] = None,
    source: RecordSource | None = None,
    payment_status: Annotated[PaymentStatus | None, Query(alias="paymentStatus")] = None,
    client_query: Annotated[str | None, Query(alias="clientQuery")] = None,
    page: int = 1,
    per_page: Annotated[int, Query(alias="perPage", le=200)] = 50,
) -> Envelope[list[RecordOut]]:
    query = select(Record, Service).join(Service, Record.service_id == Service.id)
    if date_from is not None:
        query = query.where(Record.start_at >= date_from)
    if date_to is not None:
        query = query.where(Record.start_at < date_to)
    if created_from is not None:
        query = query.where(Record.created_at >= created_from)
    if created_to is not None:
        query = query.where(Record.created_at < created_to)
    if master_id is not None:
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

    total = await tenant_session.scalar(select(func.count()).select_from(query.subquery()))
    rows = (
        await tenant_session.execute(
            query.order_by(Record.start_at).offset((page - 1) * per_page).limit(per_page)
        )
    ).all()

    colors = await _master_colors(tenant_session, {r.Record.master_id for r in rows})
    return Envelope(
        data=[_record_out(r.Record, r.Service, colors) for r in rows],
        meta=page_meta(page, per_page, total or 0),
    )


class NewClientIn(ApiModel):
    name: str = Field(min_length=1, max_length=255)
    phone: str = Field(min_length=5, max_length=32)


class RecordCreateIn(ApiModel):
    client_id: uuid.UUID | None = None
    new_client: NewClientIn | None = None
    master_id: uuid.UUID
    service_id: uuid.UUID
    start_at: datetime
    source: RecordSource = RecordSource.ADMIN
    importance: RecordImportance = RecordImportance.STANDARD
    comment: str | None = None
    visitor_name: str | None = None
    visitor_phone: str | None = None


@router.post("/records", response_model=Envelope[RecordOut], status_code=status.HTTP_201_CREATED)
async def create_record(
    body: RecordCreateIn,
    author: CurrentAuthor,
    salon_id: SalonId,
    master_session: MasterSession,
    tenant_session: TenantSession,
) -> Envelope[RecordOut]:
    if body.source not in (RecordSource.ADMIN, RecordSource.PHONE, RecordSource.WALK_IN):
        raise HTTPException(422, "Недопустимый источник для админки")
    if body.client_id is None and body.new_client is None:
        raise HTTPException(422, "Укажите clientId или newClient")

    try:
        if body.client_id is None:
            assert body.new_client is not None  # гарантировано проверкой выше
            client = await records_service.get_or_create_client(
                master_session, name=body.new_client.name, phone=body.new_client.phone
            )
            client_id = client.id
        else:
            client_id = body.client_id

        # source=admin/phone/walk_in: проверка занятости слота не выполняется —
        # админ может сознательно уплотнить расписание мастера
        record = await records_service.create_record(
            master_session=master_session,
            tenant_session=tenant_session,
            salon_id=salon_id,
            data=records_service.NewRecord(
                master_id=body.master_id,
                service_id=body.service_id,
                client_id=client_id,
                start_at=body.start_at,
                comment=body.comment,
                importance=body.importance,
                visitor_name=body.visitor_name,
                visitor_phone=body.visitor_phone,
                created_by=author.id,
                created_by_name=author.name,
            ),
            source=body.source,
        )
    except records_service.MasterUnavailable:
        raise HTTPException(422, "Мастер не найден, неактивен или не работает в этом салоне")
    except records_service.ClientInactive:
        raise HTTPException(422, "Клиент не найден или деактивирован")
    except records_service.ServiceUnavailable:
        raise HTTPException(422, "Услуга не найдена или неактивна")

    service = await _get_record_service(tenant_session, record.service_id)
    colors = await _master_colors(tenant_session, {record.master_id})
    return Envelope(data=_record_out(record, service, colors))


# --- Детали, изменение, статусы --------------------------------------------


async def _get_record(tenant_session, record_id: uuid.UUID) -> Record:
    record = await tenant_session.get(Record, record_id)
    if record is None:
        raise HTTPException(404, "Запись не найдена")
    return record


async def _get_record_service(tenant_session, service_id: uuid.UUID) -> Service:
    """Услуга записи — FK гарантирует существование, отсутствие означает баг."""
    service = await tenant_session.get(Service, service_id)
    if service is None:
        raise HTTPException(500, "Услуга записи повреждена или удалена")
    return service


@router.get("/records/{record_id}", response_model=Envelope[RecordDetailOut])
async def get_record(
    record_id: uuid.UUID, tenant_session: TenantSession
) -> Envelope[RecordDetailOut]:
    record = await _get_record(tenant_session, record_id)
    service = await _get_record_service(tenant_session, record.service_id)
    colors = await _master_colors(tenant_session, {record.master_id})
    history = await tenant_session.scalars(
        select(AuditLog)
        .where(AuditLog.entity == "record", AuditLog.entity_id == str(record_id))
        .order_by(AuditLog.created_at.desc())
    )
    base = _record_out(record, service, colors)
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
    start_at: datetime | None = None
    master_id: uuid.UUID | None = None
    service_id: uuid.UUID | None = None
    importance: RecordImportance | None = None
    comment: str | None = None
    internal_notes: str | None = None
    visitor_name: str | None = None
    visitor_phone: str | None = None


@router.patch("/records/{record_id}", response_model=Envelope[RecordOut])
async def patch_record(
    record_id: uuid.UUID,
    body: RecordPatchIn,
    author: CurrentAuthor,
    salon_id: SalonId,
    master_session: MasterSession,
    tenant_session: TenantSession,
) -> Envelope[RecordOut]:
    record = await _get_record(tenant_session, record_id)
    if record.status in (RecordStatus.COMPLETED, RecordStatus.CANCELLED):
        raise HTTPException(409, "Завершённую или отменённую запись нельзя менять")

    updates = body.model_dump(exclude_unset=True, by_alias=False)
    service = await _get_record_service(tenant_session, record.service_id)

    if "service_id" in updates and updates["service_id"] != record.service_id:
        new_service = await tenant_session.get(Service, updates["service_id"])
        if new_service is None:
            raise HTTPException(422, "Услуга не найдена")
        service = new_service
        record.price = service.price
        record.total_amount = service.price

    if "master_id" in updates and updates["master_id"] != record.master_id:
        try:
            master = await records_service.validate_master(
                master_session, updates["master_id"], salon_id
            )
        except records_service.MasterUnavailable:
            raise HTTPException(422, "Мастер недоступен")
        record.master_name = master.full_name

    changes = diff_fields(record, updates)
    for field, value in updates.items():
        setattr(record, field, value)
    if body.start_at is not None or "service_id" in updates:
        record.end_at = record.start_at + timedelta(minutes=service.duration_minutes)

    if changes:
        write_audit(
            tenant_session,
            entity="record",
            entity_id=record.id,
            entity_name=f"{record.client_name} → {record.master_name}",
            action=AuditAction.UPDATED,
            author_id=author.id,
            author_name=author.name,
            details=changes,
        )
        add_outbox_event(
            tenant_session,
            event_type=RECORD_UPDATED,
            salon_id=salon_id,
            payload={"record_id": str(record.id), "changes": list(changes)},
        )

    colors = await _master_colors(tenant_session, {record.master_id})
    return Envelope(data=_record_out(record, service, colors))


class StatusIn(ApiModel):
    status: RecordStatus


@router.post("/records/{record_id}/status", response_model=Envelope[RecordOut])
async def set_status(
    record_id: uuid.UUID,
    body: StatusIn,
    author: CurrentAuthor,
    salon_id: SalonId,
    tenant_session: TenantSession,
) -> Envelope[RecordOut]:
    if body.status == RecordStatus.COMPLETED:
        raise HTTPException(422, "Завершение — через POST /records/{id}/complete")
    record = await _get_record(tenant_session, record_id)
    if record.status == RecordStatus.COMPLETED:
        raise HTTPException(409, "Запись уже завершена")

    old = record.status
    record.status = body.status
    if body.status == RecordStatus.ARRIVED:
        record.actual_start_at = datetime.now(UTC)

    write_audit(
        tenant_session,
        entity="record",
        entity_id=record.id,
        entity_name=f"{record.client_name} → {record.master_name}",
        action=AuditAction.UPDATED,
        author_id=author.id,
        author_name=author.name,
        details={"status": [old.value, body.status.value]},
    )
    add_outbox_event(
        tenant_session,
        event_type=RECORD_UPDATED,
        salon_id=salon_id,
        payload={"record_id": str(record.id), "status": body.status.value},
    )
    service = await _get_record_service(tenant_session, record.service_id)
    colors = await _master_colors(tenant_session, {record.master_id})
    return Envelope(data=_record_out(record, service, colors))


class PaymentIn(ApiModel):
    payment_method_id: uuid.UUID
    amount: Decimal = Field(gt=0)


class CompleteIn(ApiModel):
    payments: list[PaymentIn] = Field(default_factory=list)
    notes: str | None = None
    photo_urls: list[str] = Field(default_factory=list)


@router.post("/records/{record_id}/complete", response_model=Envelope[RecordOut])
async def complete_record(
    record_id: uuid.UUID,
    body: CompleteIn,
    author: CurrentAuthor,
    salon_id: SalonId,
    tenant_session: TenantSession,
) -> Envelope[RecordOut]:
    record = await _get_record(tenant_session, record_id)
    try:
        await visits_service.complete_record(
            tenant_session,
            salon_id=salon_id,
            record=record,
            payments=[
                visits_service.PaymentPart(payment_method_id=p.payment_method_id, amount=p.amount)
                for p in body.payments
            ],
            notes=body.notes,
            photo_urls=body.photo_urls,
            author_id=author.id,
            author_name=author.name,
        )
    except visits_service.CompletionError as exc:
        raise HTTPException(409, str(exc))

    service = await _get_record_service(tenant_session, record.service_id)
    colors = await _master_colors(tenant_session, {record.master_id})
    return Envelope(data=_record_out(record, service, colors))


# --- Слоты и загрузки -------------------------------------------------------


class SlotOut(ApiModel):
    start_at: datetime
    label: str


@router.get("/masters/{master_id}/slots", response_model=Envelope[list[SlotOut]])
async def master_slots(
    master_id: uuid.UUID,
    day: Annotated[date_type, Query(alias="date")],
    service_id: Annotated[uuid.UUID, Query(alias="serviceId")],
    salon_id: SalonId,
    master_session: MasterSession,
    tenant_session: TenantSession,
) -> Envelope[list[SlotOut]]:
    service = await tenant_session.get(Service, service_id)
    if service is None:
        raise HTTPException(422, "Услуга не найдена")
    salon = await master_session.get(Salon, salon_id)
    if salon is None:
        raise HTTPException(404, "Салон не найден")
    slots = await slots_service.free_slots(
        tenant_session,
        master_id=master_id,
        day=day,
        duration=timedelta(minutes=service.duration_minutes),
        salon_tz=salon.timezone,
    )
    return Envelope(
        data=[
            SlotOut(start_at=datetime.fromisoformat(s["start_at"]), label=s["label"]) for s in slots
        ]
    )


class UploadOut(ApiModel):
    id: uuid.UUID
    url: str


ALLOWED_UPLOAD_TYPES = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}
MAX_UPLOAD_BYTES = 10 * 1024 * 1024


@router.post("/uploads", response_model=Envelope[UploadOut], status_code=status.HTTP_201_CREATED)
async def upload_file(file: UploadFile, salon_id: SalonId) -> Envelope[UploadOut]:
    ext = ALLOWED_UPLOAD_TYPES.get(file.content_type or "")
    if ext is None:
        raise HTTPException(422, "Допустимы только изображения: JPEG, PNG, WebP")
    content = await file.read()
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(413, "Файл больше 10 МБ")

    file_id = uuid.uuid4()
    directory = FsPath(get_settings().upload_dir) / str(salon_id)
    directory.mkdir(parents=True, exist_ok=True)
    (directory / f"{file_id}{ext}").write_bytes(content)
    return Envelope(data=UploadOut(id=file_id, url=f"/uploads/{salon_id}/{file_id}{ext}"))
