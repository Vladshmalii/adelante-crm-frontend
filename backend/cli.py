"""salonctl — управление платформой (не self-service).

Новые салоны добавляются администратором платформы: создание шард-БД,
прогон миграций, регистрация в реестре Master DB, инвалидация кэша.
Шаги идемпотентны — повторный запуск докатывает с места падения.
"""

import os
import re
import sys
from pathlib import Path
from uuid import UUID

import redis as redis_sync
import typer
from alembic import command
from alembic.config import Config as AlembicConfig
from alembic.script import ScriptDirectory
from sqlalchemy import create_engine, select, text

from app.api import security
from app.config import get_settings
from app.models.master import Administrator, Salon, SalonStatus
from app.tenancy.registry import CONN_KEY, INVALIDATE_CHANNEL, SLUG_KEY, SalonConnInfo

BASE_DIR = Path(__file__).resolve().parent

app = typer.Typer(help="Управление салонами и миграциями Adelante CRM")
salon_app = typer.Typer(help="Реестр салонов")
migrate_app = typer.Typer(help="Alembic-миграции master и шардов")
administrator_app = typer.Typer(help="Администраторы админ-панели")
app.add_typer(salon_app, name="salon")
app.add_typer(migrate_app, name="migrate")
app.add_typer(administrator_app, name="administrator")


def _alembic_cfg(env_name: str) -> AlembicConfig:
    cfg = AlembicConfig(str(BASE_DIR / f"alembic.{env_name}.ini"))
    cfg.set_main_option("script_location", str(BASE_DIR / "migrations" / env_name))
    return cfg


def _shard_head() -> str | None:
    return ScriptDirectory.from_config(_alembic_cfg("shard")).get_current_head()


def _master_engine():
    return create_engine(get_settings().master_db_dsn_sync, pool_pre_ping=True)


def _master_session():
    from sqlalchemy.orm import Session

    return Session(_master_engine())


def _invalidate_cache(salon: Salon) -> None:
    settings = get_settings()
    try:
        r = redis_sync.Redis.from_url(settings.redis_url, decode_responses=True)
        r.delete(CONN_KEY.format(salon_id=salon.id))
        r.delete(SLUG_KEY.format(slug=salon.slug))
        r.publish(INVALIDATE_CHANNEL, str(salon.id))
        r.close()
    except redis_sync.RedisError:
        typer.secho("Redis недоступен: кэш не инвалидирован (истечёт по TTL)", fg="yellow")


def _upgrade_shard_db(dsn: str) -> None:
    cfg = _alembic_cfg("shard")
    engine = create_engine(dsn, pool_pre_ping=True)
    try:
        with engine.begin() as conn:
            cfg.attributes["connection"] = conn
            command.upgrade(cfg, "head")
    finally:
        engine.dispose()


# --- migrate ----------------------------------------------------------------


@migrate_app.command("master")
def migrate_master() -> None:
    """Прогнать миграции Master DB до head."""
    cfg = _alembic_cfg("master")
    engine = _master_engine()
    with engine.begin() as conn:
        cfg.attributes["connection"] = conn
        command.upgrade(cfg, "head")
    engine.dispose()
    typer.secho("Master DB: миграции применены", fg="green")


@migrate_app.command("shards")
def migrate_shards(
    salon_id: UUID | None = typer.Option(None, help="Только один салон"),  # noqa: B008
    dry_run: bool = typer.Option(False, help="Показать план без выполнения"),
) -> None:
    """Прогнать shard-миграции на все активные шард-БД (или на один салон).

    Провал одного шарда не прерывает остальные; неуспешные перечисляются
    в конце для точечного повтора. Прогон идемпотентен: alembic_version
    в каждом шарде самоописывает его версию.
    """
    head = _shard_head()
    failures: list[tuple[str, str]] = []

    with _master_session() as session:
        query = select(Salon).where(Salon.status != SalonStatus.SUSPENDED)
        if salon_id is not None:
            query = select(Salon).where(Salon.id == salon_id)
        salons = list(session.scalars(query))

        if not salons:
            typer.secho("Салонов для миграции нет", fg="yellow")
            raise typer.Exit()

        for salon in salons:
            info = _conn_info(salon)
            if dry_run:
                typer.echo(f"[dry-run] {salon.slug}: {salon.schema_version} -> {head}")
                continue
            try:
                _upgrade_shard_db(info.build_dsn(driver="psycopg"))
                salon.schema_version = head
                session.commit()
                typer.secho(f"{salon.slug}: OK ({head})", fg="green")
            except Exception as exc:  # noqa: BLE001 — отчёт по каждому шарду
                session.rollback()
                failures.append((salon.slug, str(exc)))
                typer.secho(f"{salon.slug}: FAIL — {exc}", fg="red")

    if failures:
        typer.secho(f"\nНеуспешно: {', '.join(slug for slug, _ in failures)}", fg="red")
        typer.echo("Повтор точечно: salonctl migrate shards --salon-id <id>")
        raise typer.Exit(code=1)


