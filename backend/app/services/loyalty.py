"""Карты лояльности: выдача, удаление, уровень, факты визитов (loyalty-accounts.md, разделы 6–7).

Синхронный код на `Session`, как app.services.ledger: воркер вызывает напрямую,
API — через `AsyncSession.run_sync(...)`.
"""

import secrets
import uuid
from collections.abc import Callable
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from decimal import Decimal
from typing import Any

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.master import (
    AccountKind,
    AccountTransaction,
    BonusOperationKind,
    CardStatus,
    ClientAccount,
    LevelBasis,
    LoyaltyBonusOperation,
    LoyaltyBonusProgress,
    LoyaltyBonusRule,
    LoyaltyCard,
    LoyaltyCardType,
    LoyaltyCardVisit,
    LoyaltyDiscountLevel,
    TransactionType,
)
from app.services import ledger
from app.services.ledger import money

NUMBER_LENGTH = 16


class LoyaltyError(ledger.LedgerError):
    pass


# --- Карта и её применимость ----------------------------------------------------


def active_card(session: Session, client_id: uuid.UUID) -> LoyaltyCard | None:
    return session.scalar(
        select(LoyaltyCard).where(
            LoyaltyCard.client_id == client_id, LoyaltyCard.status == CardStatus.ACTIVE
        )
    )


def applies_in(card: LoyaltyCard, salon_id: uuid.UUID) -> bool:
    """Карта действует в салоне: активна и салон входит в её тип."""
    return card.status == CardStatus.ACTIVE and any(s.id == salon_id for s in card.card_type.salons)


def applicable_card(
    session: Session, client_id: uuid.UUID, salon_id: uuid.UUID
) -> LoyaltyCard | None:
    card = active_card(session, client_id)
    return card if card is not None and applies_in(card, salon_id) else None


def lock_card(session: Session, card_id: uuid.UUID) -> LoyaltyCard | None:
    return session.scalar(
        select(LoyaltyCard)
        .where(LoyaltyCard.id == card_id)
        .with_for_update(of=LoyaltyCard)
        .execution_options(populate_existing=True)
    )


def cashback_account(session: Session, card_id: uuid.UUID) -> ClientAccount | None:
    return session.scalar(select(ClientAccount).where(ClientAccount.loyalty_card_id == card_id))


def lock_cashback_account(session: Session, card_id: uuid.UUID) -> ClientAccount:
    account = cashback_account(session, card_id)
    if account is None:
        raise LoyaltyError("Кешбек-рахунок картки не знайдено")
    return ledger.lock_account(session, account.id)


def cashback_limit(card_type: LoyaltyCardType, total: Decimal, balance: Decimal) -> Decimal:
    """Максимум кешбэка к оплате в чеке: ≤ баланса и ≤ cashback_max_payment_percent × итог."""
    by_percent = money(total * card_type.cashback_max_payment_percent / 100)
    return max(min(balance, by_percent), Decimal(0))


# --- Уровень -----------------------------------------------------------------------


@dataclass(frozen=True)
class LevelState:
    current: LoyaltyDiscountLevel | None
    next: LoyaltyDiscountLevel | None
    # Сколько осталось до следующего уровня: ₴ или визиты — по level_basis
    remaining: Decimal | None


def level_value(card: LoyaltyCard) -> Decimal:
    if card.card_type.level_basis == LevelBasis.VISITS:
        return Decimal(card.visits_count)
    return card.sold_total


def level_state(card: LoyaltyCard) -> LevelState:
    """Уровень не хранится — вычисляется по счётчикам карты и актуальным уровням типа."""
    value = level_value(card)
    levels = sorted(card.card_type.levels, key=lambda lv: lv.threshold)
    current = next((lv for lv in reversed(levels) if lv.threshold <= value), None)
    upcoming = next((lv for lv in levels if lv.threshold > value), None)
    return LevelState(
        current=current,
        next=upcoming,
        remaining=(upcoming.threshold - value) if upcoming is not None else None,
    )


# --- Выдача и удаление --------------------------------------------------------------


def generate_number(session: Session) -> str:
    """Свободный 16-значный номер (первая цифра не 0)."""
    for _ in range(20):
        number = str(secrets.randbelow(9 * 10 ** (NUMBER_LENGTH - 1)) + 10 ** (NUMBER_LENGTH - 1))
        if session.scalar(select(LoyaltyCard.id).where(LoyaltyCard.number == number)) is None:
            return number
    raise LoyaltyError("Не вдалося згенерувати номер картки")


