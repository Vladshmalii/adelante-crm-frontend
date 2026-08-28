"""Создание записей: cross-DB валидация, занятость слота, outbox.

Бизнес-правило (решение от 25.08.2026): из админки у одного мастера могут
быть две записи на одно время; с публичного booking-сайта (и из бота от имени
клиента) занять занятый слот нельзя. Поэтому НЕ unique-constraint в БД, а
проверка пересечения в сервис-слое под pg_advisory_xact_lock(master_id) —
лок сериализует конкурентные бронирования одного мастера и снимается на
commit/rollback транзакции шард-сессии.
"""

import hashlib
import uuid
from datetime import datetime, timedelta

from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.master import Client, Master, master_salons
from app.models.shard import (
    AuditAction,
    Record,
    RecordImportance,
    RecordSource,
    RecordStatus,
    Service,
    ServiceStatus,
)
from app.notifications.outbox import RECORD_CREATED, add_outbox_event
from app.services.audit import write_audit


class RecordError(Exception):
    pass


class MasterUnavailable(RecordError):
    """Мастер не существует, деактивирован или не привязан к салону."""


class ServiceUnavailable(RecordError):
    """Услуга не существует или неактивна."""


class ClientInactive(RecordError):
    pass


class SlotTaken(RecordError):
    """Слот занят — только для source=booking/bot; админка не блокируется."""


class NewRecord(BaseModel):
    master_id: uuid.UUID
    service_id: uuid.UUID
    client_id: uuid.UUID
    start_at: datetime
    comment: str | None = None
    importance: RecordImportance = RecordImportance.STANDARD
    visitor_name: str | None = None
    visitor_phone: str | None = None
    created_by: uuid.UUID | None = None
    created_by_name: str | None = None


def _advisory_lock_key(master_id: uuid.UUID) -> int:
    """Детерминированный signed int64 для pg_advisory_xact_lock."""
    digest = hashlib.sha256(master_id.bytes).digest()
    return int.from_bytes(digest[:8], "big", signed=True)


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
    """Booking-флоу: клиент идентифицируется телефоном, создаётся при первом визите."""
    client = await master_session.scalar(select(Client).where(Client.phone == phone))
    if client is not None:
        if not client.is_active:
            raise ClientInactive(str(client.id))
        return client
    client = Client(first_name=name, phone=phone)
    master_session.add(client)
    await master_session.flush()
    return client


async def create_record(
    *,
    master_session: AsyncSession,
    tenant_session: AsyncSession,
    salon_id: uuid.UUID,
    data: NewRecord,
    source: RecordSource,
) -> Record:
    # Cross-DB валидация: ссылки на Master DB проверяются до записи в шард.
    # Атомарности между базами нет — её заменяет политика soft-delete в Master DB.
    master = await validate_master(master_session, data.master_id, salon_id)
    client = await validate_client(master_session, data.client_id)

    service = await tenant_session.get(Service, data.service_id)
    if service is None or service.status != ServiceStatus.ACTIVE:
        raise ServiceUnavailable(str(data.service_id))

    end_at = data.start_at + timedelta(minutes=service.duration_minutes)

    if source != RecordSource.ADMIN:
        await tenant_session.execute(
            select(func.pg_advisory_xact_lock(_advisory_lock_key(data.master_id)))
        )
        overlapping = await tenant_session.scalar(
            select(func.count())
            .select_from(Record)
            .where(
                Record.master_id == data.master_id,
                Record.status != RecordStatus.CANCELLED,
                Record.start_at < end_at,
                Record.end_at > data.start_at,
            )
        )
        if overlapping:
            raise SlotTaken()

    record = Record(
        client_id=client.id,
        master_id=master.id,
        service_id=service.id,
        start_at=data.start_at,
        end_at=end_at,
        source=source,
        importance=data.importance,
        price=service.price,
        total_amount=service.price,
        client_name=client.full_name,
        client_phone=client.phone,
        master_name=master.full_name,
        visitor_name=data.visitor_name,
        visitor_phone=data.visitor_phone,
        comment=data.comment,
        created_by=data.created_by,
        created_by_name=data.created_by_name,
    )
    tenant_session.add(record)
    await tenant_session.flush()

    add_outbox_event(
        tenant_session,
        event_type=RECORD_CREATED,
        salon_id=salon_id,
        payload={
            "record_id": str(record.id),
            "client_id": str(client.id),
            "client_name": client.full_name,
            "master_id": str(master.id),
            "master_name": master.full_name,
            "service_name": service.name,
            "start_at": data.start_at.isoformat(),
            "source": source.value,
        },
    )
    write_audit(
        tenant_session,
        entity="record",
        entity_id=record.id,
        entity_name=f"{record.client_name} → {record.master_name}",
        action=AuditAction.CREATED,
        author_id=data.created_by,
        author_name=data.created_by_name,
    )
    return record
