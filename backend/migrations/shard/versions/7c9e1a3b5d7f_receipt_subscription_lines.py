"""receipt_subscription_lines — проданные абонементы чека

Revision ID: 7c9e1a3b5d7f
Revises: e5b7c9d1f3a2
Create Date: 2026-11-11 14:00:00

ВАЖНО: миграция прогоняется на все шард-БД неатомарно — она обязана быть
backward-compatible (expand → migrate → contract).

Expand-only (subscriptions.md, раздел 3.2): новая таблица, старый код её не читает.
Поля record_services под списание абонементом — в части 2.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "7c9e1a3b5d7f"
down_revision: str | Sequence[str] | None = "e5b7c9d1f3a2"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "receipt_subscription_lines",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("receipt_id", sa.Uuid(), nullable=False),
        sa.Column("type_id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("amount", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("paid_amount", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("subscription_id", sa.Uuid(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["receipt_id"],
            ["receipts.id"],
            name=op.f("fk_receipt_subscription_lines_receipt_id_receipts"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_receipt_subscription_lines")),
        sa.UniqueConstraint(
            "subscription_id", name=op.f("uq_receipt_subscription_lines_subscription_id")
        ),
    )
    op.create_index(
        op.f("ix_receipt_subscription_lines_receipt_id"),
        "receipt_subscription_lines",
        ["receipt_id"],
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_receipt_subscription_lines_receipt_id"), table_name="receipt_subscription_lines"
    )
    op.drop_table("receipt_subscription_lines")
