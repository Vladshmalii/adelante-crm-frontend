"""Склад: товары, движения, категории, импорт/экспорт, расходники записи."""

import io
from dataclasses import dataclass
from decimal import Decimal
from typing import Any

import pytest
from openpyxl import Workbook, load_workbook

from tests.conftest import Salon, phone


@dataclass
class World:
    s: Salon
    adm: str
    master: dict[str, Any]
    mst: str
    master2: dict[str, Any]
    mst2: str
    system: dict[str, Any]
    categories: list[dict[str, Any]]

    def product(self, **body: Any) -> dict[str, Any]:
        return self.s.api.post(
            "/inventory/products", token=self.adm, salon=self.s.id, expect=201, json=body
        )


@pytest.fixture(scope="module")
def w(new_salon: Salon) -> World:
    s = new_salon
    _, adm = s.create_staff("administrator")
    master, mst = s.create_staff()
    master2, mst2 = s.create_staff()
    categories = s.api.get("/inventory/categories", token=adm, salon=s.id)
    system = next(c for c in categories if c["isSystem"])
    return World(s, adm, master, mst, master2, mst2, system, categories)


def _qty(value: Any) -> Decimal:
    return Decimal(str(value))


def test_base_categories(w: World) -> None:
    assert [c["name"] for c in w.categories] == [
        "Без категорії",
        "Витратні матеріали",
        "Обладнання",
        "Професійна косметика",
        "Товари для продажу",
    ]
    w.s.api.get("/inventory/categories", token=w.mst, salon=w.s.id, expect=403)


def test_products_and_access(w: World) -> None:
    api, s = w.s.api, w.s
    shampoo = w.product(
        name="Шампунь",
        sku="SH-1",
        unit="ml",
        packageVolume=500,
        quantity=1500,
        minQuantity=600,
        costPrice=0.4,
        salePrice=0.9,
    )
    assert shampoo["costPrice"] is not None  # цены видит администратор
    assert shampoo["category"]["id"] == w.system["id"] and shampoo["stockStatus"] == "in_stock"
    gloves = w.product(
        name="Рукавички",
        sku="GL-1",
        quantity=10,
        minQuantity=20,
        costPrice=5,
        categoryId=w.categories[1]["id"],
    )
    assert gloves["stockStatus"] == "low"
    api.post(
        "/inventory/products",
        token=w.adm,
        salon=s.id,
        expect=409,
        json={"name": "Дубль", "sku": "sh-1"},
    )
    api.post(
        "/inventory/products", token=w.mst, salon=s.id, expect=403, json={"name": "X", "sku": "X"}
    )

    limited = api.get("/inventory/products", token=w.mst, salon=s.id)
    assert {p["name"] for p in limited} >= {"Шампунь", "Рукавички"}
    assert all(p["sku"] is None and p["costPrice"] is None for p in limited)
    api.get(f"/inventory/products/{shampoo['id']}", token=w.mst, salon=s.id, expect=403)
    assert [
        p["name"] for p in api.get("/inventory/products?stockStatus=low", token=w.adm, salon=s.id)
    ] == ["Рукавички"]
    assert [
        p["name"] for p in api.get("/inventory/products?query=gl-1", token=w.adm, salon=s.id)
    ] == ["Рукавички"]
    summary = api.get("/inventory/summary", token=w.adm, salon=s.id)
    assert summary["total"] == 2 and summary["low"] == 1
    assert _qty(summary["stockValue"]) == Decimal("650.00")


def _find(w: World, sku: str) -> dict[str, Any]:
    return w.s.api.get(f"/inventory/products?query={sku}", token=w.adm, salon=w.s.id)[0]


def test_movements(w: World) -> None:
    api, s = w.s.api, w.s
    shampoo = _find(w, "SH-1")
    base = f"/inventory/products/{shampoo['id']}/movements"
    out = api.post(
        base,
        token=w.adm,
        salon=s.id,
        expect=201,
        json={"type": "write_off", "quantity": 300, "reason": "Брак"},
    )
    assert _qty(out["delta"]) == -300 and _qty(out["quantityAfter"]) == 1200
    api.post(
        base, token=w.adm, salon=s.id, expect=409, json={"type": "write_off", "quantity": 5000}
    )
    adj = api.post(
        base,
        token=w.adm,
        salon=s.id,
        expect=201,
        json={"type": "adjustment", "quantity": 1000, "reason": "Інвентаризація"},
    )
    assert _qty(adj["delta"]) == -200 and _qty(adj["quantityAfter"]) == 1000
    api.post(base, token=w.adm, salon=s.id, expect=422, json={"type": "receipt", "quantity": 0})
    api.post(base, token=w.mst, salon=s.id, expect=403, json={"type": "receipt", "quantity": 1})
    history = api.get(base, token=w.adm, salon=s.id)
    assert [h["type"] for h in history] == ["adjustment", "write_off", "receipt"]

    patched = api.patch(
        f"/inventory/products/{shampoo['id']}",
        token=w.adm,
        salon=s.id,
        json={"salePrice": 1.1, "quantity": 99999},
    )
    assert _qty(patched["quantity"]) == 1000 and _qty(patched["salePrice"]) == Decimal("1.1")
    api.patch(
        f"/inventory/products/{shampoo['id']}",
        token=w.adm,
        salon=s.id,
        expect=409,
        json={"sku": "GL-1"},
    )


