"""Booking API: публичный список салонов — первый шаг сайта записи (`/booking`).

Только Master DB (slug, name), без обхода шардов. Ответ кэшируется в Redis на
SALONS_CACHE_TTL; сбрасывается при создании/приостановке салона (salonctl) и при
смене названия в «Налаштування → Салон». Путь не пересекается с
`/api/booking/{salon_slug}/…` (там всегда два сегмента), но slug `salons`
зарезервирован в salonctl, чтобы не путать URL фронта `/booking/salons`.
"""

import contextlib
import logging
from typing import Annotated

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, TypeAdapter
from redis.asyncio import Redis
from redis.exceptions import RedisError
from sqlalchemy import select

from app.models.master import Salon, SalonStatus
from app.services.text import uk_sort_key
from app.tenancy.deps import MasterSession

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/booking", tags=["booking"])

SALONS_CACHE_KEY = "booking:salons"
SALONS_CACHE_TTL = 300


class SalonListItemOut(BaseModel):
    slug: str
    name: str


_salons_adapter = TypeAdapter(list[SalonListItemOut])


def get_redis(request: Request) -> Redis:
    return request.app.state.redis


async def invalidate_salons_cache(redis: Redis) -> None:
    with contextlib.suppress(RedisError):
        await redis.delete(SALONS_CACHE_KEY)


@router.get("/salons", response_model=list[SalonListItemOut])
async def list_salons(
    master_session: MasterSession, redis: Annotated[Redis, Depends(get_redis)]
) -> list[SalonListItemOut]:
    """Активные салоны сети, по названию (украинский алфавит)."""
    try:
        cached = await redis.get(SALONS_CACHE_KEY)
        if cached:
            return _salons_adapter.validate_json(cached)
    except RedisError:
        logger.warning("Redis недоступен, список салонов — из Master DB", exc_info=True)

    salons = await master_session.scalars(select(Salon).where(Salon.status == SalonStatus.ACTIVE))
    items = sorted(
        (SalonListItemOut(slug=s.slug, name=s.name) for s in salons),
        key=lambda s: uk_sort_key(s.name),
    )
    with contextlib.suppress(RedisError):
        await redis.set(SALONS_CACHE_KEY, _salons_adapter.dump_json(items), ex=SALONS_CACHE_TTL)
    return items
