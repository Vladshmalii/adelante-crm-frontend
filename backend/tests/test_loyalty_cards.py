"""Карты лояльности: типы, выдача и удаление, факты визитов через outbox, плитки, салоны типа."""

from dataclasses import dataclass
from typing import Any

import pytest

from tests.conftest import Salon
from tests.loyalty_world import Place, eager, money, new_client, publish, setup_place

__all__ = ["eager"]


@dataclass
class World:
    s: Salon
    here: Place  # салон из типа карты
    other: Place  # салон сети, которого нет в типе
    card_type: dict[str, Any]
    admin_token: str
    master_token: str
    master: dict[str, Any]


@pytest.fixture(scope="module")
def w(new_salon: Salon) -> World:
    s = new_salon
    main_id = s.api.salon_id(s.su, "main")
    here, other = setup_place(s.api, s.id, s.su), setup_place(s.api, main_id, s.su)
    card_type = s.api.post(
        "/loyalty/card-types",
        token=s.su,
        salon=s.id,
        expect=201,
        json={
            "name": "Мережа Adelante",
            "cashbackPercent": 5,
            "salonIds": [s.id],
            "levelBasis": "sold_amount",
            "levels": [
                {"threshold": 0, "name": "Старт"},
                {"threshold": 1000, "discountPercent": 5, "discountFixed": 100, "name": "Срібло"},
                {"threshold": 5000, "discountPercent": 10, "name": "Золото"},
            ],
        },
    )
    _, admin_token = s.create_staff(role="administrator")
    master, master_token = s.create_staff()
    return World(s, here, other, card_type, admin_token, master_token, master)


def _issue(w: World, client_id: str, **body: Any) -> dict[str, Any]:
    return w.s.api.post(
        f"/clients/{client_id}/loyalty-cards",
        token=w.admin_token,
        salon=w.s.id,
        expect=body.pop("expect", 201),
        json={"cardTypeId": w.card_type["id"], **body},
    )


def _cards(w: World, client_id: str, status: str = "active", salon: str | None = None) -> list:
    return w.s.api.get(
        f"/clients/{client_id}/loyalty-cards?status={status}", token=w.s.su, salon=salon or w.s.id
    )


def test_card_type_settings(w: World) -> None:
    api, s = w.s.api, w.s
    t = w.card_type
    assert [lv["name"] for lv in t["levels"]] == ["Старт", "Срібло", "Золото"]
    assert t["salons"] == [{"id": s.id, "name": f"Салон {s.slug}"}]
    assert money(t["cashbackMaxPaymentPercent"]) == 100 and t["cashbackTtlDays"] is None
    # Администратор видит типы (для выдачи), но не меняет
    assert any(
        x["id"] == t["id"] for x in api.get("/loyalty/card-types", token=w.admin_token, salon=s.id)
    )
    api.post(
        "/loyalty/card-types",
        token=w.admin_token,
        salon=s.id,
        expect=403,
        json={"name": "Ні"},
    )
    api.patch(
        f"/loyalty/card-types/{t['id']}",
        token=w.admin_token,
        salon=s.id,
        expect=403,
        json={"cashbackPercent": 50},
    )
    # Одинаковые пороги и дробный порог по визитам — 422
    api.post(
        "/loyalty/card-types",
        token=s.su,
        salon=s.id,
        expect=422,
        json={"name": "Дубль", "levels": [{"threshold": 1}, {"threshold": 1}]},
    )
    api.post(
        "/loyalty/card-types",
        token=s.su,
        salon=s.id,
        expect=422,
        json={"name": "Візити", "levelBasis": "visits", "levels": [{"threshold": 1.5}]},
    )
    temp = api.post("/loyalty/card-types", token=s.su, salon=s.id, expect=201, json={"name": "Т"})
    patched = api.patch(
        f"/loyalty/card-types/{temp['id']}",
        token=s.su,
        salon=s.id,
        json={"cashbackTtlDays": 30, "levels": [{"threshold": 10, "discountFixed": 50}]},
    )
    assert patched["cashbackTtlDays"] == 30 and len(patched["levels"]) == 1
    patched = api.patch(
        f"/loyalty/card-types/{temp['id']}",
        token=s.su,
        salon=s.id,
        json={"cashbackTtlDays": None, "isActive": False},
    )
    assert patched["cashbackTtlDays"] is None and not patched["isActive"]
    # Тип выключен — новые карты не выдаются
    cid = new_client(w.here)
    api.post(
        f"/clients/{cid}/loyalty-cards",
        token=w.admin_token,
        salon=s.id,
        expect=409,
        json={"cardTypeId": temp["id"]},
    )


