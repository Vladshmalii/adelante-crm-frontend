"""Абонементы (backend/docs/subscriptions.md, раздел 3.1).

Уровень сети, как сертификаты: типы создаёт суперюзер один раз на сеть, абонемент
действует во всех салонах (решение 6). Абонемент именной: client_id обязателен
(решение 7). Экземпляр хранит снимок типа на момент продажи — правка типа проданные
абонементы не меняет.

Остаток — не поле абонемента, а «корзины» subscription_balances: при shared одна
строка без услуги, при separate — по строке на пару (салон, услуга). Корзина меняется
только вместе с записью в неизменяемом журнале subscription_operations (issue / use /
reversal / expire / cancel), под блокировкой строки абонемента FOR UPDATE; у каждой
операции уникальный idempotency_key, отмена — сторно (reversal), не UPDATE.
"""

import enum
import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Numeric,
    String,
    Uuid,
    func,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import MasterBase, str_enum


class SubscriptionUnitKind(enum.StrEnum):
    VISITS = "visits"  # строка услуги в визите = 1
    MINUTES = "minutes"  # строка услуги списывает свою длительность


class SubscriptionBalanceMode(enum.StrEnum):
    SHARED = "shared"  # общий остаток на все услуги типа
    SEPARATE = "separate"  # свой остаток на каждую услугу


class SubscriptionDurationUnit(enum.StrEnum):
    DAY = "day"
    MONTH = "month"


class SubscriptionActivationMode(enum.StrEnum):
    ON_SALE = "on_sale"  # сразу при продаже
    FIRST_VISIT = "first_visit"  # первым списанием (или автоактивацией через N дней)


class SubscriptionStatus(enum.StrEnum):
    PENDING = "pending"  # продан, ждёт первого визита
    ACTIVE = "active"
    FROZEN = "frozen"
    SPENT = "spent"  # остаток 0 по всем корзинам
    EXPIRED = "expired"  # срок вышел, остаток сгорел
    CANCELLED = "cancelled"  # отменён чек покупки (или компенсация / ночная сверка)


class SubscriptionOperationType(enum.StrEnum):
    ISSUE = "issue"  # выпуск: + units корзины
    USE = "use"  # списание строкой услуги визита: − количество
    REVERSAL = "reversal"  # сторно операции (reverses_id)
    EXPIRE = "expire"  # сгорание остатка по сроку — в ноль
    CANCEL = "cancel"  # аннулирование при отмене чека покупки — в ноль


class SubscriptionType(MasterBase):
    """Тип абонемента — шаблон каталога сети. Удаления нет — только архив (is_active)."""

    __tablename__ = "subscription_types"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255))
    price: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    unit_kind: Mapped[SubscriptionUnitKind] = mapped_column(str_enum(SubscriptionUnitKind, 16))
    balance_mode: Mapped[SubscriptionBalanceMode] = mapped_column(
        str_enum(SubscriptionBalanceMode, 16)
    )
    # Обязателен при shared, NULL при separate (тогда units — у каждой услуги)
    total_units: Mapped[int | None]
    # 0 — бессрочный
    duration_value: Mapped[int] = mapped_column(default=0, server_default="0")
    duration_unit: Mapped[SubscriptionDurationUnit] = mapped_column(
        str_enum(SubscriptionDurationUnit, 16)
    )
    activation_mode: Mapped[SubscriptionActivationMode] = mapped_column(
        str_enum(SubscriptionActivationMode, 16)
    )
    # Только при first_visit: автоактивация через N дней после продажи; NULL — нет
    auto_activate_days: Mapped[int | None]
    freeze_allowed: Mapped[bool] = mapped_column(default=False, server_default="false")
    # Суммарный лимит заморозки в днях; 0 — без лимита
    freeze_max_days: Mapped[int] = mapped_column(default=0, server_default="0")
    # is_active=false — архив: не продаётся, проданные работают
    is_active: Mapped[bool] = mapped_column(default=True, server_default="true")
    sort_order: Mapped[int] = mapped_column(default=0, server_default="0")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    services: Mapped[list["SubscriptionTypeService"]] = relationship(
        cascade="all, delete-orphan", lazy="selectin"
    )


class SubscriptionTypeService(MasterBase):
    """Услуга типа: пара (салон, услуга) без FK на шард, EXISTS-проверка при сохранении.

    units — только при separate (своё число единиц на услугу), при shared — NULL.
    """

    __tablename__ = "subscription_type_services"

    type_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("subscription_types.id", ondelete="CASCADE"), primary_key=True
    )
    salon_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("salons.id"), primary_key=True)
    service_id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True)
    units: Mapped[int | None]


