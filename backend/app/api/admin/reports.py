"""Звіти: сводка, выручка, клиенты, сотрудники, услуги, Excel.

Выручка = сумма неотменённых чеков по дате чека, с товарами. Выручка мастера и
услуги — по чекам, привязанным к записям, без товаров (Receipt.amount −
Receipt.products_amount); выручка записи делится между её услугами пропорционально
их цене (снапшот в record_services). Отчёт по товарам — по строкам чеков.

Строки, оплаченные абонементом (subscriptions.md, раздел 10), денег визита не получают:
их стоимость (subscription_unit_value) — отдельной колонкой subscriptionValue в отчёте
по услугам, не смешивается с деньгами кассы.

Периоды и группировка — по киевским суткам (неделя с понедельника).

Права: раздел — администратор и суперюзер; денежные показатели — только
суперюзер (администратору — null, GET /reports/revenue — 403).

SMS-нагадування (GET /reports/sms, backend/docs/sms-reminders.md) — только
суперюзер: сетевой отчёт, fan-out по журналам шардов салонов из токена.
"""

import io
import uuid
from collections import defaultdict
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from decimal import Decimal
from enum import StrEnum
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import StreamingResponse
from sqlalchemy import distinct, func, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.admin.services import CategoryRef
from app.api.schemas import ApiModel, Envelope
from app.api.security import AdminUser, SuperUser, require_admin
from app.models.master import Salon, SalonStatus
from app.models.shard import (
    DeliveryChannel,
    InventoryCategory,
    Product,
    ProductSaleMode,
    ProductUnit,
    Receipt,
    ReceiptProductLine,
    ReceiptStatus,
    Record,
    RecordService,
    RecordStatus,
    ReminderDelivery,
    ReminderDeliveryStatus,
    Review,
    Service,
    ServiceCategory,
)
from app.services.product_sales import UNIT_NAMES
from app.services.text import uk_sort_key
from app.tenancy.deps import MasterSession, TenantSession
from app.tenancy.registry import EngineRegistry, SalonNotFound, SalonSuspended
from app.timeutils import LocalDatetime, day_bounds, to_local

router = APIRouter(prefix="/reports", tags=["reports"], dependencies=[Depends(require_admin)])

CENT = Decimal("0.01")


class GroupBy(StrEnum):
    DAY = "day"
    WEEK = "week"
    MONTH = "month"


DateFrom = Annotated[LocalDatetime, Query(alias="dateFrom")]
DateTo = Annotated[LocalDatetime, Query(alias="dateTo")]


def _check_period(date_from: datetime, date_to: datetime) -> None:
    if date_to <= date_from:
        raise HTTPException(422, "dateTo має бути пізніше за dateFrom")
    if date_to - date_from > timedelta(days=731):
        raise HTTPException(422, "Період звіту — не більше двох років")


# --- Периоды ------------------------------------------------------------------


def _bucket_start(day: date, group: GroupBy) -> date:
    if group == GroupBy.WEEK:
        return day - timedelta(days=day.weekday())
    if group == GroupBy.MONTH:
        return day.replace(day=1)
    return day


def _next_bucket(start: date, group: GroupBy) -> date:
    if group == GroupBy.WEEK:
        return start + timedelta(days=7)
    if group == GroupBy.MONTH:
        return (start + timedelta(days=32)).replace(day=1)
    return start + timedelta(days=1)


def _previous_bucket(start: date, group: GroupBy) -> date:
    return _bucket_start(start - timedelta(days=1), group)


def _buckets(date_from: datetime, date_to: datetime, group: GroupBy) -> list[date]:
    """Начала интервалов, покрывающих [date_from, date_to) по киевскому времени."""
    last_day = to_local(date_to - timedelta(microseconds=1)).date()
    current = _bucket_start(to_local(date_from).date(), group)
    result = []
    while current <= last_day:
        result.append(current)
        current = _next_bucket(current, group)
    return result


