# Задача: подключить `web/` к изменениям API бекенда (2026-09-28)

После перегенерации типов в схеме появятся и эндпоинты склада и отчётов — страницы для них
описаны отдельно в [FRONTEND_INVENTORY_REPORTS.md](./FRONTEND_INVENTORY_REPORTS.md).

Бриф для агента, который работает с фронтендом. Бекенд уже изменён и проверен; **бекенд не
трогать** — если чего-то не хватает, опиши это в отчёте.

Перед началом прочитай: `web/README.md`, `web/docs/FEATURES.md` (раздел 12–13),
`web/docs/ACCESS.md`, `web/docs/COMPONENTS.md`. Подробности бекенда — `backend/README.md`.

## Общее

- Префикс Admin API `/api/admin/v1`, заголовок `X-Salon-Id`, ответы `{data, meta}`, поля camelCase.
- Все даты в ответах — ISO с зоной (UTC). Время без зоны в запросах бекенд считает киевским.
  Фронт показывает всё в `Europe/Kyiv` (`shared/lib/date.ts`), так и остаётся.
- Ошибки: `{message, code?, details?}`. `message` теперь **на украинском** — его можно показывать
  пользователю как есть. Для чужого объекта мастеру приходит `404`, для запрещённого действия —
  `403`.

### Шаг 1 — типы

```bash
npm run api:generate   # из запущенного бекенда: http://localhost:8000/openapi.json
npm run check
```

Исправить все ошибки типов, которые появятся. Ниже — что изменилось.

## Ломающие изменения (сделать обязательно)

### Запись (`RecordOut`, `GET /records`, `GET /records/{id}`)

| Поле                            | Было                | Стало                                                                         |
| ------------------------------- | ------------------- | ----------------------------------------------------------------------------- |
| `master`                        | `{id, name, color}` | `{id, name, color} \| null` — `null` = запись «Без майстра»                   |
| `services`                      | —                   | `[{id, name, price, durationMinutes, category, color}]` по порядку выполнения |
| `service`                       | единственная услуга | **удалено** — используйте `services`                                          |
| `price`, `totalAmount`, `endAt` | по одной услуге     | сумма по всем услугам                                                         |

Что поправить:

- `pages/overview/ui/RecordsTab.tsx` — колонки «Майстер» (`r.master?.name ?? 'Без майстра'`) и
  «Послуга» (список `services`).
- `pages/overview/ui/RecordDrawer.tsx` — то же, плюс список услуг с ценами.
- Уведомления (`widgets/notifications/model/map-event.ts`): в payload `record.created` /
  `record.updated` теперь есть `master_id` (может быть `null`), `previous_master_id`,
  `service_names[]`, `service_name` (через запятую), `change`
  (`rescheduled | reassigned | cancelled | status | completed | paid | unpaid | updated`),
  `actor_id`. Фильтр мастера по `master_id` можно оставить — бекенд уже сам шлёт мастеру
  только его события.

Новые фильтры списка: `GET /records?withoutMaster=true` (для мастера — всегда пусто) и
`serviceCategory=<категория>` — запись подходит, если хотя бы одна её услуга из этой категории
(вернуть фильтр «Категорія послуг» на вкладку Огляд → Записи; список категорий —
`GET /services/categories`).

### Визиты клиента (`GET /clients/{id}/visits`)

`services: [{id, name}]` — новое; `serviceId`/`serviceName` — **удалены**;
`masterId`, `masterName` — могут быть `null`.

### Права — бекенд теперь их проверяет

| Роль          | Что изменилось на бекенде                                                                                                                                                                |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Мастер        | `/staff/*`, `/reviews`, `/audit`, `/finances/*` → `403`. `/clients` — только свои; `POST/PATCH/DELETE /clients`, импорт, экспорт → `403`. `GET /services` можно, изменение → `403`       |
| Администратор | `/finances/*`, `/clients/export`, `/staff/export`, `/staff/{id}/stats` → `403`; `salary` и `commissionPercent` приходят `null`, отправка их → `403`; управление администраторами → `403` |
| Суперюзер     | всё                                                                                                                                                                                      |

