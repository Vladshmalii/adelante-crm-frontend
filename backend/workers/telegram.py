"""Отправка сообщений в Telegram из воркеров.

Один бот платформы (решение от 25.08.2026): уведомления шлёт сам воркер
через Bot API по HTTP; процесс aiogram остаётся чисто интерактивным.

Токен бота входит в URL запроса — он не должен попадать в логи: логгер
httpx приглушён, ошибки пересобираются без URL. Повторять имеет смысл только
временные сбои (сеть, 429, 5xx); на остальные 4xx (бот заблокирован, чат не
найден, неверный токен) — предупреждение в лог без повторов.

deliver() сообщает вызывающему результат: напоминанию клиента после постоянной
ошибки нужен запасной SMS (backend/docs/sms-reminders.md, раздел 3).
send_message() — прежний вызов «отправил и забыл», теперь возвращает bool.
"""

import logging
from dataclasses import dataclass

import httpx

from app.config import get_settings

_API_URL = "https://api.telegram.org/bot{token}/sendMessage"

logger = logging.getLogger(__name__)
# httpx пишет в INFO полный URL запроса вместе с токеном
logging.getLogger("httpx").setLevel(logging.WARNING)


class TelegramTemporaryError(httpx.HTTPError):
    """Временный сбой Telegram — задача уйдёт на повтор (autoretry_for=httpx.HTTPError)."""


@dataclass(frozen=True)
class TelegramResult:
    ok: bool
    # Для постоянной ошибки: «403 Forbidden: bot was blocked by the user»
    error: str | None = None


def deliver(chat_id: int, text: str) -> TelegramResult:
    """Отправка с результатом: ok=False — постоянная ошибка 4xx (повторять бессмысленно).

    Временные сбои — TelegramTemporaryError (задача уходит на повтор).
    """
    settings = get_settings()
    try:
        response = httpx.post(
            _API_URL.format(token=settings.telegram_bot_token),
            json={"chat_id": chat_id, "text": text, "parse_mode": "HTML"},
            timeout=10.0,
        )
    except httpx.TransportError as exc:
        raise TelegramTemporaryError(f"Telegram недоступен: {type(exc).__name__}") from None

    if response.status_code == 429 or response.status_code >= 500:
        raise TelegramTemporaryError(f"Telegram ответил {response.status_code}")
    if response.status_code >= 400:
        try:
            description = str(response.json().get("description", ""))
        except ValueError:
            description = ""
        return TelegramResult(ok=False, error=f"{response.status_code} {description}".strip())
    return TelegramResult(ok=True)


def send_message(chat_id: int, text: str) -> bool:
    result = deliver(chat_id, text)
    if not result.ok:
        logger.warning("Telegram отклонил сообщение для чата %s: %s", chat_id, result.error)
    return result.ok
