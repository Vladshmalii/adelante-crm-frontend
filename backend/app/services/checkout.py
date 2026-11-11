"""Расчёт итога к оплате на сервере (backend/docs/loyalty-accounts.md, раздел 6, шаги 1–2).

1. Продано — сумма строк (услуги записи или «товар» чека без записи, сертификаты).
2. Бонусные строки и строки, оплаченные абонементом (subscriptions.md, раздел 6),
   → 0 ₴ (в скидке и кешбэке не участвуют).
3. Скидка — одна, наибольшая в гривнах из: личной % клиента, % уровня карты,
   фиксированной уровня карты (не больше суммы). Источник — в discount_source.
   Строки-сертификаты в базу скидки не входят (certificates.md, решение 11),
   строки-товары входят (product-sales.md, раздел 3), строки-абонементы — тоже
   (subscriptions.md, решение 8).
4. Итог = Продано − бонусные строки − строки по абонементу − скидка, копейки ROUND_HALF_UP.

Клиенту не доверяем: итог считается здесь и при предпросмотре, и при оплате.
"""

import uuid
from dataclasses import dataclass
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session

from app.models.master import Client, LoyaltyCard
from app.models.shard import DiscountSource, ProductSaleMode, Record
from app.services import certificates, ledger, loyalty, subscriptions
from app.services.certificates import LineAmount
from app.services.ledger import money

# Порядок при равных суммах: личная, % карты, фиксированная карты
CANDIDATE_ORDER = (DiscountSource.CLIENT, DiscountSource.CARD_PERCENT, DiscountSource.CARD_FIXED)


@dataclass(frozen=True)
class Line:
    kind: str  # service | product | certificate | subscription
    name: str
    price: Decimal
    record_service_id: uuid.UUID | None = None
    service_id: uuid.UUID | None = None
    is_bonus: bool = False
    # Строка-сертификат: шаблон продажи
    template_id: uuid.UUID | None = None
    # Строка-абонемент: тип продажи
    subscription_type_id: uuid.UUID | None = None
    # Строка услуги, оплачиваемая абонементом клиента (0 ₴ в итоге)
    subscription_id: uuid.UUID | None = None
    # Строка-товар со склада; у ручной суммы «Товари» (чек без записи) product_id нет
    product_id: uuid.UUID | None = None
    mode: ProductSaleMode | None = None
    quantity: Decimal | None = None
    unit_price: Decimal | None = None

    @property
    def is_certificate(self) -> bool:
        return self.kind == "certificate"

    @property
    def is_subscription(self) -> bool:
        return self.kind == "subscription"

    @property
    def is_free(self) -> bool:
        """Бонусная или оплаченная абонементом — 0 ₴, вне скидки и кешбэка."""
        return self.is_bonus or self.subscription_id is not None

    @property
    def amount(self) -> Decimal:
        """Сумма строки до скидки: бонусная и по абонементу — 0 ₴."""
        return Decimal(0) if self.is_free else self.price

    def payload(self) -> dict[str, object]:
        return {
            "kind": self.kind,
            "name": self.name,
            "record_service_id": str(self.record_service_id) if self.record_service_id else None,
            "service_id": str(self.service_id) if self.service_id else None,
            "price": str(self.price),
            "amount": str(self.amount),
            "is_bonus": self.is_bonus,
            "subscription_id": str(self.subscription_id) if self.subscription_id else None,
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
    # Строки услуг, оплаченные абонементом: цена в «Продано», в итоге 0 ₴
    subscription_used: Decimal = Decimal("0.00")

    @property
    def base(self) -> Decimal:
        """База скидки: Продано без бесплатных строк и сертификатов."""
        return self.sold - self.bonus_amount - self.subscription_used - self.certificates

    @property
    def rest(self) -> Decimal:
        """Итог без сертификатов — часть, которую можно оплатить счётом, кешбэком, сертификатом."""
        return self.total - self.certificates

    def scope_lines(self) -> list[LineAmount]:
        """Строки-услуги и товары со склада после скидки — база областей сертификата.

        Услуги — пропорционально скидке, товары — их paid_amount (product_paid_amounts),
        как в receipt_product_lines (certificates.md, 11.3).
        """
        base = self.base
        if base <= 0:
            return []
        factor = (base - self.discount) / base
        services = [
            LineAmount(kind="service", item_id=line.service_id, amount=money(line.amount * factor))
            for line in self.lines
            if line.kind == "service" and line.service_id is not None
        ]
        product_ids = [line.product_id for line in self.lines if line.product_id is not None]
        products = [
            LineAmount(kind="product", item_id=product_id, amount=paid)
            for product_id, paid in zip(product_ids, self.product_paid_amounts(), strict=True)
        ]
        return services + products

    def product_paid_amounts(self) -> list[Decimal]:
        """Строки товаров со склада после скидки — по той же формуле, что и услуги."""
        return self._paid_amounts(
            [line.price for line in self.lines if line.product_id is not None]
        )

    def subscription_paid_amounts(self) -> list[Decimal]:
        """Строки-абонементы после скидки (subscriptions.md, раздел 5, п. 2)."""
        return self._paid_amounts([line.price for line in self.lines if line.is_subscription])

    def _paid_amounts(self, amounts: list[Decimal]) -> list[Decimal]:
        """Строки после скидки пропорционально, как у услуг.

        Копеечный остаток округления уходит на последнюю строку; если он больше неё —
        на предыдущие: строка не может стать отрицательной.
        """
        base = self.base
        if base <= 0:
            return [Decimal("0.00") for _ in amounts]
        factor = (base - self.discount) / base
        paid = [money(amount * factor) for amount in amounts]
        rest = money(sum(amounts, Decimal(0)) * factor) - sum(paid, Decimal(0))
        for i in reversed(range(len(paid))):
            adjusted = max(paid[i] + rest, Decimal("0.00"))
            rest -= adjusted - paid[i]
            paid[i] = adjusted
        return paid


def quote(
    lines: list[Line],
    *,
    client_percent: Decimal = Decimal(0),
    level_percent: Decimal = Decimal(0),
    level_fixed: Decimal = Decimal(0),
) -> Quote:
    sold = money(sum((line.price for line in lines), Decimal(0)))
    bonus = money(sum((line.price for line in lines if line.is_bonus), Decimal(0)))
    used = money(
        sum(
            (line.price for line in lines if line.subscription_id and not line.is_bonus),
            Decimal(0),
        )
    )
    certificates = money(sum((line.price for line in lines if line.is_certificate), Decimal(0)))
    base = sold - bonus - used - certificates
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
        subscription_used=used,
    )


