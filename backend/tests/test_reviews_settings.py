"""Ссылка на отзыв после визита и настройки салона (інформація, графік роботи)."""

import re
from datetime import datetime
from typing import Any

import pytest

from tests.conftest import BOT_KEY, Salon, phone

BOT = {"prefix": "/api/bot", "headers": {"X-API-Key": BOT_KEY}}


# --- Отзывы -----------------------------------------------------------------------


@pytest.fixture()
def sent(monkeypatch: pytest.MonkeyPatch) -> list[tuple[int, str]]:
    from workers import telegram
    from workers.celery_app import celery
    from workers.tasks import outbox

    messages: list[tuple[int, str]] = []
    monkeypatch.setattr(celery.conf, "task_always_eager", True)
    monkeypatch.setattr(telegram, "send_message", lambda chat, text: messages.append((chat, text)))
    outbox.publish_outbox()
    messages.clear()
    return messages


def test_review_link_after_visit(new_salon: Salon, sent: list[tuple[int, str]]) -> None:
    from workers.tasks import outbox

    s, api = new_salon, new_salon.api
    master, mst = s.create_staff(firstName="Анна")
    svc = api.post(
        "/services",
        token=s.su,
        salon=s.id,
        expect=201,
        json={"name": "Манікюр", "price": 500, "durationMinutes": 60},
    )
    client_phone = phone()
    tg = 960_000_000 + int(client_phone[-5:])

    def visit(hour: int) -> dict[str, Any]:
        return api.post(
            "/records",
            token=s.su,
            salon=s.id,
            expect=201,
            json={
                "newClient": {"name": "Олена", "phone": client_phone},
                "masterId": master["id"],
                "serviceIds": [svc["id"]],
                "startAt": datetime(2026, 1, 5, hour).isoformat(),
            },
        )

    rec = visit(10)
    api.post("/link-telegram", **BOT, json={"phone": client_phone, "telegram_user_id": tg})
    api.post(f"/records/{rec['id']}/complete", token=mst, salon=s.id, json={})
    outbox.publish_outbox()

    texts = [text for chat, text in sent if chat == tg]
    assert len(texts) == 1 and texts[0].startswith("💐 <b>Дякуємо за візит!</b>")
    assert "Анна" in texts[0] and "Манікюр" in texts[0]
    match = re.search(rf"/{s.slug}/review\?token=([0-9a-f-]{{36}})", texts[0])
    assert match, texts[0]
    token = match.group(1)

    booking = {"prefix": f"/api/booking/{s.slug}"}
    context = api.get(f"/reviews/{token}", **booking)
    assert context["master_name"] == "Анна" and context["services"] == ["Манікюр"]
    assert context["salon_name"] == f"Салон {s.slug}"
    api.post("/reviews", **booking, expect=201, json={"token": token, "rating": 5, "text": "Супер"})
    api.get(f"/reviews/{token}", **booking, expect=404)
    reviews = api.get("/reviews", token=s.su, salon=s.id)
    assert [r["rating"] for r in reviews] == [5]

    # Клиент без Telegram — сообщения нет; событие без завершения — тоже
    other = api.post(
        "/records",
        token=s.su,
        salon=s.id,
        expect=201,
        json={
            "newClient": {"name": "Без бота", "phone": phone()},
            "masterId": master["id"],
            "serviceIds": [svc["id"]],
            "startAt": datetime(2026, 1, 5, 12).isoformat(),
        },
    )
    sent.clear()
    api.post(f"/records/{other['id']}/complete", token=s.su, salon=s.id, json={})
    visit(14)
    outbox.publish_outbox()
    assert [chat for chat, _ in sent if chat == tg] == []


# --- Настройки салона ----------------------------------------------------------------


