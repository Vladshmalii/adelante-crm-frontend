"""reminder_deliveries — журнал отправок напоминаний

Revision ID: e5b7c9d1f3a2
Revises: e5b7c9d1f3a5
Create Date: 2026-11-03 12:00:00

ВАЖНО: миграция прогоняется на все шард-БД неатомарно — она обязана быть
backward-compatible (expand → migrate → contract).

Expand-only (backend/docs/sms-reminders.md, раздел 7.2): новая таблица, старый код
её не читает. Настройка reminder_lead_minutes живёт в settings (ключ notifications)
и миграции не требует: нет ключа — 30 минут.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "e5b7c9d1f3a2"
down_revision: str | Sequence[str] | None = "e5b7c9d1f3a5"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

CHANNELS = ("telegram", "sms")
STATUSES = ("queued", "sent", "delivered", "undelivered", "failed", "skipped")


def upgrade() -> None:
    op.create_table(
        "reminder_deliveries",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("record_id", sa.Uuid(), nullable=False),
        sa.Column("client_id", sa.Uuid(), nullable=False),
        sa.Column("event_id", sa.Uuid(), nullable=False),
        sa.Column(
            "channel",
            sa.Enum(*CHANNELS, name="deliverychannel", native_enum=False, length=16),
            nullable=False,
        ),
        sa.Column("is_fallback", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("phone", sa.String(length=32), nullable=True),
        sa.Column("text", sa.String(length=1024), nullable=True),
        sa.Column(
            "status",
            sa.Enum(*STATUSES, name="reminderdeliverystatus", native_enum=False, length=16),
            nullable=False,
        ),
        sa.Column("provider", sa.String(length=32), nullable=True),
        sa.Column("provider_message_id", sa.String(length=64), nullable=True),
        sa.Column("segments", sa.Integer(), nullable=True),
        sa.Column("cost", sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column("error", sa.String(length=500), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_reminder_deliveries")),
        sa.UniqueConstraint("event_id", "channel", name="uq_reminder_deliveries_event_channel"),
    )
    op.create_index(
        "ix_reminder_deliveries_client", "reminder_deliveries", ["client_id", "created_at"]
    )
    op.create_index("ix_reminder_deliveries_created", "reminder_deliveries", ["created_at"])
    op.create_index(
        "ix_reminder_deliveries_status", "reminder_deliveries", ["channel", "status", "created_at"]
    )
    op.create_index(
        op.f("ix_reminder_deliveries_provider_message_id"),
        "reminder_deliveries",
        ["provider_message_id"],
    )


def downgrade() -> None:
    op.drop_table("reminder_deliveries")
