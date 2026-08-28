"""Bot API — service-to-service API для Telegram-бота.

Auth: X-API-Key. Бот не имеет доступа к БД и не является источником
авторизации: он передаёт telegram_user_id, а API сам решает, кем является
этот пользователь и что ему позволено.
"""

import uuid

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select

from app.api.security import verify_bot_api_key
from app.models.master import Administrator, Client, Master
from app.tenancy.deps import MasterSession

router = APIRouter(
    prefix="/api/bot",
    tags=["bot"],
    dependencies=[Depends(verify_bot_api_key)],
)


class IdentifyOut(BaseModel):
    role: str | None  # administrator | master | client | None (незнакомец)
    user_id: uuid.UUID | None
    name: str | None
    salon_ids: list[uuid.UUID] = []


@router.get("/identify", response_model=IdentifyOut)
async def identify(
    telegram_user_id: int,
    master_session: MasterSession,
) -> IdentifyOut:
    """Определяет, кто пишет боту, по telegram_user_id (только Master DB)."""
    admin = await master_session.scalar(
        select(Administrator).where(
            Administrator.telegram_user_id == telegram_user_id,
            Administrator.is_active.is_(True),
        )
    )
    if admin is not None:
        return IdentifyOut(
            role="administrator",
            user_id=admin.id,
            name=admin.full_name,
            salon_ids=[s.id for s in admin.salons],
        )

    master = await master_session.scalar(
        select(Master).where(
            Master.telegram_user_id == telegram_user_id, Master.is_active.is_(True)
        )
    )
    if master is not None:
        return IdentifyOut(
            role="master",
            user_id=master.id,
            name=master.full_name,
            salon_ids=[s.id for s in master.salons],
        )

    client = await master_session.scalar(
        select(Client).where(
            Client.telegram_user_id == telegram_user_id, Client.is_active.is_(True)
        )
    )
    if client is not None:
        return IdentifyOut(role="client", user_id=client.id, name=client.full_name)

    return IdentifyOut(role=None, user_id=None, name=None)


class LinkClientRequest(BaseModel):
    phone: str
    telegram_user_id: int


@router.post("/clients/link-telegram", response_model=IdentifyOut)
async def link_client_telegram(
    body: LinkClientRequest,
    master_session: MasterSession,
) -> IdentifyOut:
    """Привязывает telegram_user_id к клиенту по телефону (шаг онбординга в боте)."""
    client = await master_session.scalar(
        select(Client).where(Client.phone == body.phone, Client.is_active.is_(True))
    )
    if client is None:
        return IdentifyOut(role=None, user_id=None, name=None)
    client.telegram_user_id = body.telegram_user_id
    return IdentifyOut(role="client", user_id=client.id, name=client.full_name)
