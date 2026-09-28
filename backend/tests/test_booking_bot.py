"""Публичная запись (Booking API) и Bot API."""

from dataclasses import dataclass
from datetime import date, datetime, timedelta
from typing import Any
from zoneinfo import ZoneInfo

import pytest

from tests.conftest import BOT_KEY, WEEK_9_TO_18, Salon, phone

TZ = ZoneInfo("Europe/Kyiv")
BOT = {"prefix": "/api/bot", "headers": {"X-API-Key": BOT_KEY}}


@dataclass
class World:
    s: Salon
    adm: str
    m1: dict[str, Any]
    m2: dict[str, Any]
    cut: dict[str, Any]
    color: dict[str, Any]

    @property
    def booking(self) -> dict[str, str]:
        return {"prefix": f"/api/booking/{self.s.slug}"}


@pytest.fixture(scope="module")
def w(new_salon: Salon) -> World:
    s = new_salon
    _, adm = s.create_staff("administrator")
    m1, _ = s.create_staff(firstName="Анна", phone="+380 (67) 555-12-34")
    m2, _ = s.create_staff(firstName="Богдана")
    for m in (m1, m2):
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
            "masterIds": [m1["id"], m2["id"]],
        },
    )
    color = s.api.post(
        "/services",
        token=adm,
        salon=s.id,
        expect=201,
        json={"name": "Фарбування", "price": 900, "durationMinutes": 90, "masterIds": [m1["id"]]},
    )
    s.api.post(
        "/services",
        token=adm,
        salon=s.id,
        expect=201,
        json={"name": "Без майстрів", "price": 1, "durationMinutes": 30},
    )
    return World(s, adm, m1, m2, cut, color)


def _day() -> date:
    return date.today() + timedelta(days=2)


def test_catalog(w: World) -> None:
    api = w.s.api
    assert api.get("/salon", **w.booking)["timezone"] == "Europe/Kyiv"
    names = {x["name"] for x in api.get("/services", **w.booking)}
    assert names == {"Стрижка", "Фарбування"}  # услуга без мастеров не показывается
    masters = api.get(f"/masters?service_id={w.cut['id']}", **w.booking)
    assert {m["id"] for m in masters} == {w.m1["id"], w.m2["id"]}
    day = _day()
    dates = api.get(f"/availability?service_id={w.cut['id']}&month={day:%Y-%m}", **w.booking)
    assert str(day) in dates["dates"]


def test_any_master_booking(w: World) -> None:
    api = w.s.api
    day = _day()
    slots = api.get(f"/slots?service_id={w.cut['id']}&date={day}", **w.booking)
    first = slots[0]
    assert len(first["master_ids"]) == 2
    body = {"service_id": w.cut["id"], "start_at": first["start_at"], "client_name": "Сайт"}
    a = api.post("/records", **w.booking, expect=201, json={**body, "client_phone": phone()})
    b = api.post("/records", **w.booking, expect=201, json={**body, "client_phone": phone()})
    assert a["master_id"] != b["master_id"]
    api.post("/records", **w.booking, expect=409, json={**body, "client_phone": phone()})
    after = api.get(f"/slots?service_id={w.cut['id']}&date={day}", **w.booking)
    assert not after or after[0]["start_at"] != first["start_at"]


def test_booking_validation(w: World) -> None:
    api = w.s.api
    day = _day()
    night = datetime(day.year, day.month, day.day, 23, 0, tzinfo=TZ).isoformat()
    api.post(
        "/records",
        **w.booking,
        expect=409,
        json={
            "service_id": w.cut["id"],
            "start_at": night,
            "client_name": "Н",
            "client_phone": phone(),
        },
    )
    noon = datetime(day.year, day.month, day.day, 12, 0, tzinfo=TZ).isoformat()
    api.post(
        "/records",
        **w.booking,
        expect=422,
        json={
            "service_id": w.color["id"],
            "master_id": w.m2["id"],
            "start_at": noon,
            "client_name": "Н",
            "client_phone": phone(),
        },
    )
    past = (datetime.now(TZ) - timedelta(hours=1)).isoformat()
    api.post(
        "/records",
        **w.booking,
        expect=422,
        json={
            "service_id": w.cut["id"],
            "start_at": past,
            "client_name": "П",
            "client_phone": phone(),
        },
    )


def test_idempotency(w: World) -> None:
    api = w.s.api
    day = _day() + timedelta(days=1)
    slot = api.get(f"/slots?service_id={w.color['id']}&date={day}", **w.booking)[0]
    body = {
        "service_id": w.color["id"],
        "start_at": slot["start_at"],
        "client_name": "І",
        "client_phone": phone(),
    }
    headers = {"Idempotency-Key": "k-" + phone()}
    first = api.post("/records", **w.booking, expect=201, json=body, headers=headers)
    again = api.post("/records", **w.booking, expect=201, json=body, headers=headers)
    assert first["record_id"] == again["record_id"]


def test_bot_link_and_master_day(w: World) -> None:
    api = w.s.api
    tg = 700_000_000 + int(phone()[-6:])
    who = api.post("/link-telegram", **BOT, json={"phone": "380675551234", "telegram_user_id": tg})
    assert who["role"] == "master" and w.s.id in who["salon_ids"]

    day = _day() + timedelta(days=3)
    api.post(
        "/records",
        token=w.adm,
        salon=w.s.id,
        expect=201,
        json={
            "newClient": {"name": "Олена", "phone": phone()},
            "masterId": w.m1["id"],
            "serviceIds": [w.cut["id"], w.color["id"]],
            "startAt": datetime(day.year, day.month, day.day, 10).isoformat(),
        },
    )
    data = api.get(f"/masters/records?telegram_user_id={tg}&day={day}", **BOT)
    records = next(x for x in data["salons"] if x["salon_id"] == w.s.id)["records"]
    assert [r["services"] for r in records] == [["Стрижка", "Фарбування"]]
    api.get(f"/masters/records?telegram_user_id=1&day={day}", **BOT, expect=404)
    assert any(x["booking_url"].endswith("/" + w.s.slug) for x in api.get("/salons", **BOT))
    api.get("/salons", prefix="/api/bot", expect=401)


def test_bot_links_client_by_local_phone(w: World) -> None:
    api = w.s.api
    number = phone()  # +38050XXXXXXX
    api.post(
        "/records",
        token=w.adm,
        salon=w.s.id,
        expect=201,
        json={
            "newClient": {"name": "Клієнтка", "phone": number},
            "masterId": w.m1["id"],
            "serviceIds": [w.cut["id"]],
            "startAt": datetime(2030, 1, 1, 10).isoformat(),
        },
    )
    who = api.post(
        "/link-telegram",
        **BOT,
        json={"phone": "0" + number[4:], "telegram_user_id": 800_000_000 + int(number[-6:])},
    )
    assert who["role"] == "client"
