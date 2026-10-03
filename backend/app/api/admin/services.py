"""Каталог услуг салона: CRUD, категории, привязка мастеров (many-to-many).

Права: смотреть список и категории может любой сотрудник (мастер выбирает
услуги при записи к себе), менять — только администратор.

Категории — отдельная сущность (ServiceCategory); системная «Інше» не
удаляется и не переименовывается, в неё попадают услуги без категории и
услуги удалённых категорий.
"""

import uuid
from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import Field
from sqlalchemy import delete, func, insert, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.admin.deps import CurrentAuthor
from app.api.schemas import ApiModel, Envelope, PersonRef
from app.api.security import AdminUser, require_salon_access
from app.models.master import Master, master_salons
from app.models.shard import (
    AuditAction,
    Service,
    ServiceCategory,
    ServiceStatus,
    service_masters,
)
from app.services.audit import diff_fields, write_audit
from app.services.text import uk_sort_key
from app.tenancy.deps import MasterSession, SalonId, TenantSession

router = APIRouter(
    prefix="/services", tags=["services"], dependencies=[Depends(require_salon_access)]
)


SYSTEM_CATEGORY = "Інше"


class CategoryRef(ApiModel):
    id: uuid.UUID
    name: str


class ServiceOut(ApiModel):
    id: uuid.UUID
    name: str
    description: str | None
    category: CategoryRef
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


async def system_category(tenant_session: AsyncSession) -> ServiceCategory:
    category = await tenant_session.scalar(
        select(ServiceCategory).where(ServiceCategory.is_system.is_(True))
    )
    if category is None:
        category = ServiceCategory(name=SYSTEM_CATEGORY, is_system=True)
        tenant_session.add(category)
        await tenant_session.flush()
    return category


async def _category_id(tenant_session: AsyncSession, category_id: uuid.UUID | None) -> uuid.UUID:
    """Категория услуги; не указана — «Інше»."""
    if category_id is None:
        return (await system_category(tenant_session)).id
    if await tenant_session.get(ServiceCategory, category_id) is None:
        raise HTTPException(422, "Категорію не знайдено")
    return category_id


async def _with_category(tenant_session: AsyncSession, service: Service) -> Service:
    await tenant_session.flush()
    await tenant_session.refresh(service, attribute_names=["category"])
    return service


@router.get("", response_model=Envelope[list[ServiceOut]])
async def list_services(
    tenant_session: TenantSession,
    master_session: MasterSession,
    category_id: Annotated[uuid.UUID | None, Query(alias="categoryId")] = None,
    service_status: Annotated[ServiceStatus | None, Query(alias="status")] = None,
    price_from: Annotated[Decimal | None, Query(alias="priceFrom")] = None,
    price_to: Annotated[Decimal | None, Query(alias="priceTo")] = None,
    query_text: Annotated[str | None, Query(alias="query")] = None,
) -> Envelope[list[ServiceOut]]:
    query = select(Service)
    if category_id is not None:
        query = query.where(Service.category_id == category_id)
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
    # Не указана — «Інше»
    category_id: uuid.UUID | None = None
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
        raise HTTPException(422, "Частина майстрів не працює в цьому салоні")


@router.post("", response_model=Envelope[ServiceOut], status_code=status.HTTP_201_CREATED)
async def create_service(
    body: ServiceCreateIn,
    _admin: AdminUser,
    author: CurrentAuthor,
    salon_id: SalonId,
    master_session: MasterSession,
    tenant_session: TenantSession,
) -> Envelope[ServiceOut]:
    await _validate_masters(master_session, salon_id, body.master_ids)

    service = Service(
        **body.model_dump(by_alias=False, exclude={"master_ids", "category_id"}),
        category_id=await _category_id(tenant_session, body.category_id),
    )
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
    await _with_category(tenant_session, service)
    return Envelope(data=_service_out(service, masters.get(service.id, [])))


class ServicePatchIn(ApiModel):
    name: str | None = None
    description: str | None = None
    # null — перенести в «Інше»
    category_id: uuid.UUID | None = None
    color: str | None = None
    price: Decimal | None = Field(default=None, ge=0)
    duration_minutes: int | None = Field(default=None, gt=0)
    status: ServiceStatus | None = None
    master_ids: list[uuid.UUID] | None = None


@router.patch("/{service_id}", response_model=Envelope[ServiceOut])
async def patch_service(
    service_id: uuid.UUID,
    body: ServicePatchIn,
    _admin: AdminUser,
    author: CurrentAuthor,
    salon_id: SalonId,
    master_session: MasterSession,
    tenant_session: TenantSession,
) -> Envelope[ServiceOut]:
    service = await tenant_session.get(Service, service_id)
    if service is None:
        raise HTTPException(404, "Послугу не знайдено")

    updates = body.model_dump(exclude_unset=True, by_alias=False)
    master_ids = updates.pop("master_ids", None)
    if "category_id" in updates:
        updates["category_id"] = await _category_id(tenant_session, updates["category_id"])
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
    await _with_category(tenant_session, service)
    return Envelope(data=_service_out(service, masters.get(service.id, [])))


