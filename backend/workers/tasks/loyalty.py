"""События лояльности из outbox шарда → записи в Master DB (loyalty-accounts.md, раздел 3).

Асинхронная часть правила двойных записей: чек и событие пишутся в шард одной
транзакцией, здесь — сторно и начисления в Master. Доставка at-least-once:
каждая операция журнала идемпотентна по ключу, повтор задачи ничего не дублирует.
"""

import logging
import uuid
from typing import Any

from app.notifications.outbox import LOYALTY_RECEIPT_CANCELLED
from app.services import ledger, payments
from workers import db
from workers.celery_app import celery

logger = logging.getLogger(__name__)


def _uuid(value: str | None) -> uuid.UUID | None:
    return uuid.UUID(value) if value else None


@celery.task(
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_backoff_max=600,
    max_retries=20,
)
def process_event(envelope: dict[str, Any]) -> None:
    event_type = envelope["event_type"]
    salon_id = uuid.UUID(envelope["salon_id"])
    payload = envelope["payload"]
    if event_type == LOYALTY_RECEIPT_CANCELLED:
        receipt_cancelled(salon_id, payload)
    else:
        logger.warning("Неизвестное событие лояльности: %s", event_type)


def receipt_cancelled(salon_id: uuid.UUID, payload: dict[str, Any]) -> None:
    """Отмена чека: деньги со счёта клиента возвращаются сторно списаний."""
    receipt_id = uuid.UUID(payload["receipt_id"])
    meta = ledger.Meta(
        salon_id=salon_id,
        receipt_id=receipt_id,
        record_id=_uuid(payload.get("record_id")),
        author_id=_uuid(payload.get("author_id")),
        author_name=payload.get("author_name"),
        comment=f"Скасовано чек № {payload.get('receipt_number') or receipt_id}",
    )
    with db.master_session() as session:
        payments.reverse_payments(session, salon_id=salon_id, receipt_id=receipt_id, meta=meta)
        session.commit()