def issue_card(
    session: Session,
    *,
    client_id: uuid.UUID,
    card_type_id: uuid.UUID,
    number: str | None,
    salon_id: uuid.UUID,
    author_id: uuid.UUID | None,
    author_name: str | None,
) -> LoyaltyCard:
    """Выдача карты: счётчики с нуля (решение 14), отдельный cashback-счёт."""
    card_type = session.get(LoyaltyCardType, card_type_id)
    if card_type is None:
        raise LoyaltyError("Тип картки не знайдено")
    if not card_type.is_active:
        raise LoyaltyError("Тип картки вимкнено — нові картки не видаються")
    if active_card(session, client_id) is not None:
        raise LoyaltyError("У клієнта вже є активна картка")
    if number is None:
        number = generate_number(session)
    elif not (len(number) == NUMBER_LENGTH and number.isdigit()):
        raise LoyaltyError("Номер картки — 16 цифр")
    elif session.scalar(select(LoyaltyCard.id).where(LoyaltyCard.number == number)) is not None:
        raise LoyaltyError("Картка з таким номером уже існує")

    card = LoyaltyCard(
        number=number,
        client_id=client_id,
        card_type_id=card_type.id,
        status=CardStatus.ACTIVE,
        issued_at=datetime.now(UTC),
        issued_by=author_id,
        issued_by_name=author_name,
        issued_salon_id=salon_id,
    )
    try:
        with session.begin_nested():
            session.add(card)
            session.flush()
    except IntegrityError:
        # Параллельная выдача: частичный unique-индекс по активной карте или номеру
        raise LoyaltyError("У клієнта вже є активна картка або номер зайнятий")
    session.execute(
        insert(ClientAccount).values(
            id=uuid.uuid4(),
            client_id=client_id,
            kind=AccountKind.CASHBACK,
            loyalty_card_id=card.id,
            balance=0,
        )
    )
    session.refresh(card)
    return card


def delete_card(
    session: Session,
    card_id: uuid.UUID,
    *,
    salon_id: uuid.UUID,
    author_id: uuid.UUID | None,
    author_name: str | None,
) -> LoyaltyCard:
    """Удаление: статус deleted, положительный кешбэк сгорает операцией burn (решение 15).

    Счётчики и бонусные услуги остаются на карте для истории.
    """
    card = lock_card(session, card_id)
    if card is None:
        raise LoyaltyError("Картку не знайдено")
    if card.status == CardStatus.DELETED:
        raise LoyaltyError("Картку вже видалено")
    card.status = CardStatus.DELETED
    card.deleted_at = datetime.now(UTC)
    card.deleted_by = author_id
    card.deleted_by_name = author_name
    account = lock_cashback_account(session, card.id)
    if account.balance > 0:
        ledger.post(
            session,
            account,
            type=TransactionType.BURN,
            amount=-account.balance,
            key=f"burn:card:{card.id}",
            meta=ledger.Meta(
                salon_id=salon_id,
                author_id=author_id,
                author_name=author_name,
                comment="Кешбек згорів: картку видалено",
            ),
        )
    session.flush()
    return card


# --- Факты визитов (воркер, событие loyalty.receipt_paid) --------------------------


def debt_part(account_part: Decimal, balance_before: Decimal | None) -> Decimal:
    """Часть оплаты со счёта, ушедшая в минус: сверх положительного баланса до оплаты."""
    if account_part <= 0:
        return Decimal(0)
    available = max(balance_before or Decimal(0), Decimal(0))
    return max(account_part - available, Decimal(0))


def paid_amount(payload: dict[str, Any]) -> Decimal:
    """Оплачено = итог − часть кешбэком − часть счёта, ушедшая в долг (раздел 6, шаг 5)."""
    parts = payload["parts"]
    total = Decimal(payload["total"])
    bonus = Decimal(parts.get("bonus", "0"))
    account = Decimal(parts.get("account", "0"))
    before = payload.get("account_balance_before")
    debt = debt_part(account, Decimal(before) if before is not None else None)
    return money(max(total - bonus - debt, Decimal(0)))


