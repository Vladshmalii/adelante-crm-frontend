"""receipt loyalty card

Revision ID: 9b46c1a2e672
Revises: 92d794cd9582
Create Date: 2026-10-13 20:21:17

ВАЖНО: миграция прогоняется на все шард-БД неатомарно — она обязана быть
backward-compatible (expand → migrate → contract).
Expand-only: receipts.loyalty_card_id — снапшот карты лояльности, действовавшей при оплате.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "9b46c1a2e672"
down_revision: str | Sequence[str] | None = "92d794cd9582"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("receipts", sa.Column("loyalty_card_id", sa.Uuid(), nullable=True))


def downgrade() -> None:
    op.drop_column("receipts", "loyalty_card_id")