@migrate_app.command("revision")
def migrate_revision(
    env: str = typer.Option(..., help="master | shard"),
    message: str = typer.Option(..., "-m", help="Описание миграции"),
    autogenerate: bool = typer.Option(True),
    db_url: str | None = typer.Option(
        None, help="Для shard-autogenerate: URL эталонной dev-шард-БД"
    ),
) -> None:
    """Создать новую ревизию (autogenerate — против master DB или эталонного шарда)."""
    cfg = _alembic_cfg(env)
    if env == "shard":
        if autogenerate and not db_url:
            typer.secho("Для shard-autogenerate нужен --db-url эталонной БД", fg="red")
            raise typer.Exit(code=1)
        if db_url:
            engine = create_engine(db_url)
            with engine.begin() as conn:
                cfg.attributes["connection"] = conn
                command.revision(cfg, message=message, autogenerate=autogenerate)
            engine.dispose()
            return
    elif env == "master":
        engine = _master_engine()
        with engine.begin() as conn:
            cfg.attributes["connection"] = conn
            command.revision(cfg, message=message, autogenerate=autogenerate)
        engine.dispose()
        return
    command.revision(cfg, message=message, autogenerate=False)


# --- salon ------------------------------------------------------------------


def _conn_info(salon: Salon) -> SalonConnInfo:
    return SalonConnInfo(
        salon_id=salon.id,
        slug=salon.slug,
        db_host=salon.db_host,
        db_port=salon.db_port,
        db_name=salon.db_name,
        db_user=salon.db_user,
        secret_env=salon.secret_env,
        status=salon.status,
    )


