"""Подарочные сертификаты (backend/docs/certificates.md).

Этап 1: шаблоны (суперюзер), системный способ оплаты «Сертифікат», миграция шарда.
Этап 2: продажа — строки вне скидки и кешбэка, выпуск в settle, компенсация, сверка.
Этап 3: погашение — проверки, область «на послуги», без income, сторно, сверка.
Этап 4: сгорание по сроку, отмена чека покупки, реестр и аннулирование.
"""

import re
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

TEMPLATES = "/certificates/templates"


@dataclass
class World:
    s: Salon
    place: Place
    manicure: dict[str, Any]
    admin_token: str


@pytest.fixture(scope="module")
def w(new_salon: Salon) -> World:
    s = new_salon
    place = setup_place(s.api, s.id, s.su)
    manicure = place.service(150, "Манікюр з покриттям")
    _, admin_token = s.create_staff(role="administrator")
    return World(s, place, manicure, admin_token)


def _shard_dsn(salon_id: str) -> str:
    import cli
    from app.models.master import Salon as SalonModel

    with cli._master_session() as session:
        info = cli._conn_info(session.get(SalonModel, salon_id))
    return info.build_dsn(driver="psycopg")


# --- Шаблоны -------------------------------------------------------------------------


def test_templates_superuser_only(w: World) -> None:
    api, s = w.s.api, w.s
    body = {"name": "1000 грн (гроші на рахунку)", "amount": 1000}
    api.post(TEMPLATES, token=w.admin_token, salon=s.id, expect=403, json=body)
    created = api.post(TEMPLATES, token=s.su, salon=s.id, expect=201, json=body)
    assert created["scope"] == "any"
    assert created["validDays"] is None
    assert created["services"] == []
    # Администратор видит шаблоны — он продаёт сертификаты
    listed = api.get(TEMPLATES, token=w.admin_token, salon=s.id)
    assert created["id"] in [t["id"] for t in listed]
    api.patch(
        f"{TEMPLATES}/{created['id']}",
        token=w.admin_token,
        salon=s.id,
        expect=403,
        json={"isActive": False},
    )


def test_template_validation(w: World) -> None:
    api, s = w.s.api, w.s
    base = {"name": "Х", "amount": 100}
    api.post(TEMPLATES, token=s.su, salon=s.id, expect=422, json={**base, "amount": 0})
    api.post(TEMPLATES, token=s.su, salon=s.id, expect=422, json={**base, "validDays": 0})
    # «На послуги» без услуг
    api.post(TEMPLATES, token=s.su, salon=s.id, expect=422, json={**base, "scope": "services"})
    # Услуги нет в салоне
    api.post(
        TEMPLATES,
        token=s.su,
        salon=s.id,
        expect=422,
        json={
            **base,
            "scope": "services",
            "services": [{"salonId": s.id, "serviceId": str(uuid.uuid4())}],
        },
    )
    # Услуга есть, но в другом салоне
    main_id = api.salon_id(s.su, "main")
    api.post(
        TEMPLATES,
        token=s.su,
        salon=s.id,
        expect=422,
        json={
            **base,
            "scope": "services",
            "services": [{"salonId": main_id, "serviceId": w.manicure["id"]}],
        },
    )
    # Салона нет
    api.post(
        TEMPLATES,
        token=s.su,
        salon=s.id,
        expect=422,
        json={
            **base,
            "scope": "services",
            "services": [{"salonId": str(uuid.uuid4()), "serviceId": w.manicure["id"]}],
        },
    )


def test_template_services_and_patch(w: World) -> None:
    api, s = w.s.api, w.s
    pair = {"salonId": s.id, "serviceId": w.manicure["id"]}
    t = api.post(
        TEMPLATES,
        token=s.su,
        salon=s.id,
        expect=201,
        json={
            "name": "На манікюр з покриттям 150 грн",
            "amount": 150,
            "scope": "services",
            "validDays": 90,
            "services": [pair],
        },
    )
    assert t["services"] == [pair]
    assert t["validDays"] == 90
    url = f"{TEMPLATES}/{t['id']}"

    # Срок можно снять — бессрочный; номинал и название меняются
    t = api.patch(url, token=s.su, salon=s.id, json={"validDays": None, "amount": "200.00"})
    assert t["validDays"] is None
    assert t["amount"] == "200.00"
    api.patch(url, token=s.su, salon=s.id, expect=422, json={"name": None})
    # Очистить услуги у «на послуги» нельзя
    api.patch(url, token=s.su, salon=s.id, expect=422, json={"services": []})
    # «На все» — услуги не хранит
    t = api.patch(url, token=s.su, salon=s.id, json={"scope": "any"})
    assert t["services"] == []
    # Обратно в «на послуги» — только с услугами
    api.patch(url, token=s.su, salon=s.id, expect=422, json={"scope": "services"})
    t = api.patch(url, token=s.su, salon=s.id, json={"scope": "services", "services": [pair]})
    assert t["services"] == [pair]

    # Скрыть шаблон
    t = api.patch(url, token=s.su, salon=s.id, json={"isActive": False})
    assert t["isActive"] is False

    changes = api.get(
        "/audit", token=s.su, salon=s.id, params={"entity": "certificate", "perPage": 50}
    )
    mine = [c for c in changes if c["entityId"] == t["id"]]
    assert {c["action"] for c in mine} == {"created", "updated"}


# --- Системный способ оплаты ---------------------------------------------------------


