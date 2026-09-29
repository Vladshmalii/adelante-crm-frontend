"""Смены по дням (backend/docs/shifts.md): сетка, права, границы, конфликты, заполнение."""

from dataclasses import dataclass
from datetime import date, datetime, timedelta
from typing import Any
from zoneinfo import ZoneInfo

import pytest

from tests.conftest import BOT_KEY, Salon, phone, salon_week, shift_week

TZ = ZoneInfo("Europe/Kyiv")
BOT = {"prefix": "/api/bot", "headers": {"X-API-Key": BOT_KEY}}
TODAY = datetime.now(TZ).date()
# Понедельник через ~2 недели — стабильные дни недели, в пределах 62 дней
MONDAY = TODAY + timedelta(days=14 - TODAY.weekday())


@dataclass
class World:
    s: Salon
    admin: dict[str, Any]
    adm: str
    admin2: dict[str, Any]
    adm2: str
    m1: dict[str, Any]
    mst1: str
    m2: dict[str, Any]
    mst2: str
    svc: dict[str, Any]

    def put(
        self, token: str, staff: dict[str, Any], day: date, expect: int = 200, **body: Any
    ) -> Any:
        return self.s.api.call(
            "PUT",
            f"/shifts/{staff['id']}/{day}",
            token=token,
            salon=self.s.id,
            expect=expect,
            json=body,
        )

    def record(self, master: dict[str, Any], day: date, hour: int, minute: int = 0) -> Any:
        return self.s.api.post(
            "/records",
            token=self.s.su,
            salon=self.s.id,
            expect=201,
            json={
                "newClient": {"name": "Клієнт", "phone": phone()},
                "masterId": master["id"],
                "serviceIds": [self.svc["id"]],
                "startAt": datetime(day.year, day.month, day.day, hour, minute).isoformat(),
            },
        )

    def error(self, method: str, path: str, token: str, **kw: Any) -> Any:
        return self.s.api.client.request(
            method,
            "/api/admin/v1" + path,
            headers={"Authorization": f"Bearer {token}", "X-Salon-Id": self.s.id},
            **kw,
        )


@pytest.fixture(scope="module")
def w(new_salon: Salon) -> World:
    s = new_salon
    admin, adm = s.create_staff("administrator", firstName="Олег")
    admin2, adm2 = s.create_staff("administrator", firstName="Петро")
    m1, mst1 = s.create_staff(firstName="Анна", color="#ff0000")
    m2, mst2 = s.create_staff(firstName="Богдана")
    svc = s.api.post(
        "/services",
        token=s.su,
        salon=s.id,
        expect=201,
        json={"name": "Стрижка", "price": 300, "durationMinutes": 60},
    )
    return World(s, admin, adm, admin2, adm2, m1, mst1, m2, mst2, svc)


def test_salon_schedule_required(w: World) -> None:
    response = w.error(
        "PUT",
        f"/shifts/{w.m1['id']}/{MONDAY}",
        w.s.su,
        json={"kind": "shift", "start": "09:00", "end": "18:00"},
    )
    assert response.status_code == 422 and response.json()["code"] == "salon_not_configured"
    # Отметку можно и без графика салона
    w.put(w.s.su, w.m1, MONDAY + timedelta(days=40), kind="sick")
    w.s.api.delete(
        f"/shifts/{w.m1['id']}/{MONDAY + timedelta(days=40)}",
        token=w.s.su,
        salon=w.s.id,
        expect=204,
    )
    week = salon_week("08:00", "20:00")
    week["sunday"] = {"isWorkDay": False}
    w.s.api.call("PUT", "/settings/schedule", token=w.s.su, salon=w.s.id, json={"week": week})


