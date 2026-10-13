"""Суточная сверка cross-DB — страховка от сбоев, не рабочий механизм.

1. Ссылки шардов (master_id, client_id) на строки, отсутствующие в Master DB.
   При политике «только soft-delete» находок быть не должно; каждая находка —
   сигнал о баге и повод для алерта.
2. Списания со счетов клиента (Master) без живого чека в шарде: процесс упал
   между записью в Master и коммитом шарда, или событие отмены чека потерялось.
   Такие списания сторнируются (loyalty-accounts.md, раздел 3).
3. Оплаченные чеки с картой без факта визита в Master: событие
   loyalty.receipt_paid переотправляется (published_at сбрасывается).
"""

import logging
from datetime import UTC, datetime, timedelta
from uuid import UUID

from sqlalchemy import select, update

from app.models.master import Client, LoyaltyCardVisit, Master
from app.models.shard import OutboxEvent, Receipt, ReceiptStatus, Record, service_masters
from app.notifications.outbox import LOYALTY_RECEIPT_PAID
from app.services import ledger, loyalty, payments
from workers import db
from workers.celery_app import celery

logger = logging.getLogger(__name__)


@celery.task
def integrity_check() -> None:
    for salon_id in db.list_active_salon_ids():
        try:
            _check_salon(salon_id)
        except Exception:
            logger.exception("integrity_check: сбой на салоне %s", salon_id)
        try:
            reconcile_payments(salon_id)
        except Exception:
            logger.exception("reconcile_payments: сбой на салоне %s", salon_id)
        try:
            resend_missing_visits(salon_id)
        except Exception:
            logger.exception("resend_missing_visits: сбой на салоне %s", salon_id)


# Сколько дней назад смотреть чеки с картой без факта визита
VISIT_RESEND_WINDOW = timedelta(days=30)


def resend_missing_visits(salon_id: UUID, *, now: datetime | None = None) -> int:
    """Переотправить loyalty.receipt_paid для оплаченных чеков с картой без факта визита."""
    now = now or datetime.now(UTC)
    with db.shard_session(salon_id) as shard:
        receipt_ids = set(
            shard.scalars(
                select(Receipt.id).where(
                    Receipt.loyalty_card_id.is_not(None),
                    Receipt.status != ReceiptStatus.CANCELLED,
                    Receipt.created_at < now - payments.RECONCILE_GRACE,
                    Receipt.created_at >= now - VISIT_RESEND_WINDOW,
                )
            )
        )
    if not receipt_ids:
        return 0
    with db.master_session() as session:
        known = set(
            session.scalars(
                select(LoyaltyCardVisit.receipt_id).where(
                    LoyaltyCardVisit.salon_id == salon_id,
                    LoyaltyCardVisit.receipt_id.in_(receipt_ids),
                )
            )
        )
    missing = [str(r) for r in receipt_ids - known]
    if not missing:
        return 0
    logger.warning("Салон %s: чеки с карткою без факту візиту: %s", salon_id, missing)
    with db.shard_session(salon_id) as shard:
        shard.execute(
            update(OutboxEvent)
            .where(
                OutboxEvent.event_type == LOYALTY_RECEIPT_PAID,
                OutboxEvent.payload["payload"]["receipt_id"].astext.in_(missing),
            )
            .values(published_at=None)
        )
        shard.commit()
    return len(missing)


def reconcile_payments(salon_id: UUID) -> int:
    """Сторно «висящих» списаний салона: чека нет в шарде или он отменён. Возвращает число чеков."""
    with db.master_session() as session:
        hanging = {
            receipt_id: txns[0].record_id
            for receipt_id, txns in payments.hanging_payments(session, salon_id).items()
        }
        border = datetime.now(UTC) - payments.RECONCILE_GRACE
        for receipt_id, record_id in loyalty.hanging_bonus_receipts(
            session, salon_id, border
        ).items():
            hanging.setdefault(receipt_id, record_id)
    if not hanging:
        return 0
    with db.shard_session(salon_id) as shard:
        statuses = dict(
            shard.execute(select(Receipt.id, Receipt.status).where(Receipt.id.in_(list(hanging))))
            .tuples()
            .all()
        )
    stale = [
        receipt_id
        for receipt_id in hanging
        if statuses.get(receipt_id) in (None, ReceiptStatus.CANCELLED)
    ]
    for receipt_id in stale:
        reason = "чек не записано" if receipt_id not in statuses else "чек скасовано"
        logger.warning("Салон %s: сторно списань без чека %s (%s)", salon_id, receipt_id, reason)
        with db.master_session() as session:
            payments.reverse_payments(
                session,
                salon_id=salon_id,
                receipt_id=receipt_id,
                meta=ledger.Meta(
                    salon_id=salon_id,
                    receipt_id=receipt_id,
                    record_id=hanging[receipt_id],
                    author_name="Нічна звірка",
                    comment=f"Сторно: {reason}",
                ),
            )
            session.commit()
    return len(stale)


def _check_salon(salon_id: UUID) -> None:
    with db.shard_session(salon_id) as session:
        master_ids = set(
            session.scalars(
                select(Record.master_id).where(Record.master_id.is_not(None)).distinct()
            )
        )
        master_ids |= set(session.scalars(select(service_masters.c.master_id).distinct()))
        client_ids = set(session.scalars(select(Record.client_id).distinct()))

    if not master_ids and not client_ids:
        return

    with db.master_session() as session:
        known_masters = set(session.scalars(select(Master.id).where(Master.id.in_(master_ids))))
        known_clients = set(session.scalars(select(Client.id).where(Client.id.in_(client_ids))))

    orphan_masters = master_ids - known_masters
    orphan_clients = client_ids - known_clients
    if orphan_masters or orphan_clients:
        logger.error(
            "Салон %s: висячие ссылки! masters=%s clients=%s",
            salon_id,
            sorted(map(str, orphan_masters)),
            sorted(map(str, orphan_clients)),
        )
