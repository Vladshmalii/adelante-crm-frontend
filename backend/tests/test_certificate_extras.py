"""Сертификаты: товары в области, категории, срок «до даты» (certificates.md, раздел 11)."""

import uuid
from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
from typing import Any
from zoneinfo import ZoneInfo

import pytest

from tests.conftest import Salon
from tests.loyalty_world import Place, money, new_client, setup_place

TEMPLATES = "/certificates/templates"
CATEGORIES = "/certificates/categories"
TZ = ZoneInfo("Europe/Kyiv")


@dataclass
class World:
    s: Salon
    place: Place
    service: dict[str, Any]
    shampoo: dict[str, Any]
    mask: dict[str, Any]
    adm: str


def _product(s: Salon, name: str) -> dict[str, Any]:
    return s.api.post(
        "/inventory/products",
        token=s.su,
        salon=s.id,
        expect=201,
        json={
            "name": f"{name} {uuid.uuid4().hex[:4]}",
            "sku": f"SKU-{uuid.uuid4().hex[:8]}",
            "unit": "ml",
            "packageVolume": 1000,
            "packagePrice": 350,
            "salePrice": 0.5,
            "quantity": 20000,
        },
    )


@pytest.fixture(scope="module")
def w(new_salon: Salon) -> World:
    s = new_salon
    place = setup_place(s.api, s.id, s.su)
    service = place.service(100, "Стрижка")
    _, adm = s.create_staff(role="administrator")
    return World(s, place, service, _product(s, "Шампунь"), _product(s, "Маска"), adm)


def _template(w: World, *, expect: int = 201, **fields: Any) -> Any:
    body = {"name": f"Сертифікат {uuid.uuid4().hex[:4]}", "amount": 1000, **fields}
    return w.s.api.post(TEMPLATES, token=w.s.su, salon=w.s.id, expect=expect, json=body)


def _svc(w: World, service: dict[str, Any] | None = None) -> dict[str, str]:
    return {"salonId": w.s.id, "serviceId": (service or w.service)["id"]}


def _prd(w: World, product: dict[str, Any]) -> dict[str, str]:
    return {"salonId": w.s.id, "productId": product["id"]}


def _bottle(product: dict[str, Any]) -> dict[str, Any]:
    return {"productId": product["id"], "mode": "package", "quantity": 1}


def _buy(w: World, template: dict[str, Any], *, quantity: int = 1) -> list[dict[str, Any]]:
    p, s = w.place, w.s
    amount = float(template["amount"]) * quantity
    receipt = s.api.post(
        "/finances/receipts",
        token=s.su,
        salon=s.id,
        expect=201,
        json={
            "subtotal": 0,
            "payments": [{"paymentMethodId": p.methods["cash"]["id"], "amount": amount}],
            "certificates": [{"templateId": template["id"], "quantity": quantity}],
        },
    )
    return s.api.get(f"/receipts/{receipt['id']}/certificates", token=s.su, salon=s.id)


def _certificate_method(w: World) -> str:
    methods = w.s.api.get("/payment-methods", token=w.s.su, salon=w.s.id)
    return next(m["id"] for m in methods if m["type"] == "certificate")


def _pay(
    w: World,
    record_id: str,
    code: str,
    by_certificate: float,
    cash: float,
    products: list[dict[str, Any]],
    *,
    expect: int = 200,
) -> Any:
    parts = [
        {
            "paymentMethodId": _certificate_method(w),
            "amount": by_certificate,
            "certificateCode": code,
        }
    ]
    if cash:
        parts.append({"paymentMethodId": w.place.methods["cash"]["id"], "amount": cash})
    return w.s.api.post(
        f"/records/{record_id}/payment",
        token=w.adm,
        salon=w.s.id,
        expect=expect,
        json={"payments": parts, "products": products},
    )


# --- Шаблоны: области ----------------------------------------------------------------


def test_scope_validation(w: World) -> None:
    other_salon = w.s.api.salon_id(w.s.su, "main")
    # «На все» — ни услуг, ни товаров
    _template(w, expect=422, scope="any", services=[_svc(w)])
    _template(w, expect=422, scope="any", products=[_prd(w, w.shampoo)])
    # «На послуги» — хотя бы одна услуга, товаров нет
    _template(w, expect=422, scope="services")
    _template(w, expect=422, scope="services", services=[_svc(w)], products=[_prd(w, w.shampoo)])
    # «На товари» — хотя бы один товар, услуг нет
    _template(w, expect=422, scope="products")
    _template(w, expect=422, scope="products", products=[_prd(w, w.shampoo)], services=[_svc(w)])
    # «На послуги і товари» — хотя бы одна услуга или товар
    _template(w, expect=422, scope="services_products")
    # Товара нет в шарде салона / товар чужого салона / салона нет
    _template(
        w,
        expect=422,
        scope="products",
        products=[{"salonId": w.s.id, "productId": str(uuid.uuid4())}],
    )
    _template(
        w,
        expect=422,
        scope="products",
        products=[{"salonId": other_salon, "productId": w.shampoo["id"]}],
    )
    _template(
        w,
        expect=422,
        scope="products",
        products=[{"salonId": str(uuid.uuid4()), "productId": w.shampoo["id"]}],
    )
    # Срок: дни и дата вместе — нельзя
    _template(w, expect=422, validDays=30, validUntil=str(date.today() + timedelta(days=30)))

    products = _template(w, scope="products", products=[_prd(w, w.shampoo)])
    assert products["products"] == [_prd(w, w.shampoo)] and products["services"] == []
    only_services = _template(w, scope="services_products", services=[_svc(w)])
    assert only_services["products"] == []
    both = _template(w, scope="services_products", services=[_svc(w)], products=[_prd(w, w.mask)])
    assert both["services"] == [_svc(w)] and both["products"] == [_prd(w, w.mask)]
    assert both["issuedCount"] == 0 and both["categoryId"] is None and both["validUntil"] is None


