"""Карты лояльности: выдача, удаление, уровень, факты визитов (loyalty-accounts.md, разделы 6–7).

Синхронный код на `Session`, как app.services.ledger: воркер вызывает напрямую,
API — через `AsyncSession.run_sync(...)`.
"""

import secrets
import uuid
from collections.abc import Callable
from dataclasses import dataclass
from datetime import UTC, datetime
from decimal import Decimal
from typing import Any

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.master import (
    AccountKind,
    CardStatus,
    ClientAccount,
    LevelBasis,
    LoyaltyCard,
    LoyaltyCardType,
    LoyaltyCardVisit,
    LoyaltyDiscountLevel,
    TransactionType,
)
from app.services import ledger
from app.services.ledger import money

NUMBER_LENGTH = 16


class LoyaltyError(Exception):
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
    session.flush()
    return visit


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
    session.flush()
    return visit
