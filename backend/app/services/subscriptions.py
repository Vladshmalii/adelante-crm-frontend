"""Абонементы: журнал корзин, выпуск при продаже, отмена выпуска (subscriptions.md).

Синхронный код на `Session`, как ledger и certificates: API вызывает через `run_sync`,
воркеры — напрямую.

Журнал (раздел 3.1) — по правилам ledger:
- остаток корзины (subscription_balances.balance) меняется только в `post`, вместе с
  INSERT в subscription_operations;
- вызывающий держит блокировку абонемента (`lock`: SELECT … FOR UPDATE строки
  subscriptions) — она защищает и корзины, и статус, и сроки; несколько абонементов
  блокируются по возрастанию id;
- у операции уникальный idempotency_key: повтор возвращает уже записанную операцию;
- отмена — только сторно (`reverse`, тип reversal, один раз), не UPDATE.

Порядок блокировок в Master при оплате (раздел 6, п. 6): денежный счёт → кешбэк →
сертификаты → абонементы (по id) → прогресс бонусов.

Выпуск (раздел 5) — в payments.charge, в транзакции Master вместе со списаниями: ключ
`subs:{salon}:{receipt}:{line}` (line — позиция продажи в запросе) уникален у
subscriptions.issue_key, повтор оплаты после сбоя находит уже выпущенный абонемент.
"""

import calendar
import uuid
from dataclasses import dataclass, replace
from datetime import UTC, datetime, timedelta
from decimal import ROUND_HALF_UP, Decimal

from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.master import (
    Subscription,
    SubscriptionActivationMode,
    SubscriptionBalance,
    SubscriptionBalanceMode,
    SubscriptionDurationUnit,
    SubscriptionOperation,
    SubscriptionOperationType,
    SubscriptionService,
    SubscriptionStatus,
    SubscriptionType,
    SubscriptionUnitKind,
)
from app.services import ledger
from app.timeutils import SALON_TZ

# Сколько абонементов можно продать в одном чеке
MAX_SALES = 20

UNIT_VALUE_STEP = Decimal("0.0001")


class SubscriptionError(Exception):
    pass


class SubscriptionSale(BaseModel):
    """Позиция продажи: тип. Одна позиция — один абонемент."""

    type_id: uuid.UUID


@dataclass(frozen=True)
class Issue:
    """Один выпускаемый абонемент: снимок типа, место в продаже и оплаченная сумма."""

    line: int  # позиция в запросе (0..)
    type_id: uuid.UUID
    name: str
    price: Decimal
    unit_kind: SubscriptionUnitKind
    balance_mode: SubscriptionBalanceMode
    total_units: int | None
    duration_value: int
    duration_unit: SubscriptionDurationUnit
    activation_mode: SubscriptionActivationMode
    auto_activate_days: int | None
    freeze_allowed: bool
    freeze_max_days: int
    # (салон, услуга, units) на момент продажи; units — только при separate
    services: tuple[tuple[uuid.UUID, uuid.UUID, int | None], ...]
    # Сумма строки после скидки — известна после расчёта чека (checkout.Quote)
    paid_amount: Decimal | None = None

    def key(self, salon_id: uuid.UUID, receipt_id: uuid.UUID) -> str:
        return f"subs:{salon_id}:{receipt_id}:{self.line}"

    @property
    def units_total(self) -> int:
        """Всего единиц: total_units при shared, сумма units услуг при separate."""
        if self.balance_mode == SubscriptionBalanceMode.SHARED:
            return self.total_units or 0
        return sum(units or 0 for _, _, units in self.services)

    def paid(self, amount: Decimal) -> "Issue":
        return replace(self, paid_amount=amount)


@dataclass(frozen=True)
class Issued:
    line: int
    subscription_id: uuid.UUID


def load_types(
    session: Session, sales: list[SubscriptionSale]
) -> dict[uuid.UUID, SubscriptionType]:
    """Типы продажи: существуют и не в архиве."""
    ids = {s.type_id for s in sales}
    if not ids:
        return {}
    types = {
        t.id: t
        for t in session.scalars(select(SubscriptionType).where(SubscriptionType.id.in_(ids)))
    }
    if ids - set(types):
        raise SubscriptionError("Тип абонемента не знайдено")
    archived = next((t for t in types.values() if not t.is_active), None)
    if archived is not None:
        raise SubscriptionError(f"Абонемент «{archived.name}» не продається")
    return types


