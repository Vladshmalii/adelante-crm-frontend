"""Абонементы (backend/docs/subscriptions.md): типы (раздел 4) и продажа (раздел 5)."""

import uuid
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from decimal import Decimal
from typing import Any

import pytest
from sqlalchemy import create_engine, select, text, update

from tests.conftest import Salon
from tests.loyalty_world import Place, eager, money, new_client, publish, setup_place

__all__ = ["eager"]

TYPES = "/subscriptions/types"


@dataclass
class World:
    s: Salon
    place: Place
    solarium: dict[str, Any]  # 3 хв, 50 ₴
    massage: dict[str, Any]  # 30 хв, 400 ₴
    adm: str


@pytest.fixture(scope="module")
def w(new_salon: Salon) -> World:
    s = new_salon
    place = setup_place(s.api, s.id, s.su)
    solarium = s.api.post(
        "/services",
        token=s.su,
        salon=s.id,
        expect=201,
        json={"name": "Солярій 3 хв", "price": 50, "durationMinutes": 3},
    )
    massage = place.service(400, "Масаж")
    _, adm = s.create_staff(role="administrator")
    return World(s, place, solarium, massage, adm)


def _pair(w: World, service: dict[str, Any], units: int | None = None) -> dict[str, Any]:
    return {"salonId": w.s.id, "serviceId": service["id"], "units": units}


def _type(w: World, *, expect: int = 201, token: str | None = None, **fields: Any) -> Any:
    body = {
        "name": f"Абонемент {uuid.uuid4().hex[:4]}",
        "price": 1000,
        "totalUnits": 10,
        "durationValue": 1,
        "durationUnit": "month",
        "services": [_pair(w, w.massage)],
        **fields,
    }
    return w.s.api.post(TYPES, token=token or w.s.su, salon=w.s.id, expect=expect, json=body)


# --- Типы ------------------------------------------------------------------------------


def test_types_superuser_only(w: World) -> None:
    api, s = w.s.api, w.s
    _type(w, token=w.adm, expect=403)
    created = _type(w)
    assert created["unitKind"] == "visits" and created["balanceMode"] == "shared"
    assert created["activationMode"] == "on_sale" and created["issuedCount"] == 0
    assert created["services"] == [_pair(w, w.massage)]
    # Администратор видит типы — он продаёт абонементы
    assert created["id"] in [t["id"] for t in api.get(TYPES, token=w.adm, salon=s.id)]
    assert api.get(f"{TYPES}/{created['id']}", token=w.adm, salon=s.id)["id"] == created["id"]
    api.get(f"{TYPES}/{uuid.uuid4()}", token=w.adm, salon=s.id, expect=404)
    api.patch(
        f"{TYPES}/{created['id']}", token=w.adm, salon=s.id, expect=403, json={"isActive": False}
    )


def test_type_validation(w: World) -> None:
    s = w.s
    main_id = s.api.salon_id(s.su, "main")
    _type(w, expect=422, price=0)
    _type(w, expect=422, unitKind="hours")
    _type(w, expect=422, durationValue=-1)
    _type(w, expect=422, durationUnit="month", durationValue=121)
    _type(w, expect=422, services=[])
    # shared: totalUnits обязателен, у услуг units нет
    _type(w, expect=422, totalUnits=None)
    _type(w, expect=422, totalUnits=0)
    _type(w, expect=422, services=[_pair(w, w.massage, 5)])
    # separate: units у каждой услуги, totalUnits нет
    _type(w, expect=422, balanceMode="separate", totalUnits=None, services=[_pair(w, w.massage)])
    _type(
        w,
        expect=422,
        balanceMode="separate",
        totalUnits=10,
        services=[_pair(w, w.massage, 5)],
    )
    # Пары уникальны, салоны из сети, услуги существуют в шарде салона
    _type(w, expect=422, services=[_pair(w, w.massage), _pair(w, w.massage)])
    _type(w, expect=422, services=[{"salonId": main_id, "serviceId": w.massage["id"]}])
    _type(w, expect=422, services=[{"salonId": str(uuid.uuid4()), "serviceId": w.massage["id"]}])
    _type(w, expect=422, services=[{"salonId": s.id, "serviceId": str(uuid.uuid4())}])
    # Автоактивация — только при first_visit; лимит заморозки — только при заморозке
    _type(w, expect=422, autoActivateDays=7)
    _type(w, expect=422, freezeMaxDays=14)

    minutes = _type(
        w,
        unitKind="minutes",
        totalUnits=15,
        durationValue=0,
        activationMode="first_visit",
        autoActivateDays=7,
        freezeAllowed=True,
        freezeMaxDays=14,
        services=[_pair(w, w.solarium)],
    )
    assert minutes["unitKind"] == "minutes" and minutes["totalUnits"] == 15
    assert minutes["durationValue"] == 0  # бессрочный
    assert minutes["autoActivateDays"] == 7 and minutes["freezeMaxDays"] == 14
    separate = _type(
        w,
        balanceMode="separate",
        totalUnits=None,
        services=[_pair(w, w.massage, 5), _pair(w, w.solarium, 3)],
    )
    assert separate["totalUnits"] is None
    assert {x["units"] for x in separate["services"]} == {5, 3}


