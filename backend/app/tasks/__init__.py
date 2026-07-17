from celery import Celery
import os

redis_url = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "adelante_crm_tasks",
    broker=redis_url,
    backend=redis_url,
    include=["app.tasks.notifications"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)