def test_categories(w: World) -> None:
    api, s = w.s.api, w.s
    cat = api.post(
        "/inventory/categories", token=w.adm, salon=s.id, expect=201, json={"name": "Фарби"}
    )
    api.post("/inventory/categories", token=w.adm, salon=s.id, expect=409, json={"name": "фарби"})
    api.patch(
        f"/inventory/categories/{cat['id']}",
        token=w.adm,
        salon=s.id,
        json={"name": "Фарби для волосся"},
    )
    api.patch(
        f"/inventory/categories/{w.system['id']}",
        token=w.adm,
        salon=s.id,
        expect=409,
        json={"name": "X"},
    )
    api.delete(f"/inventory/categories/{w.system['id']}", token=w.adm, salon=s.id, expect=409)

    dye = w.product(name="Фарба", sku="DY-1", categoryId=cat["id"], quantity=3)
    api.delete(
        f"/inventory/categories/{cat['id']}?mode=move_to_uncategorized",
        token=w.adm,
        salon=s.id,
        expect=204,
    )
    moved = api.get(f"/inventory/products/{dye['id']}", token=w.adm, salon=s.id)
    assert moved["category"]["id"] == w.system["id"] and moved["isActive"]

    tmp_cat = api.post(
        "/inventory/categories", token=w.adm, salon=s.id, expect=201, json={"name": "Тимчасова"}
    )
    tmp = w.product(name="Тимчасовий", sku="TM-1", categoryId=tmp_cat["id"])
    api.delete(
        f"/inventory/categories/{tmp_cat['id']}?mode=delete_products",
        token=w.adm,
        salon=s.id,
        expect=204,
    )
    assert api.get(f"/inventory/products/{tmp['id']}", token=w.adm, salon=s.id)["isActive"] is False


def test_import_export(w: World) -> None:
    api, s = w.s.api, w.s
    wb = Workbook()
    ws = wb.active
    ws.append(
        [
            "Назва",
            "Артикул",
            "Категорія",
            "Одиниця",
            "Об'єм упаковки",
            "Залишок",
            "Мін. залишок",
            "Собівартість",
            "Ціна продажу",
            "Опис",
        ]
    )
    ws.append(
        [
            "Шампунь (імпорт)",
            "SH-1",
            "Професійна косметика",
            "мл",
            500,
            1250,
            500,
            0.45,
            1.2,
            "Оновлено",
        ]
    )
    ws.append(["Маска", "MK-1", "Нова категорія", "г", 250, 750, 100, 0.3, None, None])
    ws.append(["", "XX-1", None, None, None, None, None, None, None, None])
    ws.append(["Кривий", "KR-1", None, "бочка", None, None, None, None, None, None])
    ws.append(["Кривий2", "KR-2", None, "шт", None, "багато", None, None, None, None])
    buffer = io.BytesIO()
    wb.save(buffer)
    report = api.post(
        "/inventory/import",
        token=w.adm,
        salon=s.id,
        files={
            "file": (
                "p.xlsx",
                buffer.getvalue(),
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            )
        },
    )
    assert report["created"] == 1 and report["updated"] == 1 and len(report["errors"]) == 3
    shampoo = _find(w, "SH-1")
    assert _qty(shampoo["quantity"]) == 1250
    assert shampoo["category"]["name"] == "Професійна косметика"
    names = [c["name"] for c in api.get("/inventory/categories", token=w.adm, salon=s.id)]
    assert "Нова категорія" in names

    export = api.get("/inventory/export?blocks=main,stock", token=w.adm, salon=s.id)
    header = [cell.value for cell in load_workbook(io.BytesIO(export.content)).active[1]]
    assert header == [
        "Назва",
        "Артикул",
        "Штрихкод",
        "Категорія",
        "Одиниця",
        "Об'єм упаковки",
        "Залишок",
        "Мін. залишок",
        "Статус",
    ]
    api.get("/inventory/export", token=w.mst, salon=s.id, expect=403)


