"""SMS-напоминания: настройка салона, канал клиента, доставка, журнал, отчёт, бот.

backend/docs/sms-reminders.md. Отправка в Telegram и провайдер SMS подменены.
"""

import uuid
from datetime import UTC, datetime, timedelta
from typing import Any

import pytest

from tests.conftest import BOT_KEY, Salon, phone

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


# --- Этап 3: доставка -----------------------------------------------------------

BOT = {"prefix": "/api/bot", "headers": {"X-API-Key": BOT_KEY}}


def _uuid(value: str) -> uuid.UUID:
    return uuid.UUID(value)


class FakeSms:
    """Провайдер SMS: копит отправки; errors — очередь исключений на ближайшие вызовы."""

    name = "fake"

    def __init__(self) -> None:
        self.sent: list[tuple[str, str, str]] = []
        self.errors: list[Exception] = []
        self.calls = 0
        self.statuses: dict[str, Any] = {}

    def send(self, phone: str, text: str, reference: str) -> Any:
        from app.notifications.sms import SendResult

        self.calls += 1
        if self.errors:
            raise self.errors.pop(0)
        self.sent.append((phone, text, reference))
        return SendResult(provider_message_id=f"msg-{reference}", segments=1)

    def fetch_status(self, message_ids: list[str]) -> dict[str, Any]:
        return {i: self.statuses[i] for i in message_ids if i in self.statuses}


class FakeTelegram:
    """telegram.deliver: копит сообщения; outcomes — 'ok' | 'blocked' | 'down' по очереди."""

    def __init__(self) -> None:
        self.sent: list[tuple[int, str]] = []
        self.outcomes: list[str] = []
        self.calls = 0
        self.default = "ok"

    def __call__(self, chat_id: int, text: str) -> Any:
        from workers import telegram

        self.calls += 1
        outcome = self.outcomes.pop(0) if self.outcomes else self.default
        if outcome == "down":
            raise telegram.TelegramTemporaryError("Telegram ответил 502")
        if outcome == "blocked":
            return telegram.TelegramResult(ok=False, error="403 Forbidden: bot was blocked")
        self.sent.append((chat_id, text))
        return telegram.TelegramResult(ok=True)


@pytest.fixture()
def channels(monkeypatch: pytest.MonkeyPatch) -> tuple[FakeTelegram, FakeSms]:
    from workers import telegram
    from workers.celery_app import celery
    from workers.tasks import outbox, reminder_delivery

    tg, sms = FakeTelegram(), FakeSms()
    monkeypatch.setattr(celery.conf, "task_always_eager", True)
    monkeypatch.setattr(telegram, "deliver", tg)
    monkeypatch.setattr(reminder_delivery, "get_provider", lambda: sms)
    outbox.publish_outbox()  # события, созданные до теста, не должны мешать
    tg.sent.clear()
    tg.calls = 0
    return tg, sms


def _client(s: Salon, *, client_phone: str | None = None, channel: str = "auto") -> dict[str, Any]:
    return s.api.post(
        "/clients",
        token=s.su,
        salon=s.id,
        expect=201,
        json={"firstName": "Клієнт", "phone": client_phone or phone(), "reminderChannel": channel},
    )


def _link(s: Salon, client: dict[str, Any]) -> int:
    tg = 940_000_000 + int("".join(c for c in client["phone"] if c.isdigit())[-7:])
    s.api.post("/link-telegram", **BOT, json={"phone": client["phone"], "telegram_user_id": tg})
    return tg


def _envelope(s: Salon, client_id: str, start: datetime | None = None) -> dict[str, Any]:
    from app.notifications.outbox import RECORD_REMINDER, build_envelope

    _, envelope = build_envelope(
        RECORD_REMINDER,
        uuid.UUID(s.id),
        {
            "record_id": str(uuid.uuid4()),
            "client_id": client_id,
            "client_name": "Клієнт",
            "master_id": None,
            "master_name": "Майстер",
            "service_name": "Манікюр",
            "start_at": (start or datetime.now(UTC) + timedelta(minutes=30)).isoformat(),
        },
    )
    return envelope


def _deliver(envelope: dict[str, Any]) -> None:
    from workers.tasks import reminder_delivery

    reminder_delivery.deliver_reminder.delay(envelope)


def _journal(s: Salon, **filters: Any) -> list[Any]:
    from sqlalchemy import select

    from app.models.shard import ReminderDelivery
    from workers import db

    with db.shard_session(uuid.UUID(s.id)) as session:
        query = select(ReminderDelivery).order_by(ReminderDelivery.created_at)
        for key, value in filters.items():
            query = query.where(getattr(ReminderDelivery, key) == value)
        rows = list(session.scalars(query))
        session.expunge_all()
        return rows


def _rows(s: Salon, envelope: dict[str, Any]) -> dict[str, Any]:
    return {r.channel.value: r for r in _journal(s, event_id=uuid.UUID(envelope["event_id"]))}