def test_cell_validation_and_bounds(w: World) -> None:
    cell = w.put(
        w.adm,
        w.m1,
        MONDAY,
        kind="shift",
        start="09:00",
        end="18:00",
        breakStart="13:00",
        breakEnd="14:00",
        comment="Ранок",
    )
    assert cell == {
        "date": str(MONDAY),
        "kind": "shift",
        "start": "09:00:00",
        "end": "18:00:00",
        "breakStart": "13:00:00",
        "breakEnd": "14:00:00",
        "comment": "Ранок",
        "recordsCount": 0,
    }
    for body, code in (
        ({"start": "07:00", "end": "12:00"}, "outside_salon_hours"),
        ({"start": "10:00", "end": "21:00"}, "outside_salon_hours"),
    ):
        response = w.error(
            "PUT", f"/shifts/{w.m1['id']}/{MONDAY}", w.adm, json={"kind": "shift", **body}
        )
        assert response.status_code == 422 and response.json()["code"] == code
    sunday = MONDAY + timedelta(days=6)
    response = w.error(
        "PUT",
        f"/shifts/{w.m1['id']}/{sunday}",
        w.adm,
        json={"kind": "shift", "start": "10:00", "end": "12:00"},
    )
    assert response.json()["code"] == "salon_closed"
    w.put(w.adm, w.m1, MONDAY, expect=422, kind="shift", start="12:00", end="10:00")
    w.put(
        w.adm,
        w.m1,
        MONDAY,
        expect=422,
        kind="shift",
        start="10:00",
        end="12:00",
        breakStart="09:00",
        breakEnd="10:30",
    )
    past = TODAY - timedelta(days=1)
    response = w.error("PUT", f"/shifts/{w.m1['id']}/{past}", w.s.su, json={"kind": "vacation"})
    assert response.status_code == 422 and response.json()["code"] == "past"
    w.put(w.adm, w.m1, TODAY, kind="sick")  # сегодня — можно
    w.s.api.delete(f"/shifts/{w.m1['id']}/{TODAY}", token=w.adm, salon=w.s.id, expect=204)


def test_rights(w: World) -> None:
    day = MONDAY + timedelta(days=1)
    w.put(w.mst1, w.m1, day, kind="shift", start="10:00", end="16:00")  # мастер — свою
    w.put(w.mst1, w.m2, day, expect=403, kind="vacation")  # мастер — чужую нельзя
    w.put(w.adm, w.m2, day, kind="shift", start="10:00", end="16:00")  # админ — мастера
    w.put(w.adm, w.admin, day, kind="shift", start="08:00", end="14:00")  # админ — свою
    w.put(w.adm, w.admin2, day, expect=403, kind="vacation")  # админ — чужую админскую нельзя
    w.put(w.s.su, w.admin2, day, kind="shift", start="14:00", end="20:00")  # суперюзер — всех

    grid = w.s.api.get(
        f"/shifts?dateFrom={MONDAY}&dateTo={MONDAY + timedelta(days=6)}", token=w.adm, salon=w.s.id
    )
    assert [(r["name"], r["role"]) for r in grid["staff"]] == [
        ("Анна", "master"),
        ("Богдана", "master"),
        ("Олег", "administrator"),
        ("Петро", "administrator"),
        ("Супер", "administrator"),
    ]
    assert [r["canEdit"] for r in grid["staff"]] == [True, True, True, False, False]
    assert grid["salonScheduleConfigured"] is True
    assert grid["days"][0] == {"date": str(MONDAY), "open": "08:00:00", "close": "20:00:00"}
    assert grid["days"][6] == {"date": str(MONDAY + timedelta(days=6)), "open": None, "close": None}
    anna = grid["staff"][0]
    assert anna["color"] == "#ff0000" and len(anna["days"]) == 7
    assert anna["days"][2] == {
        "date": str(MONDAY + timedelta(days=2)),
        "kind": None,
        "start": None,
        "end": None,
        "breakStart": None,
        "breakEnd": None,
        "comment": None,
        "recordsCount": 0,
    }
    own = w.s.api.get(f"/shifts?dateFrom={MONDAY}&dateTo={MONDAY}", token=w.mst2, salon=w.s.id)
    assert [r["staffId"] for r in own["staff"]] == [w.m2["id"]]
    w.s.api.get(
        f"/shifts?dateFrom={MONDAY}&dateTo={MONDAY + timedelta(days=62)}",
        token=w.adm,
        salon=w.s.id,
        expect=422,
    )


