"""WebSocket-сервис (notifier-web): push уведомлений в админку.

Отдельный stateless-процесс: принимает WS-подключение с JWT (тот же секрет,
что Admin API), проверяет доступ к салону и ретранслирует события из
Redis pub/sub канала salon:{id}:events. Реплики масштабируются свободно —
pub/sub доставляет сообщение в каждую.
"""

import asyncio
import contextlib
import uuid
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import jwt
from fastapi import FastAPI, Query, WebSocket
from redis.asyncio import Redis

from app.config import get_settings


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    app.state.settings = settings
    app.state.redis = Redis.from_url(settings.redis_url, decode_responses=True)
    try:
        yield
    finally:
        await app.state.redis.aclose()


app = FastAPI(title="Adelante CRM WS notifier", lifespan=lifespan)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.websocket("/ws")
async def ws_events(
    websocket: WebSocket,
    token: str = Query(),
    salon_id: uuid.UUID = Query(alias="salonId"),  # noqa: B008
) -> None:
    settings = websocket.app.state.settings
    try:
        claims = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
    except jwt.InvalidTokenError:
        await websocket.close(code=4401, reason="Невалидный токен")
        return
    if claims.get("type") != "access" or str(salon_id) not in claims.get("salon_ids", []):
        await websocket.close(code=4403, reason="Нет доступа к салону")
        return

    await websocket.accept()
    redis: Redis = websocket.app.state.redis

    async def relay() -> None:
        async with redis.pubsub() as pubsub:
            await pubsub.subscribe(f"salon:{salon_id}:events")
            async for message in pubsub.listen():
                if message["type"] == "message":
                    await websocket.send_text(message["data"])

    async def watch_disconnect() -> None:
        # receive() завершится исключением при разрыве соединения клиентом
        while True:
            await websocket.receive_text()

    tasks = [asyncio.create_task(relay()), asyncio.create_task(watch_disconnect())]
    try:
        _, _pending = await asyncio.wait(tasks, return_when=asyncio.FIRST_COMPLETED)
    finally:
        for task in tasks:
            task.cancel()
            with contextlib.suppress(BaseException):
                await task