def test_choose_channel_table() -> None:
    from app.models.master import ReminderChannel as RC
    from app.models.shard import DeliveryChannel as DC
    from workers.tasks.reminder_delivery import choose_channel

    assert choose_channel(RC.AUTO, True) == DC.TELEGRAM
    assert choose_channel(RC.AUTO, False) == DC.SMS
    assert choose_channel(RC.TELEGRAM, True) == DC.TELEGRAM
    assert choose_channel(RC.TELEGRAM, False) == DC.SMS  # бот отвязан — как auto
    assert choose_channel(RC.SMS, True) == DC.SMS
    assert choose_channel(RC.SMS, False) == DC.SMS
    assert choose_channel(RC.NONE, True) is None
    assert choose_channel(RC.NONE, False) is None


@pytest.mark.parametrize(
    ("channel", "linked", "expected"),
    [
        ("auto", True, "telegram"),
        ("auto", False, "sms"),
        ("telegram", True, "telegram"),
        ("telegram", False, "sms"),
        ("sms", True, "sms"),
        ("sms", False, "sms"),
        ("none", True, None),
        ("none", False, None),
    ],
)
def test_delivery_by_preference(
    new_salon: Salon,
    channels: tuple[FakeTelegram, FakeSms],
    channel: str,
    linked: bool,
    expected: str | None,
) -> None:
    tg, sms = channels
    client = _client(new_salon, channel=channel)
    if linked:
        _link(new_salon, client)
    envelope = _envelope(new_salon, client["id"])
    _deliver(envelope)

    rows = _rows(new_salon, envelope)
    if expected is None:
        assert rows == {} and tg.sent == [] and sms.sent == []
    elif expected == "telegram":
        assert set(rows) == {"telegram"} and rows["telegram"].status == "sent"
        assert len(tg.sent) == 1 and sms.sent == []
    else:
        assert set(rows) == {"sms"} and tg.sent == []
        row = rows["sms"]
        assert row.status == "sent" and row.is_fallback is False
        assert row.provider == "fake" and row.provider_message_id == f"msg-{envelope['event_id']}"
        assert row.segments == 1 and row.cost is not None and row.cost > 0
        assert len(row.text) <= 70
        assert len(sms.sent) == 1
        assert sms.sent[0][2] == envelope["event_id"]  # sequence_id — event_id


def test_telegram_text_shows_visit_time(
    new_salon: Salon, channels: tuple[FakeTelegram, FakeSms]
) -> None:
    from app.timeutils import to_local

    tg, _ = channels
    client = _client(new_salon)
    _link(new_salon, client)
    start = datetime.now(UTC) + timedelta(days=1, minutes=5)
    _deliver(_envelope(new_salon, client["id"], start))
    text = tg.sent[0][1]
    assert "Через 30 хвилин" not in text
    assert text.splitlines()[1] == f"Завтра о {to_local(start):%H:%M}" or (
        # тест у полуночи: «завтра» в UTC может оказаться другим днём по Киеву
        text.splitlines()[1].endswith(f"о {to_local(start):%H:%M}")
    )


def test_telegram_blocked_falls_back_to_one_sms(
    new_salon: Salon, channels: tuple[FakeTelegram, FakeSms]
) -> None:
    tg, sms = channels
    tg.default = "blocked"
    client = _client(new_salon)
    _link(new_salon, client)
    envelope = _envelope(new_salon, client["id"])
    _deliver(envelope)

    rows = _rows(new_salon, envelope)
    assert rows["telegram"].status == "failed" and "blocked" in rows["telegram"].error
    assert rows["sms"].status == "sent" and rows["sms"].is_fallback is True
    assert tg.calls == 1 and len(sms.sent) == 1

    # Повторный прогон задачи — ни второго Telegram, ни второго SMS
    _deliver(envelope)
    assert tg.calls == 1 and len(sms.sent) == 1


def test_telegram_temporary_error_retries_without_sms(
    new_salon: Salon, channels: tuple[FakeTelegram, FakeSms]
) -> None:
    tg, sms = channels
    tg.outcomes = ["down", "down", "ok"]
    client = _client(new_salon)
    _link(new_salon, client)
    envelope = _envelope(new_salon, client["id"])
    _deliver(envelope)

    rows = _rows(new_salon, envelope)
    assert set(rows) == {"telegram"} and rows["telegram"].status == "sent"
    assert tg.calls == 3 and len(tg.sent) == 1 and sms.sent == []


def test_telegram_retries_exhausted_fall_back_to_sms(
    new_salon: Salon, channels: tuple[FakeTelegram, FakeSms]
) -> None:
    from workers.tasks.reminder_delivery import MAX_RETRIES

    tg, sms = channels
    tg.default = "down"
    client = _client(new_salon)
    _link(new_salon, client)
    envelope = _envelope(new_salon, client["id"])
    _deliver(envelope)

    rows = _rows(new_salon, envelope)
    assert tg.calls == MAX_RETRIES + 1
    assert rows["telegram"].status == "failed" and "вичерпано" in rows["telegram"].error
    assert rows["sms"].is_fallback is True and len(sms.sent) == 1


