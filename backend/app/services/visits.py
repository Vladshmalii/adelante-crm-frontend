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

from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.master import Client
from app.models.shard import (
    SYSTEM_METHOD_TYPES,
    AuditAction,
    CashRegister,
    DiscountSource,
    FinanceOperation,
    OperationType,
    PaymentMethod,
    PaymentMethodType,
    PaymentStatus,
    Receipt,
    ReceiptCertificateLine,
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
from app.services import certificates, checkout, loyalty
from app.services import payments as payments_service
from app.services.audit import write_audit
from app.services.ledger import money
from app.services.records import emit_record_updated, record_title


class CompletionError(Exception):
    pass


class PaymentError(Exception):
    pass


class StaleCheckout(PaymentError):
    """expectedTotal не совпал с итогом сервера — предпросмотр устарел."""


class PaymentPart(BaseModel):
    payment_method_id: uuid.UUID
    amount: Decimal
    # Для способа «Сертифікат» — код сертификата (certificates.md, раздел 5)
    certificate_code: str | None = None


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
    """Суммы частей, которые списываются со счетов клиента и сертификатов в Master DB."""
    by_type: dict[PaymentMethodType, Decimal] = {}
    redemptions = []
    for part in payments:
        method_type = methods[part.payment_method_id].type
        by_type[method_type] = by_type.get(method_type, Decimal(0)) + part.amount
        if method_type == PaymentMethodType.CERTIFICATE:
            if not (part.certificate_code or "").strip():
                raise PaymentError("Вкажіть код сертифіката")
            redemptions.append(
                certificates.Redemption(code=part.certificate_code or "", amount=part.amount)
            )
    return payments_service.Charges(
        account=by_type.get(PaymentMethodType.ACCOUNT, Decimal(0)),
        bonus=by_type.get(PaymentMethodType.BONUS, Decimal(0)),
        total=sum((p.amount for p in payments), Decimal(0)),
        redemptions=tuple(redemptions),
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
    quote: "checkout.Quote | None" = None,
    issued: "payments_service.ChargeResult | None" = None,
    issues: "list[certificates.Issue] | None" = None,
) -> Receipt:
    """Чек + разбивка по способам оплаты + приходные операции по каждой оплате.

    Операция способа без кассы (account, bonus) пишется с cash_register_id = NULL:
    выручка признаётся (доход на дашборде), но в баланс кассы не попадает — денег
    в кассе нет. Чек без единого способа с кассой не имеет кассы.

    Часть способом «Сертифікат» — только в receipt_payments, без income: выручка
    признана при продаже сертификата (certificates.md, решение 10).

    Проданные сертификаты (issues) — строки receipt_certificate_lines. Их сумма
    забирается из кассовых частей по порядку: кассовая часть, покрывающая и
    сертификат, и остальное, делится на две операции — «certificates» и обычную
    (certificates.md, 4.3). Сумма income по-прежнему = сумме частей.
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
        subtotal=quote.sold if quote else None,
        discount_amount=quote.discount if quote else Decimal(0),
        discount_source=quote.discount_source if quote else DiscountSource.NONE,
        amount=sum((p.amount for p in payments), Decimal(0)),
        status=ReceiptStatus.PAID,
        source=source,
        author_id=author_id,
        author_name=author_name,
    )
    tenant_session.add(receipt)
    await tenant_session.flush()

    for item in issues or []:
        tenant_session.add(
            ReceiptCertificateLine(
                receipt_id=receipt.id,
                template_id=item.template_id,
                name=item.name,
                amount=item.amount,
                certificate_id=issued.certificate_id(item.line, item.n) if issued else None,
            )
        )
    # Сертификаты оплачиваются только кассовыми способами (check_certificate_parts)
    certificates_left = sum((i.amount for i in issues or []), Decimal(0))

    def income(method: PaymentMethod, amount: Decimal, category: str, description: str) -> None:
        tenant_session.add(
            FinanceOperation(
                type=OperationType.INCOME,
                amount=amount,
                category=category,
                description=description,
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

    for part in payments:
        method = methods[part.payment_method_id]
        tenant_session.add(
            ReceiptPayment(receipt_id=receipt.id, payment_method_id=method.id, amount=part.amount)
        )
        if method.type == PaymentMethodType.CERTIFICATE:
            continue
        rest = part.amount
        if certificates_left > 0 and not method.is_system:
            share = min(certificates_left, rest)
            certificates_left -= share
            rest -= share
            income(method, share, "certificates", f"Продаж сертифікатів: чек {receipt.number}")
        if rest > 0:
            income(
                method,
                rest,
                "services" if record else "sales",
                f"Оплата візиту: {record.client_name}" if record else f"Чек {receipt.number}",
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
    bonus_record_service_ids: list[uuid.UUID] | None = None,
    expected_total: Decimal | None = None,
    certificate_sales: list[certificates.CertificateSale] | None = None,
) -> Receipt:
    """Оплата визита (раздел 6). Итог считает сервер: бонусные услуги, наибольшая скидка.

    Части account/bonus списываются в Master до записи чека, там же выпускаются
    проданные сертификаты. Коммитит обе сессии сама. Повтор с тем же
    Idempotency-Key возвращает тот же чек.
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

    ctx = await checkout.load_context(master_session, record.client_id, salon_id)
    bonus_ids = frozenset(bonus_record_service_ids or [])
    if bonus_ids - {s.id for s in record.services}:
        raise PaymentError("Бонусна послуга не належить цьому запису")
    if bonus_ids and ctx.card is None:
        raise PaymentError("Бонусні послуги доступні лише з карткою, що діє в цьому салоні")
    issues = await _certificate_issues(master_session, certificate_sales)
    q = ctx.quote(checkout.record_lines(record, bonus_ids) + checkout.certificate_lines(issues))
    check_total(q, payments, expected_total)
    methods = await load_methods(tenant_session, payments)
    check_certificate_parts(q, payments, methods)
    card_id = ctx.card.id if ctx.card else None
    charges = replace(
        charges_for(payments, methods),
        card_id=card_id,
        total=q.rest,
        issues=tuple(issues),
        service_lines=tuple(q.service_amounts()),
        bonus_lines=tuple(
            loyalty.BonusLine(record_service_id=s.id, service_id=s.service_id, is_bonus=True)
            for s in record.services
            if s.id in bonus_ids
        ),
    )

    async def write_shard(result: payments_service.ChargeResult) -> Receipt:
        record.discount_amount = q.discount
        record.discount_source = q.discount_source
        record.loyalty_card_id = card_id
        record.total_amount = q.total
        for item in record.services:
            item.is_bonus = item.id in bonus_ids
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
            quote=q,
            issued=result,
            issues=issues,
        )
        emit_receipt_paid(
            tenant_session,
            salon_id=salon_id,
            receipt=receipt,
            methods=methods,
            result=result,
            quote=q,
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
                **(
                    {"discount": [None, f"{q.discount} ({q.discount_source.value})"]}
                    if q.discount > 0
                    else {}
                ),
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


def check_total(
    q: checkout.Quote, payments: list[PaymentPart], expected_total: Decimal | None
) -> None:
    """Сумма частей = итог; expectedTotal — защита от устаревшего предпросмотра (409)."""
    if expected_total is not None and money(expected_total) != q.total:
        raise StaleCheckout(
            f"Сума до сплати змінилася: {q.total} ₴ замість {money(expected_total)} ₴ — "
            "оновіть дані оплати"
        )
    paid = sum((p.amount for p in payments), Decimal(0))
    if paid != q.total:
        raise PaymentError(f"Сума оплати {paid} не збігається з сумою до сплати {q.total}")


def sale_lines(subtotal: Decimal, issues: list[certificates.Issue]) -> list[checkout.Line]:
    """Строки продажи: «Товари» (если есть) и сертификаты."""
    products = checkout.sale_lines(subtotal) if subtotal > 0 or not issues else []
    return products + checkout.certificate_lines(issues)


async def _certificate_issues(
    master_session: AsyncSession, sales: list[certificates.CertificateSale] | None
) -> list[certificates.Issue]:
    try:
        return await checkout.certificate_issues(master_session, sales or [])
    except certificates.CertificateError as exc:
        raise PaymentError(str(exc))


def check_certificate_parts(
    q: checkout.Quote, payments: list[PaymentPart], methods: dict[uuid.UUID, PaymentMethod]
) -> None:
    """Сертификат покупают только деньгами в кассу (certificates.md, 4.2).

    Счёт, кешбэк и другой сертификат покрывают лишь остальную часть чека —
    иначе долг или кешбэк превратились бы в сертификат.
    """
    if q.certificates <= 0:
        return
    system = sum((p.amount for p in payments if methods[p.payment_method_id].is_system), Decimal(0))
    if system > q.rest:
        raise PaymentError(
            f"Сертифікати ({q.certificates} ₴) оплачуються лише касовими способами: "
            f"з рахунку чи кешбеком — не більше {q.rest} ₴"
        )


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
    subtotal: Decimal | None = None,
    expected_total: Decimal | None = None,
    certificate_sales: list[certificates.CertificateSale] | None = None,
) -> Receipt:
    """Чек без записи (продажа товаров) — те же способы оплаты и скидки, что у визита.

    subtotal — «Продано» товаров: скидка считается от него, части оплаты = итог.
    Без subtotal — как раньше: сумма чека = сумма частей, без скидки. Сертификаты —
    отдельные строки вне скидки; чек может состоять из одних сертификатов. Коммитит сам.
    """
    receipt_id = payments_service.receipt_id_for(salon_id, idempotency_key)
    existing = await payments_service.lock_receipt(tenant_session, receipt_id)
    if existing is not None:
        return existing
    if client_id is not None:
        client = await master_session.get(Client, client_id)
        if client is None or not client.is_active:
            raise PaymentError("Клієнта не знайдено")
        client_name = client_name or client.full_name
    ctx = await checkout.load_context(master_session, client_id, salon_id)
    issues = await _certificate_issues(master_session, certificate_sales)
    if subtotal is None and not issues:
        q = checkout.quote(checkout.sale_lines(sum((p.amount for p in payments), Decimal(0))))
    else:
        q = ctx.quote(sale_lines(subtotal or Decimal(0), issues))
    check_total(q, payments, expected_total)
    methods = await load_methods(tenant_session, payments)
    check_certificate_parts(q, payments, methods)
    # Чек из одних сертификатов карту не затрагивает: ни скидки, ни кешбэка, ни факта визита
    card_id = ctx.card.id if ctx.card and q.rest > 0 else None
    charges = replace(
        charges_for(payments, methods),
        card_id=card_id,
        total=q.rest,
        issues=tuple(issues),
        service_lines=tuple(q.service_amounts()),
    )
    if client_id is None and charges.redemptions:
        raise PaymentError("Для оплати сертифікатом оберіть клієнта")
    if client_id is None and charges.needs_client:
        raise PaymentError("Для оплати з рахунку оберіть клієнта")

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
            quote=q,
            issued=result,
            issues=issues,
        )
        emit_receipt_paid(
            tenant_session,
            salon_id=salon_id,
            receipt=receipt,
            methods=methods,
            result=result,
            quote=q,
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


def emit_receipt_paid(
    tenant_session: AsyncSession,
    *,
    salon_id: uuid.UUID,
    receipt: Receipt,
    methods: dict[uuid.UUID, PaymentMethod],
    result: payments_service.ChargeResult,
    quote: checkout.Quote,
) -> None:
    """loyalty.receipt_paid — только для чека с картой: воркер пишет факт визита и начисления.

    Строки-сертификаты в событие не попадают (certificates.md, решение 11): ни в
    «Продано», ни в итог, ни в базу кешбэка. Они оплачены кассовыми способами —
    их сумма вычитается из части «other». Кешбэк начислится при погашении.
    """
    if receipt.loyalty_card_id is None:
        return
    parts: dict[str, Decimal] = {}
    for p in receipt.payments:
        method_type = methods[p.payment_method_id].type
        key = method_type.value if method_type in SYSTEM_METHOD_TYPES else "other"
        parts[key] = parts.get(key, Decimal(0)) + p.amount
    if quote.certificates > 0:
        parts["other"] = parts.get("other", Decimal(0)) - quote.certificates
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
            "sold": str(quote.sold - quote.certificates),
            "discount": str(quote.discount),
            "total": str(receipt.amount - quote.certificates),
            "parts": {k: str(v) for k, v in parts.items()},
            "account_balance_before": (
                str(result.account_balance_before)
                if result.account_balance_before is not None
                else None
            ),
            "lines": [line.payload() for line in quote.lines if not line.is_certificate],
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
    record.total_amount = record.price
    record.discount_amount = Decimal(0)
    record.discount_source = DiscountSource.NONE
    record.loyalty_card_id = None
    for item in record.services:
        item.is_bonus = False
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
