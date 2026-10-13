"""Скидки: наибольшая из личной, % и фиксированной карты, предпросмотр, снапшоты, expectedTotal."""

import uuid
from dataclasses import dataclass
from typing import Any

import pytest

from tests.conftest import Salon
from tests.loyalty_world import Place, eager, money, new_client, publish, setup_place

__all__ = ["eager"]


@dataclass
class World:
    s: Salon
    place: Place
    other: Place
    sold_type: dict[str, Any]  # уровень с 0 ₴: 5 % и 80 ₴; кешбэк 10 %
    visits_type: dict[str, Any]  # уровни по визитам: со 2-го визита 20 %


@pytest.fixture(scope="module")
def w(new_salon: Salon) -> World:
    s = new_salon

    def card_type(**fields: Any) -> dict[str, Any]:
        return s.api.post(
            "/loyalty/card-types",
            token=s.su,
            salon=s.id,
            expect=201,
            json={"name": f"Тип {uuid.uuid4().hex[:4]}", "salonIds": [s.id], **fields},
        )

    return World(
        s,
        setup_place(s.api, s.id, s.su),
        setup_place(s.api, s.api.salon_id(s.su, "main"), s.su),
        card_type(
            cashbackPercent=10,
            levels=[{"threshold": 0, "discountPercent": 5, "discountFixed": 80}],
        ),
        card_type(levelBasis="visits", levels=[{"threshold": 2, "discountPercent": 20}]),
    )


def _client(w: World, discount: int = 0, card_type: dict[str, Any] | None = None) -> str:
    cid = new_client(w.place)
    if discount:
        w.s.api.patch(
            f"/clients/{cid}", token=w.s.su, salon=w.s.id, json={"discountPercent": discount}
        )
    if card_type:
        w.s.api.post(
            f"/clients/{cid}/loyalty-cards",
            token=w.s.su,
            salon=w.s.id,
            expect=201,
            json={"cardTypeId": card_type["id"]},
        )
    return cid


def _checkout(w: World, record_id: str, place: Place | None = None) -> dict[str, Any]:
    place = place or w.place
    return w.s.api.get(f"/records/{record_id}/checkout", token=w.s.su, salon=place.id)


def _selected(preview: dict[str, Any]) -> tuple[str, Any]:
    return preview["discountSource"], money(preview["discountAmount"])


def test_biggest_discount_wins(w: World) -> None:
    p = w.place
    cid = _client(w, discount=10, card_type=w.sold_type)
    # 1000: личная 100, % карты 50, фиксированная 80 → личная
    big = _checkout(w, p.record(cid, p.service(1000))["id"])
    assert _selected(big) == ("client", 100) and money(big["total"]) == 900
    assert {d["source"]: (money(d["amount"]), d["selected"]) for d in big["discounts"]} == {
        "client": (100, True),
        "card_percent": (50, False),
        "card_fixed": (80, False),
    }
    # 500: личная 50, % карты 25, фиксированная 80 → фиксированная
    small = _checkout(w, p.record(cid, p.service(500))["id"])
    assert _selected(small) == ("card_fixed", 80) and money(small["total"]) == 420
    # Без личной скидки, 2000: % карты 100 > фиксированной 80
    cid2 = _client(w, card_type=w.sold_type)
    assert _selected(_checkout(w, p.record(cid2, p.service(2000))["id"])) == ("card_percent", 100)
    # Фиксированная — не больше суммы: 50 ₴ → итог 0
    tiny = _checkout(w, p.record(cid2, p.service(50))["id"])
    assert _selected(tiny) == ("card_fixed", 50) and money(tiny["total"]) == 0
    # Без карты и скидки — none
    plain = _checkout(w, p.record(new_client(p), p.service(300))["id"])
    assert _selected(plain) == ("none", 0) and plain["card"] is None and plain["discounts"] == []


def test_preview_balances_and_card(w: World) -> None:
    p = w.place
    cid = _client(w, card_type=w.sold_type)
    w.s.api.post(
        f"/clients/{cid}/account/topups",
        token=w.s.su,
        salon=w.s.id,
        expect=201,
        json={"amount": 70},
    )
    preview = _checkout(w, p.record(cid, p.service(1000))["id"])
    assert preview["clientId"] == cid
    assert money(preview["card"]["level"]["discountPercent"]) == 5
    assert money(preview["accountBalance"]) == 70
    assert (
        money(preview["cashback"]["balance"]) == 0 and money(preview["cashback"]["maxPayment"]) == 0
    )
    assert money(preview["sold"]) == 1000 and len(preview["lines"]) == 1
    line = preview["lines"][0]
    assert line["kind"] == "service" and line["recordServiceId"] and not line["isBonus"]


