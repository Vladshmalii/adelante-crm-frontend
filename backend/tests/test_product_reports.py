"""Отчёты с товарами в чеке: выручка мастера и услуг без товаров, отчёт по товарам, права."""

import io
import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Any
from urllib.parse import quote
from zoneinfo import ZoneInfo

import pytest
from openpyxl import load_workbook

from tests.conftest import Salon
from tests.loyalty_world import Place, money, new_client, setup_place

TZ = ZoneInfo("Europe/Kyiv")


@dataclass
class World:
    s: Salon
    place: Place
    adm: str
    mst: str
    period: str
    cream: dict[str, Any]
    shampoo: dict[str, Any]
    master_id: str


def _product(s: Salon, adm: str, **fields: Any) -> dict[str, Any]:
    return s.api.post(
        "/inventory/products",
        token=adm,
        salon=s.id,
        expect=201,
        json={"sku": f"SKU-{uuid.uuid4().hex[:8]}", **fields},
    )


@pytest.fixture(scope="module")
def w(new_salon: Salon) -> World:
    """Визит 100 ₴ + 1 бутылка и 250 мл (475 ₴); продажа 2 шт крема; один чек отменён."""
    s = new_salon
    place = setup_place(s.api, s.id, s.su)
    _, adm = s.create_staff(role="administrator")
    _, mst = s.create_staff()
    category = s.api.post(
        "/inventory/categories", token=adm, salon=s.id, expect=201, json={"name": "Догляд"}
    )
    shampoo = _product(
        s,
        adm,
        name="Шампунь",
        unit="ml",
        packageVolume=1000,
        packagePrice=350,
        salePrice=0.5,
        costPrice=0.2,
        quantity=5000,
        categoryId=category["id"],
    )
    cream = _product(s, adm, name="Крем", unit="pcs", salePrice=80, quantity=10)
    service = place.service(100, "Стрижка")
    cid = new_client(place)

    rec = place.record(cid, service)
    place.pay(
        rec["id"],
        [("cash", 575)],
        token=adm,
        extra={
            "products": [
                {"productId": shampoo["id"], "mode": "package", "quantity": 1},
                {"productId": shampoo["id"], "mode": "volume", "quantity": 250},
            ]
        },
    )
    for quantity, cancel in ((2, False), (3, True)):
        receipt = s.api.post(
            "/finances/receipts",
            token=adm,
            salon=s.id,
            expect=201,
            json={
                "payments": [
                    {"paymentMethodId": place.methods["cash"]["id"], "amount": 80 * quantity}
                ],
                "products": [{"productId": cream["id"], "mode": "volume", "quantity": quantity}],
            },
        )
        if cancel:
            place.cancel(receipt["id"])
    # Ручная сумма: в отчёт по товарам не попадает
    s.api.post(
        "/finances/receipts",
        token=adm,
        salon=s.id,
        expect=201,
        json={
            "subtotal": 50,
            "payments": [{"paymentMethodId": place.methods["cash"]["id"], "amount": 50}],
        },
    )
    now = datetime.now(TZ)
    start, end = now - timedelta(days=2), now + timedelta(days=2)
    period = f"dateFrom={quote(start.isoformat())}&dateTo={quote(end.isoformat())}"
    return World(s, place, adm, mst, period, cream, shampoo, place.master_id)


def test_revenue_of_master_and_services_excludes_products(w: World) -> None:
    api, s = w.s.api, w.s
    staff = api.get(f"/reports/staff?{w.period}", token=s.su, salon=s.id)
    row = next(r for r in staff if r["masterId"] == w.master_id)
    assert money(row["revenue"]) == 100 and money(row["avgCheck"]) == 100

    services = api.get(f"/reports/services?{w.period}", token=s.su, salon=s.id)
    assert money(services["services"][0]["revenue"]) == 100

    stats = api.get(f"/staff/{w.master_id}/stats", token=s.su, salon=s.id)
    assert money(stats["revenue"]) == 100


