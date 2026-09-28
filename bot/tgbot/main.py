"""Telegram-бот платформы (aiogram 3, long polling на MVP).

Один бот на все салоны (решение от 25.08.2026). Исходящие уведомления шлёт
Celery-воркер backend'а напрямую в Telegram API — этот процесс отвечает
только за интерактивные диалоги.

Бот не создаёт записи (решение от 28.09.2026):
- клиенту — ссылки на сайт записи; напоминания о визитах шлёт воркер;
- мастеру — его записи на сегодня или на выбранную дату;
- администратору — только уведомления от воркера.
Узнаёт пользователя по контакту: телефон ищется среди администраторов,
мастеров и клиентов.
"""

import asyncio
import html
import logging
import re
import sys
from datetime import date, datetime, timedelta
from typing import Any
from zoneinfo import ZoneInfo

from aiogram import Bot, Dispatcher, F, Router
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.filters import Command, CommandStart
from aiogram.types import (
    CallbackQuery,
    Contact,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    KeyboardButton,
    Message,
    ReplyKeyboardMarkup,
    ReplyKeyboardRemove,
)

from tgbot.api_client import BackendClient
from tgbot.config import get_settings

router = Router()

TZ = ZoneInfo("Europe/Kyiv")

BTN_TODAY = "📅 Записи на сьогодні"
BTN_DATE = "🗓 Записи на дату"
BTN_BOOK = "✍️ Записатися"
BTN_CONTACT = "📱 Поділитися контактом"

WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"]
STATUS_ICONS = {
    "scheduled": "🕓",
    "confirmed": "✅",
    "arrived": "🙋",
    "completed": "✔️",
    "no_show": "🚫",
}

MASTER_KEYBOARD = ReplyKeyboardMarkup(
    keyboard=[[KeyboardButton(text=BTN_TODAY), KeyboardButton(text=BTN_DATE)]],
    resize_keyboard=True,
)
CONTACT_KEYBOARD = ReplyKeyboardMarkup(
    keyboard=[
        [KeyboardButton(text=BTN_CONTACT, request_contact=True)],
        [KeyboardButton(text=BTN_BOOK)],
    ],
    resize_keyboard=True,
)
CLIENT_KEYBOARD = ReplyKeyboardMarkup(
    keyboard=[[KeyboardButton(text=BTN_BOOK)]], resize_keyboard=True
)


def today() -> date:
    return datetime.now(TZ).date()


def _hhmm(value: str) -> str:
    return datetime.fromisoformat(value).astimezone(TZ).strftime("%H:%M")


def _day_label(day: date) -> str:
    return f"{WEEKDAYS[day.weekday()]} {day:%d.%m}"


async def booking_keyboard(backend: BackendClient) -> InlineKeyboardMarkup | None:
    salons = await backend.salons()
    if not salons:
        return None
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text=f"Записатися: {s['name']}", url=s["booking_url"])]
            for s in salons
        ]
    )


async def send_booking_links(message: Message, backend: BackendClient) -> None:
    keyboard = await booking_keyboard(backend)
    if keyboard is None:
        await message.answer("Онлайн-запис поки недоступний.")
        return
    await message.answer("Оберіть салон, щоб записатися онлайн:", reply_markup=keyboard)


def format_day(data: dict[str, Any], day: date) -> str:
    lines = [f"<b>Ваші записи на {_day_label(day)}</b>"]
    total = 0
    many_salons = len(data["salons"]) > 1
    for salon in data["salons"]:
        if not salon["records"]:
            continue
        if many_salons:
            lines.append(f"\n🏠 <b>{html.escape(salon['salon_name'])}</b>")
        for r in salon["records"]:
            total += 1
            icon = STATUS_ICONS.get(r["status"], "•")
            client = html.escape(r["client_name"])
            if r.get("visitor_name"):
                client += f" (для: {html.escape(r['visitor_name'])})"
            services = html.escape(", ".join(r["services"]))
            lines.append(
                f"{icon} <b>{_hhmm(r['start_at'])}–{_hhmm(r['end_at'])}</b> {client}\n"
                f"    {services} · {html.escape(r['client_phone'])}"
            )
            if r.get("comment"):
                lines.append(f"    💬 {html.escape(r['comment'])}")
    if total == 0:
        return f"На {_day_label(day)} записів немає."
    return "\n".join(lines)


async def send_master_day(
    message: Message, backend: BackendClient, telegram_user_id: int, day: date
) -> None:
    data = await backend.master_records(telegram_user_id, day)
    if data is None:
        await message.answer("Розклад доступний лише майстрам салону.")
        return
    await message.answer(format_day(data, day), reply_markup=MASTER_KEYBOARD)