@salon_app.command("create")
def salon_create(
    name: str = typer.Option(...),
    slug: str = typer.Option(..., help="Латиница/дефисы, войдёт в booking-URL"),
    secret_env: str = typer.Option(
        ..., help="Имя переменной окружения с паролем роли шарда (должна быть задана)"
    ),
    db_host: str = typer.Option("postgres-shards"),
    db_port: int = typer.Option(5432),
    db_name: str | None = typer.Option(None, help="По умолчанию salon_<slug>"),
    db_user: str | None = typer.Option(None, help="По умолчанию salon_<slug>"),
    timezone: str = typer.Option("Europe/Kyiv"),
) -> None:
    """Создать шард-БД, применить миграции и зарегистрировать салон в реестре."""
    settings = get_settings()
    db_name = db_name or f"salon_{slug}".replace("-", "_")
    db_user = db_user or db_name

    for ident in (db_name, db_user):
        if not re.fullmatch(r"[a-z][a-z0-9_]{0,62}", ident):
            typer.secho(f"Недопустимый идентификатор PostgreSQL: {ident!r}", fg="red")
            raise typer.Exit(code=1)

    password = os.environ.get(secret_env)
    if not password:
        typer.secho(f"Переменная окружения {secret_env} не задана", fg="red")
        raise typer.Exit(code=1)

    # Шаг 1: роль и БД на сервере шардов (идемпотентно).
    # Пароль в DDL нельзя передать bound-параметром — экранируем literal
    escaped_pwd = password.replace("'", "''")

    admin_engine = create_engine(settings.shard_admin_dsn, isolation_level="AUTOCOMMIT")
    with admin_engine.connect() as conn:
        role_exists = conn.execute(
            text("SELECT 1 FROM pg_roles WHERE rolname = :r"), {"r": db_user}
        ).scalar()
        if not role_exists:
            conn.execute(text(f"CREATE ROLE \"{db_user}\" LOGIN PASSWORD '{escaped_pwd}'"))
            typer.echo(f"Роль {db_user} создана")
        db_exists = conn.execute(
            text("SELECT 1 FROM pg_database WHERE datname = :d"), {"d": db_name}
        ).scalar()
        if not db_exists:
            conn.execute(text(f'CREATE DATABASE "{db_name}" OWNER "{db_user}"'))
            typer.echo(f"БД {db_name} создана")
    admin_engine.dispose()

    # Шаг 2: запись в реестре со статусом provisioning (идемпотентно по slug)
    with _master_session() as session:
        salon = session.scalar(select(Salon).where(Salon.slug == slug))
        if salon is None:
            salon = Salon(
                slug=slug,
                name=name,
                timezone=timezone,
                db_host=db_host,
                db_port=db_port,
                db_name=db_name,
                db_user=db_user,
                secret_env=secret_env,
                status=SalonStatus.PROVISIONING,
            )
            session.add(salon)
        elif salon.status == SalonStatus.ACTIVE:
            typer.secho(f"Салон {slug} уже активен — ничего не делаю", fg="yellow")
            raise typer.Exit()
        session.commit()

        # Шаг 3: миграции на новую (пустую) шард-БД — единственный источник схемы
        _upgrade_shard_db(_conn_info(salon).build_dsn(driver="psycopg"))

        # Шаг 4: активация и инвалидация кэша
        salon.schema_version = _shard_head()
        salon.status = SalonStatus.ACTIVE
        session.commit()
        _invalidate_cache(salon)
        typer.secho(f"Салон {slug} создан и активен (id={salon.id})", fg="green")


@salon_app.command("list")
def salon_list() -> None:
    with _master_session() as session:
        salons = list(session.scalars(select(Salon).order_by(Salon.created_at)))
    if not salons:
        typer.echo("Реестр пуст")
        return
    for s in salons:
        typer.echo(
            f"{s.id}  {s.slug:<20} {s.status.value:<12} "
            f"{s.db_host}:{s.db_port}/{s.db_name}  rev={s.schema_version}"
        )


def _set_status(slug: str, status: SalonStatus) -> None:
    with _master_session() as session:
        salon = session.scalar(select(Salon).where(Salon.slug == slug))
        if salon is None:
            typer.secho(f"Салон {slug} не найден", fg="red")
            raise typer.Exit(code=1)
        salon.status = status
        session.commit()
        _invalidate_cache(salon)
    typer.secho(f"{slug}: статус {status.value}", fg="green")


@salon_app.command("suspend")
def salon_suspend(slug: str) -> None:
    _set_status(slug, SalonStatus.SUSPENDED)


@salon_app.command("resume")
def salon_resume(slug: str) -> None:
    _set_status(slug, SalonStatus.ACTIVE)


# --- administrator ------------------------------------------------------------


@administrator_app.command("create")
def administrator_create(
    email: str = typer.Option(...),
    password: str = typer.Option(..., help="Мин. 8 символов"),
    first_name: str = typer.Option(...),
    last_name: str | None = typer.Option(None),
) -> None:
    """Создать администратора (первый вход после поднятия проекта — БД пуста, self-service нет)."""
    if len(password) < 8:
        typer.secho("Пароль должен быть не короче 8 символов", fg="red")
        raise typer.Exit(code=1)

    with _master_session() as session:
        existing = session.scalar(select(Administrator).where(Administrator.email == email))
        if existing is not None:
            typer.secho(f"Администратор {email} уже существует (id={existing.id})", fg="yellow")
            raise typer.Exit(code=1)

        admin = Administrator(
            email=email,
            password_hash=security.password_hasher.hash(password),
            first_name=first_name,
            last_name=last_name,
        )
        session.add(admin)
        session.commit()
        typer.secho(f"Администратор {email} создан (id={admin.id})", fg="green")


if __name__ == "__main__":
    sys.exit(app())
