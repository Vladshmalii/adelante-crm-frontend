"""Оплата чека частями со счёта клиента: Master DB → шард с компенсацией.

backend/docs/loyalty-accounts.md, раздел 6, шаг 4:

1. receipt_id известен заранее (из Idempotency-Key — детерминированно);
2. шард: advisory-блокировка receipt_id (и FOR UPDATE записи — у вызывающего),
   повтор с тем же чеком возвращает уже созданный чек;
3. Master, одна транзакция: блокировка счёта, `payment` с ключом
   `pay:{salon}:{receipt}:account`, коммит;
4. шард, одна транзакция: чек, части, операции, запись, outbox, коммит;
5. ошибка на шаге 4 — сторно всех списаний по этому чеку и ошибка
   пользователю. Падение процесса между 3 и 4 подбирает ночная сверка
   (workers.tasks.integrity.reconcile_payments).
"""

import uuid
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session

from app.models.master import AccountTransaction, TransactionType
from app.models.shard import Receipt
from app.services import ledger

# Пространство имён UUIDv5 для receipt_id из Idempotency-Key
RECEIPT_NAMESPACE = uuid.UUID("4f1d6a0e-6b1e-4c39-9a51-7c0b3e2f8d11")

# Сверка не трогает свежие операции: запрос ещё может дописывать шард
RECONCILE_GRACE = timedelta(hours=1)


class PaymentError(Exception):
    pass


def receipt_id_for(salon_id: uuid.UUID, idempotency_key: str | None) -> uuid.UUID:
    if idempotency_key:
        return uuid.uuid5(RECEIPT_NAMESPACE, f"{salon_id}:{idempotency_key}")
    return uuid.uuid4()


def payment_key(salon_id: uuid.UUID, receipt_id: uuid.UUID, part: str) -> str:
    return f"pay:{salon_id}:{receipt_id}:{part}"


async def lock_receipt(tenant_session: AsyncSession, receipt_id: uuid.UUID) -> Receipt | None:
    """Advisory-блокировка чека до конца шард-транзакции; уже созданный чек — повтор запроса."""
    await tenant_session.execute(
        select(func.pg_advisory_xact_lock(func.hashtextextended(str(receipt_id), 0)))
    )
    return await tenant_session.get(Receipt, receipt_id)


@dataclass(frozen=True)
class Charges:
    """Части чека, оплачиваемые со счетов клиента в Master DB."""

    account: Decimal = Decimal(0)

    @property
    def any(self) -> bool:
        return self.account > 0


@dataclass(frozen=True)
class ChargeResult:
    # Баланс особового рахунку до оплаты — по нему считается часть, ушедшая в долг
    account_balance_before: Decimal | None = None


def charge(
    session: Session,
    *,
    salon_id: uuid.UUID,
    receipt_id: uuid.UUID,
    client_id: uuid.UUID,
    charges: Charges,
    meta: ledger.Meta,
) -> ChargeResult:
    balance_before = None
    if charges.account > 0:
        account = ledger.lock_money_account(session, client_id)
        key = payment_key(salon_id, receipt_id, "account")
        existing = ledger.find_by_key(session, key)
        if existing is not None and ledger.is_reversed(session, existing.id):
            raise ledger.LedgerError("Попередню спробу оплати скасовано — повторіть оплату")
        # Повтор после сбоя: баланс до оплаты — тот, что был до первой попытки
        balance_before = (
            existing.balance_after - existing.amount if existing is not None else account.balance
        )
        ledger.post(
            session,
            account,
            type=TransactionType.PAYMENT,
            amount=-charges.account,
            key=key,
            meta=meta,
        )
    return ChargeResult(account_balance_before=balance_before)


def open_payments(
    session: Session, *, salon_id: uuid.UUID, receipt_id: uuid.UUID
) -> list[AccountTransaction]:
    """Несторнированные списания по чеку."""
    reversed_ids = select(AccountTransaction.reverses_id).where(
        AccountTransaction.reverses_id.is_not(None)
    )
    return list(
        session.scalars(
            select(AccountTransaction).where(
                AccountTransaction.salon_id == salon_id,
                AccountTransaction.receipt_id == receipt_id,
                AccountTransaction.type == TransactionType.PAYMENT,
                AccountTransaction.id.not_in(reversed_ids),
            )
        )
    )


def reverse_payments(
    session: Session, *, salon_id: uuid.UUID, receipt_id: uuid.UUID, meta: ledger.Meta
) -> int:
    """Сторно всех списаний по чеку (компенсация, отмена чека, сверка). Идемпотентно."""
    txns = open_payments(session, salon_id=salon_id, receipt_id=receipt_id)
    for txn in txns:
        ledger.reverse(session, txn, meta=meta)
    return len(txns)


def hanging_payments(
    session: Session, salon_id: uuid.UUID, *, now: datetime | None = None
) -> dict[uuid.UUID, list[AccountTransaction]]:
    """Списания салона старше RECONCILE_GRACE без сторно — по чекам (для ночной сверки)."""
    reversed_ids = select(AccountTransaction.reverses_id).where(
        AccountTransaction.reverses_id.is_not(None)
    )
    border = (now or datetime.now(UTC)) - RECONCILE_GRACE
    result: dict[uuid.UUID, list[AccountTransaction]] = {}
    for txn in session.scalars(
        select(AccountTransaction).where(
            AccountTransaction.salon_id == salon_id,
            AccountTransaction.type == TransactionType.PAYMENT,
            AccountTransaction.receipt_id.is_not(None),
            AccountTransaction.created_at < border,
            AccountTransaction.id.not_in(reversed_ids),
        )
    ):
        result.setdefault(txn.receipt_id, []).append(txn)
    return result


async def settle(
    master_session: AsyncSession,
    tenant_session: AsyncSession,
    *,
    salon_id: uuid.UUID,
    receipt_id: uuid.UUID,
    client_id: uuid.UUID | None,
    record_id: uuid.UUID | None,
    charges: Charges,
    author_id: uuid.UUID | None,
    author_name: str | None,
    write_shard: Callable[[ChargeResult], Awaitable[Receipt]],
) -> Receipt:
    """Списать со счетов в Master, затем записать и закоммитить шард; при ошибке — сторно.

    Шард-транзакция уже держит блокировки (lock_receipt, запись FOR UPDATE).
    """
    meta = ledger.Meta(
        salon_id=salon_id,
        author_id=author_id,
        author_name=author_name,
        record_id=record_id,
        receipt_id=receipt_id,
    )
    result = ChargeResult()
    if charges.any:
        if client_id is None:
            raise PaymentError("Для оплати з рахунку потрібен клієнт")
        try:
            result = await master_session.run_sync(
                lambda s: charge(
                    s,
                    salon_id=salon_id,
                    receipt_id=receipt_id,
                    client_id=client_id,
                    charges=charges,
                    meta=meta,
                )
            )
            await master_session.commit()
        except ledger.LedgerError as exc:
            await master_session.rollback()
            raise PaymentError(str(exc))

    try:
        receipt = await write_shard(result)
        await tenant_session.commit()
    except BaseException:
        await tenant_session.rollback()
        if charges.any:
            await master_session.run_sync(
                lambda s: reverse_payments(
                    s,
                    salon_id=salon_id,
                    receipt_id=receipt_id,
                    meta=ledger.Meta(
                        salon_id=salon_id,
                        author_id=author_id,
                        author_name=author_name,
                        record_id=record_id,
                        receipt_id=receipt_id,
                        comment="Сторно: чек не записано",
                    ),
                )
            )
            await master_session.commit()
        raise
    return receipt
