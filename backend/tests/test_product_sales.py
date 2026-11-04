"""Продажа товаров со склада в чеке (backend/docs/product-sales.md, раздел 7)."""

import threading
import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Any
from urllib.parse import quote
from zoneinfo import ZoneInfo

import pytest
from sqlalchemy import create_engine, text

from app.models.shard import DiscountSource
from app.services import checkout
from tests.conftest import Salon
from tests.loyalty_world import Place, eager, money, new_client, publish, setup_place

__all__ = ["eager"]

TZ = ZoneInfo("Europe/Kyiv")


@dataclass
class World:
    s: Salon
    place: Place
    service: dict[str, Any]  # 100 ₴
    adm: str
    mst: str
    period: str


@pytest.fixture(scope="module")
def w(new_salon: Salon) -> World:
    s = new_salon
    place = setup_place(s.api, s.id, s.su)
    service = place.service(100, "Стрижка")
    _, adm = s.create_staff(role="administrator")
    _, mst = s.create_staff()
    now = datetime.now(TZ)
    start, end = now - timedelta(days=2), now + timedelta(days=2)
    period = f"dateFrom={quote(start.isoformat())}&dateTo={quote(end.isoformat())}"
    return World(s, place, service, adm, mst, period)


def _product(w: World, **fields: Any) -> dict[str, Any]:
    """Карточка из примера спецификации: ml, бутылка 1000, 350 ₴, разлив 0,5 ₴/мл, 2 бутылки."""
    body = {
        "name": f"Шампунь {uuid.uuid4().hex[:6]}",
        "sku": f"SKU-{uuid.uuid4().hex[:8]}",
        "unit": "ml",
        "packageVolume": 1000,
        "packagePrice": 350,
        "salePrice": 0.5,
        "quantity": 2000,
        **fields,
    }
    return w.s.api.post("/inventory/products", token=w.adm, salon=w.s.id, expect=201, json=body)


def _stock(w: World, product: dict[str, Any]) -> Decimal:
    got = w.s.api.get(f"/inventory/products/{product['id']}", token=w.adm, salon=w.s.id)
    return money(got["quantity"])


def _bottle(product: dict[str, Any], quantity: float = 1) -> dict[str, Any]:
    return {"productId": product["id"], "mode": "package", "quantity": quantity}


def _pour(product: dict[str, Any], quantity: float) -> dict[str, Any]:
    return {"productId": product["id"], "mode": "volume", "quantity": quantity}


def _param(item: dict[str, Any]) -> str:
    return f"{item['productId']}:{item['mode']}:{item['quantity']}"


def _visit(w: World, client_id: str | None = None) -> tuple[str, dict[str, Any]]:
    cid = client_id or new_client(w.place)
    return cid, w.place.record(cid, w.service)


def _preview(w: World, record_id: str, *items: dict[str, Any], expect: int = 200) -> Any:
    query = "&".join(f"products={_param(i)}" for i in items)
    return w.s.api.get(
        f"/records/{record_id}/checkout?{query}", token=w.adm, salon=w.s.id, expect=expect
    )


def _pay(
    w: World,
    record_id: str,
    parts: list[tuple[str, float]],
    *items: dict[str, Any],
    **kw: Any,
) -> Any:
    extra = kw.pop("extra", {})
    return w.place.pay(
        record_id, parts, token=w.adm, extra={"products": list(items), **extra}, **kw
    )


def _sell(
    w: World,
    parts: list[tuple[str, float]],
    *items: dict[str, Any],
    expect: int = 201,
    headers: dict[str, str] | None = None,
    **body: Any,
) -> Any:
    return w.s.api.post(
        "/finances/receipts",
        token=w.adm,
        salon=w.s.id,
        expect=expect,
        headers=headers or {},
        json={
            "payments": [
                {"paymentMethodId": w.place.methods[t]["id"], "amount": a} for t, a in parts
            ],
            "products": list(items),
            **body,
        },
    )