def _bucket_of(value: datetime, group: GroupBy) -> date:
    return _bucket_start(to_local(value).date(), group)


def _change(current: Decimal | int, previous: Decimal | int) -> float | None:
    if not previous:
        return None
    return round(float((Decimal(current) - Decimal(previous)) / Decimal(previous) * 100), 1)


def _money(value: Decimal) -> Decimal:
    return Decimal(value).quantize(CENT)


# --- Данные -------------------------------------------------------------------


@dataclass
class _PaidReceipt:
    date: datetime
    amount: Decimal
    record_id: uuid.UUID | None
    products_amount: Decimal = Decimal(0)

    @property
    def services_amount(self) -> Decimal:
        return self.amount - self.products_amount


async def _paid_receipts(
    session: AsyncSession, date_from: datetime, date_to: datetime
) -> list[_PaidReceipt]:
    rows = await session.execute(
        select(Receipt.date, Receipt.amount, Receipt.record_id, Receipt.products_amount).where(
            Receipt.status != ReceiptStatus.CANCELLED,
            Receipt.date >= date_from,
            Receipt.date < date_to,
        )
    )
    return [_PaidReceipt(d, a, r, p) for d, a, r, p in rows.all()]


@dataclass
class _PeriodStats:
    revenue: Decimal
    receipts: int
    clients: int
    records: int

    @property
    def avg_check(self) -> Decimal:
        return _money(self.revenue / self.receipts) if self.receipts else Decimal(0)


async def _period_stats(
    session: AsyncSession, date_from: datetime, date_to: datetime
) -> _PeriodStats:
    revenue, receipts = (
        await session.execute(
            select(func.coalesce(func.sum(Receipt.amount), 0), func.count()).where(
                Receipt.status != ReceiptStatus.CANCELLED,
                Receipt.date >= date_from,
                Receipt.date < date_to,
            )
        )
    ).one()
    clients, records = (
        await session.execute(
            select(func.count(distinct(Record.client_id)), func.count()).where(
                Record.status != RecordStatus.CANCELLED,
                Record.start_at >= date_from,
                Record.start_at < date_to,
            )
        )
    ).one()
    return _PeriodStats(Decimal(revenue), receipts, clients, records)


# --- Сводка -------------------------------------------------------------------


class MetricOut(ApiModel):
    value: Decimal
    previous: Decimal
    change_percent: float | None


def _metric(current: Decimal | int, previous: Decimal | int) -> MetricOut:
    return MetricOut(
        value=Decimal(current),
        previous=Decimal(previous),
        change_percent=_change(current, previous),
    )


class SummaryOut(ApiModel):
    date_from: datetime
    date_to: datetime
    previous_from: datetime
    # Денежные — только суперюзеру
    revenue: MetricOut | None
    avg_check: MetricOut | None
    clients: MetricOut
    records: MetricOut


async def _summary(
    session: AsyncSession, date_from: datetime, date_to: datetime, *, show_money: bool
) -> SummaryOut:
    previous_from = date_from - (date_to - date_from)
    cur = await _period_stats(session, date_from, date_to)
    prev = await _period_stats(session, previous_from, date_from)
    return SummaryOut(
        date_from=date_from,
        date_to=date_to,
        previous_from=previous_from,
        revenue=_metric(_money(cur.revenue), _money(prev.revenue)) if show_money else None,
        avg_check=_metric(cur.avg_check, prev.avg_check) if show_money else None,
        clients=_metric(cur.clients, prev.clients),
        records=_metric(cur.records, prev.records),
    )


@router.get("/summary", response_model=Envelope[SummaryOut])
async def summary(
    user: AdminUser, tenant_session: TenantSession, date_from: DateFrom, date_to: DateTo
) -> Envelope[SummaryOut]:
    _check_period(date_from, date_to)
    return Envelope(
        data=await _summary(tenant_session, date_from, date_to, show_money=user.is_superuser)
    )


# --- Выручка ------------------------------------------------------------------


class RevenuePointOut(ApiModel):
    period: date
    amount: Decimal
    receipts: int


