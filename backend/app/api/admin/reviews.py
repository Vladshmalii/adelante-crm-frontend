"""Отзывы клиентов — вкладка «Отзывы» на overview.

Создание отзыва — публичное, по одноразовому review_token записи
(POST /api/booking/{slug}/reviews); здесь — только чтение.
"""

import uuid
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select

from app.api.schemas import ApiModel, Envelope, PersonRef, page_meta
from app.api.security import require_salon_access
from app.models.shard import Review
from app.tenancy.deps import TenantSession

router = APIRouter(
    prefix="/reviews", tags=["reviews"], dependencies=[Depends(require_salon_access)]
)

# type → диапазон рейтинга (соответствует вкладкам фронта)
TYPE_RANGES = {"positive": (4, 5), "neutral": (3, 3), "negative": (1, 2)}


class ReviewOut(ApiModel):
    id: uuid.UUID
    rating: int
    text: str | None
    created_at: datetime
    client: PersonRef
    master: PersonRef
    record_id: uuid.UUID


@router.get("", response_model=Envelope[list[ReviewOut]])
async def list_reviews(
    tenant_session: TenantSession,
    date_from: Annotated[datetime | None, Query(alias="dateFrom")] = None,
    date_to: Annotated[datetime | None, Query(alias="dateTo")] = None,
    rating: Annotated[int | None, Query(ge=1, le=5)] = None,
    review_type: Annotated[str | None, Query(alias="type")] = None,
    page: int = 1,
    per_page: Annotated[int, Query(alias="perPage", le=200)] = 50,
) -> Envelope[list[ReviewOut]]:
    query = select(Review)
    if date_from is not None:
        query = query.where(Review.created_at >= date_from)
    if date_to is not None:
        query = query.where(Review.created_at < date_to)
    if rating is not None:
        query = query.where(Review.rating == rating)
    if review_type in TYPE_RANGES:
        low, high = TYPE_RANGES[review_type]
        query = query.where(Review.rating.between(low, high))

    total = await tenant_session.scalar(select(func.count()).select_from(query.subquery()))
    reviews = await tenant_session.scalars(
        query.order_by(Review.created_at.desc()).offset((page - 1) * per_page).limit(per_page)
    )
    return Envelope(
        data=[
            ReviewOut(
                id=r.id,
                rating=r.rating,
                text=r.text,
                created_at=r.created_at,
                client=PersonRef(id=str(r.client_id), name=r.client_name),
                master=PersonRef(id=str(r.master_id), name=r.master_name),
                record_id=r.record_id,
            )
            for r in reviews
        ],
        meta=page_meta(page, per_page, total or 0),
    )
