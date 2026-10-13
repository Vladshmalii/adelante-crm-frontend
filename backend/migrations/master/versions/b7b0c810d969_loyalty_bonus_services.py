"""loyalty bonus services

Revision ID: b7b0c810d969
Revises: 8b543f80665e
Create Date: 2026-10-13 20:44:28

Expand-only: бонусные услуги — правила с услугами по салонам, прогресс карты и журнал
операций loyalty_bonus_operations (loyalty-accounts.md, разделы 4.1 и 15, п. 6).
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "b7b0c810d969"
down_revision: str | Sequence[str] | None = "8b543f80665e"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "loyalty_bonus_rules",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("card_type_id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("every_n", sa.Integer(), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["card_type_id"],
            ["loyalty_card_types.id"],
            name=op.f("fk_loyalty_bonus_rules_card_type_id_loyalty_card_types"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_loyalty_bonus_rules")),
    )
    op.create_index(
        op.f("ix_loyalty_bonus_rules_card_type_id"),
        "loyalty_bonus_rules",
        ["card_type_id"],
        unique=False,
    )
    op.create_table(
        "loyalty_bonus_operations",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column(
            "kind",
            sa.Enum("use", "progress", name="bonusoperationkind", native_enum=False, length=16),
            nullable=False,
        ),
        sa.Column("card_id", sa.Uuid(), nullable=False),
        sa.Column("rule_id", sa.Uuid(), nullable=False),
        sa.Column("salon_id", sa.Uuid(), nullable=False),
        sa.Column("receipt_id", sa.Uuid(), nullable=False),
        sa.Column("record_id", sa.Uuid(), nullable=True),
        sa.Column("record_service_id", sa.Uuid(), nullable=True),
        sa.Column("accrued", sa.Boolean(), server_default="false", nullable=False),
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
            name=op.f("fk_loyalty_bonus_operations_card_id_loyalty_cards"),
        ),
        sa.ForeignKeyConstraint(
            ["rule_id"],
            ["loyalty_bonus_rules.id"],
            name=op.f("fk_loyalty_bonus_operations_rule_id_loyalty_bonus_rules"),
        ),
        sa.ForeignKeyConstraint(
            ["salon_id"], ["salons.id"], name=op.f("fk_loyalty_bonus_operations_salon_id_salons")
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_loyalty_bonus_operations")),
    )
    op.create_index(
        "ix_loyalty_bonus_operations_card",
        "loyalty_bonus_operations",
        ["card_id", "created_at"],
        unique=False,
    )
    op.create_index(
        "uq_loyalty_bonus_operations_progress",
        "loyalty_bonus_operations",
        ["salon_id", "receipt_id", "rule_id"],
        unique=True,
        postgresql_where=sa.text("kind = 'progress'"),
    )
    op.create_index(
        "uq_loyalty_bonus_operations_use",
        "loyalty_bonus_operations",
        ["salon_id", "receipt_id", "record_service_id"],
        unique=True,
        postgresql_where=sa.text("kind = 'use'"),
    )
    op.create_table(
        "loyalty_bonus_progress",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("card_id", sa.Uuid(), nullable=False),
        sa.Column("rule_id", sa.Uuid(), nullable=False),
        sa.Column("progress", sa.Integer(), server_default="0", nullable=False),
        sa.Column("available", sa.Integer(), server_default="0", nullable=False),
        sa.Column("accrued_total", sa.Integer(), server_default="0", nullable=False),
        sa.Column("used_total", sa.Integer(), server_default="0", nullable=False),
        sa.ForeignKeyConstraint(
            ["card_id"],
            ["loyalty_cards.id"],
            name=op.f("fk_loyalty_bonus_progress_card_id_loyalty_cards"),
        ),
        sa.ForeignKeyConstraint(
            ["rule_id"],
            ["loyalty_bonus_rules.id"],
            name=op.f("fk_loyalty_bonus_progress_rule_id_loyalty_bonus_rules"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_loyalty_bonus_progress")),
        sa.UniqueConstraint("card_id", "rule_id", name=op.f("uq_loyalty_bonus_progress_card_id")),
    )
    op.create_table(
        "loyalty_bonus_rule_services",
        sa.Column("rule_id", sa.Uuid(), nullable=False),
        sa.Column("salon_id", sa.Uuid(), nullable=False),
        sa.Column("service_id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(
            ["rule_id"],
            ["loyalty_bonus_rules.id"],
            name=op.f("fk_loyalty_bonus_rule_services_rule_id_loyalty_bonus_rules"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["salon_id"], ["salons.id"], name=op.f("fk_loyalty_bonus_rule_services_salon_id_salons")
        ),
        sa.PrimaryKeyConstraint(
            "rule_id", "salon_id", "service_id", name=op.f("pk_loyalty_bonus_rule_services")
        ),
    )


def downgrade() -> None:
    op.drop_table("loyalty_bonus_rule_services")
    op.drop_table("loyalty_bonus_progress")
    op.drop_index(
        "uq_loyalty_bonus_operations_use",
        table_name="loyalty_bonus_operations",
        postgresql_where=sa.text("kind = 'use'"),
    )
    op.drop_index(
        "uq_loyalty_bonus_operations_progress",
        table_name="loyalty_bonus_operations",
        postgresql_where=sa.text("kind = 'progress'"),
    )
    op.drop_index("ix_loyalty_bonus_operations_card", table_name="loyalty_bonus_operations")
    op.drop_table("loyalty_bonus_operations")
    op.drop_index(op.f("ix_loyalty_bonus_rules_card_type_id"), table_name="loyalty_bonus_rules")
    op.drop_table("loyalty_bonus_rules")
