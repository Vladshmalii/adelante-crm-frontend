"""HTTP-клиент к Bot API backend'а.

Бот не имеет доступа к БД: любые данные — только через /api/bot/* с
service-ключом.
"""

from datetime import date
from typing import Any

import httpx

from tgbot.config import get_settings


class BackendClient:
    def __init__(self) -> None:
        settings = get_settings()
        self._client = httpx.AsyncClient(
            base_url=settings.api_base_url,
            headers={"X-API-Key": settings.bot_api_key},
            timeout=10.0,
        )

    async def close(self) -> None:
        await self._client.aclose()

    async def identify(self, telegram_user_id: int) -> dict[str, Any]:
        response = await self._client.get(
            "/api/bot/identify", params={"telegram_user_id": telegram_user_id}
        )
        response.raise_for_status()
        return response.json()

    async def link_telegram(self, phone: str, telegram_user_id: int) -> dict[str, Any]:
        """Привязка по телефону: администратор, мастер и/или клиент."""
        response = await self._client.post(
            "/api/bot/link-telegram",
            json={"phone": phone, "telegram_user_id": telegram_user_id},
        )
        response.raise_for_status()
        return response.json()

    async def salons(self) -> list[dict[str, Any]]:
        """Салоны со ссылками на сайт записи."""
        response = await self._client.get("/api/bot/salons")
        response.raise_for_status()
        return response.json()

    async def master_records(self, telegram_user_id: int, day: date) -> dict[str, Any] | None:
        """Записи мастера на день во всех его салонах; None — не мастер."""
        response = await self._client.get(
            "/api/bot/masters/records",
            params={"telegram_user_id": telegram_user_id, "day": day.isoformat()},
        )
        if response.status_code == 404:
            return None
        response.raise_for_status()
        return response.json()
