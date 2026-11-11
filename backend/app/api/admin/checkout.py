"""Предпросмотр оплаты — всё для модалки (backend/docs/loyalty-accounts.md, раздел 6, шаг 1).

GET /records/{id}/checkout — оплата визита; GET /finances/receipts/checkout —
продажа без записи (раздел 15). Итог считается так же, как при самой оплате
(app.services.checkout); его стоит вернуть в оплату как expectedTotal — при
расхождении (изменилась скидка, уровень, цена) оплата ответит 409.

certificateTemplateIds — продаваемые в чеке сертификаты, по одному id на штуку
(certificates.md, раздел 4): строки вне скидки, кешбэк к оплате — только от остального.

products — товары со склада, повторяемый параметр `<productId>:<mode>:<quantity>`
(product-sales.md, раздел 4): строки в скидке и кешбэке. Нехватка остатка — 409.

subscriptionTypeIds — продаваемые абонементы, по одному id на абонемент (subscriptions.md,
раздел 5): строки в скидке и кешбэке; архивный тип — 422; в продаже без записи нужен clientId.
"""

import uuid
from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query

from app.api.admin.inventory import ProductSaleIn
from app.api.schemas import ApiModel, Envelope
from app.api.security import AdminUser, require_salon_access
from app.models.shard import (
    DiscountSource,
    PaymentStatus,
    ProductSaleMode,
    Record,
    RecordStatus,
)
from app.services import certificates, checkout, loyalty, product_sales, subscriptions, visits
from app.tenancy.deps import MasterSession, SalonId, TenantSession

router = APIRouter(tags=["checkout"], dependencies=[Depends(require_salon_access)])


class CheckoutLevelOut(ApiModel):
    name: str | None
    threshold: Decimal
    discount_percent: Decimal
    discount_fixed: Decimal


class CheckoutCardOut(ApiModel):
    id: uuid.UUID
    number: str
    card_type_name: str
    level: CheckoutLevelOut | None


class CheckoutLineOut(ApiModel):
    kind: str  # service | product | certificate | subscription
    record_service_id: uuid.UUID | None
    service_id: uuid.UUID | None
    name: str
    price: Decimal
    is_bonus: bool
    amount: Decimal
    # Можно отметить бесплатной: у карты есть доступная бонусная услуга правила
    bonus_available: bool = False
    bonus_rule_name: str | None = None
    # Строка-сертификат: шаблон продажи
    template_id: uuid.UUID | None = None
    # Строка-абонемент: тип продажи
    subscription_type_id: uuid.UUID | None = None
    # Строка-товар со склада: режим, количество как ввели, цена режима
    product_id: uuid.UUID | None = None
    mode: ProductSaleMode | None = None
    quantity: Decimal | None = None
    unit_price: Decimal | None = None


class DiscountCandidateOut(ApiModel):
    source: DiscountSource
    percent: Decimal | None
    amount: Decimal
    selected: bool


class CashbackOut(ApiModel):
    balance: Decimal
    # Максимум кешбэка к оплате в этом чеке: ≤ баланса и ≤ лимита % типа карты
    max_payment: Decimal
    percent: Decimal


class CheckoutOut(ApiModel):
    client_id: uuid.UUID | None
    card: CheckoutCardOut | None
    lines: list[CheckoutLineOut]
    sold: Decimal
    bonus_amount: Decimal
    discounts: list[DiscountCandidateOut]
    discount_source: DiscountSource
    discount_amount: Decimal
    total: Decimal
    # Сертификаты в итоге: оплачиваются только кассовыми способами
    certificates_amount: Decimal
    # Особовий рахунок: > 0 — доступно, < 0 — долг. Уход в минус = запись в долг
    account_balance: Decimal
    cashback: CashbackOut | None


