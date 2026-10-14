"""Подарочные сертификаты: выпуск, активация, погашение, отмена выпуска (certificates.md).

Синхронный код на `Session`, как ledger: API вызывает через `run_sync`, воркеры —
напрямую. Остаток сертификата — счёт client_accounts(kind=certificate):
выпуск — topup на номинал, погашение — payment, отмена выпуска и погашения — сторно.

Выпуск идёт в payments.charge, в транзакции Master вместе со списаниями, ключ
`cert:{salon}:{receipt}:{line}:{n}` (line — позиция продажи в запросе, n — 1..кол-во):
повтор оплаты после сбоя находит уже выпущенные сертификаты, а не выпускает новые.
"""

import secrets
import uuid
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from decimal import Decimal

from pydantic import BaseModel, Field
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models.master import (
    AccountKind,
    AccountTransaction,
    Certificate,
    CertificateScope,
    CertificateService,
    CertificateStatus,
    CertificateTemplate,
    Client,
    ClientAccount,
    TransactionType,
)
from app.services import ledger

# Без похожих символов: 0/O, 1/I/L. 31 символ × 10 = ≈49,5 бит случайности
CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"
CODE_GROUP = 5

# Сколько сертификатов одной позиции можно продать в одном чеке
MAX_QUANTITY = 20


class CertificateError(Exception):
    pass


class CertificateSale(BaseModel):
    """Позиция продажи: шаблон и количество (2 шт. — два сертификата, два кода)."""

    template_id: uuid.UUID
    quantity: int = Field(default=1, ge=1, le=MAX_QUANTITY)


@dataclass(frozen=True)
class Issue:
    """Один выпускаемый сертификат: снимок шаблона и место в продаже."""

    line: int  # позиция в запросе (0..)
    n: int  # номер штуки в позиции (1..quantity)
    template_id: uuid.UUID
    name: str
    amount: Decimal
    scope: CertificateScope
    valid_days: int | None
    # Пары (салон, услуга) шаблона «на послуги» на момент продажи
    services: tuple[tuple[uuid.UUID, uuid.UUID], ...] = ()

    def key(self, salon_id: uuid.UUID, receipt_id: uuid.UUID) -> str:
        return f"cert:{salon_id}:{receipt_id}:{self.line}:{self.n}"


@dataclass(frozen=True)
class Issued:
    line: int
    n: int
    certificate_id: uuid.UUID


def normalize_code(code: str) -> str:
    """Ввод кассира: регистр, пробелы и дефисы не важны → ADL-XXXXX-XXXXX."""
    raw = "".join(ch for ch in code.upper() if ch.isalnum())
    raw = raw.removeprefix("ADL")
    return f"ADL-{raw[:CODE_GROUP]}-{raw[CODE_GROUP:]}"


def generate_code() -> str:
    groups = ("".join(secrets.choice(CODE_ALPHABET) for _ in range(CODE_GROUP)) for _ in range(2))
    return "ADL-" + "-".join(groups)


def _unique_code(session: Session) -> str:
    # Совпадение при 31^10 вариантов практически невозможно; unique-индекс — страховка
    while True:
        code = generate_code()
        if session.scalar(select(Certificate.id).where(Certificate.code == code)) is None:
            return code


def plan_issues(
    templates: dict[uuid.UUID, CertificateTemplate], sales: list[CertificateSale]
) -> list[Issue]:
    """Позиции продажи → выпускаемые сертификаты (по одному на штуку)."""
    issues = []
    for line, sale in enumerate(sales):
        template = templates[sale.template_id]
        for n in range(1, sale.quantity + 1):
            issues.append(
                Issue(
                    line=line,
                    n=n,
                    template_id=template.id,
                    name=template.name,
                    amount=template.amount,
                    scope=template.scope,
                    valid_days=template.valid_days,
                    services=tuple((s.salon_id, s.service_id) for s in template.services),
                )
            )
    return issues


def load_templates(
    session: Session, sales: list[CertificateSale]
) -> dict[uuid.UUID, CertificateTemplate]:
    """Шаблоны продажи: существуют и продаются (is_active)."""
    ids = {s.template_id for s in sales}
    if not ids:
        return {}
    templates = {
        t.id: t
        for t in session.scalars(select(CertificateTemplate).where(CertificateTemplate.id.in_(ids)))
    }
    if ids - set(templates):
        raise CertificateError("Сертифікат не знайдено")
    hidden = next((t for t in templates.values() if not t.is_active), None)
    if hidden is not None:
        raise CertificateError(f"Сертифікат «{hidden.name}» не продається")
    return templates