class RevenueOut(ApiModel):
    group_by: GroupBy
    total: Decimal
    points: list[RevenuePointOut]


async def _revenue(
    session: AsyncSession, date_from: datetime, date_to: datetime, group: GroupBy
) -> RevenueOut:
    amounts: dict[date, Decimal] = defaultdict(Decimal)
    counts: dict[date, int] = defaultdict(int)
    for receipt in await _paid_receipts(session, date_from, date_to):
        bucket = _bucket_of(receipt.date, group)
        amounts[bucket] += receipt.amount
        counts[bucket] += 1
    points = [
        RevenuePointOut(period=b, amount=_money(amounts[b]), receipts=counts[b])
        for b in _buckets(date_from, date_to, group)
    ]
    return RevenueOut(
        group_by=group, total=_money(sum(amounts.values(), Decimal(0))), points=points
    )


@router.get("/revenue", response_model=Envelope[RevenueOut])
async def revenue(
    _superuser: SuperUser,
    tenant_session: TenantSession,
    date_from: DateFrom,
    date_to: DateTo,
    group_by: Annotated[GroupBy, Query(alias="groupBy")] = GroupBy.DAY,
) -> Envelope[RevenueOut]:
    _check_period(date_from, date_to)
    return Envelope(data=await _revenue(tenant_session, date_from, date_to, group_by))


# --- Клиенты ------------------------------------------------------------------


class ClientsPointOut(ApiModel):
    period: date
    new: int
    returning: int
    total: int
    # % клиентов предыдущего интервала, у которых был визит в этом; null — не с чем сравнить
    retention_percent: float | None


class ClientsOut(ApiModel):
    group_by: GroupBy
    new: int
    returning: int
    total: int
    points: list[ClientsPointOut]


async def _clients(
    session: AsyncSession, date_from: datetime, date_to: datetime, group: GroupBy
) -> ClientsOut:
    """Новый — первый завершённый визит в салоне попал в интервал; остальные — повторные."""
    buckets = _buckets(date_from, date_to, group)
    lookback, _ = day_bounds(_previous_bucket(buckets[0], group))
    rows = (
        await session.execute(
            select(Record.client_id, Record.start_at).where(
                Record.status == RecordStatus.COMPLETED,
                Record.start_at >= min(lookback, date_from),
                Record.start_at < date_to,
            )
        )
    ).all()
    client_ids = {client_id for client_id, _ in rows}
    first_visit: dict[uuid.UUID, datetime] = {}
    if client_ids:
        first_visit = dict(
            (
                await session.execute(
                    select(Record.client_id, func.min(Record.start_at))
                    .where(
                        Record.status == RecordStatus.COMPLETED,
                        Record.client_id.in_(client_ids),
                    )
                    .group_by(Record.client_id)
                )
            ).all()
        )

    by_bucket: dict[date, set[uuid.UUID]] = defaultdict(set)
    in_period: set[uuid.UUID] = set()
    for client_id, start_at in rows:
        by_bucket[_bucket_of(start_at, group)].add(client_id)
        if date_from <= start_at < date_to:
            in_period.add(client_id)

    points = []
    for bucket in buckets:
        clients = by_bucket.get(bucket, set())
        new = {c for c in clients if _bucket_of(first_visit[c], group) == bucket}
        previous = by_bucket.get(_previous_bucket(bucket, group), set())
        points.append(
            ClientsPointOut(
                period=bucket,
                new=len(new),
                returning=len(clients) - len(new),
                total=len(clients),
                retention_percent=(
                    round(len(previous & clients) / len(previous) * 100, 1) if previous else None
                ),
            )
        )
    new_total = {c for c in in_period if date_from <= first_visit[c] < date_to}
    return ClientsOut(
        group_by=group,
        new=len(new_total),
        returning=len(in_period) - len(new_total),
        total=len(in_period),
        points=points,
    )


