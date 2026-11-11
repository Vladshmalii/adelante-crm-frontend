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
from sqlalchemy import func, select
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
        # Время строки, а не транзакции: порядок операций одной транзакции (сторно и
        # сгорание после него) в журнале сохраняется
        created_at=func.clock_timestamp(),
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


# --- Списание на визите (раздел 6) ---------------------------------------------------


class UseError(ledger.LedgerError):
    """Строку нельзя оплатить абонементом (422): статус, срок, услуга, остаток."""


# Чем можно оплачивать строку
USABLE = (SubscriptionStatus.PENDING, SubscriptionStatus.ACTIVE)

UNUSABLE_REASON = {
    SubscriptionStatus.FROZEN: "Абонемент «{name}» заморожено",
    SubscriptionStatus.SPENT: "Абонемент «{name}» вичерпано",
    SubscriptionStatus.EXPIRED: "Термін дії абонемента «{name}» минув",
    SubscriptionStatus.CANCELLED: "Абонемент «{name}» анульовано",
}


@dataclass(frozen=True)
class Use:
    """Строка услуги визита, оплачиваемая абонементом."""

    record_service_id: uuid.UUID
    subscription_id: uuid.UUID
    service_id: uuid.UUID
    service_name: str
    duration_minutes: int


@dataclass(frozen=True)
class Used:
    """Списано по строке: единицы и стоимость услуги для отчётов (решение 10)."""

    record_service_id: uuid.UUID
    subscription_id: uuid.UUID
    units: int
    unit_value: Decimal


def use_key(salon_id: uuid.UUID, receipt_id: uuid.UUID, record_service_id: uuid.UUID) -> str:
    return f"pay:{salon_id}:{receipt_id}:subs:{record_service_id}"


def line_value(subscription: Subscription, units: int) -> Decimal:
    """Стоимость строки для отчётов: round(unit_value × списано, 2)."""
    return ledger.money(subscription.unit_value * units)


def is_usable(subscription: Subscription, now: datetime) -> bool:
    """Можно ли сейчас оплачивать абонементом (без учёта услуги и остатка)."""
    return subscription.status in USABLE and (
        subscription.expires_at is None or subscription.expires_at > now
    )


def _check_use(
    subscription: Subscription,
    left: dict[uuid.UUID, int],
    *,
    client_id: uuid.UUID,
    salon_id: uuid.UUID,
    use: Use,
    now: datetime,
) -> tuple[SubscriptionBalance, int]:
    """Корзина и количество для строки (раздел 6, п. 2). left — остатки корзин сейчас.

    UseError — строку этим абонементом оплатить нельзя. Частичного списания нет.
    """
    name = subscription.name
    if subscription.client_id != client_id:
        raise UseError(f"Абонемент «{name}» належить іншому клієнту")
    if subscription.status not in USABLE:
        raise UseError(UNUSABLE_REASON[subscription.status].format(name=name))
    if subscription.expires_at is not None and subscription.expires_at <= now:
        raise UseError(UNUSABLE_REASON[SubscriptionStatus.EXPIRED].format(name=name))
    if not any(
        s.salon_id == salon_id and s.service_id == use.service_id for s in subscription.services
    ):
        raise UseError(f"Послуга «{use.service_name}» не входить до абонемента «{name}»")
    basket = next(b for b in subscription.balances if b.matches(salon_id, use.service_id))
    if subscription.unit_kind == SubscriptionUnitKind.VISITS:
        units = 1
    else:
        units = use.duration_minutes
        if units <= 0:
            raise UseError(f"У послуги «{use.service_name}» не задано тривалість")
    if left[basket.id] < units:
        raise UseError(
            f"Недостатньо залишку абонемента «{name}»: залишилось {left[basket.id]}, "
            f"потрібно {units}"
        )
    return basket, units


def _ordered(uses: list[Use]) -> list[Use]:
    seen: set[uuid.UUID] = set()
    for item in uses:
        if item.record_service_id in seen:
            raise UseError("Один рядок — один абонемент")
        seen.add(item.record_service_id)
    return sorted(uses, key=lambda u: (u.subscription_id, u.record_service_id))


