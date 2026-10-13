"""Особовий рахунок: пополнение, возврат, корректировка, идемпотентность, права, блокировки."""

import threading
import uuid
from dataclasses import dataclass
from decimal import Decimal
from typing import Any

import pytest

from tests.conftest import Salon, phone


@dataclass
class World:
    s: Salon
    main_id: str
    admin: dict[str, Any]
    admin_token: str
    master: dict[str, Any]
    master_token: str


@pytest.fixture(scope="module")
def w(new_salon: Salon) -> World:
    s = new_salon
    admin, admin_token = s.create_staff(role="administrator", firstName="Адмін")
    master, master_token = s.create_staff(firstName="Майстер")
    return World(s, s.api.salon_id(s.su, "main"), admin, admin_token, master, master_token)


def _client(w: World) -> str:
    return w.s.api.post(
        "/clients",
        token=w.s.su,
        salon=w.s.id,
        expect=201,
        json={"firstName": "Клієнт", "phone": phone()},
    )["id"]


def _balance(w: World, client_id: str, salon: str | None = None) -> Decimal:
    data = w.s.api.get(f"/clients/{client_id}/account", token=w.s.su, salon=salon or w.s.id)
    return Decimal(str(data["balance"]))


def test_topup_refund_and_history(w: World) -> None:
    api, s = w.s.api, w.s
    cid = _client(w)
    assert _balance(w, cid) == 0  # счёта ещё нет

    txn = api.post(
        f"/clients/{cid}/account/topups",
        token=w.admin_token,
        salon=s.id,
        expect=201,
        json={"amount": 800, "staffId": w.master["id"], "comment": "Готівкою"},
    )
    assert txn["type"] == "topup" and Decimal(str(txn["balanceAfter"])) == 800
    assert txn["staff"]["name"] == "Майстер" and txn["author"]["name"] == "Адмін"
    assert txn["salon"]["id"] == s.id and txn["salon"]["name"].startswith("Салон")

    api.post(
        f"/clients/{cid}/account/refunds",
        token=w.admin_token,
        salon=s.id,
        expect=409,
        json={"amount": 900},
    )
    api.post(
        f"/clients/{cid}/account/refunds",
        token=w.admin_token,
        salon=s.id,
        expect=201,
        json={"amount": 300},
    )
    assert _balance(w, cid) == 500

    history = api.get(f"/clients/{cid}/account/transactions", token=s.su, salon=s.id)
    assert [(t["type"], Decimal(str(t["amount"]))) for t in history] == [
        ("refund", Decimal(-300)),
        ("topup", Decimal(800)),
    ]
    only_topups = api.get(f"/clients/{cid}/account/transactions?type=topup", token=s.su, salon=s.id)
    assert len(only_topups) == 1

    # Пополнение — только Master DB: в кассах и операциях салона ничего не появилось
    assert api.get("/finances/operations", token=s.su, salon=s.id) == []


def test_account_is_shared_by_salons(w: World) -> None:
    """Пополнил в одном салоне — баланс тот же в другом."""
    cid = _client(w)
    w.s.api.post(
        f"/clients/{cid}/account/topups",
        token=w.s.su,
        salon=w.main_id,
        expect=201,
        json={"amount": 250},
    )
    assert _balance(w, cid, salon=w.s.id) == 250


def test_refund_cannot_touch_debt(w: World) -> None:
    api, s = w.s.api, w.s
    cid = _client(w)
    api.post(
        f"/clients/{cid}/account/adjustments",
        token=s.su,
        salon=s.id,
        expect=201,
        json={"amount": -200, "comment": "Борг зі старої CRM"},
    )
    assert _balance(w, cid) == -200
    api.post(
        f"/clients/{cid}/account/refunds", token=s.su, salon=s.id, expect=409, json={"amount": 1}
    )
    # Пополнение сначала гасит долг
    api.post(
        f"/clients/{cid}/account/topups", token=s.su, salon=s.id, expect=201, json={"amount": 300}
    )
    assert _balance(w, cid) == 100


def test_adjustment_rules(w: World) -> None:
    api, s = w.s.api, w.s
    cid = _client(w)
    body = {"amount": 50, "comment": "Компенсація"}
    api.post(
        f"/clients/{cid}/account/adjustments",
        token=w.admin_token,
        salon=s.id,
        expect=403,
        json=body,
    )
    api.post(
        f"/clients/{cid}/account/adjustments",
        token=s.su,
        salon=s.id,
        expect=422,
        json={"amount": 50, "comment": ""},
    )
    api.post(
        f"/clients/{cid}/account/adjustments",
        token=s.su,
        salon=s.id,
        expect=409,
        json={"amount": 0, "comment": "нуль"},
    )
    txn = api.post(
        f"/clients/{cid}/account/adjustments", token=s.su, salon=s.id, expect=201, json=body
    )
    assert txn["type"] == "adjustment" and txn["comment"] == "Компенсація"


