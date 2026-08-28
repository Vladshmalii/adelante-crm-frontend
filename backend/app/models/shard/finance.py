"""Финансовый домен салона (страница finances).

Завершение визита (POST /records/{id}/complete) автоматически создаёт
Receipt с разбивкой по методам оплаты и FinanceOperation(income) на каждую
часть. Балансы касс не хранятся — считаются по операциям.
"""

import enum
import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Index, Numeric, String, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import ShardBase, str_enum


class PaymentMethodType(enum.StrEnum):
    CASH = "cash"
    CARD = "card"
    ONLINE = "online"
    CERTIFICATE = "certificate"
    BONUS = "bonus"
    TIPS = "tips"
    OTHER = "other"


class CommissionType(enum.StrEnum):
    NONE = "none"
    PERCENTAGE = "percentage"
    FIXED = "fixed"


class CommissionPayer(enum.StrEnum):
    CLIENT = "client"
    SALON = "salon"
    SPLIT = "split"


class OperationType(enum.StrEnum):
    INCOME = "income"
    EXPENSE = "expense"
    TRANSFER = "transfer"


class OperationStatus(enum.StrEnum):
    COMPLETED = "completed"
    PENDING = "pending"
    CANCELLED = "cancelled"


class DocumentType(enum.StrEnum):
    RECEIPT = "receipt"
    INVOICE = "invoice"
    EXPENSE = "expense"
    INCOME = "income"
    ACT = "act"


class DocumentContentType(enum.StrEnum):
    SERVICES = "services"
    PRODUCTS = "products"
    MIXED = "mixed"


class DocumentStatus(enum.StrEnum):
    DRAFT = "draft"
    ISSUED = "issued"
    PAID = "paid"
    CANCELLED = "cancelled"


class ReceiptStatus(enum.StrEnum):
    PAID = "paid"
    PARTIAL = "partial"
    CANCELLED = "cancelled"


class ReceiptSource(enum.StrEnum):
    WEB = "web"
    MOBILE = "mobile"
    POS = "pos"


class CashRegister(ShardBase):
    __tablename__ = "cash_registers"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(128))
    location: Mapped[str | None] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class PaymentMethod(ShardBase):
    __tablename__ = "payment_methods"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(128))
    type: Mapped[PaymentMethodType] = mapped_column(str_enum(PaymentMethodType, 16))
    cash_register_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("cash_registers.id"))

    commission_type: Mapped[CommissionType] = mapped_column(
        str_enum(CommissionType, 16), default=CommissionType.NONE
    )
    commission_value: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal(0))
    commission_payer: Mapped[CommissionPayer] = mapped_column(
        str_enum(CommissionPayer, 16), default=CommissionPayer.SALON
    )

    available_online: Mapped[bool] = mapped_column(default=False)
    allow_partial_payment: Mapped[bool] = mapped_column(default=True)
    allow_tips: Mapped[bool] = mapped_column(default=False)
    sort_order: Mapped[int] = mapped_column(default=0)
    is_active: Mapped[bool] = mapped_column(default=True)


class FinanceDocument(ShardBase):
    __tablename__ = "finance_documents"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    type: Mapped[DocumentType] = mapped_column(str_enum(DocumentType, 16))
    number: Mapped[str] = mapped_column(String(64), unique=True)
    date: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    content_type: Mapped[DocumentContentType] = mapped_column(
        str_enum(DocumentContentType, 16),
        default=DocumentContentType.SERVICES,
    )
    counterparty: Mapped[str | None] = mapped_column(String(255))
    comment: Mapped[str | None] = mapped_column(String(2000))
    status: Mapped[DocumentStatus] = mapped_column(
        str_enum(DocumentStatus, 16), default=DocumentStatus.DRAFT
    )
    author_id: Mapped[uuid.UUID | None] = mapped_column(Uuid)
    author_name: Mapped[str | None] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Receipt(ShardBase):
    __tablename__ = "receipts"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    number: Mapped[str] = mapped_column(String(64), unique=True)
    date: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    cash_register_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("cash_registers.id"))
    # Ссылки на Master DB (client) и на запись этого шарда
    client_id: Mapped[uuid.UUID | None] = mapped_column(Uuid)
    client_name: Mapped[str | None] = mapped_column(String(255))
    record_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("records.id"))
    document_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("finance_documents.id"))

    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    status: Mapped[ReceiptStatus] = mapped_column(
        str_enum(ReceiptStatus, 16), default=ReceiptStatus.PAID
    )
    source: Mapped[ReceiptSource] = mapped_column(
        str_enum(ReceiptSource, 16), default=ReceiptSource.WEB
    )
    author_id: Mapped[uuid.UUID | None] = mapped_column(Uuid)
    author_name: Mapped[str | None] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    payments: Mapped[list["ReceiptPayment"]] = relationship(
        back_populates="receipt", cascade="all, delete-orphan", lazy="selectin"
    )


class ReceiptPayment(ShardBase):
    """Разбивка чека по методам оплаты (mixed: наличные + карта)."""

    __tablename__ = "receipt_payments"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    receipt_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("receipts.id"), index=True)
    payment_method_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("payment_methods.id"))
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))

    receipt: Mapped[Receipt] = relationship(back_populates="payments")


class FinanceOperation(ShardBase):
    __tablename__ = "finance_operations"
    __table_args__ = (Index("ix_finance_operations_date", "date"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    type: Mapped[OperationType] = mapped_column(str_enum(OperationType, 16))
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    category: Mapped[str | None] = mapped_column(String(64))
    description: Mapped[str | None] = mapped_column(String(2000))
    date: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    status: Mapped[OperationStatus] = mapped_column(
        str_enum(OperationStatus, 16),
        default=OperationStatus.COMPLETED,
    )

    payment_method_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("payment_methods.id"))
    cash_register_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("cash_registers.id"))
    client_id: Mapped[uuid.UUID | None] = mapped_column(Uuid)
    record_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("records.id"))
    receipt_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("receipts.id"))
    document_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("finance_documents.id"))

    author_id: Mapped[uuid.UUID | None] = mapped_column(Uuid)
    author_name: Mapped[str | None] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
