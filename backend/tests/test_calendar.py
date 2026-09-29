"""Данные для Розкладу: способы оплаты, графики, сводка по дням, напоминания, отмена списания."""

from dataclasses import dataclass
from datetime import UTC, date, datetime, timedelta
from typing import Any

import pytest

from tests.conftest import BOT_KEY, Salon, phone, setup_shifts

BOT = {"prefix": "/api/bot", "headers": {"X-API-Key": BOT_KEY}}
MONDAY = date(2030, 1, 7)  # понедельник в будущем — стабильные дни недели


@dataclass
class World:
    s: Salon
    adm: str
    m1: dict[str, Any]
    mst1: str
    m2: dict[str, Any]
    mst2: str
    fired: dict[str, Any]
    svc: dict[str, Any]

    def record(self, token: str | None = None, **body: Any) -> dict[str, Any]:
        payload = {
            "newClient": {"name": "Клієнт", "phone": phone()},
            "serviceIds": [self.svc["id"]],
            **body,
        }
        return self.s.api.post(
            "/records", token=token or self.adm, salon=self.s.id, json=payload, expect=201
        )


def _at(day: date, hour: int, minute: int = 0) -> str:
    return datetime(day.year, day.month, day.day, hour, minute).isoformat()


@pytest.fixture(scope="module")
def w(new_salon: Salon) -> World:
    s = new_salon
    _, adm = s.create_staff("administrator")
    m1, mst1 = s.create_staff(firstName="Анна", color="#ff0000")
    m2, mst2 = s.create_staff(firstName="Богдана")
    fired, _ = s.create_staff(firstName="Звільнена")
    setup_shifts(s, [m1["id"], m2["id"], fired["id"]], MONDAY, MONDAY + timedelta(days=20))
    s.api.delete(f"/staff/{fired['id']}", token=adm, salon=s.id)
    svc = s.api.post(
        "/services",
        token=adm,
        salon=s.id,
        expect=201,
        json={"name": "Стрижка", "price": 300, "durationMinutes": 60},
    )
    return World(s, adm, m1, mst1, m2, mst2, fired, svc)


# --- 1. Способы оплаты ----------------------------------------------------------------


def test_payment_methods_for_admin(w: World) -> None:
    api, s = w.s.api, w.s
    active = api.post(
        "/finances/cash-registers", token=s.su, salon=s.id, expect=201, json={"name": "Каса"}
    )
    off = api.post(
        "/finances/cash-registers", token=s.su, salon=s.id, expect=201, json={"name": "Стара каса"}
    )

    def method(name: str, register: str | None, **extra: Any) -> dict[str, Any]:
        return api.post(
            "/finances/payment-methods",
            token=s.su,
            salon=s.id,
            expect=201,
            json={"name": name, "type": "card", "cashRegisterId": register, **extra},
        )

    card = method("Картка", active["id"], sortOrder=2)
    cash = method("Готівка", active["id"], sortOrder=1)
    method("Без каси", None)
    method("Вимкнений", active["id"], isActive=False)
    method("На старій касі", off["id"])
    api.patch(
        f"/finances/cash-registers/{off['id']}", token=s.su, salon=s.id, json={"isActive": False}
    )

    listed = api.get("/payment-methods", token=w.adm, salon=s.id)
    assert [m["id"] for m in listed] == [cash["id"], card["id"]]
    assert set(listed[0]) == {"id", "name", "type"}
    api.get("/payment-methods", token=w.mst1, salon=s.id, expect=403)


# --- 2. Графики -----------------------------------------------------------------------


def test_schedule_for_period(w: World) -> None:
    api, s = w.s.api, w.s
    api.call(
        "PUT",
        f"/shifts/{w.m1['id']}/{MONDAY + timedelta(days=1)}",
        token=w.adm,
        salon=s.id,
        json={"kind": "vacation", "comment": "Відпустка"},
    )
    api.call(
        "PUT",
        f"/shifts/{w.m1['id']}/{MONDAY + timedelta(days=2)}",
        token=w.adm,
        salon=s.id,
        json={"kind": "vacation", "comment": "Відпустка"},
    )
    api.call(
        "PUT",
        f"/shifts/{w.m1['id']}/{MONDAY + timedelta(days=3)}",
        token=w.adm,
        salon=s.id,
        json={"kind": "shift", "start": "18:00", "end": "21:00"},
    )

    data = api.get(
        f"/schedule?dateFrom={MONDAY}&dateTo={MONDAY + timedelta(days=6)}", token=w.adm, salon=s.id
    )
    by_id = {x["masterId"]: x for x in data}
    assert set(by_id) == {w.m1["id"], w.m2["id"]}  # уволенной нет
    anna = by_id[w.m1["id"]]
    assert anna["name"] == "Анна" and anna["color"] == "#ff0000" and len(anna["days"]) == 7
    monday, tuesday, _, thursday = anna["days"][:4]
    assert monday["isWorkDay"] and monday["exception"] is None
    assert [(x["start"], x["end"]) for x in monday["windows"]] == [
        ("09:00:00", "13:00:00"),
        ("14:00:00", "18:00:00"),
    ]
    assert not tuesday["isWorkDay"] and tuesday["windows"] == []
    assert tuesday["exception"] == {"type": "vacation", "comment": "Відпустка"}
    assert [(x["start"], x["end"]) for x in thursday["windows"]] == [("18:00:00", "21:00:00")]