def find_by_issue_key(session: Session, key: str) -> Certificate | None:
    return session.scalar(select(Certificate).where(Certificate.issue_key == key))


def account_of(session: Session, certificate_id: uuid.UUID) -> ClientAccount | None:
    return session.scalar(
        select(ClientAccount).where(ClientAccount.certificate_id == certificate_id)
    )


def lock_account_of(session: Session, certificate_id: uuid.UUID) -> ClientAccount:
    account = account_of(session, certificate_id)
    if account is None:
        raise ledger.LedgerError("Рахунок сертифіката не знайдено")
    return ledger.lock_account(session, account.id)


def issue(
    session: Session,
    *,
    salon_id: uuid.UUID,
    receipt_id: uuid.UUID,
    buyer_client_id: uuid.UUID | None,
    issues: list[Issue],
    meta: ledger.Meta,
    now: datetime | None = None,
) -> list[Issued]:
    """Выпуск сертификатов чека: сертификат, его счёт и topup на номинал. Идемпотентно.

    Повтор после сбоя возвращает уже выпущенные; если их выпуск откатили
    компенсацией — ошибка, как у повтора отменённого списания.
    """
    now = now or datetime.now(UTC)
    result = []
    for item in issues:
        key = item.key(salon_id, receipt_id)
        certificate = find_by_issue_key(session, key)
        if certificate is not None:
            if certificate.status == CertificateStatus.CANCELLED:
                raise ledger.LedgerError("Попередню спробу оплати скасовано — повторіть оплату")
            result.append(Issued(line=item.line, n=item.n, certificate_id=certificate.id))
            continue
        certificate = Certificate(
            id=uuid.uuid4(),
            code=_unique_code(session),
            template_id=item.template_id,
            name=item.name,
            amount=item.amount,
            scope=item.scope,
            expires_at=now + timedelta(days=item.valid_days) if item.valid_days else None,
            status=CertificateStatus.ISSUED,
            sold_salon_id=salon_id,
            sold_receipt_id=receipt_id,
            buyer_client_id=buyer_client_id,
            issue_key=key,
            # Снимок услуг: правка шаблона не меняет проданные сертификаты
            services=[
                CertificateService(salon_id=salon, service_id=service)
                for salon, service in item.services
            ],
        )
        session.add(certificate)
        session.flush()
        account = ClientAccount(
            id=uuid.uuid4(),
            client_id=None,
            kind=AccountKind.CERTIFICATE,
            certificate_id=certificate.id,
            balance=Decimal(0),
        )
        session.add(account)
        session.flush()
        ledger.post(
            session,
            account,
            type=TransactionType.TOPUP,
            amount=item.amount,
            key=key,
            meta=ledger.Meta(
                salon_id=meta.salon_id,
                author_id=meta.author_id,
                author_name=meta.author_name,
                record_id=meta.record_id,
                receipt_id=meta.receipt_id,
                comment=f"Продаж сертифіката {certificate.code}",
            ),
        )
        result.append(Issued(line=item.line, n=item.n, certificate_id=certificate.id))
    return result


def sold_in(session: Session, salon_id: uuid.UUID, receipt_id: uuid.UUID) -> list[Certificate]:
    """Сертификаты, выпущенные чеком салона, в порядке позиций продажи."""
    certificates = list(
        session.scalars(
            select(Certificate).where(
                Certificate.sold_salon_id == salon_id, Certificate.sold_receipt_id == receipt_id
            )
        )
    )

    def order(c: Certificate) -> tuple[int, int]:
        line, n = c.issue_key.rsplit(":", 2)[1:]
        return int(line), int(n)

    return sorted(certificates, key=order)


def cancel_issued(
    session: Session, *, salon_id: uuid.UUID, receipt_id: uuid.UUID, meta: ledger.Meta
) -> int:
    """Отмена выпуска по чеку (компенсация, сверка, отмена чека покупки). Идемпотентно.

    Нетронутый сертификат — сторно topup. Счета блокируются по id сертификата
    (порядок блокировок: money → кешбэк → сертификаты по id → прогресс бонусов).
    """
    certificates = sorted(
        (
            c
            for c in sold_in(session, salon_id, receipt_id)
            if c.status != CertificateStatus.CANCELLED
        ),
        key=lambda c: c.id,
    )
    now = datetime.now(UTC)
    for certificate in certificates:
        account = lock_account_of(session, certificate.id)
        topup = ledger.find_by_key(session, certificate.issue_key)
        if topup is not None and account.balance == topup.amount:
            ledger.reverse(session, topup, meta=meta)
        elif account.balance != 0:
            # Сертификатом уже платили (отмену такого чека запрещает этап 4) — остаток в ноль
            ledger.post(
                session,
                account,
                type=TransactionType.ADJUSTMENT,
                amount=-account.balance,
                key=f"cert-cancel:{certificate.id}",
                meta=meta,
            )
        certificate.status = CertificateStatus.CANCELLED
        certificate.cancelled_at = now
        certificate.cancelled_by = meta.author_id
        certificate.cancelled_by_name = meta.author_name
        certificate.cancel_reason = meta.comment
    session.flush()
    return len(certificates)


