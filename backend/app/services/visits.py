"""Завершение визита и оплата записи — два отдельных шага (решение от 23.09.2026).

Завершение (мастер или администратор): заметки, фото, review-токен; запись
получает статус completed и оплату unpaid. Без мастера завершить нельзя.

Оплата (только администратор): чек с record_id на полную сумму записи —
частичной оплаты и чаевых нет, разбивка по нескольким способам оплаты
допустима; недоплата закрывается частью «Особовий рахунок» (долг). Отмена
такого чека возвращает записи статус «не оплачено».

Завершение — одна транзакция шард-сессии. Оплата идёт в две БД: сначала
Master (списания со счетов клиента), потом шард, при ошибке шарда — сторно
(app.services.payments).
"""

import uuid
from dataclasses import replace
from datetime import UTC, datetime
from decimal import Decimal
from typing import Any

from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.master import Client
from app.models.shard import (
    SYSTEM_METHOD_TYPES,
    AuditAction,
    CashRegister,
    FinanceOperation,
    OperationType,
    PaymentMethod,
    PaymentMethodType,
    PaymentStatus,
    Receipt,
    ReceiptPayment,
    ReceiptSource,
    ReceiptStatus,
    Record,
    RecordPhoto,
    RecordStatus,
)
from app.notifications.outbox import (
    LOYALTY_RECEIPT_CANCELLED,
    LOYALTY_RECEIPT_PAID,
    add_outbox_event,
)
from app.services import loyalty as loyalty_service
from app.services import payments as payments_service
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
        raise CompletionError(f"Запис у статусі {record.status.value} не можна завершити")
    if record.master_id is None:
        raise CompletionError("Спочатку призначте майстра — без майстра візит не завершити")

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


async def load_methods(
    tenant_session: AsyncSession, payments: list[PaymentPart]
) -> dict[uuid.UUID, PaymentMethod]:
    """Способы оплаты чека: существуют, активны; у обычных — включённая касса."""
    method_ids = [p.payment_method_id for p in payments]
    methods = {
        m.id: m
        for m in await tenant_session.scalars(
            select(PaymentMethod).where(PaymentMethod.id.in_(method_ids))
        )
    }
    if set(method_ids) - set(methods):
        raise PaymentError("Невідомий спосіб оплати")
    if any(not m.is_active for m in methods.values()):
        raise PaymentError("Спосіб оплати вимкнено")
    # Без кассы проходят только системные способы (account, bonus): их деньги — на
    # счетах клиента в Master DB. Обычный способ без кассы — ошибка настройки
    unbound = next(
        (m for m in methods.values() if not m.is_system and not m.cash_register_id), None
    )
    if unbound is not None:
        raise PaymentError(f"Для способу оплати «{unbound.name}» не налаштовано касу")
    register_ids = {m.cash_register_id for m in methods.values() if m.cash_register_id}
    inactive = await tenant_session.scalar(
        select(CashRegister.name).where(
            CashRegister.id.in_(register_ids), CashRegister.is_active.is_(False)
        )
    )
    if inactive is not None:
        raise PaymentError(f"Каса «{inactive}» вимкнена")
    return methods


