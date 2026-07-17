from aiogram import Bot, Dispatcher, Router, F
from aiogram.filters import CommandStart
from aiogram.types import Message, CallbackQuery, InlineKeyboardMarkup, InlineKeyboardButton
from aiogram.enums import ParseMode
import json

from sqlalchemy.future import select
from app.database import AsyncSessionLocal
from app.models.all_models import User
from app.core.config import settings
from redis.asyncio import Redis

bot = Bot(token=settings.TELEGRAM_BOT_TOKEN or "dummy_token_to_prevent_crash", parse_mode=ParseMode.HTML)
dp = Dispatcher()
router = Router()
redis = Redis.from_url(settings.REDIS_URL, decode_responses=True)

from app.telegram.keyboards import main_menu_keyboard

@router.message(CommandStart())
async def cmd_start(message: Message):
    args = message.text.split()
    if len(args) < 2:
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(User).filter(User.telegram_id == message.from_user.id))
            user = result.scalars().first()
            is_staff = user and user.role in ["master", "admin"]

        await message.answer("Welcome to Adelante CRM Bot!", reply_markup=main_menu_keyboard(is_staff))
        return

    auth_code = args[1]

    if auth_code.startswith("link_"):
        link_code = auth_code[5:]
        data = await redis.get(f"telegram_link:{link_code}")
        if not data:
            await message.answer("Invalid link code.")
            return

        link_data = json.loads(data)
        user_id = link_data["user_id"]
        telegram_user = message.from_user

        async with AsyncSessionLocal() as db:
            existing = await db.execute(select(User).filter(User.telegram_id == telegram_user.id))
            if existing.scalars().first():
                await message.answer("This Telegram account is already linked.")
                return

            result = await db.execute(select(User).filter(User.id == user_id))
            user = result.scalars().first()
            user.telegram_id = telegram_user.id
            user.telegram_username = telegram_user.username
            await db.commit()

        await redis.delete(f"telegram_link:{link_code}")
        await message.answer(f"Successfully linked to {user.first_name} {user.last_name}!")
        return

    data = await redis.get(f"telegram_auth:{auth_code}")
    if not data:
        await message.answer("Invalid or expired auth code.")
        return

    auth_data = json.loads(data)

    if auth_data["status"] != "pending":
        await message.answer("This code has already been used.")
        return

    telegram_user = message.from_user

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).filter(User.telegram_id == telegram_user.id))
        user = result.scalars().first()

    if not user:
        keyboard = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="Confirm Registration", callback_data=f"register:{auth_code}")],
            [InlineKeyboardButton(text="Cancel", callback_data=f"cancel:{auth_code}")]
        ])

        await message.answer(
            f"Hello {telegram_user.first_name}!\nYou are not registered. Create an account?",
            reply_markup=keyboard
        )

        auth_data["status"] = "awaiting_confirmation"
        auth_data["telegram_id"] = telegram_user.id
        auth_data["telegram_username"] = telegram_user.username
        auth_data["telegram_first_name"] = telegram_user.first_name
        auth_data["telegram_last_name"] = telegram_user.last_name
        await redis.setex(f"telegram_auth:{auth_code}", 300, json.dumps(auth_data))
        return

    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="Confirm Login", callback_data=f"confirm:{auth_code}")],
        [InlineKeyboardButton(text="Cancel", callback_data=f"cancel:{auth_code}")]
    ])

    await message.answer(
        f"Hello {user.first_name}!\nConfirm login to Adelante CRM.",
        reply_markup=keyboard
    )

    auth_data["status"] = "confirmed"
    auth_data["user_id"] = user.id
    await redis.setex(f"telegram_auth:{auth_code}", 300, json.dumps(auth_data))

@router.callback_query(F.data.startswith("confirm:"))
async def process_confirm(callback: CallbackQuery):
    auth_code = callback.data.split(":")[1]
    data = await redis.get(f"telegram_auth:{auth_code}")
    if not data:
        await callback.answer("Code expired", show_alert=True)
        return

    auth_data = json.loads(data)
    auth_data["status"] = "completed"
    await redis.setex(f"telegram_auth:{auth_code}", 60, json.dumps(auth_data))

    await callback.message.edit_text("Login confirmed! Return to the browser.")
    await callback.answer()

@router.callback_query(F.data.startswith("register:"))
async def process_register(callback: CallbackQuery):
    auth_code = callback.data.split(":")[1]
    data = await redis.get(f"telegram_auth:{auth_code}")
    if not data:
        await callback.answer("Code expired", show_alert=True)
        return

    auth_data = json.loads(data)

    async with AsyncSessionLocal() as db:
        new_user = User(
            telegram_id=auth_data["telegram_id"],
            telegram_username=auth_data.get("telegram_username"),
            first_name=auth_data["telegram_first_name"],
            last_name=auth_data.get("telegram_last_name", ""),
            email=f"telegram_{auth_data['telegram_id']}@adelante-crm.local",
            role="client",
            is_active=True
        )
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)

    auth_data["status"] = "completed"
    auth_data["user_id"] = new_user.id
    await redis.setex(f"telegram_auth:{auth_code}", 60, json.dumps(auth_data))

    await callback.message.edit_text("Account created! Return to browser to complete login.")
    await callback.answer()

@router.callback_query(F.data.startswith("cancel:"))
async def process_cancel(callback: CallbackQuery):
    auth_code = callback.data.split(":")[1]
    await redis.delete(f"telegram_auth:{auth_code}")
    await callback.message.edit_text("Authorization cancelled.")
    await callback.answer()

from app.telegram.handlers import router as handlers_router
dp.include_router(router)
dp.include_router(handlers_router)

async def main():
    if settings.TELEGRAM_BOT_TOKEN and settings.TELEGRAM_BOT_TOKEN != "dummy_token_to_prevent_crash":
        await dp.start_polling(bot)
    else:
        print("TELEGRAM_BOT_TOKEN is not set. Bot will not start polling.")

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
