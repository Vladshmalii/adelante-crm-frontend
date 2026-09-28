"""Письма (очередь `notifications`): сброс пароля.

SMTP настраивается переменными ADELANTE_SMTP_*. Без ADELANTE_SMTP_HOST
письмо не отправляется, а ссылка пишется в лог уровнем WARNING — для
локальной разработки.
"""

import html as html_lib
import logging
import smtplib
import ssl
from email.message import EmailMessage

from app.config import get_settings
from workers.celery_app import celery

logger = logging.getLogger(__name__)


def _send(to: str, subject: str, text: str, html: str) -> None:
    settings = get_settings()
    message = EmailMessage()
    message["From"] = settings.smtp_from
    message["To"] = to
    message["Subject"] = subject
    message.set_content(text)
    message.add_alternative(html, subtype="html")

    context = ssl.create_default_context()
    if settings.smtp_security == "ssl":
        with smtplib.SMTP_SSL(
            settings.smtp_host, settings.smtp_port, context=context, timeout=20
        ) as smtp:
            if settings.smtp_user:
                smtp.login(settings.smtp_user, settings.smtp_password)
            smtp.send_message(message)
        return
    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=20) as smtp:
        if settings.smtp_security == "starttls":
            smtp.starttls(context=context)
        if settings.smtp_user:
            smtp.login(settings.smtp_user, settings.smtp_password)
        smtp.send_message(message)


@celery.task(autoretry_for=(smtplib.SMTPException, OSError), retry_backoff=True, max_retries=5)
def send_password_reset(email: str, first_name: str, link: str) -> None:
    settings = get_settings()
    if not settings.smtp_host:
        logger.warning("SMTP не настроен — письмо не отправлено. Сброс пароля %s: %s", email, link)
        return

    text = (
        f"Вітаємо, {first_name}!\n\n"
        "Ви запросили відновлення пароля в Adelante CRM. Щоб задати новий пароль, "
        f"перейдіть за посиланням (діє 1 годину):\n{link}\n\n"
        "Якщо ви не робили цей запит, просто проігноруйте лист."
    )
    html = (
        f"<p>Вітаємо, {html_lib.escape(first_name)}!</p>"
        "<p>Ви запросили відновлення пароля в Adelante CRM. Щоб задати новий пароль, "
        "перейдіть за посиланням (діє 1 годину):</p>"
        f'<p><a href="{html_lib.escape(link)}">Задати новий пароль</a></p>'
        "<p>Якщо ви не робили цей запит, просто проігноруйте лист.</p>"
    )
    _send(email, "Відновлення пароля — Adelante CRM", text, html)