def charges_for(
    payments: list[PaymentPart], methods: dict[uuid.UUID, PaymentMethod]
) -> payments_service.Charges:
    """Суммы частей, которые списываются со счетов клиента в Master DB."""
    by_type: dict[PaymentMethodType, Decimal] = {}
    for part in payments:
        method_type = methods[part.payment_method_id].type
        by_type[method_type] = by_type.get(method_type, Decimal(0)) + part.amount
    return payments_service.Charges(
        account=by_type.get(PaymentMethodType.ACCOUNT, Decimal(0)),
        bonus=by_type.get(PaymentMethodType.BONUS, Decimal(0)),
        total=sum((p.amount for p in payments), Decimal(0)),
    )


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
    receipt_id: uuid.UUID | None = None,
    methods: dict[uuid.UUID, PaymentMethod] | None = None,
    loyalty_card_id: uuid.UUID | None = None,
) -> Receipt:
    """Чек + разбивка по способам оплаты + приходные операции по каждой оплате.

    Операция способа без кассы (account, bonus) пишется с cash_register_id = NULL:
    выручка признаётся (доход на дашборде), но в баланс кассы не попадает — денег
    в кассе нет. Чек без единого способа с кассой не имеет кассы.
    """
    if methods is None:
        methods = await load_methods(tenant_session, payments)
    cash_register_id = next(
        (
            methods[p.payment_method_id].cash_register_id
            for p in payments
            if methods[p.payment_method_id].cash_register_id
        ),
        None,
    )

    receipt = Receipt(
        id=receipt_id or uuid.uuid4(),
        number=receipt_number(),
        date=date,
        cash_register_id=cash_register_id,
        client_id=client_id,
        client_name=client_name,
        record_id=record.id if record else None,
        loyalty_card_id=loyalty_card_id,
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
                cash_register_id=method.cash_register_id,
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
    master_session: AsyncSession,
    *,
    salon_id: uuid.UUID,
    record: Record,
    payments: list[PaymentPart],
    author_id: uuid.UUID | None,
    author_name: str | None,
    date: datetime | None = None,
    source: ReceiptSource = ReceiptSource.WEB,
    idempotency_key: str | None = None,
) -> Receipt:
    """Оплата визита. Части account списываются в Master до записи чека (раздел 6, шаг 4).

    Коммитит обе сессии сама. Повтор с тем же Idempotency-Key возвращает тот же чек.
    """
    receipt_id = payments_service.receipt_id_for(salon_id, idempotency_key)
    existing = await payments_service.lock_receipt(tenant_session, receipt_id)
    if existing is not None:
        return existing
    # FOR UPDATE записи: параллельная оплата той же записи ждёт и видит «уже оплачено»
    await tenant_session.execute(select(Record.id).where(Record.id == record.id).with_for_update())
    await tenant_session.refresh(record)
    if record.master_id is None:
        raise PaymentError("Запис без майстра оплатити не можна")
    if record.status != RecordStatus.COMPLETED:
        raise PaymentError("Оплатити можна лише завершений візит")
    if record.payment_status == PaymentStatus.PAID:
        raise PaymentError("Запис уже оплачено")
    paid = sum((p.amount for p in payments), Decimal(0))
    if paid != record.total_amount:
        raise PaymentError(f"Сума оплати {paid} не збігається з сумою запису {record.total_amount}")
    methods = await load_methods(tenant_session, payments)
    card_id = await applicable_card_id(master_session, record.client_id, salon_id)
    charges = replace(charges_for(payments, methods), card_id=card_id)

    async def write_shard(result: payments_service.ChargeResult) -> Receipt:
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
            receipt_id=receipt_id,
            methods=methods,
            loyalty_card_id=card_id,
        )
        emit_receipt_paid(
            tenant_session,
            salon_id=salon_id,
            receipt=receipt,
            methods=methods,
            result=result,
            lines=[
                {
                    "kind": "service",
                    "record_service_id": str(s.id),
                    "service_id": str(s.service_id),
                    "name": s.name,
                    "amount": str(s.price),
                    "is_bonus": False,
                }
                for s in record.services
            ],
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
        write_receipt_audit(tenant_session, receipt, author_id=author_id, author_name=author_name)
        return receipt

    try:
        return await payments_service.settle(
            master_session,
            tenant_session,
            salon_id=salon_id,
            receipt_id=receipt_id,
            client_id=record.client_id,
            record_id=record.id,
            charges=charges,
            author_id=author_id,
            author_name=author_name,
            write_shard=write_shard,
        )
    except payments_service.PaymentError as exc:
        raise PaymentError(str(exc))


async def sell(
    tenant_session: AsyncSession,
    master_session: AsyncSession,
    *,
    salon_id: uuid.UUID,
    payments: list[PaymentPart],
    author_id: uuid.UUID | None,
    author_name: str | None,
    client_id: uuid.UUID | None,
    client_name: str | None,
    date: datetime,
    source: ReceiptSource = ReceiptSource.WEB,
    idempotency_key: str | None = None,
) -> Receipt:
    """Чек без записи (продажа товаров) — те же способы оплаты, что у визита. Коммитит сам."""
    receipt_id = payments_service.receipt_id_for(salon_id, idempotency_key)
    existing = await payments_service.lock_receipt(tenant_session, receipt_id)
    if existing is not None:
        return existing
    methods = await load_methods(tenant_session, payments)
    charges = charges_for(payments, methods)
    if client_id is not None:
        client = await master_session.get(Client, client_id)
        if client is None or not client.is_active:
            raise PaymentError("Клієнта не знайдено")
        client_name = client_name or client.full_name
    elif charges.any:
        raise PaymentError("Для оплати з рахунку оберіть клієнта")
    card_id = await applicable_card_id(master_session, client_id, salon_id) if client_id else None
    charges = replace(charges, card_id=card_id)

    async def write_shard(result: payments_service.ChargeResult) -> Receipt:
        receipt = await create_receipt(
            tenant_session,
            payments=payments,
            source=source,
            date=date,
            author_id=author_id,
            author_name=author_name,
            client_id=client_id,
            client_name=client_name,
            receipt_id=receipt_id,
            methods=methods,
            loyalty_card_id=card_id,
        )
        # Чек без записи — одна строка «товар» на всю сумму (раздел 15)
        emit_receipt_paid(
            tenant_session,
            salon_id=salon_id,
            receipt=receipt,
            methods=methods,
            result=result,
            lines=[{"kind": "product", "name": "Товари", "amount": str(receipt.amount)}],
        )
        write_receipt_audit(tenant_session, receipt, author_id=author_id, author_name=author_name)
        return receipt

    try:
        return await payments_service.settle(
            master_session,
            tenant_session,
            salon_id=salon_id,
            receipt_id=receipt_id,
            client_id=client_id,
            record_id=None,
            charges=charges,
            author_id=author_id,
            author_name=author_name,
            write_shard=write_shard,
        )
    except payments_service.PaymentError as exc:
        raise PaymentError(str(exc))


async def applicable_card_id(
    master_session: AsyncSession, client_id: uuid.UUID, salon_id: uuid.UUID
) -> uuid.UUID | None:
    """Активная карта клиента, действующая в этом салоне (Master DB), — снапшот в чек."""
    card = await master_session.run_sync(
        lambda s: loyalty_service.applicable_card(s, client_id, salon_id)
    )
    return card.id if card is not None else None


def emit_receipt_paid(
    tenant_session: AsyncSession,
    *,
    salon_id: uuid.UUID,
    receipt: Receipt,
    methods: dict[uuid.UUID, PaymentMethod],
    result: payments_service.ChargeResult,
    lines: list[dict[str, Any]],
) -> None:
    """loyalty.receipt_paid — только для чека с картой: воркер пишет факт визита и начисления."""
    if receipt.loyalty_card_id is None:
        return
    parts: dict[str, Decimal] = {}
    for p in receipt.payments:
        method_type = methods[p.payment_method_id].type
        key = method_type.value if method_type in SYSTEM_METHOD_TYPES else "other"
        parts[key] = parts.get(key, Decimal(0)) + p.amount
    sold = sum((Decimal(line["amount"]) for line in lines), Decimal(0))
    add_outbox_event(
        tenant_session,
        event_type=LOYALTY_RECEIPT_PAID,
        salon_id=salon_id,
        payload={
            "receipt_id": str(receipt.id),
            "receipt_number": receipt.number,
            "record_id": str(receipt.record_id) if receipt.record_id else None,
            "client_id": str(receipt.client_id),
            "card_id": str(receipt.loyalty_card_id),
            "happened_at": receipt.date.isoformat(),
            "sold": str(sold),
            "discount": "0",
            "total": str(receipt.amount),
            "parts": {k: str(v) for k, v in parts.items()},
            "account_balance_before": (
                str(result.account_balance_before)
                if result.account_balance_before is not None
                else None
            ),
            "lines": lines,
        },
    )


def write_receipt_audit(
    tenant_session: AsyncSession,
    receipt: Receipt,
    *,
    author_id: uuid.UUID | None,
    author_name: str | None,
) -> None:
    write_audit(
        tenant_session,
        entity="finance",
        entity_id=receipt.id,
        entity_name=f"Чек № {receipt.number}",
        action=AuditAction.CREATED,
        author_id=author_id,
        author_name=author_name,
        details={"amount": [None, str(receipt.amount)]},
    )


def emit_receipt_cancelled(
    tenant_session: AsyncSession,
    *,
    salon_id: uuid.UUID,
    receipt: Receipt,
    author_id: uuid.UUID | None,
    author_name: str | None,
) -> None:
    """loyalty.receipt_cancelled: воркер сторнирует в Master списания со счетов по чеку."""
    add_outbox_event(
        tenant_session,
        event_type=LOYALTY_RECEIPT_CANCELLED,
        salon_id=salon_id,
        payload={
            "receipt_id": str(receipt.id),
            "receipt_number": receipt.number,
            "record_id": str(receipt.record_id) if receipt.record_id else None,
            "client_id": str(receipt.client_id) if receipt.client_id else None,
            "card_id": str(receipt.loyalty_card_id) if receipt.loyalty_card_id else None,
            "author_id": str(author_id) if author_id else None,
            "author_name": author_name,
        },
    )


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
