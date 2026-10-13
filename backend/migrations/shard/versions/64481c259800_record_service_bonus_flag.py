"""record service bonus flag

Revision ID: 64481c259800
Revises: 61bac84bc329
Create Date: 2026-10-13 20:44:29

ВАЖНО: миграция прогоняется на все шард-БД неатомарно — она обязана быть
backward-compatible (expand → migrate → contract).
Expand-only: record_services.is_bonus — строка списана как бонусная услуга (server_default false).
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "64481c259800"
down_revision: str | Sequence[str] | None = "61bac84bc329"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "record_services",
        sa.Column("is_bonus", sa.Boolean(), server_default="false", nullable=False),
    )


def downgrade() -> None:
    op.drop_column("record_services", "is_bonus")
