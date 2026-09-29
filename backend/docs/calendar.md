# Доработки бекенда для Розкладу (2026-09-29)

> Позже в тот же день недельный график и исключения заменены сменами по дням
> ([shifts.md](./shifts.md)): пункты про исключения ниже (вопрос 5, `staff.py`, последний абзац)
> больше не актуальны, `load_schedules()` читает смены.

ТЗ — `web/docs/BACKEND_CALENDAR.md`. Всё реализовано и покрыто тестами
(`tests/test_calendar.py`). Бриф для фронтенда — [frontend-calendar.md](./frontend-calendar.md).

## Решения по вопросам к ТЗ

| # | Вопрос | Решение |
| --- | --- | --- |
| 1 | Способ оплаты без кассы или с выключенной кассой | Не показывается в `GET /payment-methods` |
| 2 | Тип способа оплаты в ответе | Есть: `type` |
| 3 | Кто в `GET /schedule` без `masterId` | Все не уволенные мастера, включая отпуск и больничный; администраторов нет |
| 4 | Имя и цвет мастера в графике | Есть: `name`, `color` |
| 5 | Пересечение исключений графика | Запрещено: `409` при создании и изменении |
| 6 | «Не прийшов» в сводке | Считается; не считаются только отменённые |
| 7 | `workMinutes` | В итоге дня — все не уволенные мастера (или выбранный); в `byMaster` — только мастера с записями |
| 8 | Запись через полночь | Относится ко дню начала |
| 9 | Перенос после отправки напоминания | `reminder_sent_at` сбрасывается при переносе на будущее время |
| 10 | Запись «для іншої людини» | Напоминание получает клиент, который записал |
| 11 | Отмена списания | Связь `cancels_movement_id`; отменённое списание остаётся в списке с `cancelled: true` |
| 12 | Тип обратного движения | `receipt` (Надходження), как в ТЗ |
| 13 | Отмена списания удалённого товара | Разрешена |

## Что изменилось

| Где | Что |
| --- | --- |
| `app/api/admin/calendar.py` | Новый роутер: `GET /payment-methods`, `GET /schedule`, `GET /records/daily-summary`. Подключён в `router.py` раньше `records`, иначе `/records/daily-summary` попал бы в `/records/{record_id}` |
| `app/services/slots.py` | `load_schedules()` — графики нескольких мастеров за период одним набором запросов; `exception_on()`, `work_minutes()`. Рабочие окна — та же логика, что у слотов |
| `app/api/admin/staff.py` | Исключения графика не пересекаются (`409`); в `PATCH` нельзя очистить `dateFrom`, `dateTo`, `type` (`422`) |
| `app/models/shard/record.py` | `reminder_enabled` (по умолчанию `true`) |
| `app/api/admin/records.py` | В `RecordOut`: `reminderEnabled`, `reminderSentAt`, `clientTelegramLinked`; `reminderEnabled` в `POST` и `PATCH` (журнал: `reminder_enabled: [старое, новое]`); перенос на будущее сбрасывает `reminder_sent_at` |
| `workers/tasks/reminders.py` | Пропускает записи с `reminder_enabled = false` |
| `app/api/admin/clients.py` | В `ClientOut`: `telegramLinked` |
| `app/models/shard/inventory.py` | `StockMovement.cancels_movement_id` (unique) |
| `app/api/admin/inventory.py` | `DELETE /records/{id}/consumables/{movementId}`; в списке расходников — `cancelled`, `cancelledAt`, `cancelledBy` |
| Миграция `f1a3c5e7b9d2` | `records.reminder_enabled`, `stock_movements.cancels_movement_id` — только расширение схемы |

Уже существующие пересекающиеся исключения миграция не трогает: в таких днях действует более
раннее по `date_from`.
