"""record services, optional master

Revision ID: b7e2d9a1c3f4
Revises: 686c98e38627
Create Date: 2026-09-28 12:00:00

Expand + migrate: новая таблица record_services заполняется из
records.service_id; master_id / master_name / service_id становятся
nullable. Старый код продолжает работать: он пишет service_id и мастера,
новый — ещё и record_services. records.service_id удаляется отдельной
contract-миграцией, когда весь флот будет на новом коде.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "b7e2d9a1c3f4"
down_revision: str | Sequence[str] | None = "686c98e38627"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "record_services",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("record_id", sa.Uuid(), nullable=False),
        sa.Column("service_id", sa.Uuid(), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("price", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("duration_minutes", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(
            ["record_id"],
            ["records.id"],
            name=op.f("fk_record_services_record_id_records"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["service_id"],
            ["services.id"],
            name=op.f("fk_record_services_service_id_services"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_record_services")),
    )
    op.create_index(
        op.f("ix_record_services_record_id"), "record_services", ["record_id"], unique=False
    )
    op.create_index(
        op.f("ix_record_services_service_id"), "record_services", ["service_id"], unique=False
    )

    # Существующие записи: одна услуга, цена — снапшот из записи
    op.execute(
        """
        INSERT INTO record_services (id, record_id, service_id, position, name, price,
                                     duration_minutes)
        SELECT gen_random_uuid(), r.id, r.service_id, 0, s.name, r.price,
               GREATEST(1, (EXTRACT(EPOCH FROM (r.end_at - r.start_at)) / 60)::int)
        FROM records r
        JOIN services s ON s.id = r.service_id
        """
    )

    op.alter_column("records", "master_id", existing_type=sa.Uuid(), nullable=True)
    op.alter_column("records", "master_name", existing_type=sa.String(length=255), nullable=True)
    op.alter_column("records", "service_id", existing_type=sa.Uuid(), nullable=True)


def downgrade() -> None:
    # Записи без мастера/услуги не переживут NOT NULL — downgrade только на
    # данных, где таких записей нет
    op.alter_column("records", "service_id", existing_type=sa.Uuid(), nullable=False)
    op.alter_column("records", "master_name", existing_type=sa.String(length=255), nullable=False)
    op.alter_column("records", "master_id", existing_type=sa.Uuid(), nullable=False)
    op.drop_index(op.f("ix_record_services_service_id"), table_name="record_services")
    op.drop_index(op.f("ix_record_services_record_id"), table_name="record_services")
    op.drop_table("record_services")
