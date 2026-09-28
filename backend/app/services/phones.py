"""Сравнение телефонов, записанных в разном формате.

В базе встречаются «+380 (67) 123-45-67», «0671234567», «380671234567»;
Telegram присылает контакт как «380671234567» или «+380671234567».
Номера сравниваются по нормализованной форме — цифры с кодом страны.
"""

import re

from sqlalchemy import ColumnElement, func
from sqlalchemy.orm import InstrumentedAttribute


def normalize_phone(phone: str) -> str:
    digits = re.sub(r"\D", "", phone)
    if len(digits) == 10 and digits.startswith("0"):
        return "38" + digits
    if len(digits) == 9:
        return "380" + digits
    return digits


def phone_prefilter(column: InstrumentedAttribute[str | None], phone: str) -> ColumnElement[bool]:
    """Грубый SQL-фильтр по последним 9 цифрам; точное сравнение — normalize_phone."""
    tail = normalize_phone(phone)[-9:]
    return func.right(func.regexp_replace(column, r"\D", "", "g"), 9) == tail


def same_phone(a: str | None, b: str) -> bool:
    return a is not None and normalize_phone(a) == normalize_phone(b)
