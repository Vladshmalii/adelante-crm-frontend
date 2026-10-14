"""системный способ оплаты «Сертифікат»; строки чека-сертификаты

Revision ID: d60f7296d850
Revises: 64481c259800
Create Date: 2026-10-14 12:00:00

ВАЖНО: миграция прогоняется на все шард-БД неатомарно — она обязана быть
backward-compatible (expand → migrate → contract).

Expand + migrate (backend/docs/certificates.md, раздел 3.2), по образцу 92d794cd9582:
- receipt_certificate_lines — проданные сертификаты чека (новая таблица, старый код
  её не читает);
- созданные вручную способы типа certificate (с кассой) переводятся в other — касса и
  история сохраняются, тип certificate теперь означает системный «Сертифікат»;
- уникальный индекс системных способов расширяется на certificate, создаётся
  системный «Сертифікат» без кассы, не онлайн. Код до выкатки считает его обычным
  способом без кассы и отказывает в оплате им («не налаштовано касу»).

Contract не нужен. Перевод certificate → other необратим; downgrade удаляет только
неиспользованный системный способ.
"""

import uuid
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "d60f7296d850"
down_revision: str | Sequence[str] | None = "64481c259800"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "receipt_certificate_lines",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("receipt_id", sa.Uuid(), nullable=False),
        sa.Column("template_id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("amount", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("certificate_id", sa.Uuid(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["receipt_id"],
            ["receipts.id"],
            name=op.f("fk_receipt_certificate_lines_receipt_id_receipts"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_receipt_certificate_lines")),
        sa.UniqueConstraint(
            "certificate_id", name=op.f("uq_receipt_certificate_lines_certificate_id")
        ),
    )
    op.create_index(
        op.f("ix_receipt_certificate_lines_receipt_id"),
        "receipt_certificate_lines",
        ["receipt_id"],
    )

    op.execute("UPDATE payment_methods SET type = 'other' WHERE type = 'certificate'")
    op.drop_index("uq_payment_methods_system_type", table_name="payment_methods")
    op.create_index(
        "uq_payment_methods_system_type",
        "payment_methods",
        ["type"],
        unique=True,
        postgresql_where=sa.text("type IN ('account', 'bonus', 'certificate')"),
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
                "name": "Сертифікат",
                "type": "certificate",
                "cash_register_id": None,
                "commission_type": "none",
                "commission_value": 0,
                "commission_payer": "salon",
                "available_online": False,
                "allow_partial_payment": True,
                "allow_tips": False,
                "sort_order": 1002,
                "is_active": True,
            }
        ],
    )


def downgrade() -> None:
    op.execute(
        "DELETE FROM payment_methods pm WHERE pm.type = 'certificate' "
        "AND NOT EXISTS (SELECT 1 FROM receipt_payments rp WHERE rp.payment_method_id = pm.id) "
        "AND NOT EXISTS (SELECT 1 FROM finance_operations fo WHERE fo.payment_method_id = pm.id)"
    )
    op.drop_index("uq_payment_methods_system_type", table_name="payment_methods")
    op.create_index(
        "uq_payment_methods_system_type",
        "payment_methods",
        ["type"],
        unique=True,
        postgresql_where=sa.text("type IN ('account', 'bonus')"),
    )
    op.drop_index(
        op.f("ix_receipt_certificate_lines_receipt_id"), table_name="receipt_certificate_lines"
    )
    op.drop_table("receipt_certificate_lines")