def test_salon_info(new_salon: Salon) -> None:
    s, api = new_salon, new_salon.api
    _, adm = s.create_staff("administrator")
    _, mst = s.create_staff()

    info = api.get("/settings/salon", token=adm, salon=s.id)
    assert info["name"] == f"Салон {s.slug}" and info["address"] is None

    updated = api.patch(
        "/settings/salon",
        token=adm,
        salon=s.id,
        json={
            "name": "Adelante Центр",
            "legalName": "ФОП Коваль",
            "city": "Київ",
            "address": "вул. Хрещатик, 1",
            "phone": "+380441234567",
            "email": "hello@adelante.ua",
            "instagram": "@adelante",
            "openedOn": "2020-03-01",
            "description": "  ",
        },
    )
    assert updated["name"] == "Adelante Центр" and updated["openedOn"] == "2020-03-01"
    assert updated["description"] is None  # пустая строка — очистка

    again = api.patch("/settings/salon", token=adm, salon=s.id, json={"city": "Львів"})
    assert again["city"] == "Львів" and again["address"] == "вул. Хрещатик, 1"
    api.patch("/settings/salon", token=adm, salon=s.id, expect=422, json={"email": "не email"})
    api.patch("/settings/salon", token=adm, salon=s.id, expect=422, json={"name": " "})
    cleared = api.patch("/settings/salon", token=adm, salon=s.id, json={"email": ""})
    assert cleared["email"] is None

    # Новое название видно везде: /auth/me, сайт записи
    salons = api.get("/auth/me", token=adm)["salons"]
    assert next(x for x in salons if x["id"] == s.id)["name"] == "Adelante Центр"
    public = api.get("/salon", prefix=f"/api/booking/{s.slug}")
    assert public["name"] == "Adelante Центр" and public["city"] == "Львів"
    assert "legal_name" not in public and public["schedule"] is None

    audit = api.get("/audit?entity=settings", token=adm, salon=s.id)
    assert audit and audit[-1]["entityName"] == "Інформація про салон"
    assert audit[-1]["details"]["name"] == [f"Салон {s.slug}", "Adelante Центр"]

    api.get("/settings/salon", token=mst, salon=s.id, expect=403)
    api.patch("/settings/salon", token=mst, salon=s.id, expect=403, json={"city": "X"})


def _week(**overrides: dict[str, Any]) -> dict[str, dict[str, Any]]:
    days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    week = {d: {"isWorkDay": True, "start": "09:00", "end": "20:00"} for d in days}
    week["sunday"] = {"isWorkDay": False}
    week.update(overrides)
    return week


def test_salon_schedule(new_salon: Salon) -> None:
    s, api = new_salon, new_salon.api
    _, adm = s.create_staff("administrator")
    _, mst = s.create_staff()

    empty = api.get("/settings/schedule", token=adm, salon=s.id)
    assert empty["configured"] is False
    assert all(not d["isWorkDay"] for d in empty["week"].values())

    saved = api.call(
        "PUT",
        "/settings/schedule",
        token=adm,
        salon=s.id,
        json={
            "week": _week(
                saturday={"isWorkDay": True, "start": "10:00", "end": "16:00"},
                sunday={"isWorkDay": False, "start": "10:00", "end": "12:00"},
            )
        },
    )
    assert saved["configured"] is True
    assert saved["week"]["saturday"] == {"isWorkDay": True, "start": "10:00:00", "end": "16:00:00"}
    assert saved["week"]["sunday"] == {"isWorkDay": False, "start": None, "end": None}
    assert api.get("/settings/schedule", token=adm, salon=s.id) == {
        k: v for k, v in saved.items() if k != "shifts"
    }
    assert saved["shifts"] == {"trimmed": 0, "removed": 0, "conflicts": []}

    week = _week()
    del week["friday"]
    api.call("PUT", "/settings/schedule", token=adm, salon=s.id, expect=422, json={"week": week})
    api.call(
        "PUT",
        "/settings/schedule",
        token=adm,
        salon=s.id,
        expect=422,
        json={"week": _week(monday={"isWorkDay": True, "start": "18:00", "end": "09:00"})},
    )
    api.call(
        "PUT",
        "/settings/schedule",
        token=adm,
        salon=s.id,
        expect=422,
        json={"week": _week(monday={"isWorkDay": True})},
    )
    api.call("PUT", "/settings/schedule", token=mst, salon=s.id, expect=403, json={"week": _week()})

    public = api.get("/salon", prefix=f"/api/booking/{s.slug}")
    assert public["schedule"]["saturday"] == {
        "is_work_day": True,
        "start": "10:00:00",
        "end": "16:00:00",
    }

    api.call("PUT", "/settings/schedule", token=adm, salon=s.id, json={"week": _week()})
    audit = [
        a
        for a in api.get("/audit?entity=settings", token=adm, salon=s.id)
        if a["entityName"] == "Графік роботи салону"
    ]
    assert audit[0]["details"] == {"saturday": ["10:00–16:00", "09:00–20:00"]}