def test_schedule_access_and_limits(w: World) -> None:
    api, s = w.s.api, w.s
    own = api.get(f"/schedule?dateFrom={MONDAY}&dateTo={MONDAY}", token=w.mst2, salon=s.id)
    assert [x["masterId"] for x in own] == [w.m2["id"]]
    api.get(
        f"/schedule?dateFrom={MONDAY}&dateTo={MONDAY}&masterId={w.m1['id']}",
        token=w.mst2,
        salon=s.id,
        expect=403,
    )
    one = api.get(
        f"/schedule?dateFrom={MONDAY}&dateTo={MONDAY}&masterId={w.m1['id']}",
        token=w.adm,
        salon=s.id,
    )
    assert [x["masterId"] for x in one] == [w.m1["id"]]
    api.get(
        f"/schedule?dateFrom={MONDAY}&dateTo={MONDAY + timedelta(days=62)}",
        token=w.adm,
        salon=s.id,
        expect=422,
    )
    api.get(
        f"/schedule?dateFrom={MONDAY}&dateTo={MONDAY - timedelta(days=1)}",
        token=w.adm,
        salon=s.id,
        expect=422,
    )


# --- 3. Сводка по дням --------------------------------------------------------------------


def test_daily_summary(w: World) -> None:
    api, s = w.s.api, w.s
    day = MONDAY + timedelta(days=14)  # без исключений
    w.record(masterId=w.m1["id"], startAt=_at(day, 10))
    w.record(masterId=w.m1["id"], startAt=_at(day, 11))
    w.record(masterId=w.m2["id"], startAt=_at(day, 10))
    no_show = w.record(masterId=w.m2["id"], startAt=_at(day, 12))
    api.post(
        f"/records/{no_show['id']}/status", token=w.adm, salon=s.id, json={"status": "no_show"}
    )
    cancelled = w.record(masterId=w.m2["id"], startAt=_at(day, 15))
    api.post(
        f"/records/{cancelled['id']}/status", token=w.adm, salon=s.id, json={"status": "cancelled"}
    )
    w.record(startAt=_at(day, 16))  # без мастера
    w.record(masterId=w.m1["id"], startAt=_at(day + timedelta(days=1), 10))

    data = api.get(
        f"/records/daily-summary?dateFrom={day}&dateTo={day + timedelta(days=2)}",
        token=w.adm,
        salon=s.id,
    )
    assert [d["date"] for d in data] == [str(day + timedelta(days=i)) for i in range(3)]
    first = data[0]
    assert first["total"] == 5 and first["bookedMinutes"] == 300
    assert first["workMinutes"] == 2 * 8 * 60  # два работающих мастера по 8 часов
    rows = {r["masterId"]: r for r in first["byMaster"]}
    assert rows[w.m1["id"]] == {
        "masterId": w.m1["id"],
        "count": 2,
        "bookedMinutes": 120,
        "workMinutes": 480,
    }
    assert rows[w.m2["id"]]["count"] == 2  # no_show считается, отменённая — нет
    assert rows[None] == {"masterId": None, "count": 1, "bookedMinutes": 60, "workMinutes": None}
    assert first["byMaster"][-1]["masterId"] is None  # очередь — последней
    assert data[2]["total"] == 0 and data[2]["byMaster"] == []

    mine = api.get(f"/records/daily-summary?dateFrom={day}&dateTo={day}", token=w.mst1, salon=s.id)[
        0
    ]
    assert mine["total"] == 2 and mine["workMinutes"] == 480
    assert [r["masterId"] for r in mine["byMaster"]] == [w.m1["id"]]
    api.get(
        f"/records/daily-summary?dateFrom={day}&dateTo={day}&masterId={w.m2['id']}",
        token=w.mst1,
        salon=s.id,
        expect=403,
    )
    api.get(
        f"/records/daily-summary?dateFrom={day}&dateTo={day + timedelta(days=62)}",
        token=w.adm,
        salon=s.id,
        expect=422,
    )


# --- 4. Напоминание ---------------------------------------------------------------------------