def test_scope_patch(w: World) -> None:
    api, s = w.s.api, w.s
    t = _template(w, scope="services_products", services=[_svc(w)], products=[_prd(w, w.shampoo)])
    url = f"{TEMPLATES}/{t['id']}"
    # На «на послуги»: товары, не переданные явно, очищаются; переданные — ошибка
    api.patch(
        url,
        token=s.su,
        salon=s.id,
        expect=422,
        json={"scope": "services", "products": [_prd(w, w.mask)]},
    )
    t = api.patch(url, token=s.su, salon=s.id, json={"scope": "services"})
    assert t["services"] == [_svc(w)] and t["products"] == []
    # На «на товари» без товаров нельзя
    api.patch(url, token=s.su, salon=s.id, expect=422, json={"scope": "products"})
    t = api.patch(
        url, token=s.su, salon=s.id, json={"scope": "products", "products": [_prd(w, w.mask)]}
    )
    assert t["services"] == [] and t["products"] == [_prd(w, w.mask)]
    # Срок: дата, затем дни без снятия даты — 422, со снятием — можно
    until = str(date.today() + timedelta(days=10))
    t = api.patch(url, token=s.su, salon=s.id, json={"validUntil": until})
    assert t["validUntil"] == until
    api.patch(url, token=s.su, salon=s.id, expect=422, json={"validDays": 5})
    t = api.patch(url, token=s.su, salon=s.id, json={"validDays": 5, "validUntil": None})
    assert t["validDays"] == 5 and t["validUntil"] is None
    changes = api.get(
        "/audit", token=s.su, salon=s.id, params={"entity": "certificate", "perPage": 100}
    )
    assert any(c["entityId"] == t["id"] and "products" in (c["details"] or {}) for c in changes)


# --- Категории -----------------------------------------------------------------------


def test_categories(w: World) -> None:
    api, s = w.s.api, w.s
    name = f"Подарунки {uuid.uuid4().hex[:4]}"
    api.post(CATEGORIES, token=w.adm, salon=s.id, expect=403, json={"name": name})
    category = api.post(
        CATEGORIES, token=s.su, salon=s.id, expect=201, json={"name": name, "sortOrder": 2}
    )
    assert category["name"] == name and category["sortOrder"] == 2
    api.post(CATEGORIES, token=s.su, salon=s.id, expect=409, json={"name": name.upper()})
    # Администратор видит категории — окно продажи группирует по ним
    assert category["id"] in [c["id"] for c in api.get(CATEGORIES, token=w.adm, salon=s.id)]
    renamed = api.patch(
        f"{CATEGORIES}/{category['id']}", token=s.su, salon=s.id, json={"name": name + " 2"}
    )
    assert renamed["name"] == name + " 2"

    _template(w, expect=422, categoryId=str(uuid.uuid4()))
    t = _template(w, categoryId=category["id"])
    assert t["categoryId"] == category["id"]
    listed = {x["id"]: x for x in api.get(TEMPLATES, token=w.adm, salon=s.id)}
    assert listed[t["id"]]["categoryId"] == category["id"]

    api.delete(f"{CATEGORIES}/{category['id']}", token=w.adm, salon=s.id, expect=403)
    api.delete(f"{CATEGORIES}/{category['id']}", token=s.su, salon=s.id, expect=204)
    api.delete(f"{CATEGORIES}/{category['id']}", token=s.su, salon=s.id, expect=404)
    listed = {x["id"]: x for x in api.get(TEMPLATES, token=s.su, salon=s.id)}
    assert listed[t["id"]]["categoryId"] is None  # шаблон остался «Без категорії»
    audit = api.get(
        "/audit", token=s.su, salon=s.id, params={"entity": "certificate", "perPage": 100}
    )
    assert {a["action"] for a in audit if a["entityId"] == category["id"]} == {
        "created",
        "updated",
        "deleted",
    }

    # Снять категорию у шаблона
    other = api.post(
        CATEGORIES, token=s.su, salon=s.id, expect=201, json={"name": f"К {uuid.uuid4().hex[:4]}"}
    )
    t = api.patch(
        f"{TEMPLATES}/{t['id']}", token=s.su, salon=s.id, json={"categoryId": other["id"]}
    )
    assert t["categoryId"] == other["id"]
    t = api.patch(f"{TEMPLATES}/{t['id']}", token=s.su, salon=s.id, json={"categoryId": None})
    assert t["categoryId"] is None