@router.get("/clients", response_model=Envelope[ClientsOut])
async def clients_report(
    _admin: AdminUser,
    tenant_session: TenantSession,
    date_from: DateFrom,
    date_to: DateTo,
    group_by: Annotated[GroupBy, Query(alias="groupBy")] = GroupBy.DAY,
) -> Envelope[ClientsOut]:
    _check_period(date_from, date_to)
    return Envelope(data=await _clients(tenant_session, date_from, date_to, group_by))


# --- Сотрудники ---------------------------------------------------------------


class StaffRowOut(ApiModel):
    master_id: uuid.UUID
    name: str
    records: int
    completed: int
    no_show: int
    cancelled: int
    # Денежные — только суперюзеру
    revenue: Decimal | None
    avg_check: Decimal | None
    rating: float | None
    reviews: int


async def _staff(
    session: AsyncSession, date_from: datetime, date_to: datetime, *, show_money: bool
) -> list[StaffRowOut]:
    counts = (
        await session.execute(
            select(
                Record.master_id,
                func.max(Record.master_name),
                func.count(),
                func.count().filter(Record.status == RecordStatus.COMPLETED),
                func.count().filter(Record.status == RecordStatus.NO_SHOW),
                func.count().filter(Record.status == RecordStatus.CANCELLED),
            )
            .where(
                Record.master_id.is_not(None),
                Record.start_at >= date_from,
                Record.start_at < date_to,
            )
            .group_by(Record.master_id)
        )
    ).all()
    money = {
        master_id: (amount, n)
        for master_id, amount, n in (
            await session.execute(
                select(
                    Record.master_id,
                    func.sum(Receipt.amount - Receipt.products_amount),
                    func.count(),
                )
                .join(Record, Record.id == Receipt.record_id)
                .where(
                    Receipt.status != ReceiptStatus.CANCELLED,
                    Receipt.date >= date_from,
                    Receipt.date < date_to,
                    Record.master_id.is_not(None),
                )
                .group_by(Record.master_id)
            )
        ).all()
    }
    ratings = {
        master_id: (avg, n)
        for master_id, avg, n in (
            await session.execute(
                select(Review.master_id, func.avg(Review.rating), func.count())
                .where(Review.created_at >= date_from, Review.created_at < date_to)
                .group_by(Review.master_id)
            )
        ).all()
    }
    names: dict[uuid.UUID, str] = {}
    stats: dict[uuid.UUID, tuple[int, int, int, int]] = {}
    for master_id, name, total, completed, no_show, cancelled in counts:
        assert master_id is not None  # отфильтровано в запросе
        names[master_id] = name or "—"
        stats[master_id] = (total, completed, no_show, cancelled)
    # Мастер мог получить оплату в периоде за визит из прошлого периода
    for master_id in set(money) - set(names):
        assert master_id is not None
        names[master_id] = (
            await session.scalar(
                select(func.max(Record.master_name)).where(Record.master_id == master_id)
            )
        ) or "—"

    rows = []
    for master_id, name in names.items():
        total, completed, no_show, cancelled = stats.get(master_id, (0, 0, 0, 0))
        amount, paid = money.get(master_id, (Decimal(0), 0))
        avg_rating, reviews = ratings.get(master_id, (None, 0))
        rows.append(
            StaffRowOut(
                master_id=master_id,
                name=name,
                records=total,
                completed=completed,
                no_show=no_show,
                cancelled=cancelled,
                revenue=_money(amount) if show_money else None,
                avg_check=(_money(amount / paid) if paid else Decimal(0)) if show_money else None,
                rating=round(float(avg_rating), 2) if avg_rating is not None else None,
                reviews=reviews,
            )
        )
    rows.sort(key=lambda r: (-(r.revenue or 0), -r.completed, r.name))
    return rows


@router.get("/staff", response_model=Envelope[list[StaffRowOut]])
async def staff_report(
    user: AdminUser, tenant_session: TenantSession, date_from: DateFrom, date_to: DateTo
) -> Envelope[list[StaffRowOut]]:
    _check_period(date_from, date_to)
    return Envelope(
        data=await _staff(tenant_session, date_from, date_to, show_money=user.is_superuser)
    )