def _receipt(w: World, receipt_id: str) -> dict[str, Any]:
    receipts = w.s.api.get("/finances/receipts?perPage=200", token=w.s.su, salon=w.s.id)
    return next(r for r in receipts if r["id"] == receipt_id)


def _movements(w: World, product: dict[str, Any]) -> list[dict[str, Any]]:
    return w.s.api.get(f"/inventory/products/{product['id']}/movements", token=w.adm, salon=w.s.id)


def _shard_rows(w: World, sql: str, **params: Any) -> list[Any]:
    import cli
    from app.models.master import Salon as SalonModel

    with cli._master_session() as session:
        info = cli._conn_info(session.get(SalonModel, w.s.id))
    engine = create_engine(info.build_dsn(driver="psycopg"))
    try:
        with engine.connect() as conn:
            return list(conn.execute(text(sql), params).all())
    finally:
        engine.dispose()


def _incomes(w: World, receipt_id: str) -> dict[str, Decimal]:
    rows = _shard_rows(
        w,
        "SELECT category, sum(amount) AS total FROM finance_operations "
        "WHERE receipt_id = :id AND type = 'income' GROUP BY category",
        id=receipt_id,
    )
    return {r.category: r.total for r in rows}


# --- Продажа ------------------------------------------------------------------------


def test_bottle_and_volume_in_one_receipt(w: World) -> None:
    """Пример спецификации: 1 бутылка + 250 мл = 475 ₴, остаток 750 мл."""
    product = _product(w)
    _, rec = _visit(w)
    items = (_bottle(product), _pour(product, 250))

    preview = _preview(w, rec["id"], *items)
    assert money(preview["total"]) == 575  # услуга 100 + 475
    lines = [x for x in preview["lines"] if x["kind"] == "product"]
    assert [(x["mode"], money(x["quantity"]), money(x["unitPrice"])) for x in lines] == [
        ("package", 1, 350),
        ("volume", 250, Decimal("0.5")),
    ]
    assert all(x["productId"] == product["id"] for x in lines)
    assert [money(x["amount"]) for x in lines] == [350, 125]
    assert _stock(w, product) == 2000  # предпросмотр склад не трогает

    paid = _pay(w, rec["id"], [("cash", 575)], *items)
    assert money(paid["receipt"]["amount"]) == 575
    assert _stock(w, product) == 750

    receipt = _receipt(w, paid["receipt"]["id"])
    assert money(receipt["productsAmount"]) == 475
    by_mode = {x["mode"]: x for x in receipt["products"]}
    assert money(by_mode["package"]["baseQuantity"]) == 1000
    assert money(by_mode["volume"]["baseQuantity"]) == 250
    assert money(by_mode["package"]["paidAmount"]) == 350

    # Запись — только услуги; продажи не попадают в расходники визита
    one = w.s.api.get(f"/records/{rec['id']}", token=w.s.su, salon=w.s.id)
    assert money(one["totalAmount"]) == 100
    assert w.s.api.get(f"/records/{rec['id']}/consumables", token=w.adm, salon=w.s.id) == []
    sales = [m for m in _movements(w, product) if m["type"] == "sale"]
    assert sorted(money(m["delta"]) for m in sales) == [-1000, -250]
    assert all(m["recordId"] == rec["id"] for m in sales)
    assert min(money(m["quantityAfter"]) for m in sales) == 750

    # Бутылку из 750 мл не продать: и предпросмотр, и оплата — 409
    _, other = _visit(w)
    _preview(w, other["id"], _bottle(product), expect=409)
    _pay(w, other["id"], [("cash", 450)], _bottle(product), expect=409)
    assert _stock(w, product) == 750