def test_type_patch(w: World) -> None:
    api, s = w.s.api, w.s
    t = _type(w, activationMode="first_visit", autoActivateDays=3, freezeAllowed=True)
    url = f"{TYPES}/{t['id']}"
    api.patch(url, token=s.su, salon=s.id, expect=422, json={"name": None})
    # На separate: totalUnits уходит сам, но units у услуг нужны
    api.patch(url, token=s.su, salon=s.id, expect=422, json={"balanceMode": "separate"})
    t = api.patch(
        url,
        token=s.su,
        salon=s.id,
        json={"balanceMode": "separate", "services": [_pair(w, w.massage, 4)]},
    )
    assert t["totalUnits"] is None and t["services"] == [_pair(w, w.massage, 4)]
    # Обратно на shared: units у услуг уходят сами, totalUnits обязателен
    api.patch(url, token=s.su, salon=s.id, expect=422, json={"balanceMode": "shared"})
    t = api.patch(url, token=s.su, salon=s.id, json={"balanceMode": "shared", "totalUnits": 8})
    assert t["totalUnits"] == 8 and t["services"] == [_pair(w, w.massage)]
    # Активация при продаже снимает автоактивацию; явная — ошибка
    api.patch(
        url,
        token=s.su,
        salon=s.id,
        expect=422,
        json={"activationMode": "on_sale", "autoActivateDays": 2},
    )
    t = api.patch(url, token=s.su, salon=s.id, json={"activationMode": "on_sale"})
    assert t["autoActivateDays"] is None
    # Архив: не в списке продаваемых
    t = api.patch(url, token=s.su, salon=s.id, json={"isActive": False})
    assert t["isActive"] is False
    active = api.get(TYPES, token=w.adm, salon=s.id, params={"active": "true"})
    assert t["id"] not in [x["id"] for x in active]
    archived = api.get(TYPES, token=w.adm, salon=s.id, params={"active": "false"})
    assert t["id"] in [x["id"] for x in archived]

    audit = api.get(
        "/audit", token=s.su, salon=s.id, params={"entity": "subscription", "perPage": 100}
    )
    mine = [a for a in audit if a["entityId"] == t["id"]]
    assert {a["action"] for a in mine} == {"created", "updated"}
    assert any("services" in (a["details"] or {}) for a in mine if a["action"] == "updated")


# --- Продажа (раздел 5) -------------------------------------------------------------


def _client(w: World, *, card: bool = False) -> str:
    """Клиент; card — с картой: уровень с 0 ₴ даёт 10 %, кешбэк 5 %."""
    s = w.s
    cid = new_client(w.place)
    if card:
        card_type = s.api.post(
            "/loyalty/card-types",
            token=s.su,
            salon=s.id,
            expect=201,
            json={
                "name": f"Тип {uuid.uuid4().hex[:4]}",
                "salonIds": [s.id],
                "cashbackPercent": 5,
                "levels": [{"threshold": 0, "discountPercent": 10}],
            },
        )
        s.api.post(
            f"/clients/{cid}/loyalty-cards",
            token=s.su,
            salon=s.id,
            expect=201,
            json={"cardTypeId": card_type["id"]},
        )
    return cid


