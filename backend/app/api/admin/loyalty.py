"""Карты лояльности и их типы (backend/docs/loyalty-accounts.md, разделы 7–9).

Права: карту, плитки и историю видят все (мастер — только своих клиентов);
выдача и удаление — администратор; корректировка кешбэка, типы карт и уровни —
суперюзер. Список типов читает и администратор — он выбирает тип при выдаче.
"""

import uuid
from datetime import datetime
from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from pydantic import Field, model_validator
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.admin.accounts import TransactionOut, list_transactions, transactions_out
from app.api.admin.deps import CurrentAuthor, ensure_own_client
from app.api.schemas import ApiModel, Envelope, PersonRef, page_meta
from app.api.security import (
    AdminUser,
    AuthenticatedUser,
    CurrentUser,
    SuperUser,
    require_salon_access,
)
from app.models.master import (
    CardStatus,
    Client,
    LevelBasis,
    LoyaltyCard,
    LoyaltyCardType,
    LoyaltyCardVisit,
    LoyaltyDiscountLevel,
    Salon,
    TransactionType,
)
from app.services import ledger, loyalty
from app.tenancy.deps import MasterSession, SalonId, TenantSession
from app.timeutils import LocalDatetime

router = APIRouter(tags=["loyalty"], dependencies=[Depends(require_salon_access)])

Percent = Annotated[Decimal, Field(ge=0, le=100, max_digits=5, decimal_places=2)]
Amount = Annotated[Decimal, Field(ge=0, max_digits=12, decimal_places=2)]


# --- Типы карт ----------------------------------------------------------------------


class LevelIn(ApiModel):
    threshold: Amount
    discount_percent: Percent = Decimal(0)
    discount_fixed: Amount = Decimal(0)
    name: str | None = Field(default=None, max_length=64)


class LevelOut(ApiModel):
    threshold: Decimal
    discount_percent: Decimal
    discount_fixed: Decimal
    name: str | None


class CardTypeOut(ApiModel):
    id: uuid.UUID
    name: str
    is_active: bool
    cashback_percent: Decimal
    cashback_on_services: bool
    cashback_on_products: bool
    cashback_max_payment_percent: Decimal
    cashback_ttl_days: int | None
    level_basis: LevelBasis
    salons: list[PersonRef]
    levels: list[LevelOut]
    created_at: datetime
    updated_at: datetime


class CardTypeFields(ApiModel):
    @model_validator(mode="after")
    def _levels(self):  # type: ignore[no-untyped-def]
        levels = getattr(self, "levels", None)
        if levels:
            thresholds = [lv.threshold for lv in levels]
            if len(set(thresholds)) != len(thresholds):
                raise ValueError("Пороги рівнів не повинні повторюватися")
        return self


class CardTypeIn(CardTypeFields):
    name: str = Field(min_length=1, max_length=255)
    is_active: bool = True
    cashback_percent: Percent = Decimal(0)
    cashback_on_services: bool = True
    cashback_on_products: bool = True
    cashback_max_payment_percent: Percent = Decimal(100)
    cashback_ttl_days: int | None = Field(default=None, ge=1)
    level_basis: LevelBasis = LevelBasis.SOLD_AMOUNT
    salon_ids: list[uuid.UUID] = Field(default_factory=list)
    levels: list[LevelIn] = Field(default_factory=list)


class CardTypePatchIn(CardTypeFields):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    is_active: bool | None = None
    cashback_percent: Percent | None = None
    cashback_on_services: bool | None = None
    cashback_on_products: bool | None = None
    cashback_max_payment_percent: Percent | None = None
    cashback_ttl_days: int | None = Field(default=None, ge=1)
    level_basis: LevelBasis | None = None
    # Передан — заменяет список целиком
    salon_ids: list[uuid.UUID] | None = None
    levels: list[LevelIn] | None = None


def card_type_out(t: LoyaltyCardType) -> CardTypeOut:
    return CardTypeOut(
        id=t.id,
        name=t.name,
        is_active=t.is_active,
        cashback_percent=t.cashback_percent,
        cashback_on_services=t.cashback_on_services,
        cashback_on_products=t.cashback_on_products,
        cashback_max_payment_percent=t.cashback_max_payment_percent,
        cashback_ttl_days=t.cashback_ttl_days,
        level_basis=t.level_basis,
        salons=[PersonRef(id=str(s.id), name=s.name) for s in t.salons],
        levels=[LevelOut.model_validate(lv) for lv in t.levels],
        created_at=t.created_at,
        updated_at=t.updated_at,
    )


