"""Лента изменений салона — вкладка «Изменения» на overview."""

import uuid
from datetime import datetime
from typing import Annotated, Any

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select

from app.api.schemas import ApiModel, Envelope, PersonRef, page_meta
from app.api.security import require_salon_access
from app.models.shard import AuditAction, AuditLog
from app.tenancy.deps import TenantSession

router = APIRouter(prefix="/audit", tags=["audit"], dependencies=[Depends(require_salon_access)])


class AuditOut(ApiModel):
    id: uuid.UUID
    created_at: datetime
    entity: str
    entity_id: str
    entity_name: str
    action: AuditAction
    author: PersonRef
    details: dict[str, Any] | None


@router.get("", response_model=Envelope[list[AuditOut]])
async def list_audit(
    tenant_session: TenantSession,
    date_from: Annotated[datetime | None, Query(alias="dateFrom")] = None,
    date_to: Annotated[datetime | None, Query(alias="dateTo")] = None,
    entity: str | None = None,
    action: AuditAction | None = None,
    author_id: Annotated[uuid.UUID | None, Query(alias="authorId")] = None,
    page: int = 1,
    per_page: Annotated[int, Query(alias="perPage", le=200)] = 50,
) -> Envelope[list[AuditOut]]:
    query = select(AuditLog)
    if date_from is not None:
        query = query.where(AuditLog.created_at >= date_from)
    if date_to is not None:
        query = query.where(AuditLog.created_at < date_to)
    if entity:
        query = query.where(AuditLog.entity == entity)
    if action is not None:
        query = query.where(AuditLog.action == action)
    if author_id is not None:
        query = query.where(AuditLog.author_id == author_id)

    total = await tenant_session.scalar(select(func.count()).select_from(query.subquery()))
    rows = await tenant_session.scalars(
        query.order_by(AuditLog.created_at.desc()).offset((page - 1) * per_page).limit(per_page)
    )
    return Envelope(
        data=[
            AuditOut(
                id=a.id,
                created_at=a.created_at,
                entity=a.entity,
                entity_id=a.entity_id,
                entity_name=a.entity_name,
                action=a.action,
                author=PersonRef(id=str(a.author_id) if a.author_id else None, name=a.author_name),
                details=a.details,
            )
            for a in rows
        ],
        meta=page_meta(page, per_page, total or 0),
    )