def test_system_certificate_method(w: World) -> None:
    api, s = w.s.api, w.s
    methods = api.get("/finances/payment-methods", token=s.su, salon=s.id)
    cert = [m for m in methods if m["type"] == "certificate"]
    assert len(cert) == 1
    assert cert[0]["isSystem"] is True
    assert cert[0]["cashRegisterId"] is None
    assert cert[0]["availableOnline"] is False
    # Виден администратору в способах оплаты визита
    admin_methods = api.get("/payment-methods", token=w.admin_token, salon=s.id)
    assert cert[0]["id"] in [m["id"] for m in admin_methods]

    # Второй «Сертифікат» не создать, обычный способ в него не превратить, системный не править
    register_id = w.place.methods["cash"]["cashRegisterId"]
    api.post(
        "/finances/payment-methods",
        token=s.su,
        salon=s.id,
        expect=422,
        json={"name": "Сертифікат 2", "type": "certificate", "cashRegisterId": register_id},
    )
    api.patch(
        f"/finances/payment-methods/{w.place.methods['cash']['id']}",
        token=s.su,
        salon=s.id,
        expect=422,
        json={"type": "certificate"},
    )
    api.patch(
        f"/finances/payment-methods/{cert[0]['id']}",
        token=s.su,
        salon=s.id,
        expect=409,
        json={"name": "Інше"},
    )


def test_migration_turns_user_certificate_methods_into_other(new_salon: Salon) -> None:
    """Созданные вручную способы типа certificate (с кассой) → other, системный создаётся."""
    from alembic import command

    import cli

    engine = create_engine(_shard_dsn(new_salon.id))
    cfg = cli._alembic_cfg("shard")
    try:
        with engine.begin() as conn:
            cfg.attributes["connection"] = conn
            command.downgrade(cfg, "64481c259800")
        with engine.begin() as conn:
            assert (
                conn.scalar(text("SELECT count(*) FROM payment_methods WHERE type = 'certificate'"))
                == 0
            )
            register_id = conn.scalar(
                text(
                    "INSERT INTO cash_registers (id, name, is_active) VALUES "
                    "(gen_random_uuid(), 'Каса сертифікатів', true) RETURNING id"
                )
            )
            old_id = conn.scalar(
                text(
                    "INSERT INTO payment_methods (id, name, type, cash_register_id, "
                    "commission_type, commission_value, commission_payer, available_online, "
                    "allow_partial_payment, allow_tips, sort_order, is_active) VALUES "
                    "(gen_random_uuid(), 'Сертифікат (старий)', 'certificate', :reg, 'none', 0, "
                    "'salon', false, true, false, 0, true) RETURNING id"
                ),
                {"reg": register_id},
            )
        with engine.begin() as conn:
            cfg.attributes["connection"] = conn
            command.upgrade(cfg, "head")
        with engine.connect() as conn:
            old = conn.execute(
                text("SELECT type, cash_register_id FROM payment_methods WHERE id = :id"),
                {"id": old_id},
            ).one()
            assert old.type == "other"
            assert old.cash_register_id == register_id
            system = conn.execute(
                text("SELECT cash_register_id FROM payment_methods WHERE type = 'certificate'")
            ).all()
            assert len(system) == 1
            assert system[0].cash_register_id is None
    finally:
        engine.dispose()


def test_account_checks() -> None:
    """client_id обязателен для money и cashback; certificate_id — ровно у certificate."""
    from sqlalchemy.exc import IntegrityError

    import cli
    from app.models.master import AccountKind, ClientAccount

    for kind in (AccountKind.MONEY, AccountKind.CASHBACK, AccountKind.CERTIFICATE):
        with cli._master_session() as session:
            session.add(ClientAccount(client_id=None, kind=kind, balance=0))
            with pytest.raises(IntegrityError):
                session.flush()


# --- Этап 2: продажа -----------------------------------------------------------------


def _template(w: World, amount: float, **fields: Any) -> dict[str, Any]:
    return w.s.api.post(
        TEMPLATES,
        token=w.s.su,
        salon=w.s.id,
        expect=201,
        json={"name": f"Сертифікат {amount} ₴ {uuid.uuid4().hex[:4]}", "amount": amount, **fields},
    )


def _sold(w: World, receipt_id: str) -> list[dict[str, Any]]:
    return w.s.api.get(f"/receipts/{receipt_id}/certificates", token=w.admin_token, salon=w.s.id)


def _incomes(w: World, receipt_id: str) -> list[tuple[str, Decimal]]:
    """Приходные операции чека: (категория, сумма), по сумме."""
    engine = create_engine(_shard_dsn(w.s.id))
    try:
        with engine.connect() as conn:
            rows = conn.execute(
                text(
                    "SELECT category, amount FROM finance_operations "
                    "WHERE receipt_id = :id AND type = 'income' ORDER BY category, amount"
                ),
                {"id": receipt_id},
            ).all()
    finally:
        engine.dispose()
    return [(r.category, r.amount) for r in rows]


def _certificate_lines(w: World, receipt_id: str) -> list[tuple[str, Decimal, Any]]:
    engine = create_engine(_shard_dsn(w.s.id))
    try:
        with engine.connect() as conn:
            rows = conn.execute(
                text(
                    "SELECT name, amount, certificate_id FROM receipt_certificate_lines "
                    "WHERE receipt_id = :id"
                ),
                {"id": receipt_id},
            ).all()
    finally:
        engine.dispose()
    return [(r.name, r.amount, r.certificate_id) for r in rows]


