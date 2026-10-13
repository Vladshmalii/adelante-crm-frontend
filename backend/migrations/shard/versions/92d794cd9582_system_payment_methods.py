"""системные способы оплаты «Особовий рахунок» и «Кешбек»; чек без кассы

Revision ID: 92d794cd9582
Revises: b3d5f7a9c1e2
Create Date: 2026-10-13 20:10:00

Expand (backend/docs/loyalty-accounts.md, разделы 4.2 и 15):
- созданные вручную способы типа bonus переводятся в other — касса и история
  сохраняются, тип bonus теперь означает системный «Кешбек»;
- в салоне ровно один account и один bonus, без кассы, не онлайн
  (частичный уникальный индекс по type);
- receipts.cash_register_id становится nullable: чек, целиком оплаченный со
  счёта или кешбэком, кассы не имеет.

Перевод bonus → other необратим; downgrade удаляет только неиспользованные
системные способы и падает, если уже есть чеки без кассы.
"""

import uuid
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "92d794cd9582"
down_revision: str | Sequence[str] | None = "b3d5f7a9c1e2"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

SYSTEM_METHODS = (("account", "Особовий рахунок", 1000), ("bonus", "Кешбек", 1001))


def upgrade() -> None:
    op.execute("UPDATE payment_methods SET type = 'other' WHERE type = 'bonus'")
    op.create_index(
        "uq_payment_methods_system_type",
        "payment_methods",
        ["type"],
        unique=True,
        postgresql_where=sa.text("type IN ('account', 'bonus')"),
    )
    methods = sa.table(
        "payment_methods",
        sa.column("id", sa.Uuid()),
        sa.column("name", sa.String()),
        sa.column("type", sa.String()),
        sa.column("cash_register_id", sa.Uuid()),
        sa.column("commission_type", sa.String()),
        sa.column("commission_value", sa.Numeric()),
        sa.column("commission_payer", sa.String()),
        sa.column("available_online", sa.Boolean()),
        sa.column("allow_partial_payment", sa.Boolean()),
        sa.column("allow_tips", sa.Boolean()),
        sa.column("sort_order", sa.Integer()),
        sa.column("is_active", sa.Boolean()),
    )
    op.bulk_insert(
        methods,
        [
            {
                "id": uuid.uuid4(),
                "name": name,
                "type": method_type,
                "cash_register_id": None,
                "commission_type": "none",
                "commission_value": 0,
                "commission_payer": "salon",
                "available_online": False,
                "allow_partial_payment": True,
                "allow_tips": False,
                "sort_order": sort_order,
                "is_active": True,
            }
            for method_type, name, sort_order in SYSTEM_METHODS
        ],
    )
    op.alter_column("receipts", "cash_register_id", existing_type=sa.UUID(), nullable=True)


def downgrade() -> None:
    op.alter_column("receipts", "cash_register_id", existing_type=sa.UUID(), nullable=False)
    op.execute(
        "DELETE FROM payment_methods pm WHERE pm.type IN ('account', 'bonus') "
        "AND NOT EXISTS (SELECT 1 FROM receipt_payments rp WHERE rp.payment_method_id = pm.id) "
        "AND NOT EXISTS (SELECT 1 FROM finance_operations fo WHERE fo.payment_method_id = pm.id)"
    )
    op.execute("UPDATE payment_methods SET type = 'other' WHERE type = 'account'")
    op.drop_index("uq_payment_methods_system_type", table_name="payment_methods")
