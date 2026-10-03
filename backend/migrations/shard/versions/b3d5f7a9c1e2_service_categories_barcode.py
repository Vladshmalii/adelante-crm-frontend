"""service_categories вместо services.category; products.barcode

Revision ID: b3d5f7a9c1e2
Revises: a8c2e4f6b1d3
Create Date: 2026-10-03 12:00:00

Каждое уникальное значение services.category становится категорией
(известные ключи переводятся, остальные — как есть, без учёта регистра
сливаются); системная «Інше» создаётся всегда. Колонка services.category
удаляется.

ВАЖНО при выкатке: код до этой ревизии читает services.category — api/worker
со старым кодом нужно остановить до `salonctl migrate shards`.
"""

import uuid
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "b3d5f7a9c1e2"
down_revision: str | Sequence[str] | None = "a8c2e4f6b1d3"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

SYSTEM_NAME = "Інше"
NAMES = {
    "hair": "Волосся",
    "nails": "Нігті",
    "face": "Обличчя",
    "body": "Тіло",
    "makeup": "Макіяж",
    "other": SYSTEM_NAME,
}


def upgrade() -> None:
    categories = op.create_table(
        "service_categories",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=128), nullable=False),
        sa.Column("is_system", sa.Boolean(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_service_categories")),
    )
    op.create_index(
        "uq_service_categories_lower_name",
        "service_categories",
        [sa.text("lower(name)")],
        unique=True,
    )

    conn = op.get_bind()
    raw = [row[0] for row in conn.execute(sa.text("SELECT DISTINCT category FROM services"))]
    by_lower: dict[str, dict[str, object]] = {
        SYSTEM_NAME.lower(): {"id": uuid.uuid4(), "name": SYSTEM_NAME, "is_system": True}
    }
    mapping: dict[str, uuid.UUID] = {}
    for value in raw:
        name = NAMES.get((value or "").strip().lower(), (value or "").strip()) or SYSTEM_NAME
        row = by_lower.setdefault(
            name.lower(), {"id": uuid.uuid4(), "name": name, "is_system": False}
        )
        mapping[value] = row["id"]  # type: ignore[assignment]
    op.bulk_insert(categories, list(by_lower.values()))

    op.add_column("services", sa.Column("category_id", sa.Uuid(), nullable=True))
    for value, category_id in mapping.items():
        conn.execute(
            sa.text("UPDATE services SET category_id = :id WHERE category = :value"),
            {"id": category_id, "value": value},
        )
    op.alter_column("services", "category_id", existing_type=sa.Uuid(), nullable=False)
    op.create_foreign_key(
        op.f("fk_services_category_id_service_categories"),
        "services",
        "service_categories",
        ["category_id"],
        ["id"],
    )
    op.create_index(op.f("ix_services_category_id"), "services", ["category_id"], unique=False)
    op.drop_column("services", "category")

    op.add_column("products", sa.Column("barcode", sa.String(length=64), nullable=True))
    op.create_index(
        "uq_products_lower_barcode", "products", [sa.text("lower(barcode)")], unique=True
    )


def downgrade() -> None:
    op.drop_index("uq_products_lower_barcode", table_name="products")
    op.drop_column("products", "barcode")

    op.add_column(
        "services",
        sa.Column("category", sa.String(length=32), server_default="other", nullable=False),
    )
    reverse = {v: k for k, v in NAMES.items()}
    conn = op.get_bind()
    for category_id, name in conn.execute(sa.text("SELECT id, name FROM service_categories")):
        conn.execute(
            sa.text("UPDATE services SET category = :value WHERE category_id = :id"),
            {"value": reverse.get(name, name[:32]), "id": category_id},
        )
    op.drop_index(op.f("ix_services_category_id"), table_name="services")
    op.drop_constraint(
        op.f("fk_services_category_id_service_categories"), "services", type_="foreignkey"
    )
    op.drop_column("services", "category_id")
    op.drop_index("uq_service_categories_lower_name", table_name="service_categories")
    op.drop_table("service_categories")
