"""Чистая логика без HTTP: телефоны, время, фильтры событий, рабочие окна."""

from datetime import UTC, date, datetime, time, timedelta

from app.models.shard import ShiftKind, StaffShift
from app.services.phones import normalize_phone, same_phone
from app.services.slots import _MasterCalendar
from app.timeutils import SALON_TZ, assume_local, day_bounds, format_local
from ws.main import visible_to


def test_normalize_phone_formats() -> None:
    expected = "380671234567"
    for raw in ("+380 (67) 123-45-67", "0671234567", "380671234567", "671234567", "+380671234567"):
        assert normalize_phone(raw) == expected, raw
    assert same_phone("+38 067 123 45 67", "0671234567")
    assert not same_phone(None, "0671234567")
    assert not same_phone("0671234568", "0671234567")


def test_naive_datetime_is_kyiv() -> None:
    value = assume_local(datetime(2026, 9, 28, 10, 0))
    assert value.utcoffset() == timedelta(hours=3)  # летнее время Киева
    aware = datetime(2026, 9, 28, 10, 0, tzinfo=UTC)
    assert assume_local(aware) is aware


def test_day_bounds_and_format() -> None:
    start, end = day_bounds(date(2026, 10, 25))  # переход на зимнее время — 25 часов
    assert end - start == timedelta(hours=25)
    assert format_local(datetime(2026, 9, 28, 11, 30, tzinfo=UTC)) == "28.09.2026 о 14:30"


def test_ws_master_sees_only_own_records() -> None:
    event = {
        "event_type": "record.updated",
        "payload": {"master_id": "a", "previous_master_id": "b"},
    }
    assert visible_to(event, "master", "a")
    assert visible_to(event, "master", "b")
    assert not visible_to(event, "master", "c")
    assert visible_to(event, "administrator", "c")
    review = {"event_type": "review.created", "payload": {"master_id": "a"}}
    assert not visible_to(review, "master", "a")


def test_notification_routing() -> None:
    from app.notifications.outbox import RECORD_CREATED, RECORD_UPDATED
    from workers.tasks.notify import (
        _master_messages,
        wants_manager_notification,
        wants_master_notification,
    )

    base = {
        "client_name": "Олена",
        "service_name": "Стрижка",
        "start_at": "2026-10-01T09:00:00+00:00",
    }
    created = {**base, "master_id": "m1"}
    queue = {**base, "master_id": None}
    assert wants_master_notification(RECORD_CREATED, created)
    assert not wants_master_notification(RECORD_CREATED, queue)
    assert wants_manager_notification(RECORD_CREATED, created)
    # Администраторам: новая запись, перенос (сменилось время), отмена — любые записи
    assert wants_manager_notification(RECORD_UPDATED, {**queue, "change": "cancelled"})
    assert wants_manager_notification(RECORD_UPDATED, {**created, "change": "cancelled"})
    assert wants_manager_notification(
        RECORD_UPDATED,
        {**created, "change": "rescheduled", "previous_start_at": "2026-10-01T08:00:00+00:00"},
    )
    assert not wants_manager_notification(RECORD_UPDATED, {**created, "change": "rescheduled"})
    assert not wants_manager_notification(RECORD_UPDATED, {**created, "change": "status"})
    assert not wants_master_notification(RECORD_UPDATED, {**created, "change": "status"})

    reassigned = {**base, "master_id": "m2", "previous_master_id": "m1", "change": "reassigned"}
    messages = dict(_master_messages(RECORD_UPDATED, reassigned))
    assert "передано іншому майстру" in messages["m1"]
    assert "Новий запис до вас" in messages["m2"]
    moved = {**created, "change": "rescheduled", "previous_start_at": "2026-10-01T08:00:00+00:00"}
    text = dict(_master_messages(RECORD_UPDATED, moved))["m1"]
    assert "Було: 01.10.2026 о 11:00" in text and "Стало: 01.10.2026 о 12:00" in text


def _shift(day: date, kind: ShiftKind = ShiftKind.SHIFT, **times: time) -> StaffShift:
    return StaffShift(staff_id=None, date=day, kind=kind, **times)


def _calendar(day: date, **kwargs):  # type: ignore[no-untyped-def]
    shift = kwargs.get("shift") or _shift(
        day, start_time=time(9), end_time=time(18), break_start=time(13), break_end=time(14)
    )
    return _MasterCalendar(shifts={day: shift}, busy=kwargs.get("busy", []))


def test_slots_respect_shift_break_and_busy() -> None:
    day = date(2026, 10, 1)
    busy_start = datetime(2026, 10, 1, 10, 0, tzinfo=SALON_TZ).astimezone(UTC)
    calendar = _calendar(day, busy=[(busy_start, busy_start + timedelta(hours=1))])
    labels = [s.label for s in calendar.slots(day, timedelta(minutes=60), None)]
    assert labels[0] == "09:00"
    assert "09:15" not in labels  # пересекается с записью 10:00–11:00
    assert "11:00" in labels
    assert "12:15" not in labels  # не помещается до перерыва
    assert "14:00" in labels and labels[-1] == "17:00"
    assert calendar.work_minutes(day) == 8 * 60

    vacation = _calendar(day, shift=_shift(day, ShiftKind.VACATION))
    assert (
        vacation.slots(day, timedelta(minutes=30), None) == [] and vacation.work_minutes(day) == 0
    )
    evening = _calendar(day, shift=_shift(day, start_time=time(20), end_time=time(21)))
    labels = [s.label for s in evening.slots(day, timedelta(minutes=30), None)]
    assert labels == ["20:00", "20:15", "20:30"]
    assert _MasterCalendar().slots(day, timedelta(minutes=30), None) == []  # нет смены


def test_fits_schedule() -> None:
    day = date(2026, 10, 1)
    calendar = _calendar(day)
    at = datetime(2026, 10, 1, 12, 30, tzinfo=SALON_TZ)
    assert calendar.fits(at, at + timedelta(minutes=30))
    assert not calendar.fits(at, at + timedelta(minutes=45))  # залезает в перерыв


def test_shift_spec_validation() -> None:
    import pytest
    from pydantic import ValidationError

    from app.services.shifts import ShiftSpec, describe

    ok = ShiftSpec(start=time(9), end=time(18), break_start=time(13), break_end=time(14))
    assert describe(ok) == "09:00–18:00 (перерва 13:00–14:00)"
    mark = ShiftSpec(kind=ShiftKind.SICK, start=time(9), end=time(10))
    assert mark.start is None and describe(mark) == "лікарняний"
    for bad in (
        {"start": time(18), "end": time(9)},
        {"start": time(9)},
        {"start": time(9), "end": time(18), "break_start": time(13)},
        {"start": time(9), "end": time(18), "break_start": time(8), "break_end": time(10)},
    ):
        with pytest.raises(ValidationError):
            ShiftSpec(**bad)


def test_telegram_errors_hide_token(monkeypatch, caplog) -> None:  # type: ignore[no-untyped-def]
    import httpx
    import pytest

    from workers import telegram

    def reply(status: int):  # type: ignore[no-untyped-def]
        return lambda url, **kw: httpx.Response(
            status, json={"description": "Forbidden: bot was blocked by the user"}
        )

    monkeypatch.setattr(httpx, "post", reply(403))
    telegram.send_message(1, "x")  # 4xx — без исключения и повторов
    assert "blocked" in caplog.text and "123:test" not in caplog.text

    monkeypatch.setattr(httpx, "post", reply(502))
    with pytest.raises(telegram.TelegramTemporaryError) as exc:
        telegram.send_message(1, "x")
    assert "123:test" not in str(exc.value)
