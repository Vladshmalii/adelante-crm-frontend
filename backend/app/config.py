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

    # Origin'ы фронтенда для CORS (JSON-список в ADELANTE_CORS_ORIGINS)
    cors_origins: list[str] = Field(
        default_factory=lambda: [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "https://adelante.dvms.tech",
            "https://api-adelante.dvms.tech",
            "https://ws-adelante.dvms.tech",
        ]
    )

    # Адрес админки: ссылка из письма сброса пароля ведёт на {frontend_url}/reset-password
    frontend_url: str = "http://localhost:5173"
    # Публичный сайт записи: ссылка на салон — {booking_base_url}/{slug}
    booking_base_url: str = "https://adelante.dvms.tech/booking"

    # Почта (письма сброса пароля). Пустой smtp_host — письма не отправляются,
    # ссылка пишется в лог уровнем WARNING (для локальной разработки)
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = "Adelante CRM <no-reply@adelante.dvms.tech>"
    # starttls — порт 587, ssl — порт 465, none — без шифрования (локальный relay)
    smtp_security: str = "starttls"

    # Антиспам публичной записи: сколько записей можно создать за час
    booking_rate_limit_per_ip: int = 20
    booking_rate_limit_per_phone: int = 5

    def booking_url(self, slug: str) -> str:
        return f"{self.booking_base_url.rstrip('/')}/{slug}"


@lru_cache
def get_settings() -> Settings:
    return Settings()