# --- Услуги -------------------------------------------------------------------


class ServiceRowOut(ApiModel):
    service_id: uuid.UUID
    name: str
    category: CategoryRef
    count: int
    revenue: Decimal | None
    # Услуги по абонементу: стоимость по цене единицы абонемента (решение 10)
    subscription_value: Decimal | None = None


class CategoryRowOut(ApiModel):
    category: CategoryRef
    count: int
    revenue: Decimal | None
    subscription_value: Decimal | None = None


class ServicesOut(ApiModel):
    services: list[ServiceRowOut]
    categories: list[CategoryRowOut]


async def _services(
    session: AsyncSession, date_from: datetime, date_to: datetime, *, show_money: bool
) -> ServicesOut:
    counts = (
        await session.execute(
            select(RecordService.service_id, func.max(RecordService.name), func.count())
            .join(Record, Record.id == RecordService.record_id)
            .where(
                Record.status == RecordStatus.COMPLETED,
                Record.start_at >= date_from,
                Record.start_at < date_to,
            )
            .group_by(RecordService.service_id)
        )
    ).all()

    revenue: dict[uuid.UUID, Decimal] = defaultdict(Decimal)
    by_subscription: dict[uuid.UUID, Decimal] = defaultdict(Decimal)
    names: dict[uuid.UUID, str] = {service_id: name for service_id, name, _ in counts}
    paid = [r for r in await _paid_receipts(session, date_from, date_to) if r.record_id]
    if show_money and paid:
        items: dict[uuid.UUID, list[RecordService]] = defaultdict(list)
        for item in await session.scalars(
            select(RecordService).where(RecordService.record_id.in_({r.record_id for r in paid}))
        ):
            items[item.record_id].append(item)
        for receipt in paid:
            assert receipt.record_id is not None
            lines = items.get(receipt.record_id, [])
            for line in lines:
                if line.subscription_unit_value is not None:
                    by_subscription[line.service_id] += line.subscription_unit_value
                    names.setdefault(line.service_id, line.name)
            # Деньги чека делятся только между строками, оплаченными не абонементом
            parts = [line for line in lines if line.subscription_id is None]
            base = sum((p.price for p in parts), Decimal(0))
            for part in parts:
                share = part.price / base if base else Decimal(1) / len(parts)
                revenue[part.service_id] += receipt.services_amount * share
                names.setdefault(part.service_id, part.name)

    service_ids = set(names)
    categories: dict[uuid.UUID, CategoryRef] = {}
    if service_ids:
        rows = await session.execute(
            select(Service.id, ServiceCategory.id, ServiceCategory.name)
            .join(ServiceCategory, ServiceCategory.id == Service.category_id)
            .where(Service.id.in_(service_ids))
        )
        categories = {sid: CategoryRef(id=cid, name=cname) for sid, cid, cname in rows.all()}
    count_by_id = {service_id: n for service_id, _, n in counts}
    services = [
        ServiceRowOut(
            service_id=service_id,
            name=names[service_id],
            category=categories[service_id],
            count=count_by_id.get(service_id, 0),
            revenue=_money(revenue[service_id]) if show_money else None,
            subscription_value=_money(by_subscription[service_id]) if show_money else None,
        )
        for service_id in service_ids
    ]
    services.sort(key=lambda s: (-(s.revenue or 0), -s.count, s.name))

    by_category: dict[uuid.UUID, list[ServiceRowOut]] = defaultdict(list)
    for service in services:
        by_category[service.category.id].append(service)
    category_rows = [
        CategoryRowOut(
            category=rows[0].category,
            count=sum(s.count for s in rows),
            revenue=_money(sum((s.revenue or Decimal(0) for s in rows), Decimal(0)))
            if show_money
            else None,
            subscription_value=_money(
                sum((s.subscription_value or Decimal(0) for s in rows), Decimal(0))
            )
            if show_money
            else None,
        )
        for rows in by_category.values()
    ]
    category_rows.sort(key=lambda c: (-(c.revenue or 0), -c.count, uk_sort_key(c.category.name)))
    return ServicesOut(services=services, categories=category_rows)