def test_records_block_shift_changes(w: World) -> None:
    day = MONDAY + timedelta(days=2)
    w.put(w.adm, w.m1, day, kind="shift", start="09:00", end="18:00")
    rec = w.record(w.m1, day, 16)  # 16:00–17:00 внутри смены
    outside = w.record(w.m1, day, 19)  # вне смены — можно
    assert rec["outsideShift"] is False and outside["outsideShift"] is True

    # Сократить так, что запись выпадет, удалить, заменить отметкой — 409 со списком
    response = w.error(
        "PUT",
        f"/shifts/{w.m1['id']}/{day}",
        w.adm,
        json={"kind": "shift", "start": "09:00", "end": "16:00"},
    )
    body = response.json()
    assert response.status_code == 409 and body["code"] == "has_records"
    assert [r["id"] for r in body["details"]["records"]] == [rec["id"]]
    assert w.error("DELETE", f"/shifts/{w.m1['id']}/{day}", w.adm).status_code == 409
    response = w.error("PUT", f"/shifts/{w.m1['id']}/{day}", w.adm, json={"kind": "vacation"})
    assert response.status_code == 409  # отметка на день с записями
    # Сократить утро — запись не задета; запись вне смены изменению не мешает
    cell = w.put(w.adm, w.m1, day, kind="shift", start="12:00", end="18:00")
    assert cell["recordsCount"] == 2
    # Отменённая запись не мешает
    for r in (rec, outside):
        w.s.api.post(
            f"/records/{r['id']}/status", token=w.adm, salon=w.s.id, json={"status": "cancelled"}
        )
    w.s.api.delete(f"/shifts/{w.m1['id']}/{day}", token=w.adm, salon=w.s.id, expect=204)


def _fill(w: World, token: str, expect: int = 200, **body: Any) -> Any:
    return w.s.api.post("/shifts/fill", token=token, salon=w.s.id, expect=expect, json=body)


def _cells(w: World, staff: dict[str, Any], date_from: date, date_to: date) -> list[Any]:
    grid = w.s.api.get(f"/shifts?dateFrom={date_from}&dateTo={date_to}", token=w.s.su, salon=w.s.id)
    row = next(r for r in grid["staff"] if r["staffId"] == staff["id"])
    return [(d["kind"], d["start"]) for d in row["days"]]


def test_fill_weekdays_and_overwrite(w: World) -> None:
    start, end = MONDAY + timedelta(days=7), MONDAY + timedelta(days=13)  # пн–нд
    week = shift_week("10:00", "19:00", None, None)
    week["wednesday"] = None
    report = _fill(
        w,
        w.adm,
        staffIds=[w.m1["id"], w.m2["id"]],
        dateFrom=str(start),
        dateTo=str(end),
        mode="weekdays",
        weekdays=week,
    )
    # 5 рабочих дней × 2 (среда — выходной по шаблону, воскресенье — салон закрыт)
    assert report["created"] == 10 and report["updated"] == 0
    assert {(x["reason"], x["date"]) for x in report["skipped"]} == {("salon_closed", str(end))}
    assert _cells(w, w.m1, start, end)[:3] == [
        ("shift", "10:00:00"),
        ("shift", "10:00:00"),
        (None, None),
    ]

    # Без overwrite существующие не трогаются
    other = shift_week("09:00", "15:00", None, None)
    report = _fill(
        w,
        w.adm,
        staffIds=[w.m1["id"]],
        dateFrom=str(start),
        dateTo=str(start),
        mode="weekdays",
        weekdays=other,
    )
    assert report["created"] == 0 and report["skipped"][0]["reason"] == "exists"
    # С overwrite: выходной шаблона очищает день
    week_off = dict(other)
    week_off["monday"] = None
    report = _fill(
        w,
        w.adm,
        staffIds=[w.m1["id"]],
        dateFrom=str(start),
        dateTo=str(start + timedelta(days=1)),
        mode="weekdays",
        weekdays=week_off,
        overwrite=True,
    )
    assert (report["removed"], report["updated"]) == (1, 1)
    # Права: админ не заполняет другим администраторам
    _fill(
        w,
        w.adm,
        expect=403,
        staffIds=[w.admin2["id"]],
        dateFrom=str(start),
        dateTo=str(end),
        mode="weekdays",
        weekdays=week,
    )
    _fill(
        w,
        w.adm,
        expect=422,
        staffIds=[w.m1["id"]],
        dateFrom=str(TODAY - timedelta(days=1)),
        dateTo=str(TODAY),
        mode="weekdays",
        weekdays=week,
    )
    _fill(
        w,
        w.adm,
        expect=422,
        staffIds=[w.m1["id"]],
        dateFrom=str(start),
        dateTo=str(end),
        mode="cycle",
    )