def test_consumables(w: World) -> None:
    api, s = w.s.api, w.s
    svc = api.post(
        "/services",
        token=w.adm,
        salon=s.id,
        expect=201,
        json={"name": "Стрижка", "price": 300, "durationMinutes": 30},
    )
    shampoo, gloves = _find(w, "SH-1"), _find(w, "GL-1")

    def record(master: dict[str, Any]) -> dict[str, Any]:
        return api.post(
            "/records",
            token=w.adm,
            salon=s.id,
            expect=201,
            json={
                "newClient": {"name": "К", "phone": phone()},
                "masterId": master["id"],
                "serviceIds": [svc["id"]],
                "startAt": "2030-03-01T10:00:00",
            },
        )

    own, other = record(w.master), record(w.master2)
    items = api.post(
        f"/records/{own['id']}/consumables",
        token=w.mst,
        salon=s.id,
        expect=201,
        json={
            "items": [
                {"productId": shampoo["id"], "quantity": 50},
                {"productId": shampoo["id"], "quantity": 25},
                {"productId": gloves["id"], "quantity": 2},
            ]
        },
    )
    assert sorted(_qty(i["quantity"]) for i in items) == [Decimal(2), Decimal(75)]
    api.post(
        f"/records/{other['id']}/consumables",
        token=w.mst,
        salon=s.id,
        expect=404,
        json={"items": [{"productId": gloves["id"], "quantity": 1}]},
    )
    api.post(
        f"/records/{other['id']}/consumables",
        token=w.adm,
        salon=s.id,
        expect=409,
        json={"items": [{"productId": gloves["id"], "quantity": 1000}]},
    )
    api.post(
        f"/records/{other['id']}/consumables",
        token=w.adm,
        salon=s.id,
        expect=201,
        json={"items": [{"productId": gloves["id"], "quantity": 1}]},
    )
    assert len(api.get(f"/records/{other['id']}/consumables", token=w.mst2, salon=s.id)) == 1
    api.get(f"/records/{other['id']}/consumables", token=w.mst, salon=s.id, expect=404)
    assert _qty(_find(w, "GL-1")["quantity"]) == 7
    history = api.get(f"/inventory/products/{gloves['id']}/movements", token=w.adm, salon=s.id)
    assert history[0]["recordId"] == other["id"]

    api.post(
        f"/records/{other['id']}/status", token=w.adm, salon=s.id, json={"status": "cancelled"}
    )
    api.post(
        f"/records/{other['id']}/consumables",
        token=w.adm,
        salon=s.id,
        expect=409,
        json={"items": [{"productId": gloves["id"], "quantity": 1}]},
    )


# --- Карточка для продажи (product-sales.md, раздел 2) -------------------------------


