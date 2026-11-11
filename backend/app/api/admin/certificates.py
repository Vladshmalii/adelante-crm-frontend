"""Подарочные сертификаты (backend/docs/certificates.md, разделы 7–8).

Шаблоны — уровень сети (Master DB): создаёт и меняет только суперюзер, список
читает и администратор — он продаёт сертификаты. Правка шаблона не меняет уже
проданные сертификаты: у них снимок на момент продажи.

Раздел 11: области «на товари» / «на послуги і товари» (пары салон–товар),
категории шаблонов, срок «до даты» (validUntil), issuedCount в списке шаблонов.

Продают сертификаты оплатой визита или чеком (поле certificates), выпуск — в
app.services.payments.settle. Погашают частью способа «Сертифікат» с кодом
(certificateCode), списание — там же. Здесь — коды чека, активация, проверка
кода для окна оплаты и сертификаты клиента.
"""

import uuid
from datetime import UTC, date, datetime
from decimal import Decimal
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import Field
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session

from app.api.admin.deps import CurrentAuthor
from app.api.admin.inventory import ProductSaleIn
from app.api.schemas import ApiModel, Envelope, PersonRef, page_meta
from app.api.security import AdminUser, SuperUser, require_salon_access
from app.models.master import (
    Certificate,
    CertificateCategory,
    CertificateScope,
    CertificateStatus,
    CertificateTemplate,
    CertificateTemplateProduct,
    CertificateTemplateService,
    Client,
    Salon,
    TransactionType,
)
from app.models.shard import AuditAction, Product, Receipt, Record, Service
from app.services import certificates as certificates_service
from app.services import checkout, ledger, product_sales
from app.services.audit import diff_fields, write_audit
from app.tenancy.deps import MasterSession, SalonId, TenantSession

router = APIRouter(tags=["certificates"], dependencies=[Depends(require_salon_access)])

Nominal = Annotated[Decimal, Field(gt=0, max_digits=12, decimal_places=2)]


# --- Категории (раздел 11.2) --------------------------------------------------------


class CertificateCategoryOut(ApiModel):
    id: uuid.UUID
    name: str
    sort_order: int
    created_at: datetime


class CertificateCategoryIn(ApiModel):
    name: str = Field(min_length=1, max_length=255)
    sort_order: int = 0