def plan_issues(
    types: dict[uuid.UUID, SubscriptionType], sales: list[SubscriptionSale]
) -> list[Issue]:
    """Позиции продажи → выпускаемые абонементы (снимок типа)."""
    issues = []
    for line, sale in enumerate(sales):
        t = types[sale.type_id]
        issues.append(
            Issue(
                line=line,
                type_id=t.id,
                name=t.name,
                price=t.price,
                unit_kind=t.unit_kind,
                balance_mode=t.balance_mode,
                total_units=t.total_units,
                duration_value=t.duration_value,
                duration_unit=t.duration_unit,
                activation_mode=t.activation_mode,
                auto_activate_days=t.auto_activate_days,
                freeze_allowed=t.freeze_allowed,
                freeze_max_days=t.freeze_max_days,
                services=tuple((s.salon_id, s.service_id, s.units) for s in t.services),
            )
        )
    return issues


def add_duration(start: datetime, value: int, unit: SubscriptionDurationUnit) -> datetime | None:
    """Конец срока: start + N дней или месяцев по киевским часам; 0 — бессрочный (None).

    Месяц — календарный: 31 января + 1 месяц = 28/29 февраля.
    """
    if value <= 0:
        return None
    local = start.astimezone(SALON_TZ)
    if unit == SubscriptionDurationUnit.DAY:
        naive = local.replace(tzinfo=None) + timedelta(days=value)
    else:
        month = local.month - 1 + value
        year = local.year + month // 12
        month = month % 12 + 1
        day = min(local.day, calendar.monthrange(year, month)[1])
        naive = local.replace(tzinfo=None, year=year, month=month, day=day)
    return naive.replace(tzinfo=SALON_TZ).astimezone(UTC)


def unit_value(paid_amount: Decimal, units: int) -> Decimal:
    """Стоимость единицы (решение 10): оплачено / всего единиц, 4 знака ROUND_HALF_UP."""
    if units <= 0:
        return Decimal("0.0000")
    return (paid_amount / units).quantize(UNIT_VALUE_STEP, rounding=ROUND_HALF_UP)


# --- Журнал --------------------------------------------------------------------------


def lock(session: Session, subscription_id: uuid.UUID) -> Subscription:
    """Абонемент под FOR UPDATE — блокировка его корзин, статуса и сроков."""
    found = session.scalar(
        select(Subscription)
        .where(Subscription.id == subscription_id)
        .with_for_update()
        .execution_options(populate_existing=True)
    )
    if found is None:
        raise ledger.LedgerError("Абонемент не знайдено")
    return found


def find_by_key(session: Session, key: str) -> SubscriptionOperation | None:
    return session.scalar(
        select(SubscriptionOperation).where(SubscriptionOperation.idempotency_key == key)
    )


def post(
    session: Session,
    balance: SubscriptionBalance,
    *,
    type: SubscriptionOperationType,
    delta: int,
    key: str,
    meta: ledger.Meta = ledger.NO_META,
    record_service_id: uuid.UUID | None = None,
    reverses: SubscriptionOperation | None = None,
) -> SubscriptionOperation:
    """Записать операцию и изменить корзину. Абонемент заблокирован вызывающим (`lock`).

    Повтор ключа — возвращается существующая операция. В минус корзина не уходит.
    """
    existing = find_by_key(session, key)
    if existing is not None:
        return existing
    if balance.balance + delta < 0:
        raise ledger.LedgerError("Недостатньо залишку абонемента")
    balance.balance += delta
    op = SubscriptionOperation(
        subscription_id=balance.subscription_id,
        balance_id=balance.id,
        type=type,
        delta=delta,
        balance_after=balance.balance,
        salon_id=meta.salon_id,
        receipt_id=meta.receipt_id,
        record_id=meta.record_id,
        record_service_id=record_service_id,
        author_id=meta.author_id,
        author_name=meta.author_name,
        comment=meta.comment,
        reverses_id=reverses.id if reverses else None,
        idempotency_key=key,
    )
    session.add(op)
    session.flush()
    return op


