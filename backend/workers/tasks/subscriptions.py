"""Абонементы по времени (backend/docs/subscriptions.md, раздел 8). Ежечасно, идемпотентно.

1. Автоактивация: pending с auto_activate_at ≤ now → active, срок от auto_activate_at.
2. Авторазморозка: frozen с freeze_until ≤ now → active, expires_at += дни заморозки.
3. Истечение: active с expires_at ≤ now → expired, остаток корзин сгорает (expire).

Порядок важен: активированный и размороженный в этом же запуске абонемент сразу
проверяется на истечение. Каждый абонемент — своя транзакция под его блокировкой
(FOR UPDATE), условие перепроверяется после блокировки: повторный или параллельный
запуск ничего не дублирует, ключи expire уникальны.
"""

import logging
from collections.abc import Callable
from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy.orm import Session

from app.services import subscriptions
from workers import db
from workers.celery_app import celery

logger = logging.getLogger(__name__)


def _each(
    name: str,
    ids: list[UUID],
    step: Callable[[Session, UUID, datetime], bool],
    now: datetime,
) -> int:
    done = 0
    for subscription_id in ids:
        try:
            with db.master_session() as session:
                if step(session, subscription_id, now):
                    done += 1
                session.commit()
        except Exception:
            logger.exception("%s: сбой на абонементе %s", name, subscription_id)
    return done


def run(now: datetime | None = None) -> dict[str, int]:
    """Один проход всех трёх шагов. Возвращает, сколько абонементов изменил каждый."""
    now = now or datetime.now(UTC)
    with db.master_session() as session:
        activation = subscriptions.due_activation(session, now)
        thaw = subscriptions.due_unfreeze(session, now)
    result = {
        "activated": _each("auto_activate", activation, subscriptions.auto_activate, now),
        "unfrozen": _each("auto_unfreeze", thaw, subscriptions.auto_unfreeze, now),
    }
    with db.master_session() as session:
        expiry = subscriptions.due_expiry(session, now)
    result["expired"] = _each("expire", expiry, subscriptions.expire, now)
    return result


@celery.task
def process_subscriptions() -> dict[str, int]:
    return run()