def cashback_base(payload: dict[str, Any], card_type: LoyaltyCardType, paid: Decimal) -> Decimal:
    """Оплачено, распределённое по строкам пропорционально; только строки включённых типов."""
    lines = payload["lines"]
    total = sum((Decimal(line["amount"]) for line in lines), Decimal(0))
    if total <= 0 or paid <= 0:
        return Decimal(0)
    kinds = set()
    if card_type.cashback_on_services:
        kinds.add("service")
    if card_type.cashback_on_products:
        kinds.add("product")
    eligible = sum((Decimal(line["amount"]) for line in lines if line["kind"] in kinds), Decimal(0))
    return money(paid * eligible / total)


def record_visit(
    session: Session,
    salon_id: uuid.UUID,
    payload: dict[str, Any],
    *,
    receipt_alive: Callable[[], bool] = lambda: True,
) -> LoyaltyCardVisit | None:
    """Факт визита и счётчики карты. Идемпотентно по (salon_id, receipt_id).

    receipt_alive проверяется под блокировкой карты: отмена чека берёт ту же
    блокировку, поэтому отмена, обработанная раньше оплаты, не оставит факт.
    """
    card_id = payload.get("card_id")
    if not card_id:
        return None
    card = lock_card(session, uuid.UUID(card_id))
    if card is None or not applies_in(card, salon_id) or not receipt_alive():
        return None
    receipt_id = uuid.UUID(payload["receipt_id"])
    existing = find_visit(session, salon_id, receipt_id)
    if existing is not None:
        return existing

    paid = paid_amount(payload)
    visit = LoyaltyCardVisit(
        card_id=card.id,
        salon_id=salon_id,
        receipt_id=receipt_id,
        record_id=uuid.UUID(payload["record_id"]) if payload.get("record_id") else None,
        is_visit=payload.get("record_id") is not None,
        sold_amount=money(payload["sold"]),
        discount_amount=money(payload.get("discount", "0")),
        paid_amount=paid,
        cashback_base=cashback_base(payload, card.card_type, paid),
        happened_at=datetime.fromisoformat(payload["happened_at"]),
    )
    session.add(visit)
    card.sold_total = money(card.sold_total + visit.sold_amount)
    card.paid_total = money(card.paid_total + visit.paid_amount)
    card.visits_count += 1 if visit.is_visit else 0
    _accrue_cashback(session, card, visit, payload)
    progress_bonuses(
        session,
        card,
        salon_id=salon_id,
        receipt_id=receipt_id,
        record_id=visit.record_id,
        lines=[
            BonusLine(
                record_service_id=uuid.UUID(line["record_service_id"]),
                service_id=uuid.UUID(line["service_id"]),
                is_bonus=bool(line.get("is_bonus")),
            )
            for line in payload["lines"]
            if line["kind"] == "service" and line.get("service_id")
        ],
    )
    session.flush()
    return visit


def accrual_key(salon_id: uuid.UUID, receipt_id: uuid.UUID) -> str:
    return f"accrual:{salon_id}:{receipt_id}"


def _accrue_cashback(
    session: Session, card: LoyaltyCard, visit: LoyaltyCardVisit, payload: dict[str, Any]
) -> None:
    """accrual = база кешбэка × cashback_percent (по типу карты на момент обработки)."""
    amount = money(visit.cashback_base * card.card_type.cashback_percent / 100)
    if amount <= 0:
        return
    account = lock_cashback_account(session, card.id)
    ledger.post(
        session,
        account,
        type=TransactionType.ACCRUAL,
        amount=amount,
        key=accrual_key(visit.salon_id, visit.receipt_id),
        meta=ledger.Meta(
            salon_id=visit.salon_id,
            receipt_id=visit.receipt_id,
            record_id=visit.record_id,
            comment=(
                f"Кешбек {card.card_type.cashback_percent.normalize():f}% "
                f"з чека № {payload.get('receipt_number') or visit.receipt_id}"
            ),
        ),
    )


def find_visit(
    session: Session, salon_id: uuid.UUID, receipt_id: uuid.UUID
) -> LoyaltyCardVisit | None:
    return session.scalar(
        select(LoyaltyCardVisit).where(
            LoyaltyCardVisit.salon_id == salon_id, LoyaltyCardVisit.receipt_id == receipt_id
        )
    )