def _sell(
    w: World,
    client_id: str | None,
    types: list[dict[str, Any]],
    parts: list[tuple[str, float]],
    *,
    expect: int = 201,
    key: str | None = None,
    **extra: Any,
) -> Any:
    body: dict[str, Any] = {
        "payments": [{"paymentMethodId": w.place.methods[t]["id"], "amount": a} for t, a in parts],
        "subscriptions": [{"typeId": t["id"]} for t in types],
        **extra,
    }
    if client_id:
        body["clientId"] = client_id
    return w.s.api.post(
        "/finances/receipts",
        token=w.adm,
        salon=w.s.id,
        expect=expect,
        json=body,
        headers={"Idempotency-Key": key} if key else {},
    )


def _master(receipt_id: str) -> list[dict[str, Any]]:
    """Абонементы чека в Master (корзины и журнал) — по позициям продажи."""
    import cli
    from app.models.master import Subscription
    from app.services import subscriptions

    with cli._master_session() as session:
        found = list(
            session.scalars(
                select(Subscription).where(Subscription.sold_receipt_id == uuid.UUID(receipt_id))
            )
        )
        result = []
        for sub in sorted(found, key=lambda x: x.issue_key):
            ops = sorted(subscriptions.operations(session, sub.id), key=lambda o: o.created_at)
            result.append(
                {
                    "sub": sub,
                    "balances": sorted(
                        ((b.units, b.balance) for b in sub.balances), key=lambda x: x[0]
                    ),
                    "ops": [(o.type.value, o.delta, o.balance_after) for o in ops],
                }
            )
        session.expunge_all()
        return result


def _incomes(w: World, receipt_id: str) -> list[tuple[str, Decimal]]:
    import cli
    from app.models.master import Salon as SalonModel

    with cli._master_session() as session:
        dsn = cli._conn_info(session.get(SalonModel, w.s.id)).build_dsn(driver="psycopg")
    engine = create_engine(dsn)
    try:
        with engine.connect() as conn:
            rows = conn.execute(
                text(
                    "SELECT category, amount FROM finance_operations "
                    "WHERE receipt_id = :id AND type = 'income' AND status = 'completed' "
                    "ORDER BY category, amount"
                ),
                {"id": receipt_id},
            ).all()
    finally:
        engine.dispose()
    return [(r.category, r.amount) for r in rows]


def test_sale_needs_client_and_active_type(w: World) -> None:
    t = _type(w)
    _sell(w, None, [t], [("cash", 1000)], expect=422)
    w.s.api.get(
        "/finances/receipts/checkout",
        token=w.adm,
        salon=w.s.id,
        expect=422,
        params={"subscriptionTypeIds": [t["id"]]},
    )
    w.s.api.patch(f"{TYPES}/{t['id']}", token=w.s.su, salon=w.s.id, json={"isActive": False})
    cid = _client(w)
    _sell(w, cid, [t], [("cash", 1000)], expect=422)  # архив не продаётся
    rec = w.place.record(cid, w.massage)
    w.place.pay(
        rec["id"],
        [("cash", 1400)],
        token=w.adm,
        expect=422,
        extra={"subscriptions": [{"typeId": t["id"]}]},
    )