Проверь под мастером и администратором, что закрытые разделы/кнопки скрыты и `403` нигде не
выскакивает при обычной работе. **Финансы, экспорты, зарплаты видит только суперюзер** —
флаг выдаётся `salonctl administrator superuser <email>` (бекенд, уже есть в `/auth/me`).

### `/auth/me` и логин

- `salons` — только салоны, где сотрудник не уволен.
- Логин (`user`) содержит `isSuperuser`.

## Новые возможности (подключить)

### Мій профіль

`GET /auth/me` (с `X-Salon-Id`) теперь отдаёт:

```
middleName, additionalPhone, gender, birthDate, address,
emergencyContactName, emergencyContactPhone, telegramLinked, isSuperuser,
timezone ("Europe/Kyiv"),
profile: { salonId, position, specializations[], status, salary, commissionPercent, hireDate } | null
```

`PATCH /auth/me` — только свои контакты:
`phone, additionalPhone, address, emergencyContactName, emergencyContactPhone, avatarUrl`.
Имя, должность, оклад меняет администратор в карточке сотрудника.

Задачи: форма редактирования контактов; блок «Додаткова інформація»; свой оклад и комиссия
(только чтение); статус Telegram (`telegramLinked`) с подсказкой «Надішліть боту свій контакт»
(бот `t.me/AdelanteCrmBot`, кнопка «Поділитися контактом» — привязка по телефону).

### Співробітники

| Эндпоинт                                               | Что                                                                                                                                                                                                                                           | Кто                                                                                      |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `GET /staff/{id}`                                      | Карточка по прямой ссылке                                                                                                                                                                                                                     | администратор                                                                            |
| `PATCH /staff/{id}`                                    | Теперь и для администраторов. Новые поля: `password` (мин. 8), `isSuperuser`, `address`, `emergencyContactName`, `emergencyContactPhone`. `status: "active"` у уволенного — восстановление. `status: "fired"` → `422` (увольнение — `DELETE`) | администратор; администраторов, `isSuperuser`, `salary`, `commissionPercent` — суперюзер |
| `DELETE /staff/{id}`                                   | Увольнение, теперь и администраторов. Себя — `409`; мастер с будущими записями — `409`                                                                                                                                                        | администратор; администратора — суперюзер                                                |
| `POST /staff`                                          | `isSuperuser` (только для `role: "administrator"`), контакты; email занят → `409`                                                                                                                                                             | суперюзер для администраторов                                                            |
| `GET/POST /staff/{id}/schedule`                        | Теперь и для администраторов                                                                                                                                                                                                                  | администратор (администратора — суперюзер)                                               |
| `PATCH /staff/{id}/schedule/exceptions/{exceptionId}`  | Поля `dateFrom, dateTo, type, start, end, comment`; `dateTo < dateFrom` → `422`                                                                                                                                                               | то же                                                                                    |
| `DELETE /staff/{id}/schedule/exceptions/{exceptionId}` | `204`                                                                                                                                                                                                                                         | то же                                                                                    |
| `GET /staff/export`                                    | Excel (blob)                                                                                                                                                                                                                                  | суперюзер                                                                                |

В `StaffOut` новые поля: `isSuperuser`, `telegramLinked`, `address`,
`emergencyContactName`, `emergencyContactPhone`. Уволенный сотрудник — `status: "fired"`.

Задачи: убрать ограничения «администраторов нельзя редактировать/увольнять»; переключатель
«Суперюзер» в форме администратора (только суперюзеру, себе снять нельзя); смена пароля;
редактирование/удаление исключений графика; экспорт; прямая ссылка на карточку через
`GET /staff/{id}`; кнопка «Відновити» у уволенных.

### Фінанси

- `POST /finances/receipts` принимает `recordId`: чек оплаты завершённого визита. Сумма оплат
  должна равняться `totalAmount` записи, иначе `409`; клиент берётся из записи.
- Отмена чека с `recordId` возвращает записи `paymentStatus: "unpaid"`.
- `GET /finances/dashboard`: `revenueByDay` группируется по киевским суткам; `topServices` —
  по услугам внутри записей.