async def _salons(master_session: AsyncSession, salon_ids: list[uuid.UUID]) -> list[Salon]:
    salons = list(await master_session.scalars(select(Salon).where(Salon.id.in_(salon_ids))))
    if len(salons) != len(set(salon_ids)):
        raise HTTPException(422, "Салон не знайдено")
    return salons


def _check_thresholds(basis: LevelBasis, levels: list[LevelIn]) -> None:
    if basis == LevelBasis.VISITS and any(lv.threshold != int(lv.threshold) for lv in levels):
        raise HTTPException(422, "Поріг рівня за візитами — ціле число")


async def _get_card_type(master_session: AsyncSession, type_id: uuid.UUID) -> LoyaltyCardType:
    card_type = await master_session.get(LoyaltyCardType, type_id)
    if card_type is None:
        raise HTTPException(404, "Тип картки не знайдено")
    return card_type


@router.get("/loyalty/card-types", response_model=Envelope[list[CardTypeOut]])
async def list_card_types(
    _admin: AdminUser, master_session: MasterSession
) -> Envelope[list[CardTypeOut]]:
    types = await master_session.scalars(select(LoyaltyCardType).order_by(LoyaltyCardType.name))
    return Envelope(data=[card_type_out(t) for t in types])


@router.get("/loyalty/card-types/{type_id}", response_model=Envelope[CardTypeOut])
async def get_card_type(
    type_id: uuid.UUID, _admin: AdminUser, master_session: MasterSession
) -> Envelope[CardTypeOut]:
    return Envelope(data=card_type_out(await _get_card_type(master_session, type_id)))


@router.post(
    "/loyalty/card-types",
    response_model=Envelope[CardTypeOut],
    status_code=status.HTTP_201_CREATED,
)
async def create_card_type(
    body: CardTypeIn, _superuser: SuperUser, master_session: MasterSession
) -> Envelope[CardTypeOut]:
    _check_thresholds(body.level_basis, body.levels)
    data = body.model_dump(by_alias=False, exclude={"salon_ids", "levels"})
    card_type = LoyaltyCardType(**data)
    card_type.salons = await _salons(master_session, body.salon_ids)
    card_type.levels = [LoyaltyDiscountLevel(**lv.model_dump(by_alias=False)) for lv in body.levels]
    master_session.add(card_type)
    await master_session.flush()
    await master_session.refresh(card_type)
    return Envelope(data=card_type_out(card_type))


@router.patch("/loyalty/card-types/{type_id}", response_model=Envelope[CardTypeOut])
async def patch_card_type(
    type_id: uuid.UUID,
    body: CardTypePatchIn,
    _superuser: SuperUser,
    master_session: MasterSession,
) -> Envelope[CardTypeOut]:
    """Новые проценты и уровни применяются к следующим чекам; начисленное не пересчитывается."""
    card_type = await _get_card_type(master_session, type_id)
    updates = body.model_dump(exclude_unset=True, by_alias=False, exclude={"salon_ids", "levels"})
    for field, value in updates.items():
        # null допустим только у срока сгорания: «не сгорает»
        if value is None and field != "cashback_ttl_days":
            raise HTTPException(422, f"Поле {field} не можна очистити")
        setattr(card_type, field, value)
    if body.salon_ids is not None:
        card_type.salons = await _salons(master_session, body.salon_ids)
    if body.levels is not None:
        _check_thresholds(card_type.level_basis, body.levels)
        card_type.levels = []
        await master_session.flush()
        card_type.levels = [
            LoyaltyDiscountLevel(**lv.model_dump(by_alias=False)) for lv in body.levels
        ]
    elif "level_basis" in updates:
        _check_thresholds(
            card_type.level_basis,
            [LevelIn.model_validate(lv, from_attributes=True) for lv in card_type.levels],
        )
    await master_session.flush()
    await master_session.refresh(card_type)
    return Envelope(data=card_type_out(card_type))


