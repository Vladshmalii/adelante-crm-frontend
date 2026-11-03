"""Провайдер TurboSMS — HTTP API (https://turbosms.ua/api.html, сверено 2026-11-03).

- Отправка: POST {api}/message/send.json, JSON {recipients, sms: {sender, text}, sequence_id},
  авторизация заголовком «Authorization: Bearer <token>».
- HTTP-статус на любой корректный запрос — 200; результат в теле:
  {response_code, response_status, response_result}. Для отправки response_result —
  список по получателям: {phone, response_code, message_id, response_status}.
- sequence_id (≤ 40 символов) — идемпотентность: повтор с тем же id в течение
  30 дней возвращает 507 FAILED_DUPLICATE_REQUEST с результатами первого запроса.
  Поэтому повтор после таймаута не даёт второго SMS.
- Статусы: POST {api}/message/status.json {messages: [...]} → по сообщению поле status:
  Queued, Accepted, Sent, Delivered, Read, Expired, Undelivered, Rejected, Unknown,
  Failed, Cancelled. Неизвестный id — response_code 414.
- Стоимость и число сегментов отправка не возвращает: сегменты считаем сами,
  стоимость — по ADELANTE_SMS_PRICE_UAH.

Токен в URL не передаётся, заголовки и тело запроса не логируются; текст ошибок —
только код и статус TurboSMS.
"""

import logging
from typing import Any

import httpx

from app.notifications.sms.base import (
    DeliveryStatus,
    SendResult,
    SmsPermanentError,
    SmsTemporaryError,
)
from app.notifications.sms.text import segments

logger = logging.getLogger(__name__)
# httpx пишет запросы в INFO; держим его тише, как в workers/telegram.py
logging.getLogger("httpx").setLevel(logging.WARNING)

# Коды успеха отправки (весь запрос или часть получателей)
SUCCESS_CODES = {0, 800, 801, 802, 803, 507}
# Временные: лимиты по частоте и IP, сбои на стороне TurboSMS
TEMPORARY_CODES = {428, 436, 437, 438, 500, 501, 503}
CODE_NOT_ALLOWED_MESSAGE_ID = 414

STATUS_MAP = {
    "delivered": DeliveryStatus.DELIVERED,
    "read": DeliveryStatus.DELIVERED,
    "expired": DeliveryStatus.UNDELIVERED,
    "undelivered": DeliveryStatus.UNDELIVERED,
    "rejected": DeliveryStatus.UNDELIVERED,
    "failed": DeliveryStatus.UNDELIVERED,
    "cancelled": DeliveryStatus.UNDELIVERED,
    "queued": DeliveryStatus.SENT,
    "accepted": DeliveryStatus.SENT,
    "sent": DeliveryStatus.SENT,
    "unknown": DeliveryStatus.SENT,
}
STATUS_BATCH = 100


def is_temporary(code: int) -> bool:
    # code < 0 — ответ без кода (повреждён): повторяем
    return code < 0 or code in TEMPORARY_CODES or 9000 <= code <= 9999


class TurboSmsProvider:
    name = "turbosms"

    def __init__(
        self,
        token: str,
        sender: str,
        *,
        api_url: str = "https://api.turbosms.ua",
        timeout: float = 30.0,
        transport: httpx.BaseTransport | None = None,
    ) -> None:
        self._token = token
        self._sender = sender
        self._api_url = api_url.rstrip("/")
        self._timeout = timeout
        self._transport = transport

    def __repr__(self) -> str:  # токен не должен попасть в логи через repr
        return f"TurboSmsProvider(sender={self._sender!r})"

    def _post(self, method: str, body: dict[str, Any]) -> dict[str, Any]:
        if not self._token:
            raise SmsPermanentError("TurboSMS: не задано ADELANTE_TURBOSMS_TOKEN")
        try:
            with httpx.Client(transport=self._transport, timeout=self._timeout) as client:
                response = client.post(
                    f"{self._api_url}/{method}",
                    json=body,
                    headers={"Authorization": f"Bearer {self._token}"},
                )
        except httpx.TransportError as exc:
            raise SmsTemporaryError(f"TurboSMS недоступний: {type(exc).__name__}") from None
        if response.status_code != 200:
            raise SmsTemporaryError(f"TurboSMS відповів HTTP {response.status_code}")
        try:
            data = response.json()
        except ValueError:
            raise SmsTemporaryError("TurboSMS: некоректна відповідь") from None
        if not isinstance(data, dict):
            raise SmsTemporaryError("TurboSMS: некоректна відповідь")
        return data

    @staticmethod
    def _error(code: int, status: str | None) -> Exception:
        message = f"TurboSMS {code} {status or ''}".rstrip()
        return SmsTemporaryError(message) if is_temporary(code) else SmsPermanentError(message)

    def send(self, phone: str, text: str, reference: str) -> SendResult:
        data = self._post(
            "message/send.json",
            {
                "recipients": [phone],
                "sms": {"sender": self._sender, "text": text},
                "sequence_id": reference[:40],
            },
        )
        code = _int(data.get("response_code"))
        if code not in SUCCESS_CODES:
            raise self._error(code, data.get("response_status"))

        results = data.get("response_result")
        if not isinstance(results, list) or not results:
            raise SmsTemporaryError("TurboSMS: немає результату відправки")
        item = next(
            (r for r in results if isinstance(r, dict) and str(r.get("phone")) == phone),
            results[0],
        )
        if not isinstance(item, dict):
            raise SmsTemporaryError("TurboSMS: некоректна відповідь")
        item_code = _int(item.get("response_code"))
        message_id = item.get("message_id")
        if item_code != 0 or not message_id:
            raise self._error(item_code, item.get("response_status"))
        return SendResult(provider_message_id=str(message_id), segments=segments(text))

    def fetch_status(self, message_ids: list[str]) -> dict[str, DeliveryStatus]:
        statuses: dict[str, DeliveryStatus] = {}
        for i in range(0, len(message_ids), STATUS_BATCH):
            data = self._post(
                "message/status.json", {"messages": message_ids[i : i + STATUS_BATCH]}
            )
            results = data.get("response_result")
            if not isinstance(results, list):
                code = _int(data.get("response_code"))
                raise self._error(code, data.get("response_status"))
            for item in results:
                if not isinstance(item, dict) or not item.get("message_id"):
                    continue
                if _int(item.get("response_code")) == CODE_NOT_ALLOWED_MESSAGE_ID:
                    continue
                status = STATUS_MAP.get(str(item.get("status") or "").lower())
                if status is None:
                    logger.warning("TurboSMS: невідомий статус %r", item.get("status"))
                    continue
                statuses[str(item["message_id"])] = status
        return statuses


def _int(value: Any) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return -1
