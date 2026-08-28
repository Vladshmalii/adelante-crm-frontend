from functools import lru_cache

from dotenv import load_dotenv
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

# pydantic-settings читает .env только в поля Settings — переменные вроде
# per-салонного secret_env (SALON_*_DB_PASSWORD), которых нет в модели,
# им в os.environ не попадают. load_dotenv() кладёт весь .env в реальное
# окружение процесса один раз при импорте, независимо от того, как был
# запущен процесс (важно для локального запуска без docker-compose, где
# api/ws/worker поднимаются отдельными командами).
load_dotenv()


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="ADELANTE_", extra="ignore")

    env: str = "dev"

    # Master DB (async — API, sync — workers/CLI/Alembic)
    master_db_dsn: str = "postgresql+asyncpg://adelante:adelante@localhost:5432/adelante_master"
    master_db_dsn_sync: str = (
        "postgresql+psycopg://adelante:adelante@localhost:5432/adelante_master"
    )
    # Maintenance-подключение к PG-серверу шардов (CREATE DATABASE/ROLE в salonctl)
    shard_admin_dsn: str = "postgresql+psycopg://postgres:postgres@localhost:5433/postgres"

    # Пулы шард-engine (на процесс, на салон)
    shard_pool_size: int = 5
    shard_max_overflow: int = 5
    # LRU-лимит числа живых engine в одном процессе
    shard_engine_cache_max: int = 50
    # TTL метаданных подключения в Redis (L2)
    conn_cache_ttl: int = 3600

    redis_url: str = "redis://localhost:6379/0"
    celery_broker_url: str = "redis://localhost:6379/1"

    # Auth
    jwt_secret: str = "change-me"
    jwt_access_ttl: int = 15 * 60
    jwt_refresh_ttl: int = 30 * 24 * 3600
    # Два одновременно валидных ключа — для бесшовной ротации
    bot_api_keys: list[str] = Field(default_factory=list)

    telegram_bot_token: str = ""

    # Локальное хранилище загрузок (фото визитов, аватары); раздаётся под /uploads
    upload_dir: str = "uploads"

    # Origin'ы фронтенда для CORS
    cors_origins: list[str] = Field(
        default_factory=lambda: [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "https://adelante.dvms.tech/",
        ]
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