def _journal(certificate_id: str) -> list[tuple[str, Decimal]]:
    import cli
    from app.models.master import AccountTransaction
    from app.services import certificates

    with cli._master_session() as session:
        account = certificates.account_of(session, uuid.UUID(certificate_id))
        assert account is not None
        return [
            (t.type.value, t.amount)
            for t in session.scalars(
                select(AccountTransaction)
                .where(AccountTransaction.account_id == account.id)
                .order_by(AccountTransaction.created_at)
            )
        ]


def _card_holder(w: World, *, discount: int = 0) -> str:
    """Клиент с картой 5 % кешбэка (услуги и товары) и личной скидкой."""
    s = w.s
    card_type = s.api.post(
        "/loyalty/card-types",
        token=s.su,
        salon=s.id,
        expect=201,
        json={"name": f"Тип {uuid.uuid4().hex[:4]}", "salonIds": [s.id], "cashbackPercent": 5},
    )
    cid = new_client(w.place)
    s.api.post(
        f"/clients/{cid}/loyalty-cards",
        token=s.su,
        salon=s.id,
        expect=201,
        json={"cardTypeId": card_type["id"]},
    )
    if discount:
        s.api.patch(f"/clients/{cid}", token=s.su, salon=s.id, json={"discountPercent": discount})
    return cid


def test_visit_with_certificate(w: World, eager: None) -> None:
    """Сертификат в оплате визита: вне скидки и кешбэка, income делится, код выпущен."""
    p, s = w.place, w.s
    cid = _card_holder(w, discount=10)
    template = _template(w, 500, validDays=90)
    rec = p.record(cid, p.service(1000))

    preview = s.api.get(
        f"/records/{rec['id']}/checkout",
        token=w.admin_token,
        salon=s.id,
        params={"certificateTemplateIds": [template["id"]]},
    )
    assert money(preview["sold"]) == 1500
    assert money(preview["discountAmount"]) == 100  # 10 % только от услуги
    assert money(preview["total"]) == 1400
    assert money(preview["certificatesAmount"]) == 500
    assert [line["kind"] for line in preview["lines"]] == ["service", "certificate"]

    paid = p.pay(
        rec["id"],
        [("cash", 1400)],
        token=w.admin_token,
        extra={
            "certificates": [{"templateId": template["id"], "quantity": 1}],
            "expectedTotal": "1400",
        },
    )
    receipt_id = paid["receipt"]["id"]
    [cert] = _sold(w, receipt_id)
    assert re.fullmatch(r"ADL-[2-9A-HJKMNP-Z]{5}-[2-9A-HJKMNP-Z]{5}", cert["code"])
    assert cert["status"] == "issued"
    assert money(cert["balance"]) == 500
    assert cert["buyer"]["id"] == cid and cert["owner"] is None
    expires = datetime.fromisoformat(cert["expiresAt"])
    assert timedelta(days=89) < expires - datetime.now(UTC) <= timedelta(days=90)
    assert _journal(cert["id"]) == [("topup", Decimal(500))]
    # Одна кассовая часть 1400 → 500 «certificates» + 900 услуги; сумма income = деньги в кассе
    assert _incomes(w, receipt_id) == [
        ("certificates", Decimal(500)),
        ("services", Decimal(900)),
    ]
    assert _certificate_lines(w, receipt_id) == [
        (template["name"], Decimal(500), uuid.UUID(cert["id"]))
    ]

    # Кешбэк и «Продано» карты — только от визита: 5 % от 900
    publish()
    [card] = s.api.get(f"/clients/{cid}/loyalty-cards", token=s.su, salon=s.id)
    assert money(card["cashbackBalance"]) == 45
    assert money(card["soldTotal"]) == 1000


def test_certificate_only_for_register_methods(w: World) -> None:
    """Сертификат не покупают со счёта или кешбэком: они покрывают только остальную часть."""
    p, s = w.place, w.s
    cid = new_client(p)
    s.api.post(
        f"/clients/{cid}/account/topups", token=s.su, salon=s.id, expect=201, json={"amount": 2000}
    )
    template = _template(w, 500)
    certs = {"certificates": [{"templateId": template["id"]}]}
    rec = p.record(cid, p.service(300))
    p.pay(rec["id"], [("account", 400), ("cash", 400)], extra=certs, expect=409)
    paid = p.pay(rec["id"], [("account", 300), ("cash", 500)], extra=certs)
    assert len(_sold(w, paid["receipt"]["id"])) == 1
    assert _incomes(w, paid["receipt"]["id"]) == [
        ("certificates", Decimal(500)),
        ("services", Decimal(300)),
    ]

    # Продажа без записи из одних сертификатов — только кассой
    sale = {
        "clientId": cid,
        "subtotal": 0,
        "payments": [{"paymentMethodId": p.methods["account"]["id"], "amount": 500}],
        **certs,
    }
    s.api.post("/finances/receipts", token=s.su, salon=s.id, expect=422, json=sale)