def plan_uses(
    session: Session,
    *,
    client_id: uuid.UUID,
    salon_id: uuid.UUID,
    uses: list[Use],
    now: datetime | None = None,
) -> list[Used]:
    """Проверка без блокировок — для предпросмотра оплаты. Окончательно — в `use`."""
    if not uses:
        return []
    now = now or datetime.now(UTC)
    found = {
        s.id: s
        for s in session.scalars(
            select(Subscription).where(Subscription.id.in_({u.subscription_id for u in uses}))
        )
    }
    left: dict[uuid.UUID, int] = {}
    result = []
    for item in _ordered(uses):
        subscription = found.get(item.subscription_id)
        if subscription is None:
            raise UseError("Абонемент не знайдено")
        for b in subscription.balances:
            left.setdefault(b.id, b.balance)
        basket, units = _check_use(
            subscription, left, client_id=client_id, salon_id=salon_id, use=item, now=now
        )
        left[basket.id] -= units
        result.append(
            Used(item.record_service_id, subscription.id, units, line_value(subscription, units))
        )
    return result


def _lock_all(session: Session, ids: set[uuid.UUID]) -> dict[uuid.UUID, Subscription]:
    """Абонементы под FOR UPDATE по возрастанию id; корзины перечитываются."""
    locked = {}
    for subscription_id in sorted(ids):
        subscription = lock(session, subscription_id)
        for balance in subscription.balances:
            session.refresh(balance)
        locked[subscription_id] = subscription
    return locked


def use(
    session: Session,
    *,
    salon_id: uuid.UUID,
    receipt_id: uuid.UUID,
    client_id: uuid.UUID,
    uses: list[Use],
    meta: ledger.Meta,
    now: datetime | None = None,
) -> list[Used]:
    """Списание строк визита (раздел 6, пп. 3–5) в транзакции оплаты. Идемпотентно.

    Абонементы блокируются по возрастанию id. Операция use с ключом
    `pay:{salon}:{receipt}:subs:{record_service_id}`; первое списание pending-абонемента
    его активирует; нулевой остаток всех корзин — spent. Повтор после сбоя возвращает
    уже записанное; если ту попытку сторнировали — ошибка, как у остальных списаний.
    """
    if not uses:
        return []
    now = now or datetime.now(UTC)
    ordered = _ordered(uses)
    try:
        locked = _lock_all(session, {u.subscription_id for u in ordered})
    except UseError:
        raise
    except ledger.LedgerError as exc:
        raise UseError(str(exc))
    left = {b.id: b.balance for s in locked.values() for b in s.balances}
    result = []
    for item in ordered:
        subscription = locked[item.subscription_id]
        key = use_key(salon_id, receipt_id, item.record_service_id)
        existing = find_by_key(session, key)
        if existing is not None:
            if is_reversed(session, existing.id):
                raise ledger.LedgerError("Попередню спробу оплати скасовано — повторіть оплату")
            units = -existing.delta
            result.append(
                Used(
                    item.record_service_id, subscription.id, units, line_value(subscription, units)
                )
            )
            continue
        basket, units = _check_use(
            subscription, left, client_id=client_id, salon_id=salon_id, use=item, now=now
        )
        post(
            session,
            basket,
            type=SubscriptionOperationType.USE,
            delta=-units,
            key=key,
            meta=replace(meta, comment=f"Послуга «{item.service_name}»"),
            record_service_id=item.record_service_id,
        )
        left[basket.id] = basket.balance
        if subscription.status == SubscriptionStatus.PENDING:
            # Первый визит запускает срок (раздел 6, п. 4)
            subscription.status = SubscriptionStatus.ACTIVE
            subscription.activated_at = now
            subscription.expires_at = add_duration(
                now, subscription.duration_value, subscription.duration_unit
            )
        result.append(
            Used(item.record_service_id, subscription.id, units, line_value(subscription, units))
        )
    for subscription in locked.values():
        if subscription.status == SubscriptionStatus.ACTIVE and all(
            b.balance == 0 for b in subscription.balances
        ):
            subscription.status = SubscriptionStatus.SPENT
    session.flush()
    return result


def _open_uses(
    session: Session, salon_id: uuid.UUID, receipt_id: uuid.UUID
) -> list[SubscriptionOperation]:
    reversed_ids = select(SubscriptionOperation.reverses_id).where(
        SubscriptionOperation.reverses_id.is_not(None)
    )
    return list(
        session.scalars(
            select(SubscriptionOperation).where(
                SubscriptionOperation.salon_id == salon_id,
                SubscriptionOperation.receipt_id == receipt_id,
                SubscriptionOperation.type == SubscriptionOperationType.USE,
                SubscriptionOperation.id.not_in(reversed_ids),
            )
        )
    )


