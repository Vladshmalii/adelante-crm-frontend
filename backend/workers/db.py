"""Синхронный доступ к Master DB и шардам для Celery-воркеров.

Воркеры работают на sync SQLAlchemy (psycopg): Celery-задачи не живут в
event loop. Кэш engine — аналог L1 из app.tenancy, но с threading.Lock;
метаданные подключения читаются из Redis с фолбэком в Master DB (тот же
контракт, что у EngineRegistry).
"""

import contextlib
import json
import logging
import threading
from uuid import UUID

import redis as redis_sync
from sqlalchemy import Engine, create_engine, select
from sqlalchemy.orm import Session, sessionmaker

from app.config import get_settings
from app.models.master import Salon, SalonStatus
from app.tenancy.registry import CONN_KEY, SalonConnInfo, SalonNotFound

logger = logging.getLogger(__name__)

_settings = get_settings()
_lock = threading.Lock()
_master_engine: Engine | None = None
_shard_engines: dict[UUID, Engine] = {}

redis_client = redis_sync.Redis.from_url(_settings.redis_url, decode_responses=True)


def get_master_engine() -> Engine:
    global _master_engine
    with _lock:
        if _master_engine is None:
            _master_engine = create_engine(_settings.master_db_dsn_sync, pool_pre_ping=True)
        return _master_engine


def master_session() -> Session:
    return sessionmaker(get_master_engine())()


def list_active_salon_ids() -> list[UUID]:
    with master_session() as session:
        return list(session.scalars(select(Salon.id).where(Salon.status == SalonStatus.ACTIVE)))


def resolve_conn_info(salon_id: UUID) -> SalonConnInfo:
    key = CONN_KEY.format(salon_id=salon_id)
    with contextlib.suppress(redis_sync.RedisError, json.JSONDecodeError):
        cached = redis_client.get(key)
        if cached:
            return SalonConnInfo.model_validate_json(cached)

    with master_session() as session:
        salon = session.get(Salon, salon_id)
    if salon is None:
        raise SalonNotFound(str(salon_id))
    info = SalonConnInfo(
        salon_id=salon.id,
        slug=salon.slug,
        db_host=salon.db_host,
        db_port=salon.db_port,
        db_name=salon.db_name,
        db_user=salon.db_user,
        secret_env=salon.secret_env,
        status=salon.status,
    )
    with contextlib.suppress(redis_sync.RedisError):
        redis_client.set(key, info.model_dump_json(), ex=_settings.conn_cache_ttl)
    return info


def get_shard_engine(salon_id: UUID) -> Engine:
    with _lock:
        engine = _shard_engines.get(salon_id)
        if engine is not None:
            return engine
    info = resolve_conn_info(salon_id)
    with _lock:
        engine = _shard_engines.get(salon_id)
        if engine is None:
            engine = create_engine(
                info.build_dsn(driver="psycopg"),
                pool_size=2,
                max_overflow=3,
                pool_pre_ping=True,
                pool_recycle=3600,
            )
            _shard_engines[salon_id] = engine
        return engine


def shard_session(salon_id: UUID) -> Session:
    return sessionmaker(get_shard_engine(salon_id))()