def test_issued_count_excludes_cancelled(w: World) -> None:
    api, s = w.s.api, w.s
    t = _template(w, amount=100)
    first, _ = _buy(w, t, quantity=2)
    listed = {x["id"]: x for x in api.get(TEMPLATES, token=s.su, salon=s.id)}
    assert listed[t["id"]]["issuedCount"] == 2
    api.post(f"/certificates/{first['id']}/cancel", token=s.su, salon=s.id, json={"reason": "Тест"})
    listed = {x["id"]: x for x in api.get(TEMPLATES, token=s.su, salon=s.id)}
    assert listed[t["id"]]["issuedCount"] == 1


# --- Срок «до даты» ------------------------------------------------------------------


def test_valid_until(w: World) -> None:
    api, s, p = w.s.api, w.s, w.place
    today = datetime.now(TZ).date()
    closed = _template(w, amount=100, validUntil=str(today - timedelta(days=1)))
    sale = {
        "subtotal": 0,
        "payments": [{"paymentMethodId": p.methods["cash"]["id"], "amount": 100}],
        "certificates": [{"templateId": closed["id"]}],
    }
    api.post("/finances/receipts", token=w.adm, salon=s.id, expect=422, json=sale)
    api.get(
        "/finances/receipts/checkout",
        token=w.adm,
        salon=s.id,
        expect=422,
        params={"certificateTemplateIds": [closed["id"]]},
    )
    rec = p.record(new_client(p), w.service)
    p.pay(
        rec["id"],
        [("cash", 200)],
        token=w.adm,
        expect=422,
        extra={"certificates": [{"templateId": closed["id"]}]},
    )

    # В последний день — продаётся; сгорает в конце дня по Киеву
    last_day = _template(w, amount=100, validUntil=str(today))
    [cert] = _buy(w, last_day)
    end_of_day = datetime.combine(today + timedelta(days=1), time.min, tzinfo=TZ)
    assert datetime.fromisoformat(cert["expiresAt"]) == end_of_day


# --- Погашение: товары ---------------------------------------------------------------


def test_redeem_products_scope(w: World) -> None:
    """«На товари»: не больше строк товаров из снимка; услуги и чужие товары не покрываются."""
    api, s, p = w.s.api, w.s, w.place
    t = _template(w, amount=1000, scope="products", products=[_prd(w, w.shampoo)])
    [cert] = _buy(w, t)
    client = new_client(p)
    items = [_bottle(w.shampoo), _bottle(w.mask)]

    rec = p.record(client, w.service)  # 100 + 350 + 350 = 800
    lookup = api.post(
        "/certificates/lookup",
        token=w.adm,
        salon=s.id,
        json={"code": cert["code"], "recordId": rec["id"], "products": items},
    )
    assert money(lookup["maxPayment"]) == 350 and lookup["error"] is None
    # Без товаров в чеке — нечем платить
    lookup = api.post(
        "/certificates/lookup",
        token=w.adm,
        salon=s.id,
        json={"code": cert["code"], "recordId": rec["id"]},
    )
    assert lookup["error"] and money(lookup["maxPayment"]) == 0

    _pay(w, rec["id"], cert["code"], 400, 400, items, expect=409)
    _pay(w, rec["id"], cert["code"], 350, 450, items)
    got = api.get(f"/clients/{client}/certificates", token=w.adm, salon=s.id)
    assert money(next(c for c in got if c["id"] == cert["id"])["balance"]) == 650

    # Чек без записи: только чужой товар — сертификат не покрывает
    api.post(
        "/finances/receipts",
        token=w.adm,
        salon=s.id,
        expect=422,
        json={
            "clientId": client,
            "products": [_bottle(w.mask)],
            "payments": [
                {
                    "paymentMethodId": _certificate_method(w),
                    "amount": 350,
                    "certificateCode": cert["code"],
                }
            ],
        },
    )


def test_redeem_services_products_scope(w: World) -> None:
    """«На послуги і товари»: лимит — сумма покрытых услуг и товаров из снимка."""
    p = w.place
    other_service = p.service(100, "Інша послуга")
    t = _template(
        w,
        amount=1000,
        scope="services_products",
        services=[_svc(w)],
        products=[_prd(w, w.shampoo)],
    )
    [cert] = _buy(w, t)
    client = new_client(p)
    items = [_bottle(w.shampoo), _bottle(w.mask)]
    rec = p.record(client, w.service, other_service)  # 100 + 100 + 350 + 350 = 900
    _pay(w, rec["id"], cert["code"], 460, 440, items, expect=409)
    _pay(w, rec["id"], cert["code"], 450, 450, items)
