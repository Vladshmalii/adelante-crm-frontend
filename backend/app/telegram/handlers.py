from aiogram import Router, F
from aiogram.types import CallbackQuery
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.database import AsyncSessionLocal
from app.models.all_models import User, Appointment, Service, Staff
from app.telegram.keyboards import main_menu_keyboard, services_keyboard

router = Router()

@router.callback_query(F.data == "main_menu")
async def show_main_menu(callback: CallbackQuery):
    telegram_id = callback.from_user.id
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).filter(User.telegram_id == telegram_id))
        user = result.scalars().first()
        is_staff = user and user.role in ["master", "admin"]

    await callback.message.edit_text("Main Menu:", reply_markup=main_menu_keyboard(is_staff))
    await callback.answer()

@router.callback_query(F.data == "staff_schedule")
async def show_staff_schedule(callback: CallbackQuery):
    telegram_id = callback.from_user.id
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).filter(User.telegram_id == telegram_id))
        user = result.scalars().first()
        if not user or user.role not in ["master", "admin"]:
            await callback.answer("Access denied", show_alert=True)
            return

        staff_result = await db.execute(select(Staff).filter(Staff.user_id == user.id))
        staff = staff_result.scalars().first()
        if not staff:
             await callback.answer("Staff profile not found", show_alert=True)
             return

        appointments_result = await db.execute(
            select(Appointment)
            .options(selectinload(Appointment.client), selectinload(Appointment.service))
            .filter(Appointment.staff_id == staff.id)
            .order_by(Appointment.date, Appointment.start_time)
            .limit(5)
        )
        appointments = appointments_result.scalars().all()

    if not appointments:
        text = "You have no upcoming appointments."
    else:
        text = "Your upcoming appointments:\n\n"
        for appt in appointments:
            text += f"📅 {appt.date} {appt.start_time}\n"
            text += f"👤 {appt.client.first_name} {appt.client.last_name}\n"
            text += f"✂️ {appt.service.name}\n\n"

    await callback.message.edit_text(text)
    await callback.answer()

@router.callback_query(F.data == "book_appointment")
async def start_booking(callback: CallbackQuery):
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Service))
        services = result.scalars().all()

    if not services:
        await callback.answer("No services available.", show_alert=True)
        return

    await callback.message.edit_text("Select a service:", reply_markup=services_keyboard(services))
    await callback.answer()

@router.callback_query(F.data.startswith("select_service_"))
async def select_service(callback: CallbackQuery):
    service_id = int(callback.data.split("_")[-1])

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Service).filter(Service.id == service_id))
        service = result.scalars().first()

    if not service:
        await callback.answer("Service not found", show_alert=True)
        return

    await callback.message.edit_text(f"You selected {service.name}.\nThis is a demo flow. Booking logic will continue here.")
    await callback.answer()
