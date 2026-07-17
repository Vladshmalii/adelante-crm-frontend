from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton

def main_menu_keyboard(is_staff: bool = False):
    buttons = []
    if is_staff:
        buttons.append([InlineKeyboardButton(text="📅 My Schedule", callback_data="staff_schedule")])
    buttons.append([InlineKeyboardButton(text="📝 New Booking", callback_data="book_appointment")])
    buttons.append([InlineKeyboardButton(text="ℹ️ Profile", callback_data="my_profile")])

    return InlineKeyboardMarkup(inline_keyboard=buttons)

def services_keyboard(services):
    buttons = [[InlineKeyboardButton(text=s.name, callback_data=f"select_service_{s.id}")] for s in services]
    return InlineKeyboardMarkup(inline_keyboard=buttons)