def hanging_receipts(
    session: Session, salon_id: uuid.UUID, border: datetime, since: datetime
) -> set[uuid.UUID]:
    """Чеки салона с неотменёнными сертификатами, выпущенными в [since, border) — для сверки."""
    return set(
        session.scalars(
            select(Certificate.sold_receipt_id)
            .where(
                Certificate.sold_salon_id == salon_id,
                Certificate.status != CertificateStatus.CANCELLED,
                Certificate.created_at < border,
                Certificate.created_at >= since,
            )
            .distinct()
        )
    )


def activate(
    session: Session,
    certificate_id: uuid.UUID,
    client_id: uuid.UUID,
    *,
    now: datetime | None = None,
) -> Certificate:
    """Привязка к клиенту — один раз (решения 6–7). Повтор на того же клиента — без изменений."""
    now = now or datetime.now(UTC)
    account = lock_account_of(session, certificate_id)
    certificate = session.get(Certificate, certificate_id, populate_existing=True)
    assert certificate is not None
    if certificate.owner_client_id is not None:
        if certificate.owner_client_id == client_id:
            return certificate
        raise CertificateError("Сертифікат уже активовано на іншого клієнта")
    if certificate.status != CertificateStatus.ISSUED:
        raise CertificateError("Сертифікат недійсний")
    if certificate.expires_at is not None and certificate.expires_at <= now:
        raise CertificateError("Термін дії сертифіката минув")
    client = session.get(Client, client_id)
    if client is None or not client.is_active:
        raise CertificateError("Клієнта не знайдено")
    certificate.owner_client_id = client_id
    certificate.activated_at = now
    certificate.status = CertificateStatus.ACTIVE
    account.client_id = client_id
    session.flush()
    return certificate


def balances(session: Session, certificate_ids: list[uuid.UUID]) -> dict[uuid.UUID, Decimal]:
    if not certificate_ids:
        return {}
    rows = session.execute(
        select(ClientAccount.certificate_id, ClientAccount.balance).where(
            ClientAccount.certificate_id.in_(certificate_ids)
        )
    ).tuples()
    return {cid: balance for cid, balance in rows if cid is not None}


# --- Погашение (раздел 5) -------------------------------------------------------------


@dataclass(frozen=True)
class ServiceAmount:
    """Строка-услуга чека: сколько за неё платят после скидки (бонусная — 0)."""

    service_id: uuid.UUID
    amount: Decimal


@dataclass(frozen=True)
class Redemption:
    """Часть чека, оплачиваемая сертификатом: код как ввёл кассир и сумма."""

    code: str
    amount: Decimal


def find_by_code(session: Session, code: str) -> Certificate | None:
    return session.scalar(select(Certificate).where(Certificate.code == normalize_code(code)))


def payment_key(salon_id: uuid.UUID, receipt_id: uuid.UUID, certificate_id: uuid.UUID) -> str:
    return f"pay:{salon_id}:{receipt_id}:certificate:{certificate_id}"


def eligible_amount(
    certificate: Certificate, salon_id: uuid.UUID, lines: list[ServiceAmount]
) -> Decimal | None:
    """Сколько строк чека покрывает область «на послуги»; None — «на все» (без ограничения)."""
    if certificate.scope == CertificateScope.ANY:
        return None
    return sum(
        (line.amount for line in lines if certificate.covers(salon_id, line.service_id)),
        Decimal(0),
    )


