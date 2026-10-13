"""Оплата со счёта клиента и в долг: Master → шард, компенсация, сверка, отмена чека, кассы."""

import threading
import uuid
from dataclasses import dataclass
from datetime import UTC, date, datetime, timedelta
from decimal import Decimal
from typing import Any

import pytest

from tests.conftest import Salon, phone


@dataclass
class World:
    s: Salon
    main_id: str
    master: dict[str, Any]
    admin_token: str
    master_token: str
    cash: dict[str, Any]
    account: dict[str, Any]
    register: dict[str, Any]
    period: str


@pytest.fixture(scope="module")
def w(new_salon: Salon) -> World:
    s = new_salon
    master, master_token = s.create_staff(firstName="Олена")
    _, admin_token = s.create_staff(role="administrator", firstName="Адмін")
    register = s.api.post(
        "/finances/cash-registers", token=s.su, salon=s.id, expect=201, json={"name": "Каса"}
    )
    cash = s.api.post(
        "/finances/payment-methods",
        token=s.su,
        salon=s.id,
        expect=201,
        json={"name": "Готівка", "type": "cash", "cashRegisterId": register["id"]},
    )
    methods = s.api.get("/payment-methods", token=admin_token, salon=s.id)
    account = next(m for m in methods if m["type"] == "account")
    period = (
        f"dateFrom={date.today() - timedelta(days=1)}T00:00:00"
        f"&dateTo={date.today() + timedelta(days=1)}T00:00:00"
    )
    return World(
        s,
        s.api.salon_id(s.su, "main"),
        master,
        admin_token,
        master_token,
        cash,
        account,
        register,
        period,
    )


@pytest.fixture()
def eager(monkeypatch: pytest.MonkeyPatch) -> None:
    """Celery eager, Telegram подменён — outbox обрабатывается синхронно."""
    from workers import telegram
    from workers.celery_app import celery

    monkeypatch.setattr(celery.conf, "task_always_eager", True)
    monkeypatch.setattr(telegram, "send_message", lambda chat_id, text: None)


def _publish() -> None:
    from workers.tasks import outbox

    outbox.publish_outbox()


def _client(w: World) -> str:
    return w.s.api.post(
        "/clients",
        token=w.s.su,
        salon=w.s.id,
        expect=201,
        json={"firstName": "Клієнт", "phone": phone()},
    )["id"]


def _record(w: World, client_id: str, price: int) -> dict[str, Any]:
    """Завершённая неоплаченная запись клиента на сумму price."""
    s = w.s
    svc = s.api.post(
        "/services",
        token=s.su,
        salon=s.id,
        expect=201,
        json={"name": f"Послуга {uuid.uuid4().hex[:6]}", "price": price, "durationMinutes": 30},
    )
    when = datetime.combine(date.today(), datetime.min.time()).replace(hour=9)
    rec = s.api.post(
        "/records",
        token=s.su,
        salon=s.id,
        expect=201,
        json={
            "clientId": client_id,
            "masterId": w.master["id"],
            "serviceIds": [svc["id"]],
            "startAt": when.isoformat(),
        },
    )
    s.api.post(f"/records/{rec['id']}/complete", token=s.su, salon=s.id, json={})
    return rec


def _topup(w: World, client_id: str, amount: int, salon: str | None = None) -> None:
    w.s.api.post(
        f"/clients/{client_id}/account/topups",
        token=w.s.su,
        salon=salon or w.s.id,
        expect=201,
        json={"amount": amount},
    )


def _balance(w: World, client_id: str) -> Decimal:
    data = w.s.api.get(f"/clients/{client_id}/account", token=w.s.su, salon=w.s.id)
    return Decimal(str(data["balance"]))


def _pay(w: World, record_id: str, parts: list[tuple[dict[str, Any], float]], **kw: Any) -> Any:
    return w.s.api.post(
        f"/records/{record_id}/payment",
        token=kw.pop("token", w.admin_token),
        salon=w.s.id,
        json={"payments": [{"paymentMethodId": m["id"], "amount": a} for m, a in parts]},
        **kw,
    )


def _register_balance(w: World) -> Decimal:
    registers = w.s.api.get("/finances/cash-registers", token=w.s.su, salon=w.s.id)
    return Decimal(str(next(r for r in registers if r["id"] == w.register["id"])["balance"]))


def _revenue(w: World) -> Decimal:
    dash = w.s.api.get(f"/finances/dashboard?{w.period}", token=w.s.su, salon=w.s.id)
    return Decimal(str(dash["totalRevenue"]))


def _journal(client_id: str) -> list[tuple[str, Decimal]]:
    from sqlalchemy import select

    from app.models.master import AccountTransaction
    from app.services import ledger
    from workers import db

    with db.master_session() as session:
        account = ledger.find_money_account(session, uuid.UUID(client_id))
        if account is None:
            return []
        rows = session.execute(
            select(AccountTransaction.type, AccountTransaction.amount)
            .where(AccountTransaction.account_id == account.id)
            .order_by(AccountTransaction.created_at, AccountTransaction.id)
        ).all()
        return [(t.value, a) for t, a in rows]


