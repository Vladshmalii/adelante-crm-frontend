"""subscriptions

Revision ID: 6b8d0f2a4c6e
Revises: 4a7c9e1b3d5f
Create Date: 2026-11-11 13:00:00

Expand-only (subscriptions.md, раздел 3.1): типы абонементов с услугами по салонам,
проданные абонементы со снимком типа и услуг, корзины остатков и неизменяемый журнал
операций. Сразу вся схема Master — и под продажу, и под списание, заморозку и фоновые
задачи (часть 2 схему Master не меняет). Только новые таблицы — код до выкатки их не знает.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "6b8d0f2a4c6e"
down_revision: str | Sequence[str] | None = "4a7c9e1b3d5f"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _enum(name: str, *values: str) -> sa.Enum:
    return sa.Enum(*values, name=name, native_enum=False, length=16)


def _unit_kind() -> sa.Enum:
    return _enum("subscriptionunitkind", "visits", "minutes")


def _balance_mode() -> sa.Enum:
    return _enum("subscriptionbalancemode", "shared", "separate")


def _duration_unit() -> sa.Enum:
    return _enum("subscriptiondurationunit", "day", "month")


def _activation_mode() -> sa.Enum:
    return _enum("subscriptionactivationmode", "on_sale", "first_visit")


def _timestamps() -> list[sa.Column]:
    return [
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
    ]


def upgrade() -> None:
    op.create_table(
        "subscription_types",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("price", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("unit_kind", _unit_kind(), nullable=False),
        sa.Column("balance_mode", _balance_mode(), nullable=False),
        sa.Column("total_units", sa.Integer(), nullable=True),
        sa.Column("duration_value", sa.Integer(), server_default="0", nullable=False),
        sa.Column("duration_unit", _duration_unit(), nullable=False),
        sa.Column("activation_mode", _activation_mode(), nullable=False),
        sa.Column("auto_activate_days", sa.Integer(), nullable=True),
        sa.Column("freeze_allowed", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("freeze_max_days", sa.Integer(), server_default="0", nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("sort_order", sa.Integer(), server_default="0", nullable=False),
        *_timestamps(),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_subscription_types")),
    )
    op.create_table(
        "subscription_type_services",
        sa.Column("type_id", sa.Uuid(), nullable=False),
        sa.Column("salon_id", sa.Uuid(), nullable=False),
        sa.Column("service_id", sa.Uuid(), nullable=False),
        sa.Column("units", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(
            ["salon_id"], ["salons.id"], name=op.f("fk_subscription_type_services_salon_id_salons")
        ),
        sa.ForeignKeyConstraint(
            ["type_id"],
            ["subscription_types.id"],
            name=op.f("fk_subscription_type_services_type_id_subscription_types"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint(
            "type_id", "salon_id", "service_id", name=op.f("pk_subscription_type_services")
        ),
    )
    op.create_table(
        "subscriptions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("client_id", sa.Uuid(), nullable=False),
        sa.Column("type_id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("unit_kind", _unit_kind(), nullable=False),
        sa.Column("balance_mode", _balance_mode(), nullable=False),
        sa.Column("total_units", sa.Integer(), nullable=True),
        sa.Column("duration_value", sa.Integer(), nullable=False),
        sa.Column("duration_unit", _duration_unit(), nullable=False),
        sa.Column("activation_mode", _activation_mode(), nullable=False),
        sa.Column("auto_activate_days", sa.Integer(), nullable=True),
        sa.Column("freeze_allowed", sa.Boolean(), nullable=False),
        sa.Column("freeze_max_days", sa.Integer(), nullable=False),
        sa.Column("paid_amount", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("unit_value", sa.Numeric(precision=12, scale=4), nullable=False),
        sa.Column("sold_salon_id", sa.Uuid(), nullable=False),
        sa.Column("sold_receipt_id", sa.Uuid(), nullable=False),
        sa.Column("sold_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("issue_key", sa.String(length=200), nullable=False),
        sa.Column(
            "status",
            _enum(
                "subscriptionstatus",
                "pending",
                "active",
                "frozen",
                "spent",
                "expired",
                "cancelled",
            ),
            nullable=False,
        ),
        sa.Column("activated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("auto_activate_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("frozen_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("freeze_until", sa.DateTime(timezone=True), nullable=True),
        sa.Column("unfrozen_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("frozen_days", sa.Integer(), server_default="0", nullable=False),
        sa.Column("freeze_used", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("cancelled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("cancelled_by", sa.Uuid(), nullable=True),
        sa.Column("cancelled_by_name", sa.String(length=255), nullable=True),
        sa.Column("cancel_reason", sa.String(length=2000), nullable=True),
        *_timestamps(),
        sa.ForeignKeyConstraint(
            ["client_id"], ["clients.id"], name=op.f("fk_subscriptions_client_id_clients")
        ),
        sa.ForeignKeyConstraint(
            ["sold_salon_id"], ["salons.id"], name=op.f("fk_subscriptions_sold_salon_id_salons")
        ),
        sa.ForeignKeyConstraint(
            ["type_id"],
            ["subscription_types.id"],
            name=op.f("fk_subscriptions_type_id_subscription_types"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_subscriptions")),
        sa.UniqueConstraint("issue_key", name=op.f("uq_subscriptions_issue_key")),
    )
    op.create_index("ix_subscriptions_client_id", "subscriptions", ["client_id"])
    op.create_index("ix_subscriptions_type_id", "subscriptions", ["type_id"])
    op.create_index("ix_subscriptions_status", "subscriptions", ["status"])
    op.create_index(
        "ix_subscriptions_sold_receipt", "subscriptions", ["sold_salon_id", "sold_receipt_id"]
    )
    op.create_table(
        "subscription_services",
        sa.Column("subscription_id", sa.Uuid(), nullable=False),
        sa.Column("salon_id", sa.Uuid(), nullable=False),
        sa.Column("service_id", sa.Uuid(), nullable=False),
        sa.Column("units", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(
            ["salon_id"], ["salons.id"], name=op.f("fk_subscription_services_salon_id_salons")
        ),
        sa.ForeignKeyConstraint(
            ["subscription_id"],
            ["subscriptions.id"],
            name=op.f("fk_subscription_services_subscription_id_subscriptions"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint(
            "subscription_id", "salon_id", "service_id", name=op.f("pk_subscription_services")
        ),
    )
    op.create_table(
        "subscription_balances",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("subscription_id", sa.Uuid(), nullable=False),
        sa.Column("salon_id", sa.Uuid(), nullable=True),
        sa.Column("service_id", sa.Uuid(), nullable=True),
        sa.Column("units", sa.Integer(), nullable=False),
        sa.Column("balance", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "balance >= 0", name=op.f("ck_subscription_balances_balance_not_negative")
        ),
        sa.CheckConstraint(
            "(salon_id IS NULL) = (service_id IS NULL)",
            name=op.f("ck_subscription_balances_service_pair"),
        ),
        sa.ForeignKeyConstraint(
            ["salon_id"], ["salons.id"], name=op.f("fk_subscription_balances_salon_id_salons")
        ),
        sa.ForeignKeyConstraint(
            ["subscription_id"],
            ["subscriptions.id"],
            name=op.f("fk_subscription_balances_subscription_id_subscriptions"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_subscription_balances")),
    )
    op.create_index(
        "uq_subscription_balances_shared",
        "subscription_balances",
        ["subscription_id"],
        unique=True,
        postgresql_where=sa.text("service_id IS NULL"),
    )
    op.create_index(
        "uq_subscription_balances_service",
        "subscription_balances",
        ["subscription_id", "salon_id", "service_id"],
        unique=True,
        postgresql_where=sa.text("service_id IS NOT NULL"),
    )
    op.create_table(
        "subscription_operations",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("subscription_id", sa.Uuid(), nullable=False),
        sa.Column("balance_id", sa.Uuid(), nullable=False),
        sa.Column(
            "type",
            _enum("subscriptionoperationtype", "issue", "use", "reversal", "expire", "cancel"),
            nullable=False,
        ),
        sa.Column("delta", sa.Integer(), nullable=False),
        sa.Column("balance_after", sa.Integer(), nullable=False),
        sa.Column("salon_id", sa.Uuid(), nullable=True),
        sa.Column("receipt_id", sa.Uuid(), nullable=True),
        sa.Column("record_id", sa.Uuid(), nullable=True),
        sa.Column("record_service_id", sa.Uuid(), nullable=True),
        sa.Column("author_id", sa.Uuid(), nullable=True),
        sa.Column("author_name", sa.String(length=255), nullable=True),
        sa.Column("comment", sa.String(length=2000), nullable=True),
        sa.Column("reverses_id", sa.Uuid(), nullable=True),
        sa.Column("idempotency_key", sa.String(length=200), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["balance_id"],
            ["subscription_balances.id"],
            name=op.f("fk_subscription_operations_balance_id_subscription_balances"),
        ),
        sa.ForeignKeyConstraint(
            ["reverses_id"],
            ["subscription_operations.id"],
            name=op.f("fk_subscription_operations_reverses_id_subscription_operations"),
        ),
        sa.ForeignKeyConstraint(
            ["salon_id"], ["salons.id"], name=op.f("fk_subscription_operations_salon_id_salons")
        ),
        sa.ForeignKeyConstraint(
            ["subscription_id"],
            ["subscriptions.id"],
            name=op.f("fk_subscription_operations_subscription_id_subscriptions"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_subscription_operations")),
        sa.UniqueConstraint(
            "idempotency_key", name=op.f("uq_subscription_operations_idempotency_key")
        ),
    )
    op.create_index(
        "ix_subscription_operations_subscription",
        "subscription_operations",
        ["subscription_id", "created_at"],
    )
    op.create_index(
        "ix_subscription_operations_receipt", "subscription_operations", ["salon_id", "receipt_id"]
    )


def downgrade() -> None:
    op.drop_index("ix_subscription_operations_receipt", table_name="subscription_operations")
    op.drop_index("ix_subscription_operations_subscription", table_name="subscription_operations")
    op.drop_table("subscription_operations")
    op.drop_index("uq_subscription_balances_service", table_name="subscription_balances")
    op.drop_index("uq_subscription_balances_shared", table_name="subscription_balances")
    op.drop_table("subscription_balances")
    op.drop_table("subscription_services")
    op.drop_index("ix_subscriptions_sold_receipt", table_name="subscriptions")
    op.drop_index("ix_subscriptions_status", table_name="subscriptions")
    op.drop_index("ix_subscriptions_type_id", table_name="subscriptions")
    op.drop_index("ix_subscriptions_client_id", table_name="subscriptions")
    op.drop_table("subscriptions")
    op.drop_table("subscription_type_services")
    op.drop_table("subscription_types")
