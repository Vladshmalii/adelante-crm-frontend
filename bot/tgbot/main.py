"""Telegram-бот платформы (aiogram 3, long polling на MVP).

Один бот на все салоны (решение от 25.08.2026). Исходящие уведомления шлёт
Celery-воркер backend'а напрямую в Telegram API — этот процесс отвечает
только за интерактивные диалоги.
"""

import asyncio
import logging
import sys

from aiogram import Bot, Dispatcher, Router
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.filters import Command, CommandStart
from aiogram.types import Contact, Message

from tgbot.api_client import BackendClient
from tgbot.config import get_settings

router = Router()

ROLE_GREETINGS = {
    "administrator": "Вы администратор салона. Здесь будут приходить уведомления о новых записях.",
    "master": "Вы мастер. Здесь можно посмотреть своё расписание.",
    "client": "Рады видеть вас снова! Здесь будут приходить напоминания о записях.",
}


@router.message(CommandStart())
async def cmd_start(message: Message, backend: BackendClient) -> None:
    identity = await backend.identify(message.from_user.id)
    name = identity.get("name") or message.from_user.full_name
    role = identity.get("role")
    greeting = ROLE_GREETINGS.get(
        role,
        "Похоже, мы ещё не знакомы. Отправьте свой номер телефона "
        "(кнопкой «Поделиться контактом»), чтобы я вас узнал.",
    )
    await message.answer(f"Здравствуйте, <b>{name}</b>!\n{greeting}")


@router.message(lambda m: m.contact is not None)
async def on_contact(message: Message, backend: BackendClient) -> None:
    contact: Contact = message.contact
    if contact.user_id != message.from_user.id:
        await message.answer("Пожалуйста, отправьте свой собственный контакт.")
        return
    identity = await backend.link_client(contact.phone_number, message.from_user.id)
    if identity.get("role") == "client":
        await message.answer(
            f"Готово, {identity['name']}! Теперь сюда будут приходить напоминания о записях."
        )
    else:
        await message.answer(
            "Не нашёл вас по этому номеру. Запишитесь через сайт — и я запомню вас автоматически."
        )


@router.message(Command("help"))
async def cmd_help(message: Message) -> None:
    await message.answer("/start — начать\n/help — помощь")


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