def test_sale_without_record(w: World) -> None:
    """Чек без записи и без клиента: 2 шт. — два кода; скрытый шаблон не продаётся."""
    p, s = w.place, w.s
    template = _template(w, 250)
    body = {
        "subtotal": 100,
        "payments": [{"paymentMethodId": p.methods["cash"]["id"], "amount": 600}],
        "certificates": [{"templateId": template["id"], "quantity": 2}],
        "expectedTotal": "600",
    }
    preview = s.api.get(
        "/finances/receipts/checkout",
        token=w.admin_token,
        salon=s.id,
        params={"subtotal": 100, "certificateTemplateIds": [template["id"]] * 2},
    )
    assert money(preview["total"]) == 600 and money(preview["certificatesAmount"]) == 500
    receipt = s.api.post(
        "/finances/receipts", token=w.admin_token, salon=s.id, expect=201, json=body
    )
    assert money(receipt["subtotal"]) == 600
    sold = _sold(w, receipt["id"])
    assert len(sold) == 2 and sold[0]["code"] != sold[1]["code"]
    assert all(c["buyer"] is None for c in sold)
    assert _incomes(w, receipt["id"]) == [("certificates", Decimal(500)), ("sales", Decimal(100))]

    # Только сертификаты, без товаров
    only = {**body, "subtotal": 0, "expectedTotal": "500"}
    only["payments"] = [{"paymentMethodId": p.methods["cash"]["id"], "amount": 500}]
    receipt = s.api.post("/finances/receipts", token=s.su, salon=s.id, expect=201, json=only)
    assert _incomes(w, receipt["id"]) == [("certificates", Decimal(500))]

    s.api.patch(f"{TEMPLATES}/{template['id']}", token=s.su, salon=s.id, json={"isActive": False})
    s.api.post("/finances/receipts", token=s.su, salon=s.id, expect=422, json=only)


def test_issue_is_idempotent(w: World) -> None:
    """Повтор оплаты с тем же Idempotency-Key — тот же чек и те же сертификаты."""
    p, s = w.place, w.s
    template = _template(w, 300)
    body = {
        "payments": [{"paymentMethodId": p.methods["cash"]["id"], "amount": 600}],
        "certificates": [{"templateId": template["id"], "quantity": 2}],
    }
    key = {"Idempotency-Key": f"cert-{uuid.uuid4()}"}
    first = s.api.post(
        "/finances/receipts", token=s.su, salon=s.id, expect=201, json=body, headers=key
    )
    again = s.api.post(
        "/finances/receipts", token=s.su, salon=s.id, expect=201, json=body, headers=key
    )
    assert first["id"] == again["id"]
    assert len(_sold(w, first["id"])) == 2

    # Сбой между Master и шардом с повтором выпуска в той же транзакции: ключи те же
    import cli
    from app.services import certificates

    issues = [
        certificates.Issue(
            line=0,
            n=n,
            template_id=uuid.UUID(template["id"]),
            name=template["name"],
            amount=Decimal(300),
            scope=certificates.CertificateScope.ANY,
            valid_days=None,
        )
        for n in (1, 2)
    ]
    with cli._master_session() as session:
        repeated = certificates.issue(
            session,
            salon_id=uuid.UUID(s.id),
            receipt_id=uuid.UUID(first["id"]),
            buyer_client_id=None,
            issues=issues,
            meta=certificates.ledger.Meta(),
        )
    assert {str(i.certificate_id) for i in repeated} == {c["id"] for c in _sold(w, first["id"])}


def test_shard_failure_cancels_issue(w: World, monkeypatch: pytest.MonkeyPatch) -> None:
    """Чек в шарде не записан — выпуск откатывается сторно, повтор с тем же ключом — ошибка."""
    from app.services import payments, visits

    p, s = w.place, w.s
    template = _template(w, 400)
    body = {
        "payments": [{"paymentMethodId": p.methods["cash"]["id"], "amount": 400}],
        "certificates": [{"templateId": template["id"]}],
    }
    key = f"cert-{uuid.uuid4()}"

    def boom(*args: Any, **kwargs: Any) -> None:
        raise RuntimeError("shard down")

    monkeypatch.setattr(visits, "write_receipt_audit", boom)
    s.api.post(
        "/finances/receipts",
        token=s.su,
        salon=s.id,
        expect=500,
        json=body,
        headers={"Idempotency-Key": key},
    )
    monkeypatch.undo()

    receipt_id = payments.receipt_id_for(uuid.UUID(s.id), key)
    [cert] = _master_certificates(receipt_id)
    assert cert.status.value == "cancelled"
    assert _journal(str(cert.id)) == [("topup", Decimal(400)), ("reversal", Decimal(-400))]
    s.api.post(
        "/finances/receipts",
        token=s.su,
        salon=s.id,
        expect=422,
        json=body,
        headers={"Idempotency-Key": key},
    )
    # С новым ключом продажа проходит
    receipt = s.api.post("/finances/receipts", token=s.su, salon=s.id, expect=201, json=body)
    assert [c["status"] for c in _sold(w, receipt["id"])] == ["issued"]


def _master_certificates(receipt_id: uuid.UUID) -> list[Any]:
    import cli
    from app.models.master import Certificate

    with cli._master_session() as session:
        return list(
            session.scalars(select(Certificate).where(Certificate.sold_receipt_id == receipt_id))
        )


