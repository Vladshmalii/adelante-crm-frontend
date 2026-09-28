"""Создание и изменение записей: cross-DB валидация, услуги, занятость слота, outbox.

Бизнес-правило (решение от 25.08.2026): из админки у одного мастера могут
быть две записи на одно время; с публичного booking-сайта занять занятый
слот нельзя. Поэтому НЕ unique-constraint в БД, а проверка пересечения в
сервис-слое под pg_advisory_xact_lock(master_id) — лок сериализует
конкурентные бронирования одного мастера и снимается на commit/rollback
транзакции шард-сессии.

Контракт записи (решения от 23.09.2026): в записи несколько услуг, их
подряд выполняет один мастер — длительность и цена суммируются; мастер
необязателен (очередь «Без майстра»).
"""

import hashlib
import uuid
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Any

from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.master import Client, Master, master_salons
from app.models.shard import (
    AuditAction,
    Record,
    RecordImportance,
    RecordService,
    RecordSource,
    RecordStatus,
    Service,
    ServiceStatus,
)
from app.notifications.outbox import RECORD_CREATED, RECORD_UPDATED, add_outbox_event
from app.services.audit import write_audit


class RecordError(Exception):
    pass


class MasterUnavailable(RecordError):
    """Мастер не существует, деактивирован, уволен или не привязан к салону."""


class ServiceUnavailable(RecordError):
    """Услуга не существует или неактивна."""


class ClientInactive(RecordError):
    pass


class SlotTaken(RecordError):
    """Слот занят — только для публичной записи; админка не блокируется."""


# Статусы, в которых запись занимает время мастера
BUSY_STATUSES = (
    RecordStatus.SCHEDULED,
    RecordStatus.CONFIRMED,
    RecordStatus.ARRIVED,
    RecordStatus.COMPLETED,
)


class NewRecord(BaseModel):
    master_id: uuid.UUID | None = None
    service_ids: list[uuid.UUID] = Field(min_length=1)
    client_id: uuid.UUID
    start_at: datetime
    comment: str | None = None
    importance: RecordImportance = RecordImportance.STANDARD
    visitor_name: str | None = None
    visitor_phone: str | None = None
    reminder_enabled: bool = True
    created_by: uuid.UUID | None = None
    created_by_name: str | None = None


def _advisory_lock_key(master_id: uuid.UUID) -> int:
    """Детерминированный signed int64 для pg_advisory_xact_lock."""
    digest = hashlib.sha256(master_id.bytes).digest()
    return int.from_bytes(digest[:8], "big", signed=True)


def record_title(record: Record) -> str:
    """Название записи в журнале изменений."""
    return f"{record.client_name} → {record.master_name or 'без майстра'}"


async def validate_master(
    master_session: AsyncSession, master_id: uuid.UUID, salon_id: uuid.UUID
) -> Master:
    master = await master_session.scalar(
        select(Master)
        .join(master_salons, master_salons.c.master_id == Master.id)
        .where(
            Master.id == master_id,
            Master.is_active.is_(True),
            master_salons.c.salon_id == salon_id,
            master_salons.c.is_active.is_(True),
        )
    )
    if master is None:
        raise MasterUnavailable(str(master_id))
    return master


async def validate_client(master_session: AsyncSession, client_id: uuid.UUID) -> Client:
    client = await master_session.get(Client, client_id)
    if client is None or not client.is_active:
        raise ClientInactive(str(client_id))
    return client


async def get_or_create_client(master_session: AsyncSession, *, name: str, phone: str) -> Client:
    """Клиент идентифицируется телефоном, создаётся при первой записи."""
    client = await master_session.scalar(select(Client).where(Client.phone == phone))
    if client is not None:
        if not client.is_active:
            raise ClientInactive(str(client.id))
        return client
    client = Client(first_name=name, phone=phone)
    master_session.add(client)
    await master_session.flush()
    return client


async def load_services(
    tenant_session: AsyncSession, service_ids: list[uuid.UUID]
) -> list[Service]:
    """Активные услуги в переданном порядке (повторы отбрасываются)."""
    ordered = list(dict.fromkeys(service_ids))
    found = {
        s.id: s
        for s in await tenant_session.scalars(select(Service).where(Service.id.in_(ordered)))
    }
    services = []
    for service_id in ordered:
        service = found.get(service_id)
        if service is None or service.status != ServiceStatus.ACTIVE:
            raise ServiceUnavailable(str(service_id))
        services.append(service)
    return services


def total_duration(services: list[Service]) -> timedelta:
    return timedelta(minutes=sum(s.duration_minutes for s in services))


