"""Бонусные услуги: каждая N-я бесплатная, использование, откат, скидка без бонусной строки."""

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
    card_type: dict[str, Any]
    rule: dict[str, Any]
    haircut: dict[str, Any]  # услуга правила, 500 ₴
    kids: dict[str, Any]  # тоже услуга правила, 500 ₴
    styling: dict[str, Any]  # обычная услуга, 300 ₴
    admin_token: str


@pytest.fixture(scope="module")
def w(new_salon: Salon) -> World:
    s = new_salon
    place = setup_place(s.api, s.id, s.su)
    haircut, styling = place.service(500, "Стрижка"), place.service(300, "Укладка")
    kids = place.service(500, "Дитяча стрижка")
    card_type = s.api.post(
        "/loyalty/card-types",
        token=s.su,
        salon=s.id,
        expect=201,
        json={
            "name": "З бонусами",
            "salonIds": [s.id],
            "levels": [{"threshold": 0, "discountPercent": 10}],
        },
    )
    rule = s.api.post(
        f"/loyalty/card-types/{card_type['id']}/bonus-rules",
        token=s.su,
        salon=s.id,
        expect=201,
        json={
            "name": "Кожна 3-тя стрижка безкоштовно",
            "everyN": 3,
            "services": [
                {"salonId": s.id, "serviceId": haircut["id"]},
                {"salonId": s.id, "serviceId": kids["id"]},
            ],
        },
    )
    _, admin_token = s.create_staff(role="administrator")
    return World(s, place, card_type, rule, haircut, kids, styling, admin_token)


def _holder(w: World) -> tuple[str, dict[str, Any]]:
    cid = new_client(w.place)
    card = w.s.api.post(
        f"/clients/{cid}/loyalty-cards",
        token=w.s.su,
        salon=w.s.id,
        expect=201,
        json={"cardTypeId": w.card_type["id"]},
    )
    return cid, card


def _card(w: World, card: dict[str, Any]) -> dict[str, Any]:
    cards = w.s.api.get(f"/clients/{card['clientId']}/loyalty-cards", token=w.s.su, salon=w.s.id)
    return next(c for c in cards if c["id"] == card["id"])


def _progress(w: World, card: dict[str, Any]) -> tuple[int, int, int, int]:
    p = next(x for x in _card(w, card)["bonusProgress"] if x["ruleId"] == w.rule["id"])
    return p["progress"], p["available"], p["accruedTotal"], p["usedTotal"]


def _paid_haircut(w: World, cid: str) -> dict[str, Any]:
    p = w.place
    rec = p.record(cid, w.haircut)
    paid = p.pay(rec["id"], [("cash", 450)])  # 500 − 10 %
    publish()
    return paid


def _line(preview: dict[str, Any], name: str) -> dict[str, Any]:
    return next(line for line in preview["lines"] if line["name"] == name)


def test_every_nth_service_is_free(w: World, eager: None) -> None:
    p, api, s = w.place, w.s.api, w.s
    cid, card = _holder(w)
    _paid_haircut(w, cid)
    assert _progress(w, card) == (1, 0, 0, 0)
    _paid_haircut(w, cid)
    assert _progress(w, card) == (0, 1, 1, 0)  # N−1 = 2 визита → бонус
    tiles = _card(w, card)
    assert tiles["bonusAccrued"] == 1 and tiles["bonusAvailable"] == 1

    rec = p.record(cid, w.haircut, w.styling)
    preview = api.get(f"/records/{rec['id']}/checkout", token=s.su, salon=s.id)
    haircut_line = _line(preview, "Стрижка")
    assert haircut_line["bonusAvailable"] and haircut_line["bonusRuleName"].startswith("Кожна")
    assert not _line(preview, "Укладка")["bonusAvailable"]
    assert money(preview["total"]) == 720  # 800 − 10 %

    bonus_id = haircut_line["recordServiceId"]
    chosen = api.get(
        f"/records/{rec['id']}/checkout?bonusRecordServiceIds={bonus_id}", token=s.su, salon=s.id
    )
    # Бонусная строка — 0 ₴ и в скидке не участвует: 10 % только от укладки
    assert money(chosen["bonusAmount"]) == 500 and money(chosen["discountAmount"]) == 30
    assert money(chosen["total"]) == 270 and money(chosen["sold"]) == 800

    paid = p.pay(
        rec["id"],
        [("cash", 270)],
        extra={"bonusRecordServiceIds": [bonus_id], "expectedTotal": 270},
    )
    assert money(paid["record"]["totalAmount"]) == 270
    assert _progress(w, card) == (0, 0, 1, 1)  # списано синхронно, до воркера
    publish()
    assert _progress(w, card) == (0, 0, 1, 1)  # бонусная стрижка в прогресс не идёт
    assert money(_card(w, card)["soldTotal"]) == 1800


