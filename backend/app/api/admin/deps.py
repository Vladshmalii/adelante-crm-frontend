"""Общие зависимости Admin API."""

import uuid
from typing import Annotated

from fastapi import Depends
from pydantic import BaseModel

from app.api.security import AuthenticatedUser, Role, require_salon_access
from app.models.master import Administrator, Master
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
