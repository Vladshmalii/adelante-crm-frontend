"""Воркер: outbox → уведомления в Telegram (отправка подменена), напоминания клиенту."""

from datetime import UTC, date, datetime, timedelta
from typing import Any
from zoneinfo import ZoneInfo

import pytest

from tests.conftest import BOT_KEY, Salon, phone, salon_week

BOT = {"prefix": "/api/bot", "headers": {"X-API-Key": BOT_KEY}}
TZ = ZoneInfo("Europe/Kyiv")


@pytest.fixture()
def sent(monkeypatch: pytest.MonkeyPatch) -> list[tuple[int, str]]:
    """Celery в eager-режиме, сообщения Telegram копятся в списке."""
    from workers import telegram
    from workers.celery_app import celery

    messages: list[tuple[int, str]] = []
    monkeypatch.setattr(celery.conf, "task_always_eager", True)
    monkeypatch.setattr(
        telegram, "send_message", lambda chat_id, text: messages.append((chat_id, text))
    )
    _publish()  # очистить outbox от событий, созданных до теста
    messages.clear()
    return messages


def _publish() -> None:
    from workers.tasks import outbox

    outbox.publish_outbox()


def _link(api: Any, person_phone: str, tg: int) -> None:
    api.post("/link-telegram", **BOT, json={"phone": person_phone, "telegram_user_id": tg})


def test_master_and_admin_notifications(new_salon: Salon, sent: list[tuple[int, str]]) -> None:
    s, api = new_salon, new_salon.api
    admin_phone, master_phone = phone(), phone()
    _, adm = s.create_staff("administrator", phone=admin_phone)
    master, mst = s.create_staff(firstName="Марія", phone=master_phone)
    other, _ = s.create_staff(firstName="Інна")
    admin_tg, master_tg = 910_000_000 + int(admin_phone[-5:]), 920_000_000 + int(master_phone[-5:])
    _link(api, admin_phone, admin_tg)
    _link(api, master_phone, master_tg)
    # Второй администратор — без смены: уведомлений не получает
    idle_phone = phone()
    s.create_staff("administrator", phone=idle_phone)
    idle_tg = 930_000_000 + int(idle_phone[-5:])
    _link(api, idle_phone, idle_tg)
    # Суперюзер получает всегда
    su_phone = phone()
    api.patch("/auth/me", token=s.su, json={"phone": su_phone})
    su_tg = 940_000_000 + int(su_phone[-5:])
    _link(api, su_phone, su_tg)
    # Смена администратора — прямо сейчас (часы салона на весь день)
    api.call(
        "PUT",
        "/settings/schedule",
        token=s.su,
        salon=s.id,
        json={"week": salon_week("00:00", "23:59")},
    )
    admin_id = api.get("/auth/me", token=adm)["id"]
    api.call(
        "PUT",
        f"/shifts/{admin_id}/{datetime.now(TZ).date()}",
        token=adm,
        salon=s.id,
        json={"kind": "shift", "start": "00:00", "end": "23:59"},
    )
    svc = api.post(
        "/services",
        token=adm,
        salon=s.id,
        expect=201,
        json={"name": "Стрижка", "price": 300, "durationMinutes": 30},
    )

    start = datetime.combine(date.today() + timedelta(days=5), datetime.min.time()).replace(hour=15)
    rec = api.post(
        "/records",
        token=adm,
        salon=s.id,
        expect=201,
        json={
            "newClient": {"name": "Тест", "phone": phone()},
            "masterId": master["id"],
            "serviceIds": [svc["id"]],
            "startAt": start.isoformat(),
        },
    )
    api.patch(
        f"/records/{rec['id']}",
        token=adm,
        salon=s.id,
        json={"startAt": (start + timedelta(hours=1)).isoformat()},
    )
    api.patch(f"/records/{rec['id']}", token=adm, salon=s.id, json={"masterId": other["id"]})
    api.patch(f"/records/{rec['id']}", token=adm, salon=s.id, json={"masterId": master["id"]})
    api.post(f"/records/{rec['id']}/status", token=adm, salon=s.id, json={"status": "cancelled"})
    # Своё действие мастеру не приходит
    own = api.post(
        "/records",
        token=mst,
        salon=s.id,
        expect=201,
        json={
            "newClient": {"name": "Своя", "phone": phone()},
            "serviceIds": [svc["id"]],
            "startAt": start.isoformat(),
        },
    )
    api.patch(
        f"/records/{own['id']}",
        token=mst,
        salon=s.id,
        json={"startAt": (start + timedelta(hours=2)).isoformat()},
    )
    # Запись без мастера: создание и отмена — администраторам
    queue = api.post(
        "/records",
        token=s.su,
        salon=s.id,
        expect=201,
        json={
            "newClient": {"name": "Черга", "phone": phone()},
            "serviceIds": [svc["id"]],
            "startAt": start.isoformat(),
        },
    )
    api.post(f"/records/{queue['id']}/status", token=s.su, salon=s.id, json={"status": "cancelled"})
    _publish()

    to_master = [text.split("\n")[0] for chat, text in sent if chat == master_tg]
    assert to_master == [
        "🆕 <b>Новий запис до вас</b>",
        "🔁 <b>Запис змінено</b>",
        "↪️ <b>Запис передано іншому майстру</b>",
        "🆕 <b>Новий запис до вас</b>",
        "❌ <b>Запис скасовано</b>",
    ]
    moved = next(text for chat, text in sent if chat == master_tg and "змінено" in text)
    assert "Було:" in moved and "Стало:" in moved and "Салон:" in moved

    to_admin = [text.split("\n")[0] for chat, text in sent if chat == admin_tg]
    # Свои действия администратору не приходят; остальные — пока он на смене
    assert to_admin == [
        "🗓 <b>Новий запис</b>",
        "🔁 <b>Запис перенесено</b>",
        "🗓 <b>Новий запис</b>",
        "❌ <b>Запис скасовано</b>",
    ]
    to_su = [text.split("\n")[0] for chat, text in sent if chat == su_tg]
    assert to_su == [
        "🗓 <b>Новий запис</b>",
        "🔁 <b>Запис перенесено</b>",
        "❌ <b>Запис скасовано</b>",
        "🗓 <b>Новий запис</b>",
        "🔁 <b>Запис перенесено</b>",
    ]
    assert [chat for chat, _ in sent if chat == idle_tg] == []
    _publish()
    counted = len(to_master) + len(to_admin) + len(to_su)
    assert len([c for c, _ in sent if c in (master_tg, admin_tg, su_tg, idle_tg)]) == counted