def is_reversed(session: Session, op_id: uuid.UUID) -> bool:
    return (
        session.scalar(
            select(SubscriptionOperation.id).where(SubscriptionOperation.reverses_id == op_id)
        )
        is not None
    )


def reverse(
    session: Session, op: SubscriptionOperation, *, meta: ledger.Meta = ledger.NO_META
) -> SubscriptionOperation:
    """Сторно операции (один раз): обратная дельта, reverses_id → исходная.

    Абонемент заблокирован вызывающим. Статус после сторно меняет вызывающий.
    """
    balance = session.get(SubscriptionBalance, op.balance_id, populate_existing=True)
    assert balance is not None
    return post(
        session,
        balance,
        type=SubscriptionOperationType.REVERSAL,
        delta=-op.delta,
        key=f"reversal:{op.id}",
        meta=meta,
        record_service_id=op.record_service_id,
        reverses=op,
    )


# --- Выпуск (раздел 5) ---------------------------------------------------------------


def find_by_issue_key(session: Session, key: str) -> Subscription | None:
    return session.scalar(select(Subscription).where(Subscription.issue_key == key))


def issue(
    session: Session,
    *,
    salon_id: uuid.UUID,
    receipt_id: uuid.UUID,
    client_id: uuid.UUID,
    issues: list[Issue],
    meta: ledger.Meta,
    now: datetime | None = None,
) -> list[Issued]:
    """Выпуск абонементов чека: снимок типа и услуг, корзины, операции issue. Идемпотентно.

    on_sale — сразу active со сроком от продажи; first_visit — pending, срок пойдёт с
    активации (первое списание или автоактивация через auto_activate_days). Повтор
    после сбоя возвращает уже выпущенные; если их выпуск откатили компенсацией — ошибка,
    как у повтора отменённого списания.
    """
    now = now or datetime.now(UTC)
    result = []
    for item in issues:
        key = item.key(salon_id, receipt_id)
        existing = find_by_issue_key(session, key)
        if existing is not None:
            if existing.status == SubscriptionStatus.CANCELLED:
                raise ledger.LedgerError("Попередню спробу оплати скасовано — повторіть оплату")
            result.append(Issued(line=item.line, subscription_id=existing.id))
            continue
        assert item.paid_amount is not None, "сума рядка-абонемента після знижки"
        on_sale = item.activation_mode == SubscriptionActivationMode.ON_SALE
        subscription = Subscription(
            id=uuid.uuid4(),
            client_id=client_id,
            type_id=item.type_id,
            name=item.name,
            unit_kind=item.unit_kind,
            balance_mode=item.balance_mode,
            total_units=item.total_units,
            duration_value=item.duration_value,
            duration_unit=item.duration_unit,
            activation_mode=item.activation_mode,
            auto_activate_days=item.auto_activate_days,
            freeze_allowed=item.freeze_allowed,
            freeze_max_days=item.freeze_max_days,
            paid_amount=item.paid_amount,
            unit_value=unit_value(item.paid_amount, item.units_total),
            sold_salon_id=salon_id,
            sold_receipt_id=receipt_id,
            sold_at=now,
            issue_key=key,
            status=SubscriptionStatus.ACTIVE if on_sale else SubscriptionStatus.PENDING,
            activated_at=now if on_sale else None,
            expires_at=(
                add_duration(now, item.duration_value, item.duration_unit) if on_sale else None
            ),
            auto_activate_at=(
                now + timedelta(days=item.auto_activate_days)
                if not on_sale and item.auto_activate_days
                else None
            ),
            frozen_days=0,
            freeze_used=False,
            services=[
                SubscriptionService(salon_id=salon, service_id=service, units=units)
                for salon, service, units in item.services
            ],
        )
        baskets: list[tuple[uuid.UUID | None, uuid.UUID | None, int]]
        if item.balance_mode == SubscriptionBalanceMode.SHARED:
            baskets = [(None, None, item.units_total)]
        else:
            baskets = [(salon, service, units or 0) for salon, service, units in item.services]
        subscription.balances = [
            SubscriptionBalance(
                id=uuid.uuid4(), salon_id=salon, service_id=service, units=units, balance=0
            )
            for salon, service, units in baskets
        ]
        session.add(subscription)
        session.flush()
        for balance in subscription.balances:
            post(
                session,
                balance,
                type=SubscriptionOperationType.ISSUE,
                delta=balance.units,
                key=f"issue:{subscription.id}:{balance.id}",
                meta=replace(meta, comment=f"Продаж абонемента «{item.name}»"),
            )
        result.append(Issued(line=item.line, subscription_id=subscription.id))
    return result


