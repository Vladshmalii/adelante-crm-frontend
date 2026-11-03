"""Интерфейс SMS-провайдера (backend/docs/sms-reminders.md, раздел 6).

Код напоминаний работает только с этим интерфейсом; конкретный агрегатор —
подключаемая реализация (console, turbosms). Ошибки отправки делятся на
временные (повторять с backoff) и постоянные (неверный номер, отклонено —
не повторять).
"""

import enum
from dataclasses import dataclass
from decimal import Decimal
from typing import Protocol


class DeliveryStatus(enum.StrEnum):
    """Статус доставки, который умеет сообщить провайдер."""

    SENT = "sent"  # принято/в пути, финального статуса ещё нет
    DELIVERED = "delivered"
    UNDELIVERED = "undelivered"


@dataclass(frozen=True)
class SendResult:
    provider_message_id: str
    segments: int
    # Стоимость, если провайдер её вернул; иначе считается по SMS_PRICE_UAH
    cost: Decimal | None = None


class SmsError(Exception):
    """Ошибка отправки. Текст — код и статус провайдера, без токенов и URL."""


class SmsTemporaryError(SmsError):
    """Временный сбой (сеть, 5xx, лимиты) — задача уйдёт на повтор."""


class SmsPermanentError(SmsError):
    """Постоянная ошибка (неверный номер, стоп-лист, отклонено) — без повторов."""


class SmsProvider(Protocol):
    name: str

    def send(self, phone: str, text: str, reference: str) -> SendResult:
        """phone — 380XXXXXXXXX; reference — ключ идемпотентности (≤ 40 символов)."""
        ...

    def fetch_status(self, message_ids: list[str]) -> dict[str, DeliveryStatus]:
        """Текущие статусы; неизвестные провайдеру id в ответ не попадают."""
        ...
