"""loyalty cards

Revision ID: 8b543f80665e
Revises: 91600a4dcd62
Create Date: 2026-10-13 20:21:15

Expand-only: типы карт лояльности, уровни, салоны типа, карты, факты визитов;
client_accounts.loyalty_card_id — кешбек-рахунок карты (loyalty-accounts.md, раздел 4.1).
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "8b543f80665e"
down_revision: str | Sequence[str] | None = "91600a4dcd62"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "loyalty_card_types",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("cashback_percent", sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column("cashback_on_services", sa.Boolean(), nullable=False),
        sa.Column("cashback_on_products", sa.Boolean(), nullable=False),
        sa.Column("cashback_max_payment_percent", sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column("cashback_ttl_days", sa.Integer(), nullable=True),
        sa.Column(
            "level_basis",
            sa.Enum("sold_amount", "visits", name="levelbasis", native_enum=False, length=16),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_loyalty_card_types")),
    )
    op.create_table(
        "loyalty_card_type_salons",
        sa.Column("card_type_id", sa.Uuid(), nullable=False),
        sa.Column("salon_id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(
            ["card_type_id"],
            ["loyalty_card_types.id"],
            name=op.f("fk_loyalty_card_type_salons_card_type_id_loyalty_card_types"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["salon_id"], ["salons.id"], name=op.f("fk_loyalty_card_type_salons_salon_id_salons")
        ),
        sa.PrimaryKeyConstraint(
            "card_type_id", "salon_id", name=op.f("pk_loyalty_card_type_salons")
        ),
    )
    op.create_table(
        "loyalty_cards",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("number", sa.String(length=16), nullable=False),
        sa.Column("client_id", sa.Uuid(), nullable=False),
        sa.Column("card_type_id", sa.Uuid(), nullable=False),
        sa.Column(
            "status",
            sa.Enum("active", "deleted", name="cardstatus", native_enum=False, length=16),
            nullable=False,
        ),
        sa.Column(
            "sold_total", sa.Numeric(precision=12, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "paid_total", sa.Numeric(precision=12, scale=2), server_default="0", nullable=False
        ),
        sa.Column("visits_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column(
            "issued_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False
        ),
        sa.Column("issued_by", sa.Uuid(), nullable=True),
        sa.Column("issued_by_name", sa.String(length=255), nullable=True),
        sa.Column("issued_salon_id", sa.Uuid(), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", sa.Uuid(), nullable=True),
        sa.Column("deleted_by_name", sa.String(length=255), nullable=True),
        sa.ForeignKeyConstraint(
            ["card_type_id"],
            ["loyalty_card_types.id"],
            name=op.f("fk_loyalty_cards_card_type_id_loyalty_card_types"),
        ),
        sa.ForeignKeyConstraint(
            ["client_id"], ["clients.id"], name=op.f("fk_loyalty_cards_client_id_clients")
        ),
        sa.ForeignKeyConstraint(
            ["issued_salon_id"], ["salons.id"], name=op.f("fk_loyalty_cards_issued_salon_id_salons")
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_loyalty_cards")),
        sa.UniqueConstraint("number", name=op.f("uq_loyalty_cards_number")),
    )
    op.create_index(
        op.f("ix_loyalty_cards_client_id"), "loyalty_cards", ["client_id"], unique=False
    )
    op.create_index(
        "uq_loyalty_cards_active_client",
        "loyalty_cards",
        ["client_id"],
        unique=True,
        postgresql_where=sa.text("status = 'active'"),
    )
    op.create_table(
        "loyalty_discount_levels",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("card_type_id", sa.Uuid(), nullable=False),
        sa.Column("threshold", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("discount_percent", sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column("discount_fixed", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("name", sa.String(length=64), nullable=True),
        sa.ForeignKeyConstraint(
            ["card_type_id"],
            ["loyalty_card_types.id"],
            name=op.f("fk_loyalty_discount_levels_card_type_id_loyalty_card_types"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_loyalty_discount_levels")),
        sa.UniqueConstraint(
            "card_type_id", "threshold", name=op.f("uq_loyalty_discount_levels_card_type_id")
        ),
    )
    op.create_table(
        "loyalty_card_visits",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("card_id", sa.Uuid(), nullable=False),
        sa.Column("salon_id", sa.Uuid(), nullable=False),
        sa.Column("receipt_id", sa.Uuid(), nullable=False),
        sa.Column("record_id", sa.Uuid(), nullable=True),
        sa.Column("is_visit", sa.Boolean(), nullable=False),
        sa.Column("sold_amount", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("discount_amount", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("paid_amount", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("cashback_base", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("happened_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("reversed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["card_id"],
            ["loyalty_cards.id"],
            name=op.f("fk_loyalty_card_visits_card_id_loyalty_cards"),
        ),
        sa.ForeignKeyConstraint(
            ["salon_id"], ["salons.id"], name=op.f("fk_loyalty_card_visits_salon_id_salons")
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_loyalty_card_visits")),
        sa.UniqueConstraint("salon_id", "receipt_id", name=op.f("uq_loyalty_card_visits_salon_id")),
    )
    op.create_index(
        "ix_loyalty_card_visits_card_happened",
        "loyalty_card_visits",
        ["card_id", "happened_at"],
        unique=False,
    )
    op.add_column("client_accounts", sa.Column("loyalty_card_id", sa.Uuid(), nullable=True))
    op.create_unique_constraint(
        op.f("uq_client_accounts_loyalty_card_id"), "client_accounts", ["loyalty_card_id"]
    )
    op.create_foreign_key(
        op.f("fk_client_accounts_loyalty_card_id_loyalty_cards"),
        "client_accounts",
        "loyalty_cards",
        ["loyalty_card_id"],
        ["id"],
    )


def downgrade() -> None:
    op.drop_constraint(
        op.f("fk_client_accounts_loyalty_card_id_loyalty_cards"),
        "client_accounts",
        type_="foreignkey",
    )
    op.drop_constraint(
        op.f("uq_client_accounts_loyalty_card_id"), "client_accounts", type_="unique"
    )
    op.drop_column("client_accounts", "loyalty_card_id")
    op.drop_index("ix_loyalty_card_visits_card_happened", table_name="loyalty_card_visits")
    op.drop_table("loyalty_card_visits")
    op.drop_table("loyalty_discount_levels")
    op.drop_index(
        "uq_loyalty_cards_active_client",
        table_name="loyalty_cards",
        postgresql_where=sa.text("status = 'active'"),
    )
    op.drop_index(op.f("ix_loyalty_cards_client_id"), table_name="loyalty_cards")
    op.drop_table("loyalty_cards")
    op.drop_table("loyalty_card_type_salons")
    op.drop_table("loyalty_card_types")