async def greet(message: Message, backend: BackendClient, identity: dict[str, Any]) -> None:
    name = html.escape(identity.get("name") or message.from_user.full_name)
    role = identity.get("role")
    if role == "administrator":
        await message.answer(
            f"Вітаємо, <b>{name}</b>!\nВи адміністратор салону. Сюди надходитимуть сповіщення "
            "про нові записи та записи без майстра.",
            reply_markup=ReplyKeyboardRemove(),
        )
    elif role == "master":
        await message.answer(
            f"Вітаємо, <b>{name}</b>!\nСюди надходитимуть сповіщення про нові, перенесені та "
            "скасовані записи до вас. Розклад — кнопками нижче.",
            reply_markup=MASTER_KEYBOARD,
        )
    elif role == "client":
        await message.answer(
            f"Вітаємо, <b>{name}</b>!\nСюди надходитимуть нагадування про ваші візити.",
            reply_markup=CLIENT_KEYBOARD,
        )
        await send_booking_links(message, backend)
    else:
        await message.answer(
            f"Вітаємо, <b>{name}</b>!\nЩоб я вас впізнав, поділіться своїм контактом кнопкою "
            "нижче. Записатися можна на сайті.",
            reply_markup=CONTACT_KEYBOARD,
        )


@router.message(CommandStart())
async def cmd_start(message: Message, backend: BackendClient) -> None:
    identity = await backend.identify(message.from_user.id)
    await greet(message, backend, identity)


@router.message(F.contact)
async def on_contact(message: Message, backend: BackendClient) -> None:
    contact: Contact = message.contact
    if contact.user_id != message.from_user.id:
        await message.answer("Будь ласка, надішліть свій власний контакт.")
        return
    identity = await backend.link_telegram(contact.phone_number, message.from_user.id)
    if identity.get("role") is None:
        await message.answer(
            "Не знайшов вас за цим номером. Запишіться на сайті — і після першого запису "
            "надішліть контакт ще раз.",
            reply_markup=CLIENT_KEYBOARD,
        )
        await send_booking_links(message, backend)
        return
    await message.answer("Готово, контакт підтверджено ✅")
    await greet(message, backend, identity)


@router.message(Command("book"))
@router.message(F.text == BTN_BOOK)
async def cmd_book(message: Message, backend: BackendClient) -> None:
    await send_booking_links(message, backend)


@router.message(Command("today"))
@router.message(F.text == BTN_TODAY)
async def cmd_today(message: Message, backend: BackendClient) -> None:
    await send_master_day(message, backend, message.from_user.id, today())


def days_keyboard(start: date) -> InlineKeyboardMarkup:
    days = [start + timedelta(days=i) for i in range(14)]
    rows = [
        [
            InlineKeyboardButton(text=_day_label(d), callback_data=f"day:{d.isoformat()}")
            for d in days[i : i + 4]
        ]
        for i in range(0, len(days), 4)
    ]
    return InlineKeyboardMarkup(inline_keyboard=rows)


@router.message(Command("date"))
@router.message(F.text == BTN_DATE)
async def cmd_date(message: Message) -> None:
    await message.answer(
        "Оберіть день або надішліть дату у форматі ДД.ММ (наприклад, 05.10):",
        reply_markup=days_keyboard(today()),
    )


@router.callback_query(F.data.startswith("day:"))
async def on_day(callback: CallbackQuery, backend: BackendClient) -> None:
    await callback.answer()
    day = date.fromisoformat(callback.data.removeprefix("day:"))
    if isinstance(callback.message, Message):
        await send_master_day(callback.message, backend, callback.from_user.id, day)


DATE_RE = re.compile(r"^\s*(\d{1,2})\.(\d{1,2})(?:\.(\d{2}|\d{4}))?\s*$")


@router.message(F.text.regexp(DATE_RE))
async def on_date_text(message: Message, backend: BackendClient) -> None:
    match = DATE_RE.match(message.text or "")
    assert match is not None
    day_num, month, year = match.groups()
    current = today()
    if year is None:
        full_year = current.year
    else:
        full_year = int(year) + 2000 if len(year) == 2 else int(year)
    try:
        day = date(full_year, int(month), int(day_num))
    except ValueError:
        await message.answer("Не вдалося розпізнати дату. Формат: ДД.ММ або ДД.ММ.РРРР")
        return
    # «05.01» в декабре — это январь следующего года
    if year is None and day < current - timedelta(days=31):
        day = day.replace(year=full_year + 1)
    await send_master_day(message, backend, message.from_user.id, day)


@router.message(Command("help"))
async def cmd_help(message: Message) -> None:
    await message.answer(
        "/start — почати\n"
        "/book — записатися онлайн\n"
        "/today — мої записи на сьогодні (для майстрів)\n"
        "/date — мої записи на дату (для майстрів)\n"
        "/help — допомога"
    )


async def main() -> None:
    logging.basicConfig(level=logging.INFO, stream=sys.stdout)
    settings = get_settings()

    bot = Bot(
        token=settings.telegram_bot_token,
        default=DefaultBotProperties(parse_mode=ParseMode.HTML),
    )
    backend = BackendClient()

    dp = Dispatcher(backend=backend)
    dp.include_router(router)

    try:
        await dp.start_polling(bot)
    finally:
        await backend.close()


if __name__ == "__main__":
    asyncio.run(main())