def checkout_out(
    client_id: uuid.UUID | None,
    ctx: checkout.Context,
    q: checkout.Quote,
    bonus: dict[uuid.UUID, str] | None = None,
) -> CheckoutOut:
    bonus = bonus or {}
    card = ctx.card
    current = ctx.level.current if ctx.level else None
    return CheckoutOut(
        client_id=client_id,
        card=(
            CheckoutCardOut(
                id=card.id,
                number=card.number,
                card_type_name=card.card_type.name,
                level=CheckoutLevelOut.model_validate(current) if current else None,
            )
            if card
            else None
        ),
        lines=[
            CheckoutLineOut(
                kind=line.kind,
                record_service_id=line.record_service_id,
                service_id=line.service_id,
                name=line.name,
                price=line.price,
                is_bonus=line.is_bonus,
                amount=line.amount,
                bonus_available=line.record_service_id in bonus,
                bonus_rule_name=(
                    bonus.get(line.record_service_id) if line.record_service_id else None
                ),
                template_id=line.template_id,
                subscription_type_id=line.subscription_type_id,
                product_id=line.product_id,
                mode=line.mode,
                quantity=line.quantity,
                unit_price=line.unit_price,
            )
            for line in q.lines
        ],
        sold=q.sold,
        bonus_amount=q.bonus_amount,
        discounts=[
            DiscountCandidateOut(
                source=c.source,
                percent=c.percent,
                amount=c.amount,
                selected=c.source == q.discount_source,
            )
            for c in q.candidates
        ],
        discount_source=q.discount_source,
        discount_amount=q.discount,
        total=q.total,
        certificates_amount=q.certificates,
        account_balance=ctx.money_balance,
        cashback=(
            CashbackOut(
                balance=ctx.cashback_balance,
                max_payment=ctx.cashback_limit(q.rest),
                percent=card.card_type.cashback_percent,
            )
            if card
            else None
        ),
    )


CertificateTemplateIds = Annotated[
    list[uuid.UUID] | None, Query(alias="certificateTemplateIds", max_length=50)
]


def certificate_sales(template_ids: list[uuid.UUID] | None) -> list[certificates.CertificateSale]:
    """Id шаблонов по штуке → позиции продажи в порядке первого появления."""
    counts: dict[uuid.UUID, int] = {}
    for template_id in template_ids or []:
        counts[template_id] = counts.get(template_id, 0) + 1
    if any(n > certificates.MAX_QUANTITY for n in counts.values()):
        raise HTTPException(
            422, f"Не більше {certificates.MAX_QUANTITY} сертифікатів однієї позиції"
        )
    return [certificates.CertificateSale(template_id=t, quantity=n) for t, n in counts.items()]


async def _issues(
    master_session: MasterSession, template_ids: list[uuid.UUID] | None
) -> list[certificates.Issue]:
    try:
        return await checkout.certificate_issues(master_session, certificate_sales(template_ids))
    except certificates.SaleClosed as exc:
        raise HTTPException(422, str(exc))
    except certificates.CertificateError as exc:
        raise HTTPException(409, str(exc))


SubscriptionTypeIds = Annotated[
    list[uuid.UUID] | None,
    Query(alias="subscriptionTypeIds", max_length=subscriptions.MAX_SALES),
]


async def _subscription_issues(
    master_session: MasterSession, type_ids: list[uuid.UUID] | None
) -> list[subscriptions.Issue]:
    try:
        return await checkout.subscription_issues(
            master_session, [subscriptions.SubscriptionSale(type_id=t) for t in type_ids or []]
        )
    except subscriptions.SubscriptionError as exc:
        raise HTTPException(422, str(exc))


ProductSales = Annotated[
    list[str] | None, Query(alias="products", max_length=product_sales.MAX_LINES)
]


def parse_products(values: list[str] | None) -> list[product_sales.ProductSale]:
    """`<productId>:<mode>:<quantity>` → позиции продажи."""
    sales = []
    for value in values or []:
        parts = value.split(":")
        if len(parts) != 3:
            raise HTTPException(422, "Товар: очікується productId:mode:quantity")
        try:
            item = ProductSaleIn.model_validate(
                {"productId": parts[0], "mode": parts[1], "quantity": parts[2]}
            )
        except ValueError:
            raise HTTPException(422, "Товар: очікується productId:mode:quantity")
        sales.append(item.to_sale())
    return sales


