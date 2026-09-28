"""inventory: categories, products, stock movements

Revision ID: c4d8e1f2a9b3
Revises: b7e2d9a1c3f4
Create Date: 2026-09-28 18:00:00

Expand-only: новые таблицы и базовые категории склада.
"""

import uuid
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "c4d8e1f2a9b3"
down_revision: str | Sequence[str] | None = "b7e2d9a1c3f4"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

# (название, системная) — базовые категории старого UI
BASE_CATEGORIES = [
    ("Без категорії", True),
    ("Професійна косметика", False),
    ("Товари для продажу", False),
    ("Витратні матеріали", False),
    ("Обладнання", False),
]


def upgrade() -> None:
    categories = op.create_table(
        "inventory_categories",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=128), nullable=False),
        sa.Column("is_system", sa.Boolean(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_inventory_categories")),
        sa.UniqueConstraint("name", name=op.f("uq_inventory_categories_name")),
    )
    op.create_table(
        "products",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("sku", sa.String(length=64), nullable=False),
        sa.Column("category_id", sa.Uuid(), nullable=False),
        sa.Column(
            "unit",
            sa.Enum("pcs", "ml", "l", "g", "kg", name="productunit", native_enum=False, length=8),
            nullable=False,
        ),
        sa.Column("package_volume", sa.Numeric(precision=12, scale=3), nullable=True),
        sa.Column("quantity", sa.Numeric(precision=14, scale=3), nullable=False),
        sa.Column("min_quantity", sa.Numeric(precision=14, scale=3), nullable=False),
        sa.Column("cost_price", sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column("sale_price", sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column("description", sa.String(length=2000), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["category_id"],
            ["inventory_categories.id"],
            name=op.f("fk_products_category_id_inventory_categories"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_products")),
        sa.UniqueConstraint("sku", name=op.f("uq_products_sku")),
    )
    op.create_index(op.f("ix_products_category_id"), "products", ["category_id"], unique=False)
    op.create_table(
        "stock_movements",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("product_id", sa.Uuid(), nullable=False),
        sa.Column(
            "type",
            sa.Enum(
                "receipt",
                "write_off",
                "adjustment",
                name="movementtype",
                native_enum=False,
                length=16,
            ),
            nullable=False,
        ),
        sa.Column("delta", sa.Numeric(precision=14, scale=3), nullable=False),
        sa.Column("quantity_after", sa.Numeric(precision=14, scale=3), nullable=False),
        sa.Column("reason", sa.String(length=500), nullable=True),
        sa.Column("record_id", sa.Uuid(), nullable=True),
        sa.Column("author_id", sa.Uuid(), nullable=True),
        sa.Column("author_name", sa.String(length=255), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["product_id"], ["products.id"], name=op.f("fk_stock_movements_product_id_products")
        ),
        sa.ForeignKeyConstraint(
            ["record_id"], ["records.id"], name=op.f("fk_stock_movements_record_id_records")
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_stock_movements")),
    )
    op.create_index(
        op.f("ix_stock_movements_product_id"), "stock_movements", ["product_id"], unique=False
    )
    op.create_index(
        op.f("ix_stock_movements_record_id"), "stock_movements", ["record_id"], unique=False
    )

    op.bulk_insert(
        categories,
        [
            {"id": uuid.uuid4(), "name": name, "is_system": system}
            for name, system in BASE_CATEGORIES
        ],
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_stock_movements_record_id"), table_name="stock_movements")
    op.drop_index(op.f("ix_stock_movements_product_id"), table_name="stock_movements")
    op.drop_table("stock_movements")
    op.drop_index(op.f("ix_products_category_id"), table_name="products")
    op.drop_table("products")
    op.drop_table("inventory_categories")
