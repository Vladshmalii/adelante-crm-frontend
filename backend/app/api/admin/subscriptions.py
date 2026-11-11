"""Абонементы (backend/docs/subscriptions.md).

Типы — уровень сети (Master DB), раздел 4: создаёт и меняет только суперюзер, список
читает и администратор — он продаёт абонементы (как шаблоны сертификатов). Удаления
нет — только архив (isActive=false): архивный тип не продаётся, проданные работают.
Правка типа проданные абонементы не меняет: у них снимок на момент продажи.

Продают абонемент строкой чека (поле subscriptions) при оплате визита и в продаже без
записи, выпуск — в app.services.payments.settle (раздел 5).
"""

import uuid
from datetime import datetime
from decimal import Decimal
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.admin.certificates import check_shard_pairs
from app.api.admin.deps import CurrentAuthor
from app.api.schemas import ApiModel, Envelope
from app.api.security import AdminUser, SuperUser, require_salon_access
from app.models.master import (
    Subscription,
    SubscriptionActivationMode,
    SubscriptionBalanceMode,
    SubscriptionDurationUnit,
    SubscriptionStatus,
    SubscriptionType,
    SubscriptionTypeService,
    SubscriptionUnitKind,
)
from app.models.shard import AuditAction, Service
from app.services import subscriptions as subscriptions_service
from app.services.audit import diff_fields, write_audit
from app.tenancy.deps import MasterSession, TenantSession

router = APIRouter(tags=["subscriptions"], dependencies=[Depends(require_salon_access)])

Price = Annotated[Decimal, Field(gt=0, max_digits=12, decimal_places=2)]
# Минуты: абонемент на год ежедневных процедур — с запасом
Units = Annotated[int, Field(ge=1, le=100_000)]
Days = Annotated[int, Field(ge=1, le=3650)]

MAX_DURATION = {SubscriptionDurationUnit.DAY: 3650, SubscriptionDurationUnit.MONTH: 120}


# --- Типы (раздел 4) ----------------------------------------------------------------


class SubscriptionTypeServiceRef(ApiModel):
    salon_id: uuid.UUID
    service_id: uuid.UUID
    # Только при balanceMode=separate: своё число единиц на услугу
    units: Units | None = None


class SubscriptionTypeOut(ApiModel):
    id: uuid.UUID
    name: str
    price: Decimal
    unit_kind: SubscriptionUnitKind
    balance_mode: SubscriptionBalanceMode
    # shared — общее число единиц; separate — null (единицы у услуг)
    total_units: int | None
    # 0 — бессрочный
    duration_value: int
    duration_unit: SubscriptionDurationUnit
    activation_mode: SubscriptionActivationMode
    auto_activate_days: int | None
    freeze_allowed: bool
    # 0 — без лимита
    freeze_max_days: int
    is_active: bool
    sort_order: int
    services: list[SubscriptionTypeServiceRef]
    # Продано абонементов этого типа, кроме отменённых
    issued_count: int
    created_at: datetime
    updated_at: datetime


class SubscriptionTypeIn(ApiModel):
    name: str = Field(min_length=1, max_length=255)
    price: Price
    unit_kind: SubscriptionUnitKind = SubscriptionUnitKind.VISITS
    balance_mode: SubscriptionBalanceMode = SubscriptionBalanceMode.SHARED
    total_units: Units | None = None
    duration_value: int = Field(default=0, ge=0)
    duration_unit: SubscriptionDurationUnit = SubscriptionDurationUnit.MONTH
    activation_mode: SubscriptionActivationMode = SubscriptionActivationMode.ON_SALE
    auto_activate_days: Days | None = None
    freeze_allowed: bool = False
    freeze_max_days: int = Field(default=0, ge=0, le=3650)
    is_active: bool = True
    sort_order: int = 0
    services: list[SubscriptionTypeServiceRef] = Field(min_length=1, max_length=500)


