"""superuser, profile contacts, active salon bindings

Revision ID: a3f1c2d4e5b6
Revises: dc70dbbcf28a
Create Date: 2026-09-28 12:00:00

Expand-only: новые колонки с server_default, старый код их не замечает.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "a3f1c2d4e5b6"
down_revision: str | Sequence[str] | None = "dc70dbbcf28a"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

CONTACT_TABLES = ("administrators", "masters")
BINDING_TABLES = ("administrator_salons", "master_salons")


def upgrade() -> None:
    op.add_column(
        "administrators",
        sa.Column("is_superuser", sa.Boolean(), server_default="false", nullable=False),
    )
    for table in CONTACT_TABLES:
        op.add_column(table, sa.Column("address", sa.String(length=500), nullable=True))
        op.add_column(
            table, sa.Column("emergency_contact_name", sa.String(length=255), nullable=True)
        )
        op.add_column(
            table, sa.Column("emergency_contact_phone", sa.String(length=32), nullable=True)
        )
    for table in BINDING_TABLES:
        op.add_column(
            table, sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False)
        )


def downgrade() -> None:
    for table in BINDING_TABLES:
        op.drop_column(table, "is_active")
    for table in CONTACT_TABLES:
        op.drop_column(table, "emergency_contact_phone")
        op.drop_column(table, "emergency_contact_name")
        op.drop_column(table, "address")
    op.drop_column("administrators", "is_superuser")
