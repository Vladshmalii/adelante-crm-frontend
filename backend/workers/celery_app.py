from celery import Celery
from celery.schedules import crontab

from app.config import get_settings

settings = get_settings()

celery = Celery(
    "adelante",
    broker=settings.celery_broker_url,
    include=[
        "workers.tasks.outbox",
        "workers.tasks.reminders",
        "workers.tasks.notify",
        "workers.tasks.integrity",
    ],
)

celery.conf.timezone = "UTC"
celery.conf.task_default_queue = "default"
# Уведомления — в отдельной очереди, чтобы долгие Telegram-ретраи
# не блокировали сканирование шардов
celery.conf.task_routes = {"workers.tasks.notify.*": {"queue": "notifications"}}

celery.conf.beat_schedule = {
    "publish-outbox": {
        "task": "workers.tasks.outbox.publish_outbox",
        "schedule": 10.0,
    },
    "scan-upcoming-records": {
        "task": "workers.tasks.reminders.scan_upcoming_records",
        "schedule": 60.0,
    },
    "integrity-check": {
        "task": "workers.tasks.integrity.integrity_check",
        "schedule": crontab(hour=4, minute=0),
    },
}