def test_shortage_sums_all_modes_and_stops_before_charge(w: World) -> None:
    product = _product(w, quantity=1500)
    cid, rec = _visit(w)
    items = (_bottle(product), _pour(product, 600))
    _preview(w, rec["id"], *items, expect=409)

    # Оплата со счёта: при нехватке товара до Master DB не доходим — ни списания, ни сторно
    _pay(w, rec["id"], [("account", 750)], *items, expect=409)
    assert _stock(w, product) == 1500
    from sqlalchemy import select

    from app.models.master import AccountTransaction
    from app.services import ledger
    from workers import db

    with db.master_session() as session:
        account = ledger.find_money_account(session, uuid.UUID(cid))
        journal = (
            list(
                session.scalars(
                    select(AccountTransaction).where(AccountTransaction.account_id == account.id)
                )
            )
            if account
            else []
        )
    assert journal == []


def test_same_mode_is_merged_into_one_line(w: World) -> None:
    product = _product(w)
    _, rec = _visit(w)
    items = (_pour(product, 100), _pour(product, 150))
    preview = _preview(w, rec["id"], *items)
    assert [money(x["quantity"]) for x in preview["lines"] if x["kind"] == "product"] == [250]
    paid = _pay(w, rec["id"], [("cash", 225)], *items)
    assert len(_receipt(w, paid["receipt"]["id"])["products"]) == 1
    assert _stock(w, product) == 1750


