"""clients.reminder_channel — канал напоминаний о визите

Revision ID: f2c4e6a8b0d1
Revises: cd8a6219ad91
Create Date: 2026-11-03 12:00:00

Expand-only (backend/docs/sms-reminders.md, раздел 3): колонка с server_default 'auto' —
старый код её не знает, существующие клиенты получают «Автоматично».
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "f2c4e6a8b0d1"
down_revision: str | Sequence[str] | None = "cd8a6219ad91"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "clients",
        sa.Column(
            "reminder_channel",
            sa.Enum(
                "auto",
                "telegram",
                "sms",
                "none",
                name="reminderchannel",
                native_enum=False,
                length=16,
            ),
            server_default="auto",
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_column("clients", "reminder_channel")
