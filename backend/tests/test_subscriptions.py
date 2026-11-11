"""Абонементы (backend/docs/subscriptions.md): типы (раздел 4) и продажа (раздел 5)."""

import uuid
from dataclasses import dataclass
from typing import Any

import pytest

from tests.conftest import Salon
from tests.loyalty_world import Place, setup_place

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