def test_visit_sale_discount_and_cashback(w: World, eager: None) -> None:
    """Строка-абонемент в скидке и кешбэке; unit_value — от суммы после скидки."""
    p, s = w.place, w.s
    cid = _client(w, card=True)
    t = _type(w, price=1000, totalUnits=10)
    rec = p.record(cid, w.massage)
    preview = s.api.get(
        f"/records/{rec['id']}/checkout",
        token=w.adm,
        salon=s.id,
        params={"subscriptionTypeIds": [t["id"]]},
    )
    assert money(preview["sold"]) == 1400
    assert money(preview["discountAmount"]) == 140  # 10 % и от абонемента
    assert money(preview["total"]) == 1260
    line = next(x for x in preview["lines"] if x["kind"] == "subscription")
    assert line["subscriptionTypeId"] == t["id"] and money(line["price"]) == 1000

    paid = p.pay(
        rec["id"],
        [("cash", 1260)],
        token=w.adm,
        extra={"subscriptions": [{"typeId": t["id"]}], "expectedTotal": "1260"},
    )
    receipt_id = paid["receipt"]["id"]
    [sold] = _master(receipt_id)
    sub = sold["sub"]
    assert sub.client_id == uuid.UUID(cid) and sub.status.value == "active"
    assert sub.paid_amount == Decimal("900.00") and sub.unit_value == Decimal("90.0000")
    assert sub.activated_at == sub.sold_at and sub.expires_at is not None
    assert sold["balances"] == [(10, 10)]
    assert sold["ops"] == [("issue", 10, 10)]
    # Выручка: абонемент — «subscriptions», услуга — «services»
    assert _incomes(w, receipt_id) == [
        ("services", Decimal(360)),
        ("subscriptions", Decimal(900)),
    ]
    receipt = next(
        r for r in s.api.get("/finances/receipts", token=s.su, salon=s.id) if r["id"] == receipt_id
    )
    [rline] = receipt["subscriptions"]
    assert rline["subscriptionId"] == str(sub.id)
    assert money(rline["amount"]) == 1000 and money(rline["paidAmount"]) == 900
    # Сумма записи — только услуги
    record = s.api.get(f"/records/{rec['id']}", token=s.su, salon=s.id)
    assert money(record["totalAmount"]) == 360

    # Кешбэк 5 % и от строки-абонемента: (360 + 900) × 5 %
    publish()
    [card] = s.api.get(f"/clients/{cid}/loyalty-cards", token=s.su, salon=s.id)
    assert money(card["cashbackBalance"]) == 63
    assert money(card["soldTotal"]) == 1400


def test_sale_modes_and_any_payment(w: World) -> None:
    """first_visit — pending с автоактивацией; separate — корзины по услугам; оплата со счёта."""
    s = w.s
    cid = _client(w)
    s.api.post(
        f"/clients/{cid}/account/topups", token=s.su, salon=s.id, expect=201, json={"amount": 500}
    )
    pending = _type(
        w,
        price=300,
        unitKind="minutes",
        totalUnits=15,
        durationValue=30,
        durationUnit="day",
        activationMode="first_visit",
        autoActivateDays=7,
        services=[_pair(w, w.solarium)],
    )
    separate = _type(
        w,
        price=700,
        balanceMode="separate",
        totalUnits=None,
        durationValue=0,
        services=[_pair(w, w.massage, 4), _pair(w, w.solarium, 6)],
    )
    receipt = _sell(w, cid, [pending, separate], [("account", 500), ("cash", 500)])
    first, second = _master(receipt["id"])
    sub = first["sub"]
    assert sub.status.value == "pending" and sub.activated_at is None and sub.expires_at is None
    assert sub.auto_activate_at - sub.sold_at == timedelta(days=7)
    assert sub.unit_value == Decimal("20.0000")  # 300 / 15 хв
    assert first["balances"] == [(15, 15)]
    sub2 = second["sub"]
    assert sub2.status.value == "active" and sub2.expires_at is None  # бессрочный
    assert sub2.unit_value == Decimal("70.0000")  # 700 / (4 + 6)
    assert second["balances"] == [(4, 4), (6, 6)]
    assert sorted(second["ops"]) == [("issue", 4, 4), ("issue", 6, 6)]
    # Часть со счёта тоже выручка абонементов: income делится по порядку частей
    assert _incomes(w, receipt["id"]) == [
        ("subscriptions", Decimal(500)),
        ("subscriptions", Decimal(500)),
    ]


