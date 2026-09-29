"""Интеграционные тесты: настоящие PostgreSQL и Redis в Docker (testcontainers).

Контейнеры поднимаются один раз на прогон в pytest_configure — ДО импорта
app/workers: настройки (get_settings) читаются при импорте модулей воркеров.
Один сервер Postgres служит и Master DB, и сервером шардов (шард = отдельная
БД с отдельной ролью, как в проде).

Каждый тестовый модуль, которому нужны «чистые» агрегаты, создаёт свой салон
(фикстура new_salon) — модули не видят данные друг друга.

Запуск: `pytest` из каталога backend (нужен запущенный Docker).
"""

import os
import tempfile
import uuid
from collections.abc import Iterator
from dataclasses import dataclass, field
from typing import Any

import httpx
import pytest
from testcontainers.community.postgres import PostgresContainer
from testcontainers.community.redis import RedisContainer

PG_IMAGE = "postgres:17"
REDIS_IMAGE = "redis:7"
SHARD_PASSWORD_ENV = "ADELANTE_TEST_SHARD_PASSWORD"
SUPERUSER_EMAIL = "su@test.ua"
PASSWORD = "password1"
BOT_KEY = "test-bot-key"

_containers: list[Any] = []


def pytest_configure(config: pytest.Config) -> None:
    postgres = PostgresContainer(
        PG_IMAGE, username="postgres", password="postgres", dbname="adelante_master"
    )
    redis = RedisContainer(REDIS_IMAGE)
    postgres.start()
    _containers.append(postgres)
    redis.start()
    _containers.append(redis)

    pg_host = postgres.get_container_host_ip()
    pg_port = postgres.get_exposed_port(5432)
    redis_url = f"redis://{redis.get_container_host_ip()}:{redis.get_exposed_port(6379)}"
    base = f"postgres:postgres@{pg_host}:{pg_port}"
    os.environ.update(
        {
            "ADELANTE_MASTER_DB_DSN": f"postgresql+asyncpg://{base}/adelante_master",
            "ADELANTE_MASTER_DB_DSN_SYNC": f"postgresql+psycopg://{base}/adelante_master",
            "ADELANTE_SHARD_ADMIN_DSN": f"postgresql+psycopg://{base}/postgres",
            "ADELANTE_REDIS_URL": f"{redis_url}/0",
            "ADELANTE_CELERY_BROKER_URL": f"{redis_url}/1",
            "ADELANTE_JWT_SECRET": "test-secret-" + uuid.uuid4().hex,
            "ADELANTE_BOT_API_KEYS": f'["{BOT_KEY}"]',
            "ADELANTE_TELEGRAM_BOT_TOKEN": "123:test",
            "ADELANTE_UPLOAD_DIR": tempfile.mkdtemp(prefix="adelante-uploads-"),
            "ADELANTE_SMTP_HOST": "",
            SHARD_PASSWORD_ENV: "shard-password",
        }
    )

    import cli

    cli.migrate_master()
    _create_salon("main")
    cli.administrator_create(
        email=SUPERUSER_EMAIL,
        password=PASSWORD,
        first_name="Супер",
        last_name=None,
        salon=["main"],
        superuser=True,
    )


def pytest_unconfigure(config: pytest.Config) -> None:
    for container in reversed(_containers):
        container.stop()


def _create_salon(slug: str) -> None:
    import cli

    host, port = _pg_host_port()
    cli.salon_create(
        name=f"Салон {slug}",
        slug=slug,
        secret_env=SHARD_PASSWORD_ENV,
        db_host=host,
        db_port=port,
        db_name=None,
        db_user=None,
        timezone="Europe/Kyiv",
    )


def _pg_host_port() -> tuple[str, int]:
    postgres = _containers[0]
    return postgres.get_container_host_ip(), int(postgres.get_exposed_port(5432))


# --- HTTP-клиент --------------------------------------------------------------


class ApiError(AssertionError):
    pass


