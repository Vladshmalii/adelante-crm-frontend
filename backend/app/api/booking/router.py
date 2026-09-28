"""Booking API — публичный сайт записи. Без аутентификации.

Салон определяется slug'ом в path (клиент не управляет заголовками).

Флоу сайта: услуга (GET /services) → мастер (GET /masters?service_id=, можно
«будь-який майстер») → день (GET /availability) → время (GET /slots) →
запись (POST /records). В записи с сайта одна услуга.

Идемпотентность создания записи — заголовок Idempotency-Key + Redis SETNX:
повтор с тем же ключом возвращает ту же запись, а не дубль/лишний 409.
Антиспам — лимит записей в час на IP и на телефон.
"""

import contextlib
import uuid
from datetime import UTC, date, datetime, timedelta
from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Header, HTTPException, Query, Request, status
from pydantic import BaseModel, Field
from redis.exceptions import RedisError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models.master import Master, Salon, master_salons
from app.models.shard import (
    Record,
    RecordSource,
    RecordStatus,
    Review,
    Service,
    ServiceStatus,
    StaffProfile,
    StaffStatus,
    service_masters,
)
from app.notifications.outbox import REVIEW_CREATED, add_outbox_event
from app.services import records as records_service
from app.services import slots as slots_service
from app.tenancy.deps import MasterSession, SalonIdBySlug, TenantSessionBySlug
from app.timeutils import SALON_TZ_NAME, LocalDatetime, now_local, to_local

router = APIRouter(prefix="/api/booking/{salon_slug}", tags=["booking"])

IDEMPOTENCY_TTL = 600
RATE_WINDOW = 3600
# Сколько дней вперёд открыта запись
BOOKING_HORIZON_DAYS = 90


# --- Салон и каталог ----------------------------------------------------------


