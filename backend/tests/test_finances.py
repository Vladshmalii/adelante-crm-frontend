"""Финансы: фильтры по мастеру записи и локации, редактирование касс, выключенные кассы."""

from dataclasses import dataclass
from datetime import date, datetime, timedelta
from typing import Any

import pytest

from tests.conftest import Salon, phone


@dataclass
class World:
    s: Salon
    m1: dict[str, Any]
    m2: dict[str, Any]
    center: dict[str, Any]
    mall: dict[str, Any]
    cash_center: dict[str, Any]
    cash_mall: dict[str, Any]
    period: str


def _paid_record(
    s: Salon,
    master: dict[str, Any],
    service: dict[str, Any],
    method: dict[str, Any],
    when: datetime,
) -> dict[str, Any]:
    rec = s.api.post(
        "/records",
        token=s.su,
        salon=s.id,
        expect=201,
        json={
            "newClient": {"name": "Клієнт", "phone": phone()},
            "masterId": master["id"],
            "serviceIds": [service["id"]],
            "startAt": when.isoformat(),
        },
    )
    s.api.post(f"/records/{rec['id']}/complete", token=s.su, salon=s.id, json={})
    s.api.post(
        f"/records/{rec['id']}/payment",
        token=s.su,
        salon=s.id,
        json={"payments": [{"paymentMethodId": method["id"], "amount": float(rec["totalAmount"])}]},
    )
    return rec


@pytest.fixture(scope="module")
def w(new_salon: Salon) -> World:
    s = new_salon
    m1, _ = s.create_staff(firstName="Анна")
    m2, _ = s.create_staff(firstName="Богдана")
    svc = s.api.post(
        "/services",
        token=s.su,
        salon=s.id,
        expect=201,
        json={"name": "Стрижка", "price": 300, "durationMinutes": 30},
    )
    center = s.api.post(
        "/finances/cash-registers",
        token=s.su,
        salon=s.id,
        expect=201,
        json={"name": "Центр", "location": "Центр"},
    )
    mall = s.api.post(
        "/finances/cash-registers",
        token=s.su,
        salon=s.id,
        expect=201,
        json={"name": "ТЦ", "location": "ТЦ Океан"},
    )
    cash_center = s.api.post(
        "/finances/payment-methods",
        token=s.su,
        salon=s.id,
        expect=201,
        json={"name": "Готівка", "type": "cash", "cashRegisterId": center["id"]},
    )
    cash_mall = s.api.post(
        "/finances/payment-methods",
        token=s.su,
        salon=s.id,
        expect=201,
        json={"name": "Картка", "type": "card", "cashRegisterId": mall["id"]},
    )
    base = datetime.combine(date.today() - timedelta(days=2), datetime.min.time()).replace(hour=10)
    _paid_record(s, m1, svc, cash_center, base)
    _paid_record(s, m2, svc, cash_mall, base + timedelta(hours=1))
    s.api.post(
        "/finances/receipts",
        token=s.su,
        salon=s.id,
        expect=201,
        json={
            "clientName": "Продаж",
            "payments": [{"paymentMethodId": cash_center["id"], "amount": 50}],
        },
    )
    period = f"dateFrom={date.today() - timedelta(days=7)}T00:00:00&dateTo={date.today() + timedelta(days=1)}T00:00:00"
    return World(s, m1, m2, center, mall, cash_center, cash_mall, period)


def test_filter_by_record_master(w: World) -> None:
    api, s = w.s.api, w.s
    ops = api.get(f"/finances/operations?masterId={w.m1['id']}", token=s.su, salon=s.id)
    assert [float(o["amount"]) for o in ops] == [300.0]
    receipts = api.get(f"/finances/receipts?masterId={w.m2['id']}", token=s.su, salon=s.id)
    assert len(receipts) == 1 and receipts[0]["cashRegister"]["name"] == "ТЦ"
    dash = api.get(f"/finances/dashboard?{w.period}&masterId={w.m1['id']}", token=s.su, salon=s.id)
    assert float(dash["totalRevenue"]) == 300  # ручной чек без записи не попадает
    all_dash = api.get(f"/finances/dashboard?{w.period}", token=s.su, salon=s.id)
    assert float(all_dash["totalRevenue"]) == 650


def test_filter_by_location(w: World) -> None:
    api, s = w.s.api, w.s
    assert api.get("/finances/locations", token=s.su, salon=s.id) == ["ТЦ Океан", "Центр"]
    ops = api.get("/finances/operations?location=Центр", token=s.su, salon=s.id)
    assert sorted(float(o["amount"]) for o in ops) == [50.0, 300.0]
    dash = api.get(f"/finances/dashboard?{w.period}&location=ТЦ Океан", token=s.su, salon=s.id)
    assert float(dash["totalRevenue"]) == 300
    assert [t["name"] for t in dash["topServices"]] == ["Стрижка"]
    export = api.get(f"/finances/export?{w.period}&location=Центр", token=s.su, salon=s.id)
    assert export.content[:2] == b"PK"


def test_patch_cash_register(w: World) -> None:
    api, s = w.s.api, w.s
    updated = api.patch(
        f"/finances/cash-registers/{w.center['id']}",
        token=s.su,
        salon=s.id,
        json={"name": "Центр (рецепція)", "location": "  "},
    )
    assert updated["name"] == "Центр (рецепція)" and updated["location"] is None
    assert float(updated["balance"]) == 350
    api.patch(
        f"/finances/cash-registers/{w.center['id']}",
        token=s.su,
        salon=s.id,
        expect=422,
        json={"name": None},
    )
    assert api.get("/finances/locations", token=s.su, salon=s.id) == ["ТЦ Океан"]


def test_inactive_register_is_blocked(w: World) -> None:
    api, s = w.s.api, w.s
    spare = api.post(
        "/finances/cash-registers", token=s.su, salon=s.id, expect=201, json={"name": "Резерв"}
    )
    method = api.post(
        "/finances/payment-methods",
        token=s.su,
        salon=s.id,
        expect=201,
        json={"name": "Резерв", "type": "cash", "cashRegisterId": spare["id"]},
    )
    api.patch(
        f"/finances/cash-registers/{spare['id']}", token=s.su, salon=s.id, json={"isActive": False}
    )
    api.post(
        "/finances/payment-methods",
        token=s.su,
        salon=s.id,
        expect=422,
        json={"name": "Ще", "type": "cash", "cashRegisterId": spare["id"]},
    )
    api.post(
        "/finances/operations",
        token=s.su,
        salon=s.id,
        expect=422,
        json={
            "type": "expense",
            "amount": 10,
            "date": "2026-09-01T10:00:00",
            "cashRegisterId": spare["id"],
        },
    )
    api.post(
        "/finances/receipts",
        token=s.su,
        salon=s.id,
        expect=422,
        json={"payments": [{"paymentMethodId": method["id"], "amount": 10}]},
    )
    registers = api.get("/finances/cash-registers", token=s.su, salon=s.id)
    assert next(r for r in registers if r["id"] == spare["id"])["isActive"] is False


def test_finances_superuser_only(w: World) -> None:
    _, adm = w.s.create_staff("administrator")
    w.s.api.patch(
        f"/finances/cash-registers/{w.mall['id']}",
        token=adm,
        salon=w.s.id,
        expect=403,
        json={"name": "X"},
    )
    w.s.api.get("/finances/locations", token=adm, salon=w.s.id, expect=403)
