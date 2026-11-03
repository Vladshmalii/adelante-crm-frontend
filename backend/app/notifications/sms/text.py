"""Текст SMS-напоминания и номер получателя (backend/docs/sms-reminders.md, разделы 5–6).

Текст фиксированный на всю сеть и всегда укладывается в одно SMS: кириллица
идёт в UCS-2 — 70 символов в одном сегменте, 67 в каждой части длинного.
Длина считается в кодовых единицах UTF-16: эмодзи в названии салона занимает
два места.
"""

import math
import re
from datetime import datetime

from app.services.phones import normalize_phone
from app.timeutils import now_local, to_local

SMS_MAX_LENGTH = 70
UCS2_SEGMENT = 70
UCS2_PART = 67
ELLIPSIS = "…"

_UA_PHONE = re.compile(r"380\d{9}")


def ucs2_length(text: str) -> int:
    return len(text.encode("utf-16-le")) // 2


def segments(text: str) -> int:
    """Число SMS-частей в UCS-2 (тексты напоминаний всегда кириллические)."""
    length = ucs2_length(text)
    if length <= UCS2_SEGMENT:
        return 1
    return math.ceil(length / UCS2_PART)


def _day_label(start: datetime, now: datetime) -> str:
    days = (start.date() - now.date()).days
    if days == 0:
        return "сьогодні"
    if days == 1:
        return "завтра"
    return f"{start:%d.%m}"


def reminder_text(start_at: datetime, salon_name: str | None, now: datetime | None = None) -> str:
    """«Нагадуємо: сьогодні о 14:30, Adelante Позняки. Чекаємо!» — всегда ≤ 70 символов.

    Длинное название салона укорачивается с «…»; если не влезает и так —
    название убирается вместе с запятой.
    """
    start = to_local(start_at)
    current = to_local(now) if now is not None else now_local()
    head = f"Нагадуємо: {_day_label(start, current)} о {start:%H:%M}"
    tail = ". Чекаємо!"
    bare = head + tail
    salon = " ".join((salon_name or "").split())
    if not salon:
        return bare

    room = SMS_MAX_LENGTH - ucs2_length(f"{head}, {tail}")
    if ucs2_length(salon) > room:
        # Хотя бы один символ названия + «…», иначе название не пишем
        if room < 2:
            return bare
        while salon and ucs2_length(salon) + 1 > room:
            salon = salon[:-1]
        salon = salon.rstrip(" ,.-") + ELLIPSIS
        if salon == ELLIPSIS:
            return bare
    return f"{head}, {salon}{tail}"


def sms_phone(phone: str | None) -> str | None:
    """Номер для SMS — 380XXXXXXXXX; None — пусто, не Украина или некорректный."""
    if not phone:
        return None
    normalized = normalize_phone(phone)
    return normalized if _UA_PHONE.fullmatch(normalized) else None


# Причины статуса skipped (видны администратору в карточке клиента)
SKIP_NO_PHONE = "Немає номера телефону"
SKIP_BAD_PHONE = "Номер не український або некоректний"


def skip_reason(phone: str | None) -> str:
    return SKIP_NO_PHONE if not (phone or "").strip() else SKIP_BAD_PHONE
