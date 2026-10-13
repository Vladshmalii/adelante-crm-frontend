"""События лояльности из outbox шарда → записи в Master DB (loyalty-accounts.md, раздел 3).

Асинхронная часть правила двойных записей: чек и событие пишутся в шард одной
транзакцией, здесь — сторно и начисления в Master. Доставка at-least-once:
каждая операция журнала идемпотентна по ключу, повтор задачи ничего не дублирует.
"""

import logging
import uuid
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import select

from app.models.master import CardStatus, LoyaltyCard, LoyaltyCardType
from app.models.shard import Receipt, ReceiptStatus
from app.notifications.outbox import LOYALTY_RECEIPT_CANCELLED, LOYALTY_RECEIPT_PAID
from app.services import ledger, loyalty, payments
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
    if event_type == LOYALTY_RECEIPT_PAID:
        receipt_paid(salon_id, payload)
    elif event_type == LOYALTY_RECEIPT_CANCELLED:
        receipt_cancelled(salon_id, payload)
    else:
        logger.warning("Неизвестное событие лояльности: %s", event_type)


def receipt_paid(salon_id: uuid.UUID, payload: dict[str, Any]) -> None:
    """Оплаченный чек с картой (раздел 6, шаг 5): факт визита и счётчики карты.

    Если карта к этому времени удалена или больше не действует в салоне — ничего.
    Чек мог быть отменён раньше, чем событие оплаты дошло (ретрай), — тогда тоже ничего.
    """
    receipt_id = uuid.UUID(payload["receipt_id"])

    def receipt_alive() -> bool:
        with db.shard_session(salon_id) as shard:
            status = shard.scalar(select(Receipt.status).where(Receipt.id == receipt_id))
        return status is not None and status != ReceiptStatus.CANCELLED

    with db.master_session() as session:
        loyalty.record_visit(session, salon_id, payload, receipt_alive=receipt_alive)
        session.commit()


def receipt_cancelled(salon_id: uuid.UUID, payload: dict[str, Any]) -> None:
    """Отмена чека: сторно списаний со счетов, откат факта визита и счётчиков карты."""
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
        loyalty.reverse_visit(session, salon_id, receipt_id, _uuid(payload.get("card_id")))
        session.commit()


@celery.task
def burn_expired_cashback() -> int:
    """Сгорание кешбэка по сроку типа карты (cashback_ttl_days), FIFO. Возвращает число карт."""
    now = datetime.now(UTC)
    with db.master_session() as session:
        card_ids = list(
            session.scalars(
                select(LoyaltyCard.id)
                .join(LoyaltyCardType, LoyaltyCardType.id == LoyaltyCard.card_type_id)
                .where(
                    LoyaltyCard.status == CardStatus.ACTIVE,
                    LoyaltyCardType.cashback_ttl_days.is_not(None),
                )
            )
        )
    burnt = 0
    for card_id in card_ids:
        try:
            with db.master_session() as session:
                card = session.get(LoyaltyCard, card_id)
                if card is not None and loyalty.burn_expired(session, card, now=now) > 0:
                    burnt += 1
                session.commit()
        except Exception:
            logger.exception("burn_expired_cashback: сбой на карте %s", card_id)
    return burnt