async def _planned(
    tenant_session: TenantSession, values: list[str] | None
) -> list[product_sales.PlannedLine]:
    try:
        return await product_sales.plan(tenant_session, parse_products(values), lock=False)
    except product_sales.ProductSaleError as exc:
        raise HTTPException(exc.status_code, str(exc))


@router.get("/records/{record_id}/checkout", response_model=Envelope[CheckoutOut])
async def record_checkout(
    record_id: uuid.UUID,
    _admin: AdminUser,
    salon_id: SalonId,
    master_session: MasterSession,
    tenant_session: TenantSession,
    bonus_ids: Annotated[list[uuid.UUID] | None, Query(alias="bonusRecordServiceIds")] = None,
    template_ids: CertificateTemplateIds = None,
    products: ProductSales = None,
    subscription_type_ids: SubscriptionTypeIds = None,
) -> Envelope[CheckoutOut]:
    """Предпросмотр оплаты визита: карта и уровень, бонусные услуги, скидки, итог, балансы.

    bonusRecordServiceIds — строки, отмеченные бесплатными: итог считается с ними.
    """
    record = await tenant_session.get(Record, record_id)
    if record is None:
        raise HTTPException(404, "Запис не знайдено")
    if record.status != RecordStatus.COMPLETED or record.payment_status == PaymentStatus.PAID:
        raise HTTPException(409, "Оплатити можна лише завершений неоплачений візит")
    selected = frozenset(bonus_ids or [])
    if selected - {s.id for s in record.services}:
        raise HTTPException(422, "Бонусна послуга не належить цьому запису")
    ctx = await checkout.load_context(master_session, record.client_id, salon_id)
    try:
        bonus = await checkout.bonus_options(master_session, ctx, salon_id, record, selected)
    except loyalty.LoyaltyError as exc:
        raise HTTPException(409, str(exc))
    issues = await _issues(master_session, template_ids)
    sold_subscriptions = await _subscription_issues(master_session, subscription_type_ids)
    planned = await _planned(tenant_session, products)
    q = ctx.quote(
        checkout.record_lines(record, selected)
        + [line.line() for line in planned]
        + checkout.subscription_lines(sold_subscriptions)
        + checkout.certificate_lines(issues)
    )
    return Envelope(data=checkout_out(record.client_id, ctx, q, bonus))


@router.get("/finances/receipts/checkout", response_model=Envelope[CheckoutOut])
async def sale_checkout(
    _admin: AdminUser,
    salon_id: SalonId,
    master_session: MasterSession,
    tenant_session: TenantSession,
    subtotal: Annotated[Decimal | None, Query(ge=0, max_digits=12, decimal_places=2)] = None,
    client_id: Annotated[uuid.UUID | None, Query(alias="clientId")] = None,
    template_ids: CertificateTemplateIds = None,
    products: ProductSales = None,
    subscription_type_ids: SubscriptionTypeIds = None,
) -> Envelope[CheckoutOut]:
    """Предпросмотр продажи без записи: товары со склада и/или ручная сумма subtotal.

    Скидка — наибольшая. Без товаров и сертификатов subtotal обязателен.
    """
    if subtotal is None and not products and not template_ids and not subscription_type_ids:
        raise HTTPException(422, "Вкажіть товари або суму")
    if subscription_type_ids and client_id is None:
        raise HTTPException(422, "Абонемент продається клієнту — оберіть клієнта")
    ctx = await checkout.load_context(master_session, client_id, salon_id)
    if client_id is not None and (ctx.client is None or not ctx.client.is_active):
        raise HTTPException(404, "Клієнта не знайдено")
    issues = await _issues(master_session, template_ids)
    sold_subscriptions = await _subscription_issues(master_session, subscription_type_ids)
    planned = await _planned(tenant_session, products)
    q = ctx.quote(visits.sale_lines(subtotal or Decimal(0), issues, planned, sold_subscriptions))
    return Envelope(data=checkout_out(client_id, ctx, q))