def apply_services(record: Record, services: list[Service]) -> None:
    """Состав услуг записи: снапшот, суммы цены и длительности, конец визита."""
    record.services = [
        RecordService(
            service_id=s.id,
            position=i,
            name=s.name,
            price=s.price,
            duration_minutes=s.duration_minutes,
        )
        for i, s in enumerate(services)
    ]
    total = sum((s.price for s in services), Decimal(0))
    record.price = total
    record.total_amount = total
    record.end_at = record.start_at + total_duration(services)


def reschedule(record: Record, start_at: datetime) -> None:
    duration = record.end_at - record.start_at
    record.start_at = start_at
    record.end_at = start_at + duration


async def lock_master(tenant_session: AsyncSession, master_id: uuid.UUID) -> None:
    await tenant_session.execute(select(func.pg_advisory_xact_lock(_advisory_lock_key(master_id))))


async def is_slot_free(
    tenant_session: AsyncSession,
    master_id: uuid.UUID,
    start_at: datetime,
    end_at: datetime,
    exclude_record_id: uuid.UUID | None = None,
) -> bool:
    query = (
        select(func.count())
        .select_from(Record)
        .where(
            Record.master_id == master_id,
            Record.status.in_(BUSY_STATUSES),
            Record.start_at < end_at,
            Record.end_at > start_at,
        )
    )
    if exclude_record_id is not None:
        query = query.where(Record.id != exclude_record_id)
    return not await tenant_session.scalar(query)


def record_payload(record: Record) -> dict[str, Any]:
    """Общая часть payload событий записи (уведомления, WebSocket)."""
    return {
        "record_id": str(record.id),
        "client_id": str(record.client_id),
        "client_name": record.client_name,
        "master_id": str(record.master_id) if record.master_id else None,
        "master_name": record.master_name,
        "service_names": [s.name for s in record.services],
        "service_name": ", ".join(s.name for s in record.services),
        "start_at": record.start_at.isoformat(),
        "end_at": record.end_at.isoformat(),
        "status": record.status.value,
        "payment_status": record.payment_status.value,
    }


def emit_record_updated(
    tenant_session: AsyncSession,
    *,
    salon_id: uuid.UUID,
    record: Record,
    change: str,
    actor_id: uuid.UUID | None,
    previous_master_id: uuid.UUID | None = None,
    previous_start_at: datetime | None = None,
    extra: dict[str, Any] | None = None,
) -> None:
    """record.updated в outbox.

    change: rescheduled | reassigned | cancelled | status | completed | paid |
    unpaid | updated — по нему воркер решает, кого уведомить в Telegram.
    """
    payload = record_payload(record)
    payload.update(
        change=change,
        actor_id=str(actor_id) if actor_id else None,
        previous_master_id=str(previous_master_id) if previous_master_id else None,
        previous_start_at=previous_start_at.isoformat() if previous_start_at else None,
    )
    if extra:
        payload.update(extra)
    add_outbox_event(tenant_session, event_type=RECORD_UPDATED, salon_id=salon_id, payload=payload)


async def create_record(
    *,
    master_session: AsyncSession,
    tenant_session: AsyncSession,
    salon_id: uuid.UUID,
    data: NewRecord,
    source: RecordSource,
    check_slot: bool = False,
) -> Record:
    # Cross-DB валидация: ссылки на Master DB проверяются до записи в шард.
    # Атомарности между базами нет — её заменяет политика soft-delete в Master DB.
    master = (
        await validate_master(master_session, data.master_id, salon_id)
        if data.master_id is not None
        else None
    )
    client = await validate_client(master_session, data.client_id)
    services = await load_services(tenant_session, data.service_ids)

    end_at = data.start_at + total_duration(services)
    if check_slot and master is not None:
        await lock_master(tenant_session, master.id)
        if not await is_slot_free(tenant_session, master.id, data.start_at, end_at):
            raise SlotTaken()

    record = Record(
        client_id=client.id,
        master_id=master.id if master else None,
        start_at=data.start_at,
        end_at=end_at,
        source=source,
        importance=data.importance,
        client_name=client.full_name,
        client_phone=client.phone,
        master_name=master.full_name if master else None,
        visitor_name=data.visitor_name,
        visitor_phone=data.visitor_phone,
        comment=data.comment,
        reminder_enabled=data.reminder_enabled,
        created_by=data.created_by,
        created_by_name=data.created_by_name,
    )
    apply_services(record, services)
    tenant_session.add(record)
    await tenant_session.flush()

    payload = record_payload(record)
    payload.update(
        source=source.value,
        actor_id=str(data.created_by) if data.created_by else None,
    )
    add_outbox_event(tenant_session, event_type=RECORD_CREATED, salon_id=salon_id, payload=payload)
    write_audit(
        tenant_session,
        entity="record",
        entity_id=record.id,
        entity_name=record_title(record),
        action=AuditAction.CREATED,
        author_id=data.created_by,
        author_name=data.created_by_name,
    )
    return record
