"""Склад салона: товары, категории, движения остатков.

Остаток меняется только движениями (надходження / списання / коригування),
каждое хранит дельту и остаток после — история читается без пересчёта.
Остаток хранится в единице товара (unit); для фасованных товаров
package_volume — сколько единиц в упаковке (фронт показывает «N шт + остаток»).
"""

import enum
import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Index, Numeric, String, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import ShardBase, str_enum


class ProductUnit(enum.StrEnum):
    PCS = "pcs"
    ML = "ml"
    L = "l"
    G = "g"
    KG = "kg"


class MovementType(enum.StrEnum):
    RECEIPT = "receipt"  # надходження
    WRITE_OFF = "write_off"  # списання
    ADJUSTMENT = "adjustment"  # коригування (інвентаризація)


class InventoryCategory(ShardBase):
    """Категория товаров. Системная «Без категорії» не удаляется и не переименовывается."""

    __tablename__ = "inventory_categories"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(128), unique=True)
    is_system: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Product(ShardBase):
    __tablename__ = "products"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255))
    sku: Mapped[str] = mapped_column(String(64), unique=True)
    barcode: Mapped[str | None] = mapped_column(String(64))
    category_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("inventory_categories.id"), index=True
    )
    unit: Mapped[ProductUnit] = mapped_column(str_enum(ProductUnit, 8), default=ProductUnit.PCS)
    package_volume: Mapped[Decimal | None] = mapped_column(Numeric(12, 3))
    quantity: Mapped[Decimal] = mapped_column(Numeric(14, 3), default=Decimal(0))
    min_quantity: Mapped[Decimal] = mapped_column(Numeric(14, 3), default=Decimal(0))
    cost_price: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    sale_price: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    description: Mapped[str | None] = mapped_column(String(2000))
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


# Штрихкод уникален в салоне без учёта регистра (включая неактивные товары)
Index("uq_products_lower_barcode", func.lower(Product.barcode), unique=True)


class StockMovement(ShardBase):
    __tablename__ = "stock_movements"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    product_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("products.id"), index=True)
    type: Mapped[MovementType] = mapped_column(str_enum(MovementType, 16))
    delta: Mapped[Decimal] = mapped_column(Numeric(14, 3))
    quantity_after: Mapped[Decimal] = mapped_column(Numeric(14, 3))
    reason: Mapped[str | None] = mapped_column(String(500))
    # Списание расходников по записи
    record_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("records.id"), index=True)
    # Отмена ошибочного списания: обратное движение ссылается на отменённое
    # (unique — одно списание отменяется один раз)
    cancels_movement_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("stock_movements.id"), unique=True
    )
    author_id: Mapped[uuid.UUID | None] = mapped_column(Uuid)
    author_name: Mapped[str | None] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
