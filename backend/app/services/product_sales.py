"""Продажа товаров со склада в чеке: бутылками и по объёму (backend/docs/product-sales.md).

Цена, режимы и остаток берутся только из карточки товара. Предпросмотр читает
товары без блокировки; оплата и отмена блокируют их FOR UPDATE в порядке id, и
оплата делает это до списаний в Master DB: нехватка товара не должна вести к сторно.
Склад меняется в той же транзакции шарда, что и чек.
"""

import uuid
from dataclasses import dataclass
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.shard import (
    MovementType,
    Product,
    ProductSaleMode,
    ProductUnit,
    Receipt,
    ReceiptProductLine,
    StockMovement,
)
from app.services import checkout
from app.services.ledger import money

MAX_LINES = 50

UNIT_NAMES = {
    ProductUnit.PCS: "шт",
    ProductUnit.ML: "мл",
    ProductUnit.L: "л",
    ProductUnit.G: "г",
    ProductUnit.KG: "кг",
}

QUANTITY_STEP = Decimal("0.001")


class ProductSaleError(Exception):
    """Товар неактивен, режим недоступен или не хватает остатка."""

    status_code = 409


class InvalidQuantity(ProductSaleError):
    """Количество не подходит режиму: бутылки и штуки — только целые."""

    status_code = 422


@dataclass(frozen=True)
class ProductSale:
    """Позиция, как её выбрал администратор."""

    product_id: uuid.UUID
    mode: ProductSaleMode
    quantity: Decimal


@dataclass(frozen=True)
class PlannedLine:
    """Строка чека с ценой и базой, посчитанными по карточке."""

    product: Product
    mode: ProductSaleMode
    quantity: Decimal
    base_quantity: Decimal
    unit_price: Decimal
    amount: Decimal
    cost_amount: Decimal | None

    def line(self) -> checkout.Line:
        return checkout.Line(
            kind="product",
            name=self.product.name,
            price=self.amount,
            product_id=self.product.id,
            mode=self.mode,
            quantity=self.quantity,
            unit_price=self.unit_price,
        )


def _quantity_text(value: Decimal, unit: ProductUnit) -> str:
    text = f"{value.normalize():f}"
    return f"{text} {UNIT_NAMES[unit]}"


def merge(sales: list[ProductSale]) -> list[ProductSale]:
    """Один товар в одном режиме — одна строка; порядок первого появления."""
    totals: dict[tuple[uuid.UUID, ProductSaleMode], Decimal] = {}
    for sale in sales:
        key = (sale.product_id, sale.mode)
        totals[key] = totals.get(key, Decimal(0)) + sale.quantity
    return [ProductSale(product_id=p, mode=m, quantity=q) for (p, m), q in totals.items()]


def _plan_line(product: Product, sale: ProductSale) -> PlannedLine:
    if not product.is_active:
        raise ProductSaleError(f"Товар «{product.name}» видалено")
    quantity = sale.quantity
    if sale.mode == ProductSaleMode.PACKAGE:
        if product.package_volume is None or product.package_price is None:
            raise ProductSaleError(f"Товар «{product.name}» не продається упаковкою")
        if quantity != quantity.to_integral_value():
            raise InvalidQuantity("Кількість упаковок має бути цілою")
        base = quantity * product.package_volume
        price = product.package_price
    else:
        if product.sale_price is None:
            raise ProductSaleError(f"Товар «{product.name}» не продається на розлив")
        if product.unit == ProductUnit.PCS and quantity != quantity.to_integral_value():
            raise InvalidQuantity("Кількість штук має бути цілою")
        base = quantity
        price = product.sale_price
    return PlannedLine(
        product=product,
        mode=sale.mode,
        quantity=quantity,
        base_quantity=base.quantize(QUANTITY_STEP),
        unit_price=price,
        amount=money(price * quantity),
        cost_amount=(
            money(product.cost_price * base.quantize(QUANTITY_STEP))
            if product.cost_price is not None
            else None
        ),
    )


