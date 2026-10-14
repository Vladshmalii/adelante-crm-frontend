"""Расчёт итога к оплате на сервере (backend/docs/loyalty-accounts.md, раздел 6, шаги 1–2).

1. Продано — сумма строк (услуги записи или «товар» чека без записи, сертификаты).
2. Бонусные строки → 0 ₴ (в скидке не участвуют).
3. Скидка — одна, наибольшая в гривнах из: личной % клиента, % уровня карты,
   фиксированной уровня карты (не больше суммы). Источник — в discount_source.
   Строки-сертификаты в базу скидки не входят (certificates.md, решение 11).
4. Итог = Продано − бонусные строки − скидка, копейки ROUND_HALF_UP.

Клиенту не доверяем: итог считается здесь и при предпросмотре, и при оплате.
"""

import uuid
from dataclasses import dataclass
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session

from app.models.master import Client, LoyaltyCard
from app.models.shard import DiscountSource, Record
from app.services import certificates, ledger, loyalty
from app.services.certificates import ServiceAmount
from app.services.ledger import money

# Порядок при равных суммах: личная, % карты, фиксированная карты
CANDIDATE_ORDER = (DiscountSource.CLIENT, DiscountSource.CARD_PERCENT, DiscountSource.CARD_FIXED)


@dataclass(frozen=True)
class Line:
    kind: str  # service | product | certificate
    name: str
    price: Decimal
    record_service_id: uuid.UUID | None = None
    service_id: uuid.UUID | None = None
    is_bonus: bool = False
    # Строка-сертификат: шаблон продажи
    template_id: uuid.UUID | None = None

    @property
    def is_certificate(self) -> bool:
        return self.kind == "certificate"

    @property
    def amount(self) -> Decimal:
        """Сумма строки до скидки: бонусная — 0 ₴."""
        return Decimal(0) if self.is_bonus else self.price

    def payload(self) -> dict[str, object]:
        return {
            "kind": self.kind,
            "name": self.name,
            "record_service_id": str(self.record_service_id) if self.record_service_id else None,
            "service_id": str(self.service_id) if self.service_id else None,
            "price": str(self.price),
            "amount": str(self.amount),
            "is_bonus": self.is_bonus,
        }


@dataclass(frozen=True)
class Candidate:
    source: DiscountSource
    percent: Decimal | None
    amount: Decimal


@dataclass(frozen=True)
class Quote:
    lines: list[Line]
    sold: Decimal
    bonus_amount: Decimal
    candidates: list[Candidate]
    discount_source: DiscountSource
    discount: Decimal
    total: Decimal
    # Строки-сертификаты: в итоге, но вне скидки и кешбэка; платятся только кассовыми способами
    certificates: Decimal = Decimal("0.00")

    @property
    def rest(self) -> Decimal:
        """Итог без сертификатов — часть, которую можно оплатить счётом, кешбэком, сертификатом."""
        return self.total - self.certificates

    def service_amounts(self) -> list[ServiceAmount]:
        """Строки-услуги после скидки (пропорционально) — база области «на послуги»."""
        base = self.sold - self.bonus_amount - self.certificates
        if base <= 0:
            return []
        factor = (base - self.discount) / base
        return [
            ServiceAmount(service_id=line.service_id, amount=money(line.amount * factor))
            for line in self.lines
            if line.kind == "service" and line.service_id is not None
        ]


def quote(
    lines: list[Line],
    *,
    client_percent: Decimal = Decimal(0),
    level_percent: Decimal = Decimal(0),
    level_fixed: Decimal = Decimal(0),
) -> Quote:
    sold = money(sum((line.price for line in lines), Decimal(0)))
    bonus = money(sum((line.price for line in lines if line.is_bonus), Decimal(0)))
    certificates = money(sum((line.price for line in lines if line.is_certificate), Decimal(0)))
    base = sold - bonus - certificates
    candidates = []
    if client_percent > 0:
        candidates.append(
            Candidate(DiscountSource.CLIENT, client_percent, money(base * client_percent / 100))
        )
    if level_percent > 0:
        candidates.append(
            Candidate(DiscountSource.CARD_PERCENT, level_percent, money(base * level_percent / 100))
        )
    if level_fixed > 0:
        candidates.append(Candidate(DiscountSource.CARD_FIXED, None, min(money(level_fixed), base)))
    best = max(
        candidates,
        key=lambda c: (c.amount, -CANDIDATE_ORDER.index(c.source)),
        default=None,
    )
    if best is None or best.amount <= 0:
        source, discount = DiscountSource.NONE, Decimal("0.00")
    else:
        source, discount = best.source, best.amount
    return Quote(
        lines=lines,
        sold=sold,
        bonus_amount=bonus,
        candidates=candidates,
        discount_source=source,
        discount=discount,
        total=money(base - discount + certificates),
        certificates=certificates,
    )


