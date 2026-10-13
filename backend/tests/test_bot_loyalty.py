"""Бот: «Мій баланс» — счёт, карта, кешбэк и уровень клиента; поле card_number удалено."""

from decimal import Decimal

from tests.conftest import BOT_KEY, Salon, phone

BOT = {"prefix": "/api/bot", "headers": {"X-API-Key": BOT_KEY}}


def test_client_loyalty_for_bot(new_salon: Salon) -> None:
    s, api = new_salon, new_salon.api
    client_phone = phone()
    client = api.post(
        "/clients",
        token=s.su,
        salon=s.id,
        expect=201,
        json={"firstName": "Олена", "phone": client_phone},
    )
    tg = 950_000_000 + int(client_phone[-5:])
    api.get(f"/clients/by-telegram/{tg}/loyalty", **BOT, expect=404)
    api.post("/link-telegram", **BOT, json={"phone": client_phone, "telegram_user_id": tg})

    empty = api.get(f"/clients/by-telegram/{tg}/loyalty", **BOT)
    assert empty == {"client_name": "Олена", "account_balance": "0", "card": None}

    api.post(
        f"/clients/{client['id']}/account/adjustments",
        token=s.su,
        salon=s.id,
        expect=201,
        json={"amount": -120, "comment": "борг"},
    )
    card_type = api.post(
        "/loyalty/card-types",
        token=s.su,
        salon=s.id,
        expect=201,
        json={
            "name": "Мережа",
            "salonIds": [s.id],
            "levels": [{"threshold": 0, "discountPercent": 5, "name": "Старт"}],
        },
    )
    card = api.post(
        f"/clients/{client['id']}/loyalty-cards",
        token=s.su,
        salon=s.id,
        expect=201,
        json={"cardTypeId": card_type["id"]},
    )
    api.post(
        f"/loyalty-cards/{card['id']}/cashback-adjustments",
        token=s.su,
        salon=s.id,
        expect=201,
        json={"amount": 30, "comment": "подарунок"},
    )

    data = api.get(f"/clients/by-telegram/{tg}/loyalty", **BOT)
    assert Decimal(data["account_balance"]) == -120
    assert data["card"]["number"] == card["number"] and data["card"]["card_type"] == "Мережа"
    assert Decimal(data["card"]["cashback"]) == 30
    assert data["card"]["level_name"] == "Старт" and Decimal(data["card"]["discount_percent"]) == 5

    api.get(f"/clients/by-telegram/{tg}/loyalty", prefix="/api/bot", expect=401)


def test_card_number_field_removed(new_salon: Salon) -> None:
    s, api = new_salon, new_salon.api
    client = api.post(
        "/clients",
        token=s.su,
        salon=s.id,
        expect=201,
        json={"firstName": "Без картки", "phone": phone(), "cardNumber": "ignored"},
    )
    assert "cardNumber" not in client and client["loyaltyCardNumber"] is None
