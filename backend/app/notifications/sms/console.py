"""Провайдер console: dev и тесты. Пишет SMS в лог, ничего не отправляет."""

import logging

from app.notifications.sms.base import DeliveryStatus, SendResult
from app.notifications.sms.text import segments

logger = logging.getLogger(__name__)


class ConsoleProvider:
    name = "console"

    def send(self, phone: str, text: str, reference: str) -> SendResult:
        logger.info("SMS (console) на %s [%s]: %s", phone, reference, text)
        return SendResult(provider_message_id=f"console-{reference}", segments=segments(text))

    def fetch_status(self, message_ids: list[str]) -> dict[str, DeliveryStatus]:
        # Отправки нет — считаем доставленными, чтобы журнал в dev не висел в sent
        return {message_id: DeliveryStatus.DELIVERED for message_id in message_ids}