def reverse_visit(
    session: Session, salon_id: uuid.UUID, receipt_id: uuid.UUID, card_id: uuid.UUID | None
) -> LoyaltyCardVisit | None:
    """Отмена чека: факт помечается reversed_at, счётчики карты уменьшаются. Идемпотентно."""
    if card_id is None:
        return None
    card = lock_card(session, card_id)
    visit = find_visit(session, salon_id, receipt_id)
    if visit is None or card is None:
        return None
    session.refresh(visit)
    if visit.reversed_at is not None:
        return visit
    visit.reversed_at = datetime.now(UTC)
    card.sold_total = money(card.sold_total - visit.sold_amount)
    card.paid_total = money(card.paid_total - visit.paid_amount)
    card.visits_count -= 1 if visit.is_visit else 0
    # Сторно начисленного кешбэка. Если он уже потрачен, баланс уйдёт в минус —
    # это допустимо только через сторно; новые начисления его погасят (раздел 6, шаг 6)
    accrual = ledger.find_by_key(session, accrual_key(salon_id, receipt_id))
    if accrual is not None:
        ledger.reverse(
            session,
            accrual,
            meta=ledger.Meta(
                salon_id=salon_id,
                receipt_id=receipt_id,
                record_id=visit.record_id,
                comment="Сторно кешбеку: чек скасовано",
            ),
        )
    reverse_bonus_progress(session, salon_id, receipt_id)
    session.flush()
    return visit


# --- Сгорание кешбэка по сроку (Celery beat раз в сутки) ----------------------------


def expired_cashback(
    txns: list[tuple[uuid.UUID, Decimal, datetime, uuid.UUID | None]],
    balance: Decimal,
    border: datetime,
) -> Decimal:
    """Сколько кешбэка сгорает по FIFO: поступления старше border минус все списания.

    txns — (id, amount, created_at, reverses_id) по счёту. Пара «операция + её
    сторно» взаимно гасится и не участвует: возвращённый при отмене чека кешбэк
    сохраняет возраст исходного начисления. Остальные списания (оплаты, прошлые
    сгорания, корректировки в минус) гасят самые старые поступления первыми,
    поэтому сгорает остаток старых поступлений, но не больше положительного баланса.
    """
    reversed_ids = {r for _, _, _, r in txns if r is not None}
    live = [(a, at) for i, a, at, r in txns if r is None and i not in reversed_ids]
    old_inflow = sum((a for a, at in live if a > 0 and at < border), Decimal(0))
    outflow = sum((-a for a, _ in live if a < 0), Decimal(0))
    return money(max(min(old_inflow - outflow, balance), Decimal(0)))


def burn_expired(session: Session, card: LoyaltyCard, *, now: datetime) -> Decimal:
    """Сжечь просроченный кешбэк карты; ключ по дате — повтор в тот же день ничего не делает."""
    ttl = card.card_type.cashback_ttl_days
    if not ttl:
        return Decimal(0)
    account = lock_cashback_account(session, card.id)
    if account.balance <= 0:
        return Decimal(0)
    txns = list(
        session.execute(
            select(
                AccountTransaction.id,
                AccountTransaction.amount,
                AccountTransaction.created_at,
                AccountTransaction.reverses_id,
            ).where(AccountTransaction.account_id == account.id)
        ).tuples()
    )
    amount = expired_cashback(txns, account.balance, now - timedelta(days=ttl))
    if amount <= 0:
        return Decimal(0)
    ledger.post(
        session,
        account,
        type=TransactionType.BURN,
        amount=-amount,
        key=f"burn:ttl:{account.id}:{now.date().isoformat()}",
        meta=ledger.Meta(comment=f"Кешбек згорів: минуло {ttl} дн."),
    )
    return amount


# --- Бонусные услуги (раздел 6, шаги 2, 4, 5, 6; журнал — раздел 15, п. 6) --------


@dataclass(frozen=True)
class BonusLine:
    """Строка записи для бонусных правил."""

    record_service_id: uuid.UUID
    service_id: uuid.UUID
    is_bonus: bool = False


def active_rules(card: LoyaltyCard) -> list[LoyaltyBonusRule]:
    return [r for r in card.card_type.bonus_rules if r.is_active]