def test_reconciliation_cancels_certificates_without_receipt(w: World) -> None:
    """Процесс упал между Master и шардом: сверка отменяет сертификаты, чьего чека нет."""
    from app.models.master import Certificate
    from app.services import certificates, ledger
    from workers import db
    from workers.tasks import integrity

    template = _template(w, 200)
    salon_id = uuid.UUID(w.s.id)
    old_receipt, fresh_receipt = uuid.uuid4(), uuid.uuid4()
    issue = certificates.Issue(
        line=0,
        n=1,
        template_id=uuid.UUID(template["id"]),
        name=template["name"],
        amount=Decimal(200),
        scope=certificates.CertificateScope.ANY,
        valid_days=None,
    )
    with db.master_session() as session:
        for receipt_id in (old_receipt, fresh_receipt):
            certificates.issue(
                session,
                salon_id=salon_id,
                receipt_id=receipt_id,
                buyer_client_id=None,
                issues=[issue],
                meta=ledger.Meta(salon_id=salon_id, receipt_id=receipt_id),
            )
        session.execute(
            update(Certificate)
            .where(Certificate.sold_receipt_id == old_receipt)
            .values(created_at=datetime.now(UTC) - timedelta(hours=2))
        )
        session.commit()

    assert integrity.reconcile_payments(salon_id) == 1
    assert integrity.reconcile_payments(salon_id) == 0  # повтор ничего не делает
    [old] = _master_certificates(old_receipt)
    [fresh] = _master_certificates(fresh_receipt)
    assert old.status.value == "cancelled" and old.cancel_reason == "Сторно: чек не записано"
    assert fresh.status.value == "issued"  # свежий не тронут: запрос мог ещё писать шард
    assert _journal(str(old.id)) == [("topup", Decimal(200)), ("reversal", Decimal(-200))]


def test_activation(w: World) -> None:
    """Активация — один раз: повтор на того же клиента ок, на другого — отказ."""
    p, s = w.place, w.s
    buyer, other = new_client(p, "Покупець"), new_client(p, "Інший")
    template = _template(w, 150)
    receipt = s.api.post(
        "/finances/receipts",
        token=s.su,
        salon=s.id,
        expect=201,
        json={
            "clientId": buyer,
            "subtotal": 0,
            "payments": [{"paymentMethodId": p.methods["cash"]["id"], "amount": 150}],
            "certificates": [{"templateId": template["id"]}],
        },
    )
    [cert] = _sold(w, receipt["id"])
    url = f"/certificates/{cert['id']}/activate"
    active = s.api.post(url, token=w.admin_token, salon=s.id, json={"clientId": buyer})
    assert active["status"] == "active"
    assert active["owner"]["id"] == buyer and active["activatedAt"]
    s.api.post(url, token=w.admin_token, salon=s.id, json={"clientId": buyer})
    s.api.post(url, token=w.admin_token, salon=s.id, expect=409, json={"clientId": other})
    s.api.post(
        f"/certificates/{uuid.uuid4()}/activate",
        token=w.admin_token,
        salon=s.id,
        expect=404,
        json={"clientId": buyer},
    )
    audit = s.api.get(
        "/audit", token=s.su, salon=s.id, params={"entity": "certificate", "perPage": 50}
    )
    assert any(a["entityId"] == cert["id"] for a in audit)


def test_cancel_purchase_receipt_cancels_certificates(w: World, eager: None) -> None:
    """Отмена чека покупки (сертификатом не пользовались): сертификаты аннулируются."""
    p, s = w.place, w.s
    template = _template(w, 350)
    receipt = s.api.post(
        "/finances/receipts",
        token=s.su,
        salon=s.id,
        expect=201,
        json={
            "subtotal": 0,
            "payments": [{"paymentMethodId": p.methods["cash"]["id"], "amount": 350}],
            "certificates": [{"templateId": template["id"]}],
        },
    )
    p.cancel(receipt["id"])
    publish()
    [cert] = _sold(w, receipt["id"])
    assert cert["status"] == "cancelled"
    assert money(cert["balance"]) == 0


# --- Этап 3: погашение ---------------------------------------------------------------


def _buy(w: World, amount: float, *, buyer: str | None = None, **fields: Any) -> dict[str, Any]:
    """Продать сертификат чеком без записи (наличными) — вернуть его."""
    p, s = w.place, w.s
    template = _template(w, amount, **fields)
    receipt = s.api.post(
        "/finances/receipts",
        token=s.su,
        salon=s.id,
        expect=201,
        json={
            **({"clientId": buyer} if buyer else {}),
            "subtotal": 0,
            "payments": [{"paymentMethodId": p.methods["cash"]["id"], "amount": amount}],
            "certificates": [{"templateId": template["id"]}],
        },
    )
    [cert] = _sold(w, receipt["id"])
    return {**cert, "receiptId": receipt["id"]}


def _parts(place: Place, parts: list[tuple[str, float, str | None]]) -> list[dict[str, Any]]:
    """[(тип способа, сумма, код сертификата)] → части оплаты API.

    Системный «Сертифікат» берём заново: тест миграции пересоздаёт его в этом салоне.
    """
    methods = {
        m["type"]: m
        for m in place.api.get("/payment-methods", token=place.su, salon=place.id)
        if m["type"] in ("account", "bonus", "certificate")
    }
    return [
        {
            "paymentMethodId": (methods.get(t) or place.methods[t])["id"],
            "amount": a,
            **({"certificateCode": code} if code else {}),
        }
        for t, a, code in parts
    ]


def _pay(
    place: Place,
    record_id: str,
    parts: list[tuple[str, float, str | None]],
    *,
    expect: int = 200,
    key: str | None = None,
) -> Any:
    return place.api.post(
        f"/records/{record_id}/payment",
        token=place.su,
        salon=place.id,
        expect=expect,
        json={"payments": _parts(place, parts)},
        headers={"Idempotency-Key": key} if key else {},
    )


