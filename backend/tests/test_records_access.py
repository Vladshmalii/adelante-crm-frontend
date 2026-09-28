"""Роли и права, контракт записи, завершение и оплата, сотрудники, профиль."""

from dataclasses import dataclass
from datetime import date, datetime, timedelta
from typing import Any
from zoneinfo import ZoneInfo

import pytest

from tests.conftest import WEEK_9_TO_18, Salon, phone

TZ = ZoneInfo("Europe/Kyiv")


@dataclass
class World:
    s: Salon
    adm: str
    master: dict[str, Any]
    mst: str
    master2: dict[str, Any]
    mst2: str
    admin: dict[str, Any]
    cut: dict[str, Any]
    styling: dict[str, Any]
    day: date
    pm: dict[str, Any]

    def at(self, hour: int, minute: int = 0, days: int = 0) -> str:
        d = self.day + timedelta(days=days)
        return datetime(d.year, d.month, d.day, hour, minute).isoformat()  # без зоны → Киев

    def record(self, token: str | None = None, **body: Any) -> dict[str, Any]:
        payload = {"serviceIds": [self.cut["id"]], "startAt": self.at(15), **body}
        if "clientId" not in payload:
            payload.setdefault("newClient", {"name": "Клієнт", "phone": phone()})
        return self.s.api.post(
            "/records", token=token or self.adm, salon=self.s.id, json=payload, expect=201
        )


@pytest.fixture(scope="module")
def w(new_salon: Salon) -> World:
    s = new_salon
    admin, adm = s.create_staff("administrator", firstName="Олег")
    master, mst = s.create_staff(firstName="Марія", salary=15000, commissionPercent=30)
    master2, mst2 = s.create_staff(firstName="Інна")
    for m in (master, master2):
        s.api.post(f"/staff/{m['id']}/schedule", token=adm, salon=s.id, json=WEEK_9_TO_18)
    cut = s.api.post(
        "/services",
        token=adm,
        salon=s.id,
        expect=201,
        json={
            "name": "Стрижка",
            "price": 300,
            "durationMinutes": 30,
            "category": "hair",
            "masterIds": [master["id"], master2["id"]],
        },
    )
    styling = s.api.post(
        "/services",
        token=adm,
        salon=s.id,
        expect=201,
        json={
            "name": "Укладка",
            "price": 500,
            "durationMinutes": 45,
            "category": "styling",
            "masterIds": [master["id"]],
        },
    )
    reg = s.api.post(
        "/finances/cash-registers", token=s.su, salon=s.id, expect=201, json={"name": "Каса"}
    )
    pm = s.api.post(
        "/finances/payment-methods",
        token=s.su,
        salon=s.id,
        expect=201,
        json={"name": "Готівка", "type": "cash", "cashRegisterId": reg["id"]},
    )
    return World(
        s,
        adm,
        master,
        mst,
        master2,
        mst2,
        admin,
        cut,
        styling,
        date.today() + timedelta(days=3),
        pm,
    )


# --- Права --------------------------------------------------------------------


def test_superuser_login_and_me(w: World) -> None:
    me = w.s.api.get("/auth/me", token=w.s.su, salon=w.s.id)
    assert me["isSuperuser"] and me["timezone"] == "Europe/Kyiv"


def test_admin_restrictions(w: World) -> None:
    api, s = w.s.api, w.s
    staff = api.get("/staff", token=w.adm, salon=s.id)
    assert all(x["salary"] is None for x in staff)
    api.post(
        "/staff",
        token=w.adm,
        salon=s.id,
        expect=403,
        json={
            "firstName": "X",
            "phone": "1",
            "email": "x@x.ua",
            "password": "password1",
            "role": "administrator",
        },
    )
    api.post(
        "/staff",
        token=w.adm,
        salon=s.id,
        expect=403,
        json={"firstName": "X", "phone": "1", "salary": 1},
    )
    api.patch(
        f"/staff/{w.admin['id']}", token=w.adm, salon=s.id, expect=403, json={"firstName": "Я"}
    )
    api.patch(f"/staff/{w.master['id']}", token=w.adm, salon=s.id, expect=403, json={"salary": 1})
    assert (
        api.patch(
            f"/staff/{w.master['id']}", token=w.adm, salon=s.id, json={"position": "Топ-майстер"}
        )["position"]
        == "Топ-майстер"
    )
    for path in (
        f"/staff/{w.master['id']}/stats",
        "/staff/export",
        "/finances/cash-registers",
        "/clients/export",
        "/reports/revenue?dateFrom=2026-01-01&dateTo=2026-02-01",
    ):
        api.get(path, token=w.adm, salon=s.id, expect=403)
    api.get(f"/staff/{w.master['id']}/stats", token=s.su, salon=s.id)
    export = api.get("/staff/export", token=s.su, salon=s.id)
    assert export.content[:2] == b"PK"