@dataclass
class Api:
    """Тонкая обёртка над TestClient: проверка статуса и разворот конверта {data}."""

    client: Any
    prefix: str = "/api/admin/v1"
    headers: dict[str, str] = field(default_factory=dict)

    def call(
        self,
        method: str,
        path: str,
        *,
        token: str | None = None,
        salon: str | None = None,
        expect: int = 200,
        prefix: str | None = None,
        **kwargs: Any,
    ) -> Any:
        headers = {**self.headers, **kwargs.pop("headers", {})}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        if salon:
            headers["X-Salon-Id"] = salon
        response: httpx.Response = self.client.request(
            method, (self.prefix if prefix is None else prefix) + path, headers=headers, **kwargs
        )
        if response.status_code != expect:
            raise ApiError(
                f"{method} {path}: {response.status_code} != {expect}: {response.text[:500]}"
            )
        if response.headers.get("content-type", "").startswith("application/json") and (
            response.content
        ):
            body = response.json()
            return body["data"] if isinstance(body, dict) and "data" in body else body
        return response

    def get(self, path: str, **kw: Any) -> Any:
        return self.call("GET", path, **kw)

    def post(self, path: str, **kw: Any) -> Any:
        return self.call("POST", path, **kw)

    def patch(self, path: str, **kw: Any) -> Any:
        return self.call("PATCH", path, **kw)

    def delete(self, path: str, **kw: Any) -> Any:
        return self.call("DELETE", path, **kw)

    def login(self, email: str, password: str = PASSWORD) -> str:
        return self.post("/auth/login", json={"email": email, "password": password})["accessToken"]

    def salon_id(self, token: str, slug: str) -> str:
        salons = self.get("/auth/me", token=token)["salons"]
        return next(s["id"] for s in salons if s["slug"] == slug)


@pytest.fixture(scope="session")
def client() -> Iterator[Any]:
    from fastapi.testclient import TestClient

    from app.main import app

    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(scope="session")
def api(client: Any) -> Api:
    return Api(client)


@dataclass
class Salon:
    """Отдельный салон для тестового модуля + суперюзер с доступом к нему."""

    id: str
    slug: str
    su: str  # токен суперюзера
    api: Api

    def create_staff(self, role: str = "master", **fields: Any) -> tuple[dict[str, Any], str]:
        """Сотрудник с паролем; возвращает (сотрудник, токен)."""
        email = f"{role[:3]}-{uuid.uuid4().hex[:8]}@test.ua"
        body = {
            "firstName": fields.pop("firstName", role.capitalize()),
            "phone": fields.pop("phone", "+38067" + str(uuid.uuid4().int)[:7]),
            "email": email,
            "password": PASSWORD,
            "role": role,
            **fields,
        }
        staff = self.api.post("/staff", token=self.su, salon=self.id, json=body, expect=201)
        return staff, self.api.login(email)


@pytest.fixture(scope="module")
def new_salon(api: Api) -> Salon:
    import cli

    slug = "s" + uuid.uuid4().hex[:8]
    _create_salon(slug)
    cli.administrator_add_salon(SUPERUSER_EMAIL, salon=[slug])
    su = api.login(SUPERUSER_EMAIL)
    return Salon(id=api.salon_id(su, slug), slug=slug, su=su, api=api)


def phone() -> str:
    """Уникальный телефон (только цифры — сравнение по нормализованной форме)."""
    return "+38050" + str(uuid.uuid4().int)[:7]


WEEKDAYS = ("monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday")


def salon_week(start: str = "08:00", end: str = "21:00") -> dict[str, dict[str, Any]]:
    """Часы салона — все дни одинаково."""
    return {day: {"isWorkDay": True, "start": start, "end": end} for day in WEEKDAYS}


def shift_week(
    start: str = "09:00",
    end: str = "18:00",
    break_start: str | None = "13:00",
    break_end: str | None = "14:00",
) -> dict[str, dict[str, Any]]:
    """Шаблон «по дням недели» для POST /shifts/fill — все дни одинаково."""
    return {
        day: {"start": start, "end": end, "breakStart": break_start, "breakEnd": break_end}
        for day in WEEKDAYS
    }


def setup_shifts(
    salon: "Salon",
    staff_ids: list[str],
    date_from: Any,
    date_to: Any,
    *,
    hours: tuple[str, str] = ("08:00", "21:00"),
    **shift: Any,
) -> dict[str, Any]:
    """Часы салона + смены сотрудникам на период (суперюзером), отчёт fill."""
    salon.api.call(
        "PUT",
        "/settings/schedule",
        token=salon.su,
        salon=salon.id,
        json={"week": salon_week(*hours)},
    )
    return salon.api.post(
        "/shifts/fill",
        token=salon.su,
        salon=salon.id,
        json={
            "staffIds": staff_ids,
            "dateFrom": str(date_from),
            "dateTo": str(date_to),
            "mode": "weekdays",
            "weekdays": shift_week(**shift),
            "overwrite": True,
        },
    )
