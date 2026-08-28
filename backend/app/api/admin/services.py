"""Каталог услуг салона: CRUD, категории, привязка мастеров (many-to-many)."""

import uuid
from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import Field
from sqlalchemy import delete, func, insert, select

from app.api.admin.deps import CurrentAuthor
from app.api.schemas import ApiModel, Envelope, PersonRef
from app.api.security import require_salon_access
from app.models.master import Master, master_salons
from app.models.shard import AuditAction, Service, ServiceStatus, service_masters
from app.services.audit import diff_fields, write_audit
from app.tenancy.deps import MasterSession, SalonId, TenantSession

router = APIRouter(
    prefix="/services", tags=["services"], dependencies=[Depends(require_salon_access)]
)


class ServiceOut(ApiModel):
    id: uuid.UUID
    name: str
    description: str | None
    category: str
    color: str | None
    price: Decimal
    duration_minutes: int
    status: ServiceStatus
    masters: list[PersonRef] = Field(default_factory=list)


async def _masters_map(
    tenant_session, master_session, service_ids: list[uuid.UUID]
) -> dict[uuid.UUID, list[PersonRef]]:
    if not service_ids:
        return {}
    links = (
        await tenant_session.execute(
            select(service_masters.c.service_id, service_masters.c.master_id).where(
                service_masters.c.service_id.in_(service_ids)
            )
        )
    ).all()
    master_ids = {m for _, m in links}
    names: dict[uuid.UUID, str] = {}
    if master_ids:
        for m in await master_session.scalars(select(Master).where(Master.id.in_(master_ids))):
            names[m.id] = m.full_name
    result: dict[uuid.UUID, list[PersonRef]] = {}
    for service_id, master_id in links:
        result.setdefault(service_id, []).append(
            PersonRef(id=str(master_id), name=names.get(master_id))
        )
    return result


def _service_out(service: Service, masters: list[PersonRef]) -> ServiceOut:
    out = ServiceOut.model_validate(service)
    out.masters = masters
    return out


@router.get("", response_model=Envelope[list[ServiceOut]])
async def list_services(
    tenant_session: TenantSession,
    master_session: MasterSession,
    category: str | None = None,
    service_status: Annotated[ServiceStatus | None, Query(alias="status")] = None,
    price_from: Annotated[Decimal | None, Query(alias="priceFrom")] = None,
    price_to: Annotated[Decimal | None, Query(alias="priceTo")] = None,
    query_text: Annotated[str | None, Query(alias="query")] = None,
) -> Envelope[list[ServiceOut]]:
    query = select(Service)
    if category:
        query = query.where(Service.category == category)
    if service_status is not None:
        query = query.where(Service.status == service_status)
    else:
        query = query.where(Service.status != ServiceStatus.ARCHIVED)
    if price_from is not None:
        query = query.where(Service.price >= price_from)
    if price_to is not None:
        query = query.where(Service.price <= price_to)
    if query_text:
        query = query.where(Service.name.ilike(f"%{query_text}%"))

    services = list(await tenant_session.scalars(query.order_by(Service.name)))
    masters = await _masters_map(tenant_session, master_session, [s.id for s in services])
    return Envelope(data=[_service_out(s, masters.get(s.id, [])) for s in services])


class ServiceCreateIn(ApiModel):
    name: str = Field(min_length=1, max_length=255)
    description: str | None = None
    category: str = "other"
    color: str | None = None
    price: Decimal = Field(ge=0)
    duration_minutes: int = Field(default=60, gt=0)
    status: ServiceStatus = ServiceStatus.ACTIVE
    master_ids: list[uuid.UUID] = Field(default_factory=list)


async def _validate_masters(
    master_session, salon_id: uuid.UUID, master_ids: list[uuid.UUID]
) -> None:
    if not master_ids:
        return
    bound = set(
        await master_session.scalars(
            select(master_salons.c.master_id).where(
                master_salons.c.salon_id == salon_id,
                master_salons.c.master_id.in_(master_ids),
            )
        )
    )
    missing = set(master_ids) - bound
    if missing:
        raise HTTPException(422, "Часть мастеров не работает в этом салоне")