def test_master_restrictions(w: World) -> None:
    api, s = w.s.api, w.s
    for path in (
        "/staff",
        "/audit",
        "/reviews",
        "/finances/cash-registers",
        "/inventory/categories",
        "/reports/summary?dateFrom=2026-01-01&dateTo=2026-02-01",
    ):
        api.get(path, token=w.mst, salon=s.id, expect=403)
    api.get("/services", token=w.mst, salon=s.id)
    api.post("/services", token=w.mst, salon=s.id, expect=403, json={"name": "X", "price": 1})
    api.post(
        "/clients", token=w.mst, salon=s.id, expect=403, json={"firstName": "X", "phone": "123456"}
    )


def test_duplicate_staff_email(w: World) -> None:
    w.s.api.post(
        "/staff",
        token=w.s.su,
        salon=w.s.id,
        expect=409,
        json={
            "firstName": "Дубль",
            "phone": "1",
            "email": w.admin["email"],
            "password": "password1",
        },
    )


# --- Контракт записи ------------------------------------------------------------


def test_multi_service_record(w: World) -> None:
    rec = w.record(
        masterId=w.master["id"], serviceIds=[w.cut["id"], w.styling["id"]], startAt=w.at(10)
    )
    assert float(rec["price"]) == 800
    assert [x["name"] for x in rec["services"]] == ["Стрижка", "Укладка"]
    start, end = datetime.fromisoformat(rec["startAt"]), datetime.fromisoformat(rec["endAt"])
    assert end - start == timedelta(minutes=75)
    assert start.astimezone(TZ).hour == 10
    assert "service" not in rec


def test_record_without_master(w: World) -> None:
    api, s = w.s.api, w.s
    queue = w.record(startAt=w.at(16))
    assert queue["master"] is None
    listed = api.get("/records?withoutMaster=true", token=w.adm, salon=s.id)
    assert queue["id"] in [r["id"] for r in listed] and all(r["master"] is None for r in listed)
    api.post(f"/records/{queue['id']}/complete", token=w.adm, salon=s.id, expect=409, json={})
    assigned = api.patch(
        f"/records/{queue['id']}", token=w.adm, salon=s.id, json={"masterId": w.master2["id"]}
    )
    assert assigned["master"]["id"] == w.master2["id"]
    back = api.patch(f"/records/{queue['id']}", token=w.adm, salon=s.id, json={"masterId": None})
    assert back["master"] is None
    assert api.get("/records?withoutMaster=true", token=w.mst, salon=s.id) == []


def test_master_sees_and_changes_only_own(w: World) -> None:
    api, s = w.s.api, w.s
    own = w.record(masterId=w.master["id"], startAt=w.at(11, days=1))
    other = w.record(masterId=w.master2["id"], startAt=w.at(11, days=1))
    mine = {r["id"] for r in api.get("/records", token=w.mst, salon=s.id)}
    assert own["id"] in mine and other["id"] not in mine
    api.get(f"/records/{other['id']}", token=w.mst, salon=s.id, expect=404)
    api.post(
        "/records",
        token=w.mst,
        salon=s.id,
        expect=403,
        json={
            "clientId": own["client"]["id"],
            "masterId": w.master2["id"],
            "serviceIds": [w.cut["id"]],
            "startAt": w.at(12),
        },
    )
    self_rec = w.record(token=w.mst, startAt=w.at(12, days=1))
    assert self_rec["master"]["id"] == w.master["id"]
    api.patch(
        f"/records/{own['id']}",
        token=w.mst,
        salon=s.id,
        expect=403,
        json={"masterId": w.master2["id"]},
    )
    moved = api.patch(
        f"/records/{own['id']}", token=w.mst, salon=s.id, json={"startAt": w.at(11, 30, days=1)}
    )
    assert datetime.fromisoformat(moved["startAt"]).astimezone(TZ).minute == 30
    changed = api.patch(
        f"/records/{own['id']}", token=w.mst, salon=s.id, json={"serviceIds": [w.styling["id"]]}
    )
    assert float(changed["totalAmount"]) == 500 and len(changed["services"]) == 1
    cancelled = api.post(
        f"/records/{self_rec['id']}/status", token=w.mst, salon=s.id, json={"status": "cancelled"}
    )
    assert cancelled["status"] == "cancelled"