def sold_in(session: Session, salon_id: uuid.UUID, receipt_id: uuid.UUID) -> list[Subscription]:
    """Абонементы, проданные чеком салона, в порядке позиций продажи."""
    found = list(
        session.scalars(
            select(Subscription).where(
                Subscription.sold_salon_id == salon_id, Subscription.sold_receipt_id == receipt_id
            )
        )
    )
    return sorted(found, key=lambda s: int(s.issue_key.rsplit(":", 1)[1]))


def was_used(session: Session, subscription_ids: list[uuid.UUID]) -> bool:
    """Есть несторнированные списания (use) — отменять чек покупки нельзя (раздел 5, п. 6)."""
    if not subscription_ids:
        return False
    reversed_ids = select(SubscriptionOperation.reverses_id).where(
        SubscriptionOperation.reverses_id.is_not(None)
    )
    found = session.scalar(
        select(SubscriptionOperation.id)
        .where(
            SubscriptionOperation.subscription_id.in_(subscription_ids),
            SubscriptionOperation.type == SubscriptionOperationType.USE,
            SubscriptionOperation.id.not_in(reversed_ids),
        )
        .limit(1)
    )
    return found is not None


def cancel_issued(
    session: Session, *, salon_id: uuid.UUID, receipt_id: uuid.UUID, meta: ledger.Meta
) -> int:
    """Отмена выпуска по чеку (компенсация, сверка, отмена чека покупки). Идемпотентно.

    Каждая корзина с остатком — операция cancel в ноль, абонемент → cancelled.
    Абонементы блокируются по возрастанию id. Запрет отмены использованного проверяет
    отмена чека до этого вызова (finances.cancel_receipt); если списание всё же успело
    пройти, остаток всё равно обнуляется — как у сертификатов.
    """
    ids = sorted(
        s.id
        for s in sold_in(session, salon_id, receipt_id)
        if s.status != SubscriptionStatus.CANCELLED
    )
    now = datetime.now(UTC)
    cancelled = 0
    for subscription_id in ids:
        subscription = lock(session, subscription_id)
        if subscription.status == SubscriptionStatus.CANCELLED:
            continue
        for balance in subscription.balances:
            session.refresh(balance)
            if balance.balance > 0:
                post(
                    session,
                    balance,
                    type=SubscriptionOperationType.CANCEL,
                    delta=-balance.balance,
                    key=f"cancel:{subscription.id}:{balance.id}",
                    meta=meta,
                )
        subscription.status = SubscriptionStatus.CANCELLED
        subscription.cancelled_at = now
        subscription.cancelled_by = meta.author_id
        subscription.cancelled_by_name = meta.author_name
        subscription.cancel_reason = meta.comment
        cancelled += 1
    session.flush()
    return cancelled


def hanging_receipts(
    session: Session, salon_id: uuid.UUID, border: datetime, since: datetime
) -> set[uuid.UUID]:
    """Чеки салона с неотменёнными абонементами, проданными в [since, border) — для сверки."""
    return set(
        session.scalars(
            select(Subscription.sold_receipt_id)
            .where(
                Subscription.sold_salon_id == salon_id,
                Subscription.status != SubscriptionStatus.CANCELLED,
                Subscription.created_at < border,
                Subscription.created_at >= since,
            )
            .distinct()
        )
    )


def operations(session: Session, subscription_id: uuid.UUID) -> list[SubscriptionOperation]:
    """Журнал абонемента — от новых к старым."""
    return list(
        session.scalars(
            select(SubscriptionOperation)
            .where(SubscriptionOperation.subscription_id == subscription_id)
            .order_by(SubscriptionOperation.created_at.desc())
        )
    )
