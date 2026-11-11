"""SMS без БД: текст напоминания, номер получателя, провайдеры (TurboSMS — на моках HTTP)."""

import json
import logging
from datetime import UTC, datetime
from typing import Any

import httpx
import pytest

from app.notifications.sms import (
    ConsoleProvider,
    DeliveryStatus,
    SmsPermanentError,
    SmsTemporaryError,
    TurboSmsProvider,
)
from app.notifications.sms.text import (
    SKIP_BAD_PHONE,
    SKIP_NO_PHONE,
    reminder_text,
    segments,
    skip_reason,
    sms_phone,
    ucs2_length,
)
from app.timeutils import SALON_TZ

NOW = datetime(2026, 11, 3, 9, 0, tzinfo=SALON_TZ)


def _at(day: int, hour: int, minute: int) -> datetime:
    return datetime(2026, 11, day, hour, minute, tzinfo=SALON_TZ)


# --- Текст --------------------------------------------------------------------


def test_text_example_from_spec() -> None:
    text = reminder_text(_at(3, 14, 30), "Adelante Позняки", NOW)
    assert text == "Нагадуємо: сьогодні о 14:30, Adelante Позняки. Чекаємо!"
    assert len(text) == 55


def test_text_day_labels() -> None:
    assert reminder_text(_at(4, 10, 0), "A", NOW).startswith("Нагадуємо: завтра о 10:00")
    assert reminder_text(_at(6, 9, 5), "A", NOW).startswith("Нагадуємо: 06.11 о 09:05")


def test_text_uses_kyiv_time() -> None:
    # 21:30 UTC 3 ноября = 23:30 по Киеву того же дня (зимнее время, UTC+2)
    start = datetime(2026, 11, 3, 21, 30, tzinfo=UTC)
    now = datetime(2026, 11, 3, 21, 0, tzinfo=UTC)
    assert reminder_text(start, None, now) == "Нагадуємо: сьогодні о 23:30. Чекаємо!"
    # 22:30 UTC — уже 00:30 4 ноября по Киеву: «сьогодні» относительно киевского now
    start = datetime(2026, 11, 3, 22, 30, tzinfo=UTC)
    now = datetime(2026, 11, 3, 22, 10, tzinfo=UTC)
    assert reminder_text(start, None, now).startswith("Нагадуємо: сьогодні о 00:30")
    # А для киевского вечера 3-го это «завтра»
    assert reminder_text(start, None, _at(3, 23, 0)).startswith("Нагадуємо: завтра о 00:30")


@pytest.mark.parametrize(
    "salon",
    [
        "Adelante " + "Дуже Довга Назва Салону Краси " * 5,
        "Салон 💅💅💅💅💅💅💅💅💅💅💅💅💅💅💅💅💅💅💅",
        "A" * 31,
        "A" * 32,
        "Б" * 200,
        "   ",
        None,
    ],
)
@pytest.mark.parametrize("start", [_at(3, 14, 30), _at(4, 14, 30), _at(20, 14, 30)])
def test_text_always_fits_one_sms(salon: str | None, start: datetime) -> None:
    text = reminder_text(start, salon, NOW)
    assert ucs2_length(text) <= 70
    assert segments(text) == 1
    assert text.startswith("Нагадуємо: ") and text.endswith(". Чекаємо!")


def test_text_long_salon_is_shortened_with_ellipsis() -> None:
    text = reminder_text(_at(3, 14, 30), "A" * 32, NOW)
    assert text == "Нагадуємо: сьогодні о 14:30, " + "A" * 30 + "…. Чекаємо!"
    assert len(text) == 70
    # Ровно 31 символ влезает без сокращения
    assert "…" not in reminder_text(_at(3, 14, 30), "A" * 31, NOW)


def test_text_without_salon() -> None:
    assert reminder_text(_at(3, 14, 30), "", NOW) == "Нагадуємо: сьогодні о 14:30. Чекаємо!"


