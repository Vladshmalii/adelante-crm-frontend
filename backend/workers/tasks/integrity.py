"""Суточная сверка cross-DB ссылок — страховка от багов, не рабочий механизм.

Ищет в шардах ссылки (master_id, client_id) на строки, отсутствующие в
Master DB. При политике «только soft-delete» находок быть не должно;
каждая находка — сигнал о баге и повод для алерта.
"""

import logging
from uuid import UUID

from sqlalchemy import select

from app.models.master import Client, Master
from app.models.shard import Record, service_masters
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


def _check_salon(salon_id: UUID) -> None:
    with db.shard_session(salon_id) as session:
        master_ids = set(session.scalars(select(Record.master_id).distinct()))
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
