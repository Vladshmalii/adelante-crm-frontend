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

На шаге 3 там же списываются части, оплаченные сертификатами (ключ
`pay:{salon}:{receipt}:certificate:{id}`), и выпускаются проданные чеком
сертификаты (certificates.md, 4.4 и 5): компенсация и сверка отменяют всё вместе.
"""

import uuid
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session

from app.models.master import AccountTransaction, LoyaltyCard, TransactionType
from app.models.shard import Receipt
from app.services import certificates, ledger, loyalty

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
    # Кешбэк карты: card_id — карта, действующая в салоне; total — итог чека для лимита
    bonus: Decimal = Decimal(0)
    card_id: uuid.UUID | None = None
    total: Decimal = Decimal(0)
    # Строки записи, списываемые как бонусные услуги карты
    bonus_lines: tuple[loyalty.BonusLine, ...] = ()
    # Сертификаты, продаваемые чеком: выпуск в той же транзакции Master
    issues: tuple[certificates.Issue, ...] = ()
    # Части, оплаченные сертификатами, и строки-услуги чека для области «на послуги»
    redemptions: tuple[certificates.Redemption, ...] = ()
    service_lines: tuple[certificates.ServiceAmount, ...] = ()

    @property
    def needs_client(self) -> bool:
        """Списания со счетов клиента; выпуск сертификата клиента не требует."""
        return (
            self.account > 0 or self.bonus > 0 or bool(self.bonus_lines) or bool(self.redemptions)
        )

    @property
    def any(self) -> bool:
        return self.needs_client or bool(self.issues)


@dataclass(frozen=True)
class ChargeResult:
    # Баланс особового рахунку до оплаты — по нему считается часть, ушедшая в долг
    account_balance_before: Decimal | None = None
    # Выпущенные сертификаты: (позиция, штука) → сертификат — для строк чека в шарде
    issued: tuple[certificates.Issued, ...] = ()

    def certificate_id(self, line: int, n: int) -> uuid.UUID | None:
        return next((i.certificate_id for i in self.issued if i.line == line and i.n == n), None)


def charge(
    session: Session,
    *,
    salon_id: uuid.UUID,
    receipt_id: uuid.UUID,
    client_id: uuid.UUID | None,
    charges: Charges,
    meta: ledger.Meta,
) -> ChargeResult:
    """Списания и выпуск сертификатов в одной транзакции Master.

    Порядок блокировок: money-счёт → кешбек → сертификаты → прогресс бонусов.
    """
    balance_before = None
    if charges.needs_client and client_id is None:
        raise ledger.LedgerError("Для оплати з рахунку потрібен клієнт")
    if charges.account > 0:
        assert client_id is not None
        account = ledger.lock_money_account(session, client_id)
        key = payment_key(salon_id, receipt_id, "account")
        existing = _existing_payment(session, key)
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
    if charges.bonus > 0:
        _charge_cashback(
            session, salon_id=salon_id, receipt_id=receipt_id, charges=charges, meta=meta
        )
    if charges.redemptions:
        certificates.redeem(
            session,
            salon_id=salon_id,
            receipt_id=receipt_id,
            client_id=client_id,
            redemptions=list(charges.redemptions),
            lines=list(charges.service_lines),
            meta=meta,
        )
    issued = certificates.issue(
        session,
        salon_id=salon_id,
        receipt_id=receipt_id,
        buyer_client_id=client_id,
        issues=list(charges.issues),
        meta=meta,
    )
    if charges.bonus_lines:
        if charges.card_id is None:
            raise ledger.LedgerError(
                "Бонусні послуги доступні лише з карткою, що діє в цьому салоні"
            )
        loyalty.use_bonuses(
            session,
            card_id=charges.card_id,
            salon_id=salon_id,
            receipt_id=receipt_id,
            record_id=meta.record_id,
            lines=list(charges.bonus_lines),
        )
    return ChargeResult(account_balance_before=balance_before, issued=tuple(issued))


def _existing_payment(session: Session, key: str) -> AccountTransaction | None:
    existing = ledger.find_by_key(session, key)
    if existing is not None and ledger.is_reversed(session, existing.id):
        raise ledger.LedgerError("Попередню спробу оплати скасовано — повторіть оплату")
    return existing


def _charge_cashback(
    session: Session,
    *,
    salon_id: uuid.UUID,
    receipt_id: uuid.UUID,
    charges: Charges,
    meta: ledger.Meta,
) -> None:
    """Оплата кешбэком: не больше баланса и лимита типа карты; в минус кешбэк не уходит."""
    if charges.card_id is None:
        raise ledger.LedgerError("Кешбек доступний лише з карткою, що діє в цьому салоні")
    card = session.get(LoyaltyCard, charges.card_id)
    if card is None:
        raise ledger.LedgerError("Картку не знайдено")
    account = loyalty.lock_cashback_account(session, card.id)
    key = payment_key(salon_id, receipt_id, "bonus")
    if _existing_payment(session, key) is None:
        limit = loyalty.cashback_limit(card.card_type, charges.total, account.balance)
        if charges.bonus > limit:
            raise ledger.LedgerError(f"Кешбеком можна оплатити не більше {limit} ₴")
    ledger.post(
        session,
        account,
        type=TransactionType.PAYMENT,
        amount=-charges.bonus,
        key=key,
        meta=meta,
    )


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


def _lock_order(txn: AccountTransaction) -> tuple[int, str]:
    """money-счёт → кешбэк → сертификаты по id (id — в конце ключа погашения)."""
    key = txn.idempotency_key
    if key.endswith(":account"):
        return 0, key
    if key.endswith(":bonus"):
        return 1, key
    return 2, key


def reverse_payments(
    session: Session, *, salon_id: uuid.UUID, receipt_id: uuid.UUID, meta: ledger.Meta
) -> int:
    """Сторно всех списаний по чеку (компенсация, отмена чека, сверка). Идемпотентно.

    Деньги и кешбэк возвращаются сторно, выпущенные чеком сертификаты отменяются,
    использованные бонусные услуги — в available. Порядок блокировок как при
    оплате: money-счёт, кешбек, сертификаты, прогресс бонусов.
    """
    txns = open_payments(session, salon_id=salon_id, receipt_id=receipt_id)
    txns.sort(key=_lock_order)
    for txn in txns:
        ledger.reverse(session, txn, meta=meta)
        certificates.after_reversal(session, ledger.lock_account(session, txn.account_id))
    cancelled = certificates.cancel_issued(
        session, salon_id=salon_id, receipt_id=receipt_id, meta=meta
    )
    return len(txns) + cancelled + loyalty.reverse_bonus_uses(session, salon_id, receipt_id)


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
        if txn.receipt_id is not None:
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
        if charges.needs_client and client_id is None:
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
