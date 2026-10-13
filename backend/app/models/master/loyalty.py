"""Карты лояльности (backend/docs/loyalty-accounts.md, разделы 4.1 и 7).

Уровень сети: тип карты задаёт правила (кешбэк, уровни скидок, бонусные
услуги) и салоны, где они действуют. В других салонах карта видна, но не
применяется. Счётчики карты — кэш фактов визитов (loyalty_card_visits),
обновляются вместе с фактом под блокировкой строки карты.
"""

import enum
import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Index,
    Numeric,
    String,
    Table,
    UniqueConstraint,
    Uuid,
    func,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import MasterBase, str_enum
from app.models.master.salon import Salon


class LevelBasis(enum.StrEnum):
    SOLD_AMOUNT = "sold_amount"  # по сумме «Продано»
    VISITS = "visits"  # по числу визитов


class CardStatus(enum.StrEnum):
    ACTIVE = "active"
    DELETED = "deleted"


loyalty_card_type_salons = Table(
    "loyalty_card_type_salons",
    MasterBase.metadata,
    Column(
        "card_type_id", ForeignKey("loyalty_card_types.id", ondelete="CASCADE"), primary_key=True
    ),
    Column("salon_id", ForeignKey("salons.id"), primary_key=True),
)


class LoyaltyCardType(MasterBase):
    """Тип карты. is_active=false — новые карты этого типа не выдаются."""

    __tablename__ = "loyalty_card_types"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(default=True, server_default="true")

    cashback_percent: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=Decimal(0))
    cashback_on_services: Mapped[bool] = mapped_column(default=True)
    cashback_on_products: Mapped[bool] = mapped_column(default=True)
    # Максимум чека, оплачиваемый кешбэком
    cashback_max_payment_percent: Mapped[Decimal] = mapped_column(
        Numeric(5, 2), default=Decimal(100)
    )
    # null — кешбэк не сгорает
    cashback_ttl_days: Mapped[int | None]
    level_basis: Mapped[LevelBasis] = mapped_column(
        str_enum(LevelBasis, 16), default=LevelBasis.SOLD_AMOUNT
    )

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Салоны, где карта применяется (скидки, кешбэк, начисления)
    salons: Mapped[list[Salon]] = relationship(secondary=loyalty_card_type_salons, lazy="selectin")
    levels: Mapped[list["LoyaltyDiscountLevel"]] = relationship(
        back_populates="card_type",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="LoyaltyDiscountLevel.threshold",
    )


class LoyaltyDiscountLevel(MasterBase):
    """Уровень скидки: порог — сумма «Продано» (₴) или число визитов, по level_basis типа."""

    __tablename__ = "loyalty_discount_levels"
    __table_args__ = (UniqueConstraint("card_type_id", "threshold"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    card_type_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("loyalty_card_types.id", ondelete="CASCADE")
    )
    threshold: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    discount_percent: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=Decimal(0))
    discount_fixed: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal(0))
    name: Mapped[str | None] = mapped_column(String(64))

    card_type: Mapped[LoyaltyCardType] = relationship(back_populates="levels")


class LoyaltyCard(MasterBase):
    """Карта клиента: одна активная на клиента. Удалённая остаётся для истории."""

    __tablename__ = "loyalty_cards"
    __table_args__ = (
        Index(
            "uq_loyalty_cards_active_client",
            "client_id",
            unique=True,
            postgresql_where=text("status = 'active'"),
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    number: Mapped[str] = mapped_column(String(16), unique=True)
    client_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("clients.id"), index=True)
    card_type_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("loyalty_card_types.id"))
    status: Mapped[CardStatus] = mapped_column(str_enum(CardStatus, 16), default=CardStatus.ACTIVE)

    # Кэш счётчиков с даты выдачи (решение 14) — для плиток и уровня
    sold_total: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), default=Decimal(0), server_default="0"
    )
    paid_total: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), default=Decimal(0), server_default="0"
    )
    visits_count: Mapped[int] = mapped_column(default=0, server_default="0")

    issued_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    issued_by: Mapped[uuid.UUID | None] = mapped_column(Uuid)
    issued_by_name: Mapped[str | None] = mapped_column(String(255))
    issued_salon_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("salons.id"))
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    deleted_by: Mapped[uuid.UUID | None] = mapped_column(Uuid)
    deleted_by_name: Mapped[str | None] = mapped_column(String(255))

    card_type: Mapped[LoyaltyCardType] = relationship(lazy="selectin")


class LoyaltyCardVisit(MasterBase):
    """Факт оплаченного чека клиента с картой; уникален по (salon_id, receipt_id).

    is_visit=false — продажа без записи: в «Візити» не идёт. reversed_at —
    чек отменён, счётчики карты уменьшены.
    """

    __tablename__ = "loyalty_card_visits"
    __table_args__ = (
        UniqueConstraint("salon_id", "receipt_id"),
        Index("ix_loyalty_card_visits_card_happened", "card_id", "happened_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    card_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("loyalty_cards.id"))
    salon_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("salons.id"))
    receipt_id: Mapped[uuid.UUID] = mapped_column(Uuid)
    record_id: Mapped[uuid.UUID | None] = mapped_column(Uuid)
    is_visit: Mapped[bool]
    sold_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    discount_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal(0))
    paid_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    cashback_base: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal(0))
    happened_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    reversed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
