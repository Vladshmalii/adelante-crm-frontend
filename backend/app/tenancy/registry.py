"""Двухуровневый кэш подключений к шард-БД.

L1 — живые AsyncEngine в памяти процесса (ленивое создание, per-key lock,
LRU-эвикция). L2 — метаданные подключения в Redis (`salon:conn:{id}`),
источник истины маппинга. Фолбэк при недоступности Redis — реестр в Master DB.
Инвалидация — pub/sub канал `salon:conn:invalidate`.
"""

import asyncio
import contextlib
import logging
import os
from collections import OrderedDict
from uuid import UUID

from pydantic import BaseModel
from redis.asyncio import Redis
from redis.exceptions import RedisError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.config import Settings
from app.models.master import Salon, SalonStatus

logger = logging.getLogger(__name__)

CONN_KEY = "salon:conn:{salon_id}"
SLUG_KEY = "salon:slug:{slug}"
INVALIDATE_CHANNEL = "salon:conn:invalidate"


class SalonNotFound(Exception):
    pass


class SalonSuspended(Exception):
    pass


class SalonConnInfo(BaseModel):
    salon_id: UUID
    slug: str
    db_host: str
    db_port: int
    db_name: str
    db_user: str
    # Имя переменной окружения с паролем роли шарда — сам пароль
    # не попадает ни в Redis, ни в Master DB.
    secret_env: str
    status: SalonStatus

    def build_dsn(self, driver: str = "asyncpg") -> str:
        password = os.environ.get(self.secret_env)
        if not password:
            raise RuntimeError(
                f"Переменная окружения {self.secret_env!r} с паролем шарда не задана"
            )
        return (
            f"postgresql+{driver}://{self.db_user}:{password}"
            f"@{self.db_host}:{self.db_port}/{self.db_name}"
        )


class EngineRegistry:
    def __init__(
        self,
        settings: Settings,
        redis: Redis,
        master_sessionmaker: async_sessionmaker[AsyncSession],
    ) -> None:
        self._settings = settings
        self._redis = redis
        self._master_sessionmaker = master_sessionmaker
        self._engines: OrderedDict[UUID, AsyncEngine] = OrderedDict()
        self._sessionmakers: dict[UUID, async_sessionmaker[AsyncSession]] = {}
        self._locks: dict[UUID, asyncio.Lock] = {}

    async def get_engine(self, salon_id: UUID) -> AsyncEngine:
        engine = self._engines.get(salon_id)
        if engine is not None:
            self._engines.move_to_end(salon_id)
            return engine

        lock = self._locks.setdefault(salon_id, asyncio.Lock())
        async with lock:
            engine = self._engines.get(salon_id)
            if engine is not None:
                return engine

            info = await self.resolve_conn_info(salon_id)
            if info.status != SalonStatus.ACTIVE:
                raise SalonSuspended(str(salon_id))

            engine = create_async_engine(
                info.build_dsn(),
                pool_size=self._settings.shard_pool_size,
                max_overflow=self._settings.shard_max_overflow,
                pool_pre_ping=True,
                pool_recycle=3600,
            )
            self._engines[salon_id] = engine
            self._sessionmakers[salon_id] = async_sessionmaker(engine, expire_on_commit=False)
            await self._evict_over_limit()
            return engine

    async def get_sessionmaker(self, salon_id: UUID) -> async_sessionmaker[AsyncSession]:
        await self.get_engine(salon_id)
        return self._sessionmakers[salon_id]

    async def resolve_conn_info(self, salon_id: UUID) -> SalonConnInfo:
        key = CONN_KEY.format(salon_id=salon_id)
        try:
            cached = await self._redis.get(key)
            if cached:
                return SalonConnInfo.model_validate_json(cached)
        except RedisError:
            logger.warning("Redis недоступен, читаю реестр из Master DB", exc_info=True)

        info = await self._load_from_master(salon_id)
        with contextlib.suppress(RedisError):
            await self._redis.set(key, info.model_dump_json(), ex=self._settings.conn_cache_ttl)
        return info

    async def resolve_slug(self, slug: str) -> UUID:
        key = SLUG_KEY.format(slug=slug)
        try:
            cached = await self._redis.get(key)
            if cached:
                return UUID(cached.decode() if isinstance(cached, bytes) else cached)
        except RedisError:
            pass

        async with self._master_sessionmaker() as session:
            salon_id = await session.scalar(select(Salon.id).where(Salon.slug == slug))
        if salon_id is None:
            raise SalonNotFound(slug)
        with contextlib.suppress(RedisError):
            await self._redis.set(key, str(salon_id), ex=self._settings.conn_cache_ttl)
        return salon_id

    async def _load_from_master(self, salon_id: UUID) -> SalonConnInfo:
        async with self._master_sessionmaker() as session:
            salon = await session.get(Salon, salon_id)
        if salon is None:
            raise SalonNotFound(str(salon_id))
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

    async def invalidate(self, salon_id: UUID) -> None:
        engine = self._engines.pop(salon_id, None)
        self._sessionmakers.pop(salon_id, None)
        if engine is not None:
            await engine.dispose()
            logger.info("Engine салона %s инвалидирован", salon_id)

    async def run_invalidation_listener(self) -> None:
        """Фоновая задача процесса: слушает pub/sub и сбрасывает L1."""
        while True:
            try:
                async with self._redis.pubsub() as pubsub:
                    await pubsub.subscribe(INVALIDATE_CHANNEL)
                    async for message in pubsub.listen():
                        if message["type"] != "message":
                            continue
                        try:
                            await self.invalidate(UUID(str(message["data"])))
                        except ValueError:
                            logger.warning("Некорректный salon_id в инвалидации: %r", message)
            except asyncio.CancelledError:
                raise
            except RedisError:
                logger.warning("Потеряна подписка на инвалидацию, переподключение через 5с")
                await asyncio.sleep(5)

    async def _evict_over_limit(self) -> None:
        while len(self._engines) > self._settings.shard_engine_cache_max:
            salon_id, engine = self._engines.popitem(last=False)
            self._sessionmakers.pop(salon_id, None)
            await engine.dispose()
            logger.info("LRU-эвикция engine салона %s", salon_id)

    async def dispose_all(self) -> None:
        for engine in self._engines.values():
            await engine.dispose()
        self._engines.clear()
        self._sessionmakers.clear()
