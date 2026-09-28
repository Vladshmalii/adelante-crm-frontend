"""Настройки салона: «Інформація про салон» и «Графік роботи салону».

Название салона живёт в реестре Master DB (salons.name — его видят бот, сайт
записи, переключатель салона); остальное — JSON в таблице settings шарда
под ключами salon_info и salon_schedule.
"""

from datetime import date, time
from typing import Any

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator
from pydantic.alias_generators import to_camel
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.shard import Setting

INFO_KEY = "salon_info"
SCHEDULE_KEY = "salon_schedule"
WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]


class SalonInfo(BaseModel):
    """Всё, кроме названия. Пустые поля — null."""

    legal_name: str | None = Field(default=None, max_length=255)
    city: str | None = Field(default=None, max_length=128)
    address: str | None = Field(default=None, max_length=500)
    phone: str | None = Field(default=None, max_length=32)
    email: EmailStr | None = None
    website: str | None = Field(default=None, max_length=255)
    instagram: str | None = Field(default=None, max_length=255)
    facebook: str | None = Field(default=None, max_length=255)
    opened_on: date | None = None
    description: str | None = Field(default=None, max_length=2000)


class SalonDay(BaseModel):
    # camelCase в API (isWorkDay), snake_case в хранимом JSON
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    is_work_day: bool = False
    start: time | None = None
    end: time | None = None

    @model_validator(mode="after")
    def _check_hours(self) -> "SalonDay":
        if not self.is_work_day:
            self.start = self.end = None
        elif self.start is None or self.end is None:
            raise ValueError("Для робочого дня потрібні час початку і закінчення")
        elif self.start >= self.end:
            raise ValueError("Час закінчення має бути пізніше за час початку")
        return self


async def _get(session: AsyncSession, key: str) -> dict[str, Any] | None:
    setting = await session.get(Setting, key)
    return setting.value if setting is not None else None


async def _put(session: AsyncSession, key: str, value: dict[str, Any]) -> None:
    setting = await session.get(Setting, key)
    if setting is None:
        session.add(Setting(key=key, value=value))
    else:
        setting.value = value


async def load_info(session: AsyncSession) -> SalonInfo:
    return SalonInfo.model_validate(await _get(session, INFO_KEY) or {})


async def save_info(session: AsyncSession, info: SalonInfo) -> None:
    await _put(session, INFO_KEY, info.model_dump(mode="json"))


async def load_schedule(session: AsyncSession) -> dict[str, SalonDay] | None:
    """График по дням недели; None — ещё не заполнен."""
    stored = await _get(session, SCHEDULE_KEY)
    if stored is None:
        return None
    return {day: SalonDay.model_validate(stored.get(day) or {}) for day in WEEKDAYS}


async def save_schedule(session: AsyncSession, week: dict[str, SalonDay]) -> None:
    await _put(session, SCHEDULE_KEY, {day: week[day].model_dump(mode="json") for day in WEEKDAYS})