def _xlsx(rows: list[list[Any]]) -> dict[str, Any]:
    wb = Workbook()
    ws = wb.active
    for row in rows:
        ws.append(row)
    buffer = io.BytesIO()
    wb.save(buffer)
    return {
        "file": (
            "p.xlsx",
            buffer.getvalue(),
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
    }


def test_card_rules(w: World) -> None:
    api, s = w.s.api, w.s
    url = "/inventory/products"
    # У штучного товара нет упаковки; цена упаковки требует объёма
    for bad in (
        {"unit": "pcs", "packageVolume": 10},
        {"unit": "pcs", "packagePrice": 10},
        {"unit": "ml", "packagePrice": 350},
        {"unit": "ml", "salePrice": 0.12345},
        {"unit": "ml", "packageVolume": 1000, "packagePrice": 350.555},
    ):
        api.post(url, token=w.adm, salon=s.id, expect=422, json={"name": "X", "sku": "BAD", **bad})

    oil = w.product(
        name="Олія",
        sku="OIL-1",
        unit="ml",
        packageVolume=1000,
        packagePrice=350,
        salePrice=0.5,
        costPrice=0.2125,
        quantity=2000,
    )
    assert _qty(oil["packagePrice"]) == 350 and _qty(oil["salePrice"]) == Decimal("0.5")
    assert _qty(oil["costPrice"]) == Decimal("0.2125") and oil["hasMovements"] is True
    item = f"{url}/{oil['id']}"
    # Единица и объём товара с движениями не меняются
    api.patch(item, token=w.adm, salon=s.id, expect=409, json={"unit": "l"})
    api.patch(item, token=w.adm, salon=s.id, expect=409, json={"packageVolume": 500})
    api.patch(item, token=w.adm, salon=s.id, expect=409, json={"packageVolume": None})
    # Форма шлёт те же значения — это не смена
    same = api.patch(
        item,
        token=w.adm,
        salon=s.id,
        json={"unit": "ml", "packageVolume": 1000, "packagePrice": 360},
    )
    assert _qty(same["packagePrice"]) == 360
    api.patch(item, token=w.adm, salon=s.id, json={"packagePrice": 350})

    fresh = w.product(name="Новий", sku="NEW-1", unit="ml", packageVolume=500)
    assert fresh["hasMovements"] is False
    changed = api.patch(
        f"{url}/{fresh['id']}",
        token=w.adm,
        salon=s.id,
        json={"unit": "l", "packageVolume": 1},
    )
    assert changed["unit"] == "l"
    api.patch(f"{url}/{fresh['id']}", token=w.adm, salon=s.id, expect=422, json={"unit": "pcs"})

    # Мастеру цены, в том числе цена упаковки, не отдаются
    limited = api.get(f"{url}?query=OIL-1", token=w.mst, salon=s.id)
    assert limited[0]["packagePrice"] is None and limited[0]["salePrice"] is None
    assert limited[0]["hasMovements"] is None


def test_manual_sale_movement_rejected(w: World) -> None:
    api, s = w.s.api, w.s
    oil = _find(w, "OIL-1")
    api.post(
        f"/inventory/products/{oil['id']}/movements",
        token=w.adm,
        salon=s.id,
        expect=422,
        json={"type": "sale", "quantity": 100},
    )
    assert _qty(_find(w, "OIL-1")["quantity"]) == 2000


def _import(w: World, rows: list[list[Any]]) -> dict[str, Any]:
    return w.s.api.post("/inventory/import", token=w.adm, salon=w.s.id, files=_xlsx(rows))


HEADER = [
    "Назва",
    "Артикул",
    "Категорія",
    "Одиниця",
    "Об'єм упаковки",
    "Залишок",
    "Мін. залишок",
    "Собівартість",
    "Ціна продажу",
]


def test_import_package_price(w: World) -> None:
    # Без колонки цены упаковки: цена не стирается
    report = _import(w, [HEADER, ["Олія", "OIL-1", None, "мл", 1000, 2000, 0, 0.2, 0.5]])
    assert report["errors"] == [] and report["updated"] == 1
    assert _qty(_find(w, "OIL-1")["packagePrice"]) == 350

    # Пустая ячейка не стирает, значение — обновляет
    header = [*HEADER, "Ціна упаковки"]
    _import(w, [header, ["Олія", "OIL-1", None, "мл", 1000, 2000, 0, 0.2, 0.5, None]])
    assert _qty(_find(w, "OIL-1")["packagePrice"]) == 350
    _import(w, [header, ["Олія", "OIL-1", None, "мл", 1000, 2000, 0, 0.2, 0.5, 370]])
    assert _qty(_find(w, "OIL-1")["packagePrice"]) == 370

    # Старая раскладка (заголовки не распознаны): колонки не сдвигаются
    legacy = ["Найменування", "Код", "Група", "Од.", "Об.", "К-сть", "Мін", "Соб", "Ціна", "Опис"]
    report = _import(w, [legacy, ["Олія", "OIL-1", None, "мл", 1000, 2000, 0, 0.2, 0.55, "Опис"]])
    assert report["errors"] == []
    oil = _find(w, "OIL-1")
    assert _qty(oil["salePrice"]) == Decimal("0.55") and _qty(oil["packagePrice"]) == 370
    assert oil["description"] == "Опис"

    # Смена единицы или объёма у товара с движениями — ошибка строки, товар не меняется
    report = _import(
        w,
        [
            header,
            ["Олія", "OIL-1", None, "л", 1, 2, 0, 200, 500, None],
            ["Олія", "OIL-1", None, "мл", 500, 2000, 0, 0.2, 0.5, None],
            ["Пакет", "PK-1", None, "шт", None, 5, 0, 1, 2, 30],
            ["Крем", "CR-1", None, "мл", None, 100, 0, 1, 2, 30],
        ],
    )
    assert report["created"] == 0 and report["updated"] == 0
    assert len(report["errors"]) == 4
    assert "створіть нову картку" in report["errors"][0]
    oil = _find(w, "OIL-1")
    assert oil["unit"] == "ml" and _qty(oil["packageVolume"]) == 1000

    export = w.s.api.get("/inventory/export?blocks=finance", token=w.adm, salon=w.s.id)
    sheet = load_workbook(io.BytesIO(export.content)).active
    header_row = [cell.value for cell in sheet[1]]
    assert header_row[-4:] == ["Собівартість", "Ціна продажу", "Ціна упаковки", "Вартість залишку"]
