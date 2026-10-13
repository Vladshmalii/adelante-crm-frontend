"""Кешбэк: начисление от «Оплачено», оплата кешбэком и лимит, сторно при отмене, сгорание."""

import uuid
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from decimal import Decimal
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
    basic: dict[str, Any]  # 5 %, лимит 100 %, не сгорает, услуги и товары
    strict: dict[str, Any]  # 10 %, лимит 20 %, сгорает через 30 дней, только услуги


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
        card_type(cashbackPercent=5),
        card_type(
            cashbackPercent=10,
            cashbackMaxPaymentPercent=20,
            cashbackTtlDays=30,
            cashbackOnProducts=False,
        ),
    )


def _holder(w: World, card_type: dict[str, Any]) -> tuple[str, dict[str, Any]]:
    cid = new_client(w.place)
    card = w.s.api.post(
        f"/clients/{cid}/loyalty-cards",
        token=w.s.su,
        salon=w.s.id,
        expect=201,
        json={"cardTypeId": card_type["id"]},
    )
    return cid, card


def _cashback(w: World, card: dict[str, Any]) -> Decimal:
    cards = w.s.api.get(f"/clients/{card['clientId']}/loyalty-cards", token=w.s.su, salon=w.s.id)
    return money(next(c for c in cards if c["id"] == card["id"])["cashbackBalance"])


def _history(w: World, card: dict[str, Any]) -> list[tuple[str, Decimal]]:
    txns = w.s.api.get(f"/loyalty-cards/{card['id']}/transactions", token=w.s.su, salon=w.s.id)
    return [(t["type"], money(t["amount"])) for t in reversed(txns)]


def _give(w: World, card: dict[str, Any], amount: float) -> None:
    w.s.api.post(
        f"/loyalty-cards/{card['id']}/cashback-adjustments",
        token=w.s.su,
        salon=w.s.id,
        expect=201,
        json={"amount": amount, "comment": "Стартовий кешбек"},
    )


def test_accrual_excludes_cashback_and_debt(w: World, eager: None) -> None:
    p = w.place
    cid, card = _holder(w, w.basic)
    p.pay(p.record(cid, p.service(1000))["id"], [("cash", 1000)])
    publish()
    assert _cashback(w, card) == 50  # 5 % от 1000

    # 1000 = кешбэк 50 + со счёта 450 (баланс 0 → долг) + наличные 500 → Оплачено 500
    p.pay(p.record(cid, p.service(1000))["id"], [("bonus", 50), ("account", 450), ("cash", 500)])
    publish()
    assert _cashback(w, card) == 25
    assert _history(w, card) == [
        ("accrual", Decimal(50)),
        ("payment", Decimal(-50)),
        ("accrual", Decimal(25)),
    ]
    tiles = w.s.api.get(f"/clients/{cid}/loyalty-cards", token=w.s.su, salon=w.s.id)[0]
    assert money(tiles["paidTotal"]) == 1500 and money(tiles["soldTotal"]) == 2000


def test_deposit_part_earns_cashback(w: World, eager: None) -> None:
    """Со счёта в пределах депозита — это оплачено, кешбэк начисляется."""
    p = w.place
    cid, card = _holder(w, w.basic)
    w.s.api.post(
        f"/clients/{cid}/account/topups",
        token=w.s.su,
        salon=w.s.id,
        expect=201,
        json={"amount": 300},
    )
    p.pay(p.record(cid, p.service(500))["id"], [("account", 500)])
    publish()
    assert _cashback(w, card) == 15  # 5 % от 300; 200 ушли в долг


def test_payment_limits(w: World) -> None:
    p = w.place
    cid, card = _holder(w, w.strict)
    rec = p.record(cid, p.service(1000))
    p.pay(rec["id"], [("bonus", 10), ("cash", 990)], expect=409)  # кешбэка нет
    _give(w, card, 300)
    p.pay(rec["id"], [("bonus", 250), ("cash", 750)], expect=409)  # > 20 % чека
    p.pay(rec["id"], [("bonus", 200), ("cash", 800)])
    assert _cashback(w, card) == 100

    rec2 = p.record(cid, p.service(1000))
    p.pay(rec2["id"], [("bonus", 150), ("cash", 850)], expect=409)  # > баланса
    # Без карты кешбэком не платят; в салоне не из типа — тоже
    plain = new_client(p)
    p.pay(p.record(plain, p.service(100))["id"], [("bonus", 10), ("cash", 90)], expect=409)
    o = w.other
    o.pay(o.record(cid, o.service(100))["id"], [("bonus", 10), ("cash", 90)], expect=409)


