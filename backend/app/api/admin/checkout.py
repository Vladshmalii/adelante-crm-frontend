"""Предпросмотр оплаты — всё для модалки (backend/docs/loyalty-accounts.md, раздел 6, шаг 1).

GET /records/{id}/checkout — оплата визита; GET /finances/receipts/checkout —
продажа без записи (раздел 15). Итог считается так же, как при самой оплате
(app.services.checkout); его стоит вернуть в оплату как expectedTotal — при
расхождении (изменилась скидка, уровень, цена) оплата ответит 409.
"""

import uuid
from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query

from app.api.schemas import ApiModel, Envelope
from app.api.security import AdminUser, require_salon_access
from app.models.shard import DiscountSource, PaymentStatus, Record, RecordStatus
from app.services import checkout
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
    kind: str  # service | product
    record_service_id: uuid.UUID | None
    service_id: uuid.UUID | None
    name: str
    price: Decimal
    is_bonus: bool
    amount: Decimal


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
    # Особовий рахунок: > 0 — доступно, < 0 — долг. Уход в минус = запись в долг
    account_balance: Decimal
    cashback: CashbackOut | None


def checkout_out(
    client_id: uuid.UUID | None, ctx: checkout.Context, q: checkout.Quote
) -> CheckoutOut:
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
        account_balance=ctx.money_balance,
        cashback=(
            CashbackOut(
                balance=ctx.cashback_balance,
                max_payment=ctx.cashback_limit(q.total),
                percent=card.card_type.cashback_percent,
            )
            if card
            else None
        ),
    )


@router.get("/records/{record_id}/checkout", response_model=Envelope[CheckoutOut])
async def record_checkout(
    record_id: uuid.UUID,
    _admin: AdminUser,
    salon_id: SalonId,
    master_session: MasterSession,
    tenant_session: TenantSession,
) -> Envelope[CheckoutOut]:
    """Предпросмотр оплаты визита: карта и уровень, кандидаты скидки, итог, балансы."""
    record = await tenant_session.get(Record, record_id)
    if record is None:
        raise HTTPException(404, "Запис не знайдено")
    if record.status != RecordStatus.COMPLETED or record.payment_status == PaymentStatus.PAID:
        raise HTTPException(409, "Оплатити можна лише завершений неоплачений візит")
    ctx = await checkout.load_context(master_session, record.client_id, salon_id)
    q = ctx.quote(checkout.record_lines(record))
    return Envelope(data=checkout_out(record.client_id, ctx, q))


@router.get("/finances/receipts/checkout", response_model=Envelope[CheckoutOut])
async def sale_checkout(
    _admin: AdminUser,
    salon_id: SalonId,
    master_session: MasterSession,
    subtotal: Annotated[Decimal, Query(ge=0, max_digits=12, decimal_places=2)],
    client_id: Annotated[uuid.UUID | None, Query(alias="clientId")] = None,
) -> Envelope[CheckoutOut]:
    """Предпросмотр продажи без записи: subtotal — «Продано», скидка — наибольшая."""
    ctx = await checkout.load_context(master_session, client_id, salon_id)
    if client_id is not None and (ctx.client is None or not ctx.client.is_active):
        raise HTTPException(404, "Клієнта не знайдено")
    q = ctx.quote(checkout.sale_lines(subtotal))
    return Envelope(data=checkout_out(client_id, ctx, q))
