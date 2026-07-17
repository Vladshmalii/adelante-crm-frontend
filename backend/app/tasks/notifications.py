from app.tasks import celery_app
import requests
from app.core.config import settings

@celery_app.task
def send_telegram_notification(telegram_id: int, message: str):
    if not settings.TELEGRAM_BOT_TOKEN:
        return {"status": "skipped", "reason": "No bot token configured"}

    url = f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": telegram_id,
        "text": message,
        "parse_mode": "HTML"
    }

    response = requests.post(url, json=payload)
    return {"status": "sent", "response": response.json()}