def test_fill_cycle_copy_and_marks(w: World) -> None:
    start = MONDAY + timedelta(days=21)
    end = start + timedelta(days=5)  # пн–сб
    report = _fill(
        w,
        w.s.su,
        staffIds=[w.admin2["id"]],
        dateFrom=str(start),
        dateTo=str(end),
        mode="cycle",
        cycle={"workDays": 2, "offDays": 2, "shift": {"start": "09:00", "end": "17:00"}},
    )
    assert report["created"] == 4  # 2/2: пн вт — работа, ср чт — выходные, пт сб — работа
    assert [k for k, _ in _cells(w, w.admin2, start, end)] == [
        "shift",
        "shift",
        None,
        None,
        "shift",
        "shift",
    ]
    # Скопировать эту неделю на следующую
    report = _fill(
        w,
        w.s.su,
        staffIds=[w.admin2["id"]],
        dateFrom=str(start + timedelta(days=7)),
        dateTo=str(end + timedelta(days=7)),
        mode="copy",
        copyFrom={"dateFrom": str(start), "dateTo": str(start + timedelta(days=6))},
    )
    assert report["created"] == 4
    # Отметка на период: дни с записями пропускаются
    leave_from = start + timedelta(days=14)
    w.put(w.adm, w.m2, leave_from + timedelta(days=1), kind="shift", start="09:00", end="18:00")
    w.record(w.m2, leave_from + timedelta(days=1), 10)
    report = _fill(
        w,
        w.adm,
        staffIds=[w.m2["id"]],
        dateFrom=str(leave_from),
        dateTo=str(leave_from + timedelta(days=3)),
        mode="mark",
        mark={"kind": "vacation", "comment": "Відпустка"},
        overwrite=True,
    )
    assert report["created"] == 3
    assert [(x["reason"], x["date"]) for x in report["skipped"]] == [
        ("has_records", str(leave_from + timedelta(days=1)))
    ]


