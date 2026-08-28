"""Booking API — публичный одностраничный сайт записи. Без аутентификации.

Салон определяется slug'ом в path (клиент не управляет заголовками).
Идемпотентность создания записи — заголовок Idempotency-Key + Redis SETNX:
повтор с тем же ключом возвращает ту же запись, а не дубль/лишний 409.
"""

import contextlib
import uuid
from datetime import datetime
from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Header, HTTPException, Request, status
from pydantic import BaseModel, Field
from redis.exceptions import RedisError
from sqlalchemy import select

from app.models.shard import (
    Record,
    RecordSource,
    RecordStatus,
    Review,
    Service,
    ServiceStatus,
)
from app.notifications.outbox import REVIEW_CREATED, add_outbox_event
from app.services import records as records_service
from app.tenancy.deps import SalonIdBySlug, TenantSessionBySlug

router = APIRouter(prefix="/api/booking/{salon_slug}", tags=["booking"])

IDEMPOTENCY_TTL = 600


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
    result = await tenant_session.scalars(
        select(Service).where(Service.status == ServiceStatus.ACTIVE).order_by(Service.name)
    )
    return list(result)


class BookingCreate(BaseModel):
    master_id: uuid.UUID
    service_id: uuid.UUID
    start_at: datetime
    client_name: str = Field(min_length=1, max_length=255)
    client_phone: str = Field(min_length=5, max_length=32)
    comment: str | None = None


class BookingOut(BaseModel):
    record_id: uuid.UUID
    start_at: datetime
    end_at: datetime
    master_name: str


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

    # Master-сессия открывается вручную: dependency get_master_session нужна
    # здесь вместе с tenant-сессией, но клиент создаётся до записи в шард
    master_sessionmaker = request.app.state.master_sessionmaker
    async with master_sessionmaker() as master_session:
        try:
            client = await records_service.get_or_create_client(
                master_session, name=body.client_name, phone=body.client_phone
            )
            record = await records_service.create_record(
                master_session=master_session,
                tenant_session=tenant_session,
                salon_id=salon_id,
                data=records_service.NewRecord(
                    master_id=body.master_id,
                    service_id=body.service_id,
                    client_id=client.id,
                    start_at=body.start_at,
                    comment=body.comment,
                ),
                source=RecordSource.BOOKING,
            )
            await master_session.commit()
        except records_service.SlotTaken:
            await master_session.rollback()
            raise HTTPException(status.HTTP_409_CONFLICT, "Это время уже занято")
        except records_service.MasterUnavailable:
            await master_session.rollback()
            raise HTTPException(422, "Мастер недоступен")
        except records_service.ServiceUnavailable:
            await master_session.rollback()
            raise HTTPException(422, "Услуга недоступна")
        except records_service.ClientInactive:
            await master_session.rollback()
            raise HTTPException(422, "Запись для этого клиента недоступна")
        except Exception:
            await master_session.rollback()
            raise

    result = BookingOut(
        record_id=record.id,
        start_at=record.start_at,
        end_at=record.end_at,
        master_name=record.master_name,
    )
    if idem_redis_key:
        with contextlib.suppress(RedisError):
            await redis.set(idem_redis_key, result.model_dump_json(), nx=True, ex=IDEMPOTENCY_TTL)
    return result


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
    if record is None or record.status != RecordStatus.COMPLETED:
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
            "rating": body.rating,
            "client_name": record.client_name,
            "master_name": record.master_name,
        },
    )
    return ReviewCreatedOut(review_id=review.id)