def test_repeat_does_not_send_second_sms_even_without_redis_keys(
    new_salon: Salon, channels: tuple[FakeTelegram, FakeSms]
) -> None:
    from workers import db

    _, sms = channels
    client = _client(new_salon, channel="sms")
    envelope = _envelope(new_salon, client["id"])
    _deliver(envelope)
    _deliver(envelope)
    assert len(sms.sent) == 1
    # Redis «забыл» дедуп — спасает уникальность журнала
    db.redis_client.delete(f"sent:{envelope['event_id']}:sms")
    _deliver(envelope)
    assert len(sms.sent) == 1
    assert len(_journal(new_salon, client_id=_uuid(client["id"]))) == 1


@pytest.mark.parametrize("country", ["+48 512 ", "+1 202 "])
def test_foreign_phone_is_skipped(
    new_salon: Salon, channels: tuple[FakeTelegram, FakeSms], country: str
) -> None:
    _, sms = channels
    client = _client(new_salon, client_phone=country + phone()[-7:])
    envelope = _envelope(new_salon, client["id"])
    _deliver(envelope)
    row = _rows(new_salon, envelope)["sms"]
    assert row.status == "skipped" and row.error == "Номер не український або некоректний"
    assert sms.calls == 0


def test_ua_phone_formats_are_normalized(
    new_salon: Salon, channels: tuple[FakeTelegram, FakeSms]
) -> None:
    _, sms = channels
    digits = phone()[-7:]
    client = _client(new_salon, client_phone=f"+38 (050) {digits[:3]}-{digits[3:5]}-{digits[5:]}")
    envelope = _envelope(new_salon, client["id"])
    _deliver(envelope)
    assert sms.sent[0][0] == f"38050{digits}"
    assert _rows(new_salon, envelope)["sms"].phone == f"38050{digits}"


def test_sms_temporary_error_retries_permanent_fails(
    new_salon: Salon, channels: tuple[FakeTelegram, FakeSms]
) -> None:
    from app.notifications.sms import SmsPermanentError, SmsTemporaryError
    from workers.tasks.reminder_delivery import MAX_RETRIES

    _, sms = channels
    sms.errors = [SmsTemporaryError("TurboSMS 503"), SmsTemporaryError("TurboSMS 503")]
    first = _envelope(new_salon, _client(new_salon, channel="sms")["id"])
    _deliver(first)
    assert sms.calls == 3 and len(sms.sent) == 1
    row = _rows(new_salon, first)["sms"]
    assert row.status == "sent" and row.error is None

    sms.calls, sms.sent = 0, []
    sms.errors = [SmsPermanentError("TurboSMS 305 INVALID_PHONE")]
    second = _envelope(new_salon, _client(new_salon, channel="sms")["id"])
    _deliver(second)
    assert sms.calls == 1 and sms.sent == []
    row = _rows(new_salon, second)["sms"]
    assert row.status == "failed" and "INVALID_PHONE" in row.error

    sms.calls = 0
    sms.errors = [SmsTemporaryError("TurboSMS 503") for _ in range(MAX_RETRIES + 1)]
    third = _envelope(new_salon, _client(new_salon, channel="sms")["id"])
    _deliver(third)
    assert sms.calls == MAX_RETRIES + 1
    row = _rows(new_salon, third)["sms"]
    assert row.status == "failed" and "вичерпано" in row.error


def _set_lead(s: Salon, minutes: int) -> None:
    s.api.patch(
        "/settings/notifications", token=s.su, salon=s.id, json={"reminderLeadMinutes": minutes}
    )


def test_scanner_uses_salon_lead_time(
    new_salon: Salon, staff: dict[str, Any], channels: tuple[FakeTelegram, FakeSms]
) -> None:
    from workers.tasks import reminders

    s = new_salon
    _, sms = channels
    now = datetime.now(UTC)
    master, service = staff["master"]["id"], staff["service"]["id"]

    def record_at(minutes: float) -> str:
        client = _client(s, channel="sms")
        start = now + timedelta(minutes=minutes)
        return _record(s, master, service, start, client_id=client["id"])["id"]

    def reminded() -> set[uuid.UUID]:
        return {r.record_id for r in _journal(s, channel="sms")}

    try:
        # По умолчанию 30: запись через 30.5 мин получает, через 60.5 — нет
        at_30 = record_at(30.5)
        at_60 = record_at(60.5)
        reminders.scan_shard(s.id)
        assert _uuid(at_30) in reminded() and _uuid(at_60) not in reminded()

        _set_lead(s, 60)
        reminders.scan_shard(s.id)
        assert _uuid(at_60) in reminded()

        _set_lead(s, 15)
        at_15 = record_at(15.5)
        reminders.scan_shard(s.id)
        assert _uuid(at_15) in reminded()

        _set_lead(s, 1440)
        at_1440 = record_at(1440.5)
        # Момент напоминания при 1440 уже прошёл — напоминания не будет (решение 9)
        missed = record_at(600)
        reminders.scan_shard(s.id)
        assert _uuid(at_1440) in reminded() and _uuid(missed) not in reminded()

        # Повторный скан — второго SMS нет
        before = len(sms.sent)
        reminders.scan_shard(s.id)
        assert len(sms.sent) == before
    finally:
        _set_lead(s, 30)