def _certificate(w: World, certificate_id: str) -> Any:
    import cli
    from app.models.master import Certificate
    from app.services import certificates

    with cli._master_session() as session:
        cert = session.get(Certificate, uuid.UUID(certificate_id))
        assert cert is not None
        balances = certificates.balances(session, [cert.id])
        return {
            "status": cert.status.value,
            "owner": str(cert.owner_client_id) if cert.owner_client_id else None,
            "balance": balances[cert.id],
        }


@pytest.fixture(scope="module")
def other(w: World) -> Place:
    """Второй салон сети: сертификат действует во всех салонах (решение 8)."""
    return setup_place(w.s.api, w.s.api.salon_id(w.s.su, "main"), w.s.su)


def test_sale_plus_redemption_is_one_income(w: World, eager: None) -> None:
    """Выручка признаётся один раз — при продаже; погашение income не создаёт (решение 10)."""
    p, s = w.place, w.s
    cert = _buy(w, 500, buyer=new_client(p, "Покупець"))
    owner = _card_holder(w)
    rec = p.record(owner, p.service(300))
    paid = _pay(p, rec["id"], [("certificate", 300, cert["code"].lower().replace("-", " "))])
    receipt_id = paid["receipt"]["id"]

    assert _incomes(w, cert["receiptId"]) == [("certificates", Decimal(500))]
    assert _incomes(w, receipt_id) == []  # продажа + погашение = один income
    receipt = next(
        r for r in s.api.get("/finances/receipts", token=s.su, salon=s.id) if r["id"] == receipt_id
    )
    assert [(x["methodType"], money(x["amount"])) for x in receipt["payments"]] == [
        ("certificate", Decimal(300))
    ]
    # Неактивированный сертификат активирован на клиента чека
    assert _certificate(w, cert["id"]) == {
        "status": "active",
        "owner": owner,
        "balance": Decimal(200),
    }
    assert _journal(cert["id"]) == [("topup", Decimal(500)), ("payment", Decimal(-300))]
    # Кешбэк начисляется и на часть, оплаченную сертификатом (решение 12): 5 % от 300
    publish()
    [card] = s.api.get(f"/clients/{owner}/loyalty-cards", token=s.su, salon=s.id)
    assert money(card["cashbackBalance"]) == 15

    # Остаток тратится частями; ноль — «використано»
    _pay(
        p,
        p.record(owner, p.service(250))["id"],
        [("certificate", 200, cert["code"]), ("cash", 50, None)],
    )
    assert _certificate(w, cert["id"])["status"] == "spent"
    _pay(p, p.record(owner, p.service(10))["id"], [("certificate", 10, cert["code"])], expect=409)


def test_redemption_checks(w: World) -> None:
    """Чужой активный, без клиента, сверх остатка, истёкший, неизвестный код — отказ."""
    from sqlalchemy import update as sa_update

    import cli
    from app.models.master import Certificate

    p, s = w.place, w.s
    owner, stranger = new_client(p, "Власник"), new_client(p, "Чужий")
    cert = _buy(w, 300)
    s.api.post(
        f"/certificates/{cert['id']}/activate", token=s.su, salon=s.id, json={"clientId": owner}
    )
    rec = p.record(stranger, p.service(100))
    _pay(p, rec["id"], [("certificate", 100, cert["code"])], expect=409)  # решение 7
    _pay(p, rec["id"], [("certificate", 100, "ADL-22222-22222")], expect=409)
    _pay(p, rec["id"], [("certificate", 100, None)], expect=409)  # без кода

    mine = p.record(owner, p.service(400))
    _pay(p, mine["id"], [("certificate", 400, cert["code"])], expect=409)  # > остатка

    # Без клиента в чеке неактивированный погасить некому
    bearer = _buy(w, 100)
    sale = {
        "subtotal": 50,
        "payments": _parts(p, [("certificate", 50, bearer["code"])]),
    }
    s.api.post("/finances/receipts", token=s.su, salon=s.id, expect=422, json=sale)

    # Истёк срок
    with cli._master_session() as session:
        session.execute(
            sa_update(Certificate)
            .where(Certificate.id == uuid.UUID(cert["id"]))
            .values(expires_at=datetime.now(UTC) - timedelta(minutes=1))
        )
        session.commit()
    _pay(p, mine["id"], [("certificate", 100, cert["code"]), ("cash", 300, None)], expect=409)
    assert _certificate(w, cert["id"])["balance"] == 300  # ничего не списано