class SalonOut(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    timezone: str


@router.get("/salon", response_model=SalonOut)
async def get_salon(salon_id: SalonIdBySlug, master_session: MasterSession) -> SalonOut:
    salon = await master_session.get(Salon, salon_id)
    if salon is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Салон не найден")
    return SalonOut(id=salon.id, name=salon.name, slug=salon.slug, timezone=SALON_TZ_NAME)


class ServiceOut(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None
    category: str
    color: str | None
    price: Decimal
    duration_minutes: int

    model_config = {"from_attributes": True}


@router.get("/services", response_model=list[ServiceOut])
async def list_services(tenant_session: TenantSessionBySlug) -> list[Service]:
    """Активные услуги, которые выполняет хотя бы один мастер."""
    result = await tenant_session.scalars(
        select(Service)
        .where(
            Service.status == ServiceStatus.ACTIVE,
            Service.id.in_(select(service_masters.c.service_id)),
        )
        .order_by(Service.category, Service.name)
    )
    return list(result)


async def _get_service(tenant_session: AsyncSession, service_id: uuid.UUID) -> Service:
    service = await tenant_session.get(Service, service_id)
    if service is None or service.status != ServiceStatus.ACTIVE:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Услуга не найдена")
    return service


async def _capable_masters(
    master_session: AsyncSession,
    tenant_session: AsyncSession,
    salon_id: uuid.UUID,
    service_id: uuid.UUID,
) -> list[Master]:
    """Мастера салона, которые выполняют услугу и сейчас работают (не уволены)."""
    linked: set[uuid.UUID] = set(
        await tenant_session.scalars(
            select(service_masters.c.master_id).where(service_masters.c.service_id == service_id)
        )
    )
    if not linked:
        return []
    fired = set(
        await tenant_session.scalars(
            select(StaffProfile.master_id).where(
                StaffProfile.master_id.in_(linked), StaffProfile.status == StaffStatus.FIRED
            )
        )
    )
    masters = await master_session.scalars(
        select(Master)
        .join(master_salons, master_salons.c.master_id == Master.id)
        .where(
            Master.id.in_(linked - fired),
            Master.is_active.is_(True),
            master_salons.c.salon_id == salon_id,
            master_salons.c.is_active.is_(True),
        )
        .order_by(Master.first_name, Master.last_name)
    )
    return list(masters)


class MasterOut(BaseModel):
    id: uuid.UUID
    name: str
    avatar_url: str | None
    specializations: list[str]


@router.get("/masters", response_model=list[MasterOut])
async def list_masters(
    salon_id: SalonIdBySlug,
    master_session: MasterSession,
    tenant_session: TenantSessionBySlug,
    service_id: uuid.UUID,
) -> list[MasterOut]:
    await _get_service(tenant_session, service_id)
    masters = await _capable_masters(master_session, tenant_session, salon_id, service_id)
    profiles = {
        p.master_id: p
        for p in await tenant_session.scalars(
            select(StaffProfile).where(StaffProfile.master_id.in_([m.id for m in masters]))
        )
    }
    return [
        MasterOut(
            id=m.id,
            name=m.full_name,
            avatar_url=m.avatar_url,
            specializations=(profiles[m.id].specializations or []) if m.id in profiles else [],
        )
        for m in masters
    ]


async def _masters_for(
    master_session: AsyncSession,
    tenant_session: AsyncSession,
    salon_id: uuid.UUID,
    service_id: uuid.UUID,
    master_id: uuid.UUID | None,
) -> list[Master]:
    """Выбранный мастер или все подходящие («будь-який майстер»)."""
    masters = await _capable_masters(master_session, tenant_session, salon_id, service_id)
    if master_id is None:
        return masters
    chosen = [m for m in masters if m.id == master_id]
    if not chosen:
        raise HTTPException(422, "Мастер не выполняет эту услугу")
    return chosen


def _booking_window() -> tuple[date, date]:
    today = now_local().date()
    return today, today + timedelta(days=BOOKING_HORIZON_DAYS)


# --- Свободное время ----------------------------------------------------------


class SlotOut(BaseModel):
    start_at: datetime
    label: str
    # Мастера, свободные в это время (для «будь-який майстер» — несколько)
    master_ids: list[uuid.UUID]


@router.get("/slots", response_model=list[SlotOut])
async def list_slots(
    salon_id: SalonIdBySlug,
    master_session: MasterSession,
    tenant_session: TenantSessionBySlug,
    service_id: uuid.UUID,
    day: Annotated[date, Query(alias="date")],
    master_id: uuid.UUID | None = None,
) -> list[SlotOut]:
    service = await _get_service(tenant_session, service_id)
    first, last = _booking_window()
    if not first <= day <= last:
        return []
    masters = await _masters_for(master_session, tenant_session, salon_id, service_id, master_id)

    by_time: dict[datetime, SlotOut] = {}
    for master in masters:
        for slot in await slots_service.free_slots(
            tenant_session,
            master_id=master.id,
            day=day,
            duration=timedelta(minutes=service.duration_minutes),
            not_before=datetime.now(UTC),
        ):
            item = by_time.setdefault(
                slot.start_at, SlotOut(start_at=slot.start_at, label=slot.label, master_ids=[])
            )
            item.master_ids.append(master.id)
    return [by_time[t] for t in sorted(by_time)]


class AvailabilityOut(BaseModel):
    # Дни (киевские даты), где есть хотя бы один свободный слот
    dates: list[date]


@router.get("/availability", response_model=AvailabilityOut)
async def availability(
    salon_id: SalonIdBySlug,
    master_session: MasterSession,
    tenant_session: TenantSessionBySlug,
    service_id: uuid.UUID,
    month: Annotated[str, Query(pattern=r"^\d{4}-\d{2}$", description="YYYY-MM")],
    master_id: uuid.UUID | None = None,
) -> AvailabilityOut:
    service = await _get_service(tenant_session, service_id)
    year, mon = map(int, month.split("-"))
    if not 1 <= mon <= 12:
        raise HTTPException(422, "Неверный месяц")
    month_start = date(year, mon, 1)
    month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
    window_first, window_last = _booking_window()
    first, last = max(month_start, window_first), min(month_end, window_last)
    if first > last:
        return AvailabilityOut(dates=[])

    masters = await _masters_for(master_session, tenant_session, salon_id, service_id, master_id)
    days: set[date] = set()
    for master in masters:
        days |= await slots_service.free_days(
            tenant_session,
            master_id=master.id,
            first_day=first,
            last_day=last,
            duration=timedelta(minutes=service.duration_minutes),
            not_before=datetime.now(UTC),
        )
    return AvailabilityOut(dates=sorted(days))


# --- Создание записи ----------------------------------------------------------


class BookingCreate(BaseModel):
    # Не указан — «будь-який майстер»: первый свободный из подходящих
    master_id: uuid.UUID | None = None
    service_id: uuid.UUID
    start_at: LocalDatetime
    client_name: str = Field(min_length=1, max_length=255)
    client_phone: str = Field(min_length=5, max_length=32)
    comment: str | None = Field(default=None, max_length=2000)


class BookingOut(BaseModel):
    record_id: uuid.UUID
    start_at: datetime
    end_at: datetime
    master_id: uuid.UUID
    master_name: str
    service_name: str
    price: Decimal


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


async def _check_rate_limit(request: Request, salon_id: uuid.UUID, phone: str) -> None:
    settings = get_settings()
    redis = request.app.state.redis
    limits = {
        f"rl:booking:{salon_id}:ip:{_client_ip(request)}": settings.booking_rate_limit_per_ip,
        f"rl:booking:{salon_id}:phone:{phone}": settings.booking_rate_limit_per_phone,
    }
    try:
        for key, limit in limits.items():
            count = await redis.incr(key)
            if count == 1:
                await redis.expire(key, RATE_WINDOW)
            if count > limit:
                raise HTTPException(
                    status.HTTP_429_TOO_MANY_REQUESTS, "Слишком много записей, попробуйте позже"
                )
    except RedisError:
        # Redis недоступен — лучше пропустить запись, чем отказать клиенту
        return


@router.post("/records", response_model=BookingOut, status_code=status.HTTP_201_CREATED)
async def create_booking(
    salon_slug: str,
    body: BookingCreate,
    salon_id: SalonIdBySlug,
    tenant_session: TenantSessionBySlug,
    request: Request,
    idempotency_key: Annotated[str | None, Header(alias="Idempotency-Key")] = None,
) -> BookingOut:
    redis = request.app.state.redis
    idem_redis_key = f"idem:{salon_id}:{idempotency_key}" if idempotency_key else None

    # Повторный сабмит с тем же ключом → отдать первый результат
    if idem_redis_key:
        with contextlib.suppress(RedisError):
            cached = await redis.get(idem_redis_key)
            if cached:
                return BookingOut.model_validate_json(cached)

    _, last_day = _booking_window()
    if body.start_at <= datetime.now(UTC) or to_local(body.start_at).date() > last_day:
        raise HTTPException(422, "Выберите время в пределах доступного периода")
    await _check_rate_limit(request, salon_id, body.client_phone)
    service = await _get_service(tenant_session, body.service_id)
    duration = timedelta(minutes=service.duration_minutes)

    # Master-сессия открывается вручную: клиент создаётся (и коммитится) в
    # Master DB до записи в шард
    master_sessionmaker = request.app.state.master_sessionmaker
    async with master_sessionmaker() as master_session:
        try:
            candidates = await _masters_for(
                master_session, tenant_session, salon_id, body.service_id, body.master_id
            )
            candidates = [
                m
                for m in candidates
                if await slots_service.fits_schedule(
                    tenant_session,
                    master_id=m.id,
                    start_at=body.start_at,
                    end_at=body.start_at + duration,
                )
            ]
            if not candidates:
                raise HTTPException(status.HTTP_409_CONFLICT, "Это время недоступно")

            client = await records_service.get_or_create_client(
                master_session, name=body.client_name, phone=body.client_phone
            )
            if client.no_online_booking:
                raise records_service.ClientInactive(str(client.id))

            record: Record | None = None
            for master in candidates:
                try:
                    record = await records_service.create_record(
                        master_session=master_session,
                        tenant_session=tenant_session,
                        salon_id=salon_id,
                        data=records_service.NewRecord(
                            master_id=master.id,
                            service_ids=[service.id],
                            client_id=client.id,
                            start_at=body.start_at,
                            comment=body.comment,
                        ),
                        source=RecordSource.BOOKING,
                        check_slot=True,
                    )
                    break
                except records_service.SlotTaken:
                    continue
            if record is None:
                raise HTTPException(status.HTTP_409_CONFLICT, "Это время уже занято")
            await master_session.commit()
        except HTTPException:
            await master_session.rollback()
            raise
        except records_service.MasterUnavailable:
            await master_session.rollback()
            raise HTTPException(422, "Мастер недоступен")
        except records_service.ServiceUnavailable:
            await master_session.rollback()
            raise HTTPException(422, "Услуга недоступна")
        except records_service.ClientInactive:
            await master_session.rollback()
            raise HTTPException(422, "Онлайн-запись для этого клиента недоступна")
        except Exception:
            await master_session.rollback()
            raise

    assert record.master_id is not None and record.master_name is not None
    result = BookingOut(
        record_id=record.id,
        start_at=record.start_at,
        end_at=record.end_at,
        master_id=record.master_id,
        master_name=record.master_name,
        service_name=service.name,
        price=record.total_amount,
    )
    if idem_redis_key:
        with contextlib.suppress(RedisError):
            await redis.set(idem_redis_key, result.model_dump_json(), nx=True, ex=IDEMPOTENCY_TTL)
    return result


# --- Отзывы -------------------------------------------------------------------


class ReviewCreate(BaseModel):
    token: uuid.UUID
    rating: int = Field(ge=1, le=5)
    text: str | None = Field(default=None, max_length=4000)


class ReviewCreatedOut(BaseModel):
    review_id: uuid.UUID


@router.post("/reviews", response_model=ReviewCreatedOut, status_code=status.HTTP_201_CREATED)
async def create_review(
    salon_slug: str,
    body: ReviewCreate,
    salon_id: SalonIdBySlug,
    tenant_session: TenantSessionBySlug,
) -> ReviewCreatedOut:
    """Отзыв по одноразовому review_token из уведомления о завершённом визите."""
    record = await tenant_session.scalar(select(Record).where(Record.review_token == body.token))
    if (
        record is None
        or record.status != RecordStatus.COMPLETED
        or record.master_id is None
        or record.master_name is None
    ):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Ссылка недействительна")

    review = Review(
        record_id=record.id,
        client_id=record.client_id,
        master_id=record.master_id,
        client_name=record.client_name,
        master_name=record.master_name,
        rating=body.rating,
        text=body.text,
    )
    tenant_session.add(review)
    record.review_token = None  # токен одноразовый
    await tenant_session.flush()

    add_outbox_event(
        tenant_session,
        event_type=REVIEW_CREATED,
        salon_id=salon_id,
        payload={
            "review_id": str(review.id),
            "record_id": str(record.id),
            "rating": body.rating,
            "client_name": record.client_name,
            "master_id": str(record.master_id),
            "master_name": record.master_name,
        },
    )
    return ReviewCreatedOut(review_id=review.id)