# --- Карты клиента ------------------------------------------------------------------


class CardTypeBrief(ApiModel):
    id: uuid.UUID
    name: str
    cashback_percent: Decimal
    cashback_max_payment_percent: Decimal
    cashback_ttl_days: int | None
    level_basis: LevelBasis


class LevelRef(ApiModel):
    name: str | None
    threshold: Decimal
    discount_percent: Decimal
    discount_fixed: Decimal


class NextLevelRef(ApiModel):
    name: str | None
    threshold: Decimal
    remaining: Decimal


class LoyaltyCardOut(ApiModel):
    id: uuid.UUID
    number: str
    client_id: uuid.UUID
    status: CardStatus
    card_type: CardTypeBrief
    # Действует ли карта в текущем салоне (X-Salon-Id)
    applies_here: bool
    # Плитки (раздел 7)
    cashback_balance: Decimal
    max_discount_percent: Decimal
    max_discount_fixed: Decimal
    bonus_accrued: int = 0
    bonus_available: int = 0
    sold_total: Decimal
    paid_total: Decimal
    visits_count: int
    level: LevelRef | None
    next_level: NextLevelRef | None
    issued_at: datetime
    issued_by: PersonRef
    issued_salon: PersonRef | None
    deleted_at: datetime | None
    deleted_by: PersonRef | None


async def cards_out(
    master_session: AsyncSession, cards: list[LoyaltyCard], salon_id: uuid.UUID
) -> list[LoyaltyCardOut]:
    def build(session) -> list[LoyaltyCardOut]:  # type: ignore[no-untyped-def]
        salon_ids = {c.issued_salon_id for c in cards if c.issued_salon_id}
        salons = dict(
            session.execute(select(Salon.id, Salon.name).where(Salon.id.in_(salon_ids)))
            .tuples()
            .all()
        )
        result = []
        for card in cards:
            account = loyalty.cashback_account(session, card.id)
            state = loyalty.level_state(card)
            t = card.card_type
            result.append(
                LoyaltyCardOut(
                    id=card.id,
                    number=card.number,
                    client_id=card.client_id,
                    status=card.status,
                    card_type=CardTypeBrief.model_validate(t),
                    applies_here=loyalty.applies_in(card, salon_id),
                    cashback_balance=account.balance if account else Decimal(0),
                    max_discount_percent=(
                        state.current.discount_percent if state.current else Decimal(0)
                    ),
                    max_discount_fixed=state.current.discount_fixed
                    if state.current
                    else Decimal(0),
                    sold_total=card.sold_total,
                    paid_total=card.paid_total,
                    visits_count=card.visits_count,
                    level=LevelRef.model_validate(state.current) if state.current else None,
                    next_level=(
                        NextLevelRef(
                            name=state.next.name,
                            threshold=state.next.threshold,
                            remaining=state.remaining,
                        )
                        if state.next is not None and state.remaining is not None
                        else None
                    ),
                    issued_at=card.issued_at,
                    issued_by=PersonRef(
                        id=str(card.issued_by) if card.issued_by else None,
                        name=card.issued_by_name,
                    ),
                    issued_salon=(
                        PersonRef(
                            id=str(card.issued_salon_id), name=salons.get(card.issued_salon_id)
                        )
                        if card.issued_salon_id
                        else None
                    ),
                    deleted_at=card.deleted_at,
                    deleted_by=(
                        PersonRef(id=str(card.deleted_by), name=card.deleted_by_name)
                        if card.deleted_by
                        else None
                    ),
                )
            )
        return result

    return await master_session.run_sync(build)


async def _client(master_session: AsyncSession, client_id: uuid.UUID) -> Client:
    client = await master_session.get(Client, client_id)
    if client is None:
        raise HTTPException(404, "Клієнта не знайдено")
    return client


async def _card(
    master_session: AsyncSession,
    tenant_session: AsyncSession,
    user: AuthenticatedUser,
    card_id: uuid.UUID,
) -> LoyaltyCard:
    card = await master_session.get(LoyaltyCard, card_id)
    if card is None:
        raise HTTPException(404, "Картку не знайдено")
    await ensure_own_client(tenant_session, user, card.client_id)
    return card