def test_services_scope_across_salons(w: World, other: Place) -> None:
    """«На послуги» — пары (салон, услуга): в другом салоне своя услуга, товары не оплачиваются."""
    p, s = w.place, w.s
    there = other.service(200, "Педикюр")
    cert = _buy(
        w,
        300,
        scope="services",
        services=[
            {"salonId": s.id, "serviceId": w.manicure["id"]},
            {"salonId": other.id, "serviceId": there["id"]},
        ],
    )
    client = new_client(p)
    # Салон продажи: маникюр 150 + чужая услуга 100 — сертификатом не больше 150
    rec = p.record(client, w.manicure, p.service(100))
    lookup = s.api.post(
        "/certificates/lookup",
        token=w.admin_token,
        salon=s.id,
        json={"code": cert["code"], "recordId": rec["id"]},
    )
    assert money(lookup["maxPayment"]) == 150 and lookup["error"] is None
    _pay(p, rec["id"], [("certificate", 200, cert["code"]), ("cash", 50, None)], expect=409)
    _pay(p, rec["id"], [("certificate", 150, cert["code"]), ("cash", 100, None)])

    # Другой салон: пара (другой салон, педикюр) действует, маникюр того салона — нет
    rec2 = other.record(client, there)
    assert (
        other.api.post(
            "/certificates/lookup",
            token=s.su,
            salon=other.id,
            json={"code": cert["code"], "recordId": rec2["id"]},
        )["maxPayment"]
        == "150.00"
    )
    _pay(other, rec2["id"], [("certificate", 150, cert["code"]), ("cash", 50, None)])
    assert _certificate(w, cert["id"])["status"] == "spent"

    # Товары «на послуги» не оплачиваются
    goods = _buy(
        w,
        100,
        buyer=client,
        scope="services",
        services=[{"salonId": s.id, "serviceId": w.manicure["id"]}],
    )
    s.api.post(
        "/finances/receipts",
        token=s.su,
        salon=s.id,
        expect=422,
        json={
            "clientId": client,
            "subtotal": 100,
            "payments": _parts(p, [("certificate", 100, goods["code"])]),
        },
    )
    lookup = s.api.post(
        "/certificates/lookup",
        token=s.su,
        salon=s.id,
        json={"code": goods["code"], "clientId": client},
    )
    assert lookup["error"] and money(lookup["maxPayment"]) == 0


def test_two_certificates_in_one_receipt(w: World) -> None:
    p = w.place
    client = new_client(p)
    first, second = _buy(w, 100), _buy(w, 100)
    rec = p.record(client, p.service(250))
    _pay(
        p,
        rec["id"],
        [
            ("certificate", 100, first["code"]),
            ("certificate", 100, second["code"]),
            ("cash", 50, None),
        ],
    )
    assert _certificate(w, first["id"])["status"] == "spent"
    assert _certificate(w, second["id"])["status"] == "spent"


def test_redemption_is_idempotent(w: World) -> None:
    """Повтор оплаты с тем же Idempotency-Key — то же списание."""
    p = w.place
    client = new_client(p)
    cert = _buy(w, 500)
    rec = p.record(client, p.service(200))
    key = f"redeem-{uuid.uuid4()}"
    first = _pay(p, rec["id"], [("certificate", 200, cert["code"])], key=key)
    again = _pay(p, rec["id"], [("certificate", 200, cert["code"])], key=key)
    assert first["receipt"]["id"] == again["receipt"]["id"]
    assert _journal(cert["id"]) == [("topup", Decimal(500)), ("payment", Decimal(-200))]


def test_shard_failure_reverses_redemption(w: World, monkeypatch: pytest.MonkeyPatch) -> None:
    """Чек в шарде не записан — списание с сертификата сторнируется, остаток возвращается."""
    from app.services import visits

    p = w.place
    client = new_client(p)
    cert = _buy(w, 200)
    rec = p.record(client, p.service(200))

    def boom(*args: Any, **kwargs: Any) -> None:
        raise RuntimeError("shard down")

    monkeypatch.setattr(visits, "write_receipt_audit", boom)
    _pay(p, rec["id"], [("certificate", 200, cert["code"])], expect=500)
    monkeypatch.undo()

    assert _journal(cert["id"]) == [
        ("topup", Decimal(200)),
        ("payment", Decimal(-200)),
        ("reversal", Decimal(200)),
    ]
    # Израсходованный сертификат снова активен; активация на клиента остаётся
    assert _certificate(w, cert["id"]) == {
        "status": "active",
        "owner": client,
        "balance": Decimal(200),
    }
    _pay(p, rec["id"], [("certificate", 200, cert["code"])])


def test_reconciliation_reverses_hanging_redemption(w: World) -> None:
    """Процесс упал между Master и шардом: сверка сторнирует погашение без чека."""
    from app.models.master import AccountTransaction
    from app.services import certificates, ledger
    from workers import db
    from workers.tasks import integrity

    client = new_client(w.place)
    cert = _buy(w, 300)
    salon_id = uuid.UUID(w.s.id)
    receipt_id = uuid.uuid4()
    with db.master_session() as session:
        certificates.redeem(
            session,
            salon_id=salon_id,
            receipt_id=receipt_id,
            client_id=uuid.UUID(client),
            redemptions=[certificates.Redemption(code=cert["code"], amount=Decimal(120))],
            lines=[],
            meta=ledger.Meta(salon_id=salon_id, receipt_id=receipt_id),
        )
        session.execute(
            update(AccountTransaction)
            .where(AccountTransaction.receipt_id == receipt_id)
            .values(created_at=datetime.now(UTC) - timedelta(hours=2))
        )
        session.commit()
    assert _certificate(w, cert["id"])["balance"] == 180

    assert integrity.reconcile_payments(salon_id) == 1
    assert _certificate(w, cert["id"])["balance"] == 300
    assert integrity.reconcile_payments(salon_id) == 0


def test_cancel_receipt_returns_certificate_balance(w: World, eager: None) -> None:
    """Отмена чека, оплаченного сертификатом: остаток возвращается сторно через воркер."""
    p = w.place
    client = new_client(p)
    cert = _buy(w, 150)
    paid = _pay(p, p.record(client, p.service(150))["id"], [("certificate", 150, cert["code"])])
    assert _certificate(w, cert["id"])["status"] == "spent"
    p.cancel(paid["receipt"]["id"])
    publish()
    assert _certificate(w, cert["id"]) == {
        "status": "active",
        "owner": client,
        "balance": Decimal(150),
    }