def test_pay_from_deposit_without_cash_register(w: World) -> None:
    """Пополнение 800 → визит 500 со счёта: баланс 300, касса не изменилась, доход +500."""
    cid = _client(w)
    _topup(w, cid, 800)
    rec = _record(w, cid, 500)
    register_before, revenue_before = _register_balance(w), _revenue(w)

    paid = _pay(w, rec["id"], [(w.account, 500)])
    assert paid["record"]["paymentStatus"] == "paid"
    assert _balance(w, cid) == 300
    assert _register_balance(w) == register_before
    assert _revenue(w) == revenue_before + 500

    receipt = next(
        r
        for r in w.s.api.get("/finances/receipts", token=w.s.su, salon=w.s.id)
        if r["id"] == paid["receipt"]["id"]
    )
    assert receipt["cashRegister"] is None  # чек целиком со счёта — без кассы
    assert receipt["payments"][0]["methodType"] == "account"
    ops = w.s.api.get("/finances/operations", token=w.s.su, salon=w.s.id)
    op = next(o for o in ops if o["receiptId"] == receipt["id"])
    assert op["cashRegister"] is None and op["type"] == "income"

    history = w.s.api.get(f"/clients/{cid}/account/transactions", token=w.s.su, salon=w.s.id)
    payment = history[0]
    assert payment["type"] == "payment" and Decimal(str(payment["amount"])) == -500
    assert payment["receiptId"] == receipt["id"] and payment["recordId"] == rec["id"]


def test_underpayment_becomes_debt(w: World) -> None:
    """Визит 1000: наличными 400, со счёта 600 при балансе 0 → долг −600; пополнение 600 → 0."""
    cid = _client(w)
    rec = _record(w, cid, 1000)
    register_before = _register_balance(w)
    _pay(w, rec["id"], [(w.cash, 400), (w.account, 600)])
    assert _balance(w, cid) == -600
    assert _register_balance(w) == register_before + 400
    _topup(w, cid, 600)
    assert _balance(w, cid) == 0


def test_topup_in_one_salon_pay_in_another(w: World) -> None:
    cid = _client(w)
    _topup(w, cid, 300, salon=w.main_id)
    rec = _record(w, cid, 300)
    _pay(w, rec["id"], [(w.account, 300)])
    assert _balance(w, cid) == 0
    history = w.s.api.get(f"/clients/{cid}/account/transactions", token=w.s.su, salon=w.s.id)
    assert {t["type"]: t["salon"]["id"] for t in history} == {
        "topup": w.main_id,
        "payment": w.s.id,
    }


def test_parallel_payments_from_one_account(w: World) -> None:
    cid = _client(w)
    _topup(w, cid, 600)
    records = [_record(w, cid, 500), _record(w, cid, 500)]
    errors: list[BaseException] = []

    def pay(record_id: str) -> None:
        try:
            _pay(w, record_id, [(w.account, 500)])
        except BaseException as exc:  # noqa: BLE001 — собрать ошибки потоков
            errors.append(exc)

    threads = [threading.Thread(target=pay, args=(r["id"],)) for r in records]
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    assert not errors
    assert _balance(w, cid) == -400
    assert sum(a for _, a in _journal(cid)) == -400


def test_retry_with_same_key_is_one_operation(w: World) -> None:
    cid = _client(w)
    _topup(w, cid, 500)
    rec = _record(w, cid, 500)
    key = {"Idempotency-Key": uuid.uuid4().hex}
    first = _pay(w, rec["id"], [(w.account, 500)], headers=key)
    again = _pay(w, rec["id"], [(w.account, 500)], headers=key)
    assert first["receipt"]["id"] == again["receipt"]["id"]
    assert [t for t, _ in _journal(cid)] == ["topup", "payment"]
    # Без ключа повтор — обычная ошибка «уже оплачено», без списания
    _pay(w, rec["id"], [(w.account, 500)], expect=409)
    assert _balance(w, cid) == 0


def test_shard_failure_reverses_master(w: World, monkeypatch: pytest.MonkeyPatch) -> None:
    from app.services import visits

    cid = _client(w)
    _topup(w, cid, 200)
    rec = _record(w, cid, 500)

    def boom(*args: Any, **kwargs: Any) -> None:
        raise RuntimeError("shard down")

    monkeypatch.setattr(visits, "write_receipt_audit", boom)
    _pay(w, rec["id"], [(w.account, 500)], expect=500)
    monkeypatch.undo()

    assert _balance(w, cid) == 200
    assert [t for t, _ in _journal(cid)] == ["topup", "payment", "reversal"]
    one = w.s.api.get(f"/records/{rec['id']}", token=w.s.su, salon=w.s.id)
    assert one["paymentStatus"] == "unpaid"
    # Запись можно оплатить заново
    _pay(w, rec["id"], [(w.account, 500)])
    assert _balance(w, cid) == -300