@router.get("/clients/{client_id}/loyalty-cards", response_model=Envelope[list[LoyaltyCardOut]])
async def client_cards(
    client_id: uuid.UUID,
    user: CurrentUser,
    salon_id: SalonId,
    master_session: MasterSession,
    tenant_session: TenantSession,
    card_status: Annotated[CardStatus | None, Query(alias="status")] = None,
) -> Envelope[list[LoyaltyCardOut]]:
    await ensure_own_client(tenant_session, user, client_id)
    await _client(master_session, client_id)
    query = select(LoyaltyCard).where(LoyaltyCard.client_id == client_id)
    if card_status is not None:
        query = query.where(LoyaltyCard.status == card_status)
    cards = list(await master_session.scalars(query.order_by(LoyaltyCard.issued_at.desc())))
    return Envelope(data=await cards_out(master_session, cards, salon_id))


class CardIssueIn(ApiModel):
    card_type_id: uuid.UUID
    # Не передан — номер генерируется системой
    number: str | None = Field(default=None, min_length=16, max_length=16, pattern=r"^\d{16}$")


@router.post(
    "/clients/{client_id}/loyalty-cards",
    response_model=Envelope[LoyaltyCardOut],
    status_code=status.HTTP_201_CREATED,
)
async def issue_card(
    client_id: uuid.UUID,
    body: CardIssueIn,
    _admin: AdminUser,
    author: CurrentAuthor,
    salon_id: SalonId,
    master_session: MasterSession,
) -> Envelope[LoyaltyCardOut]:
    client = await _client(master_session, client_id)
    if not client.is_active:
        raise HTTPException(404, "Клієнта не знайдено")
    try:
        card = await master_session.run_sync(
            lambda s: loyalty.issue_card(
                s,
                client_id=client_id,
                card_type_id=body.card_type_id,
                number=body.number,
                salon_id=salon_id,
                author_id=author.id,
                author_name=author.name,
            )
        )
    except loyalty.LoyaltyError as exc:
        raise HTTPException(409, str(exc))
    return Envelope(data=(await cards_out(master_session, [card], salon_id))[0])


class GeneratedNumberOut(ApiModel):
    number: str


@router.get("/loyalty-cards/generate-number", response_model=Envelope[GeneratedNumberOut])
async def generate_number(
    _admin: AdminUser, master_session: MasterSession
) -> Envelope[GeneratedNumberOut]:
    """Свободный номер для формы выдачи; занятость окончательно проверяется при выдаче."""
    number = await master_session.run_sync(loyalty.generate_number)
    return Envelope(data=GeneratedNumberOut(number=number))


@router.delete("/loyalty-cards/{card_id}", response_model=Envelope[LoyaltyCardOut])
async def delete_card(
    card_id: uuid.UUID,
    _admin: AdminUser,
    author: CurrentAuthor,
    salon_id: SalonId,
    master_session: MasterSession,
) -> Envelope[LoyaltyCardOut]:
    """Удаление: кешбэк сгорает; новая карта начнётся с нуля, уровень тоже сбросится."""
    try:
        card = await master_session.run_sync(
            lambda s: loyalty.delete_card(
                s, card_id, salon_id=salon_id, author_id=author.id, author_name=author.name
            )
        )
    except loyalty.LoyaltyError as exc:
        raise HTTPException(404 if "не знайдено" in str(exc) else 409, str(exc))
    return Envelope(data=(await cards_out(master_session, [card], salon_id))[0])


@router.get("/loyalty-cards/{card_id}/transactions", response_model=Envelope[list[TransactionOut]])
async def card_transactions(
    card_id: uuid.UUID,
    user: CurrentUser,
    master_session: MasterSession,
    tenant_session: TenantSession,
    types: Annotated[list[TransactionType] | None, Query(alias="type")] = None,
    date_from: Annotated[LocalDatetime | None, Query(alias="dateFrom")] = None,
    date_to: Annotated[LocalDatetime | None, Query(alias="dateTo")] = None,
    page: int = 1,
    per_page: Annotated[int, Query(alias="perPage", le=200)] = 50,
) -> Envelope[list[TransactionOut]]:
    """История кешбек-рахунку карты."""
    card = await _card(master_session, tenant_session, user, card_id)
    account = await master_session.run_sync(lambda s: loyalty.cashback_account(s, card.id))
    return await list_transactions(
        master_session,
        account.id if account else None,
        types=types,
        date_from=date_from,
        date_to=date_to,
        page=page,
        per_page=per_page,
    )


