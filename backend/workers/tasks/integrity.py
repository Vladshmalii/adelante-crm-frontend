"""Суточная сверка cross-DB — страховка от сбоев, не рабочий механизм.

1. Ссылки шардов (master_id, client_id) на строки, отсутствующие в Master DB.
   При политике «только soft-delete» находок быть не должно; каждая находка —
   сигнал о баге и повод для алерта.
2. Списания со счетов клиента (Master) без живого чека в шарде: процесс упал
   между записью в Master и коммитом шарда, или событие отмены чека потерялось.
   Такие списания сторнируются (loyalty-accounts.md, раздел 3).
"""

import logging
from uuid import UUID

from sqlalchemy import select

from app.models.master import Client, Master
from app.models.shard import Receipt, ReceiptStatus, Record, service_masters
from app.services import ledger, payments
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


def reconcile_payments(salon_id: UUID) -> int:
    """Сторно «висящих» списаний салона: чека нет в шарде или он отменён. Возвращает число чеков."""
    with db.master_session() as session:
        hanging = payments.hanging_payments(session, salon_id)
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
                    record_id=hanging[receipt_id][0].record_id,
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