# Возвращённое сторно в закрытый абонемент сразу гасится (раздел 6, п. 7; 13.4, п. 13)
BURN_AFTER_REVERSAL = {
    SubscriptionStatus.EXPIRED: SubscriptionOperationType.EXPIRE,
    SubscriptionStatus.CANCELLED: SubscriptionOperationType.CANCEL,
}


def reverse_uses(
    session: Session, *, salon_id: uuid.UUID, receipt_id: uuid.UUID, meta: ledger.Meta
) -> int:
    """Сторно списаний по чеку визита (раздел 6, п. 7). Идемпотентно. Число сторно.

    Единицы возвращаются операцией reversal; статус после сторно:
    - spent → active. Если срок уже вышел, пользоваться им нельзя (`expires_at <= now`),
      остаток сожжёт ближайший запуск задачи истечения;
    - expired — остаётся, возвращённое сразу сгорает операцией expire;
    - cancelled (чек покупки отменён, пока проходило списание, — 13.4, п. 13) —
      остаётся, возвращённое сразу аннулируется операцией cancel: единицы
      отменённого абонемента не оживают;
    - active и frozen не меняются; pending не бывает — списание активирует.
    Активацию отмена первого списания не откатывает.
    """
    ops = _open_uses(session, salon_id, receipt_id)
    if not ops:
        return 0
    locked = _lock_all(session, {op.subscription_id for op in ops})
    for op in sorted(ops, key=lambda o: (o.subscription_id, o.id)):
        subscription = locked[op.subscription_id]
        reversal = reverse(session, op, meta=meta)
        burn = BURN_AFTER_REVERSAL.get(subscription.status)
        if burn is not None:
            balance = session.get(SubscriptionBalance, op.balance_id)
            assert balance is not None
            if balance.balance > 0:
                post(
                    session,
                    balance,
                    type=burn,
                    delta=-balance.balance,
                    key=f"{burn.value}:{reversal.id}",
                    meta=replace(meta, comment="Повернене сторно згоряє: абонемент закрито"),
                )
        elif subscription.status == SubscriptionStatus.SPENT:
            subscription.status = SubscriptionStatus.ACTIVE
    session.flush()
    return len(ops)


def reverse_receipt(
    session: Session, *, salon_id: uuid.UUID, receipt_id: uuid.UUID, meta: ledger.Meta
) -> int:
    """Отмена всего, что чек сделал с абонементами: выпуск (cancel) и списания (reversal).

    Все затронутые абонементы блокируются заранее одним проходом по возрастанию id.
    """
    ids = {s.id for s in sold_in(session, salon_id, receipt_id)}
    ids |= {op.subscription_id for op in _open_uses(session, salon_id, receipt_id)}
    if not ids:
        return 0
    _lock_all(session, ids)
    cancelled = cancel_issued(session, salon_id=salon_id, receipt_id=receipt_id, meta=meta)
    return cancelled + reverse_uses(session, salon_id=salon_id, receipt_id=receipt_id, meta=meta)


def hanging_uses(
    session: Session, salon_id: uuid.UUID, border: datetime
) -> dict[uuid.UUID, uuid.UUID | None]:
    """Чеки салона с несторнированными списаниями старше border: receipt → record."""
    reversed_ids = select(SubscriptionOperation.reverses_id).where(
        SubscriptionOperation.reverses_id.is_not(None)
    )
    rows = session.execute(
        select(SubscriptionOperation.receipt_id, SubscriptionOperation.record_id).where(
            SubscriptionOperation.salon_id == salon_id,
            SubscriptionOperation.type == SubscriptionOperationType.USE,
            SubscriptionOperation.receipt_id.is_not(None),
            SubscriptionOperation.created_at < border,
            SubscriptionOperation.id.not_in(reversed_ids),
        )
    ).tuples()
    return {receipt_id: record_id for receipt_id, record_id in rows.all() if receipt_id}


def operations(session: Session, subscription_id: uuid.UUID) -> list[SubscriptionOperation]:
    """Журнал абонемента — от новых к старым."""
    return list(
        session.scalars(
            select(SubscriptionOperation)
            .where(SubscriptionOperation.subscription_id == subscription_id)
            .order_by(SubscriptionOperation.created_at.desc())
        )
    )