def test_reminder_flag_and_status(w: World, monkeypatch: pytest.MonkeyPatch) -> None:
    from workers import telegram
    from workers.celery_app import celery
    from workers.tasks import reminders

    api, s = w.s.api, w.s
    sent: list[tuple[int, str]] = []
    monkeypatch.setattr(celery.conf, "task_always_eager", True)
    monkeypatch.setattr(telegram, "send_message", lambda chat, text: sent.append((chat, text)))

    client_phone = phone()
    soon = datetime.now(UTC) + timedelta(minutes=30, seconds=30)
    rec = w.record(
        masterId=w.m1["id"],
        startAt=soon.isoformat(),
        newClient={"name": "Олена", "phone": client_phone},
    )
    assert rec["reminderEnabled"] is True and rec["reminderSentAt"] is None
    assert rec["clientTelegramLinked"] is False
    tg = 950_000_000 + int(client_phone[-5:])
    api.post("/link-telegram", **BOT, json={"phone": client_phone, "telegram_user_id": tg})
    assert api.get(f"/records/{rec['id']}", token=w.adm, salon=s.id)["clientTelegramLinked"]
    assert api.get(f"/clients/{rec['client']['id']}", token=w.adm, salon=s.id)["telegramLinked"]

    reminders.scan_shard(s.id)
    after = api.get(f"/records/{rec['id']}", token=w.adm, salon=s.id)
    assert after["reminderSentAt"] is not None and [c for c, _ in sent] == [tg]

    # Перенос на будущее — напоминание уйдёт снова к новому времени
    moved = api.patch(
        f"/records/{rec['id']}",
        token=w.mst1,
        salon=s.id,
        json={"startAt": (soon + timedelta(days=1)).isoformat()},
    )
    assert moved["reminderSentAt"] is None

    # Выключенное напоминание не отправляется; изменение — в журнале
    quiet = w.record(
        masterId=w.m1["id"],
        startAt=soon.isoformat(),
        reminderEnabled=False,
        clientId=rec["client"]["id"],
    )
    assert quiet["reminderEnabled"] is False
    other = w.record(
        masterId=w.m1["id"],
        startAt=(soon + timedelta(minutes=1)).isoformat(),
        clientId=rec["client"]["id"],
    )
    off = api.patch(
        f"/records/{other['id']}", token=w.mst1, salon=s.id, json={"reminderEnabled": False}
    )
    assert off["reminderEnabled"] is False
    history = api.get(f"/records/{other['id']}", token=w.adm, salon=s.id)["history"]
    assert any(h["details"] == {"reminder_enabled": [True, False]} for h in history)
    api.patch(
        f"/records/{other['id']}",
        token=w.mst1,
        salon=s.id,
        expect=422,
        json={"reminderEnabled": None},
    )
    sent.clear()
    reminders.scan_shard(s.id)
    assert sent == []


# --- 5. Отмена списания ------------------------------------------------------------------------


def test_cancel_consumable(w: World) -> None:
    api, s = w.s.api, w.s
    product = api.post(
        "/inventory/products",
        token=w.adm,
        salon=s.id,
        expect=201,
        json={"name": "Шампунь", "sku": "SH-" + phone()[-6:], "unit": "ml", "quantity": 1000},
    )
    reg = api.post(
        "/finances/cash-registers", token=s.su, salon=s.id, expect=201, json={"name": "Каса 2"}
    )
    pm = api.post(
        "/finances/payment-methods",
        token=s.su,
        salon=s.id,
        expect=201,
        json={"name": "Готівка 2", "type": "cash", "cashRegisterId": reg["id"]},
    )
    rec = w.record(masterId=w.m1["id"], startAt=_at(MONDAY - timedelta(days=3000), 10))
    items = api.post(
        f"/records/{rec['id']}/consumables",
        token=w.mst1,
        salon=s.id,
        expect=201,
        json={"items": [{"productId": product["id"], "quantity": 150}]},
    )
    movement = items[0]["movementId"]
    api.post(f"/records/{rec['id']}/complete", token=w.mst1, salon=s.id, json={})
    api.post(
        f"/records/{rec['id']}/payment",
        token=w.adm,
        salon=s.id,
        json={"payments": [{"paymentMethodId": pm["id"], "amount": 300}]},
    )
    api.delete(f"/inventory/products/{product['id']}", token=w.adm, salon=s.id, expect=204)

    other = w.record(masterId=w.m2["id"], startAt=_at(MONDAY, 10))
    api.delete(
        f"/records/{other['id']}/consumables/{movement}", token=w.adm, salon=s.id, expect=404
    )
    api.delete(f"/records/{rec['id']}/consumables/{movement}", token=w.mst2, salon=s.id, expect=404)

    after = api.delete(f"/records/{rec['id']}/consumables/{movement}", token=w.mst1, salon=s.id)
    assert len(after) == 1 and after[0]["cancelled"] is True
    assert after[0]["cancelledAt"] and after[0]["cancelledBy"]["name"]
    stock = api.get(f"/inventory/products/{product['id']}", token=w.adm, salon=s.id)
    assert float(stock["quantity"]) == 1000
    history = api.get(f"/inventory/products/{product['id']}/movements", token=w.adm, salon=s.id)
    assert history[0]["type"] == "receipt" and history[0]["recordId"] == rec["id"]
    assert history[0]["reason"].startswith("Скасування списання")
    api.delete(f"/records/{rec['id']}/consumables/{movement}", token=w.adm, salon=s.id, expect=409)
