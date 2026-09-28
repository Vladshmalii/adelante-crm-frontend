"""records.reminder_enabled, stock_movements.cancels_movement_id

Revision ID: f1a3c5e7b9d2
Revises: e2f4a6b8c0d1
Create Date: 2026-09-29 10:00:00

Expand-only: колонка с server_default и nullable-ссылка.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "f1a3c5e7b9d2"
down_revision: str | Sequence[str] | None = "e2f4a6b8c0d1"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "records",
        sa.Column("reminder_enabled", sa.Boolean(), server_default="true", nullable=False),
    )
    op.add_column("stock_movements", sa.Column("cancels_movement_id", sa.Uuid(), nullable=True))
    op.create_foreign_key(
        op.f("fk_stock_movements_cancels_movement_id_stock_movements"),
        "stock_movements",
        "stock_movements",
        ["cancels_movement_id"],
        ["id"],
    )
    op.create_unique_constraint(
        op.f("uq_stock_movements_cancels_movement_id"), "stock_movements", ["cancels_movement_id"]
    )


def downgrade() -> None:
    op.drop_constraint(
        op.f("uq_stock_movements_cancels_movement_id"), "stock_movements", type_="unique"
    )
    op.drop_constraint(
        op.f("fk_stock_movements_cancels_movement_id_stock_movements"),
        "stock_movements",
        type_="foreignkey",
    )
    op.drop_column("stock_movements", "cancels_movement_id")
    op.drop_column("records", "reminder_enabled")
