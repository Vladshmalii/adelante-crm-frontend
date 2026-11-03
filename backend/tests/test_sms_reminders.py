"""SMS-напоминания: настройка салона, канал клиента, доставка, журнал, отчёт, бот.

backend/docs/sms-reminders.md. Отправка в Telegram и провайдер SMS подменены.
"""

from datetime import UTC, datetime, timedelta
from typing import Any

import pytest

from tests.conftest import Salon, phone

# --- Общие помощники ----------------------------------------------------------


def _service(s: Salon) -> dict[str, Any]:
    return s.api.post(
        "/services",
        token=s.su,
        salon=s.id,
        expect=201,
        json={"name": "Манікюр", "price": 500, "durationMinutes": 60},
    )


def _record(
    s: Salon,
    master_id: str,
    service_id: str,
    start: datetime,
    client_phone: str | None = None,
    client_id: str | None = None,
) -> dict[str, Any]:
    body: dict[str, Any] = {
        "masterId": master_id,
        "serviceIds": [service_id],
        "startAt": start.isoformat(),
    }
    if client_id:
        body["clientId"] = client_id
    else:
        body["newClient"] = {"name": "Олена", "phone": client_phone or phone()}
    return s.api.post("/records", token=s.su, salon=s.id, expect=201, json=body)


@pytest.fixture(scope="module")
def staff(new_salon: Salon) -> dict[str, Any]:
    master, master_token = new_salon.create_staff()
    _, admin_token = new_salon.create_staff("administrator", firstName="Адмін")
    return {
        "master": master,
        "master_token": master_token,
        "admin_token": admin_token,
        "service": _service(new_salon),
    }


# --- Этап 2: настройка и канал клиента -----------------------------------------


def test_notification_settings(new_salon: Salon, staff: dict[str, Any]) -> None:
    s, api = new_salon, new_salon.api
    admin = staff["admin_token"]
    assert api.get("/settings/notifications", token=admin, salon=s.id) == {
        "reminderLeadMinutes": 30
    }
    for value in (15, 1440, 45):
        data = api.patch(
            "/settings/notifications",
            token=admin,
            salon=s.id,
            json={"reminderLeadMinutes": value},
        )
        assert data == {"reminderLeadMinutes": value}
    for value in (14, 1441, 0):
        api.patch(
            "/settings/notifications",
            token=admin,
            salon=s.id,
            json={"reminderLeadMinutes": value},
            expect=422,
        )
    assert api.get("/settings/notifications", token=s.su, salon=s.id)["reminderLeadMinutes"] == 45

    api.get("/settings/notifications", token=staff["master_token"], salon=s.id, expect=403)
    api.patch(
        "/settings/notifications",
        token=staff["master_token"],
        salon=s.id,
        json={"reminderLeadMinutes": 60},
        expect=403,
    )

    audit = api.get("/audit", token=s.su, salon=s.id, params={"entity": "settings"})
    rows = [a for a in audit if a["entityId"] == "notifications"]
    assert rows[0]["details"] == {"reminder_lead_minutes": [1440, 45]}
    assert len(rows) == 3

    # Вернуть значение по умолчанию для остальных тестов модуля
    api.patch("/settings/notifications", token=s.su, salon=s.id, json={"reminderLeadMinutes": 30})


def test_client_reminder_channel(new_salon: Salon, staff: dict[str, Any]) -> None:
    s, api = new_salon, new_salon.api
    start = datetime.now(UTC) + timedelta(days=3)
    rec = _record(s, staff["master"]["id"], staff["service"]["id"], start)
    client_id = rec["client"]["id"]

    card = api.get(f"/clients/{client_id}", token=staff["admin_token"], salon=s.id)
    assert card["reminderChannel"] == "auto"
    assert card["telegramLinked"] is False

    # Мастер видит своего клиента, но не канал
    master_card = api.get(f"/clients/{client_id}", token=staff["master_token"], salon=s.id)
    assert master_card["reminderChannel"] is None
    master_list = api.get("/clients", token=staff["master_token"], salon=s.id)
    assert all(c["reminderChannel"] is None for c in master_list)
    api.patch(
        f"/clients/{client_id}",
        token=staff["master_token"],
        salon=s.id,
        json={"reminderChannel": "sms"},
        expect=403,
    )

    data = api.patch(
        f"/clients/{client_id}",
        token=staff["admin_token"],
        salon=s.id,
        json={"reminderChannel": "sms"},
    )
    assert data["reminderChannel"] == "sms"
    api.patch(
        f"/clients/{client_id}",
        token=staff["admin_token"],
        salon=s.id,
        json={"reminderChannel": "pigeon"},
        expect=422,
    )
    api.patch(
        f"/clients/{client_id}",
        token=staff["admin_token"],
        salon=s.id,
        json={"reminderChannel": None},
        expect=422,
    )
    data = api.patch(
        f"/clients/{client_id}", token=s.su, salon=s.id, json={"reminderChannel": "none"}
    )
    assert data["reminderChannel"] == "none"

    audit = api.get("/audit", token=s.su, salon=s.id, params={"entity": "client"})
    changes = [a["details"] for a in audit if a["entityId"] == client_id and a["details"]]
    assert {"reminder_channel": ["auto", "sms"]} in changes
    assert {"reminder_channel": ["sms", "none"]} in changes

    created = api.post(
        "/clients",
        token=staff["admin_token"],
        salon=s.id,
        expect=201,
        json={"firstName": "Ірина", "phone": phone(), "reminderChannel": "telegram"},
    )
    assert created["reminderChannel"] == "telegram"
