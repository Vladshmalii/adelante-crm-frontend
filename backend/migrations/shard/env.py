from alembic import context
from sqlalchemy import create_engine, pool

from app.models import shard  # noqa: F401  (регистрация моделей в metadata)
from app.models.base import ShardBase

config = context.config
target_metadata = ShardBase.metadata


def _database_url() -> str | None:
    # -x db_url=... — для ручного запуска против конкретного шарда
    # (например, эталонной dev-БД при autogenerate)
    x_args = context.get_x_argument(as_dictionary=True)
    return x_args.get("db_url")


def run_migrations_offline() -> None:
    url = _database_url()
    if not url:
        raise SystemExit(
            "Шард-окружение требует целевую БД: alembic -x db_url=postgresql+psycopg://..."
        )
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    # Основной путь: salonctl итерирует шарды и передаёт готовый Connection
    connection = config.attributes.get("connection")
    if connection is not None:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()
        return

    url = _database_url()
    if not url:
        raise SystemExit(
            "Шард-окружение требует целевую БД: alembic -x db_url=postgresql+psycopg://... "
            "либо запуск через salonctl migrate shards"
        )
    connectable = create_engine(url, poolclass=pool.NullPool)
    with connectable.connect() as conn:
        context.configure(connection=conn, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