class SubscriptionTypePatchIn(ApiModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    price: Price | None = None
    unit_kind: SubscriptionUnitKind | None = None
    balance_mode: SubscriptionBalanceMode | None = None
    total_units: Units | None = None
    duration_value: int | None = Field(default=None, ge=0)
    duration_unit: SubscriptionDurationUnit | None = None
    activation_mode: SubscriptionActivationMode | None = None
    auto_activate_days: Days | None = None
    freeze_allowed: bool | None = None
    freeze_max_days: int | None = Field(default=None, ge=0, le=3650)
    is_active: bool | None = None
    sort_order: int | None = None
    # Передан — заменяет список целиком
    services: list[SubscriptionTypeServiceRef] | None = Field(default=None, max_length=500)


# В PATCH можно очистить: total_units (переход на separate) и автоактивацию
NULLABLE_FIELDS = {"total_units", "auto_activate_days"}

TYPE_FIELDS = (
    "name",
    "price",
    "unit_kind",
    "balance_mode",
    "total_units",
    "duration_value",
    "duration_unit",
    "activation_mode",
    "auto_activate_days",
    "freeze_allowed",
    "freeze_max_days",
    "is_active",
    "sort_order",
)


def _refs(t: SubscriptionType) -> list[SubscriptionTypeServiceRef]:
    return [
        SubscriptionTypeServiceRef(salon_id=s.salon_id, service_id=s.service_id, units=s.units)
        for s in t.services
    ]


def type_out(t: SubscriptionType, issued_count: int = 0) -> SubscriptionTypeOut:
    return SubscriptionTypeOut(
        **{field: getattr(t, field) for field in TYPE_FIELDS},
        id=t.id,
        services=_refs(t),
        issued_count=issued_count,
        created_at=t.created_at,
        updated_at=t.updated_at,
    )


async def _issued_counts(
    master_session: AsyncSession, type_ids: list[uuid.UUID]
) -> dict[uuid.UUID, int]:
    if not type_ids:
        return {}
    rows = await master_session.execute(
        select(Subscription.type_id, func.count())
        .where(
            Subscription.type_id.in_(type_ids),
            Subscription.status != SubscriptionStatus.CANCELLED,
        )
        .group_by(Subscription.type_id)
    )
    return {type_id: count for type_id, count in rows.tuples()}


async def _type_out(master_session: AsyncSession, t: SubscriptionType) -> SubscriptionTypeOut:
    counts = await _issued_counts(master_session, [t.id])
    return type_out(t, counts.get(t.id, 0))


def normalize(
    values: dict[str, Any], explicit: set[str], services: list[SubscriptionTypeServiceRef]
) -> list[SubscriptionTypeServiceRef]:
    """Привести значения типа к согласованному виду и проверить (раздел 4). 422 — нарушение.

    values — итоговые поля типа (меняются на месте), explicit — поля, переданные в запросе,
    services — итоговый список услуг (если передан в запросе — его поле есть в explicit).
    Поле, не переданное явно и не имеющее смысла при новых настройках, очищается: смена
    баланса на separate убирает totalUnits, на shared — units у услуг; выключение заморозки
    обнуляет лимит; активация при продаже убирает автоактивацию. Переданное явно и
    противоречащее — ошибка.
    """
    shared = values["balance_mode"] == SubscriptionBalanceMode.SHARED
    if not services:
        raise HTTPException(422, "Оберіть хоча б одну послугу")
    pairs = [(s.salon_id, s.service_id) for s in services]
    if len(set(pairs)) != len(pairs):
        raise HTTPException(422, "Послуга салону вказана двічі")

    if shared:
        if "services" not in explicit:
            services = [s.model_copy(update={"units": None}) for s in services]
        if any(s.units is not None for s in services):
            raise HTTPException(
                422, "При спільному балансі кількість задається для абонемента, не для послуг"
            )
        if values["total_units"] is None:
            raise HTTPException(422, "Вкажіть кількість одиниць абонемента")
    else:
        if values["total_units"] is not None:
            if "total_units" in explicit:
                raise HTTPException(
                    422, "При окремому балансі кількість задається для кожної послуги"
                )
            values["total_units"] = None
        if any(s.units is None for s in services):
            raise HTTPException(422, "При окремому балансі вкажіть кількість для кожної послуги")

    if values["duration_value"] > MAX_DURATION[values["duration_unit"]]:
        raise HTTPException(422, "Занадто довгий термін дії")

    if (
        values["activation_mode"] != SubscriptionActivationMode.FIRST_VISIT
        and values["auto_activate_days"] is not None
    ):
        if "auto_activate_days" in explicit:
            raise HTTPException(422, "Автоактивація можлива лише для активації при першому візиті")
        values["auto_activate_days"] = None

    if not values["freeze_allowed"] and values["freeze_max_days"]:
        if "freeze_max_days" in explicit:
            raise HTTPException(422, "Ліміт заморозки можна задати лише, якщо заморозка дозволена")
        values["freeze_max_days"] = 0
    return services


async def _check_services(
    request: Request, master_session: AsyncSession, services: list[SubscriptionTypeServiceRef]
) -> list[SubscriptionTypeService]:
    """Салоны из сети, услуги существуют в шардах (EXISTS, cross-DB)."""
    await check_shard_pairs(
        request,
        master_session,
        {(s.salon_id, s.service_id) for s in services},
        Service,
        "Послугу не знайдено в салоні",
    )
    return [
        SubscriptionTypeService(salon_id=s.salon_id, service_id=s.service_id, units=s.units)
        for s in services
    ]


async def _get_type(master_session: AsyncSession, type_id: uuid.UUID) -> SubscriptionType:
    found = await master_session.get(SubscriptionType, type_id)
    if found is None:
        raise HTTPException(404, "Тип абонемента не знайдено")
    return found


def _title(t: SubscriptionType) -> str:
    return f"Тип абонемента «{t.name}»"


def _audit_value(value: Any) -> Any:
    if value is None or isinstance(value, (str, int, bool)):
        return value
    return str(value)


def _services_changed(
    old: list[SubscriptionTypeServiceRef], new: list[SubscriptionTypeServiceRef]
) -> bool:
    def key(items: list[SubscriptionTypeServiceRef]) -> set[tuple[Any, ...]]:
        return {(s.salon_id, s.service_id, s.units) for s in items}

    return key(old) != key(new)


@router.get("/subscriptions/types", response_model=Envelope[list[SubscriptionTypeOut]])
async def list_types(
    _admin: AdminUser,
    master_session: MasterSession,
    active: bool | None = None,
) -> Envelope[list[SubscriptionTypeOut]]:
    """Типы абонементов сети; active=true — только продаваемые (окно продажи)."""
    query = select(SubscriptionType).order_by(SubscriptionType.sort_order, SubscriptionType.name)
    if active is not None:
        query = query.where(SubscriptionType.is_active.is_(active))
    types = list(await master_session.scalars(query))
    counts = await _issued_counts(master_session, [t.id for t in types])
    return Envelope(data=[type_out(t, counts.get(t.id, 0)) for t in types])


@router.get("/subscriptions/types/{type_id}", response_model=Envelope[SubscriptionTypeOut])
async def get_type(
    type_id: uuid.UUID, _admin: AdminUser, master_session: MasterSession
) -> Envelope[SubscriptionTypeOut]:
    return Envelope(data=await _type_out(master_session, await _get_type(master_session, type_id)))


@router.post(
    "/subscriptions/types",
    response_model=Envelope[SubscriptionTypeOut],
    status_code=status.HTTP_201_CREATED,
)
async def create_type(
    body: SubscriptionTypeIn,
    request: Request,
    _superuser: SuperUser,
    author: CurrentAuthor,
    master_session: MasterSession,
    tenant_session: TenantSession,
) -> Envelope[SubscriptionTypeOut]:
    values = body.model_dump(by_alias=False, exclude={"services"})
    explicit = set(body.model_fields_set) | {"services"}
    services = normalize(values, explicit, body.services)
    created = SubscriptionType(**values)
    created.services = await _check_services(request, master_session, services)
    master_session.add(created)
    await master_session.flush()
    await master_session.refresh(created)
    write_audit(
        tenant_session,
        entity="subscription",
        entity_id=created.id,
        entity_name=_title(created),
        action=AuditAction.CREATED,
        author_id=author.id,
        author_name=author.name,
        details={
            **{f: [None, _audit_value(getattr(created, f))] for f in TYPE_FIELDS},
            "services": [None, len(created.services)],
        },
    )
    return Envelope(data=type_out(created))


@router.patch("/subscriptions/types/{type_id}", response_model=Envelope[SubscriptionTypeOut])
async def patch_type(
    type_id: uuid.UUID,
    body: SubscriptionTypePatchIn,
    request: Request,
    _superuser: SuperUser,
    author: CurrentAuthor,
    master_session: MasterSession,
    tenant_session: TenantSession,
) -> Envelope[SubscriptionTypeOut]:
    """Действует на следующие продажи; проданные абонементы хранят снимок типа."""
    found = await _get_type(master_session, type_id)
    updates = body.model_dump(exclude_unset=True, by_alias=False, exclude={"services"})
    for field, value in updates.items():
        if value is None and field not in NULLABLE_FIELDS:
            raise HTTPException(422, f"Поле {field} не можна очистити")
    values = {field: getattr(found, field) for field in TYPE_FIELDS} | updates
    explicit = set(updates) | ({"services"} if body.services is not None else set())
    old_services = _refs(found)
    services = normalize(
        values, explicit, body.services if body.services is not None else old_services
    )
    changes = diff_fields(found, {f: values[f] for f in TYPE_FIELDS})
    services_changed = _services_changed(old_services, services)
    new_services = (
        await _check_services(request, master_session, services) if services_changed else None
    )
    for field in TYPE_FIELDS:
        setattr(found, field, values[field])
    if new_services is not None:
        changes["services"] = [len(old_services), len(new_services)]
        found.services = []
        await master_session.flush()
        found.services = new_services
    await master_session.flush()
    await master_session.refresh(found)
    if changes:
        write_audit(
            tenant_session,
            entity="subscription",
            entity_id=found.id,
            entity_name=_title(found),
            action=AuditAction.UPDATED,
            author_id=author.id,
            author_name=author.name,
            details=changes,
        )
    return Envelope(data=await _type_out(master_session, found))


# --- Продажа (раздел 5) -------------------------------------------------------------


class SubscriptionSaleIn(ApiModel):
    """Позиция продажи в чеке: тип абонемента. Одна позиция — один абонемент."""

    type_id: uuid.UUID

    def to_sale(self) -> subscriptions_service.SubscriptionSale:
        return subscriptions_service.SubscriptionSale(type_id=self.type_id)