async def plan(
    tenant_session: AsyncSession, sales: list[ProductSale], *, lock: bool
) -> list[PlannedLine]:
    """Позиции → строки чека: проверка режимов и суммарного остатка по всем режимам.

    lock=True — товары под FOR UPDATE в порядке id до конца транзакции (оплата).
    """
    if not sales:
        return []
    merged = merge(sales)
    query = (
        select(Product)
        .where(Product.id.in_({s.product_id for s in merged}))
        .order_by(Product.id)
        .execution_options(populate_existing=True)
    )
    if lock:
        query = query.with_for_update()
    products = {p.id: p for p in await tenant_session.scalars(query)}
    lines = []
    needed: dict[uuid.UUID, Decimal] = {}
    for sale in merged:
        product = products.get(sale.product_id)
        if product is None:
            raise ProductSaleError("Товар не знайдено")
        line = _plan_line(product, sale)
        lines.append(line)
        needed[product.id] = needed.get(product.id, Decimal(0)) + line.base_quantity
    for product_id, total in needed.items():
        product = products[product_id]
        if total > product.quantity:
            raise ProductSaleError(
                f"Недостатньо товару «{product.name}»: в наявності "
                f"{_quantity_text(product.quantity, product.unit)}, "
                f"потрібно {_quantity_text(total, product.unit)}"
            )
    return lines


async def write_lines(
    tenant_session: AsyncSession,
    *,
    receipt: Receipt,
    lines: list[PlannedLine],
    paid_amounts: list[Decimal],
    record_id: uuid.UUID | None,
    author_id: uuid.UUID | None,
    author_name: str | None,
) -> None:
    """Строки чека и движения sale; товары заблокированы в plan(lock=True)."""
    movements = []
    for line in lines:
        product = line.product
        product.quantity = product.quantity - line.base_quantity
        movement = StockMovement(
            product_id=product.id,
            type=MovementType.SALE,
            delta=-line.base_quantity,
            quantity_after=product.quantity,
            reason=f"Продаж: чек {receipt.number}",
            record_id=record_id,
            author_id=author_id,
            author_name=author_name,
        )
        tenant_session.add(movement)
        movements.append(movement)
    await tenant_session.flush()
    for line, movement, paid in zip(lines, movements, paid_amounts, strict=True):
        product = line.product
        tenant_session.add(
            ReceiptProductLine(
                receipt_id=receipt.id,
                product_id=product.id,
                name=product.name,
                sku=product.sku,
                unit=product.unit,
                mode=line.mode,
                quantity=line.quantity,
                base_quantity=line.base_quantity,
                unit_price=line.unit_price,
                amount=line.amount,
                paid_amount=paid,
                cost_amount=line.cost_amount,
                movement_id=movement.id,
            )
        )


async def return_lines(
    tenant_session: AsyncSession,
    *,
    receipt: Receipt,
    author_id: uuid.UUID | None,
    author_name: str | None,
) -> None:
    """Отмена чека: обратное движение по каждой строке, в том числе у удалённого товара."""
    lines = list(
        await tenant_session.scalars(
            select(ReceiptProductLine).where(ReceiptProductLine.receipt_id == receipt.id)
        )
    )
    if not lines:
        return
    products = {
        p.id: p
        for p in await tenant_session.scalars(
            select(Product)
            .where(Product.id.in_({line.product_id for line in lines}))
            .order_by(Product.id)
            .with_for_update()
            .execution_options(populate_existing=True)
        )
    }
    for line in lines:
        product = products[line.product_id]
        product.quantity = product.quantity + line.base_quantity
        tenant_session.add(
            StockMovement(
                product_id=product.id,
                type=MovementType.RECEIPT,
                delta=line.base_quantity,
                quantity_after=product.quantity,
                reason=f"Скасування чека {receipt.number}",
                record_id=receipt.record_id,
                cancels_movement_id=line.movement_id,
                author_id=author_id,
                author_name=author_name,
            )
        )
    await tenant_session.flush()