- Фильтры `masterId` и `location` в `GET /finances/operations`, `/receipts`, `/dashboard`,
  `/export`. `masterId` — мастер **записи**, к которой относится операция или чек (операции и
  чеки без записи под фильтр не попадают); `location` — локация кассы. Вернуть фильтры
  «Співробітник» и «Локація», которых сейчас нет в Фінансах.
- `GET /finances/locations` — список локаций активных касс (для выпадающего списка).
- `PATCH /finances/cash-registers/{id}` — `name`, `location`, `isActive` (удаления нет — выключение).
  Баланс не редактируется. В выключенную кассу нельзя провести новую операцию, чек или привязать
  способ оплаты (`422`); в списке касс она остаётся с `isActive: false`. Добавить редактирование
  касс в «Методи оплат».

### Записи — для Розкладу (когда до него дойдёт)

Отдельно Розклад не делать без задачи, но контракт уже готов:

| Эндпоинт                                                | Что                                                                                                                                                                                                                                                 |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /records`                                         | `serviceIds: uuid[]` (мин. 1, вместо `serviceId`), `masterId` необязателен (мастер — всегда к себе, указать другого → `403`), `clientId` или `newClient {name, phone}`, `startAt`, `source`, `importance`, `comment`, `visitorName`, `visitorPhone` |
| `PATCH /records/{id}`                                   | `startAt`, `masterId` (`null` — снять мастера; мастеру → `403`), `serviceIds`, `importance`, `comment`, `internalNotes`, `visitorName`, `visitorPhone`                                                                                              |
| `POST /records/{id}/status`                             | Без изменений; `cancelled` — отмена                                                                                                                                                                                                                 |
| `POST /records/{id}/complete`                           | Теперь только `{notes?, photoUrls[]}`, без оплат. Результат: `status: completed`, `paymentStatus: unpaid`. Без мастера → `409`                                                                                                                      |
| `POST /records/{id}/payment`                            | `{payments: [{paymentMethodId, amount}]}` (сумма = `totalAmount`; частичной оплаты и чаевых нет) → `{record, receipt: {id, number, amount}}`. Только администратор; не завершена / уже оплачена / без мастера → `409`                               |
| `GET /masters/{id}/slots?date=&serviceIds=&serviceIds=` | Свободное время под набор услуг (`serviceIds` обязателен, старый `serviceId` удалён); мастер — только своё                                                                                                                                          |

### Склад и Звіти — API готово

Эндпоинты, модели и права — [BACKEND.md](./BACKEND.md), разделы 5 и 6 (реализованы
2026-09-28). Коротко:

- `/inventory/*` — администратор и суперюзер (цены товаров видят оба). Мастер: только
  `GET /inventory/products` (название, единица, остаток) и `GET/POST /records/{id}/consumables`
  по своей записи.
- `/reports/*` — администратор и суперюзер; денежные поля — только суперюзеру (администратору
  `null`, `GET /reports/revenue` → `403`, в `GET /reports/export` нет листа «Виручка»).
- В меню разделы появляются вместе со страницами (решение 4 в FEATURES.md, раздел 12).

Страницы Склада и Звітів — отдельный бриф [FRONTEND_INVENTORY_REPORTS.md](./FRONTEND_INVENTORY_REPORTS.md);
делать, только если это есть в твоей задаче.

## Как проверять

- Локально: бекенд по `backend/README.md`; три пользователя — суперюзер
  (`salonctl administrator create ... --salon <slug> --superuser`), администратор и мастер
  (создать через «Співробітники»).
- Пройти Огляд, Клієнти, Співробітники, Фінанси, Мій профіль под каждой ролью.
- Создать запись без мастера через API (`POST /records` без `masterId`) и убедиться, что Огляд
  её показывает.
- `npm run check` зелёный.
- Обновить `web/docs/FEATURES.md` (раздел 13) и `web/docs/ACCESS.md` («Что уже работает»):
  ограничения, снятые бекендом, убрать.

## Не делать

- Не менять `backend/` и `bot/`.
- Не делать абонементы (раздел 4 `BACKEND.md`) — на бекенде их ещё нет.
