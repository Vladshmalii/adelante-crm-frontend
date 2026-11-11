"""Настройки салона: «Інформація про салон», «Графік роботи салону», «Нагадування».

Название салона живёт в реестре Master DB (salons.name — его видят бот, сайт
записи, переключатель салона); остальное — JSON в таблице settings шарда
под ключами salon_info, salon_schedule и notifications.
"""

from datetime import date, time
from typing import Any

from pydantic import BaseModel, ConfigDict, EmailStr, Field, ValidationError, model_validator
from pydantic.alias_generators import to_camel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session

from app.models.shard import Setting

INFO_KEY = "salon_info"
SCHEDULE_KEY = "salon_schedule"
NOTIFICATIONS_KEY = "notifications"
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


# --- Нагадування (backend/docs/sms-reminders.md, раздел 4) ---------------------

REMINDER_LEAD_DEFAULT = 30
REMINDER_LEAD_MIN = 15
REMINDER_LEAD_MAX = 1440


class NotificationSettings(BaseModel):
    """За сколько минут до визита напоминать клиенту."""

    reminder_lead_minutes: int = Field(
        default=REMINDER_LEAD_DEFAULT, ge=REMINDER_LEAD_MIN, le=REMINDER_LEAD_MAX
    )


def _notifications(stored: dict[str, Any] | None) -> NotificationSettings:
    # Нет ключа или он испорчен — значение по умолчанию, напоминания не должны ломаться
    try:
        return NotificationSettings.model_validate(stored or {})
    except ValidationError:
        return NotificationSettings()


async def load_notifications(session: AsyncSession) -> NotificationSettings:
    return _notifications(await _get(session, NOTIFICATIONS_KEY))


async def save_notifications(session: AsyncSession, value: NotificationSettings) -> None:
    await _put(session, NOTIFICATIONS_KEY, value.model_dump(mode="json"))


def load_notifications_sync(session: Session) -> NotificationSettings:
    """Для воркеров (sync-сессия шарда)."""
    setting = session.get(Setting, NOTIFICATIONS_KEY)
    return _notifications(setting.value if setting is not None else None)
