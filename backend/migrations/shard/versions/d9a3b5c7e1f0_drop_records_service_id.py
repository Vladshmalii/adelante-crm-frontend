"""drop records.service_id (contract)

Revision ID: d9a3b5c7e1f0
Revises: c4d8e1f2a9b3
Create Date: 2026-09-28 22:00:00

Contract-шаг перехода на несколько услуг в записи (expand — b7e2d9a1c3f4):
состав услуг живёт в record_services, records.service_id больше не читается
и не пишется кодом.

ВАЖНО при выкатке: код до 2026-09-28 пишет records.service_id. Если эта
миграция приходит вместе с expand-миграцией, api/worker со старым кодом
нужно остановить до `salonctl migrate shards` и запустить уже с новым кодом.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "d9a3b5c7e1f0"
down_revision: str | Sequence[str] | None = "c4d8e1f2a9b3"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.drop_constraint("fk_records_service_id_services", "records", type_="foreignkey")
    op.drop_column("records", "service_id")


def downgrade() -> None:
    op.add_column("records", sa.Column("service_id", sa.Uuid(), nullable=True))
    op.create_foreign_key(
        "fk_records_service_id_services", "records", "services", ["service_id"], ["id"]
    )
    op.execute(
        """
        UPDATE records r SET service_id = rs.service_id
        FROM record_services rs
        WHERE rs.record_id = r.id AND rs.position = 0
        """
    )