def test_cashback_only_on_enabled_lines(w: World, eager: None) -> None:
    p = w.place
    cid, card = _holder(w, w.strict)  # только услуги
    p.sell(cid, [("cash", 500)])
    publish()
    assert _cashback(w, card) == 0
    p.pay(p.record(cid, p.service(500))["id"], [("cash", 500)])
    publish()
    assert _cashback(w, card) == 50


def test_cancel_returns_cashback_and_reverses_accrual(w: World, eager: None) -> None:
    p = w.place
    cid, card = _holder(w, w.basic)
    _give(w, card, 200)
    paid = p.pay(p.record(cid, p.service(1000))["id"], [("bonus", 200), ("cash", 800)])
    publish()
    assert _cashback(w, card) == 40  # 200 потрачено, начислено 5 % от 800

    p.cancel(paid["receipt"]["id"])
    publish()
    assert _cashback(w, card) == 200
    assert [t for t, _ in _history(w, card)] == [
        "adjustment",
        "payment",
        "accrual",
        "reversal",
        "reversal",
    ]


def test_spent_accrual_reversal_goes_negative(w: World, eager: None) -> None:
    p = w.place
    cid, card = _holder(w, w.basic)
    first = p.pay(p.record(cid, p.service(1000))["id"], [("cash", 1000)])
    publish()
    p.pay(p.record(cid, p.service(100))["id"], [("bonus", 50), ("cash", 50)])
    publish()
    assert _cashback(w, card) == Decimal("2.50")
    p.cancel(first["receipt"]["id"])
    publish()
    assert _cashback(w, card) == Decimal("-47.50")
    # При балансе ≤ 0 кешбэком платить нельзя; новые начисления гасят минус
    rec = p.record(cid, p.service(1000))
    p.pay(rec["id"], [("bonus", 1), ("cash", 999)], expect=409)
    p.pay(rec["id"], [("cash", 1000)])
    publish()
    assert _cashback(w, card) == Decimal("2.50")


def test_ttl_burn_fifo(w: World) -> None:
    from sqlalchemy import update

    from app.models.master import AccountTransaction, LoyaltyCard
    from app.services import loyalty
    from workers import db
    from workers.tasks.loyalty import burn_expired_cashback

    _, card = _holder(w, w.strict)
    _give(w, card, 50)
    with db.master_session() as session:
        account = loyalty.cashback_account(session, uuid.UUID(card["id"]))
        session.execute(
            update(AccountTransaction)
            .where(AccountTransaction.account_id == account.id)
            .values(created_at=datetime.now(UTC) - timedelta(days=31))
        )
        session.commit()
    _give(w, card, 20)  # свежее начисление не сгорает
    _give(w, card, -10)  # списание гасит самое старое

    assert burn_expired_cashback() >= 1
    assert _cashback(w, card) == 20
    assert _history(w, card)[-1] == ("burn", Decimal(-40))
    with db.master_session() as session:
        c = session.get(LoyaltyCard, uuid.UUID(card["id"]))
        assert loyalty.burn_expired(session, c, now=datetime.now(UTC)) == 0  # повтор
        session.commit()


def test_expired_cashback_fifo_unit() -> None:
    from app.services.loyalty import expired_cashback

    now = datetime.now(UTC)
    old, fresh = now - timedelta(days=40), now - timedelta(days=1)
    border = now - timedelta(days=30)
    a, b, c, r = (uuid.uuid4() for _ in range(4))
    # 100 старых, 30 свежих, потрачено 60 → сгорает 40
    txns = [
        (a, Decimal(100), old, None),
        (b, Decimal(30), fresh, None),
        (c, Decimal(-60), fresh, None),
    ]
    assert expired_cashback(txns, Decimal(70), border) == 40
    # Сторно оплаты возвращает кешбэк с возрастом исходного: пара не участвует
    txns2 = [(a, Decimal(100), old, None), (c, Decimal(-60), fresh, None), (r, Decimal(60), now, c)]
    assert expired_cashback(txns2, Decimal(100), border) == 100
    # Не больше положительного баланса
    assert expired_cashback([(a, Decimal(100), old, None)], Decimal(-5), border) == 0