@router.delete("/{service_id}", response_model=Envelope[ServiceOut])
async def archive_service(
    service_id: uuid.UUID,
    _admin: AdminUser,
    author: CurrentAuthor,
    master_session: MasterSession,
    tenant_session: TenantSession,
) -> Envelope[ServiceOut]:
    """Архивирование вместо удаления — на услугу ссылаются записи."""
    service = await tenant_session.get(Service, service_id)
    if service is None:
        raise HTTPException(404, "Послугу не знайдено")
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


# --- Категории ------------------------------------------------------------------


class CategoryOut(ApiModel):
    id: uuid.UUID
    name: str
    is_system: bool
    # Неархивные услуги категории
    services_count: int


class CategoryIn(ApiModel):
    name: str = Field(min_length=1, max_length=128)


def _category_title(category: ServiceCategory) -> str:
    return f"Категорія послуг «{category.name}»"


async def _ensure_name_free(
    tenant_session: AsyncSession, name: str, exclude_id: uuid.UUID | None = None
) -> None:
    query = select(ServiceCategory.id).where(func.lower(ServiceCategory.name) == name.lower())
    if exclude_id is not None:
        query = query.where(ServiceCategory.id != exclude_id)
    if await tenant_session.scalar(query) is not None:
        raise HTTPException(409, "Категорія з такою назвою вже існує")


async def _counts(tenant_session: AsyncSession) -> dict[uuid.UUID, int]:
    rows = await tenant_session.execute(
        select(Service.category_id, func.count())
        .where(Service.status != ServiceStatus.ARCHIVED)
        .group_by(Service.category_id)
    )
    return {category_id: count for category_id, count in rows.all()}


def _category_out(category: ServiceCategory, counts: dict[uuid.UUID, int]) -> CategoryOut:
    return CategoryOut(
        id=category.id,
        name=category.name,
        is_system=category.is_system,
        services_count=counts.get(category.id, 0),
    )


def category_sort_key(category: ServiceCategory) -> tuple[bool, tuple[tuple[int, int], ...]]:
    """По алфавиту (украинскому), системная «Інше» — последней."""
    return category.is_system, uk_sort_key(category.name)


@router.get("/categories", response_model=Envelope[list[CategoryOut]])
async def list_categories(tenant_session: TenantSession) -> Envelope[list[CategoryOut]]:
    await system_category(tenant_session)
    categories = sorted(
        await tenant_session.scalars(select(ServiceCategory)), key=category_sort_key
    )
    counts = await _counts(tenant_session)
    return Envelope(data=[_category_out(c, counts) for c in categories])


@router.post(
    "/categories", response_model=Envelope[CategoryOut], status_code=status.HTTP_201_CREATED
)
async def create_category(
    body: CategoryIn,
    _admin: AdminUser,
    author: CurrentAuthor,
    tenant_session: TenantSession,
) -> Envelope[CategoryOut]:
    name = body.name.strip()
    if not name:
        raise HTTPException(422, "Назва категорії обов'язкова")
    await _ensure_name_free(tenant_session, name)
    category = ServiceCategory(name=name, is_system=False)
    tenant_session.add(category)
    await tenant_session.flush()
    write_audit(
        tenant_session,
        entity="service",
        entity_id=category.id,
        entity_name=_category_title(category),
        action=AuditAction.CREATED,
        author_id=author.id,
        author_name=author.name,
    )
    return Envelope(data=_category_out(category, {}))


async def _editable(tenant_session: AsyncSession, category_id: uuid.UUID) -> ServiceCategory:
    category = await tenant_session.get(ServiceCategory, category_id)
    if category is None:
        raise HTTPException(404, "Категорію не знайдено")
    if category.is_system:
        raise HTTPException(409, "Системну категорію не можна змінити")
    return category


@router.patch("/categories/{category_id}", response_model=Envelope[CategoryOut])
async def rename_category(
    category_id: uuid.UUID,
    body: CategoryIn,
    _admin: AdminUser,
    author: CurrentAuthor,
    tenant_session: TenantSession,
) -> Envelope[CategoryOut]:
    category = await _editable(tenant_session, category_id)
    name = body.name.strip()
    if not name:
        raise HTTPException(422, "Назва категорії обов'язкова")
    await _ensure_name_free(tenant_session, name, exclude_id=category.id)
    old = category.name
    category.name = name
    if old != name:
        write_audit(
            tenant_session,
            entity="service",
            entity_id=category.id,
            entity_name=_category_title(category),
            action=AuditAction.UPDATED,
            author_id=author.id,
            author_name=author.name,
            details={"name": [old, name]},
        )
    return Envelope(data=_category_out(category, await _counts(tenant_session)))


@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: uuid.UUID,
    _admin: AdminUser,
    author: CurrentAuthor,
    tenant_session: TenantSession,
) -> None:
    """Удаление: все услуги категории (включая архивные) переходят в «Інше»."""
    category = await _editable(tenant_session, category_id)
    fallback = await system_category(tenant_session)
    moved = await tenant_session.execute(
        update(Service).where(Service.category_id == category.id).values(category_id=fallback.id)
    )
    await tenant_session.delete(category)
    write_audit(
        tenant_session,
        entity="service",
        entity_id=category.id,
        entity_name=_category_title(category),
        action=AuditAction.DELETED,
        author_id=author.id,
        author_name=author.name,
        details={"services": [moved.rowcount, fallback.name]},  # type: ignore[attr-defined]
    )