class CardVisitOut(ApiModel):
    id: uuid.UUID
    salon: PersonRef
    receipt_id: uuid.UUID
    record_id: uuid.UUID | None
    is_visit: bool
    sold_amount: Decimal
    discount_amount: Decimal
    paid_amount: Decimal
    cashback_base: Decimal
    happened_at: datetime
    reversed_at: datetime | None


@router.get("/loyalty-cards/{card_id}/visits", response_model=Envelope[list[CardVisitOut]])
async def card_visits(
    card_id: uuid.UUID,
    user: CurrentUser,
    master_session: MasterSession,
    tenant_session: TenantSession,
    page: int = 1,
    per_page: Annotated[int, Query(alias="perPage", le=200)] = 50,
) -> Envelope[list[CardVisitOut]]:
    """Факты визитов по карте во всех салонах сети, отменённые — с reversedAt."""
    card = await _card(master_session, tenant_session, user, card_id)
    base = select(LoyaltyCardVisit).where(LoyaltyCardVisit.card_id == card.id)
    total = await master_session.scalar(select(func.count()).select_from(base.subquery()))
    visits = list(
        await master_session.scalars(
            base.order_by(LoyaltyCardVisit.happened_at.desc())
            .offset((page - 1) * per_page)
            .limit(per_page)
        )
    )
    salon_ids = {v.salon_id for v in visits}
    salons = (
        dict(
            (
                await master_session.execute(
                    select(Salon.id, Salon.name).where(Salon.id.in_(salon_ids))
                )
            )
            .tuples()
            .all()
        )
        if salon_ids
        else {}
    )
    return Envelope(
        data=[
            CardVisitOut(
                id=v.id,
                salon=PersonRef(id=str(v.salon_id), name=salons.get(v.salon_id)),
                receipt_id=v.receipt_id,
                record_id=v.record_id,
                is_visit=v.is_visit,
                sold_amount=v.sold_amount,
                discount_amount=v.discount_amount,
                paid_amount=v.paid_amount,
                cashback_base=v.cashback_base,
                happened_at=v.happened_at,
                reversed_at=v.reversed_at,
            )
            for v in visits
        ],
        meta=page_meta(page, per_page, total or 0),
    )


class CashbackAdjustmentIn(ApiModel):
    amount: Decimal = Field(max_digits=12, decimal_places=2)
    comment: str = Field(min_length=1, max_length=2000)


@router.post(
    "/loyalty-cards/{card_id}/cashback-adjustments",
    response_model=Envelope[TransactionOut],
    status_code=status.HTTP_201_CREATED,
)
async def adjust_cashback(
    card_id: uuid.UUID,
    body: CashbackAdjustmentIn,
    _superuser: SuperUser,
    author: CurrentAuthor,
    salon_id: SalonId,
    master_session: MasterSession,
    idempotency_key: Annotated[str | None, Header(alias="Idempotency-Key", max_length=100)] = None,
) -> Envelope[TransactionOut]:
    """Ручная корректировка кешбэка с любым знаком — только суперюзер, комментарий обязателен."""
    card = await master_session.get(LoyaltyCard, card_id)
    if card is None:
        raise HTTPException(404, "Картку не знайдено")
    meta = ledger.Meta(
        salon_id=salon_id, author_id=author.id, author_name=author.name, comment=body.comment
    )
    key = f"adjustment:card:{card_id}:{idempotency_key or uuid.uuid4()}"

    def operation(session):  # type: ignore[no-untyped-def]
        account = loyalty.lock_cashback_account(session, card.id)
        return ledger.adjust(session, account, body.amount, key=key, meta=meta)

    try:
        txn = await master_session.run_sync(operation)
    except (ledger.LedgerError, loyalty.LoyaltyError) as exc:
        raise HTTPException(409, str(exc))
    return Envelope(data=(await transactions_out(master_session, [txn]))[0])
