"""Особовий рахунок клиента (backend/docs/loyalty-accounts.md, разделы 5, 8, 9).

Счёт общий для сети и живёт в Master DB. Пополнение, возврат и корректировка
шард и кассы не затрагивают (решение 3): журнал счёта сам служит аудитом.

Права: смотреть — все (мастер — только своих клиентов), пополнение и возврат —
администратор, корректировка — суперюзер.
"""

import uuid
from datetime import datetime
from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from pydantic import Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.admin.deps import CurrentAuthor, ensure_own_client
from app.api.schemas import ApiModel, Envelope, PersonRef, page_meta
from app.api.security import AdminUser, CurrentUser, SuperUser, require_salon_access
from app.models.master import (
    AccountKind,
    AccountTransaction,
    Administrator,
    Client,
    ClientAccount,
    Master,
    Salon,
    TransactionType,
)
from app.services import ledger
from app.tenancy.deps import MasterSession, SalonId, TenantSession
from app.timeutils import LocalDatetime

router = APIRouter(tags=["accounts"], dependencies=[Depends(require_salon_access)])

IdempotencyKey = Annotated[str | None, Header(alias="Idempotency-Key", max_length=100)]


class AccountOut(ApiModel):
    client_id: uuid.UUID
    balance: Decimal


class TransactionOut(ApiModel):
    id: uuid.UUID
    type: TransactionType
    amount: Decimal
    balance_after: Decimal
    salon: PersonRef | None
    record_id: uuid.UUID | None
    receipt_id: uuid.UUID | None
    staff: PersonRef | None
    author: PersonRef
    comment: str | None
    reverses_id: uuid.UUID | None
    created_at: datetime


async def get_client(master_session: AsyncSession, client_id: uuid.UUID) -> Client:
    client = await master_session.get(Client, client_id)
    if client is None:
        raise HTTPException(404, "Клієнта не знайдено")
    return client


async def active_client(master_session: AsyncSession, client_id: uuid.UUID) -> Client:
    client = await get_client(master_session, client_id)
    if not client.is_active:
        raise HTTPException(404, "Клієнта не знайдено")
    return client


async def transactions_out(
    master_session: AsyncSession, txns: list[AccountTransaction]
) -> list[TransactionOut]:
    salon_ids = {t.salon_id for t in txns if t.salon_id}
    salons: dict[uuid.UUID, str] = {}
    if salon_ids:
        salons = dict(
            (
                await master_session.execute(
                    select(Salon.id, Salon.name).where(Salon.id.in_(salon_ids))
                )
            )
            .tuples()
            .all()
        )
    return [
        TransactionOut(
            id=t.id,
            type=t.type,
            amount=t.amount,
            balance_after=t.balance_after,
            salon=PersonRef(id=str(t.salon_id), name=salons.get(t.salon_id))
            if t.salon_id
            else None,
            record_id=t.record_id,
            receipt_id=t.receipt_id,
            staff=PersonRef(id=str(t.staff_id), name=t.staff_name) if t.staff_id else None,
            author=PersonRef(id=str(t.author_id) if t.author_id else None, name=t.author_name),
            comment=t.comment,
            reverses_id=t.reverses_id,
            created_at=t.created_at,
        )
        for t in txns
    ]


async def list_transactions(
    master_session: AsyncSession,
    account_id: uuid.UUID | None,
    *,
    types: list[TransactionType] | None,
    date_from: datetime | None,
    date_to: datetime | None,
    page: int,
    per_page: int,
) -> Envelope[list[TransactionOut]]:
    if account_id is None:
        return Envelope(data=[], meta=page_meta(page, per_page, 0))
    query = select(AccountTransaction).where(AccountTransaction.account_id == account_id)
    if types:
        query = query.where(AccountTransaction.type.in_(types))
    if date_from is not None:
        query = query.where(AccountTransaction.created_at >= date_from)
    if date_to is not None:
        query = query.where(AccountTransaction.created_at < date_to)
    total = await master_session.scalar(select(func.count()).select_from(query.subquery()))
    txns = list(
        await master_session.scalars(
            query.order_by(AccountTransaction.created_at.desc(), AccountTransaction.id)
            .offset((page - 1) * per_page)
            .limit(per_page)
        )
    )
    return Envelope(
        data=await transactions_out(master_session, txns),
        meta=page_meta(page, per_page, total or 0),
    )


async def money_balance(master_session: AsyncSession, client_id: uuid.UUID) -> Decimal:
    balance = await master_session.scalar(
        select(ClientAccount.balance).where(
            ClientAccount.client_id == client_id, ClientAccount.kind == AccountKind.MONEY
        )
    )
    return balance if balance is not None else Decimal("0.00")


async def staff_name(master_session: AsyncSession, staff_id: uuid.UUID) -> str:
    person = await master_session.get(Master, staff_id) or await master_session.get(
        Administrator, staff_id
    )
    if person is None:
        raise HTTPException(422, "Співробітника не знайдено")
    return person.full_name


def operation_key(prefix: str, client_key: str | None) -> str:
    """Ключ идемпотентности: из заголовка Idempotency-Key или случайный."""
    return f"{prefix}:{client_key or uuid.uuid4()}"


# --- Эндпоинты --------------------------------------------------------------


