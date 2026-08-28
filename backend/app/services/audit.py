"""Запись в аудит-лог шарда — вкладка «Изменения» и history записи.

Вызывается сервис-слоем/роутерами при каждой мутации. details — диф
изменённых полей: {"field": [старое, новое]}.
"""

import uuid
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.shard import AuditAction, AuditLog


def write_audit(
    session: AsyncSession,
    *,
    entity: str,
    entity_id: uuid.UUID | str,
    entity_name: str,
    action: AuditAction,
    author_id: uuid.UUID | None = None,
    author_name: str | None = None,
    details: dict[str, Any] | None = None,
) -> None:
    session.add(
        AuditLog(
            entity=entity,
            entity_id=str(entity_id),
            entity_name=entity_name,
            action=action,
            author_id=author_id,
            author_name=author_name,
            details=details,
        )
    )


def diff_fields(obj: Any, updates: dict[str, Any]) -> dict[str, list[Any]]:
    """Диф «старое → новое» по полям, которые реально меняются."""
    changes: dict[str, list[Any]] = {}
    for field, new in updates.items():
        old = getattr(obj, field, None)
        if old != new:
            changes[field] = [_plain(old), _plain(new)]
    return changes


def _plain(value: Any) -> Any:
    if value is None or isinstance(value, (str, int, float, bool)):
        return value
    return str(value)