class CertificateCategoryPatchIn(ApiModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    sort_order: int | None = None


def _category_title(category: CertificateCategory) -> str:
    return f"Категорія сертифікатів «{category.name}»"


def _category_name(name: str) -> str:
    name = name.strip()
    if not name:
        raise HTTPException(422, "Назва категорії обов'язкова")
    return name


async def _category_name_free(
    master_session: AsyncSession, name: str, exclude_id: uuid.UUID | None = None
) -> None:
    query = select(CertificateCategory.id).where(
        func.lower(CertificateCategory.name) == name.lower()
    )
    if exclude_id is not None:
        query = query.where(CertificateCategory.id != exclude_id)
    if await master_session.scalar(query) is not None:
        raise HTTPException(409, "Категорія з такою назвою вже існує")


async def _get_category(
    master_session: AsyncSession, category_id: uuid.UUID
) -> CertificateCategory:
    category = await master_session.get(CertificateCategory, category_id)
    if category is None:
        raise HTTPException(404, "Категорію не знайдено")
    return category


@router.get("/certificates/categories", response_model=Envelope[list[CertificateCategoryOut]])
async def list_categories(
    _admin: AdminUser, master_session: MasterSession
) -> Envelope[list[CertificateCategoryOut]]:
    """Категории шаблонов — и администратору: окно продажи группирует по ним шаблоны."""
    categories = await master_session.scalars(
        select(CertificateCategory).order_by(
            CertificateCategory.sort_order, CertificateCategory.name
        )
    )
    return Envelope(data=[CertificateCategoryOut.model_validate(c) for c in categories])


@router.post(
    "/certificates/categories",
    response_model=Envelope[CertificateCategoryOut],
    status_code=status.HTTP_201_CREATED,
)
async def create_category(
    body: CertificateCategoryIn,
    _superuser: SuperUser,
    author: CurrentAuthor,
    master_session: MasterSession,
    tenant_session: TenantSession,
) -> Envelope[CertificateCategoryOut]:
    name = _category_name(body.name)
    await _category_name_free(master_session, name)
    category = CertificateCategory(name=name, sort_order=body.sort_order)
    master_session.add(category)
    await master_session.flush()
    await master_session.refresh(category)
    write_audit(
        tenant_session,
        entity="certificate",
        entity_id=category.id,
        entity_name=_category_title(category),
        action=AuditAction.CREATED,
        author_id=author.id,
        author_name=author.name,
        details={"name": [None, category.name], "sortOrder": [None, category.sort_order]},
    )
    return Envelope(data=CertificateCategoryOut.model_validate(category))


@router.patch(
    "/certificates/categories/{category_id}", response_model=Envelope[CertificateCategoryOut]
)
async def patch_category(
    category_id: uuid.UUID,
    body: CertificateCategoryPatchIn,
    _superuser: SuperUser,
    author: CurrentAuthor,
    master_session: MasterSession,
    tenant_session: TenantSession,
) -> Envelope[CertificateCategoryOut]:
    category = await _get_category(master_session, category_id)
    updates = body.model_dump(exclude_unset=True, by_alias=False)
    for field, value in updates.items():
        if value is None:
            raise HTTPException(422, f"Поле {field} не можна очистити")
    if "name" in updates:
        updates["name"] = _category_name(updates["name"])
        await _category_name_free(master_session, updates["name"], exclude_id=category.id)
    changes = diff_fields(category, updates)
    for field, value in updates.items():
        setattr(category, field, value)
    await master_session.flush()
    if changes:
        write_audit(
            tenant_session,
            entity="certificate",
            entity_id=category.id,
            entity_name=_category_title(category),
            action=AuditAction.UPDATED,
            author_id=author.id,
            author_name=author.name,
            details=changes,
        )
    return Envelope(data=CertificateCategoryOut.model_validate(category))


@router.delete("/certificates/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: uuid.UUID,
    _superuser: SuperUser,
    author: CurrentAuthor,
    master_session: MasterSession,
    tenant_session: TenantSession,
) -> None:
    """Удаление категории: её шаблоны остаются «Без категорії» (FK ON DELETE SET NULL)."""
    category = await _get_category(master_session, category_id)
    moved = await master_session.scalar(
        select(func.count())
        .select_from(CertificateTemplate)
        .where(CertificateTemplate.category_id == category.id)
    )
    # Явно, а не только ON DELETE SET NULL: шаблоны в identity map сессии не устареют
    await master_session.execute(
        update(CertificateTemplate)
        .where(CertificateTemplate.category_id == category.id)
        .values(category_id=None)
    )
    await master_session.delete(category)
    await master_session.flush()
    write_audit(
        tenant_session,
        entity="certificate",
        entity_id=category.id,
        entity_name=_category_title(category),
        action=AuditAction.DELETED,
        author_id=author.id,
        author_name=author.name,
        details={"templates": [moved or 0, 0]},
    )


# --- Шаблоны ------------------------------------------------------------------------


class CertificateTemplateServiceRef(ApiModel):
    salon_id: uuid.UUID
    service_id: uuid.UUID


class CertificateTemplateProductRef(ApiModel):
    salon_id: uuid.UUID
    product_id: uuid.UUID


class CertificateTemplateOut(ApiModel):
    id: uuid.UUID
    name: str
    amount: Decimal
    scope: CertificateScope
    # Срок: дни от продажи или дата (не больше одного); оба null — бессрочный
    valid_days: int | None
    valid_until: date | None
    # null — «Без категорії»
    category_id: uuid.UUID | None
    is_active: bool
    sort_order: int
    services: list[CertificateTemplateServiceRef]
    products: list[CertificateTemplateProductRef]
    # Продано сертификатов по шаблону, кроме аннулированных — колонка «Випущено»
    issued_count: int
    created_at: datetime
    updated_at: datetime


class CertificateTemplateIn(ApiModel):
    name: str = Field(min_length=1, max_length=255)
    # Номинал = цена (решение 1)
    amount: Nominal
    scope: CertificateScope = CertificateScope.ANY
    valid_days: int | None = Field(default=None, ge=1, le=3650)
    valid_until: date | None = None
    category_id: uuid.UUID | None = None
    is_active: bool = True
    sort_order: int = 0
    services: list[CertificateTemplateServiceRef] = Field(default_factory=list)
    products: list[CertificateTemplateProductRef] = Field(default_factory=list)


class CertificateTemplatePatchIn(ApiModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    amount: Nominal | None = None
    scope: CertificateScope | None = None
    valid_days: int | None = Field(default=None, ge=1, le=3650)
    valid_until: date | None = None
    category_id: uuid.UUID | None = None
    is_active: bool | None = None
    sort_order: int | None = None
    # Передан — заменяет список целиком
    services: list[CertificateTemplateServiceRef] | None = None
    products: list[CertificateTemplateProductRef] | None = None


# В PATCH можно очистить: срок (бессрочный) и категорию («Без категорії»)
NULLABLE_FIELDS = {"valid_days", "valid_until", "category_id"}


def template_out(t: CertificateTemplate, issued_count: int = 0) -> CertificateTemplateOut:
    return CertificateTemplateOut(
        id=t.id,
        name=t.name,
        amount=t.amount,
        scope=t.scope,
        valid_days=t.valid_days,
        valid_until=t.valid_until,
        category_id=t.category_id,
        is_active=t.is_active,
        sort_order=t.sort_order,
        services=[
            CertificateTemplateServiceRef(salon_id=s.salon_id, service_id=s.service_id)
            for s in t.services
        ],
        products=[
            CertificateTemplateProductRef(salon_id=p.salon_id, product_id=p.product_id)
            for p in t.products
        ],
        issued_count=issued_count,
        created_at=t.created_at,
        updated_at=t.updated_at,
    )


async def _issued_counts(
    master_session: AsyncSession, template_ids: list[uuid.UUID]
) -> dict[uuid.UUID, int]:
    if not template_ids:
        return {}
    rows = await master_session.execute(
        select(Certificate.template_id, func.count())
        .where(
            Certificate.template_id.in_(template_ids),
            Certificate.status != CertificateStatus.CANCELLED,
        )
        .group_by(Certificate.template_id)
    )
    return {template_id: count for template_id, count in rows.tuples()}


async def _template_out(
    master_session: AsyncSession, template: CertificateTemplate
) -> CertificateTemplateOut:
    counts = await _issued_counts(master_session, [template.id])
    return template_out(template, counts.get(template.id, 0))


async def check_shard_pairs(
    request: Request,
    master_session: AsyncSession,
    pairs: set[tuple[uuid.UUID, uuid.UUID]],
    model: type[Service] | type[Product],
    missing: str,
) -> None:
    """Салон есть в сети; услуга или товар существует в шарде салона (EXISTS, cross-DB)."""
    salon_ids = {salon for salon, _ in pairs}
    known = set(await master_session.scalars(select(Salon.id).where(Salon.id.in_(salon_ids))))
    if salon_ids - known:
        raise HTTPException(422, "Салон не знайдено")
    registry = request.app.state.engine_registry
    for salon_id in salon_ids:
        wanted = {item for salon, item in pairs if salon == salon_id}
        factory = await registry.get_sessionmaker(salon_id)
        async with factory() as shard:
            found = set(await shard.scalars(select(model.id).where(model.id.in_(wanted))))
        if wanted - found:
            raise HTTPException(422, missing)


async def _check_services(
    request: Request, master_session: AsyncSession, services: list[CertificateTemplateServiceRef]
) -> list[CertificateTemplateService]:
    pairs = {(s.salon_id, s.service_id) for s in services}
    await check_shard_pairs(request, master_session, pairs, Service, "Послугу не знайдено в салоні")
    return [
        CertificateTemplateService(salon_id=salon, service_id=service) for salon, service in pairs
    ]


async def _check_products(
    request: Request, master_session: AsyncSession, products: list[CertificateTemplateProductRef]
) -> list[CertificateTemplateProduct]:
    pairs = {(p.salon_id, p.product_id) for p in products}
    await check_shard_pairs(request, master_session, pairs, Product, "Товар не знайдено в салоні")
    return [
        CertificateTemplateProduct(salon_id=salon, product_id=product) for salon, product in pairs
    ]


def _scope_lists[S, P](
    scope: CertificateScope,
    services: list[S] | None,
    products: list[P] | None,
    *,
    current_services: list[S],
    current_products: list[P],
) -> tuple[list[S], list[P]]:
    """Услуги и товары для области (раздел 11.2). None — список не передан.

    Непереданный список берётся из шаблона, а если область его не допускает —
    очищается (смена области на «на все» убирает услуги и товары). Переданный
    непустой список, который область не допускает, — ошибка.
    """
    if services is not None and services and not scope.has_services:
        raise HTTPException(422, "Ця область сертифіката не містить послуг")
    if products is not None and products and not scope.has_products:
        raise HTTPException(422, "Ця область сертифіката не містить товарів")
    services = services if services is not None else current_services
    products = products if products is not None else current_products
    services = services if scope.has_services else []
    products = products if scope.has_products else []
    if scope == CertificateScope.SERVICES and not services:
        raise HTTPException(422, "Для сертифіката «на послуги» оберіть хоча б одну послугу")
    if scope == CertificateScope.PRODUCTS and not products:
        raise HTTPException(422, "Для сертифіката «на товари» оберіть хоча б один товар")
    if scope == CertificateScope.SERVICES_PRODUCTS and not services and not products:
        raise HTTPException(
            422, "Для сертифіката «на послуги і товари» оберіть хоча б одну послугу або товар"
        )
    return services, products


def _check_term(valid_days: int | None, valid_until: date | None) -> None:
    if valid_days is not None and valid_until is not None:
        raise HTTPException(422, "Вкажіть термін у днях або дату закінчення — не обидва")


async def _check_category(master_session: AsyncSession, category_id: uuid.UUID | None) -> None:
    if (
        category_id is not None
        and await master_session.get(CertificateCategory, category_id) is None
    ):
        raise HTTPException(422, "Категорію не знайдено")


async def _get_template(
    master_session: AsyncSession, template_id: uuid.UUID
) -> CertificateTemplate:
    template = await master_session.get(CertificateTemplate, template_id)
    if template is None:
        raise HTTPException(404, "Шаблон сертифіката не знайдено")
    return template


def _audit_values(t: CertificateTemplate) -> dict[str, Any]:
    return {
        "name": t.name,
        "amount": str(t.amount),
        "scope": t.scope.value,
        "validDays": t.valid_days,
        "validUntil": t.valid_until.isoformat() if t.valid_until else None,
        "categoryId": str(t.category_id) if t.category_id else None,
        "isActive": t.is_active,
    }


@router.get("/certificates/templates", response_model=Envelope[list[CertificateTemplateOut]])
async def list_templates(
    _admin: AdminUser, master_session: MasterSession
) -> Envelope[list[CertificateTemplateOut]]:
    """Все шаблоны, включая скрытые: продажа предлагает только активные.

    С категорией (categoryId) — окно продажи группирует по ней.
    """
    templates = list(
        await master_session.scalars(
            select(CertificateTemplate).order_by(
                CertificateTemplate.sort_order, CertificateTemplate.name
            )
        )
    )
    counts = await _issued_counts(master_session, [t.id for t in templates])
    return Envelope(data=[template_out(t, counts.get(t.id, 0)) for t in templates])


@router.post(
    "/certificates/templates",
    response_model=Envelope[CertificateTemplateOut],
    status_code=status.HTTP_201_CREATED,
)
async def create_template(
    body: CertificateTemplateIn,
    request: Request,
    _superuser: SuperUser,
    author: CurrentAuthor,
    master_session: MasterSession,
    tenant_session: TenantSession,
) -> Envelope[CertificateTemplateOut]:
    _check_term(body.valid_days, body.valid_until)
    await _check_category(master_session, body.category_id)
    services, products = _scope_lists(
        body.scope, body.services, body.products, current_services=[], current_products=[]
    )
    template = CertificateTemplate(
        **body.model_dump(by_alias=False, exclude={"services", "products"})
    )
    template.services = await _check_services(request, master_session, services)
    template.products = await _check_products(request, master_session, products)
    master_session.add(template)
    await master_session.flush()
    await master_session.refresh(template)
    write_audit(
        tenant_session,
        entity="certificate",
        entity_id=template.id,
        entity_name=f"Шаблон сертифіката «{template.name}»",
        action=AuditAction.CREATED,
        author_id=author.id,
        author_name=author.name,
        details={
            **{k: [None, v] for k, v in _audit_values(template).items()},
            "services": [None, len(template.services)],
            "products": [None, len(template.products)],
        },
    )
    return Envelope(data=template_out(template))


@router.patch(
    "/certificates/templates/{template_id}", response_model=Envelope[CertificateTemplateOut]
)
async def patch_template(
    template_id: uuid.UUID,
    body: CertificateTemplatePatchIn,
    request: Request,
    _superuser: SuperUser,
    author: CurrentAuthor,
    master_session: MasterSession,
    tenant_session: TenantSession,
) -> Envelope[CertificateTemplateOut]:
    """Действует на следующие продажи; проданные сертификаты хранят снимок шаблона."""
    template = await _get_template(master_session, template_id)
    updates = body.model_dump(exclude_unset=True, by_alias=False, exclude={"services", "products"})
    for field, value in updates.items():
        if value is None and field not in NULLABLE_FIELDS:
            raise HTTPException(422, f"Поле {field} не можна очистити")
    _check_term(
        updates.get("valid_days", template.valid_days),
        updates.get("valid_until", template.valid_until),
    )
    if "category_id" in updates:
        await _check_category(master_session, updates["category_id"])
    changes = diff_fields(template, updates)
    scope = updates.get("scope", template.scope)
    current_services = [
        CertificateTemplateServiceRef(salon_id=s.salon_id, service_id=s.service_id)
        for s in template.services
    ]
    current_products = [
        CertificateTemplateProductRef(salon_id=p.salon_id, product_id=p.product_id)
        for p in template.products
    ]
    services, products = _scope_lists(
        scope,
        body.services,
        body.products,
        current_services=current_services,
        current_products=current_products,
    )
    new_services = await _check_services(request, master_session, services)
    new_products = await _check_products(request, master_session, products)
    for field, value in updates.items():
        setattr(template, field, value)
    old_services = {(s.salon_id, s.service_id) for s in template.services}
    new_service_pairs = {(s.salon_id, s.service_id) for s in new_services}
    old_products = {(p.salon_id, p.product_id) for p in template.products}
    new_product_pairs = {(p.salon_id, p.product_id) for p in new_products}
    if old_services != new_service_pairs or old_products != new_product_pairs:
        if old_services != new_service_pairs:
            changes["services"] = [len(old_services), len(new_service_pairs)]
        if old_products != new_product_pairs:
            changes["products"] = [len(old_products), len(new_product_pairs)]
        template.services = []
        template.products = []
        await master_session.flush()
        template.services = new_services
        template.products = new_products
    await master_session.flush()
    await master_session.refresh(template)
    if changes:
        write_audit(
            tenant_session,
            entity="certificate",
            entity_id=template.id,
            entity_name=f"Шаблон сертифіката «{template.name}»",
            action=AuditAction.UPDATED,
            author_id=author.id,
            author_name=author.name,
            details=changes,
        )
    return Envelope(data=await _template_out(master_session, template))


# --- Продажа и активация ------------------------------------------------------------


class CertificateSaleIn(ApiModel):
    """Позиция продажи в чеке: шаблон и количество (2 шт. — два кода)."""

    template_id: uuid.UUID
    quantity: int = Field(default=1, ge=1, le=certificates_service.MAX_QUANTITY)

    def to_sale(self) -> certificates_service.CertificateSale:
        return certificates_service.CertificateSale(
            template_id=self.template_id, quantity=self.quantity
        )


class CertificateOut(ApiModel):
    id: uuid.UUID
    code: str
    name: str
    amount: Decimal
    balance: Decimal
    scope: CertificateScope
    # null — бессрочный
    expires_at: datetime | None
    status: CertificateStatus
    sold_salon_id: uuid.UUID
    sold_receipt_id: uuid.UUID
    buyer: PersonRef | None
    owner: PersonRef | None
    activated_at: datetime | None
    created_at: datetime
    # Аннулирование: суперюзер или отмена чека покупки
    cancelled_at: datetime | None
    cancelled_by_name: str | None
    cancel_reason: str | None


def _certificates_out(session: Session, items: list[Certificate]) -> list[CertificateOut]:
    balances = certificates_service.balances(session, [c.id for c in items])
    client_ids = {c.buyer_client_id for c in items} | {c.owner_client_id for c in items}
    clients = {
        c.id: c
        for c in session.scalars(
            select(Client).where(Client.id.in_([i for i in client_ids if i is not None]))
        )
    }

    def person(client_id: uuid.UUID | None) -> PersonRef | None:
        if client_id is None:
            return None
        client = clients.get(client_id)
        return PersonRef(id=str(client_id), name=client.full_name if client else None)

    return [
        CertificateOut(
            id=c.id,
            code=c.code,
            name=c.name,
            amount=c.amount,
            balance=balances.get(c.id, Decimal(0)),
            scope=c.scope,
            expires_at=c.expires_at,
            status=c.status,
            sold_salon_id=c.sold_salon_id,
            sold_receipt_id=c.sold_receipt_id,
            buyer=person(c.buyer_client_id),
            owner=person(c.owner_client_id),
            activated_at=c.activated_at,
            created_at=c.created_at,
            cancelled_at=c.cancelled_at,
            cancelled_by_name=c.cancelled_by_name,
            cancel_reason=c.cancel_reason,
        )
        for c in items
    ]


@router.get("/receipts/{receipt_id}/certificates", response_model=Envelope[list[CertificateOut]])
async def receipt_certificates(
    receipt_id: uuid.UUID,
    _admin: AdminUser,
    salon_id: SalonId,
    master_session: MasterSession,
    tenant_session: TenantSession,
) -> Envelope[list[CertificateOut]]:
    """Сертификаты, проданные чеком салона: коды для показа, печати и активации."""
    if await tenant_session.get(Receipt, receipt_id) is None:
        raise HTTPException(404, "Чек не знайдено")
    items = await master_session.run_sync(
        lambda s: _certificates_out(s, certificates_service.sold_in(s, salon_id, receipt_id))
    )
    return Envelope(data=items)


class CertificateActivateIn(ApiModel):
    client_id: uuid.UUID


@router.post("/certificates/{certificate_id}/activate", response_model=Envelope[CertificateOut])
async def activate_certificate(
    certificate_id: uuid.UUID,
    body: CertificateActivateIn,
    _admin: AdminUser,
    author: CurrentAuthor,
    master_session: MasterSession,
    tenant_session: TenantSession,
) -> Envelope[CertificateOut]:
    """Привязать сертификат к клиенту (решение 6). Один раз — передать потом нельзя."""
    if await master_session.get(Certificate, certificate_id) is None:
        raise HTTPException(404, "Сертифікат не знайдено")

    def run(session: Session) -> tuple[CertificateOut, bool]:
        before = session.get(Certificate, certificate_id)
        was_owner = before.owner_client_id if before else None
        certificate = certificates_service.activate(session, certificate_id, body.client_id)
        return _certificates_out(session, [certificate])[0], was_owner is None

    try:
        out, changed = await master_session.run_sync(run)
        await master_session.commit()
    except certificates_service.CertificateError as exc:
        await master_session.rollback()
        raise HTTPException(409, str(exc))
    if changed:
        write_audit(
            tenant_session,
            entity="certificate",
            entity_id=out.id,
            entity_name=f"Сертифікат {out.code}",
            action=AuditAction.UPDATED,
            author_id=author.id,
            author_name=author.name,
            details={"owner": [None, out.owner.name if out.owner else str(body.client_id)]},
        )
    return Envelope(data=out)


# --- Погашение ----------------------------------------------------------------------


@router.get("/clients/{client_id}/certificates", response_model=Envelope[list[CertificateOut]])
async def client_certificates(
    client_id: uuid.UUID, _admin: AdminUser, master_session: MasterSession
) -> Envelope[list[CertificateOut]]:
    """Сертификаты клиента: активированные на него и купленные им (подсказка в окне оплаты)."""
    items = await master_session.run_sync(
        lambda s: _certificates_out(s, certificates_service.client_certificates(s, client_id))
    )
    return Envelope(data=items)


class CertificateLookupIn(ApiModel):
    code: str = Field(min_length=1, max_length=32)
    # Контекст чека: оплата визита (recordId) или продажа без записи (clientId)
    record_id: uuid.UUID | None = None
    bonus_record_service_ids: list[uuid.UUID] = Field(default_factory=list)
    # Строки записи, оплачиваемые абонементом (0 ₴ — область сертификата их не покрывает)
    subscription_record_service_ids: list[uuid.UUID] = Field(default_factory=list)
    client_id: uuid.UUID | None = None
    # Товары со склада в чеке — для областей «на товари» / «на послуги і товари»
    products: list[ProductSaleIn] = Field(default_factory=list, max_length=product_sales.MAX_LINES)


class CertificateLookupOut(ApiModel):
    certificate: CertificateOut
    # Сколько можно оплатить этим сертификатом в чеке: ≤ остатка, у областей кроме
    # «на все» — ≤ его услуг и товаров после скидки. Итог чека и другие части учитывает
    # окно оплаты
    max_payment: Decimal
    # Почему сертификатом нельзя оплатить этот чек; null — можно
    error: str | None


@router.post("/certificates/lookup", response_model=Envelope[CertificateLookupOut])
async def lookup_certificate(
    body: CertificateLookupIn,
    _admin: AdminUser,
    salon_id: SalonId,
    master_session: MasterSession,
    tenant_session: TenantSession,
) -> Envelope[CertificateLookupOut]:
    """Проверка кода в окне оплаты (раздел 5). POST — код не попадает в URL и логи прокси.

    Окончательно всё проверяется при оплате, под блокировкой счёта сертификата.
    """
    client_id = body.client_id
    try:
        planned = await product_sales.plan(
            tenant_session, [p.to_sale() for p in body.products], lock=False
        )
    except product_sales.ProductSaleError as exc:
        raise HTTPException(exc.status_code, str(exc))
    product_lines = [line.line() for line in planned]
    lines: list[certificates_service.LineAmount] = []
    if body.record_id is not None:
        record = await tenant_session.get(Record, body.record_id)
        if record is None:
            raise HTTPException(404, "Запис не знайдено")
        client_id = record.client_id
        ctx = await checkout.load_context(master_session, client_id, salon_id)
        selected = frozenset(body.bonus_record_service_ids)
        # Какой именно абонемент — для сумм неважно: строка 0 ₴
        uses = {line_id: line_id for line_id in body.subscription_record_service_ids}
        lines = ctx.quote(
            checkout.record_lines(record, selected, uses) + product_lines
        ).scope_lines()
    elif product_lines:
        ctx = await checkout.load_context(master_session, client_id, salon_id)
        lines = ctx.quote(product_lines).scope_lines()

    def run(session: Session) -> CertificateLookupOut | None:
        certificate = certificates_service.find_by_code(session, body.code)
        if certificate is None:
            return None
        out = _certificates_out(session, [certificate])[0]
        error = certificates_service.unusable_reason(
            certificate, out.balance, client_id=client_id, now=datetime.now(UTC)
        )
        limit = certificates_service.eligible_amount(certificate, salon_id, lines)
        max_payment = out.balance if limit is None else min(out.balance, limit)
        if error is None and max_payment <= 0:
            error = (
                f"Сертифікат діє лише на свої {certificates_service.SCOPE_ITEMS[certificate.scope]}"
                " — у цьому чеку їх немає"
            )
        return CertificateLookupOut(
            certificate=out,
            max_payment=Decimal(0) if error else max_payment,
            error=error,
        )

    result = await master_session.run_sync(run)
    if result is None:
        raise HTTPException(404, "Сертифікат не знайдено")
    return Envelope(data=result)


# --- Реестр и аннулирование (суперюзер), история -----------------------------------


@router.get("/certificates", response_model=Envelope[list[CertificateOut]])
async def list_certificates(
    _superuser: SuperUser,
    master_session: MasterSession,
    code: str | None = None,
    certificate_status: Annotated[CertificateStatus | None, Query(alias="status")] = None,
    sold_salon_id: Annotated[uuid.UUID | None, Query(alias="soldSalonId")] = None,
    page: int = 1,
    per_page: Annotated[int, Query(alias="perPage", le=200)] = 50,
) -> Envelope[list[CertificateOut]]:
    """Реестр сертификатов сети (раздел 8, п. 4): поиск по коду (часть кода), статус, салон."""
    query = select(Certificate)
    if code and code.strip():
        raw = "".join(ch for ch in code.upper() if ch.isalnum()).removeprefix("ADL")
        pattern = "%" + "%".join(raw) + "%" if raw else "%"
        query = query.where(Certificate.code.like(pattern))
    if certificate_status is not None:
        query = query.where(Certificate.status == certificate_status)
    if sold_salon_id is not None:
        query = query.where(Certificate.sold_salon_id == sold_salon_id)
    total = await master_session.scalar(select(func.count()).select_from(query.subquery()))

    def run(session: Session) -> list[CertificateOut]:
        items = list(
            session.scalars(
                query.order_by(Certificate.created_at.desc())
                .offset((page - 1) * per_page)
                .limit(per_page)
            )
        )
        return _certificates_out(session, items)

    items = await master_session.run_sync(run)
    return Envelope(data=items, meta=page_meta(page, per_page, total or 0))


class CertificateTransactionOut(ApiModel):
    id: uuid.UUID
    type: TransactionType
    amount: Decimal
    balance_after: Decimal
    salon_id: uuid.UUID | None
    receipt_id: uuid.UUID | None
    comment: str | None
    author_name: str | None
    created_at: datetime


@router.get(
    "/certificates/{certificate_id}/transactions",
    response_model=Envelope[list[CertificateTransactionOut]],
)
async def certificate_transactions(
    certificate_id: uuid.UUID, _admin: AdminUser, master_session: MasterSession
) -> Envelope[list[CertificateTransactionOut]]:
    """История сертификата: продажа, погашения (салон и чек), сторно, сгорание."""
    if await master_session.get(Certificate, certificate_id) is None:
        raise HTTPException(404, "Сертифікат не знайдено")
    txns = await master_session.run_sync(
        lambda s: certificates_service.transactions(s, certificate_id)
    )
    return Envelope(
        data=[
            CertificateTransactionOut(
                id=t.id,
                type=t.type,
                amount=t.amount,
                balance_after=t.balance_after,
                salon_id=t.salon_id,
                receipt_id=t.receipt_id,
                comment=t.comment,
                author_name=t.author_name,
                created_at=t.created_at,
            )
            for t in txns
        ]
    )


class CertificateCancelIn(ApiModel):
    reason: str = Field(min_length=1, max_length=2000)


@router.post("/certificates/{certificate_id}/cancel", response_model=Envelope[CertificateOut])
async def cancel_certificate(
    certificate_id: uuid.UUID,
    body: CertificateCancelIn,
    _superuser: SuperUser,
    author: CurrentAuthor,
    salon_id: SalonId,
    master_session: MasterSession,
    tenant_session: TenantSession,
) -> Envelope[CertificateOut]:
    """Аннулирование (раздел 6): остаток в ноль, статус cancelled. Деньги не возвращаются."""
    reason = body.reason.strip()
    if not reason:
        raise HTTPException(422, "Вкажіть причину анулювання")
    certificate = await master_session.get(Certificate, certificate_id)
    if certificate is None:
        raise HTTPException(404, "Сертифікат не знайдено")
    if certificate.status == CertificateStatus.CANCELLED:
        raise HTTPException(409, "Сертифікат уже анульовано")
    old_status = certificate.status.value

    def run(session: Session) -> tuple[CertificateOut, Decimal]:
        balance = certificates_service.balances(session, [certificate_id]).get(
            certificate_id, Decimal(0)
        )
        cancelled = certificates_service.cancel(
            session,
            certificate_id,
            reason=reason,
            meta=ledger.Meta(
                salon_id=salon_id,
                author_id=author.id,
                author_name=author.name,
                comment=f"Анульовано: {reason}",
            ),
        )
        return _certificates_out(session, [cancelled])[0], balance

    out, balance = await master_session.run_sync(run)
    await master_session.commit()
    write_audit(
        tenant_session,
        entity="certificate",
        entity_id=out.id,
        entity_name=f"Сертифікат {out.code}",
        action=AuditAction.UPDATED,
        author_id=author.id,
        author_name=author.name,
        details={
            "status": [old_status, CertificateStatus.CANCELLED.value],
            "balance": [str(balance), "0.00"],
            "reason": [None, reason],
        },
    )
    return Envelope(data=out)