def test_client_certificates(w: World) -> None:
    p, s = w.place, w.s
    client = new_client(p)
    bought = _buy(w, 100, buyer=client)
    gift = _buy(w, 200)
    s.api.post(
        f"/certificates/{gift['id']}/activate", token=s.su, salon=s.id, json={"clientId": client}
    )
    listed = s.api.get(f"/clients/{client}/certificates", token=w.admin_token, salon=s.id)
    assert {c["id"] for c in listed} == {bought["id"], gift["id"]}


# --- Этап 4: сопровождение -----------------------------------------------------------


def _expire(certificate_id: str) -> None:
    import cli
    from app.models.master import Certificate

    with cli._master_session() as session:
        session.execute(
            update(Certificate)
            .where(Certificate.id == uuid.UUID(certificate_id))
            .values(expires_at=datetime.now(UTC) - timedelta(minutes=1))
        )
        session.commit()


def test_burn_expired(w: World) -> None:
    """Истёк срок: остаток сгорает (burn), статус expired; повтор ничего не делает."""
    from workers.tasks import loyalty as loyalty_tasks

    p = w.place
    client = new_client(p)
    partly = _buy(w, 300, validDays=30)
    _pay(p, p.record(client, p.service(100))["id"], [("certificate", 100, partly["code"])])
    untouched, spent = _buy(w, 50, validDays=30), _buy(w, 70, validDays=30)
    _pay(p, p.record(client, p.service(70))["id"], [("certificate", 70, spent["code"])])
    endless = _buy(w, 80)
    for cert in (partly, untouched, spent):
        _expire(cert["id"])

    # Другие тесты модуля тоже оставляют истёкшие сертификаты
    assert loyalty_tasks.burn_expired_certificates() >= 2
    assert loyalty_tasks.burn_expired_certificates() == 0
    assert _certificate(w, partly["id"]) == {
        "status": "expired",
        "owner": client,
        "balance": Decimal(0),
    }
    assert _journal(partly["id"])[-1] == ("burn", Decimal(-200))
    assert _certificate(w, untouched["id"])["status"] == "expired"
    assert _certificate(w, spent["id"])["status"] == "spent"  # сгорать нечему
    assert _certificate(w, endless["id"])["status"] == "issued"  # бессрочный


def test_cancel_purchase_receipt_after_redemption(w: World, eager: None) -> None:
    """Чек покупки отменяется, только пока сертификатом не расплачивались (решение 13)."""
    p = w.place
    client = new_client(p)
    cert = _buy(w, 400)
    paid = _pay(p, p.record(client, p.service(100))["id"], [("certificate", 100, cert["code"])])
    w.s.api.post(
        f"/finances/receipts/{cert['receiptId']}/cancel", token=w.s.su, salon=w.s.id, expect=409
    )
    # Погашение отменено — сертификат снова нетронутый, чек покупки можно отменить
    p.cancel(paid["receipt"]["id"])
    publish()
    p.cancel(cert["receiptId"])
    publish()
    assert _certificate(w, cert["id"])["status"] == "cancelled"
    assert _certificate(w, cert["id"])["balance"] == 0


def test_registry_and_cancel(w: World) -> None:
    """Реестр и аннулирование — суперюзер; остаток в ноль, погасить больше нельзя."""
    p, s = w.place, w.s
    client = new_client(p)
    cert = _buy(w, 250)
    _pay(p, p.record(client, p.service(50))["id"], [("certificate", 50, cert["code"])])

    s.api.get("/certificates", token=w.admin_token, salon=s.id, expect=403)
    part = cert["code"][4:9].lower()
    found = s.api.get("/certificates", token=s.su, salon=s.id, params={"code": part})
    assert cert["id"] in [c["id"] for c in found]
    active = s.api.get(
        "/certificates",
        token=s.su,
        salon=s.id,
        params={"status": "active", "soldSalonId": s.id, "perPage": 200},
    )
    assert cert["id"] in [c["id"] for c in active]
    assert all(c["status"] == "active" and c["soldSalonId"] == s.id for c in active)

    url = f"/certificates/{cert['id']}/cancel"
    s.api.post(url, token=w.admin_token, salon=s.id, expect=403, json={"reason": "Помилка"})
    s.api.post(url, token=s.su, salon=s.id, expect=422, json={"reason": "  "})
    cancelled = s.api.post(url, token=s.su, salon=s.id, json={"reason": "Загублено"})
    assert cancelled["status"] == "cancelled" and cancelled["cancelReason"] == "Загублено"
    assert money(cancelled["balance"]) == 0
    s.api.post(url, token=s.su, salon=s.id, expect=409, json={"reason": "Ще раз"})
    _pay(p, p.record(client, p.service(10))["id"], [("certificate", 10, cert["code"])], expect=409)

    history = s.api.get(f"/certificates/{cert['id']}/transactions", token=w.admin_token, salon=s.id)
    assert [(t["type"], money(t["amount"])) for t in reversed(history)] == [
        ("topup", Decimal(250)),
        ("payment", Decimal(-50)),
        ("adjustment", Decimal(-200)),
    ]
    audit = s.api.get(
        "/audit", token=s.su, salon=s.id, params={"entity": "certificate", "perPage": 50}
    )
    assert any(a["entityId"] == cert["id"] for a in audit)