def test_reconciliation_reverses_hanging_payment(w: World) -> None:
    """Процесс упал между Master и шардом: ночная сверка сторнирует списание без чека."""
    from sqlalchemy import update

    from app.models.master import AccountTransaction, TransactionType
    from app.services import ledger, payments
    from workers import db
    from workers.tasks import integrity

    cid = uuid.UUID(_client(w))
    salon_id = uuid.UUID(w.s.id)
    old_receipt, fresh_receipt = uuid.uuid4(), uuid.uuid4()
    with db.master_session() as session:
        for receipt_id in (old_receipt, fresh_receipt):
            account = ledger.lock_money_account(session, cid)
            ledger.post(
                session,
                account,
                type=TransactionType.PAYMENT,
                amount=Decimal(-100),
                key=payments.payment_key(salon_id, receipt_id, "account"),
                meta=ledger.Meta(salon_id=salon_id, receipt_id=receipt_id),
            )
        session.execute(
            update(AccountTransaction)
            .where(AccountTransaction.receipt_id == old_receipt)
            .values(created_at=datetime.now(UTC) - timedelta(hours=2))
        )
        session.commit()

    assert integrity.reconcile_payments(salon_id) == 1
    assert integrity.reconcile_payments(salon_id) == 0  # повтор ничего не делает
    assert _balance(w, str(cid)) == -100  # свежее списание не тронуто
    assert [t for t, _ in _journal(str(cid))] == ["payment", "payment", "reversal"]


def test_cancel_receipt_returns_money(w: World, eager: None) -> None:
    cid = _client(w)
    _topup(w, cid, 100)
    rec = _record(w, cid, 400)
    paid = _pay(w, rec["id"], [(w.account, 400)])
    assert _balance(w, cid) == -300

    w.s.api.post(f"/finances/receipts/{paid['receipt']['id']}/cancel", token=w.s.su, salon=w.s.id)
    _publish()
    assert _balance(w, cid) == 100
    _publish()  # повторная доставка события ничего не меняет
    assert [t for t, _ in _journal(cid)] == ["topup", "payment", "reversal"]
    one = w.s.api.get(f"/records/{rec['id']}", token=w.s.su, salon=w.s.id)
    assert one["paymentStatus"] == "unpaid"


def test_system_payment_methods(w: World) -> None:
    api, s = w.s.api, w.s
    methods = api.get("/finances/payment-methods", token=s.su, salon=s.id)
    system = {m["type"]: m for m in methods if m["isSystem"]}
    assert set(system) == {"account", "bonus"}
    assert all(m["cashRegisterId"] is None and not m["availableOnline"] for m in system.values())
    api.patch(
        f"/finances/payment-methods/{system['account']['id']}",
        token=s.su,
        salon=s.id,
        expect=409,
        json={"cashRegisterId": w.register["id"]},
    )
    api.post(
        "/finances/payment-methods",
        token=s.su,
        salon=s.id,
        expect=422,
        json={"name": "Ще один рахунок", "type": "account"},
    )
    api.patch(
        f"/finances/payment-methods/{w.cash['id']}",
        token=s.su,
        salon=s.id,
        expect=422,
        json={"type": "bonus"},
    )
    # Для приёма оплаты администратору видны и системные способы
    admin_methods = {
        m["type"] for m in api.get("/payment-methods", token=w.admin_token, salon=s.id)
    }
    assert {"cash", "account", "bonus"} <= admin_methods


def test_sale_without_record(w: World) -> None:
    api, s = w.s.api, w.s
    cid = _client(w)
    body = {"payments": [{"paymentMethodId": w.account["id"], "amount": 150}]}
    # Администратор проводит продажу; со счёта — только с клиентом
    api.post("/finances/receipts", token=w.admin_token, salon=s.id, expect=422, json=body)
    receipt = api.post(
        "/finances/receipts",
        token=w.admin_token,
        salon=s.id,
        expect=201,
        json={**body, "clientId": cid},
    )
    assert receipt["cashRegister"] is None and receipt["client"]["name"] == "Клієнт"
    assert _balance(w, cid) == -150
    api.post(
        "/finances/receipts",
        token=w.master_token,
        salon=s.id,
        expect=403,
        json={**body, "clientId": cid},
    )
    # Остальное в финансах администратору по-прежнему закрыто
    api.get("/finances/receipts", token=w.admin_token, salon=s.id, expect=403)


def test_master_cannot_pay(w: World) -> None:
    cid = _client(w)
    rec = _record(w, cid, 100)
    _pay(w, rec["id"], [(w.account, 100)], token=w.master_token, expect=403)
