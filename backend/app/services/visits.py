"""Завершение визита и оплата записи — два отдельных шага (решение от 23.09.2026).

Завершение (мастер или администратор): заметки, фото, review-токен; запись
получает статус completed и оплату unpaid. Без мастера завершить нельзя.

Оплата (только администратор): чек с record_id на полную сумму записи —
частичной оплаты и чаевых нет, разбивка по нескольким способам оплаты
допустима. Отмена такого чека возвращает записи статус «не оплачено».

Каждый шаг — одна транзакция шард-сессии (запись, чек, операции, outbox,
аудит).
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
from app.services.audit import write_audit
from app.services.records import emit_record_updated, record_title


class CompletionError(Exception):
    pass


class PaymentError(Exception):
    pass


class PaymentPart(BaseModel):
    payment_method_id: uuid.UUID
    amount: Decimal


def receipt_number() -> str:
    now = datetime.now(UTC)
    return f"R-{now:%Y%m%d}-{uuid.uuid4().hex[:6].upper()}"


COMPLETABLE = (RecordStatus.SCHEDULED, RecordStatus.CONFIRMED, RecordStatus.ARRIVED)


async def complete_record(
    tenant_session: AsyncSession,
    *,
    salon_id: uuid.UUID,
    record: Record,
    notes: str | None,
    photo_urls: list[str],
    author_id: uuid.UUID | None,
    author_name: str | None,
) -> Record:
    if record.status not in COMPLETABLE:
        raise CompletionError(f"Запись в статусе {record.status.value} нельзя завершить")
    if record.master_id is None:
        raise CompletionError("Сначала назначьте мастера — без мастера визит не завершить")

    now = datetime.now(UTC)
    old_status = record.status
    record.status = RecordStatus.COMPLETED
    # Бесплатный визит оплачивать нечем — сразу «оплачено»
    record.payment_status = PaymentStatus.PAID if record.total_amount <= 0 else PaymentStatus.UNPAID
    record.actual_start_at = record.actual_start_at or record.start_at
    record.actual_end_at = now
    record.closed_by = author_id
    record.closed_by_name = author_name
    record.closed_at = now
    if notes:
        record.internal_notes = (
            f"{record.internal_notes}\n{notes}" if record.internal_notes else notes
        )
    # Одноразовый токен для отзыва
    record.review_token = uuid.uuid4()

    for url in photo_urls:
        tenant_session.add(RecordPhoto(record_id=record.id, url=url, uploaded_by=author_id))

    emit_record_updated(
        tenant_session, salon_id=salon_id, record=record, change="completed", actor_id=author_id
    )
    write_audit(
        tenant_session,
        entity="record",
        entity_id=record.id,
        entity_name=record_title(record),
        action=AuditAction.UPDATED,
        author_id=author_id,
        author_name=author_name,
        details={"status": [old_status.value, RecordStatus.COMPLETED.value]},
    )
    return record


async def create_receipt(
    tenant_session: AsyncSession,
    *,
    payments: list[PaymentPart],
    source: ReceiptSource,
    date: datetime,
    author_id: uuid.UUID | None,
    author_name: str | None,
    client_id: uuid.UUID | None = None,
    client_name: str | None = None,
    record: Record | None = None,
) -> Receipt:
    """Чек + разбивка по способам оплаты + приходные операции по каждой оплате."""
    method_ids = [p.payment_method_id for p in payments]
    methods = {
        m.id: m
        for m in await tenant_session.scalars(
            select(PaymentMethod).where(PaymentMethod.id.in_(method_ids))
        )
    }
    if set(method_ids) - set(methods):
        raise PaymentError("Неизвестный способ оплаты")
    if any(not m.is_active for m in methods.values()):
        raise PaymentError("Способ оплаты выключен")
    cash_register_id = next(
        (m.cash_register_id for m in methods.values() if m.cash_register_id), None
    )
    if cash_register_id is None:
        raise PaymentError("У способа оплаты не настроена касса")

    receipt = Receipt(
        number=receipt_number(),
        date=date,
        cash_register_id=cash_register_id,
        client_id=client_id,
        client_name=client_name,
        record_id=record.id if record else None,
        amount=sum((p.amount for p in payments), Decimal(0)),
        status=ReceiptStatus.PAID,
        source=source,
        author_id=author_id,
        author_name=author_name,
    )
    tenant_session.add(receipt)
    await tenant_session.flush()

    for part in payments:
        method = methods[part.payment_method_id]
        tenant_session.add(
            ReceiptPayment(receipt_id=receipt.id, payment_method_id=method.id, amount=part.amount)
        )
        tenant_session.add(
            FinanceOperation(
                type=OperationType.INCOME,
                amount=part.amount,
                category="services" if record else "sales",
                description=(
                    f"Оплата візиту: {record.client_name}" if record else f"Чек {receipt.number}"
                ),
                date=date,
                payment_method_id=method.id,
                cash_register_id=method.cash_register_id or cash_register_id,
                client_id=client_id,
                record_id=record.id if record else None,
                receipt_id=receipt.id,
                author_id=author_id,
                author_name=author_name,
            )
        )
    await tenant_session.flush()
    # receipt.payments — lazy="selectin"; на только что созданном объекте
    # коллекция не загружена, синхронное обращение под AsyncSession падает
    # с MissingGreenlet — перезагружаем явно
    await tenant_session.refresh(receipt, attribute_names=["payments"])
    return receipt


async def pay_record(
    tenant_session: AsyncSession,
    *,
    salon_id: uuid.UUID,
    record: Record,
    payments: list[PaymentPart],
    author_id: uuid.UUID | None,
    author_name: str | None,
    date: datetime | None = None,
    source: ReceiptSource = ReceiptSource.WEB,
) -> Receipt:
    if record.master_id is None:
        raise PaymentError("Запись без мастера оплатить нельзя")
    if record.status != RecordStatus.COMPLETED:
        raise PaymentError("Оплатить можно только завершённый визит")
    if record.payment_status == PaymentStatus.PAID:
        raise PaymentError("Запись уже оплачена")
    paid = sum((p.amount for p in payments), Decimal(0))
    if paid != record.total_amount:
        raise PaymentError(
            f"Сумма оплаты {paid} не совпадает с суммой записи {record.total_amount}"
        )

    receipt = await create_receipt(
        tenant_session,
        payments=payments,
        source=source,
        date=date or datetime.now(UTC),
        author_id=author_id,
        author_name=author_name,
        client_id=record.client_id,
        client_name=record.client_name,
        record=record,
    )
    record.payment_status = PaymentStatus.PAID

    emit_record_updated(
        tenant_session,
        salon_id=salon_id,
        record=record,
        change="paid",
        actor_id=author_id,
        extra={"receipt_id": str(receipt.id)},
    )
    write_audit(
        tenant_session,
        entity="record",
        entity_id=record.id,
        entity_name=record_title(record),
        action=AuditAction.UPDATED,
        author_id=author_id,
        author_name=author_name,
        details={
            "paymentStatus": [PaymentStatus.UNPAID.value, PaymentStatus.PAID.value],
            "receipt": [None, receipt.number],
        },
    )
    return receipt


async def unpay_record_for_receipt(
    tenant_session: AsyncSession,
    *,
    salon_id: uuid.UUID,
    receipt: Receipt,
    author_id: uuid.UUID | None,
    author_name: str | None,
) -> None:
    """Отмена чека записи: запись снова «не оплачено»."""
    if receipt.record_id is None:
        return
    record = await tenant_session.get(Record, receipt.record_id)
    if record is None or record.payment_status == PaymentStatus.UNPAID:
        return
    old = record.payment_status
    record.payment_status = PaymentStatus.UNPAID
    emit_record_updated(
        tenant_session,
        salon_id=salon_id,
        record=record,
        change="unpaid",
        actor_id=author_id,
        extra={"receipt_id": str(receipt.id)},
    )
    write_audit(
        tenant_session,
        entity="record",
        entity_id=record.id,
        entity_name=record_title(record),
        action=AuditAction.UPDATED,
        author_id=author_id,
        author_name=author_name,
        details={
            "paymentStatus": [old.value, PaymentStatus.UNPAID.value],
            "receipt": [receipt.number, None],
        },
    )
