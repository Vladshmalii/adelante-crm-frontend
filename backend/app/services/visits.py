"""Завершение визита: оплата → чек + операции, фото, review-токен.

Всё в одной транзакции шард-сессии (чек, разбивка оплат, операции,
обновление записи, outbox record.updated, аудит).
"""

import uuid
from datetime import UTC, datetime
from decimal import Decimal

from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.shard import (
    AuditAction,
    FinanceOperation,
    OperationType,
    PaymentMethod,
    PaymentStatus,
    Receipt,
    ReceiptPayment,
    ReceiptSource,
    ReceiptStatus,
    Record,
    RecordPhoto,
    RecordStatus,
)
from app.notifications.outbox import RECORD_UPDATED, add_outbox_event
from app.services.audit import write_audit


class CompletionError(Exception):
    pass


class PaymentPart(BaseModel):
    payment_method_id: uuid.UUID
    amount: Decimal


def _receipt_number() -> str:
    now = datetime.now(UTC)
    return f"R-{now:%Y%m%d}-{uuid.uuid4().hex[:6].upper()}"


async def complete_record(
    tenant_session: AsyncSession,
    *,
    salon_id: uuid.UUID,
    record: Record,
    payments: list[PaymentPart],
    notes: str | None,
    photo_urls: list[str],
    author_id: uuid.UUID | None,
    author_name: str | None,
) -> Record:
    if record.status in (RecordStatus.COMPLETED, RecordStatus.CANCELLED):
        raise CompletionError(f"Запись уже в статусе {record.status.value}")

    now = datetime.now(UTC)
    paid_total = sum((p.amount for p in payments), Decimal(0))

    receipt: Receipt | None = None
    if payments:
        method_ids = [p.payment_method_id for p in payments]
        methods = {
            m.id: m
            for m in await tenant_session.scalars(
                select(PaymentMethod).where(PaymentMethod.id.in_(method_ids))
            )
        }
        missing = set(method_ids) - set(methods)
        if missing:
            raise CompletionError("Неизвестный способ оплаты")

        cash_register_id = next(
            (m.cash_register_id for m in methods.values() if m.cash_register_id), None
        )
        if cash_register_id is None:
            raise CompletionError("У способа оплаты не настроена касса")

        receipt = Receipt(
            number=_receipt_number(),
            date=now,
            cash_register_id=cash_register_id,
            client_id=record.client_id,
            client_name=record.client_name,
            record_id=record.id,
            amount=paid_total,
            status=(
                ReceiptStatus.PAID if paid_total >= record.total_amount else ReceiptStatus.PARTIAL
            ),
            source=ReceiptSource.WEB,
            author_id=author_id,
            author_name=author_name,
        )
        tenant_session.add(receipt)
        await tenant_session.flush()

        for part in payments:
            method = methods[part.payment_method_id]
            tenant_session.add(
                ReceiptPayment(
                    receipt_id=receipt.id,
                    payment_method_id=method.id,
                    amount=part.amount,
                )
            )
            tenant_session.add(
                FinanceOperation(
                    type=OperationType.INCOME,
                    amount=part.amount,
                    category="services",
                    description=f"Оплата визита: {record.client_name}",
                    date=now,
                    payment_method_id=method.id,
                    cash_register_id=method.cash_register_id or cash_register_id,
                    client_id=record.client_id,
                    record_id=record.id,
                    receipt_id=receipt.id,
                    author_id=author_id,
                    author_name=author_name,
                )
            )

    record.status = RecordStatus.COMPLETED
    if paid_total >= record.total_amount and record.total_amount > 0:
        record.payment_status = PaymentStatus.PAID
    elif paid_total > 0:
        record.payment_status = PaymentStatus.PARTIAL
    record.actual_start_at = record.actual_start_at or record.start_at
    record.actual_end_at = now
    record.closed_by = author_id
    record.closed_by_name = author_name
    record.closed_at = now
    if notes:
        record.internal_notes = (
            f"{record.internal_notes}\n{notes}" if record.internal_notes else notes
        )
    # Одноразовый токен для отзыва — уходит клиенту в уведомлении
    record.review_token = uuid.uuid4()

    for url in photo_urls:
        tenant_session.add(RecordPhoto(record_id=record.id, url=url, uploaded_by=author_id))

    add_outbox_event(
        tenant_session,
        event_type=RECORD_UPDATED,
        salon_id=salon_id,
        payload={
            "record_id": str(record.id),
            "status": record.status.value,
            "payment_status": record.payment_status.value,
            "client_name": record.client_name,
            "master_name": record.master_name,
        },
    )
    write_audit(
        tenant_session,
        entity="record",
        entity_id=record.id,
        entity_name=f"{record.client_name} → {record.master_name}",
        action=AuditAction.UPDATED,
        author_id=author_id,
        author_name=author_name,
        details={"status": ["arrived", "completed"], "paid": [None, str(paid_total)]},
    )
    return record