@router.post("", response_model=Envelope[ServiceOut], status_code=status.HTTP_201_CREATED)
async def create_service(
    body: ServiceCreateIn,
    author: CurrentAuthor,
    salon_id: SalonId,
    master_session: MasterSession,
    tenant_session: TenantSession,
) -> Envelope[ServiceOut]:
    await _validate_masters(master_session, salon_id, body.master_ids)

    service = Service(**body.model_dump(by_alias=False, exclude={"master_ids"}))
    tenant_session.add(service)
    await tenant_session.flush()
    for master_id in body.master_ids:
        await tenant_session.execute(
            insert(service_masters).values(service_id=service.id, master_id=master_id)
        )

    write_audit(
        tenant_session,
        entity="service",
        entity_id=service.id,
        entity_name=service.name,
        action=AuditAction.CREATED,
        author_id=author.id,
        author_name=author.name,
    )
    masters = await _masters_map(tenant_session, master_session, [service.id])
    return Envelope(data=_service_out(service, masters.get(service.id, [])))


class ServicePatchIn(ApiModel):
    name: str | None = None
    description: str | None = None
    category: str | None = None
    color: str | None = None
    price: Decimal | None = Field(default=None, ge=0)
    duration_minutes: int | None = Field(default=None, gt=0)
    status: ServiceStatus | None = None
    master_ids: list[uuid.UUID] | None = None


@router.patch("/{service_id}", response_model=Envelope[ServiceOut])
async def patch_service(
    service_id: uuid.UUID,
    body: ServicePatchIn,
    author: CurrentAuthor,
    salon_id: SalonId,
    master_session: MasterSession,
    tenant_session: TenantSession,
) -> Envelope[ServiceOut]:
    service = await tenant_session.get(Service, service_id)
    if service is None:
        raise HTTPException(404, "Услуга не найдена")

    updates = body.model_dump(exclude_unset=True, by_alias=False)
    master_ids = updates.pop("master_ids", None)
    changes = diff_fields(service, updates)
    for field, value in updates.items():
        setattr(service, field, value)

    if master_ids is not None:
        await _validate_masters(master_session, salon_id, master_ids)
        await tenant_session.execute(
            delete(service_masters).where(service_masters.c.service_id == service_id)
        )
        for master_id in master_ids:
            await tenant_session.execute(
                insert(service_masters).values(service_id=service_id, master_id=master_id)
            )
        changes["masters"] = [None, [str(m) for m in master_ids]]

    if changes:
        write_audit(
            tenant_session,
            entity="service",
            entity_id=service.id,
            entity_name=service.name,
            action=AuditAction.UPDATED,
            author_id=author.id,
            author_name=author.name,
            details=changes,
        )
    masters = await _masters_map(tenant_session, master_session, [service.id])
    return Envelope(data=_service_out(service, masters.get(service.id, [])))


@router.delete("/{service_id}", response_model=Envelope[ServiceOut])
async def archive_service(
    service_id: uuid.UUID,
    author: CurrentAuthor,
    master_session: MasterSession,
    tenant_session: TenantSession,
) -> Envelope[ServiceOut]:
    """Архивирование вместо удаления — на услугу ссылаются записи."""
    service = await tenant_session.get(Service, service_id)
    if service is None:
        raise HTTPException(404, "Услуга не найдена")
    service.status = ServiceStatus.ARCHIVED
    write_audit(
        tenant_session,
        entity="service",
        entity_id=service.id,
        entity_name=service.name,
        action=AuditAction.DELETED,
        author_id=author.id,
        author_name=author.name,
    )
    masters = await _masters_map(tenant_session, master_session, [service.id])
    return Envelope(data=_service_out(service, masters.get(service.id, [])))


class CategoryOut(ApiModel):
    category: str
    count: int


@router.get("/categories", response_model=Envelope[list[CategoryOut]])
async def list_categories(tenant_session: TenantSession) -> Envelope[list[CategoryOut]]:
    rows = await tenant_session.execute(
        select(Service.category, func.count())
        .where(Service.status != ServiceStatus.ARCHIVED)
        .group_by(Service.category)
        .order_by(Service.category)
    )
    return Envelope(data=[CategoryOut(category=c, count=n) for c, n in rows])
