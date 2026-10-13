"""Общие хелперы тестов лояльности: салон с мастером, кассой и способами оплаты."""

import uuid
from dataclasses import dataclass, field
from datetime import date, datetime
from decimal import Decimal
from typing import Any

import pytest

from tests.conftest import Api, Salon, phone


@dataclass
class Place:
    """Салон, в котором можно создавать и оплачивать записи."""

    api: Api
    id: str
    su: str
    master_id: str
    methods: dict[str, dict[str, Any]] = field(default_factory=dict)

    def service(self, price: float, name: str | None = None) -> dict[str, Any]:
        return self.api.post(
            "/services",
            token=self.su,
            salon=self.id,
            expect=201,
            json={
                "name": name or f"Послуга {uuid.uuid4().hex[:6]}",
                "price": price,
                "durationMinutes": 30,
            },
        )

    def record(self, client_id: str, *services: dict[str, Any]) -> dict[str, Any]:
        """Завершённая неоплаченная запись клиента на эти услуги."""
        when = datetime.combine(date.today(), datetime.min.time()).replace(hour=9)
        rec = self.api.post(
            "/records",
            token=self.su,
            salon=self.id,
            expect=201,
            json={
                "clientId": client_id,
                "masterId": self.master_id,
                "serviceIds": [s["id"] for s in services],
                "startAt": when.isoformat(),
            },
        )
        self.api.post(f"/records/{rec['id']}/complete", token=self.su, salon=self.id, json={})
        return rec

    def pay(
        self, record_id: str, parts: list[tuple[str, float]], *, token: str | None = None, **kw: Any
    ) -> Any:
        """Оплата записи; parts — [(тип способа: cash|account|bonus, сумма)]."""
        return self.api.post(
            f"/records/{record_id}/payment",
            token=token or self.su,
            salon=self.id,
            json={
                "payments": [
                    {"paymentMethodId": self.methods[t]["id"], "amount": a} for t, a in parts
                ],
                **kw.pop("extra", {}),
            },
            **kw,
        )

    def sell(self, client_id: str | None, parts: list[tuple[str, float]], **kw: Any) -> Any:
        body: dict[str, Any] = {
            "payments": [{"paymentMethodId": self.methods[t]["id"], "amount": a} for t, a in parts]
        }
        if client_id:
            body["clientId"] = client_id
        return self.api.post(
            "/finances/receipts",
            token=kw.pop("token", self.su),
            salon=self.id,
            expect=kw.pop("expect", 201),
            json=body,
        )

    def cancel(self, receipt_id: str) -> None:
        self.api.post(f"/finances/receipts/{receipt_id}/cancel", token=self.su, salon=self.id)


def setup_place(api: Api, salon_id: str, su: str) -> Place:
    """Мастер, касса «Готівка» и системные способы в салоне."""
    staff = api.post(
        "/staff",
        token=su,
        salon=salon_id,
        expect=201,
        json={
            "firstName": "Майстер",
            "phone": phone(),
            "email": f"mst-{uuid.uuid4().hex[:8]}@test.ua",
            "password": "password1",
            "role": "master",
        },
    )
    register = api.post(
        "/finances/cash-registers",
        token=su,
        salon=salon_id,
        expect=201,
        json={"name": f"Каса {uuid.uuid4().hex[:4]}"},
    )
    cash = api.post(
        "/finances/payment-methods",
        token=su,
        salon=salon_id,
        expect=201,
        json={"name": "Готівка", "type": "cash", "cashRegisterId": register["id"]},
    )
    methods = {m["type"]: m for m in api.get("/payment-methods", token=su, salon=salon_id)}
    methods["cash"] = cash
    return Place(api=api, id=salon_id, su=su, master_id=staff["id"], methods=methods)


def new_client(place: Place | Salon, name: str = "Клієнт") -> str:
    return place.api.post(
        "/clients",
        token=place.su,
        salon=place.id,
        expect=201,
        json={"firstName": name, "phone": phone()},
    )["id"]


def money(value: Any) -> Decimal:
    return Decimal(str(value))


@pytest.fixture()
def eager(monkeypatch: pytest.MonkeyPatch) -> None:
    """Celery eager, Telegram подменён — outbox обрабатывается синхронно в publish()."""
    from workers import telegram
    from workers.celery_app import celery

    monkeypatch.setattr(celery.conf, "task_always_eager", True)
    monkeypatch.setattr(telegram, "send_message", lambda chat_id, text: None)


def publish() -> None:
    from workers.tasks import outbox

    outbox.publish_outbox()