@router.get("/services", response_model=Envelope[ServicesOut])
async def services_report(
    user: AdminUser, tenant_session: TenantSession, date_from: DateFrom, date_to: DateTo
) -> Envelope[ServicesOut]:
    _check_period(date_from, date_to)
    return Envelope(
        data=await _services(tenant_session, date_from, date_to, show_money=user.is_superuser)
    )


# --- Товары -------------------------------------------------------------------


class ProductRowOut(ApiModel):
    product_id: uuid.UUID
    name: str
    sku: str
    category: str | None
    unit: ProductUnit
    # Продано бутылок, на разлив и всего — в единице карточки
    packages_sold: Decimal
    volume_sold: Decimal
    total_sold: Decimal
    # Денежные — только суперюзеру. Выручка — после скидки; себестоимость — по строкам,
    # где она задана; маржа — только если задана у всех строк товара
    revenue: Decimal | None
    cost: Decimal | None
    margin: Decimal | None


async def _products(
    session: AsyncSession, date_from: datetime, date_to: datetime, *, show_money: bool
) -> list[ProductRowOut]:
    """Строки неотменённых чеков за период; ручная сумма «Продано» сюда не попадает."""
    line = ReceiptProductLine
    rows = (
        await session.execute(
            select(
                line.product_id,
                func.max(line.name),
                func.max(line.sku),
                InventoryCategory.name,
                line.unit,
                func.coalesce(
                    func.sum(line.quantity).filter(line.mode == ProductSaleMode.PACKAGE), 0
                ),
                func.coalesce(
                    func.sum(line.quantity).filter(line.mode == ProductSaleMode.VOLUME), 0
                ),
                func.sum(line.base_quantity),
                func.sum(line.paid_amount),
                func.sum(line.cost_amount),
                func.count(line.cost_amount),
                func.count(),
            )
            .join(Receipt, Receipt.id == line.receipt_id)
            .join(Product, Product.id == line.product_id)
            .outerjoin(InventoryCategory, InventoryCategory.id == Product.category_id)
            .where(
                Receipt.status != ReceiptStatus.CANCELLED,
                Receipt.date >= date_from,
                Receipt.date < date_to,
            )
            .group_by(line.product_id, InventoryCategory.name, line.unit)
        )
    ).all()
    result = []
    for (
        product_id,
        name,
        sku,
        category,
        unit,
        packages,
        volume,
        total,
        paid,
        cost,
        costed,
        n,
    ) in rows:
        result.append(
            ProductRowOut(
                product_id=product_id,
                name=name,
                sku=sku,
                category=category,
                unit=unit,
                packages_sold=packages,
                volume_sold=volume,
                total_sold=total,
                revenue=_money(paid) if show_money else None,
                cost=_money(cost) if show_money and cost is not None else None,
                margin=(
                    _money(paid - cost) if show_money and cost is not None and costed == n else None
                ),
            )
        )
    result.sort(key=lambda r: (-(r.revenue or 0), -r.total_sold, uk_sort_key(r.name)))
    return result


@router.get("/products", response_model=Envelope[list[ProductRowOut]])
async def products_report(
    user: AdminUser, tenant_session: TenantSession, date_from: DateFrom, date_to: DateTo
) -> Envelope[list[ProductRowOut]]:
    _check_period(date_from, date_to)
    return Envelope(
        data=await _products(tenant_session, date_from, date_to, show_money=user.is_superuser)
    )


# --- Excel --------------------------------------------------------------------


def _num(value: Decimal | float | None) -> float | None:
    return float(value) if value is not None else None


