"""certificate products, categories, valid_until

Revision ID: 4a7c9e1b3d5f
Revises: f2c4e6a8b0d1
Create Date: 2026-11-11 12:00:00

Expand-only (certificates.md, раздел 11): области «на товари» и «на послуги і товари» —
колонка scope расширяется до VARCHAR(24) (services_products — 17 символов; CHECK у
str_enum нет); товары шаблона и снимок товаров сертификата — пары (салон, товар);
категории шаблонов; срок «до даты» certificate_templates.valid_until. Новые колонки
nullable — код до выкатки их не знает и не нарушает.

downgrade падает на сужении scope, если уже есть шаблоны или сертификаты services_products.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "4a7c9e1b3d5f"
down_revision: str | Sequence[str] | None = "f2c4e6a8b0d1"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _scope(length: int) -> sa.Enum:
    return sa.Enum(
        "any",
        "services",
        "products",
        "services_products",
        name="certificatescope",
        native_enum=False,
        length=length,
    )


def upgrade() -> None:
    for table in ("certificate_templates", "certificates"):
        op.alter_column(
            table,
            "scope",
            existing_type=sa.String(length=16),
            type_=_scope(24),
            existing_nullable=False,
        )

    op.create_table(
        "certificate_categories",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("sort_order", sa.Integer(), server_default="0", nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_certificate_categories")),
    )
    op.create_index(
        "uq_certificate_categories_lower_name",
        "certificate_categories",
        [sa.text("lower(name)")],
        unique=True,
    )

    op.add_column("certificate_templates", sa.Column("valid_until", sa.Date(), nullable=True))
    op.add_column("certificate_templates", sa.Column("category_id", sa.Uuid(), nullable=True))
    op.create_foreign_key(
        op.f("fk_certificate_templates_category_id_certificate_categories"),
        "certificate_templates",
        "certificate_categories",
        ["category_id"],
        ["id"],
        ondelete="SET NULL",
    )

    op.create_table(
        "certificate_template_products",
        sa.Column("template_id", sa.Uuid(), nullable=False),
        sa.Column("salon_id", sa.Uuid(), nullable=False),
        sa.Column("product_id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(
            ["salon_id"],
            ["salons.id"],
            name=op.f("fk_certificate_template_products_salon_id_salons"),
        ),
        sa.ForeignKeyConstraint(
            ["template_id"],
            ["certificate_templates.id"],
            name=op.f("fk_certificate_template_products_template_id_certificate_templates"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint(
            "template_id", "salon_id", "product_id", name=op.f("pk_certificate_template_products")
        ),
    )
    op.create_table(
        "certificate_products",
        sa.Column("certificate_id", sa.Uuid(), nullable=False),
        sa.Column("salon_id", sa.Uuid(), nullable=False),
        sa.Column("product_id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(
            ["certificate_id"],
            ["certificates.id"],
            name=op.f("fk_certificate_products_certificate_id_certificates"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["salon_id"], ["salons.id"], name=op.f("fk_certificate_products_salon_id_salons")
        ),
        sa.PrimaryKeyConstraint(
            "certificate_id", "salon_id", "product_id", name=op.f("pk_certificate_products")
        ),
    )


def downgrade() -> None:
    op.drop_table("certificate_products")
    op.drop_table("certificate_template_products")
    op.drop_constraint(
        op.f("fk_certificate_templates_category_id_certificate_categories"),
        "certificate_templates",
        type_="foreignkey",
    )
    op.drop_column("certificate_templates", "category_id")
    op.drop_column("certificate_templates", "valid_until")
    op.drop_index("uq_certificate_categories_lower_name", table_name="certificate_categories")
    op.drop_table("certificate_categories")
    for table in ("certificate_templates", "certificates"):
        op.alter_column(
            table,
            "scope",
            existing_type=_scope(24),
            type_=sa.String(length=16),
            existing_nullable=False,
        )
