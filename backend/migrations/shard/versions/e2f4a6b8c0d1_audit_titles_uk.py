"""audit_log: названия объектов по-украински

Revision ID: e2f4a6b8c0d1
Revises: d9a3b5c7e1f0
Create Date: 2026-09-28 22:30:00

Data-only: старые записи журнала («Операция expense 350», «Касса Основная»)
переписываются в формат нового кода («Операція: Видаток 350 ₴», «Каса «…»»).
Обратная миграция не нужна — меняется только текст для отображения.
"""

from collections.abc import Sequence

from alembic import op

revision: str = "e2f4a6b8c0d1"
down_revision: str | Sequence[str] | None = "d9a3b5c7e1f0"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

# (шаблон старого названия, замена) — регулярные выражения PostgreSQL
RENAMES = [
    (r"^Операция income (.+)$", r"Операція: Прихід \1 ₴"),
    (r"^Операция expense (.+)$", r"Операція: Видаток \1 ₴"),
    (r"^Операция transfer (.+)$", r"Операція: Переказ \1 ₴"),
    (r"^Документ (?!№ )(.+)$", r"Документ № \1"),
    (r"^Чек (?!№ )(.+)$", r"Чек № \1"),
    (r"^Способ оплаты (.+)$", r"Спосіб оплати «\1»"),
    (r"^Касса (.+)$", r"Каса «\1»"),
    (r"^Импорт Excel: \+(\d+) / ~(\d+)$", r"Імпорт з Excel: створено \1, оновлено \2"),
]


def upgrade() -> None:
    for pattern, replacement in RENAMES:
        op.execute(
            f"UPDATE audit_log SET entity_name = regexp_replace(entity_name, '{pattern}', "
            f"'{replacement}') WHERE entity_name ~ '{pattern}'"
        )


def downgrade() -> None:
    pass