def unusable_reason(
    certificate: Certificate,
    balance: Decimal,
    *,
    client_id: uuid.UUID | None,
    now: datetime,
) -> str | None:
    """Проверки 1–2 раздела 5: статус, срок, остаток, владелец. None — можно погашать."""
    if certificate.status == CertificateStatus.CANCELLED:
        return "Сертифікат анульовано"
    if certificate.status == CertificateStatus.EXPIRED or (
        certificate.expires_at is not None and certificate.expires_at <= now
    ):
        return "Термін дії сертифіката минув"
    if certificate.status == CertificateStatus.SPENT or balance <= 0:
        return "Сертифікат уже використано"
    if certificate.owner_client_id is not None:
        if certificate.owner_client_id != client_id:
            # Решение 7: активированный сертификат передать нельзя
            return "Сертифікат активовано на іншого клієнта"
    elif client_id is None:
        return "Оберіть клієнта: сертифікат активується на нього при оплаті"
    return None


def redeem(
    session: Session,
    *,
    salon_id: uuid.UUID,
    receipt_id: uuid.UUID,
    client_id: uuid.UUID | None,
    redemptions: list[Redemption],
    lines: list[ServiceAmount],
    meta: ledger.Meta,
    now: datetime | None = None,
) -> None:
    """Списание с сертификатов в транзакции оплаты. Идемпотентно по ключу на сертификат.

    Счета блокируются по id сертификата. Неактивированный сертификат активируется
    на клиента чека. Область «на послуги»: сумма частей таких сертификатов — не
    больше строк, которые покрывает хотя бы один из них; товары не оплачиваются.
    """
    now = now or datetime.now(UTC)
    by_id: dict[uuid.UUID, Decimal] = {}
    for item in redemptions:
        found = find_by_code(session, item.code)
        if found is None:
            raise ledger.LedgerError(f"Сертифікат {normalize_code(item.code)} не знайдено")
        by_id[found.id] = by_id.get(found.id, Decimal(0)) + item.amount

    scoped: list[Certificate] = []
    scoped_total = Decimal(0)
    for certificate_id in sorted(by_id):
        amount = ledger.money(by_id[certificate_id])
        account = lock_account_of(session, certificate_id)
        certificate = session.get(Certificate, certificate_id, populate_existing=True)
        assert certificate is not None
        key = payment_key(salon_id, receipt_id, certificate_id)
        existing = ledger.find_by_key(session, key)
        if existing is not None:
            if ledger.is_reversed(session, existing.id):
                raise ledger.LedgerError("Попередню спробу оплати скасовано — повторіть оплату")
            continue
        reason = unusable_reason(certificate, account.balance, client_id=client_id, now=now)
        if reason is not None:
            raise ledger.LedgerError(f"{certificate.code}: {reason}")
        if amount > account.balance:
            raise ledger.LedgerError(f"{certificate.code}: на сертифікаті лише {account.balance} ₴")
        limit = eligible_amount(certificate, salon_id, lines)
        if limit is not None:
            if amount > limit:
                raise ledger.LedgerError(
                    f"{certificate.code}: сертифікатом «{certificate.name}» можна оплатити "
                    f"лише його послуги — не більше {limit} ₴"
                )
            scoped.append(certificate)
            scoped_total += amount
        if certificate.owner_client_id is None:
            assert client_id is not None
            certificate.owner_client_id = client_id
            certificate.activated_at = now
            certificate.status = CertificateStatus.ACTIVE
            account.client_id = client_id
        ledger.post(
            session,
            account,
            type=TransactionType.PAYMENT,
            amount=-amount,
            key=key,
            meta=ledger.Meta(
                salon_id=meta.salon_id,
                author_id=meta.author_id,
                author_name=meta.author_name,
                record_id=meta.record_id,
                receipt_id=meta.receipt_id,
                comment=f"Оплата сертифікатом {certificate.code}",
            ),
        )
        if account.balance == 0:
            certificate.status = CertificateStatus.SPENT
    if len(scoped) > 1:
        covered = sum(
            (
                line.amount
                for line in lines
                if any(c.covers(salon_id, line.service_id) for c in scoped)
            ),
            Decimal(0),
        )
        if scoped_total > covered:
            raise ledger.LedgerError(
                f"Сертифікатами на послуги можна оплатити не більше {covered} ₴ у цьому чеку"
            )
    session.flush()


def after_reversal(session: Session, account: ClientAccount) -> None:
    """Сторно погашения вернуло остаток: израсходованный сертификат снова активен."""
    if account.certificate_id is None or account.balance <= 0:
        return
    certificate = session.get(Certificate, account.certificate_id)
    if certificate is not None and certificate.status == CertificateStatus.SPENT:
        certificate.status = CertificateStatus.ACTIVE