def test_certificate_services_scope_does_not_cover_subscription(w: World) -> None:
    s = w.s
    cid = _client(w)
    template = s.api.post(
        "/certificates/templates",
        token=s.su,
        salon=s.id,
        expect=201,
        json={
            "name": f"На масаж {uuid.uuid4().hex[:4]}",
            "amount": 1000,
            "scope": "services",
            "services": [{"salonId": s.id, "serviceId": w.massage["id"]}],
        },
    )
    bought = _sell(
        w, None, [], [("cash", 1000)], subtotal=0, certificates=[{"templateId": template["id"]}]
    )
    [cert] = s.api.get(f"/receipts/{bought['id']}/certificates", token=s.su, salon=s.id)
    methods = s.api.get("/payment-methods", token=s.su, salon=s.id)
    cert_method = next(m["id"] for m in methods if m["type"] == "certificate")
    t = _type(w, price=500)
    s.api.post(
        "/finances/receipts",
        token=w.adm,
        salon=s.id,
        expect=422,
        json={
            "clientId": cid,
            "subscriptions": [{"typeId": t["id"]}],
            "payments": [
                {"paymentMethodId": cert_method, "amount": 500, "certificateCode": cert["code"]}
            ],
        },
    )


def test_issue_is_idempotent(w: World) -> None:
    import cli
    from app.services import ledger, subscriptions

    cid = _client(w)
    t = _type(w, price=400)
    key = f"subs-{uuid.uuid4()}"
    first = _sell(w, cid, [t], [("cash", 400)], key=key)
    again = _sell(w, cid, [t], [("cash", 400)], key=key)
    assert first["id"] == again["id"]
    [sold] = _master(first["id"])

    # Повтор выпуска в Master с тем же ключом (сбой между Master и шардом) — тот же абонемент
    sale = [subscriptions.SubscriptionSale(type_id=t["id"])]
    with cli._master_session() as session:
        issues = subscriptions.plan_issues(subscriptions.load_types(session, sale), sale)
        repeated = subscriptions.issue(
            session,
            salon_id=uuid.UUID(w.s.id),
            receipt_id=uuid.UUID(first["id"]),
            client_id=uuid.UUID(cid),
            issues=[i.paid(Decimal(400)) for i in issues],
            meta=ledger.Meta(),
        )
        session.commit()
    assert [r.subscription_id for r in repeated] == [sold["sub"].id]
    assert len(_master(first["id"])) == 1


def test_shard_failure_cancels_issue(w: World, monkeypatch: pytest.MonkeyPatch) -> None:
    from app.services import payments, visits

    cid = _client(w)
    t = _type(w, price=600, totalUnits=6)
    key = f"subs-{uuid.uuid4()}"

    def boom(*args: Any, **kwargs: Any) -> None:
        raise RuntimeError("shard down")

    monkeypatch.setattr(visits, "write_receipt_audit", boom)
    _sell(w, cid, [t], [("cash", 600)], key=key, expect=500)
    monkeypatch.undo()

    receipt_id = payments.receipt_id_for(uuid.UUID(w.s.id), key)
    [sold] = _master(str(receipt_id))
    assert sold["sub"].status.value == "cancelled"
    assert sold["sub"].cancel_reason == "Сторно: чек не записано"
    assert sold["ops"] == [("issue", 6, 6), ("cancel", -6, 0)]
    # Повтор с тем же ключом — отказ; с новым — продажа проходит
    _sell(w, cid, [t], [("cash", 600)], key=key, expect=422)
    receipt = _sell(w, cid, [t], [("cash", 600)])
    assert [x["sub"].status.value for x in _master(receipt["id"])] == ["active"]


def test_reconciliation_cancels_orphan(w: World) -> None:
    """Процесс упал между Master и шардом: сверка отменяет абонементы, чьего чека нет."""
    from app.models.master import Subscription
    from app.services import ledger, subscriptions
    from workers import db
    from workers.tasks import integrity

    cid = _client(w)
    t = _type(w, price=100, totalUnits=2)
    salon_id = uuid.UUID(w.s.id)
    old_receipt, fresh_receipt = uuid.uuid4(), uuid.uuid4()
    sale = [subscriptions.SubscriptionSale(type_id=t["id"])]
    with db.master_session() as session:
        issues = subscriptions.plan_issues(subscriptions.load_types(session, sale), sale)
        for receipt_id in (old_receipt, fresh_receipt):
            subscriptions.issue(
                session,
                salon_id=salon_id,
                receipt_id=receipt_id,
                client_id=uuid.UUID(cid),
                issues=[i.paid(Decimal(100)) for i in issues],
                meta=ledger.Meta(salon_id=salon_id, receipt_id=receipt_id),
            )
        session.execute(
            update(Subscription)
            .where(Subscription.sold_receipt_id == old_receipt)
            .values(created_at=datetime.now(UTC) - timedelta(hours=2))
        )
        session.commit()

    assert integrity.reconcile_payments(salon_id) == 1
    assert integrity.reconcile_payments(salon_id) == 0
    [old] = _master(str(old_receipt))
    [fresh] = _master(str(fresh_receipt))
    assert old["sub"].status.value == "cancelled"
    assert old["ops"] == [("issue", 2, 2), ("cancel", -2, 0)]
    assert fresh["sub"].status.value == "active"