def record_lines(record: Record, bonus_ids: frozenset[uuid.UUID] = frozenset()) -> list[Line]:
    return [
        Line(
            kind="service",
            name=s.name,
            price=s.price,
            record_service_id=s.id,
            service_id=s.service_id,
            is_bonus=s.id in bonus_ids,
        )
        for s in record.services
    ]


def sale_lines(subtotal: Decimal) -> list[Line]:
    """Чек без записи — одна строка «товар» на всю сумму (раздел 15)."""
    return [Line(kind="product", name="Товари", price=money(subtotal))]


def certificate_lines(issues: list[certificates.Issue]) -> list[Line]:
    """Строки-сертификаты: одна на штуку, цена = номинал (решение 1)."""
    return [
        Line(kind="certificate", name=i.name, price=money(i.amount), template_id=i.template_id)
        for i in issues
    ]


async def certificate_issues(
    master_session: AsyncSession, sales: list[certificates.CertificateSale]
) -> list[certificates.Issue]:
    """Позиции продажи → выпускаемые сертификаты; шаблон должен продаваться."""
    if not sales:
        return []

    def build(session: Session) -> list[certificates.Issue]:
        return certificates.plan_issues(certificates.load_templates(session, sales), sales)

    return await master_session.run_sync(build)


# --- Контекст клиента из Master DB -------------------------------------------------


@dataclass
class Context:
    """Всё о клиенте для расчёта и предпросмотра: скидка, карта, уровень, балансы."""

    client: Client | None = None
    card: LoyaltyCard | None = None  # активная и действующая в этом салоне
    level: loyalty.LevelState | None = None
    money_balance: Decimal = Decimal("0.00")
    cashback_balance: Decimal = Decimal("0.00")

    @property
    def client_percent(self) -> Decimal:
        return Decimal(self.client.discount_percent) if self.client else Decimal(0)

    def quote(self, lines: list[Line]) -> Quote:
        current = self.level.current if self.level else None
        return quote(
            lines,
            client_percent=self.client_percent,
            level_percent=current.discount_percent if current else Decimal(0),
            level_fixed=current.discount_fixed if current else Decimal(0),
        )

    def cashback_limit(self, total: Decimal) -> Decimal:
        if self.card is None:
            return Decimal("0.00")
        return loyalty.cashback_limit(self.card.card_type, total, self.cashback_balance)


def _context(session: Session, client_id: uuid.UUID, salon_id: uuid.UUID) -> Context:
    client = session.get(Client, client_id)
    ctx = Context(client=client)
    account = ledger.find_money_account(session, client_id)
    ctx.money_balance = account.balance if account else Decimal("0.00")
    card = loyalty.applicable_card(session, client_id, salon_id)
    if card is not None:
        ctx.card = card
        ctx.level = loyalty.level_state(card)
        cashback = loyalty.cashback_account(session, card.id)
        ctx.cashback_balance = cashback.balance if cashback else Decimal("0.00")
    return ctx


def _bonus_lines(record: Record) -> list[loyalty.BonusLine]:
    return [
        loyalty.BonusLine(record_service_id=s.id, service_id=s.service_id) for s in record.services
    ]


async def bonus_options(
    master_session: AsyncSession,
    ctx: Context,
    salon_id: uuid.UUID,
    record: Record,
    selected: frozenset[uuid.UUID],
) -> dict[uuid.UUID, str]:
    """Строки записи, которые можно сделать бонусными: record_service_id → имя правила.

    Отмеченные строки проверяются целиком (хватает ли available) — LoyaltyError, если нет.
    """
    card = ctx.card
    if card is None:
        if selected:
            raise loyalty.LoyaltyError("Бонусні послуги доступні лише з карткою")
        return {}
    lines = _bonus_lines(record)

    def build(session: Session) -> dict[uuid.UUID, str]:
        if selected:
            loyalty.assign_bonuses(
                session,
                card,
                salon_id,
                [line for line in lines if line.record_service_id in selected],
                lock=False,
            )
        eligible = loyalty.eligible_bonus_lines(session, card, salon_id, lines)
        return {line_id: rule.name for line_id, rule in eligible.items()}

    return await master_session.run_sync(build)


async def load_context(
    master_session: AsyncSession, client_id: uuid.UUID | None, salon_id: uuid.UUID
) -> Context:
    if client_id is None:
        return Context()
    return await master_session.run_sync(lambda s: _context(s, client_id, salon_id))