def client_certificates(session: Session, client_id: uuid.UUID) -> list[Certificate]:
    """Сертификаты клиента: свои (активированные на него) и купленные им."""
    return list(
        session.scalars(
            select(Certificate)
            .where(
                or_(
                    Certificate.owner_client_id == client_id,
                    Certificate.buyer_client_id == client_id,
                )
            )
            .order_by(Certificate.created_at.desc())
        )
    )


# --- Сопровождение (раздел 6) ---------------------------------------------------------


def was_redeemed(session: Session, certificate_ids: list[uuid.UUID]) -> bool:
    """Есть несторнированные погашения — отменять чек покупки нельзя (решение 13)."""
    if not certificate_ids:
        return False
    reversed_ids = select(AccountTransaction.reverses_id).where(
        AccountTransaction.reverses_id.is_not(None)
    )
    found = session.scalar(
        select(AccountTransaction.id)
        .join(ClientAccount, ClientAccount.id == AccountTransaction.account_id)
        .where(
            ClientAccount.certificate_id.in_(certificate_ids),
            AccountTransaction.type == TransactionType.PAYMENT,
            AccountTransaction.id.not_in(reversed_ids),
        )
        .limit(1)
    )
    return found is not None


def expired_ids(session: Session, now: datetime) -> list[uuid.UUID]:
    """Истёкшие сертификаты с остатком (и ещё не помеченные истёкшими) — для ночного сгорания."""
    return list(
        session.scalars(
            select(Certificate.id)
            .join(ClientAccount, ClientAccount.certificate_id == Certificate.id)
            .where(
                Certificate.expires_at <= now,
                Certificate.status != CertificateStatus.CANCELLED,
                or_(
                    Certificate.status.in_([CertificateStatus.ISSUED, CertificateStatus.ACTIVE]),
                    ClientAccount.balance > 0,
                ),
            )
            .order_by(Certificate.id)
        )
    )


def burn_expired(session: Session, certificate_id: uuid.UUID, *, now: datetime) -> Decimal:
    """Сгорание остатка истёкшего сертификата (раздел 6): burn, статус expired.

    Ключ по дате: повтор в тот же день ничего не делает; остаток, вернувшийся
    сторно погашения после сгорания, сгорит на следующую ночь.
    """
    account = lock_account_of(session, certificate_id)
    certificate = session.get(Certificate, certificate_id, populate_existing=True)
    assert certificate is not None
    if (
        certificate.status == CertificateStatus.CANCELLED
        or certificate.expires_at is None
        or certificate.expires_at > now
    ):
        return Decimal(0)
    amount = max(account.balance, Decimal(0))
    if amount > 0:
        ledger.post(
            session,
            account,
            type=TransactionType.BURN,
            amount=-amount,
            key=f"burn:certificate:{certificate.id}:{now.date().isoformat()}",
            meta=ledger.Meta(comment=f"Сертифікат {certificate.code}: минув термін дії"),
        )
    if certificate.status != CertificateStatus.SPENT or amount > 0:
        certificate.status = CertificateStatus.EXPIRED
    session.flush()
    return amount


def cancel(
    session: Session,
    certificate_id: uuid.UUID,
    *,
    reason: str,
    meta: ledger.Meta,
    now: datetime | None = None,
) -> Certificate:
    """Аннулирование суперюзером (раздел 6): остаток в ноль (adjustment), статус cancelled.

    Деньги не возвращаются (решение 13). Повтор — без изменений.
    """
    account = lock_account_of(session, certificate_id)
    certificate = session.get(Certificate, certificate_id, populate_existing=True)
    assert certificate is not None
    if certificate.status == CertificateStatus.CANCELLED:
        return certificate
    if account.balance != 0:
        ledger.post(
            session,
            account,
            type=TransactionType.ADJUSTMENT,
            amount=-account.balance,
            key=f"cert-cancel:{certificate.id}",
            meta=meta,
        )
    certificate.status = CertificateStatus.CANCELLED
    certificate.cancelled_at = now or datetime.now(UTC)
    certificate.cancelled_by = meta.author_id
    certificate.cancelled_by_name = meta.author_name
    certificate.cancel_reason = reason
    session.flush()
    return certificate


def transactions(session: Session, certificate_id: uuid.UUID) -> list[AccountTransaction]:
    """Журнал сертификата: выпуск, погашения, сторно, сгорание — от новых к старым."""
    account = account_of(session, certificate_id)
    if account is None:
        return []
    return list(
        session.scalars(
            select(AccountTransaction)
            .where(AccountTransaction.account_id == account.id)
            .order_by(AccountTransaction.created_at.desc())
        )
    )
