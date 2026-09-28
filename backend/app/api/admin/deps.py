"""Общие зависимости Admin API."""

import uuid
from typing import Annotated

from fastapi import Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import Select, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.security import AuthenticatedUser, Role, require_salon_access
from app.models.master import Administrator, Master
from app.models.shard import Record
from app.tenancy.deps import MasterSession


class Author(BaseModel):
    id: uuid.UUID
    name: str
    role: Role


async def get_author(
    user: Annotated[AuthenticatedUser, Depends(require_salon_access)],
    master_session: MasterSession,
) -> Author:
    """Текущий пользователь с именем — для снапшотов created_by/author в аудите."""
    person: Administrator | Master | None
    if user.role == Role.ADMINISTRATOR:
        person = await master_session.get(Administrator, user.id)
    else:
        person = await master_session.get(Master, user.id)
    name = person.full_name if person else "—"
    return Author(id=user.id, name=name, role=user.role)


CurrentAuthor = Annotated[Author, Depends(get_author)]


# --- «Только свои» для мастера ------------------------------------------------
# Свои записи — где он мастер; свои клиенты — у которых есть хотя бы одна
# запись к нему в этом салоне, в любом статусе (решение от 28.09.2026).
# Чужое для мастера — 404, а не 403: не раскрываем, что объект существует.


def ensure_own_record(user: AuthenticatedUser, record: Record) -> None:
    if user.is_master and record.master_id != user.id:
        raise HTTPException(404, "Запись не найдена")


def own_client_ids(master_id: uuid.UUID) -> Select[uuid.UUID]:
    return select(Record.client_id).where(Record.master_id == master_id).distinct()


async def ensure_own_client(
    tenant_session: AsyncSession, user: AuthenticatedUser, client_id: uuid.UUID
) -> None:
    if not user.is_master:
        return
    found = await tenant_session.scalar(
        select(Record.id).where(Record.client_id == client_id, Record.master_id == user.id).limit(1)
    )
    if found is None:
        raise HTTPException(404, "Клиент не найден")