@router.get("/export")
async def export_reports(
    user: AdminUser,
    tenant_session: TenantSession,
    date_from: DateFrom,
    date_to: DateTo,
    group_by: Annotated[GroupBy, Query(alias="groupBy")] = GroupBy.DAY,
) -> StreamingResponse:
    """Все отчёты одним файлом; администратору — без денежных колонок и листа выручки."""
    from openpyxl import Workbook

    _check_period(date_from, date_to)
    money = user.is_superuser
    wb = Workbook()

    ws = wb.active
    ws.title = "Підсумки"
    data = await _summary(tenant_session, date_from, date_to, show_money=money)
    ws.append(["Показник", "Період", "Попередній період", "Зміна, %"])
    metrics: list[tuple[str, MetricOut | None]] = [
        ("Виручка", data.revenue),
        ("Середній чек", data.avg_check),
        ("Клієнти", data.clients),
        ("Записи", data.records),
    ]
    for title, metric in metrics:
        if metric is not None:
            ws.append([title, _num(metric.value), _num(metric.previous), metric.change_percent])

    if money:
        ws = wb.create_sheet("Виручка")
        ws.append(["Період", "Виручка", "Чеків"])
        for point in (await _revenue(tenant_session, date_from, date_to, group_by)).points:
            ws.append([point.period.isoformat(), _num(point.amount), point.receipts])

    ws = wb.create_sheet("Клієнти")
    ws.append(["Період", "Нові", "Повторні", "Усього", "Утримання, %"])
    for c in (await _clients(tenant_session, date_from, date_to, group_by)).points:
        ws.append([c.period.isoformat(), c.new, c.returning, c.total, c.retention_percent])

    ws = wb.create_sheet("Співробітники")
    header: list[Any] = ["Майстер", "Записи", "Завершено", "Не прийшли", "Скасовано"]
    header += (["Виручка", "Середній чек"] if money else []) + ["Рейтинг", "Відгуків"]
    ws.append(header)
    for s in await _staff(tenant_session, date_from, date_to, show_money=money):
        row: list[Any] = [s.name, s.records, s.completed, s.no_show, s.cancelled]
        row += ([_num(s.revenue), _num(s.avg_check)] if money else []) + [s.rating, s.reviews]
        ws.append(row)

    ws = wb.create_sheet("Послуги")
    ws.append(["Послуга", "Категорія", "Кількість"] + (["Виручка"] if money else []))
    for svc in (await _services(tenant_session, date_from, date_to, show_money=money)).services:
        ws.append([svc.name, svc.category.name, svc.count] + ([_num(svc.revenue)] if money else []))

    ws = wb.create_sheet("Товари")
    product_header: list[Any] = ["Товар", "Артикул", "Категорія", "Одиниця"]
    product_header += ["Продано упаковок", "Продано на розлив", "Усього в одиниці"]
    product_header += ["Виручка", "Собівартість", "Маржа"] if money else []
    ws.append(product_header)
    for p in await _products(tenant_session, date_from, date_to, show_money=money):
        product_row: list[Any] = [p.name, p.sku, p.category, UNIT_NAMES[p.unit]]
        product_row += [_num(p.packages_sold), _num(p.volume_sold), _num(p.total_sold)]
        product_row += [_num(p.revenue), _num(p.cost), _num(p.margin)] if money else []
        ws.append(product_row)

    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": 'attachment; filename="reports.xlsx"'},
    )


# --- SMS-нагадування (сеть) -----------------------------------------------------

# Принято провайдером — за эти SMS платим
_SMS_ACCEPTED = {
    ReminderDeliveryStatus.SENT,
    ReminderDeliveryStatus.DELIVERED,
    ReminderDeliveryStatus.UNDELIVERED,
}


class SmsReportRowOut(ApiModel):
    salon_id: uuid.UUID | None
    salon_name: str
    # false — шард салона недоступен, цифр нет
    available: bool = True
    # SMS, принятые провайдером (оплачиваемые), и их сегменты
    sms: int = 0
    segments: int = 0
    delivered: int = 0
    undelivered: int = 0
    # Принято, финального статуса ещё нет (или в очереди на отправку)
    pending: int = 0
    failed: int = 0
    skipped: int = 0
    # Из принятых — запасные после неудачи Telegram
    fallback: int = 0
    cost: Decimal = Decimal(0)
    # Напоминания, доставленные в Telegram
    telegram: int = 0


