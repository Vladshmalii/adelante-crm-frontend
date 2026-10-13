"""client accounts ledger

Revision ID: 91600a4dcd62
Revises: a3f1c2d4e5b6
Create Date: 2026-10-13 19:39:23

Expand-only: новые таблицы особового рахунку и журнала (loyalty-accounts.md, раздел 4.1).
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "91600a4dcd62"
down_revision: str | Sequence[str] | None = "a3f1c2d4e5b6"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "client_accounts",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("client_id", sa.Uuid(), nullable=False),
        sa.Column(
            "kind",
            sa.Enum("money", "cashback", name="accountkind", native_enum=False, length=16),
            nullable=False,
        ),
        sa.Column("balance", sa.Numeric(precision=12, scale=2), server_default="0", nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["client_id"], ["clients.id"], name=op.f("fk_client_accounts_client_id_clients")
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_client_accounts")),
    )
    op.create_index(
        op.f("ix_client_accounts_client_id"), "client_accounts", ["client_id"], unique=False
    )
    op.create_index(
        "uq_client_accounts_money",
        "client_accounts",
        ["client_id"],
        unique=True,
        postgresql_where=sa.text("kind = 'money'"),
    )
    op.create_table(
        "account_transactions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("account_id", sa.Uuid(), nullable=False),
        sa.Column(
            "type",
            sa.Enum(
                "topup",
                "refund",
                "payment",
                "accrual",
                "reversal",
                "adjustment",
                "burn",
                name="transactiontype",
                native_enum=False,
                length=16,
            ),
            nullable=False,
        ),
        sa.Column("amount", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("balance_after", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("salon_id", sa.Uuid(), nullable=True),
        sa.Column("record_id", sa.Uuid(), nullable=True),
        sa.Column("receipt_id", sa.Uuid(), nullable=True),
        sa.Column("staff_id", sa.Uuid(), nullable=True),
        sa.Column("staff_name", sa.String(length=255), nullable=True),
        sa.Column("author_id", sa.Uuid(), nullable=True),
        sa.Column("author_name", sa.String(length=255), nullable=True),
        sa.Column("comment", sa.String(length=2000), nullable=True),
        sa.Column("reverses_id", sa.Uuid(), nullable=True),
        sa.Column("idempotency_key", sa.String(length=200), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["account_id"],
            ["client_accounts.id"],
            name=op.f("fk_account_transactions_account_id_client_accounts"),
        ),
        sa.ForeignKeyConstraint(
            ["reverses_id"],
            ["account_transactions.id"],
            name=op.f("fk_account_transactions_reverses_id_account_transactions"),
        ),
        sa.ForeignKeyConstraint(
            ["salon_id"], ["salons.id"], name=op.f("fk_account_transactions_salon_id_salons")
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_account_transactions")),
        sa.UniqueConstraint(
            "idempotency_key", name=op.f("uq_account_transactions_idempotency_key")
        ),
        sa.UniqueConstraint("reverses_id", name=op.f("uq_account_transactions_reverses_id")),
    )
    op.create_index(
        "ix_account_transactions_account_created",
        "account_transactions",
        ["account_id", "created_at"],
        unique=False,
    )
    op.create_index(
        op.f("ix_account_transactions_receipt_id"),
        "account_transactions",
        ["receipt_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_account_transactions_receipt_id"), table_name="account_transactions")
    op.drop_index("ix_account_transactions_account_created", table_name="account_transactions")
    op.drop_table("account_transactions")
    op.drop_index(
        "uq_client_accounts_money",
        table_name="client_accounts",
        postgresql_where=sa.text("kind = 'money'"),
    )
    op.drop_index(op.f("ix_client_accounts_client_id"), table_name="client_accounts")
    op.drop_table("client_accounts")
