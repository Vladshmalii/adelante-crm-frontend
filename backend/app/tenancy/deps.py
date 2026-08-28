"""FastAPI-зависимости тенант-роутинга.

Admin/Bot API: салон определяется заголовком X-Salon-Id.
Booking API: салон определяется slug'ом в path (публичный клиент
заголовком не управляет), резолвится через тот же кэш.
"""

from collections.abc import AsyncIterator
from typing import Annotated
from uuid import UUID

from fastapi import Depends, Header, HTTPException, Path, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.tenancy.registry import EngineRegistry, SalonNotFound, SalonSuspended

SALON_HEADER = "X-Salon-Id"


def get_registry(request: Request) -> EngineRegistry:
    return request.app.state.engine_registry


async def get_salon_id(
    x_salon_id: Annotated[UUID, Header(alias=SALON_HEADER)],
) -> UUID:
    return x_salon_id


async def get_salon_id_from_slug(
    salon_slug: Annotated[str, Path()],
    registry: Annotated[EngineRegistry, Depends(get_registry)],
) -> UUID:
    try:
        return await registry.resolve_slug(salon_slug)
    except SalonNotFound:
        raise HTTPException(status_code=404, detail="Салон не найден")


async def _open_tenant_session(
    registry: EngineRegistry, salon_id: UUID
) -> AsyncIterator[AsyncSession]:
    try:
        factory = await registry.get_sessionmaker(salon_id)
    except SalonNotFound:
        raise HTTPException(status_code=404, detail="Салон не найден")
    except SalonSuspended:
        raise HTTPException(status_code=403, detail="Салон приостановлен")

    async with factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def get_tenant_session(
    salon_id: Annotated[UUID, Depends(get_salon_id)],
    registry: Annotated[EngineRegistry, Depends(get_registry)],
) -> AsyncIterator[AsyncSession]:
    async for session in _open_tenant_session(registry, salon_id):
        yield session


async def get_tenant_session_by_slug(
    salon_id: Annotated[UUID, Depends(get_salon_id_from_slug)],
    registry: Annotated[EngineRegistry, Depends(get_registry)],
) -> AsyncIterator[AsyncSession]:
    async for session in _open_tenant_session(registry, salon_id):
        yield session


async def get_master_session(request: Request) -> AsyncIterator[AsyncSession]:
    factory = request.app.state.master_sessionmaker
    async with factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


TenantSession = Annotated[AsyncSession, Depends(get_tenant_session)]
TenantSessionBySlug = Annotated[AsyncSession, Depends(get_tenant_session_by_slug)]
MasterSession = Annotated[AsyncSession, Depends(get_master_session)]
SalonId = Annotated[UUID, Depends(get_salon_id)]
SalonIdBySlug = Annotated[UUID, Depends(get_salon_id_from_slug)]
