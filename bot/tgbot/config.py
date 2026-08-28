from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class BotSettings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="ADELANTE_", extra="ignore")

    telegram_bot_token: str
    api_base_url: str = "http://localhost:8000"
    # Первый ключ из ADELANTE_BOT_API_KEYS backend'а
    bot_api_key: str = ""


@lru_cache
def get_settings() -> BotSettings:
    return BotSettings()
