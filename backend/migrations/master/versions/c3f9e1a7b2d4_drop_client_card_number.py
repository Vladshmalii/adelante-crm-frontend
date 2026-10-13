"""drop clients.card_number

Revision ID: c3f9e1a7b2d4
Revises: b7b0c810d969
Create Date: 2026-10-13 21:30:00

Contract: номер карты клиента заменён номером карты лояльности (loyalty-accounts.md,
раздел 4.3, п. 5). Значения не переносим (раздел 15, п. 4): если в колонке есть непустые
номера, миграция падает — их нужно сначала выдать картами лояльности или очистить вручную.
Код до этой выкатки читает колонку — api, worker и beat останавливаются на время миграции.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "c3f9e1a7b2d4"
down_revision: str | Sequence[str] | None = "b7b0c810d969"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    filled = op.get_bind().scalar(
        sa.text("SELECT count(*) FROM clients WHERE NULLIF(btrim(card_number), '') IS NOT NULL")
    )
    if filled:
        raise RuntimeError(
            f"clients.card_number заповнено у {filled} клієнтів: видайте їм картки лояльності "
            "або очистіть колонку, потім повторіть міграцію"
        )
    op.drop_column("clients", "card_number")


def downgrade() -> None:
    op.add_column("clients", sa.Column("card_number", sa.String(length=64), nullable=True))