def test_parallel_sale_of_the_last_bottle(w: World) -> None:
    product = _product(w, quantity=1000)
    results: list[Any] = []

    def buy() -> None:
        response = w.s.api.client.post(
            "/api/admin/v1/finances/receipts",
            headers={"Authorization": f"Bearer {w.adm}", "X-Salon-Id": w.s.id},
            json={
                "payments": [{"paymentMethodId": w.place.methods["cash"]["id"], "amount": 350}],
                "products": [_bottle(product)],
            },
        )
        results.append(response.status_code)

    threads = [threading.Thread(target=buy) for _ in range(4)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    assert sorted(results) == [201, 409, 409, 409]
    assert _stock(w, product) == 0
    assert len([m for m in _movements(w, product) if m["type"] == "sale"]) == 1


def test_price_change_is_stale_checkout(w: World) -> None:
    product = _product(w)
    _, rec = _visit(w)
    preview = _preview(w, rec["id"], _bottle(product))
    w.s.api.patch(
        f"/inventory/products/{product['id']}",
        token=w.adm,
        salon=w.s.id,
        json={"packagePrice": 400},
    )
    _pay(
        w,
        rec["id"],
        [("cash", 450)],
        _bottle(product),
        extra={"expectedTotal": preview["total"]},
        expect=409,
    )
    assert _stock(w, product) == 2000
    # Цена берётся из карточки: новая сумма принимается, старая — нет
    _pay(w, rec["id"], [("cash", 450)], _bottle(product), expect=409)
    _pay(w, rec["id"], [("cash", 500)], _bottle(product))
    assert _stock(w, product) == 1000


@pytest.mark.parametrize(
    ("price", "quantity", "amount"),
    [("0.125", 1, "0.13"), ("0.3333", 10, "3.33"), ("0.0049", 1, "0.00"), ("1.005", 1, "1.01")],
)
def test_line_amount_rounds_half_up(w: World, price: str, quantity: int, amount: str) -> None:
    product = _product(w, salePrice=price)
    _, rec = _visit(w)
    preview = _preview(w, rec["id"], _pour(product, quantity))
    line = next(x for x in preview["lines"] if x["kind"] == "product")
    assert money(line["amount"]) == Decimal(amount)


def test_modes_and_quantities(w: World) -> None:
    _, rec = _visit(w)
    # Цены бутылки нет — только разлив
    pour_only = _product(w, packagePrice=None)
    _preview(w, rec["id"], _bottle(pour_only), expect=409)
    _preview(w, rec["id"], _pour(pour_only, 10))
    # Цены разлива нет — только бутылка
    bottle_only = _product(w, salePrice=None)
    _preview(w, rec["id"], _pour(bottle_only, 10), expect=409)
    # Дробные бутылки и штуки — 422; разлив — до 3 знаков
    both = _product(w)
    _preview(w, rec["id"], _bottle(both, 1.5), expect=422)
    _preview(w, rec["id"], _pour(both, 0.125))
    _preview(w, rec["id"], _pour(both, 0.1255), expect=422)
    _preview(w, rec["id"], _pour(both, 0), expect=422)
    pieces = _product(
        w, unit="pcs", packageVolume=None, packagePrice=None, salePrice=20, quantity=5
    )
    _preview(w, rec["id"], _pour(pieces, 2))
    _preview(w, rec["id"], _pour(pieces, 1.5), expect=422)
    _preview(w, rec["id"], _bottle(pieces), expect=409)
    # Удалённый товар и чужой id
    gone = _product(w)
    w.s.api.delete(f"/inventory/products/{gone['id']}", token=w.adm, salon=w.s.id, expect=204)
    _preview(w, rec["id"], _bottle(gone), expect=409)
    _preview(w, rec["id"], _bottle({"id": str(uuid.uuid4())}), expect=409)
    # Формат параметра и лимиты
    w.s.api.get(f"/records/{rec['id']}/checkout?products=xx", token=w.adm, salon=w.s.id, expect=422)
    w.s.api.get(
        f"/records/{rec['id']}/checkout?products={both['id']}:bottle:1",
        token=w.adm,
        salon=w.s.id,
        expect=422,
    )
    too_many = "&".join(f"products={_param(_pour(both, 1))}" for _ in range(51))
    w.s.api.get(f"/records/{rec['id']}/checkout?{too_many}", token=w.adm, salon=w.s.id, expect=422)
    _pay(w, rec["id"], [("cash", 100)], *[_pour(both, 1)] * 51, expect=422)
    # Мастер не продаёт
    w.s.api.get(
        f"/finances/receipts/checkout?products={_param(_pour(both, 1))}",
        token=w.mst,
        salon=w.s.id,
        expect=403,
    )


# --- Деньги -------------------------------------------------------------------------


def _quote(prices: list[str], discount: str) -> checkout.Quote:
    lines = [
        checkout.Line(
            kind="product", name=str(i), price=Decimal(p), product_id=uuid.UUID(int=i + 1)
        )
        for i, p in enumerate(prices)
    ]
    sold = sum((Decimal(p) for p in prices), Decimal(0))
    return checkout.Quote(
        lines=lines,
        sold=sold,
        bonus_amount=Decimal(0),
        candidates=[],
        discount_source=DiscountSource.CLIENT,
        discount=Decimal(discount),
        total=sold - Decimal(discount),
    )


def test_rounding_remainder_goes_to_last_line() -> None:
    # 10 % от 3 × 3,33: по строкам 3,00 × 3 = 9,00, а всего 8,99
    assert _quote(["3.33", "3.33", "3.33"], "1.00").product_paid_amounts() == [
        Decimal("3.00"),
        Decimal("3.00"),
        Decimal("2.99"),
    ]


def test_rounding_never_makes_a_line_negative() -> None:
    # Пять строк по копейке со скидкой 50 %: последней строки на остаток не хватает
    paid = _quote(["0.01"] * 5, "0.02").product_paid_amounts()
    assert sum(paid) == Decimal("0.03")
    assert all(p >= 0 for p in paid)


def test_discount_applies_to_products(w: World) -> None:
    cid = new_client(w.place)
    w.s.api.patch(f"/clients/{cid}", token=w.s.su, salon=w.s.id, json={"discountPercent": 10})
    product = _product(w)
    _, rec = _visit(w, cid)
    items = (_bottle(product), _pour(product, 250))
    preview = _preview(w, rec["id"], *items)
    assert money(preview["discountAmount"]) == Decimal("57.50")
    assert money(preview["total"]) == Decimal("517.50")
    paid = _pay(w, rec["id"], [("cash", 517.5)], *items)
    receipt = _receipt(w, paid["receipt"]["id"])
    by_mode = {x["mode"]: x for x in receipt["products"]}
    assert money(by_mode["package"]["amount"]) == 350
    assert money(by_mode["package"]["paidAmount"]) == 315
    assert money(by_mode["volume"]["paidAmount"]) == Decimal("112.50")
    assert money(receipt["productsAmount"]) == Decimal("427.50")
    one = w.s.api.get(f"/records/{rec['id']}", token=w.s.su, salon=w.s.id)
    assert money(one["totalAmount"]) == 90  # 100 − 10 %
    assert _incomes(w, paid["receipt"]["id"]) == {
        "sales": Decimal("427.50"),
        "services": Decimal("90.00"),
    }


def test_income_split_by_category_in_part_order(w: World) -> None:
    product = _product(w)
    _, rec = _visit(w)
    paid = _pay(w, rec["id"], [("cash", 300), ("cash", 150)], _bottle(product))
    assert _incomes(w, paid["receipt"]["id"]) == {
        "sales": Decimal("350.00"),
        "services": Decimal("100.00"),
    }
    rows = _shard_rows(
        w,
        "SELECT category, amount, payment_method_id FROM finance_operations "
        "WHERE receipt_id = :id ORDER BY amount DESC",
        id=paid["receipt"]["id"],
    )
    # Первая часть целиком — товары; вторая делится на остаток товаров и услуги
    assert [(r.category, r.amount) for r in rows] == [
        ("sales", Decimal("300.00")),
        ("services", Decimal("100.00")),
        ("sales", Decimal("50.00")),
    ]


def _sold_certificate(w: World, amount: float, **fields: Any) -> dict[str, Any]:
    s, p = w.s, w.place
    template = s.api.post(
        "/certificates/templates",
        token=s.su,
        salon=s.id,
        expect=201,
        json={"name": f"Серт {uuid.uuid4().hex[:6]}", "amount": amount, **fields},
    )
    receipt = s.api.post(
        "/finances/receipts",
        token=s.su,
        salon=s.id,
        expect=201,
        json={
            "subtotal": 0,
            "payments": [{"paymentMethodId": p.methods["cash"]["id"], "amount": amount}],
            "certificates": [{"templateId": template["id"]}],
        },
    )
    [certificate] = s.api.get(f"/receipts/{receipt['id']}/certificates", token=w.adm, salon=s.id)
    return certificate


def _pay_with_certificate(
    w: World,
    record_id: str,
    code: str,
    amount: float,
    cash: float,
    *items: dict[str, Any],
    **kw: Any,
) -> Any:
    m = w.place.methods
    parts: list[dict[str, Any]] = [
        {"paymentMethodId": m["certificate"]["id"], "amount": amount, "certificateCode": code}
    ]
    if cash:
        parts.append({"paymentMethodId": m["cash"]["id"], "amount": cash})
    return w.s.api.post(
        f"/records/{record_id}/payment",
        token=w.adm,
        salon=w.s.id,
        json={"payments": parts, "products": list(items)},
        **kw,
    )


def test_service_certificate_does_not_cover_products(w: World) -> None:
    certificate = _sold_certificate(
        w, 450, scope="services", services=[{"salonId": w.s.id, "serviceId": w.service["id"]}]
    )
    product = _product(w)
    _, rec = _visit(w)
    # Весь чек сертификатом «на послуги» нельзя: он покрывает только 100 ₴ услуги
    _pay_with_certificate(w, rec["id"], certificate["code"], 450, 0, _bottle(product), expect=409)
    assert _stock(w, product) == 2000
    paid = _pay_with_certificate(w, rec["id"], certificate["code"], 100, 350, _bottle(product))
    # Часть сертификатом дохода не создаёт; наличные — за товар
    assert _incomes(w, paid["receipt"]["id"]) == {"sales": Decimal("350.00")}


def test_any_certificate_covers_products_without_income(w: World) -> None:
    certificate = _sold_certificate(w, 450)
    product = _product(w)
    _, rec = _visit(w)
    paid = _pay_with_certificate(w, rec["id"], certificate["code"], 450, 0, _bottle(product))
    receipt = _receipt(w, paid["receipt"]["id"])
    assert money(receipt["productsAmount"]) == 350
    assert _incomes(w, paid["receipt"]["id"]) == {}
    assert _stock(w, product) == 1000


def _card_holder(w: World, **fields: Any) -> tuple[str, dict[str, Any]]:
    s = w.s
    card_type = s.api.post(
        "/loyalty/card-types",
        token=s.su,
        salon=s.id,
        expect=201,
        json={"name": f"Тип {uuid.uuid4().hex[:4]}", "salonIds": [s.id], **fields},
    )
    cid = new_client(w.place)
    card = s.api.post(
        f"/clients/{cid}/loyalty-cards",
        token=s.su,
        salon=s.id,
        expect=201,
        json={"cardTypeId": card_type["id"]},
    )
    return cid, card


def _card_state(w: World, card: dict[str, Any]) -> dict[str, Any]:
    cards = w.s.api.get(f"/clients/{card['clientId']}/loyalty-cards", token=w.s.su, salon=w.s.id)
    return next(c for c in cards if c["id"] == card["id"])


@pytest.mark.parametrize(("on_products", "cashback"), [(True, 45), (False, 10)])
def test_cashback_on_products_flag(w: World, eager: None, on_products: bool, cashback: int) -> None:
    cid, card = _card_holder(w, cashbackPercent=10, cashbackOnProducts=on_products)
    product = _product(w)
    _, rec = _visit(w, cid)
    _pay(w, rec["id"], [("cash", 450)], _bottle(product))
    publish()
    state = _card_state(w, card)
    assert money(state["cashbackBalance"]) == cashback
    assert money(state["soldTotal"]) == 450  # товары входят в «Продано» карты


def test_paying_with_bonus_service(w: World, eager: None) -> None:
    s = w.s
    card_type = s.api.post(
        "/loyalty/card-types",
        token=s.su,
        salon=s.id,
        expect=201,
        json={"name": f"Бонус {uuid.uuid4().hex[:4]}", "salonIds": [s.id]},
    )
    s.api.post(
        f"/loyalty/card-types/{card_type['id']}/bonus-rules",
        token=s.su,
        salon=s.id,
        expect=201,
        json={
            "name": "Кожна 2-га",
            "everyN": 2,
            "services": [{"salonId": s.id, "serviceId": w.service["id"]}],
        },
    )
    cid = new_client(w.place)
    s.api.post(
        f"/clients/{cid}/loyalty-cards",
        token=s.su,
        salon=s.id,
        expect=201,
        json={"cardTypeId": card_type["id"]},
    )
    for _ in range(2):
        _, first = _visit(w, cid)
        w.place.pay(first["id"], [("cash", 100)])
        publish()

    product = _product(w)
    _, rec = _visit(w, cid)
    preview = s.api.get(f"/records/{rec['id']}/checkout", token=s.su, salon=s.id)
    line_id = next(x for x in preview["lines"] if x["kind"] == "service")["recordServiceId"]
    # Бесплатная услуга не тянет за собой товар: к оплате только бутылка
    paid = _pay(
        w,
        rec["id"],
        [("cash", 350)],
        _bottle(product),
        extra={"bonusRecordServiceIds": [line_id]},
    )
    assert money(paid["receipt"]["amount"]) == 350
    one = s.api.get(f"/records/{rec['id']}", token=s.su, salon=s.id)
    assert money(one["totalAmount"]) == 0
    assert _incomes(w, paid["receipt"]["id"]) == {"sales": Decimal("350.00")}


def test_shard_failure_rolls_back_stock_and_money(
    w: World, monkeypatch: pytest.MonkeyPatch
) -> None:
    from app.services import visits

    cid = new_client(w.place)
    w.s.api.post(
        f"/clients/{cid}/account/topups",
        token=w.s.su,
        salon=w.s.id,
        expect=201,
        json={"amount": 450},
    )
    product = _product(w)
    _, rec = _visit(w, cid)

    def boom(*args: Any, **kwargs: Any) -> None:
        raise RuntimeError("shard down")

    monkeypatch.setattr(visits, "write_receipt_audit", boom)
    _pay(w, rec["id"], [("account", 450)], _bottle(product), expect=500)
    monkeypatch.undo()

    assert _stock(w, product) == 2000
    assert [m["type"] for m in _movements(w, product)] == ["receipt"]
    account = w.s.api.get(f"/clients/{cid}/account", token=w.s.su, salon=w.s.id)
    assert money(account["balance"]) == 450
    one = w.s.api.get(f"/records/{rec['id']}", token=w.s.su, salon=w.s.id)
    assert one["paymentStatus"] == "unpaid"


# --- Идемпотентность ----------------------------------------------------------------


def test_retry_with_same_key_does_not_write_off_twice(w: World) -> None:
    product = _product(w)
    _, rec = _visit(w)
    key = {"Idempotency-Key": uuid.uuid4().hex}
    first = _pay(w, rec["id"], [("cash", 450)], _bottle(product), headers=key)
    again = _pay(w, rec["id"], [("cash", 450)], _bottle(product), headers=key)
    assert first["receipt"]["id"] == again["receipt"]["id"]
    assert _stock(w, product) == 1000
    assert len([m for m in _movements(w, product) if m["type"] == "sale"]) == 1

    # Продажа без записи: то же, и повтор после отмены не продаёт заново
    sale_key = {"Idempotency-Key": uuid.uuid4().hex}
    sale = _sell(w, [("cash", 350)], _bottle(product), headers=sale_key)
    assert _stock(w, product) == 0
    w.place.cancel(sale["id"])
    assert _stock(w, product) == 1000
    repeat = _sell(w, [("cash", 350)], _bottle(product), headers=sale_key)
    assert repeat["id"] == sale["id"] and repeat["status"] == "cancelled"
    assert _stock(w, product) == 1000


# --- Продажа без записи -------------------------------------------------------------


def test_sale_without_record(w: World) -> None:
    cid = new_client(w.place)
    w.s.api.patch(f"/clients/{cid}", token=w.s.su, salon=w.s.id, json={"discountPercent": 10})
    product = _product(w)
    items = (_bottle(product), _pour(product, 100))
    query = "&".join(f"products={_param(i)}" for i in items)
    preview = w.s.api.get(
        f"/finances/receipts/checkout?clientId={cid}&{query}", token=w.adm, salon=w.s.id
    )
    assert money(preview["sold"]) == 400 and money(preview["total"]) == 360
    # Сумма частей без учёта скидки не проходит: ветка «чек = сумма частей» не срабатывает
    _sell(w, [("cash", 400)], *items, clientId=cid, expect=422)
    sale = _sell(w, [("cash", 360)], *items, clientId=cid, expectedTotal=preview["total"])
    assert money(sale["productsAmount"]) == 360 and len(sale["products"]) == 2
    assert _incomes(w, sale["id"]) == {"sales": Decimal("360.00")}
    assert _stock(w, product) == 900
    assert all(m["recordId"] is None for m in _movements(w, product))

    # Товар без клиента, нехватка — 409, хотя прочие ошибки продажи — 422
    _sell(w, [("cash", 700)], _bottle(product, 2), expect=409)
    # Старый контракт subtotal работает и вместе с товарами
    mixed = _sell(w, [("cash", 400)], _pour(product, 100), subtotal=350)
    assert money(mixed["productsAmount"]) == 50 and money(mixed["amount"]) == 400


def test_manual_subtotal_still_works(w: World) -> None:
    old = _sell(w, [("cash", 120)], subtotal=120)
    assert (
        money(old["amount"]) == 120 and money(old["productsAmount"]) == 0 and old["products"] == []
    )
    plain = _sell(w, [("cash", 75)])
    assert money(plain["amount"]) == 75
    preview = w.s.api.get("/finances/receipts/checkout?subtotal=120", token=w.adm, salon=w.s.id)
    assert money(preview["total"]) == 120
    w.s.api.get("/finances/receipts/checkout", token=w.adm, salon=w.s.id, expect=422)


# --- Отмена -------------------------------------------------------------------------


def test_cancel_returns_goods(w: World) -> None:
    product = _product(w)
    _, rec = _visit(w)
    items = (_bottle(product), _pour(product, 250))
    paid = _pay(w, rec["id"], [("cash", 575)], *items)
    assert _stock(w, product) == 750
    receipt_id = paid["receipt"]["id"]

    # Отмена — только у суперюзера
    w.s.api.post(f"/finances/receipts/{receipt_id}/cancel", token=w.adm, salon=w.s.id, expect=403)
    w.place.cancel(receipt_id)
    assert _stock(w, product) == 2000
    moves = _movements(w, product)
    returned = [m for m in moves if m["type"] == "receipt" and m["recordId"] == rec["id"]]
    assert sorted(money(m["delta"]) for m in returned) == [250, 1000]

    # Запись снова не оплачена, товары в неё не вернулись: администратор выбирает заново
    one = w.s.api.get(f"/records/{rec['id']}", token=w.s.su, salon=w.s.id)
    assert one["paymentStatus"] == "unpaid" and money(one["totalAmount"]) == 100
    assert money(_preview(w, rec["id"])["total"]) == 100

    # Обратные движения ссылаются на продажи, каждую один раз
    rows = _shard_rows(
        w,
        "SELECT count(*) AS n FROM stock_movements r JOIN stock_movements s "
        "ON r.cancels_movement_id = s.id WHERE s.product_id = :id AND s.type = 'sale'",
        id=product["id"],
    )
    assert rows[0].n == 2

    # Повторная отмена — 409, склад не меняется; повторная оплата снова списывает
    w.s.api.post(f"/finances/receipts/{receipt_id}/cancel", token=w.s.su, salon=w.s.id, expect=409)
    assert _stock(w, product) == 2000
    _pay(w, rec["id"], [("cash", 450)], _bottle(product))
    assert _stock(w, product) == 1000


def test_cancel_with_deactivated_product(w: World) -> None:
    product = _product(w)
    sale = _sell(w, [("cash", 350)], _bottle(product))
    w.s.api.delete(f"/inventory/products/{product['id']}", token=w.adm, salon=w.s.id, expect=204)
    w.place.cancel(sale["id"])
    assert _stock(w, product) == 2000
    got = w.s.api.get(f"/inventory/products/{product['id']}", token=w.adm, salon=w.s.id)
    assert got["isActive"] is False


def test_parallel_cancel_returns_once(w: World) -> None:
    product = _product(w)
    sale = _sell(w, [("cash", 350)], _bottle(product))
    results: list[int] = []

    def cancel() -> None:
        response = w.s.api.client.post(
            f"/api/admin/v1/finances/receipts/{sale['id']}/cancel",
            headers={"Authorization": f"Bearer {w.s.su}", "X-Salon-Id": w.s.id},
        )
        results.append(response.status_code)

    threads = [threading.Thread(target=cancel) for _ in range(4)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    assert sorted(results) == [200, 409, 409, 409]
    assert _stock(w, product) == 2000


def test_price_is_hidden_from_master(w: World) -> None:
    product = _product(w)
    limited = w.s.api.get(f"/inventory/products?query={product['name']}", token=w.mst, salon=w.s.id)
    assert limited[0]["id"] == product["id"]
    assert limited[0]["packagePrice"] is None and limited[0]["salePrice"] is None


def test_manual_sale_movement_rejected(w: World) -> None:
    product = _product(w)
    w.s.api.post(
        f"/inventory/products/{product['id']}/movements",
        token=w.adm,
        salon=w.s.id,
        expect=422,
        json={"type": "sale", "quantity": 1},
    )
    assert _stock(w, product) == 2000