def test_segments() -> None:
    assert segments("Я" * 70) == 1
    assert segments("Я" * 71) == 2
    assert segments("Я" * 134) == 2
    assert segments("Я" * 135) == 3
    assert segments("💅" * 35) == 1
    assert segments("💅" * 36) == 2


# --- Номер --------------------------------------------------------------------


def test_sms_phone_formats() -> None:
    for raw in ("+380 (67) 123-45-67", "0671234567", "380671234567", "671234567", "+38067 1234567"):
        assert sms_phone(raw) == "380671234567", raw


@pytest.mark.parametrize("raw", [None, "", "  ", "+48 512 345 678", "+1 202 555 0143", "12345"])
def test_sms_phone_rejects(raw: str | None) -> None:
    assert sms_phone(raw) is None


def test_skip_reason() -> None:
    assert skip_reason(None) == SKIP_NO_PHONE
    assert skip_reason(" ") == SKIP_NO_PHONE
    assert skip_reason("+48512345678") == SKIP_BAD_PHONE


# --- Провайдеры ---------------------------------------------------------------


def test_console_provider(caplog: pytest.LogCaptureFixture) -> None:
    caplog.set_level(logging.INFO)
    result = ConsoleProvider().send("380671234567", "Нагадуємо", "ref-1")
    assert result.provider_message_id == "console-ref-1"
    assert result.segments == 1
    assert "380671234567" in caplog.text


TOKEN = "secret-token-123"