def test_salon_hours_trim(w: World) -> None:
    day = MONDAY + timedelta(days=42)  # понедельник
    tuesday, saturday = day + timedelta(days=1), day + timedelta(days=5)
    w.put(
        w.adm,
        w.m1,
        day,
        kind="shift",
        start="09:00",
        end="20:00",
        breakStart="18:30",
        breakEnd="19:30",
    )
    w.put(w.adm, w.m2, day, kind="shift", start="09:00", end="20:00")
    w.put(w.adm, w.m2, tuesday, kind="shift", start="10:00", end="12:00")
    w.put(w.adm, w.m1, saturday, kind="shift", start="10:00", end="12:00")
    w.put(w.adm, w.m1, tuesday, kind="vacation")
    rec = w.record(w.m2, day, 19)  # 19:00–20:00 — мешает обрезке m2

    week = salon_week("10:00", "19:00")
    week["saturday"] = {"isWorkDay": False}
    week["sunday"] = {"isWorkDay": False}
    result = w.s.api.call(
        "PUT", "/settings/schedule", token=w.s.su, salon=w.s.id, json={"week": week}
    )
    shifts = result["shifts"]
    assert shifts["removed"] >= 1 and shifts["trimmed"] >= 2
    conflict = next(c for c in shifts["conflicts"] if c["date"] == str(day))
    assert conflict["staffId"] == w.m2["id"] and conflict["records"][0]["id"] == rec["id"]

    grid = w.s.api.get(f"/shifts?dateFrom={day}&dateTo={saturday}", token=w.s.su, salon=w.s.id)
    rows = {r["staffId"]: r["days"] for r in grid["staff"]}
    anna, bohdana = rows[w.m1["id"]], rows[w.m2["id"]]
    assert (anna[0]["start"], anna[0]["end"]) == ("10:00:00", "19:00:00")
    assert (anna[0]["breakStart"], anna[0]["breakEnd"]) == ("18:30:00", "19:00:00")
    assert anna[1]["kind"] == "vacation"  # отметки не трогаются
    assert anna[5]["kind"] is None  # суббота теперь закрыта — смена удалена
    assert (bohdana[0]["start"], bohdana[0]["end"]) == ("09:00:00", "20:00:00")  # конфликт
    assert bohdana[1]["start"] == "10:00:00"  # и так внутри часов
    w.s.api.call(
        "PUT",
        "/settings/schedule",
        token=w.s.su,
        salon=w.s.id,
        json={"week": salon_week("08:00", "20:00")},
    )


def test_fired_staff_and_statuses(w: World) -> None:
    temp, _ = w.s.create_staff(firstName="Тимчасова")
    day = MONDAY + timedelta(days=3)
    w.put(w.adm, temp, day, kind="shift", start="09:00", end="12:00")
    w.s.api.delete(f"/staff/{temp['id']}", token=w.adm, salon=w.s.id)
    grid = w.s.api.get(f"/shifts?dateFrom={day}&dateTo={day}", token=w.adm, salon=w.s.id)
    assert temp["id"] not in [r["staffId"] for r in grid["staff"]]
    w.s.api.patch(
        f"/staff/{w.m2['id']}", token=w.adm, salon=w.s.id, expect=422, json={"status": "vacation"}
    )


def test_master_notified_about_shift_changes(w: World, monkeypatch: pytest.MonkeyPatch) -> None:
    from workers import telegram
    from workers.celery_app import celery
    from workers.tasks import outbox

    sent: list[tuple[int, str]] = []
    monkeypatch.setattr(celery.conf, "task_always_eager", True)
    monkeypatch.setattr(telegram, "send_message", lambda chat, text: sent.append((chat, text)))
    outbox.publish_outbox()
    sent.clear()

    master, mst = w.s.create_staff(firstName="Ірина", phone=(tel := phone()))
    chat = 970_000_000 + int(tel[-5:])
    w.s.api.post("/link-telegram", **BOT, json={"phone": tel, "telegram_user_id": chat})
    start = MONDAY + timedelta(days=28)
    _fill(
        w,
        w.adm,
        staffIds=[master["id"]],
        dateFrom=str(start),
        dateTo=str(start + timedelta(days=2)),
        mode="weekdays",
        weekdays=shift_week("10:00", "18:00", None, None),
    )
    w.put(mst, master, start + timedelta(days=3), kind="shift", start="10:00", end="12:00")
    outbox.publish_outbox()

    texts = [text for c, text in sent if c == chat]
    assert len(texts) == 1  # массовое заполнение — одна сводка; своё изменение — без уведомления
    assert texts[0].startswith("🗓 <b>Ваш графік змінено</b>")
    assert f"{start:%d.%m}: 10:00–18:00" in texts[0]