def test_issue_card(w: World) -> None:
    api, s = w.s.api, w.s
    cid = new_client(w.here)
    generated = api.get("/loyalty-cards/generate-number", token=w.admin_token, salon=s.id)
    assert len(generated["number"]) == 16 and generated["number"].isdigit()

    card = _issue(w, cid)
    assert len(card["number"]) == 16 and card["status"] == "active"
    assert card["appliesHere"] and card["cardType"]["name"] == "Мережа Adelante"
    assert money(card["cashbackBalance"]) == 0 and card["visitsCount"] == 0
    assert money(card["level"]["threshold"]) == 0
    assert money(card["maxDiscountPercent"]) == 0 and card["level"]["name"] == "Старт"
    assert money(card["nextLevel"]["remaining"]) == 1000

    _issue(w, cid, expect=409)  # одна активная карта на клиента
    other = new_client(w.here)
    _issue(w, other, number=card["number"], expect=409)  # номер занят
    _issue(w, other, number="123", expect=422)
    manual = _issue(w, other, number="4000000000000001")
    assert manual["number"] == "4000000000000001"

    # В салоне, которого нет в типе, карта видна, но не применяется
    assert not _cards(w, cid, salon=w.other.id)[0]["appliesHere"]

    clients = api.get(f"/clients?query={card['number']}", token=s.su, salon=s.id)
    assert [c["id"] for c in clients] == [cid]
    assert clients[0]["loyaltyCardNumber"] == card["number"]


def test_visit_facts_and_tiles(w: World, eager: None) -> None:
    place = w.here
    cid = new_client(place)
    card = _issue(w, cid)
    rec = place.record(cid, place.service(800))
    receipt = place.pay(rec["id"], [("cash", 300), ("account", 500)])["receipt"]
    publish()

    tiles = _cards(w, cid)[0]
    # Продано 800; со счёта 500 при балансе 0 ушло в долг — Оплачено 300
    assert money(tiles["soldTotal"]) == 800 and money(tiles["paidTotal"]) == 300
    assert tiles["visitsCount"] == 1
    visits = w.s.api.get(f"/loyalty-cards/{card['id']}/visits", token=w.s.su, salon=w.s.id)
    assert len(visits) == 1 and visits[0]["isVisit"] and visits[0]["receiptId"] == receipt["id"]
    assert money(visits[0]["paidAmount"]) == 300

    # Продажа товара без записи — в «Продано», но не в «Візити»
    place.sell(cid, [("cash", 400)])
    publish()
    publish()  # повторная доставка не дублирует факт
    tiles = _cards(w, cid)[0]
    assert money(tiles["soldTotal"]) == 1200 and tiles["visitsCount"] == 1
    assert tiles["level"]["name"] == "Срібло" and money(tiles["maxDiscountFixed"]) == 100
    assert money(tiles["nextLevel"]["remaining"]) == 3800

    # Отмена чека визита — факт помечен, счётчики уменьшены
    place.cancel(receipt["id"])
    publish()
    tiles = _cards(w, cid)[0]
    assert money(tiles["soldTotal"]) == 400 and tiles["visitsCount"] == 0
    visits = w.s.api.get(f"/loyalty-cards/{card['id']}/visits", token=w.s.su, salon=w.s.id)
    cancelled = next(v for v in visits if v["receiptId"] == receipt["id"])
    assert cancelled["reversedAt"] is not None


def test_card_not_applied_outside_type_salons(w: World, eager: None) -> None:
    place = w.other
    cid = new_client(place)
    card = _issue(w, cid)
    rec = place.record(cid, place.service(500))
    place.pay(rec["id"], [("cash", 500)])
    publish()
    tiles = _cards(w, cid)[0]
    assert tiles["visitsCount"] == 0 and money(tiles["soldTotal"]) == 0
    assert w.s.api.get(f"/loyalty-cards/{card['id']}/visits", token=w.s.su, salon=w.s.id) == []