def test_master_clients_are_own_only(w: World) -> None:
    api, s = w.s.api, w.s
    own = w.record(masterId=w.master["id"], startAt=w.at(9, days=2))
    other = w.record(masterId=w.master2["id"], startAt=w.at(9, days=2))
    ids = {c["id"] for c in api.get("/clients?perPage=200", token=w.mst, salon=s.id)}
    assert own["client"]["id"] in ids and other["client"]["id"] not in ids
    api.get(f"/clients/{other['client']['id']}", token=w.mst, salon=s.id, expect=404)
    visits = api.get(f"/clients/{own['client']['id']}/visits", token=w.mst, salon=s.id)
    assert visits[0]["services"][0]["name"] == "Стрижка" and "serviceId" not in visits[0]
    api.patch(
        f"/clients/{own['client']['id']}", token=w.mst, salon=s.id, expect=403, json={"notes": "x"}
    )


def test_slots(w: World) -> None:
    api, s = w.s.api, w.s
    day = w.day + timedelta(days=5)
    w.record(
        masterId=w.master["id"], startAt=datetime(day.year, day.month, day.day, 10).isoformat()
    )
    slots = api.get(
        f"/masters/{w.master['id']}/slots?date={day}&serviceIds={w.cut['id']}&serviceIds={w.styling['id']}",
        token=w.adm,
        salon=s.id,
    )
    labels = [x["label"] for x in slots]
    assert "09:00" not in labels  # 09:00–10:15 пересекается с записью 10:00–10:30
    assert "10:15" not in labels and "10:30" in labels
    assert "11:45" in labels and "12:00" not in labels  # 75 минут до перерыва в 13:00
    api.get(
        f"/masters/{w.master2['id']}/slots?date={day}&serviceIds={w.cut['id']}",
        token=w.mst,
        salon=s.id,
        expect=403,
    )


def test_service_category_filter(w: World) -> None:
    api, s = w.s.api, w.s
    rec = w.record(
        masterId=w.master["id"], serviceIds=[w.cut["id"], w.styling["id"]], startAt=w.at(17, days=6)
    )
    styled = api.get("/records?serviceCategory=styling&perPage=500", token=w.adm, salon=s.id)
    assert rec["id"] in [r["id"] for r in styled]
    assert all(any(x["category"] == "styling" for x in r["services"]) for r in styled)
    assert rec["id"] not in [
        r["id"] for r in api.get("/records?serviceCategory=nails", token=w.adm, salon=s.id)
    ]


# --- Завершение и оплата --------------------------------------------------------


def test_complete_and_pay(w: World) -> None:
    api, s = w.s.api, w.s
    rec = w.record(
        masterId=w.master["id"], serviceIds=[w.cut["id"], w.styling["id"]], startAt=w.at(9, days=-5)
    )
    done = api.post(
        f"/records/{rec['id']}/complete", token=w.mst, salon=s.id, json={"notes": "Все добре"}
    )
    assert done["status"] == "completed" and done["paymentStatus"] == "unpaid"
    api.post(
        f"/records/{rec['id']}/payment",
        token=w.mst,
        salon=s.id,
        expect=403,
        json={"payments": [{"paymentMethodId": w.pm["id"], "amount": 800}]},
    )
    api.post(
        f"/records/{rec['id']}/payment",
        token=w.adm,
        salon=s.id,
        expect=409,
        json={"payments": [{"paymentMethodId": w.pm["id"], "amount": 100}]},
    )
    paid = api.post(
        f"/records/{rec['id']}/payment",
        token=w.adm,
        salon=s.id,
        json={
            "payments": [
                {"paymentMethodId": w.pm["id"], "amount": 300},
                {"paymentMethodId": w.pm["id"], "amount": 500},
            ]
        },
    )
    assert paid["record"]["paymentStatus"] == "paid" and float(paid["receipt"]["amount"]) == 800
    api.post(
        f"/records/{rec['id']}/payment",
        token=w.adm,
        salon=s.id,
        expect=409,
        json={"payments": [{"paymentMethodId": w.pm["id"], "amount": 800}]},
    )

    api.post(f"/finances/receipts/{paid['receipt']['id']}/cancel", token=s.su, salon=s.id)
    assert api.get(f"/records/{rec['id']}", token=w.adm, salon=s.id)["paymentStatus"] == "unpaid"
    receipt = api.post(
        "/finances/receipts",
        token=s.su,
        salon=s.id,
        expect=201,
        json={"recordId": rec["id"], "payments": [{"paymentMethodId": w.pm["id"], "amount": 800}]},
    )
    assert receipt["recordId"] == rec["id"] and receipt["client"]["name"] == "Клієнт"
    history = api.get(f"/records/{rec['id']}", token=w.adm, salon=s.id)["history"]
    assert len(history) >= 4