def test_bonus_checks(w: World) -> None:
    p, api, s = w.place, w.s.api, w.s
    cid, _ = _holder(w)
    rec = p.record(cid, w.haircut)
    bonus_id = api.get(f"/records/{rec['id']}/checkout", token=s.su, salon=s.id)["lines"][0][
        "recordServiceId"
    ]
    # Бонуса нет — 409 и в предпросмотре, и при оплате
    api.get(
        f"/records/{rec['id']}/checkout?bonusRecordServiceIds={bonus_id}",
        token=s.su,
        salon=s.id,
        expect=409,
    )
    p.pay(rec["id"], [], extra={"bonusRecordServiceIds": [bonus_id]}, expect=409)
    # Чужая строка — ошибка; без карты — ошибка
    p.pay(
        rec["id"], [("cash", 450)], extra={"bonusRecordServiceIds": [str(uuid.uuid4())]}, expect=409
    )
    plain = new_client(p)
    rec2 = p.record(plain, w.haircut)
    line_id = api.get(f"/records/{rec2['id']}/checkout", token=s.su, salon=s.id)["lines"][0][
        "recordServiceId"
    ]
    p.pay(rec2["id"], [], extra={"bonusRecordServiceIds": [line_id]}, expect=409)


def test_two_lines_need_two_bonuses(w: World, eager: None) -> None:
    p = w.place
    cid, card = _holder(w)
    _paid_haircut(w, cid)
    _paid_haircut(w, cid)
    rec = p.record(cid, w.haircut, w.kids)
    ids = [
        line["recordServiceId"]
        for line in w.s.api.get(f"/records/{rec['id']}/checkout", token=w.s.su, salon=w.s.id)[
            "lines"
        ]
    ]
    p.pay(rec["id"], [], extra={"bonusRecordServiceIds": ids}, expect=409)
    assert _progress(w, card)[1] == 1


def test_cancel_rolls_back_use_and_accrual(w: World, eager: None) -> None:
    p, api, s = w.place, w.s.api, w.s
    cid, card = _holder(w)
    _paid_haircut(w, cid)
    second = _paid_haircut(w, cid)
    assert _progress(w, card) == (0, 1, 1, 0)

    # Отмена чека, который дал бонус (бонус не использован) — бонус снимается
    p.cancel(second["receipt"]["id"])
    publish()
    assert _progress(w, card) == (1, 0, 0, 0)

    second = _paid_haircut(w, cid)
    rec = p.record(cid, w.haircut)
    bonus_id = api.get(f"/records/{rec['id']}/checkout", token=s.su, salon=s.id)["lines"][0][
        "recordServiceId"
    ]
    free = p.pay(rec["id"], [], extra={"bonusRecordServiceIds": [bonus_id]})
    publish()
    assert _progress(w, card) == (0, 0, 1, 1)

    # Отмена бесплатного визита — бонус возвращается в available
    p.cancel(free["receipt"]["id"])
    publish()
    assert _progress(w, card) == (0, 1, 1, 0)
    again = api.get(f"/records/{rec['id']}", token=s.su, salon=s.id)
    assert again["paymentStatus"] == "unpaid"

    # Бонус использовали снова, потом отменили чек, который его дал — прогресс в минус
    p.pay(rec["id"], [], extra={"bonusRecordServiceIds": [bonus_id]})
    publish()
    p.cancel(second["receipt"]["id"])
    publish()
    assert _progress(w, card) == (-1, 0, 1, 1)
    _paid_haircut(w, cid)  # следующий визит гасит минус
    assert _progress(w, card) == (0, 0, 1, 1)