def progress_rows(
    session: Session, card_id: uuid.UUID, *, lock: bool = False
) -> dict[uuid.UUID, LoyaltyBonusProgress]:
    query = select(LoyaltyBonusProgress).where(LoyaltyBonusProgress.card_id == card_id)
    if lock:
        query = query.with_for_update().execution_options(populate_existing=True)
    return {p.rule_id: p for p in session.scalars(query.order_by(LoyaltyBonusProgress.rule_id))}


def _progress_row(session: Session, card_id: uuid.UUID, rule_id: uuid.UUID) -> LoyaltyBonusProgress:
    """Строка прогресса под FOR UPDATE; создаётся, если её нет."""
    session.execute(
        insert(LoyaltyBonusProgress)
        .values(id=uuid.uuid4(), card_id=card_id, rule_id=rule_id)
        .on_conflict_do_nothing(index_elements=["card_id", "rule_id"])
    )
    row = session.scalar(
        select(LoyaltyBonusProgress)
        .where(LoyaltyBonusProgress.card_id == card_id, LoyaltyBonusProgress.rule_id == rule_id)
        .with_for_update()
        .execution_options(populate_existing=True)
    )
    assert row is not None
    return row


def eligible_bonus_lines(
    session: Session, card: LoyaltyCard, salon_id: uuid.UUID, lines: list[BonusLine]
) -> dict[uuid.UUID, LoyaltyBonusRule]:
    """Строки, которые можно сделать бесплатными: есть правило с available > 0 (предпросмотр)."""
    rows = progress_rows(session, card.id)
    result = {}
    for line in lines:
        rule = next(
            (
                r
                for r in active_rules(card)
                if r.matches(salon_id, line.service_id)
                and r.id in rows
                and rows[r.id].available > 0
            ),
            None,
        )
        if rule is not None:
            result[line.record_service_id] = rule
    return result


def assign_bonuses(
    session: Session,
    card: LoyaltyCard,
    salon_id: uuid.UUID,
    lines: list[BonusLine],
    *,
    lock: bool,
) -> dict[uuid.UUID, LoyaltyBonusRule]:
    """Правило для каждой отмеченной строки с учётом available (две строки — два бонуса)."""
    rows = progress_rows(session, card.id, lock=lock)
    left = {rule_id: row.available for rule_id, row in rows.items()}
    result: dict[uuid.UUID, LoyaltyBonusRule] = {}
    for line in lines:
        rule = next(
            (
                r
                for r in active_rules(card)
                if r.matches(salon_id, line.service_id) and left.get(r.id, 0) > 0
            ),
            None,
        )
        if rule is None:
            raise LoyaltyError("Для цієї послуги немає доступної бонусної послуги")
        left[rule.id] -= 1
        result[line.record_service_id] = rule
    return result


def use_bonuses(
    session: Session,
    *,
    card_id: uuid.UUID,
    salon_id: uuid.UUID,
    receipt_id: uuid.UUID,
    record_id: uuid.UUID | None,
    lines: list[BonusLine],
) -> None:
    """Списание бонусных услуг при оплате (Master, шаг 4.2). Идемпотентно по строке чека."""
    card = session.get(LoyaltyCard, card_id)
    if card is None or card.status != CardStatus.ACTIVE:
        raise LoyaltyError("Бонусні послуги доступні лише з активною карткою")
    existing = {
        op.record_service_id
        for op in session.scalars(
            select(LoyaltyBonusOperation).where(
                LoyaltyBonusOperation.salon_id == salon_id,
                LoyaltyBonusOperation.receipt_id == receipt_id,
                LoyaltyBonusOperation.kind == BonusOperationKind.USE,
            )
        )
    }
    todo = [line for line in lines if line.record_service_id not in existing]
    if not todo:
        return
    for line_id, rule in assign_bonuses(session, card, salon_id, todo, lock=True).items():
        row = _progress_row(session, card.id, rule.id)
        row.available -= 1
        row.used_total += 1
        session.add(
            LoyaltyBonusOperation(
                kind=BonusOperationKind.USE,
                card_id=card.id,
                rule_id=rule.id,
                salon_id=salon_id,
                receipt_id=receipt_id,
                record_id=record_id,
                record_service_id=line_id,
            )
        )
    session.flush()


