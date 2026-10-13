"""discount snapshots

Revision ID: 61bac84bc329
Revises: 9b46c1a2e672
Create Date: 2026-10-13 20:34:00

ВАЖНО: миграция прогоняется на все шард-БД неатомарно — она обязана быть
backward-compatible (expand → migrate → contract).
Expand-only: снапшот скидки и карты в записи и чеке (loyalty-accounts.md, раздел 4.2).
Колонки с server_default или nullable; receipts.subtotal = null у старых чеков (равно amount).
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "61bac84bc329"
down_revision: str | Sequence[str] | None = "9b46c1a2e672"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "receipts", sa.Column("subtotal", sa.Numeric(precision=12, scale=2), nullable=True)
    )
    op.add_column(
        "receipts",
        sa.Column(
            "discount_amount", sa.Numeric(precision=12, scale=2), server_default="0", nullable=False
        ),
    )
    op.add_column(
        "receipts",
        sa.Column(
            "discount_source",
            sa.Enum(
                "none",
                "client",
                "card_percent",
                "card_fixed",
                name="discountsource",
                native_enum=False,
                length=16,
            ),
            server_default="none",
            nullable=False,
        ),
    )
    op.add_column(
        "records",
        sa.Column(
            "discount_amount", sa.Numeric(precision=12, scale=2), server_default="0", nullable=False
        ),
    )
    op.add_column(
        "records",
        sa.Column(
            "discount_source",
            sa.Enum(
                "none",
                "client",
                "card_percent",
                "card_fixed",
                name="discountsource",
                native_enum=False,
                length=16,
            ),
            server_default="none",
            nullable=False,
        ),
    )
    op.add_column("records", sa.Column("loyalty_card_id", sa.Uuid(), nullable=True))


def downgrade() -> None:
    op.drop_column("records", "loyalty_card_id")
    op.drop_column("records", "discount_source")
    op.drop_column("records", "discount_amount")
    op.drop_column("receipts", "discount_source")
    op.drop_column("receipts", "discount_amount")
    op.drop_column("receipts", "subtotal")