def record_lines(
    record: Record,
    bonus_ids: frozenset[uuid.UUID] = frozenset(),
    uses: dict[uuid.UUID, uuid.UUID] | None = None,
) -> list[Line]:
    """Строки услуг записи; uses — record_service_id → абонемент, которым оплачена строка."""
    uses = uses or {}
    return [
        Line(
            kind="service",
            name=s.name,
            price=s.price,
            record_service_id=s.id,
            service_id=s.service_id,
            is_bonus=s.id in bonus_ids,
            subscription_id=uses.get(s.id),
        )
        for s in record.services
    ]


def subscription_uses(record: Record, uses: dict[uuid.UUID, uuid.UUID]) -> list[subscriptions.Use]:
    """Строки записи, оплачиваемые абонементами: длительность — снимок строки записи."""
    return [
        subscriptions.Use(
            record_service_id=s.id,
            subscription_id=uses[s.id],
            service_id=s.service_id,
            service_name=s.name,
            duration_minutes=s.duration_minutes,
        )
        for s in record.services
        if s.id in uses
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


def subscription_lines(issues: list[subscriptions.Issue]) -> list[Line]:
    """Строки-абонементы: одна на абонемент, цена типа; в скидке и кешбэке, как обычные."""
    return [
        Line(
            kind="subscription",
            name=i.name,
            price=money(i.price),
            subscription_type_id=i.type_id,
        )
        for i in issues
    ]


async def subscription_issues(
    master_session: AsyncSession, sales: list[subscriptions.SubscriptionSale]
) -> list[subscriptions.Issue]:
    """Позиции продажи → выпускаемые абонементы; тип не в архиве."""
    if not sales:
        return []

    def build(session: Session) -> list[subscriptions.Issue]:
        return subscriptions.plan_issues(subscriptions.load_types(session, sales), sales)

    return await master_session.run_sync(build)


def with_paid_amounts(issues: list[subscriptions.Issue], q: Quote) -> list[subscriptions.Issue]:
    """Оплаченная сумма каждой строки-абонемента после скидки — для unit_value и чека."""
    return [
        issue.paid(paid) for issue, paid in zip(issues, q.subscription_paid_amounts(), strict=True)
    ]


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