# --- Сотрудники, увольнение, refresh --------------------------------------------


def test_schedule_exceptions(w: World) -> None:
    api, s = w.s.api, w.s
    base = f"/staff/{w.master2['id']}/schedule/exceptions"
    exc = api.post(
        base,
        token=w.adm,
        salon=s.id,
        expect=201,
        json={"dateFrom": "2030-01-01", "dateTo": "2030-01-05", "type": "vacation"},
    )
    patched = api.patch(
        f"{base}/{exc['id']}",
        token=w.adm,
        salon=s.id,
        json={"dateTo": "2030-01-10", "comment": "Відпустка"},
    )
    assert patched["dateTo"] == "2030-01-10"
    api.patch(
        f"{base}/{exc['id']}", token=w.adm, salon=s.id, expect=422, json={"dateTo": "2029-01-01"}
    )
    api.delete(f"{base}/{exc['id']}", token=w.adm, salon=s.id, expect=204)
    api.delete(f"{base}/{exc['id']}", token=w.adm, salon=s.id, expect=404)


def test_fire_and_rehire_admin(w: World) -> None:
    api, s = w.s.api, w.s
    admin, token = s.create_staff("administrator", firstName="Тимчасовий")
    refresh = api.post("/auth/login", json={"email": admin["email"], "password": "password1"})[
        "refreshToken"
    ]
    api.delete(f"/staff/{admin['id']}", token=w.adm, salon=s.id, expect=403)
    me = api.get("/auth/me", token=s.su)
    api.delete(f"/staff/{me['id']}", token=s.su, salon=s.id, expect=409)
    assert api.delete(f"/staff/{admin['id']}", token=s.su, salon=s.id)["status"] == "fired"

    login = api.post("/auth/login", json={"email": admin["email"], "password": "password1"})
    assert s.id not in login["user"]["salonIds"]
    fresh = api.post("/auth/refresh", json={"refreshToken": refresh})["accessToken"]
    api.get("/clients", token=fresh, salon=s.id, expect=403)
    fired = [
        x for x in api.get("/staff?status=fired", token=s.su, salon=s.id) if x["id"] == admin["id"]
    ]
    assert len(fired) == 1

    api.patch(
        f"/staff/{admin['id']}",
        token=s.su,
        salon=s.id,
        json={"status": "active", "isSuperuser": True},
    )
    user = api.post("/auth/login", json={"email": admin["email"], "password": "password1"})["user"]
    assert s.id in user["salonIds"] and user["isSuperuser"]
    api.patch(f"/staff/{me['id']}", token=s.su, salon=s.id, expect=409, json={"isSuperuser": False})
    api.get("/clients", token=token, salon=s.id)  # старый access-токен ещё жив до истечения


def test_profile(w: World) -> None:
    api, s = w.s.api, w.s
    me = api.patch(
        "/auth/me",
        token=w.mst,
        salon=s.id,
        json={"address": "Київ, вул. Хрещатик 1", "emergencyContactName": "Мама"},
    )
    assert me["address"].startswith("Київ") and me["profile"]["salary"] is not None
    api.patch("/auth/me", token=w.mst, json={"firstName": "Хакер"})
    assert api.get("/auth/me", token=w.mst)["firstName"] == "Марія"
    api.post("/auth/forgot-password", json={"email": w.master["email"]}, expect=204)


def test_errors_are_ukrainian(w: World) -> None:
    raw = w.s.api.client.get(
        "/api/admin/v1/records/00000000-0000-0000-0000-000000000000",
        headers={"Authorization": f"Bearer {w.adm}", "X-Salon-Id": w.s.id},
    )
    assert raw.json()["message"] == "Запис не знайдено"