def test_idempotency_key(w: World) -> None:
    api, s = w.s.api, w.s
    cid = _client(w)
    key = {"Idempotency-Key": uuid.uuid4().hex}
    first = api.post(
        f"/clients/{cid}/account/topups",
        token=s.su,
        salon=s.id,
        expect=201,
        json={"amount": 100},
        headers=key,
    )
    again = api.post(
        f"/clients/{cid}/account/topups",
        token=s.su,
        salon=s.id,
        expect=201,
        json={"amount": 100},
        headers=key,
    )
    assert first["id"] == again["id"]
    assert _balance(w, cid) == 100


def test_master_rights(w: World) -> None:
    api, s = w.s.api, w.s
    cid = _client(w)
    # Чужой клиент мастеру не виден
    api.get(f"/clients/{cid}/account", token=w.master_token, salon=s.id, expect=404)
    api.post(
        f"/clients/{cid}/account/topups",
        token=w.master_token,
        salon=s.id,
        expect=403,
        json={"amount": 100},
    )
    api.post(
        f"/clients/{cid}/account/refunds",
        token=w.master_token,
        salon=s.id,
        expect=403,
        json={"amount": 1},
    )
    api.get("/finances/client-balances", token=w.admin_token, salon=s.id, expect=403)


def test_clients_list_balance_and_report(w: World) -> None:
    api, s = w.s.api, w.s
    debtor, depositor = _client(w), _client(w)
    api.post(
        f"/clients/{debtor}/account/adjustments",
        token=s.su,
        salon=s.id,
        expect=201,
        json={"amount": -70, "comment": "борг"},
    )
    api.post(
        f"/clients/{depositor}/account/topups",
        token=s.su,
        salon=s.id,
        expect=201,
        json={"amount": 90},
    )

    debtors = api.get("/clients?balance=debt&perPage=200", token=s.su, salon=s.id)
    assert debtor in {c["id"] for c in debtors} and depositor not in {c["id"] for c in debtors}
    assert all(Decimal(str(c["accountBalance"])) < 0 for c in debtors)
    deposits = api.get("/clients?balance=deposit&perPage=200", token=s.su, salon=s.id)
    assert depositor in {c["id"] for c in deposits}
    one = api.get(f"/clients/{debtor}", token=s.su, salon=s.id)
    assert Decimal(str(one["accountBalance"])) == -70

    report = api.get("/finances/client-balances?perPage=200", token=s.su, salon=s.id)
    assert Decimal(str(report["totalDebts"])) >= 70 and report["debtorsCount"] >= 1
    assert Decimal(str(report["totalDeposits"])) >= 90
    by_id = {i["clientId"]: Decimal(str(i["balance"])) for i in report["items"]}
    assert by_id[debtor] == -70 and by_id[depositor] == 90
    only_debts = api.get("/finances/client-balances?kind=debt&perPage=200", token=s.su, salon=s.id)
    assert all(Decimal(str(i["balance"])) < 0 for i in only_debts["items"])


def test_parallel_operations_keep_balance_consistent(w: World) -> None:
    """Параллельные операции по одному счёту: баланс = сумма журнала, ничего не потеряно."""
    from sqlalchemy import func, select

    from app.models.master import AccountTransaction
    from app.services import ledger
    from workers import db

    cid = uuid.UUID(_client(w))
    errors: list[BaseException] = []

    def worker(i: int) -> None:
        try:
            with db.master_session() as session:
                ledger.topup(
                    session, cid, Decimal(10), key=f"test-par:{cid}:{i}", meta=ledger.Meta()
                )
                session.commit()
        except BaseException as exc:  # noqa: BLE001 — собрать ошибки потоков
            errors.append(exc)

    threads = [threading.Thread(target=worker, args=(i,)) for i in range(12)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    assert not errors

    with db.master_session() as session:
        account = ledger.find_money_account(session, cid)
        assert account is not None and account.balance == 120
        journal = session.scalar(
            select(func.sum(AccountTransaction.amount)).where(
                AccountTransaction.account_id == account.id
            )
        )
        assert journal == 120
        # balance_after — монотонная цепочка без пропусков
        afters = sorted(
            session.scalars(
                select(AccountTransaction.balance_after).where(
                    AccountTransaction.account_id == account.id
                )
            )
        )
        assert afters == [Decimal(10 * i) for i in range(1, 13)]
