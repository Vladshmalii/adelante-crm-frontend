"""SMS: интерфейс провайдера, реализации и текст напоминания (backend/docs/sms-reminders.md)."""

from functools import lru_cache

from app.config import get_settings
from app.notifications.sms.base import (
    DeliveryStatus,
    SendResult,
    SmsError,
    SmsPermanentError,
    SmsProvider,
    SmsTemporaryError,
)
from app.notifications.sms.console import ConsoleProvider
from app.notifications.sms.turbosms import TurboSmsProvider


@lru_cache
def get_provider() -> SmsProvider:
    """Провайдер из ADELANTE_SMS_PROVIDER: console (по умолчанию) или turbosms."""
    settings = get_settings()
    if settings.sms_provider == "turbosms":
        return TurboSmsProvider(
            settings.turbosms_token.get_secret_value(),
            settings.sms_sender,
            api_url=settings.turbosms_api_url,
        )
    return ConsoleProvider()


__all__ = [
    "ConsoleProvider",
    "DeliveryStatus",
    "SendResult",
    "SmsError",
    "SmsPermanentError",
    "SmsProvider",
    "SmsTemporaryError",
    "TurboSmsProvider",
    "get_provider",
]
