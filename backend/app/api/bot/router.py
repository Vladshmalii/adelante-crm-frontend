"""Bot API — service-to-service API для Telegram-бота.

Auth: X-API-Key. Бот не имеет доступа к БД и не является источником
авторизации: он передаёт telegram_user_id, а API сам решает, кем является
этот пользователь и что ему позволено.

Бот не создаёт записи (решение от 28.09.2026): клиентам он напоминает о
визитах и ведёт на сайт записи, мастерам — сообщает о новых, перенесённых и
отменённых записях и показывает записи на день.
"""

import logging
import uuid
from datetime import date, datetime
from typing import Annotated, cast

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.api.security import verify_bot_api_key
from app.config import Settings, get_settings
from app.models.master import Administrator, Client, Master, Salon, SalonStatus
from app.models.shard import Record, RecordStatus
from app.services.phones import phone_prefilter, same_phone
from app.tenancy.deps import MasterSession
from app.tenancy.registry import EngineRegistry, SalonNotFound, SalonSuspended
from app.timeutils import day_bounds

logger = logging.getLogger(__name__)

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
            salon_ids=[s.id for s in admin.active_salons],
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
            salon_ids=[s.id for s in master.active_salons],
        )

    client = await master_session.scalar(
        select(Client).where(
            Client.telegram_user_id == telegram_user_id, Client.is_active.is_(True)
        )
    )
    if client is not None:
        return IdentifyOut(role="client", user_id=client.id, name=client.full_name)

    return IdentifyOut(role=None, user_id=None, name=None)


class LinkTelegramRequest(BaseModel):
    phone: str
    telegram_user_id: int


@router.post("/link-telegram", response_model=IdentifyOut)
async def link_telegram(
    body: LinkTelegramRequest,
    master_session: MasterSession,
) -> IdentifyOut:
    """Привязывает Telegram по телефону из контакта (бот проверяет, что контакт свой).

    Привязываются все совпадения — администратор, мастер, клиент: мастер,
    который сам записывается как клиент, получает и уведомления мастера, и
    напоминания. Ответ — как у /identify (старшая роль).
    """
    models: list[type[Administrator | Master | Client]] = [Administrator, Master, Client]
    for model in models:
        candidates = cast(
            list[Administrator | Master | Client],
            list(
                await master_session.scalars(
                    select(model).where(
                        model.is_active.is_(True), phone_prefilter(model.phone, body.phone)
                    )
                )
            ),
        )
        for person in candidates:
            if not same_phone(person.phone, body.phone):
                continue
            if person.telegram_user_id not in (None, body.telegram_user_id):
                logger.info("%s %s уже привязан к другому Telegram", model.__name__, person.id)
                continue
            # Telegram-аккаунт мог быть привязан к другой записи этой таблицы
            try:
                async with master_session.begin_nested():
                    person.telegram_user_id = body.telegram_user_id
            except IntegrityError:
                logger.warning("Telegram %s уже привязан в %s", body.telegram_user_id, model)
    await master_session.flush()
    return await identify(body.telegram_user_id, master_session)


@router.post("/clients/link-telegram", response_model=IdentifyOut, deprecated=True)
async def link_client_telegram(
    body: LinkTelegramRequest,
    master_session: MasterSession,
) -> IdentifyOut:
    """Устарело: используйте POST /api/bot/link-telegram."""
    return await link_telegram(body, master_session)


class SalonLinkOut(BaseModel):
    id: uuid.UUID
    name: str
    booking_url: str


@router.get("/salons", response_model=list[SalonLinkOut])
async def list_salons(
    master_session: MasterSession,
    settings: Annotated[Settings, Depends(get_settings)],
) -> list[SalonLinkOut]:
    """Активные салоны со ссылками на сайт записи — бот ведёт туда клиентов."""
    salons = await master_session.scalars(
        select(Salon).where(Salon.status == SalonStatus.ACTIVE).order_by(Salon.name)
    )
    return [
        SalonLinkOut(id=s.id, name=s.name, booking_url=settings.booking_url(s.slug)) for s in salons
    ]


class MasterRecordOut(BaseModel):
    id: uuid.UUID
    start_at: datetime
    end_at: datetime
    status: RecordStatus
    client_name: str
    client_phone: str
    visitor_name: str | None
    services: list[str]
    comment: str | None


class SalonRecordsOut(BaseModel):
    salon_id: uuid.UUID
    salon_name: str
    records: list[MasterRecordOut]


class MasterDayOut(BaseModel):
    date: date
    master_name: str
    salons: list[SalonRecordsOut]


@router.get("/masters/records", response_model=MasterDayOut)
async def master_records(
    telegram_user_id: int,
    day: date,
    master_session: MasterSession,
    request: Request,
) -> MasterDayOut:
    """Записи мастера на дату (по Киеву) во всех его салонах, кроме отменённых."""
    master = await master_session.scalar(
        select(Master).where(
            Master.telegram_user_id == telegram_user_id, Master.is_active.is_(True)
        )
    )
    if master is None:
        raise HTTPException(404, "Майстра не знайдено")

    registry: EngineRegistry = request.app.state.engine_registry
    start, end = day_bounds(day)
    salons: list[SalonRecordsOut] = []
    for salon in master.active_salons:
        try:
            factory = await registry.get_sessionmaker(salon.id)
        except (SalonNotFound, SalonSuspended):
            continue
        async with factory() as tenant_session:
            records = list(
                await tenant_session.scalars(
                    select(Record)
                    .where(
                        Record.master_id == master.id,
                        Record.start_at >= start,
                        Record.start_at < end,
                        Record.status != RecordStatus.CANCELLED,
                    )
                    .order_by(Record.start_at)
                )
            )
            salons.append(
                SalonRecordsOut(
                    salon_id=salon.id,
                    salon_name=salon.name,
                    records=[
                        MasterRecordOut(
                            id=r.id,
                            start_at=r.start_at,
                            end_at=r.end_at,
                            status=r.status,
                            client_name=r.client_name,
                            client_phone=r.client_phone,
                            visitor_name=r.visitor_name,
                            services=[s.name for s in r.services],
                            comment=r.comment,
                        )
                        for r in records
                    ],
                )
            )
    return MasterDayOut(date=day, master_name=master.full_name, salons=salons)