def test_payment_uses_server_total_and_snapshots(w: World, eager: None) -> None:
    p = w.place
    cid = _client(w, card_type=w.sold_type)
    rec = p.record(cid, p.service(2000))
    p.pay(rec["id"], [("cash", 2000)], expect=409)  # без скидки — не совпадает с итогом
    p.pay(rec["id"], [("cash", 1900)], extra={"expectedTotal": 2000}, expect=409)  # устарел
    paid = p.pay(rec["id"], [("cash", 1900)], extra={"expectedTotal": 1900})
    record = paid["record"]
    assert money(record["totalAmount"]) == 1900 and money(record["price"]) == 2000
    assert record["discountSource"] == "card_percent" and money(record["discountAmount"]) == 100
    receipt = next(
        r
        for r in w.s.api.get("/finances/receipts", token=w.s.su, salon=w.s.id)
        if r["id"] == paid["receipt"]["id"]
    )
    assert money(receipt["subtotal"]) == 2000 and money(receipt["discountAmount"]) == 100
    assert receipt["discountSource"] == "card_percent" and receipt["loyaltyCardId"]

    publish()
    card = w.s.api.get(f"/clients/{cid}/loyalty-cards", token=w.s.su, salon=w.s.id)[0]
    # Продано — до скидки, Оплачено — после; кешбэк 10 % от оплаченного
    assert money(card["soldTotal"]) == 2000 and money(card["paidTotal"]) == 1900
    assert money(card["cashbackBalance"]) == 190
    visit = w.s.api.get(f"/loyalty-cards/{card['id']}/visits", token=w.s.su, salon=w.s.id)[0]
    assert money(visit["discountAmount"]) == 100

    # Отмена чека сбрасывает снапшот записи
    p.cancel(paid["receipt"]["id"])
    again = w.s.api.get(f"/records/{rec['id']}", token=w.s.su, salon=w.s.id)
    assert again["paymentStatus"] == "unpaid" and money(again["totalAmount"]) == 2000
    assert again["discountSource"] == "none"


def test_zero_total_without_payments(w: World) -> None:
    p = w.place
    cid = _client(w, card_type=w.sold_type)
    rec = p.record(cid, p.service(60))
    paid = p.pay(rec["id"], [], extra={"expectedTotal": 0})
    assert paid["record"]["paymentStatus"] == "paid" and money(paid["receipt"]["amount"]) == 0


def test_card_level_by_visits(w: World, eager: None) -> None:
    p = w.place
    cid = _client(w, card_type=w.visits_type)
    for _ in range(2):
        rec = p.record(cid, p.service(100))
        assert _selected(_checkout(w, rec["id"])) == ("none", 0)
        p.pay(rec["id"], [("cash", 100)])
        publish()
    rec = p.record(cid, p.service(100))
    assert _selected(_checkout(w, rec["id"])) == ("card_percent", 20)


def test_card_discount_not_applied_outside_type_salons(w: World) -> None:
    o = w.other
    cid = _client(w, discount=3, card_type=w.sold_type)
    preview = _checkout(w, o.record(cid, o.service(1000))["id"], place=o)
    assert preview["card"] is None and preview["cashback"] is None
    assert _selected(preview) == ("client", 30)


def test_sale_discount_with_subtotal(w: World) -> None:
    p, api, s = w.place, w.s.api, w.s
    cid = _client(w, discount=10, card_type=w.sold_type)
    preview = api.get(
        f"/finances/receipts/checkout?subtotal=600&clientId={cid}", token=s.su, salon=s.id
    )
    assert _selected(preview) == ("card_fixed", 80) and money(preview["total"]) == 520
    assert preview["lines"][0]["kind"] == "product"
    receipt = api.post(
        "/finances/receipts",
        token=s.su,
        salon=s.id,
        expect=201,
        json={
            "clientId": cid,
            "subtotal": 600,
            "expectedTotal": 520,
            "payments": [{"paymentMethodId": p.methods["cash"]["id"], "amount": 520}],
        },
    )
    assert money(receipt["subtotal"]) == 600 and money(receipt["discountAmount"]) == 80
    api.post(
        "/finances/receipts",
        token=s.su,
        salon=s.id,
        expect=409,
        json={
            "clientId": cid,
            "subtotal": 600,
            "expectedTotal": 600,
            "payments": [{"paymentMethodId": p.methods["cash"]["id"], "amount": 600}],
        },
    )
    # Без subtotal — как раньше: сумма чека = сумма частей, без скидки
    legacy = p.sell(cid, [("cash", 300)])
    assert money(legacy["amount"]) == 300 and legacy["discountSource"] == "none"
    # Предпросмотр без клиента — без скидки
    anon = api.get("/finances/receipts/checkout?subtotal=100", token=s.su, salon=s.id)
    assert _selected(anon) == ("none", 0) and money(anon["total"]) == 100
