"""staff_shifts вместо недельного графика и исключений

Revision ID: a8c2e4f6b1d3
Revises: f1a3c5e7b9d2
Create Date: 2026-09-29 18:00:00

График сотрудников — по дням (backend/docs/shifts.md). staff_schedules и
schedule_exceptions удаляются без переноса: на момент перехода БД салонов
пустые (решение заказчика), смены заполняет суперюзер. Статусы сотрудника
vacation / sick заменяются на active — отпуск и больничный теперь отметки
в графике.

ВАЖНО при выкатке: код до этой ревизии читает staff_schedules — api/worker
со старым кодом нужно остановить до `salonctl migrate shards`.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "a8c2e4f6b1d3"
down_revision: str | Sequence[str] | None = "f1a3c5e7b9d2"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "staff_shifts",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("staff_id", sa.Uuid(), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column(
            "kind",
            sa.Enum("shift", "vacation", "sick", name="shiftkind", native_enum=False, length=16),
            nullable=False,
        ),
        sa.Column("start_time", sa.Time(), nullable=True),
        sa.Column("end_time", sa.Time(), nullable=True),
        sa.Column("break_start", sa.Time(), nullable=True),
        sa.Column("break_end", sa.Time(), nullable=True),
        sa.Column("comment", sa.String(length=500), nullable=True),
        sa.Column("updated_by", sa.Uuid(), nullable=True),
        sa.Column("updated_by_name", sa.String(length=255), nullable=True),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_staff_shifts")),
        sa.UniqueConstraint("staff_id", "date", name="uq_staff_shifts_staff_date"),
    )
    op.create_index(op.f("ix_staff_shifts_staff_id"), "staff_shifts", ["staff_id"], unique=False)
    op.create_index(op.f("ix_staff_shifts_date"), "staff_shifts", ["date"], unique=False)

    op.drop_index(op.f("ix_schedule_exceptions_master_id"), table_name="schedule_exceptions")
    op.drop_table("schedule_exceptions")
    op.drop_table("staff_schedules")
    op.execute("UPDATE staff_profiles SET status = 'active' WHERE status IN ('vacation', 'sick')")


def downgrade() -> None:
    op.create_table(
        "staff_schedules",
        sa.Column("master_id", sa.Uuid(), nullable=False),
        sa.Column("weekday", sa.Integer(), nullable=False),
        sa.Column("is_work_day", sa.Boolean(), nullable=False),
        sa.Column("start_time", sa.Time(), nullable=True),
        sa.Column("end_time", sa.Time(), nullable=True),
        sa.Column("break_start", sa.Time(), nullable=True),
        sa.Column("break_end", sa.Time(), nullable=True),
        sa.PrimaryKeyConstraint("master_id", "weekday", name=op.f("pk_staff_schedules")),
    )
    op.create_table(
        "schedule_exceptions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("master_id", sa.Uuid(), nullable=False),
        sa.Column("date_from", sa.Date(), nullable=False),
        sa.Column("date_to", sa.Date(), nullable=False),
        sa.Column(
            "type",
            sa.Enum(
                "vacation",
                "sick",
                "day_off",
                "extra_shift",
                name="scheduleexceptiontype",
                native_enum=False,
                length=16,
            ),
            nullable=False,
        ),
        sa.Column("start_time", sa.Time(), nullable=True),
        sa.Column("end_time", sa.Time(), nullable=True),
        sa.Column("comment", sa.String(length=500), nullable=True),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_schedule_exceptions")),
    )
    op.create_index(
        op.f("ix_schedule_exceptions_master_id"), "schedule_exceptions", ["master_id"], unique=False
    )
    op.drop_index(op.f("ix_staff_shifts_date"), table_name="staff_shifts")
    op.drop_index(op.f("ix_staff_shifts_staff_id"), table_name="staff_shifts")
    op.drop_table("staff_shifts")
