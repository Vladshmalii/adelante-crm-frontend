"""certificates

Revision ID: cd8a6219ad91
Revises: c3f9e1a7b2d4
Create Date: 2026-10-14 12:00:00

Expand-only: подарочные сертификаты (certificates.md, раздел 3.1) — шаблоны с услугами
по салонам, выпущенные сертификаты со снимком услуг; остаток — счёт client_accounts
вида certificate: certificate_id (unique), client_id становится nullable (владельца до
активации нет). CHECK: client_id обязателен для money и cashback, certificate_id — ровно
у certificate. Существующие счета им удовлетворяют, код до выкатки их не нарушает.

downgrade падает, если счета сертификатов уже есть (NOT NULL на client_id).
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "cd8a6219ad91"
down_revision: str | Sequence[str] | None = "c3f9e1a7b2d4"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _scope() -> sa.Enum:
    return sa.Enum("any", "services", name="certificatescope", native_enum=False, length=16)


def upgrade() -> None:
    op.create_table(
        "certificate_templates",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("amount", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("scope", _scope(), nullable=False),
        sa.Column("valid_days", sa.Integer(), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("sort_order", sa.Integer(), server_default="0", nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_certificate_templates")),
    )
    op.create_table(
        "certificate_template_services",
        sa.Column("template_id", sa.Uuid(), nullable=False),
        sa.Column("salon_id", sa.Uuid(), nullable=False),
        sa.Column("service_id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(
            ["salon_id"],
            ["salons.id"],
            name=op.f("fk_certificate_template_services_salon_id_salons"),
        ),
        sa.ForeignKeyConstraint(
            ["template_id"],
            ["certificate_templates.id"],
            name=op.f("fk_certificate_template_services_template_id_certificate_templates"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint(
            "template_id", "salon_id", "service_id", name=op.f("pk_certificate_template_services")
        ),
    )
    op.create_table(
        "certificates",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("code", sa.String(length=32), nullable=False),
        sa.Column("template_id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("amount", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("scope", _scope(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "status",
            sa.Enum(
                "issued",
                "active",
                "spent",
                "expired",
                "cancelled",
                name="certificatestatus",
                native_enum=False,
                length=16,
            ),
            nullable=False,
        ),
        sa.Column("sold_salon_id", sa.Uuid(), nullable=False),
        sa.Column("sold_receipt_id", sa.Uuid(), nullable=False),
        sa.Column("buyer_client_id", sa.Uuid(), nullable=True),
        sa.Column("issue_key", sa.String(length=200), nullable=False),
        sa.Column("owner_client_id", sa.Uuid(), nullable=True),
        sa.Column("activated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("cancelled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("cancelled_by", sa.Uuid(), nullable=True),
        sa.Column("cancelled_by_name", sa.String(length=255), nullable=True),
        sa.Column("cancel_reason", sa.String(length=2000), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["buyer_client_id"],
            ["clients.id"],
            name=op.f("fk_certificates_buyer_client_id_clients"),
        ),
        sa.ForeignKeyConstraint(
            ["owner_client_id"],
            ["clients.id"],
            name=op.f("fk_certificates_owner_client_id_clients"),
        ),
        sa.ForeignKeyConstraint(
            ["sold_salon_id"], ["salons.id"], name=op.f("fk_certificates_sold_salon_id_salons")
        ),
        sa.ForeignKeyConstraint(
            ["template_id"],
            ["certificate_templates.id"],
            name=op.f("fk_certificates_template_id_certificate_templates"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_certificates")),
        sa.UniqueConstraint("code", name=op.f("uq_certificates_code")),
        sa.UniqueConstraint("issue_key", name=op.f("uq_certificates_issue_key")),
    )
    op.create_index("ix_certificates_owner_client_id", "certificates", ["owner_client_id"])
    op.create_index("ix_certificates_buyer_client_id", "certificates", ["buyer_client_id"])
    op.create_index(
        "ix_certificates_sold_receipt", "certificates", ["sold_salon_id", "sold_receipt_id"]
    )
    op.create_table(
        "certificate_services",
        sa.Column("certificate_id", sa.Uuid(), nullable=False),
        sa.Column("salon_id", sa.Uuid(), nullable=False),
        sa.Column("service_id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(
            ["certificate_id"],
            ["certificates.id"],
            name=op.f("fk_certificate_services_certificate_id_certificates"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["salon_id"], ["salons.id"], name=op.f("fk_certificate_services_salon_id_salons")
        ),
        sa.PrimaryKeyConstraint(
            "certificate_id", "salon_id", "service_id", name=op.f("pk_certificate_services")
        ),
    )

    op.add_column("client_accounts", sa.Column("certificate_id", sa.Uuid(), nullable=True))
    op.create_foreign_key(
        op.f("fk_client_accounts_certificate_id_certificates"),
        "client_accounts",
        "certificates",
        ["certificate_id"],
        ["id"],
    )
    op.create_unique_constraint(
        op.f("uq_client_accounts_certificate_id"), "client_accounts", ["certificate_id"]
    )
    op.alter_column("client_accounts", "client_id", existing_type=sa.Uuid(), nullable=True)
    op.create_check_constraint(
        op.f("ck_client_accounts_client_required"),
        "client_accounts",
        "kind = 'certificate' OR client_id IS NOT NULL",
    )
    op.create_check_constraint(
        op.f("ck_client_accounts_certificate_kind"),
        "client_accounts",
        "(kind = 'certificate') = (certificate_id IS NOT NULL)",
    )


def downgrade() -> None:
    op.drop_constraint(
        op.f("ck_client_accounts_certificate_kind"), "client_accounts", type_="check"
    )
    op.drop_constraint(op.f("ck_client_accounts_client_required"), "client_accounts", type_="check")
    op.alter_column("client_accounts", "client_id", existing_type=sa.Uuid(), nullable=False)
    op.drop_constraint(op.f("uq_client_accounts_certificate_id"), "client_accounts", type_="unique")
    op.drop_constraint(
        op.f("fk_client_accounts_certificate_id_certificates"),
        "client_accounts",
        type_="foreignkey",
    )
    op.drop_column("client_accounts", "certificate_id")
    op.drop_table("certificate_services")
    op.drop_index("ix_certificates_sold_receipt", table_name="certificates")
    op.drop_index("ix_certificates_buyer_client_id", table_name="certificates")
    op.drop_index("ix_certificates_owner_client_id", table_name="certificates")
    op.drop_table("certificates")
    op.drop_table("certificate_template_services")
    op.drop_table("certificate_templates")