def test_shard_failure_returns_bonus(
    w: World, eager: None, monkeypatch: pytest.MonkeyPatch
) -> None:
    from app.services import visits

    p, api, s = w.place, w.s.api, w.s
    cid, card = _holder(w)
    _paid_haircut(w, cid)
    _paid_haircut(w, cid)
    rec = p.record(cid, w.haircut)
    bonus_id = api.get(f"/records/{rec['id']}/checkout", token=s.su, salon=s.id)["lines"][0][
        "recordServiceId"
    ]

    def boom(*args: Any, **kwargs: Any) -> None:
        raise RuntimeError("shard down")

    monkeypatch.setattr(visits, "write_receipt_audit", boom)
    p.pay(rec["id"], [], extra={"bonusRecordServiceIds": [bonus_id]}, expect=500)
    monkeypatch.undo()
    assert _progress(w, card) == (0, 1, 1, 0)


def test_rule_settings(w: World) -> None:
    api, s = w.s.api, w.s
    base = f"/loyalty/card-types/{w.card_type['id']}/bonus-rules"
    body = {"name": "Х", "everyN": 4, "services": [{"salonId": s.id, "serviceId": w.styling["id"]}]}
    api.post(base, token=w.admin_token, salon=s.id, expect=403, json=body)
    api.post(base, token=s.su, salon=s.id, expect=422, json={**body, "everyN": 1})
    api.post(
        base,
        token=s.su,
        salon=s.id,
        expect=422,
        json={**body, "services": [{"salonId": s.id, "serviceId": str(uuid.uuid4())}]},
    )
    main_id = api.salon_id(s.su, "main")
    api.post(
        base,
        token=s.su,
        salon=s.id,
        expect=422,
        json={**body, "services": [{"salonId": main_id, "serviceId": w.styling["id"]}]},
    )
    rule = api.post(base, token=s.su, salon=s.id, expect=201, json=body)
    assert [r["id"] for r in api.get(base, token=w.admin_token, salon=s.id)][-1] == rule["id"]
    patched = api.patch(f"{base}/{rule['id']}", token=s.su, salon=s.id, json={"everyN": 5})
    assert patched["everyN"] == 5
    api.delete(f"{base}/{rule['id']}", token=s.su, salon=s.id, expect=204)
    # Правило с накоплениями не удаляется
    api.delete(f"{base}/{w.rule['id']}", token=s.su, salon=s.id, expect=409)


def test_reconciliation_returns_hanging_bonus(w: World, eager: None) -> None:
    from datetime import UTC, datetime, timedelta

    from sqlalchemy import update

    from app.models.master import LoyaltyBonusOperation
    from app.services import loyalty
    from workers import db
    from workers.tasks import integrity

    cid, card = _holder(w)
    _paid_haircut(w, cid)
    _paid_haircut(w, cid)
    rec = w.place.record(cid, w.haircut)
    line_id = uuid.UUID(
        w.s.api.get(f"/records/{rec['id']}/checkout", token=w.s.su, salon=w.s.id)["lines"][0][
            "recordServiceId"
        ]
    )
    salon_id, receipt_id = uuid.UUID(w.s.id), uuid.uuid4()
    with db.master_session() as session:
        loyalty.use_bonuses(
            session,
            card_id=uuid.UUID(card["id"]),
            salon_id=salon_id,
            receipt_id=receipt_id,
            record_id=uuid.UUID(rec["id"]),
            lines=[
                loyalty.BonusLine(record_service_id=line_id, service_id=uuid.UUID(w.haircut["id"]))
            ],
        )
        session.execute(
            update(LoyaltyBonusOperation)
            .where(LoyaltyBonusOperation.receipt_id == receipt_id)
            .values(created_at=datetime.now(UTC) - timedelta(hours=2))
        )
        session.commit()
    assert _progress(w, card)[1] == 0
    assert integrity.reconcile_payments(salon_id) == 1
    assert _progress(w, card)[1] == 1
