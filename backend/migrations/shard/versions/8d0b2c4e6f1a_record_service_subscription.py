"""record_services: списание абонементом

Revision ID: 8d0b2c4e6f1a
Revises: 7c9e1a3b5d7f
Create Date: 2026-11-11 18:00:00

ВАЖНО: миграция прогоняется на все шард-БД неатомарно — она обязана быть
backward-compatible (expand → migrate → contract).

Expand-only (subscriptions.md, раздел 3.2): три nullable-колонки, старый код их не читает.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "8d0b2c4e6f1a"
down_revision: str | Sequence[str] | None = "7c9e1a3b5d7f"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("record_services", sa.Column("subscription_id", sa.Uuid(), nullable=True))
    op.add_column("record_services", sa.Column("subscription_units", sa.Integer(), nullable=True))
    op.add_column(
        "record_services",
        sa.Column("subscription_unit_value", sa.Numeric(precision=12, scale=2), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("record_services", "subscription_unit_value")
    op.drop_column("record_services", "subscription_units")
    op.drop_column("record_services", "subscription_id")
