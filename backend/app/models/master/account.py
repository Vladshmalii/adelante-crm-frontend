"""Счета клиента и журнал операций (backend/docs/loyalty-accounts.md, раздел 4.1).

Счета общие для сети, поэтому живут в Master DB рядом с Client. Баланс —
кэш суммы журнала: меняется только вместе с INSERT в account_transactions
под SELECT … FOR UPDATE строки счёта (app.services.ledger). Журнал
неизменяем: ошибки исправляются сторно (reversal) или корректировкой.
"""

import enum
import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Index, Numeric, String, Uuid, func, text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import MasterBase, str_enum


class AccountKind(enum.StrEnum):
    MONEY = "money"  # особовий рахунок: плюс — депозит, минус — долг
    CASHBACK = "cashback"  # кешбек-рахунок карты лояльности


class TransactionType(enum.StrEnum):
    TOPUP = "topup"
    REFUND = "refund"
    PAYMENT = "payment"
    ACCRUAL = "accrual"
    REVERSAL = "reversal"
    ADJUSTMENT = "adjustment"
    BURN = "burn"


class ClientAccount(MasterBase):
    """Счёт клиента. money-счёт — один на клиента, создаётся лениво при первой операции."""

    __tablename__ = "client_accounts"
    __table_args__ = (
        Index(
            "uq_client_accounts_money",
            "client_id",
            unique=True,
            postgresql_where=text("kind = 'money'"),
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    client_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("clients.id"), index=True)
    kind: Mapped[AccountKind] = mapped_column(str_enum(AccountKind, 16))
    balance: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal(0), server_default="0")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class AccountTransaction(MasterBase):
    """Операция по счёту — только INSERT. amount со знаком: + на счёт, − со счёта."""

    __tablename__ = "account_transactions"
    __table_args__ = (Index("ix_account_transactions_account_created", "account_id", "created_at"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    account_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("client_accounts.id"))
    type: Mapped[TransactionType] = mapped_column(str_enum(TransactionType, 16))
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    balance_after: Mapped[Decimal] = mapped_column(Numeric(12, 2))

    # Где проведена (X-Salon-Id); ссылки на шард — без FK
    salon_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("salons.id"))
    record_id: Mapped[uuid.UUID | None] = mapped_column(Uuid)
    receipt_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, index=True)

    # «Співробітник» из формы пополнения — только учёт
    staff_id: Mapped[uuid.UUID | None] = mapped_column(Uuid)
    staff_name: Mapped[str | None] = mapped_column(String(255))
    author_id: Mapped[uuid.UUID | None] = mapped_column(Uuid)
    author_name: Mapped[str | None] = mapped_column(String(255))
    comment: Mapped[str | None] = mapped_column(String(2000))

    reverses_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("account_transactions.id"), unique=True
    )
    idempotency_key: Mapped[str] = mapped_column(String(200), unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
