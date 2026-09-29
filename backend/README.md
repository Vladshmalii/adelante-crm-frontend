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

# Первый администратор — сразу суперюзер и с привязкой к салону:
salonctl administrator create --email admin@example.com --password '...' \
    --first-name Адмін --salon demo --superuser
# Уже существующему администратору:
salonctl administrator add-salon admin@example.com --salon demo
salonctl administrator superuser admin@example.com          # --revoke — снять

# Прогон новой shard-миграции по всем салонам:
salonctl migrate shards

uvicorn app.main:app --reload                          # API
celery -A workers.celery_app:celery worker -Q default,notifications -l info
celery -A workers.celery_app:celery beat -l info       # строго один инстанс
uvicorn ws.main:app --port 8001                        # WS-notifier
```

`salonctl` ищет `alembic.*.ini` и `migrations/` в `$ADELANTE_BACKEND_DIR`, рядом с `cli.py`
или в текущем каталоге (в docker-образе — `/backend`).

## Права доступа

Роли — `master`, `administrator` и флаг `is_superuser` у администратора
(матрица — `web/docs/ACCESS.md`). Проверяются на бекенде зависимостями
`CurrentUser` / `AdminUser` / `SuperUser` (`app/api/security.py`):

- мастер — только свои записи (`master_id`) и свои клиенты (есть запись к нему в
  салоне, в любом статусе); чужое — `404`;
- администратор — всё, кроме `/finances/*`, экспортов, зарплат и статистики сотрудников;
- суперюзер — всё; только он создаёт, меняет и увольняет администраторов и выдаёт флаг.

Роль, салоны и `is_superuser` лежат в JWT; `/auth/refresh` перечитывает их из БД.
Увольнение из салона делает привязку к салону неактивной — салон пропадает из токена.

## Записи

- В записи несколько услуг (`serviceIds[]` → `services[]`, таблица `record_services`):
  их подряд выполняет один мастер, длительность и цена суммируются.
- Мастер необязателен (`master: null` — очередь «Без майстра»), фильтр
  `GET /records?withoutMaster=true`, назначение — `PATCH` с `masterId`.
- Завершение (`POST /records/{id}/complete`) — только заметки и фото, ставит
  `paymentStatus=unpaid`; без мастера — `409`.
- Оплата — `POST /records/{id}/payment` (администратор): чек с `recordId` на полную
  сумму записи, разбивка по способам оплаты допустима. Отмена чека возвращает
  записи `unpaid`.
- Время: в БД — UTC; всё «локальное» (границы дня, рабочие часы, тексты
  уведомлений, отчёты по дням) — в `Europe/Kyiv` (`app/timeutils.py`). Время без
  зоны во входящих данных считается киевским.

## Уведомления

Outbox → Celery (`workers/tasks/outbox.py`) → Telegram / WebSocket:

- мастеру — новая запись к нему, перенос, отмена, передача другому мастеру;
- администраторам — каждая новая запись; для записей без мастера — ещё перенос и отмена;
- клиенту — напоминание за 30 минут (`scheduled` и `confirmed`);
- автору изменения уведомление о его же действии не отправляется;
- WebSocket: мастер получает только события своих записей.

Бот не создаёт записи: клиента ведёт на сайт записи, мастеру показывает записи на
день. Telegram привязывается по контакту — телефон ищется среди администраторов,
мастеров и клиентов (`POST /api/bot/link-telegram`).

Отправка в Telegram (`workers/telegram.py`) повторяется только на временных сбоях
(сеть, 429, 5xx); остальные 4xx (бот заблокирован, неверный токен) — предупреждение в
лог. Токен бота в логи не попадает.

## Склад и отчёты

Спецификация — `web/docs/BACKEND.md` (разделы 5 и 6).

- `/inventory/*` (`app/api/admin/inventory.py`): остаток меняется только движениями
  (`stock_movements`), под `FOR UPDATE` строки товара; в минус не уходит (`409`). Списание
  расходников по записи — `POST /records/{id}/consumables` (мастер — по своей записи).
- `/reports/*` (`app/api/admin/reports.py`): выручка — неотменённые чеки по дате чека; по
  мастерам и услугам — чеки с `record_id`, выручка записи делится между услугами пропорционально
  цене. Денежные показатели — только суперюзеру.

## График работы (смены)

Рабочее время — смены по дням (`staff_shifts`): мастера и администраторы, отметки відпустка /
лікарняний, границы — часы салона, массовое заполнение — `docs/shifts.md` (бриф для фронтенда —
`docs/frontend-shifts.md`). Уведомления о записях получают администраторы, которые сейчас на смене,
и суперюзеры всегда.

## Розклад

Графики мастеров на период, сводка записей по дням, способы оплаты для администратора,
выключатель напоминания в записи, отмена списания расходника — `docs/calendar.md`
(бриф для фронтенда — `docs/frontend-calendar.md`).

## Налаштування салону и отзывы

`/settings/salon`, `/settings/schedule` (администратор) и ссылка на отзыв клиенту после визита —
`docs/reviews-settings.md` (бриф для фронтенда — `docs/frontend-reviews-settings.md`).

## Тесты

```bash
pip install -e .[dev]
pytest            # нужен запущенный Docker
```

`tests/conftest.py` поднимает PostgreSQL и Redis через testcontainers, прогоняет миграции через
`salonctl` и создаёт суперюзера; тесты ходят в API через `TestClient`, у каждого модуля свой
салон. Воркер проверяется в eager-режиме Celery с подменённой отправкой в Telegram.

## Выкатка изменений от 2026-09-28

1. **Остановить api, worker и beat.** Среди shard-миграций есть contract-шаги:
   `d9a3b5c7e1f0` — удаление `records.service_id`, `a8c2e4f6b1d3` — замена
   `staff_schedules` / `schedule_exceptions` сменами `staff_shifts`; код до этой выкатки
   использует удаляемое и падал бы.
2. `salonctl migrate master` и `salonctl migrate shards`. Кроме удаления
   `records.service_id` миграции только расширяют схему (новые колонки с default,
   `record_services` с переносом услуг существующих записей, таблицы склада с базовыми
   категориями) и переводят старые записи журнала изменений на украинский.
3. **Выдать флаг суперюзера** владельцу: `salonctl administrator superuser <email>`.
   Без этого раздел «Фінанси», экспорты и зарплаты недоступны никому.
4. Задать `ADELANTE_FRONTEND_URL`, `ADELANTE_BOOKING_BASE_URL`, `ADELANTE_SMTP_*`,
   при необходимости `ADELANTE_CORS_ORIGINS` (см. `.env.example`).
5. Запустить api, worker, beat, ws и bot с новым кодом.

## Правила

- **Миграции шардов** прогоняются на весь флот неатомарно → каждая миграция обязана быть backward-compatible (expand → migrate → contract).
- **Master DB**: Client / Administrator / Master — только soft-delete (`is_active=false`); на них ссылаются шард-БД, физическое удаление оставит висячие ссылки.
- **Записи**: из админки двойная запись мастера допустима; Booking проверяет рабочие часы и занятость слота в сервис-слое (advisory lock). Не добавлять unique-constraint на (master_id, start_at).
- **Сессии БД** (`TenantSession`, `MasterSession`) коммитятся до отправки ответа (`Depends(..., scope="function")`).
- Время храним в UTC (`timestamptz`); локальное время — всегда `Europe/Kyiv` (`salons.timezone` не используется).
