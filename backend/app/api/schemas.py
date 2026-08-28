"""Общие схемы Admin API.

Фронтенд (axios-клиент ui/) работает с camelCase и конвертом
{ data, meta? } — все модели наследуются от ApiModel (alias_generator
to_camel, populate_by_name: запросы принимаются и в snake_case тоже).
"""

import math

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class ApiModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


class PageMeta(ApiModel):
    page: int
    per_page: int
    total: int
    total_pages: int


class Envelope[T](ApiModel):
    data: T
    meta: PageMeta | None = None


def page_meta(page: int, per_page: int, total: int) -> PageMeta:
    return PageMeta(
        page=page,
        per_page=per_page,
        total=total,
        total_pages=max(1, math.ceil(total / per_page)) if per_page else 1,
    )


class PersonRef(ApiModel):
    """Короткая ссылка на человека в ответах: {id, name}."""

    id: str | None = None
    name: str | None = None
