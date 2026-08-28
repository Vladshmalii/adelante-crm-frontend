"""Отправка сообщений в Telegram из воркеров.

Один бот платформы (решение от 25.08.2026): уведомления шлёт сам воркер
через Bot API по HTTP; процесс aiogram остаётся чисто интерактивным.
"""

import httpx

from app.config import get_settings

_API_URL = "https://api.telegram.org/bot{token}/sendMessage"


def send_message(chat_id: int, text: str) -> None:
    settings = get_settings()
    response = httpx.post(
        _API_URL.format(token=settings.telegram_bot_token),
        json={"chat_id": chat_id, "text": text, "parse_mode": "HTML"},
        timeout=10.0,
    )
    response.raise_for_status()