class Subscription(MasterBase):
    """Проданный абонемент: снимок типа, сроки, заморозка, статус. Остатки — в корзинах."""

    __tablename__ = "subscriptions"
    __table_args__ = (
        Index("ix_subscriptions_client_id", "client_id"),
        Index("ix_subscriptions_type_id", "type_id"),
        Index("ix_subscriptions_status", "status"),
        Index("ix_subscriptions_sold_receipt", "sold_salon_id", "sold_receipt_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    # Именной (решение 7): передать нельзя
    client_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("clients.id"))
    type_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("subscription_types.id"))

    # Снимок типа на момент продажи
    name: Mapped[str] = mapped_column(String(255))
    unit_kind: Mapped[SubscriptionUnitKind] = mapped_column(str_enum(SubscriptionUnitKind, 16))
    balance_mode: Mapped[SubscriptionBalanceMode] = mapped_column(
        str_enum(SubscriptionBalanceMode, 16)
    )
    total_units: Mapped[int | None]
    duration_value: Mapped[int]
    duration_unit: Mapped[SubscriptionDurationUnit] = mapped_column(
        str_enum(SubscriptionDurationUnit, 16)
    )
    activation_mode: Mapped[SubscriptionActivationMode] = mapped_column(
        str_enum(SubscriptionActivationMode, 16)
    )
    auto_activate_days: Mapped[int | None]
    freeze_allowed: Mapped[bool]
    freeze_max_days: Mapped[int]

    # Оплачено за строку после скидки; стоимость единицы = paid_amount / всего единиц
    paid_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    unit_value: Mapped[Decimal] = mapped_column(Numeric(12, 4))

    # Продажа: салон и чек шарда (без FK на чек)
    sold_salon_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("salons.id"))
    sold_receipt_id: Mapped[uuid.UUID] = mapped_column(Uuid)
    sold_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    # Ключ выпуска subs:{salon}:{receipt}:{line} — повтор оплаты не выпускает второй
    issue_key: Mapped[str] = mapped_column(String(200), unique=True)

    status: Mapped[SubscriptionStatus] = mapped_column(str_enum(SubscriptionStatus, 16))
    activated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    # NULL — бессрочный или ещё не активирован
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    # Автоактивация pending (first_visit + auto_activate_days); NULL — нет
    auto_activate_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Заморозка — один раз за жизнь абонемента (решение 5)
    frozen_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    # NULL — без лимита
    freeze_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    unfrozen_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    # Фактически заморожено дней (неполный день — вверх)
    frozen_days: Mapped[int] = mapped_column(default=0, server_default="0")
    freeze_used: Mapped[bool] = mapped_column(default=False, server_default="false")

    # Аннулирование: отмена чека покупки, компенсация сбоя шарда, ночная сверка
    cancelled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    cancelled_by: Mapped[uuid.UUID | None] = mapped_column(Uuid)
    cancelled_by_name: Mapped[str | None] = mapped_column(String(255))
    cancel_reason: Mapped[str | None] = mapped_column(String(2000))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    services: Mapped[list["SubscriptionService"]] = relationship(
        cascade="all, delete-orphan", lazy="selectin"
    )
    balances: Mapped[list["SubscriptionBalance"]] = relationship(
        cascade="all, delete-orphan", lazy="selectin"
    )


class SubscriptionService(MasterBase):
    """Снимок услуг типа на момент продажи: (салон, услуга), units — при separate."""

    __tablename__ = "subscription_services"

    subscription_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("subscriptions.id", ondelete="CASCADE"), primary_key=True
    )
    salon_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("salons.id"), primary_key=True)
    service_id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True)
    units: Mapped[int | None]


class SubscriptionBalance(MasterBase):
    """Корзина остатка: shared — одна, без услуги; separate — по паре (салон, услуга).

    balance меняется только вместе с записью в subscription_operations, под блокировкой
    абонемента. В минус не уходит (CHECK).
    """

    __tablename__ = "subscription_balances"
    __table_args__ = (
        Index(
            "uq_subscription_balances_shared",
            "subscription_id",
            unique=True,
            postgresql_where=text("service_id IS NULL"),
        ),
        Index(
            "uq_subscription_balances_service",
            "subscription_id",
            "salon_id",
            "service_id",
            unique=True,
            postgresql_where=text("service_id IS NOT NULL"),
        ),
        CheckConstraint("balance >= 0", name="balance_not_negative"),
        CheckConstraint("(salon_id IS NULL) = (service_id IS NULL)", name="service_pair"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    subscription_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("subscriptions.id", ondelete="CASCADE")
    )
    # Пара (салон, услуга) корзины separate; обе NULL — общая корзина shared
    salon_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("salons.id"))
    service_id: Mapped[uuid.UUID | None] = mapped_column(Uuid)
    # Выдано при продаже и текущий остаток, в единицах типа (посещения или минуты)
    units: Mapped[int]
    balance: Mapped[int]
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    def matches(self, salon_id: uuid.UUID, service_id: uuid.UUID) -> bool:
        """Корзина для строки услуги: общая — любая услуга снимка, своя — только её пара."""
        return self.service_id is None or (
            self.salon_id == salon_id and self.service_id == service_id
        )


class SubscriptionOperation(MasterBase):
    """Неизменяемый журнал корзин абонемента. Только INSERT; отмена — reversal.

    Заморозка и разморозка остаток не меняют — пишутся в аудит, не сюда.
    """

    __tablename__ = "subscription_operations"
    __table_args__ = (
        Index("ix_subscription_operations_subscription", "subscription_id", "created_at"),
        Index("ix_subscription_operations_receipt", "salon_id", "receipt_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    subscription_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("subscriptions.id"))
    balance_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("subscription_balances.id"))
    type: Mapped[SubscriptionOperationType] = mapped_column(str_enum(SubscriptionOperationType, 16))
    # Единицы со знаком: + в корзину, − из корзины
    delta: Mapped[int]
    balance_after: Mapped[int]
    # Где и по какому чеку / строке записи (ссылки на шард — без FK)
    salon_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("salons.id"))
    receipt_id: Mapped[uuid.UUID | None] = mapped_column(Uuid)
    record_id: Mapped[uuid.UUID | None] = mapped_column(Uuid)
    record_service_id: Mapped[uuid.UUID | None] = mapped_column(Uuid)
    author_id: Mapped[uuid.UUID | None] = mapped_column(Uuid)
    author_name: Mapped[str | None] = mapped_column(String(255))
    comment: Mapped[str | None] = mapped_column(String(2000))
    # Для reversal — какую операцию отменяет
    reverses_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("subscription_operations.id"))
    idempotency_key: Mapped[str] = mapped_column(String(200), unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