def test_total_revenue_includes_products(w: World) -> None:
    api, s = w.s.api, w.s
    summary = api.get(f"/reports/summary?{w.period}", token=s.su, salon=s.id)
    # 575 (визит с товарами) + 160 (крем) + 50 (ручная сумма)
    assert money(summary["revenue"]["value"]) == 785
    assert money(summary["avgCheck"]["value"]) == round(money(785) / 3, 2)
    revenue = api.get(f"/reports/revenue?{w.period}", token=s.su, salon=s.id)
    assert money(revenue["total"]) == 785


def test_dashboard_by_master_excludes_products(w: World) -> None:
    api, s = w.s.api, w.s
    all_revenue = api.get(f"/finances/dashboard?{w.period}", token=s.su, salon=s.id)
    assert money(all_revenue["totalRevenue"]) == 785
    by_master = api.get(
        f"/finances/dashboard?{w.period}&masterId={w.master_id}", token=s.su, salon=s.id
    )
    assert money(by_master["totalRevenue"]) == 100


def test_products_report(w: World) -> None:
    api, s = w.s.api, w.s
    rows = {r["name"]: r for r in api.get(f"/reports/products?{w.period}", token=s.su, salon=s.id)}
    assert set(rows) == {"Шампунь", "Крем"}
    shampoo = rows["Шампунь"]
    assert shampoo["category"] == "Догляд" and shampoo["sku"] == w.shampoo["sku"]
    assert shampoo["unit"] == "ml"
    assert money(shampoo["packagesSold"]) == 1
    assert money(shampoo["volumeSold"]) == 250
    assert money(shampoo["totalSold"]) == 1250
    assert money(shampoo["revenue"]) == 475
    assert money(shampoo["cost"]) == 250  # 0,2 × 1250
    assert money(shampoo["margin"]) == 225
    cream = rows["Крем"]
    # Отменённый чек на 3 шт не считается; себестоимости нет — маржи нет
    assert money(cream["volumeSold"]) == 2 and money(cream["packagesSold"]) == 0
    assert money(cream["revenue"]) == 160
    assert cream["cost"] is None and cream["margin"] is None


def test_products_report_rights(w: World) -> None:
    api, s = w.s.api, w.s
    rows = api.get(f"/reports/products?{w.period}", token=w.adm, salon=s.id)
    assert {r["name"] for r in rows} == {"Шампунь", "Крем"}
    assert all(r["revenue"] is None and r["cost"] is None and r["margin"] is None for r in rows)
    assert any(money(r["totalSold"]) == 1250 for r in rows)
    api.get(f"/reports/products?{w.period}", token=w.mst, salon=s.id, expect=403)
    api.get(
        "/reports/products?dateFrom=2026-02-01T00:00:00&dateTo=2026-01-01T00:00:00",
        token=s.su,
        salon=s.id,
        expect=422,
    )


def test_products_report_period(w: World) -> None:
    api, s = w.s.api, w.s
    old_from = datetime.now(TZ) - timedelta(days=40)
    old_to = old_from + timedelta(days=5)
    query = f"dateFrom={quote(old_from.isoformat())}&dateTo={quote(old_to.isoformat())}"
    assert api.get(f"/reports/products?{query}", token=s.su, salon=s.id) == []


def test_products_sheet_in_export(w: World) -> None:
    api, s = w.s.api, w.s
    su_file = api.get(f"/reports/export?{w.period}", token=s.su, salon=s.id)
    sheet = load_workbook(io.BytesIO(su_file.content))["Товари"]
    rows = list(sheet.values)
    assert rows[0][-1] == "Маржа"
    by_name = {r[0]: r for r in rows[1:]}
    assert by_name["Шампунь"][3] == "мл" and by_name["Шампунь"][6] == 1250
    assert by_name["Шампунь"][7] == 475

    admin_file = api.get(f"/reports/export?{w.period}", token=w.adm, salon=s.id)
    header = next(iter(load_workbook(io.BytesIO(admin_file.content))["Товари"].values))
    assert "Виручка" not in header and "Маржа" not in header