def test_delete_card_burns_cashback_and_new_card_starts_from_zero(w: World, eager: None) -> None:
    api, s, place = w.s.api, w.s, w.here
    cid = new_client(place)
    card = _issue(w, cid)
    rec = place.record(cid, place.service(1500))
    place.pay(rec["id"], [("cash", 1500)])
    publish()
    api.post(
        f"/loyalty-cards/{card['id']}/cashback-adjustments",
        token=s.su,
        salon=s.id,
        expect=201,
        json={"amount": 75, "comment": "Подарунок"},
    )
    assert _cards(w, cid)[0]["level"]["name"] == "Срібло"

    deleted = api.delete(f"/loyalty-cards/{card['id']}", token=w.admin_token, salon=s.id)
    assert deleted["status"] == "deleted" and money(deleted["cashbackBalance"]) == 0
    history = api.get(f"/loyalty-cards/{card['id']}/transactions", token=s.su, salon=s.id)
    # Кешбэк 5 % за визит 1500 = 75 плюс подарок 75 — сгорает всё
    assert [(t["type"], money(t["amount"])) for t in history] == [
        ("burn", money(-150)),
        ("adjustment", money(75)),
        ("accrual", money(75)),
    ]
    api.delete(f"/loyalty-cards/{card['id']}", token=w.admin_token, salon=s.id, expect=409)
    # Счётчики остаются на удалённой карте для истории
    old = _cards(w, cid, status="deleted")[0]
    assert money(old["soldTotal"]) == 1500 and old["visitsCount"] == 1
    assert _cards(w, cid) == []

    fresh = _issue(w, cid)
    assert money(fresh["soldTotal"]) == 0 and fresh["visitsCount"] == 0
    assert money(fresh["cashbackBalance"]) == 0
    assert money(fresh["level"]["threshold"]) == 0  # уровень сбросился


def test_rights(w: World) -> None:
    api, s, place = w.s.api, w.s, w.here
    cid = new_client(place)
    card = _issue(w, cid)
    # Мастер не видит чужого клиента и не выдаёт/удаляет карты
    api.get(f"/clients/{cid}/loyalty-cards", token=w.master_token, salon=s.id, expect=404)
    api.get(f"/loyalty-cards/{card['id']}/visits", token=w.master_token, salon=s.id, expect=404)
    api.post(
        f"/clients/{cid}/loyalty-cards",
        token=w.master_token,
        salon=s.id,
        expect=403,
        json={"cardTypeId": w.card_type["id"]},
    )
    api.delete(f"/loyalty-cards/{card['id']}", token=w.master_token, salon=s.id, expect=403)
    api.get("/loyalty-cards/generate-number", token=w.master_token, salon=s.id, expect=403)
    # Корректировка кешбэка — только суперюзер
    api.post(
        f"/loyalty-cards/{card['id']}/cashback-adjustments",
        token=w.admin_token,
        salon=s.id,
        expect=403,
        json={"amount": 10, "comment": "ні"},
    )


def test_reconciliation_resends_lost_visit_event(w: World, eager: None) -> None:
    """Событие оплаты потерялось: сверка переотправляет его, факт визита появляется."""
    import uuid
    from datetime import UTC, datetime, timedelta

    from sqlalchemy import update

    from app.models.shard import OutboxEvent, Receipt
    from workers import db
    from workers.tasks import integrity

    place = w.here
    cid = new_client(place)
    _issue(w, cid)
    rec = place.record(cid, place.service(200))
    receipt_id = uuid.UUID(place.pay(rec["id"], [("cash", 200)])["receipt"]["id"])
    salon_id = uuid.UUID(w.s.id)
    with db.shard_session(salon_id) as shard:
        # «Опубликовано», но задача не дошла; чек старше часа
        shard.execute(
            update(OutboxEvent)
            .where(OutboxEvent.published_at.is_(None))
            .values(published_at=datetime.now(UTC))
        )
        shard.execute(
            update(Receipt)
            .where(Receipt.id == receipt_id)
            .values(created_at=datetime.now(UTC) - timedelta(hours=2))
        )
        shard.commit()
    assert _cards(w, cid)[0]["visitsCount"] == 0

    assert integrity.resend_missing_visits(salon_id) == 1
    publish()
    assert _cards(w, cid)[0]["visitsCount"] == 1
    assert integrity.resend_missing_visits(salon_id) == 0
