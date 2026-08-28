# Adelante CRM — backend

Multi-tenant SaaS для сети салонов. Архитектурные решения: `frontend_review.md` не относится к backend; полный документ — в плане `backend-purring-leaf.md` (Claude Code plans).

## Состав

- `app/` — FastAPI: Admin API (`/api/admin/v1`, JWT, camelCase-конверт `{data, meta}`), Bot API (`/api/bot`, X-API-Key), Booking API (`/api/booking/{slug}`, публичный)
- `app/api/admin/` — доменные роутеры по файлам: auth, records (календарь+overview), staff, clients, services, reviews, audit, finances; спецификация — артефакт «Adelante CRM API»
- `app/tenancy/` — роутинг по `X-Salon-Id`: L1 in-memory engines + L2 Redis, фолбэк в Master DB
- `workers/` — Celery: публикация outbox, напоминания за 30 минут, отправка в Telegram/на сайт
- `ws/` — WebSocket-сервис push-уведомлений в админку
- `migrations/master`, `migrations/shard` — два независимых Alembic-окружения
- `cli.py` — `salonctl`: создание салонов, миграции по всем шардам

## Локальный запуск

```bash
cp ../.env.example ../.env         # заполнить секреты
docker compose -f ../docker-compose.yml up -d postgres-master postgres-shards redis

pip install -e .[dev]              # или: uv pip install -e .[dev]

# Первичные миграции (после первого изменения моделей):
salonctl migrate revision --env master -m "init master"
salonctl migrate master
# Для shard-autogenerate нужна эталонная пустая БД:
#   создать вручную, затем
salonctl migrate revision --env shard -m "init shard" --db-url postgresql+psycopg://...

# Создание салона (пароль роли шарда — через переменную окружения):
salonctl salon create --name "Demo" --slug demo --secret-env SALON_DEMO_DB_PASSWORD

# Прогон новой shard-миграции по всем салонам:
salonctl migrate shards

uvicorn app.main:app --reload                          # API
celery -A workers.celery_app:celery worker -Q default,notifications -l info
celery -A workers.celery_app:celery beat -l info       # строго один инстанс
uvicorn ws.main:app --port 8001                        # WS-notifier
```

## Правила

- **Миграции шардов** прогоняются на весь флот неатомарно → каждая миграция обязана быть backward-compatible (expand → migrate → contract).
- **Master DB**: Client / Administrator / Master — только soft-delete (`is_active=false`); на них ссылаются шард-БД, физическое удаление оставит висячие ссылки.
- **Записи**: из админки двойная запись мастера допустима; Booking/Bot проверяют занятость слота в сервис-слое (advisory lock). Не добавлять unique-constraint на (master_id, start_at).
- Время храним в UTC (`timestamptz`); `salons.timezone` — только для отображения.