def _use(subscription_id: uuid.UUID, units: int = 1) -> uuid.UUID:
    """Списание (часть 2 ещё не сделана) — прямой записью в журнал под блокировкой."""
    import cli
    from app.models.master import SubscriptionOperationType
    from app.services import ledger, subscriptions

    with cli._master_session() as session:
        sub = subscriptions.lock(session, subscription_id)
        op = subscriptions.post(
            session,
            sub.balances[0],
            type=SubscriptionOperationType.USE,
            delta=-units,
            key=f"test-use:{uuid.uuid4()}",
            meta=ledger.Meta(),
        )
        session.commit()
        return op.id


def test_cancel_purchase_receipt(w: World, eager: None) -> None:
    """Отмена чека покупки: без использований — cancelled; после — 409, после сторно — можно."""
    import cli
    from app.models.master import SubscriptionOperation
    from app.services import ledger, subscriptions

    p, s = w.place, w.s
    cid = _client(w)
    t = _type(w, price=500, totalUnits=5)
    receipt = _sell(w, cid, [t], [("cash", 500)])
    p.cancel(receipt["id"])
    publish()
    [sold] = _master(receipt["id"])
    assert sold["sub"].status.value == "cancelled"
    assert sold["ops"] == [("issue", 5, 5), ("cancel", -5, 0)]
    assert _incomes(w, receipt["id"]) == []
    listed = {x["id"]: x for x in s.api.get(TYPES, token=s.su, salon=s.id)}
    assert listed[t["id"]]["issuedCount"] == 0  # отменённые не считаются

    used = _sell(w, cid, [t], [("cash", 500)])
    [sold] = _master(used["id"])
    use_id = _use(sold["sub"].id)
    s.api.post(f"/finances/receipts/{used['id']}/cancel", token=s.su, salon=s.id, expect=409)
    [sold] = _master(used["id"])
    assert sold["sub"].status.value == "active"
    # Использование сторнировано — отменять можно
    with cli._master_session() as session:
        subscriptions.lock(session, sold["sub"].id)
        op = session.get(SubscriptionOperation, use_id)
        assert op is not None
        subscriptions.reverse(session, op, meta=ledger.Meta())
        session.commit()
    p.cancel(used["id"])
    publish()
    [sold] = _master(used["id"])
    assert sold["sub"].status.value == "cancelled"
    assert sold["ops"][-1] == ("cancel", -5, 0)


def test_journal_never_goes_negative(w: World) -> None:
    """Корзина не уходит в минус; повтор ключа не меняет остаток."""
    import cli
    from app.models.master import SubscriptionOperationType
    from app.services import ledger, subscriptions

    cid = _client(w)
    t = _type(w, price=100, totalUnits=2)
    [sold] = _master(_sell(w, cid, [t], [("cash", 100)])["id"])
    with cli._master_session() as session:
        sub = subscriptions.lock(session, sold["sub"].id)
        basket = sub.balances[0]
        for _ in range(2):
            subscriptions.post(
                session,
                basket,
                type=SubscriptionOperationType.USE,
                delta=-1,
                key=f"same-key-{sub.id}",
                meta=ledger.Meta(),
            )
        assert basket.balance == 1
        with pytest.raises(ledger.LedgerError):
            subscriptions.post(
                session,
                basket,
                type=SubscriptionOperationType.USE,
                delta=-2,
                key=f"other-key-{sub.id}",
                meta=ledger.Meta(),
            )
        session.rollback()
