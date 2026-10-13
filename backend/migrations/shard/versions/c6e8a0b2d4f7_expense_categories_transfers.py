"""expense_categories; переводы между кассами (target_cash_register_id)

Revision ID: c6e8a0b2d4f7
Revises: b3d5f7a9c1e2
Create Date: 2026-10-13 19:00:00

Справочник категорий расходов заполняется стартовым списком заказчика
(категории расходов из его прежней системы, без суффикса «(Витрати)»).
finance_operations.category расширяется до 255 — названия категорий длинные.
У перевода появляется касса-получатель; старые transfer-операции без неё
на балансы не влияли и не влияют.
"""

import uuid
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "c6e8a0b2d4f7"
down_revision: str | Sequence[str] | None = "b3d5f7a9c1e2"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

DEFAULT_CATEGORIES = [
    "Інші витрати",
    "Госп. товари: пакети, ганчірки, швабра, миючі, туалетний папір, паперові рушники, вологі серветки",
    "Закупівля матеріалів",
    "Закупівля матеріалів (Брови)",
    "Закупівля матеріалів (Манікюр)",
    "Закупівля товарів",
    "Зарплата співробітникам",
    "Заточування - Вартість послуг, Доставка",
    "Зв'язок - Інтернет, телефон",
    "Зняття прибутку - Особисті витрати",
    "Комунальні послуги - Електроенергія, ЖРЕП, сміття, опалення",
    "Комісія за еквайринг",
    "Кавомашина - Обслуговування, кава, вода, лимони, чай",
    "Навчання (онлайн або офлайн курси)",
    "Обладнання - Меблі, пристрої, інструменти для майстрів, техніка",
    "Оренда",
    "Податки та збори",
    "Прибирання - Прибиральниця",
    "Програмне забезпечення (Altegio, ChatGPT)",
    "Просування - СММ, Реклама, Автопостинг",
    "Ремонт і обслуговування - Робота, матеріали, обслуговування",
    "СМС",
    "Транспорт - Нова Пошта, таксі, самокати, запчастини",
]


def upgrade() -> None:
    categories = op.create_table(
        "expense_categories",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_expense_categories")),
    )
    op.create_index(
        "uq_expense_categories_lower_name",
        "expense_categories",
        [sa.text("lower(name)")],
        unique=True,
    )
    op.bulk_insert(categories, [{"id": uuid.uuid4(), "name": n} for n in DEFAULT_CATEGORIES])

    op.alter_column(
        "finance_operations",
        "category",
        existing_type=sa.String(length=64),
        type_=sa.String(length=255),
        existing_nullable=True,
    )
    op.add_column(
        "finance_operations", sa.Column("target_cash_register_id", sa.Uuid(), nullable=True)
    )
    op.create_foreign_key(
        op.f("fk_finance_operations_target_cash_register_id_cash_registers"),
        "finance_operations",
        "cash_registers",
        ["target_cash_register_id"],
        ["id"],
    )


def downgrade() -> None:
    op.drop_constraint(
        op.f("fk_finance_operations_target_cash_register_id_cash_registers"),
        "finance_operations",
        type_="foreignkey",
    )
    op.drop_column("finance_operations", "target_cash_register_id")
    op.execute("UPDATE finance_operations SET category = left(category, 64)")
    op.alter_column(
        "finance_operations",
        "category",
        existing_type=sa.String(length=255),
        type_=sa.String(length=64),
        existing_nullable=True,
    )
    op.drop_index("uq_expense_categories_lower_name", table_name="expense_categories")
    op.drop_table("expense_categories")
