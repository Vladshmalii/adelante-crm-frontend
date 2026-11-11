"""Абонементы (backend/docs/subscriptions.md).

Типы — уровень сети (Master DB), раздел 4: создаёт и меняет только суперюзер, список
читает и администратор — он продаёт абонементы (как шаблоны сертификатов). Удаления
нет — только архив (isActive=false): архивный тип не продаётся, проданные работают.
Правка типа проданные абонементы не меняет: у них снимок на момент продажи.

Продают абонемент строкой чека (поле subscriptions) при оплате визита и в продаже без
записи, выпуск — в app.services.payments.settle (раздел 5).
"""

import logging
import uuid
from datetime import UTC, datetime
from decimal import Decimal
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session

from app.api.admin.certificates import check_shard_pairs
from app.api.admin.deps import Author, CurrentAuthor
from app.api.schemas import ApiModel, Envelope, PersonRef
from app.api.security import AdminUser, SuperUser, require_salon_access
from app.models.master import (
    Client,
    Salon,
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

logger = logging.getLogger(__name__)

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


# --- Списание (раздел 6) ------------------------------------------------------------


class SubscriptionUseIn(ApiModel):
    """Строка услуги записи (record_services.id), оплачиваемая абонементом клиента."""

    record_service_id: uuid.UUID
    subscription_id: uuid.UUID


def uses_map(uses: list[SubscriptionUseIn]) -> dict[uuid.UUID, uuid.UUID]:
    """record_service_id → абонемент; одна строка — один абонемент (422)."""
    result: dict[uuid.UUID, uuid.UUID] = {}
    for item in uses:
        if item.record_service_id in result:
            raise HTTPException(422, "Один рядок — один абонемент")
        result[item.record_service_id] = item.subscription_id
    return result


# --- Чтение (раздел 9) --------------------------------------------------------------


class SubscriptionServiceOut(ApiModel):
    """Услуга абонемента (снимок) и её остаток."""

    salon_id: uuid.UUID
    salon_name: str | None
    service_id: uuid.UUID
    # Название из каталога салона; null — услугу удалили или салон недоступен
    service_name: str | None
    # separate — выдано на эту услугу; shared — null
    units: int | None
    # Остаток корзины этой услуги; при shared — общий остаток абонемента
    balance: int


class SubscriptionOut(ApiModel):
    id: uuid.UUID
    type_id: uuid.UUID
    name: str
    client: PersonRef
    status: SubscriptionStatus
    unit_kind: SubscriptionUnitKind
    balance_mode: SubscriptionBalanceMode
    # Всего выдано и остаток по всем корзинам, в единицах типа
    units_total: int
    balance: int
    services: list[SubscriptionServiceOut]
    paid_amount: Decimal
    unit_value: Decimal
    # 0 — бессрочный
    duration_value: int
    duration_unit: SubscriptionDurationUnit
    activation_mode: SubscriptionActivationMode
    auto_activate_at: datetime | None
    activated_at: datetime | None
    # null — бессрочный или ещё не активирован
    expires_at: datetime | None
    freeze_allowed: bool
    # 0 — без лимита
    freeze_max_days: int
    freeze_used: bool
    frozen_at: datetime | None
    # Авторазморозка; null — без лимита
    freeze_until: datetime | None
    unfrozen_at: datetime | None
    frozen_days: int
    sold_salon_id: uuid.UUID
    sold_salon_name: str | None
    sold_receipt_id: uuid.UUID
    sold_at: datetime
    cancelled_at: datetime | None
    cancelled_by_name: str | None
    cancel_reason: str | None
    created_at: datetime


async def service_names(
    request: Request, pairs: set[tuple[uuid.UUID, uuid.UUID]]
) -> dict[tuple[uuid.UUID, uuid.UUID], str]:
    """Названия услуг из шардов салонов (cross-DB); недоступный салон пропускается."""
    registry = request.app.state.engine_registry
    names: dict[tuple[uuid.UUID, uuid.UUID], str] = {}
    for salon_id in {salon for salon, _ in pairs}:
        wanted = {service for salon, service in pairs if salon == salon_id}
        try:
            factory = await registry.get_sessionmaker(salon_id)
            async with factory() as shard:
                rows = await shard.execute(
                    select(Service.id, Service.name).where(Service.id.in_(wanted))
                )
                names.update({(salon_id, sid): name for sid, name in rows.tuples()})
        except Exception:
            logger.warning("Назви послуг салону %s недоступні", salon_id, exc_info=True)
    return names


async def subscriptions_out(
    request: Request, master_session: AsyncSession, items: list[Subscription]
) -> list[SubscriptionOut]:
    pairs = {(s.salon_id, s.service_id) for item in items for s in item.services}
    names = await service_names(request, pairs) if pairs else {}
    salon_ids = {salon for salon, _ in pairs} | {item.sold_salon_id for item in items}
    salons: dict[uuid.UUID, str] = {}
    clients: dict[uuid.UUID, str] = {}
    if items:
        salons = dict(
            (
                await master_session.execute(
                    select(Salon.id, Salon.name).where(Salon.id.in_(salon_ids))
                )
            )
            .tuples()
            .all()
        )
        clients = {
            c.id: c.full_name
            for c in await master_session.scalars(
                select(Client).where(Client.id.in_({item.client_id for item in items}))
            )
        }
    result = []
    for item in items:
        services = []
        for s in item.services:
            basket = next(b for b in item.balances if b.matches(s.salon_id, s.service_id))
            services.append(
                SubscriptionServiceOut(
                    salon_id=s.salon_id,
                    salon_name=salons.get(s.salon_id),
                    service_id=s.service_id,
                    service_name=names.get((s.salon_id, s.service_id)),
                    units=s.units,
                    balance=basket.balance,
                )
            )
        result.append(
            SubscriptionOut(
                id=item.id,
                type_id=item.type_id,
                name=item.name,
                client=PersonRef(id=str(item.client_id), name=clients.get(item.client_id)),
                status=item.status,
                unit_kind=item.unit_kind,
                balance_mode=item.balance_mode,
                units_total=sum(b.units for b in item.balances),
                balance=sum(b.balance for b in item.balances),
                services=services,
                paid_amount=item.paid_amount,
                unit_value=item.unit_value,
                duration_value=item.duration_value,
                duration_unit=item.duration_unit,
                activation_mode=item.activation_mode,
                auto_activate_at=item.auto_activate_at,
                activated_at=item.activated_at,
                expires_at=item.expires_at,
                freeze_allowed=item.freeze_allowed,
                freeze_max_days=item.freeze_max_days,
                freeze_used=item.freeze_used,
                frozen_at=item.frozen_at,
                freeze_until=item.freeze_until,
                unfrozen_at=item.unfrozen_at,
                frozen_days=item.frozen_days,
                sold_salon_id=item.sold_salon_id,
                sold_salon_name=salons.get(item.sold_salon_id),
                sold_receipt_id=item.sold_receipt_id,
                sold_at=item.sold_at,
                cancelled_at=item.cancelled_at,
                cancelled_by_name=item.cancelled_by_name,
                cancel_reason=item.cancel_reason,
                created_at=item.created_at,
            )
        )
    return result


def usable_in(item: Subscription, salon_id: uuid.UUID, now: datetime) -> bool:
    """Подходит для оплаты в салоне: pending/active, срок не вышел, есть остаток на
    услугу этого салона."""
    return subscriptions_service.is_usable(item, now) and any(
        b.balance > 0 and b.matches(s.salon_id, s.service_id)
        for s in item.services
        if s.salon_id == salon_id
        for b in item.balances
    )


@router.get("/clients/{client_id}/subscriptions", response_model=Envelope[list[SubscriptionOut]])
async def client_subscriptions(
    client_id: uuid.UUID,
    request: Request,
    _admin: AdminUser,
    master_session: MasterSession,
    usable_for_salon: Annotated[uuid.UUID | None, Query(alias="usableForSalon")] = None,
) -> Envelope[list[SubscriptionOut]]:
    """Абонементы клиента, новые сверху (карточка клиента, раздел 9).

    usableForSalon — только те, которыми сейчас можно оплатить услугу этого салона (окно
    оплаты, раздел 6, п. 1): pending/active, срок не вышел, остаток > 0 на его услугу.
    """
    items = list(
        await master_session.scalars(
            select(Subscription)
            .where(Subscription.client_id == client_id)
            .order_by(Subscription.created_at.desc())
        )
    )
    if usable_for_salon is not None:
        now = datetime.now(UTC)
        items = [item for item in items if usable_in(item, usable_for_salon, now)]
    return Envelope(data=await subscriptions_out(request, master_session, items))


async def _get_subscription(
    master_session: AsyncSession, subscription_id: uuid.UUID
) -> Subscription:
    found = await master_session.get(Subscription, subscription_id)
    if found is None:
        raise HTTPException(404, "Абонемент не знайдено")
    return found


@router.get("/subscriptions/{subscription_id}", response_model=Envelope[SubscriptionOut])
async def get_subscription(
    subscription_id: uuid.UUID,
    request: Request,
    _admin: AdminUser,
    master_session: MasterSession,
) -> Envelope[SubscriptionOut]:
    found = await _get_subscription(master_session, subscription_id)
    [out] = await subscriptions_out(request, master_session, [found])
    return Envelope(data=out)


# --- Заморозка (раздел 7) -----------------------------------------------------------


def _iso(value: datetime | None) -> str | None:
    return value.isoformat() if value else None


async def _freeze_action(
    subscription_id: uuid.UUID,
    request: Request,
    author: Author,
    master_session: AsyncSession,
    tenant_session: AsyncSession,
    *,
    unfreeze: bool,
) -> SubscriptionOut:
    """Заморозка / разморозка в Master и запись в аудит салона, где действовал автор."""
    await _get_subscription(master_session, subscription_id)
    action = subscriptions_service.unfreeze if unfreeze else subscriptions_service.freeze

    def run(session: Session) -> tuple[Subscription, dict[str, list[Any]]]:
        before = session.get(Subscription, subscription_id)
        old = (before.status.value, before.expires_at, before.freeze_until) if before else None
        changed = action(session, subscription_id)
        assert old is not None
        details: dict[str, list[Any]]
        if unfreeze:
            details = {
                "status": [old[0], changed.status.value],
                "frozenDays": [0, changed.frozen_days],
                "expiresAt": [_iso(old[1]), _iso(changed.expires_at)],
            }
        else:
            details = {
                "status": [old[0], changed.status.value],
                "freezeUntil": [None, _iso(changed.freeze_until)],
            }
        return changed, details

    try:
        changed, details = await master_session.run_sync(run)
        await master_session.commit()
    except subscriptions_service.FreezeError as exc:
        await master_session.rollback()
        raise HTTPException(409, str(exc))
    await master_session.refresh(changed)
    write_audit(
        tenant_session,
        entity="subscription",
        entity_id=changed.id,
        entity_name=f"Абонемент «{changed.name}»",
        action=AuditAction.UPDATED,
        author_id=author.id,
        author_name=author.name,
        details=details,
    )
    [out] = await subscriptions_out(request, master_session, [changed])
    return out


@router.post("/subscriptions/{subscription_id}/freeze", response_model=Envelope[SubscriptionOut])
async def freeze_subscription(
    subscription_id: uuid.UUID,
    request: Request,
    _admin: AdminUser,
    author: CurrentAuthor,
    master_session: MasterSession,
    tenant_session: TenantSession,
) -> Envelope[SubscriptionOut]:
    """Заморозка (раздел 7): один раз; авторазморозка через freezeMaxDays (0 — вручную)."""
    return Envelope(
        data=await _freeze_action(
            subscription_id, request, author, master_session, tenant_session, unfreeze=False
        )
    )


@router.post("/subscriptions/{subscription_id}/unfreeze", response_model=Envelope[SubscriptionOut])
async def unfreeze_subscription(
    subscription_id: uuid.UUID,
    request: Request,
    _admin: AdminUser,
    author: CurrentAuthor,
    master_session: MasterSession,
    tenant_session: TenantSession,
) -> Envelope[SubscriptionOut]:
    """Разморозка в любой момент: frozenDays — фактические дни (вверх), срок += дни."""
    return Envelope(
        data=await _freeze_action(
            subscription_id, request, author, master_session, tenant_session, unfreeze=True
        )
    )