@router.get("/clients/{client_id}/account", response_model=Envelope[AccountOut])
async def get_account(
    client_id: uuid.UUID,
    user: CurrentUser,
    master_session: MasterSession,
    tenant_session: TenantSession,
) -> Envelope[AccountOut]:
    await ensure_own_client(tenant_session, user, client_id)
    await get_client(master_session, client_id)
    return Envelope(
        data=AccountOut(client_id=client_id, balance=await money_balance(master_session, client_id))
    )


@router.get(
    "/clients/{client_id}/account/transactions", response_model=Envelope[list[TransactionOut]]
)
async def get_account_transactions(
    client_id: uuid.UUID,
    user: CurrentUser,
    master_session: MasterSession,
    tenant_session: TenantSession,
    types: Annotated[list[TransactionType] | None, Query(alias="type")] = None,
    date_from: Annotated[LocalDatetime | None, Query(alias="dateFrom")] = None,
    date_to: Annotated[LocalDatetime | None, Query(alias="dateTo")] = None,
    page: int = 1,
    per_page: Annotated[int, Query(alias="perPage", le=200)] = 50,
) -> Envelope[list[TransactionOut]]:
    await ensure_own_client(tenant_session, user, client_id)
    await get_client(master_session, client_id)
    account_id = await master_session.scalar(
        select(ClientAccount.id).where(
            ClientAccount.client_id == client_id, ClientAccount.kind == AccountKind.MONEY
        )
    )
    return await list_transactions(
        master_session,
        account_id,
        types=types,
        date_from=date_from,
        date_to=date_to,
        page=page,
        per_page=per_page,
    )


class TopupIn(ApiModel):
    amount: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    staff_id: uuid.UUID | None = None
    comment: str | None = Field(default=None, max_length=2000)


class RefundIn(ApiModel):
    amount: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    comment: str | None = Field(default=None, max_length=2000)


class AdjustmentIn(ApiModel):
    amount: Decimal = Field(max_digits=12, decimal_places=2)
    comment: str = Field(min_length=1, max_length=2000)


async def _post_money(master_session: AsyncSession, operation) -> TransactionOut:
    try:
        txn = await master_session.run_sync(operation)
    except ledger.LedgerError as exc:
        raise HTTPException(409, str(exc))
    return (await transactions_out(master_session, [txn]))[0]


@router.post(
    "/clients/{client_id}/account/topups",
    response_model=Envelope[TransactionOut],
    status_code=status.HTTP_201_CREATED,
)
async def topup(
    client_id: uuid.UUID,
    body: TopupIn,
    _admin: AdminUser,
    author: CurrentAuthor,
    salon_id: SalonId,
    master_session: MasterSession,
    idempotency_key: IdempotencyKey = None,
) -> Envelope[TransactionOut]:
    """Пополнение (депозит или погашение долга). Шард и кассы не затрагиваются."""
    await active_client(master_session, client_id)
    meta = ledger.Meta(
        salon_id=salon_id,
        author_id=author.id,
        author_name=author.name,
        staff_id=body.staff_id,
        staff_name=await staff_name(master_session, body.staff_id) if body.staff_id else None,
        comment=body.comment,
    )
    key = operation_key(f"topup:{client_id}", idempotency_key)
    return Envelope(
        data=await _post_money(
            master_session, lambda s: ledger.topup(s, client_id, body.amount, key=key, meta=meta)
        )
    )


@router.post(
    "/clients/{client_id}/account/refunds",
    response_model=Envelope[TransactionOut],
    status_code=status.HTTP_201_CREATED,
)
async def refund(
    client_id: uuid.UUID,
    body: RefundIn,
    _admin: AdminUser,
    author: CurrentAuthor,
    salon_id: SalonId,
    master_session: MasterSession,
    idempotency_key: IdempotencyKey = None,
) -> Envelope[TransactionOut]:
    """Возврат депозита клиенту — не больше положительного баланса; кассы не затрагиваются."""
    await active_client(master_session, client_id)
    meta = ledger.Meta(
        salon_id=salon_id, author_id=author.id, author_name=author.name, comment=body.comment
    )
    key = operation_key(f"refund:{client_id}", idempotency_key)
    return Envelope(
        data=await _post_money(
            master_session, lambda s: ledger.refund(s, client_id, body.amount, key=key, meta=meta)
        )
    )


@router.post(
    "/clients/{client_id}/account/adjustments",
    response_model=Envelope[TransactionOut],
    status_code=status.HTTP_201_CREATED,
)
async def adjust_account(
    client_id: uuid.UUID,
    body: AdjustmentIn,
    _superuser: SuperUser,
    author: CurrentAuthor,
    salon_id: SalonId,
    master_session: MasterSession,
    idempotency_key: IdempotencyKey = None,
) -> Envelope[TransactionOut]:
    """Ручная корректировка особового рахунку с любым знаком — только суперюзер."""
    await get_client(master_session, client_id)
    meta = ledger.Meta(
        salon_id=salon_id, author_id=author.id, author_name=author.name, comment=body.comment
    )
    key = operation_key(f"adjustment:{client_id}", idempotency_key)

    def operation(session):
        account = ledger.lock_money_account(session, client_id)
        return ledger.adjust(session, account, body.amount, key=key, meta=meta)

    return Envelope(data=await _post_money(master_session, operation))
