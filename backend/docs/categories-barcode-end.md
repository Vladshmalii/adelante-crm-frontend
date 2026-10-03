# Категории услуг, штрихкод, маржа, ручной конец записи (2026-10-03)

ТЗ — `web/docs/BACKEND_CATEGORIES_BARCODE_RESIZE.md`. Реализовано, тесты —
`tests/test_categories_barcode_end.py`. Бриф для фронтенда —
[frontend-categories-barcode-end.md](./frontend-categories-barcode-end.md).

## Что изменилось

| Где | Что |
| --- | --- |
| `app/models/shard/service.py` | `ServiceCategory` (`name` уникально без учёта регистра — индекс `lower(name)`, `is_system`); `Service.category_id` (NOT NULL) вместо строки `category`, связь `Service.category` (joined) |
| `app/api/admin/services.py` | CRUD `/services/categories`, `categoryId` в услугах, фильтр `?categoryId=` |
| `app/api/admin/records.py` | Фильтр `?serviceCategoryId=`; `RecordServiceOut.category` — `{id, name}`; `endAt` в `POST` и `PATCH` |
| `app/services/records.py` | `validate_end()`, `NewRecord.end_at` |
| `app/api/admin/reports.py` | Категория — `{id, name}`, группировка по id |
| `app/api/booking/router.py` | `category_id`, `category_name`; сортировка по категории («Інше» — последней), потом по услуге |
| `app/models/shard/inventory.py` | `Product.barcode` (индекс `lower(barcode)`, unique) |
| `app/api/admin/inventory.py` | Штрихкод (создание, изменение, поиск, импорт по заголовкам, экспорт); `sort=margin` |
| `app/services/text.py` | `uk_sort_key()` — сортировка по украинскому алфавиту («І», «Є», «Ї», «Ґ» на своих местах) |
| Миграция `b3d5f7a9c1e2` | Категории из строк (`hair` → «Волосся» и т. д., без учёта регистра сливаются, «Інше» — всегда), удаление `services.category`; `products.barcode` |

## Решения, не описанные в ТЗ

- `RecordServiceOut.category` (услуги внутри записи) — тоже `{id, name}` вместо строки, как у
  `ServiceOut`.
- `PATCH /services/{id}` с `categoryId: null` переносит услугу в «Інше».
- Пробелы в названии категории обрезаются; пустое название — `422`.
- **Ручная длительность не сбрасывается, если `serviceIds` пришли без изменений** (форма отправляет
  состав услуг всегда); сбрасывается только при изменении состава.
- Импорт склада читает колонки **по заголовкам** (порядок любой, «Штрихкод» необязателен). Файл
  без распознанных заголовков читается по старой раскладке (без штрихкода).
- Штрихкод в поиске — подстрока без учёта регистра (`ILIKE`), как у названия и артикула.

## Выкатка

Миграция удаляет `services.category` — как и предыдущие contract-шаги, api/worker/beat со старым
кодом остановить до `salonctl migrate shards` (см. `README.md`).
