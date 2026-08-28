"""HTTP-клиент к Bot API backend'а.

Бот не имеет доступа к БД: любые данные — только через /api/bot/* с
service-ключом. X-Salon-Id добавляется на запросы к шард-данным.
"""

from typing import Any
from uuid import UUID

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

    async def link_client(self, phone: str, telegram_user_id: int) -> dict[str, Any]:
        response = await self._client.post(
            "/api/bot/clients/link-telegram",
            json={"phone": phone, "telegram_user_id": telegram_user_id},
        )
        response.raise_for_status()
        return response.json()

    def with_salon(self, salon_id: UUID) -> dict[str, str]:
        """Заголовки для запросов к шард-данным конкретного салона."""
        return {"X-Salon-Id": str(salon_id)}