def _turbo(handler: Any) -> tuple[TurboSmsProvider, list[httpx.Request]]:
    requests: list[httpx.Request] = []

    def wrapped(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        return handler(request)

    provider = TurboSmsProvider(TOKEN, "ADELANTE", transport=httpx.MockTransport(wrapped))
    return provider, requests


def _ok(message_id: str = "f83f8868-5e46-c6cf-e4fb-615e5a293754", code: int = 800) -> Any:
    return lambda request: httpx.Response(
        200,
        json={
            "response_code": code,
            "response_status": "SUCCESS_MESSAGE_ACCEPTED",
            "response_result": [
                {
                    "phone": "380671234567",
                    "response_code": 0,
                    "message_id": message_id,
                    "response_status": "OK",
                }
            ],
        },
    )


def test_turbosms_send_success() -> None:
    provider, requests = _turbo(_ok())
    result = provider.send("380671234567", "Нагадуємо: сьогодні о 14:30. Чекаємо!", "evt-1")
    assert result.provider_message_id == "f83f8868-5e46-c6cf-e4fb-615e5a293754"
    assert result.segments == 1
    assert result.cost is None

    request = requests[0]
    assert str(request.url) == "https://api.turbosms.ua/message/send.json"
    assert request.headers["Authorization"] == f"Bearer {TOKEN}"
    assert TOKEN not in str(request.url)
    body = json.loads(request.content)
    assert body == {
        "recipients": ["380671234567"],
        "sms": {"sender": "ADELANTE", "text": "Нагадуємо: сьогодні о 14:30. Чекаємо!"},
        "sequence_id": "evt-1",
    }


def test_turbosms_duplicate_request_returns_previous_result() -> None:
    """Повтор с тем же sequence_id — 507 и результат первого запроса, без второго SMS."""
    provider, _ = _turbo(_ok("prev-id", code=507))
    assert provider.send("380671234567", "x", "evt-1").provider_message_id == "prev-id"


def test_turbosms_partial_accepted_with_recipient_error_is_permanent() -> None:
    provider, _ = _turbo(
        lambda request: httpx.Response(
            200,
            json={
                "response_code": 802,
                "response_status": "SUCCESS_MESSAGE_PARTIAL_ACCEPTED",
                "response_result": [
                    {
                        "phone": "380671234567",
                        "response_code": 404,
                        "message_id": None,
                        "response_status": "NOT_ALLOWED_NUMBER_STOPLIST",
                    }
                ],
            },
        )
    )
    with pytest.raises(SmsPermanentError, match="404 NOT_ALLOWED_NUMBER_STOPLIST"):
        provider.send("380671234567", "x", "evt-1")


@pytest.mark.parametrize(
    ("code", "status", "error"),
    [
        (305, "INVALID_PHONE", SmsPermanentError),
        (105, "REQUIRED_AUTH", SmsPermanentError),
        (203, "REQUIRED_BALANCE", SmsPermanentError),
        (401, "NOT_ALLOWED_MESSAGE_SENDER_NOT_ACTIVE", SmsPermanentError),
        (406, "NOT_ALLOWED_RECIPIENT_COUNTRY", SmsPermanentError),
        (428, "NOT_ALLOWED_MESSAGES_NUMBER_LIMIT", SmsTemporaryError),
        (503, "FAILED_SMS_SEND", SmsTemporaryError),
        (9001, "FATAL_ERROR", SmsTemporaryError),
    ],
)
def test_turbosms_error_codes(code: int, status: str, error: type[Exception]) -> None:
    provider, _ = _turbo(
        lambda request: httpx.Response(
            200, json={"response_code": code, "response_status": status, "response_result": None}
        )
    )
    with pytest.raises(error, match=str(code)):
        provider.send("380671234567", "x", "evt-1")


@pytest.mark.parametrize("http_status", [500, 502, 503, 429])
def test_turbosms_http_errors_are_temporary(http_status: int) -> None:
    provider, _ = _turbo(lambda request: httpx.Response(http_status, text="oops"))
    with pytest.raises(SmsTemporaryError):
        provider.send("380671234567", "x", "evt-1")


def test_turbosms_network_error_is_temporary_and_hides_token() -> None:
    def fail(request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError(f"cannot connect {request.url} {request.headers}")

    provider, _ = _turbo(fail)
    with pytest.raises(SmsTemporaryError) as info:
        provider.send("380671234567", "x", "evt-1")
    assert TOKEN not in str(info.value)
    assert info.value.__cause__ is None
    assert TOKEN not in repr(provider)


def test_turbosms_bad_json_is_temporary() -> None:
    provider, _ = _turbo(lambda request: httpx.Response(200, text="<html>"))
    with pytest.raises(SmsTemporaryError):
        provider.send("380671234567", "x", "evt-1")


def test_turbosms_without_token_is_permanent() -> None:
    provider = TurboSmsProvider("", "ADELANTE", transport=httpx.MockTransport(_ok()))
    with pytest.raises(SmsPermanentError, match="TURBOSMS_TOKEN"):
        provider.send("380671234567", "x", "evt-1")


def test_turbosms_fetch_status() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        assert str(request.url) == "https://api.turbosms.ua/message/status.json"
        ids = json.loads(request.content)["messages"]
        statuses = {"a": "Delivered", "b": "Undelivered", "c": "Sent", "d": "Rejected", "e": "Read"}
        result = [
            {"message_id": i, "response_code": 0, "status": statuses[i], "response_status": "OK"}
            for i in ids
            if i in statuses
        ]
        result.append(
            {"message_id": "zzz", "response_code": 414, "response_status": "NOT_ALLOWED_MESSAGE_ID"}
        )
        return httpx.Response(
            200, json={"response_code": 0, "response_status": "OK", "response_result": result}
        )

    provider, requests = _turbo(handler)
    assert provider.fetch_status(["a", "b", "c", "d", "e", "zzz"]) == {
        "a": DeliveryStatus.DELIVERED,
        "b": DeliveryStatus.UNDELIVERED,
        "c": DeliveryStatus.SENT,
        "d": DeliveryStatus.UNDELIVERED,
        "e": DeliveryStatus.DELIVERED,
    }
    assert requests[0].headers["Authorization"] == f"Bearer {TOKEN}"


def test_turbosms_fetch_status_in_batches() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        ids = json.loads(request.content)["messages"]
        assert len(ids) <= 100
        return httpx.Response(
            200,
            json={
                "response_code": 0,
                "response_status": "OK",
                "response_result": [
                    {"message_id": i, "response_code": 0, "status": "Delivered"} for i in ids
                ],
            },
        )

    provider, requests = _turbo(handler)
    assert len(provider.fetch_status([str(i) for i in range(250)])) == 250
    assert len(requests) == 3