def test_client_reminder(new_salon: Salon, sent: list[tuple[int, str]]) -> None:
    from workers.tasks import reminders

    s, api = new_salon, new_salon.api
    master, _ = s.create_staff()
    svc = api.post(
        "/services",
        token=s.su,
        salon=s.id,
        expect=201,
        json={"name": "Манікюр", "price": 500, "durationMinutes": 60},
    )
    client_phone = phone()
    start = datetime.now(UTC) + timedelta(minutes=30, seconds=30)
    rec = api.post(
        "/records",
        token=s.su,
        salon=s.id,
        expect=201,
        json={
            "newClient": {"name": "Олена", "phone": client_phone},
            "masterId": master["id"],
            "serviceIds": [svc["id"]],
            "startAt": start.isoformat(),
        },
    )
    api.post(f"/records/{rec['id']}/status", token=s.su, salon=s.id, json={"status": "confirmed"})
    client_tg = 930_000_000 + int(client_phone[-5:])
    _link(api, client_phone, client_tg)

    reminders.scan_shard(s.id)
    reminders.scan_shard(s.id)
    texts = [text for chat, text in sent if chat == client_tg]
    assert len(texts) == 1
    assert texts[0].startswith("⏰ <b>Нагадування про візит</b>")
    assert "Манікюр" in texts[0] and f"/{s.slug}" in texts[0]
