"""Журнал счетов клиента (Master DB) — единственное место, где меняется баланс.

Синхронный код на `Session`: Celery-воркеры вызывают его напрямую, API — через
`AsyncSession.run_sync(...)`. Так блокировки и идемпотентность реализованы один раз.

Правила (backend/docs/loyalty-accounts.md, раздел 3):
- баланс меняется только вместе с INSERT в журнал, под `SELECT … FOR UPDATE` счёта;
- у каждой операции уникальный ключ идемпотентности: повтор с тем же ключом
  возвращает уже записанную операцию и баланс не трогает;
- операция отменяется только сторно (reversal) — один раз.
"""

import uuid
from dataclasses import dataclass
from decimal import ROUND_HALF_UP, Decimal

from sqlalchemy import select, text
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.models.master import AccountKind, AccountTransaction, ClientAccount, TransactionType

CENT = Decimal("0.01")


class LedgerError(Exception):
    pass


def money(value: Decimal | float | str) -> Decimal:
    """Сумма в гривнах с копейками, округление ROUND_HALF_UP."""
    return Decimal(str(value)).quantize(CENT, rounding=ROUND_HALF_UP)


@dataclass(frozen=True)
class Meta:
    """Контекст операции: где, кто, по какому чеку."""

    salon_id: uuid.UUID | None = None
    author_id: uuid.UUID | None = None
    author_name: str | None = None
    record_id: uuid.UUID | None = None
    receipt_id: uuid.UUID | None = None
    staff_id: uuid.UUID | None = None
    staff_name: str | None = None
    comment: str | None = None


NO_META = Meta()


def find_money_account(session: Session, client_id: uuid.UUID) -> ClientAccount | None:
    return session.scalar(
        select(ClientAccount).where(
            ClientAccount.client_id == client_id, ClientAccount.kind == AccountKind.MONEY
        )
    )


def lock_money_account(session: Session, client_id: uuid.UUID) -> ClientAccount:
    """money-счёт клиента под FOR UPDATE; создаётся, если его нет.

    INSERT … ON CONFLICT DO NOTHING — две параллельные «первые» операции не
    падают на уникальном индексе: вторая дождётся строки первой.
    """
    session.execute(
        insert(ClientAccount)
        .values(id=uuid.uuid4(), client_id=client_id, kind=AccountKind.MONEY, balance=0)
        .on_conflict_do_nothing(
            # Литерал, а не bound-параметр: иначе PG не сопоставит предикат частичного индекса
            index_elements=["client_id"],
            index_where=text("kind = 'money'"),
        )
    )
    account = session.scalar(
        select(ClientAccount)
        .where(ClientAccount.client_id == client_id, ClientAccount.kind == AccountKind.MONEY)
        .with_for_update()
        .execution_options(populate_existing=True)
    )
    assert account is not None
    return account


def lock_account(session: Session, account_id: uuid.UUID) -> ClientAccount:
    account = session.scalar(
        select(ClientAccount)
        .where(ClientAccount.id == account_id)
        .with_for_update()
        .execution_options(populate_existing=True)
    )
    if account is None:
        raise LedgerError("Рахунок не знайдено")
    return account


def find_by_key(session: Session, key: str) -> AccountTransaction | None:
    return session.scalar(
        select(AccountTransaction).where(AccountTransaction.idempotency_key == key)
    )


def post(
    session: Session,
    account: ClientAccount,
    *,
    type: TransactionType,
    amount: Decimal,
    key: str,
    meta: Meta = NO_META,
    reverses: AccountTransaction | None = None,
) -> AccountTransaction:
    """Записать операцию и обновить баланс. Счёт должен быть заблокирован вызывающим.

    Повтор ключа — возвращается существующая операция (идемпотентность).
    """
    existing = find_by_key(session, key)
    if existing is not None:
        return existing
    amount = money(amount)
    account.balance = money(account.balance + amount)
    txn = AccountTransaction(
        account_id=account.id,
        type=type,
        amount=amount,
        balance_after=account.balance,
        salon_id=meta.salon_id,
        record_id=meta.record_id,
        receipt_id=meta.receipt_id,
        staff_id=meta.staff_id,
        staff_name=meta.staff_name,
        author_id=meta.author_id,
        author_name=meta.author_name,
        comment=meta.comment,
        reverses_id=reverses.id if reverses else None,
        idempotency_key=key,
    )
    session.add(txn)
    session.flush()
    return txn


def reverse(
    session: Session, txn: AccountTransaction, *, meta: Meta = NO_META
) -> AccountTransaction | None:
    """Сторно операции (один раз): обратная сумма, reverses_id → исходная.

    Блокирует счёт сам. Если операция уже сторнирована — возвращает сторно.
    """
    account = lock_account(session, txn.account_id)
    return post(
        session,
        account,
        type=TransactionType.REVERSAL,
        amount=-txn.amount,
        key=f"reversal:{txn.id}",
        meta=meta,
        reverses=txn,
    )


def is_reversed(session: Session, txn_id: uuid.UUID) -> bool:
    return (
        session.scalar(
            select(AccountTransaction.id).where(AccountTransaction.reverses_id == txn_id)
        )
        is not None
    )


# --- Операции особового рахунку (раздел 5) ------------------------------------


def topup(
    session: Session, client_id: uuid.UUID, amount: Decimal, *, key: str, meta: Meta
) -> AccountTransaction:
    if money(amount) <= 0:
        raise LedgerError("Сума поповнення має бути більшою за 0")
    account = lock_money_account(session, client_id)
    return post(session, account, type=TransactionType.TOPUP, amount=amount, key=key, meta=meta)


def refund(
    session: Session, client_id: uuid.UUID, amount: Decimal, *, key: str, meta: Meta
) -> AccountTransaction:
    """Возврат депозита клиенту: не больше текущего положительного баланса."""
    amount = money(amount)
    if amount <= 0:
        raise LedgerError("Сума повернення має бути більшою за 0")
    account = lock_money_account(session, client_id)
    existing = find_by_key(session, key)
    if existing is not None:
        return existing
    if amount > max(account.balance, Decimal(0)):
        raise LedgerError(f"Повернути можна не більше депозиту: {max(account.balance, 0)} ₴")
    return post(session, account, type=TransactionType.REFUND, amount=-amount, key=key, meta=meta)


def adjust(
    session: Session, account: ClientAccount, amount: Decimal, *, key: str, meta: Meta
) -> AccountTransaction:
    """Ручная корректировка (суперюзер), комментарий обязателен. Счёт заблокирован вызывающим."""
    if money(amount) == 0:
        raise LedgerError("Сума коригування не може бути нульовою")
    if not (meta.comment or "").strip():
        raise LedgerError("Для коригування потрібен коментар")
    return post(
        session, account, type=TransactionType.ADJUSTMENT, amount=amount, key=key, meta=meta
    )
