FROM python:3.12-slim

WORKDIR /bot

COPY pyproject.toml ./
COPY tgbot ./tgbot

RUN pip install --no-cache-dir .

CMD ["python", "-m", "tgbot.main"]
