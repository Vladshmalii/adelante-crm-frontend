"""Миграции совпадают с моделями (аналог `alembic check`) — и для Master DB, и для шарда."""

import os

from alembic.autogenerate import compare_metadata
from alembic.migration import MigrationContext
from sqlalchemy import create_engine

from app.models.base import MasterBase, ShardBase
from tests.conftest import Salon


def _diff(dsn: str, metadata) -> list:  # type: ignore[no-untyped-def]
    engine = create_engine(dsn)
    try:
        with engine.connect() as conn:
            return compare_metadata(MigrationContext.configure(conn), metadata)
    finally:
        engine.dispose()


def test_master_schema_matches_models() -> None:
    assert _diff(os.environ["ADELANTE_MASTER_DB_DSN_SYNC"], MasterBase.metadata) == []


def test_shard_schema_matches_models(new_salon: Salon) -> None:
    import cli
    from app.models.master import Salon as SalonModel

    with cli._master_session() as session:
        info = cli._conn_info(session.get(SalonModel, new_salon.id))
    assert _diff(info.build_dsn(driver="psycopg"), ShardBase.metadata) == []
