"""продажа товаров со склада: цена упаковки, строки чека-товары, products_amount

Revision ID: e5b7c9d1f3a5
Revises: d60f7296d850
Create Date: 2026-11-04 12:00:00

ВАЖНО: миграция прогоняется на все шард-БД неатомарно — она обязана быть
backward-compatible (expand → migrate → contract).

Expand (backend/docs/product-sales.md, раздел 2):
- products.package_price — цена упаковки (новая nullable колонка);
- products.sale_price и cost_price — Numeric(12,2) → Numeric(12,4): цена за мл/г
  бывает дробнее копейки. Расширение типа без потери данных;
- receipts.products_amount — сумма товаров в чеке, server_default 0: старый код
  колонку не пишет, старые чеки — без товаров;
- receipt_product_lines — проданные товары чека (новая таблица, старый код её не читает).

Тип движения sale — значение в VARCHAR-колонке stock_movements.type без нативного
enum и без CHECK (create_constraint не задан), поэтому DDL не нужен. Пересчёта
данных нет (решение 13). Contract не нужен.

Downgrade возвращает цены к Numeric(12,2) с округлением и удаляет строки товаров;
движения sale остаются в истории (старый код покажет их как неизвестный тип).
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "e5b7c9d1f3a5"
down_revision: str | Sequence[str] | None = "d60f7296d850"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("products", sa.Column("package_price", sa.Numeric(12, 2), nullable=True))
    for column in ("sale_price", "cost_price"):
        op.alter_column(
            "products",
            column,
            type_=sa.Numeric(12, 4),
            existing_type=sa.Numeric(12, 2),
            existing_nullable=True,
        )
    op.add_column(
        "receipts",
        sa.Column("products_amount", sa.Numeric(12, 2), server_default="0", nullable=False),
    )
    op.create_table(
        "receipt_product_lines",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("receipt_id", sa.Uuid(), nullable=False),
        sa.Column("product_id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("sku", sa.String(length=64), nullable=False),
        sa.Column(
            "unit",
            sa.Enum("pcs", "ml", "l", "g", "kg", name="productunit", native_enum=False, length=8),
            nullable=False,
        ),
        sa.Column(
            "mode",
            sa.Enum("package", "volume", name="productsalemode", native_enum=False, length=16),
            nullable=False,
        ),
        sa.Column("quantity", sa.Numeric(precision=14, scale=3), nullable=False),
        sa.Column("base_quantity", sa.Numeric(precision=14, scale=3), nullable=False),
        sa.Column("unit_price", sa.Numeric(precision=12, scale=4), nullable=False),
        sa.Column("amount", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("paid_amount", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("cost_amount", sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column("movement_id", sa.Uuid(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["receipt_id"],
            ["receipts.id"],
            name=op.f("fk_receipt_product_lines_receipt_id_receipts"),
        ),
        sa.ForeignKeyConstraint(
            ["product_id"],
            ["products.id"],
            name=op.f("fk_receipt_product_lines_product_id_products"),
        ),
        sa.ForeignKeyConstraint(
            ["movement_id"],
            ["stock_movements.id"],
            name=op.f("fk_receipt_product_lines_movement_id_stock_movements"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_receipt_product_lines")),
        sa.UniqueConstraint("movement_id", name=op.f("uq_receipt_product_lines_movement_id")),
    )
    op.create_index(
        op.f("ix_receipt_product_lines_receipt_id"), "receipt_product_lines", ["receipt_id"]
    )
    op.create_index(
        op.f("ix_receipt_product_lines_product_id"), "receipt_product_lines", ["product_id"]
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_receipt_product_lines_product_id"), table_name="receipt_product_lines")
    op.drop_index(op.f("ix_receipt_product_lines_receipt_id"), table_name="receipt_product_lines")
    op.drop_table("receipt_product_lines")
    op.drop_column("receipts", "products_amount")
    for column in ("sale_price", "cost_price"):
        op.alter_column(
            "products",
            column,
            type_=sa.Numeric(12, 2),
            existing_type=sa.Numeric(12, 4),
            existing_nullable=True,
        )
    op.drop_column("products", "package_price")
