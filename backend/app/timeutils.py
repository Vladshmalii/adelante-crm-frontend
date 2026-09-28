"""Часовой пояс платформы — жёстко Europe/Kyiv (решение от 28.09.2026).

В БД время хранится в UTC (timestamptz). Всё, что зависит от «локального»
времени — границы дня, рабочие часы, тексты уведомлений, группировка отчётов
по дням, — считается в Europe/Kyiv. Время без зоны во входящих данных
трактуется как киевское.
"""

from datetime import UTC, date, datetime, time
from typing import Annotated
from zoneinfo import ZoneInfo

from pydantic import AfterValidator

SALON_TZ_NAME = "Europe/Kyiv"
SALON_TZ = ZoneInfo(SALON_TZ_NAME)


def assume_local(value: datetime) -> datetime:
    """Время без зоны — киевское; с зоной — как есть."""
    if value.tzinfo is None:
        return value.replace(tzinfo=SALON_TZ)
    return value


# Для входящих datetime (тела запросов и query-параметры)
LocalDatetime = Annotated[datetime, AfterValidator(assume_local)]


def now_local() -> datetime:
    return datetime.now(SALON_TZ)


def to_local(value: datetime) -> datetime:
    return value.astimezone(SALON_TZ)


def day_bounds(day: date) -> tuple[datetime, datetime]:
    """Начало и конец киевских суток в UTC: [start, end)."""
    start = datetime.combine(day, time.min, tzinfo=SALON_TZ)
    end = datetime.combine(date.fromordinal(day.toordinal() + 1), time.min, tzinfo=SALON_TZ)
    return start.astimezone(UTC), end.astimezone(UTC)


def format_local(value: datetime) -> str:
    """«28.09.2026 о 14:30» — для текстов уведомлений."""
    local = to_local(value)
    return f"{local:%d.%m.%Y} о {local:%H:%M}"