def _open_operations(
    session: Session, salon_id: uuid.UUID, receipt_id: uuid.UUID, kind: BonusOperationKind
) -> list[LoyaltyBonusOperation]:
    return list(
        session.scalars(
            select(LoyaltyBonusOperation)
            .where(
                LoyaltyBonusOperation.salon_id == salon_id,
                LoyaltyBonusOperation.receipt_id == receipt_id,
                LoyaltyBonusOperation.kind == kind,
                LoyaltyBonusOperation.reversed_at.is_(None),
            )
            .order_by(LoyaltyBonusOperation.rule_id)
            .with_for_update()
        )
    )


def reverse_bonus_uses(session: Session, salon_id: uuid.UUID, receipt_id: uuid.UUID) -> int:
    """Использованная бонусная услуга возвращается в available (сбой шарда, отмена, сверка)."""
    ops = _open_operations(session, salon_id, receipt_id, BonusOperationKind.USE)
    for op in ops:
        row = _progress_row(session, op.card_id, op.rule_id)
        row.available += 1
        row.used_total -= 1
        op.reversed_at = datetime.now(UTC)
    session.flush()
    return len(ops)


def progress_bonuses(
    session: Session,
    card: LoyaltyCard,
    *,
    salon_id: uuid.UUID,
    receipt_id: uuid.UUID,
    record_id: uuid.UUID | None,
    lines: list[BonusLine],
) -> None:
    """Шаг 5.6: правило с услугой в чеке (не бонусной) — progress + 1; на N−1 — бонус."""
    paid_services = {line.service_id for line in lines if not line.is_bonus}
    for rule in active_rules(card):
        if not any(rule.matches(salon_id, sid) for sid in paid_services):
            continue
        done = session.scalar(
            select(LoyaltyBonusOperation.id).where(
                LoyaltyBonusOperation.salon_id == salon_id,
                LoyaltyBonusOperation.receipt_id == receipt_id,
                LoyaltyBonusOperation.rule_id == rule.id,
                LoyaltyBonusOperation.kind == BonusOperationKind.PROGRESS,
            )
        )
        if done is not None:
            continue
        row = _progress_row(session, card.id, rule.id)
        row.progress += 1
        accrued = row.progress >= rule.every_n - 1
        if accrued:
            row.progress -= rule.every_n - 1
            row.available += 1
            row.accrued_total += 1
        session.add(
            LoyaltyBonusOperation(
                kind=BonusOperationKind.PROGRESS,
                card_id=card.id,
                rule_id=rule.id,
                salon_id=salon_id,
                receipt_id=receipt_id,
                record_id=record_id,
                accrued=accrued,
            )
        )
    session.flush()


def reverse_bonus_progress(session: Session, salon_id: uuid.UUID, receipt_id: uuid.UUID) -> int:
    """Откат накопления чека — одна «единица» прогресса назад (раздел 6, шаг 6).

    progress − 1; если он ушёл в минус, а бонус ещё не использован — available − 1 и
    accrued_total − 1, прогресс возвращается на N−2. Бонус уже использован — прогресс
    остаётся в минусе и гасится следующими визитами.
    """
    ops = _open_operations(session, salon_id, receipt_id, BonusOperationKind.PROGRESS)
    for op in ops:
        rule = session.get(LoyaltyBonusRule, op.rule_id)
        row = _progress_row(session, op.card_id, op.rule_id)
        row.progress -= 1
        if row.progress < 0 and row.available > 0 and rule is not None:
            row.available -= 1
            row.accrued_total -= 1
            row.progress += rule.every_n - 1
        op.reversed_at = datetime.now(UTC)
    session.flush()
    return len(ops)


def hanging_bonus_receipts(
    session: Session, salon_id: uuid.UUID, border: datetime
) -> dict[uuid.UUID, uuid.UUID | None]:
    """Чеки салона с несторнированным списанием бонусов старше border: receipt → record."""
    rows = session.execute(
        select(LoyaltyBonusOperation.receipt_id, LoyaltyBonusOperation.record_id).where(
            LoyaltyBonusOperation.salon_id == salon_id,
            LoyaltyBonusOperation.kind == BonusOperationKind.USE,
            LoyaltyBonusOperation.reversed_at.is_(None),
            LoyaltyBonusOperation.created_at < border,
        )
    ).tuples()
    return dict(rows.all())