class SmsReportOut(ApiModel):
    rows: list[SmsReportRowOut]
    total: SmsReportRowOut


async def _sms_row(session: AsyncSession, date_from: datetime, date_to: datetime) -> dict[str, Any]:
    result = await session.execute(
        select(
            ReminderDelivery.channel,
            ReminderDelivery.status,
            ReminderDelivery.is_fallback,
            func.count(),
            func.coalesce(func.sum(ReminderDelivery.segments), 0),
            func.coalesce(func.sum(ReminderDelivery.cost), 0),
        )
        .where(ReminderDelivery.created_at >= date_from, ReminderDelivery.created_at < date_to)
        .group_by(ReminderDelivery.channel, ReminderDelivery.status, ReminderDelivery.is_fallback)
    )
    row: dict[str, Any] = defaultdict(int)
    row["cost"] = Decimal(0)
    for channel, status, is_fallback, count, segments, cost in result.all():
        if channel == DeliveryChannel.TELEGRAM:
            if status == ReminderDeliveryStatus.SENT:
                row["telegram"] += count
            continue
        if status in _SMS_ACCEPTED:
            row["sms"] += count
            row["segments"] += int(segments)
            row["cost"] += Decimal(cost)
            if is_fallback:
                row["fallback"] += count
        if status == ReminderDeliveryStatus.DELIVERED:
            row["delivered"] += count
        elif status == ReminderDeliveryStatus.UNDELIVERED:
            row["undelivered"] += count
        elif status in (ReminderDeliveryStatus.SENT, ReminderDeliveryStatus.QUEUED):
            row["pending"] += count
        elif status == ReminderDeliveryStatus.FAILED:
            row["failed"] += count
        elif status == ReminderDeliveryStatus.SKIPPED:
            row["skipped"] += count
    row["cost"] = _money(row["cost"])
    return dict(row)


_SMS_COUNTERS = (
    "sms",
    "segments",
    "delivered",
    "undelivered",
    "pending",
    "failed",
    "skipped",
    "fallback",
    "telegram",
)


@router.get("/sms", response_model=Envelope[SmsReportOut])
async def sms_report(
    user: SuperUser,
    request: Request,
    master_session: MasterSession,
    date_from: DateFrom,
    date_to: DateTo,
) -> Envelope[SmsReportOut]:
    """По салонам: SMS, сегменты, доставлено / не доставлено / ошибки / пропущено, стоимость;
    сколько напоминаний ушло в Telegram. Период — по дате отправки.
    """
    _check_period(date_from, date_to)
    registry: EngineRegistry = request.app.state.engine_registry
    salons = list(
        await master_session.scalars(
            select(Salon)
            .where(Salon.id.in_(user.salon_ids), Salon.status == SalonStatus.ACTIVE)
            .order_by(Salon.name)
        )
    )
    rows: list[SmsReportRowOut] = []
    for salon in salons:
        try:
            factory = await registry.get_sessionmaker(salon.id)
            async with factory() as shard:
                data = await _sms_row(shard, date_from, date_to)
        except (SalonNotFound, SalonSuspended, SQLAlchemyError, OSError):
            rows.append(SmsReportRowOut(salon_id=salon.id, salon_name=salon.name, available=False))
            continue
        rows.append(SmsReportRowOut(salon_id=salon.id, salon_name=salon.name, **data))

    total = SmsReportRowOut(salon_id=None, salon_name="Усього по мережі")
    for row in rows:
        for field in _SMS_COUNTERS:
            setattr(total, field, getattr(total, field) + getattr(row, field))
        total.cost += row.cost
    total.cost = _money(total.cost)
    return Envelope(data=SmsReportOut(rows=rows, total=total))
