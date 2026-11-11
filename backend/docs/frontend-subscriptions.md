# Фронтенд: абонементы и новые поля сертификатов (этап 3)

Постановка для фронта к бэкенду, влитому в main 2026-11-11 (`bf4ab48`). Бэкенд готов,
бэкенд не меняем. Бизнес-правила — `subscriptions.md` (разделы 1–12, уточнения 13–14) и
`certificates.md` (раздел 11). Экраны Altegio, на которые ориентируемся, —
`frontend-loyalty-page.md`, разделы 1.3 и 1.4.

---

## 1. Сертификаты (`/loyalty/certificates`, вкладка «Типи сертифікатів»)

1. **Область** — 4 варианта: «На все», «На вибрані послуги», «На вибрані товари», «На вибрані
   послуги та товари». Для услуг и товаров — выбор по салонам (как сейчас услуги).
2. **Категории**: в форме — select «Категорія» (или «Без категорії»). Управление категориями
   (создать, переименовать, порядок, удалить) — модалка на странице, только суперюзер.
   Список шаблонов **группируется по категориям** (сворачиваемые группы, «N типів» в заголовке).
3. **Срок** — «Безстроковий» / «N днів від продажу» / «До дати». У «до дати» в списке —
   «до 31.03.2024».
4. Колонка **«Випущено»** (`issuedCount`).
5. **Продажа** (`CertificateSalePicker`): шаблоны сгруппированы по категориям; шаблоны с
   `validUntil` в прошлом не предлагаем (бэкенд всё равно ответит 422).
6. **Погашение** (`POST /certificates/lookup`): передавать строки товаров (`products`) и строки,
   оплаченные абонементом (`subscriptionRecordServiceIds`), — от этого зависит `maxPayment`.

## 2. Абонементы

### 2.1. Страница `/loyalty/subscriptions`
Карточка «Абонементи» на хабе становится активной (убрать «Скоро»). Вкладки:
- **«Типи абонементів»**: Активні / Архів, поиск по названию, «+ Додати тип», колонки Назва,
  Ціна, Одиниці, Термін, Випущено; действие «Копіювати» (форма создания с полями копии).
- **«Продані абонементи»** — реестр: фильтры статус / тип / салон-продавец / поиск (название,
  клиент, телефон), пагинация; строка — клиент, абонемент, остаток, статус, діє до; клик —
  карточка абонемента (2.4).

### 2.2. Форма типа
Поля по разделу 3 спеки, подписи — по Altegio:
- Назва; Одиниця: «Відвідування» / «Хвилини»; Баланс: «Загальний» (+ Кількість) /
  «Роздільний» (кількість у кожної послуги).
- Послуги: список пар салон — послуга (+ кількість при роздільному), «+ Додати послугу».
- Вартість ₴; Тривалість: число + день/місяць, 0 — «Безстроковий».
- Активація: «При продажу» / «При першому візиті»; при першому візиті — «Автоматично
  активується через N днів» (необязательно).
- «Дозволити заморожувати» + «Максимум днів заморозки» (0 — без обмежень).
- «Архівувати» = `isActive: false`.
Ошибки валидации бэкенда (422) показывать у полей.

### 2.3. Продажа
В окне оплаты визита (`PaymentModal`) и продаже без записи (`ReceiptFormModal`) —
«+ Абонемент» рядом с «+ Сертифікат», по образцу `CertificateSalePicker`. В продаже без записи
нужен клиент — без него кнопка оплаты неактивна с подсказкой. После оплаты абонемент виден
в карточке клиента.

### 2.4. Списание на визите
В `PaymentModal`: у строки услуги, которую покрывает абонемент клиента
(`GET /clients/{id}/subscriptions?usableForSalon=`), — выбор «Оплатити абонементом» со списком
подходящих абонементов (название, остаток, діє до). Выбор вручную, по умолчанию не выбран.
Предпросмотр — с `subscriptionUses`; строка показывает 0 ₴ и «−N відв./хв». Ошибки 422
(не хватает остатка, заморожен и т. п.) — текстом бэкенда.

### 2.5. Карточка клиента (`ClientDrawer`)
Блок «Абонементи» (администратор и суперюзер; мастеру не показывать):
- список: название, статус (тег), остаток (по услугам при раздельном), діє до, заморожен до;
- действия: «Заморозити» / «Розморозити» (с подтверждением; доступность — по `freezeAllowed`,
  `freezeUsed`, статусу);
- «Історія» — журнал операций (`/subscriptions/{id}/operations`).
Та же карточка абонемента открывается из реестра.

### 2.6. Прочее
- Детали записи: у услуги, оплаченной абонементом, — тег «Абонемент» и списано единиц.
- Отчёт «Послуги»: колонка «Вартість за абонементом» (`subscriptionValue`).
- Бот — уже сделан на бэкенде, во фронте ничего.

---

## 3. API (всё под `/api/admin/v1`, camelCase, конверт `{data, meta?}`)

Перед работой — перегенерировать `web/src/shared/api/schema.gen.ts` (`npm run api:generate`
против запущенного бэкенда или `OPENAPI_URL=./openapi.json`) и сверить с этим списком.

**Типы абонементов**
- `GET /subscriptions/types?active=`, `GET /subscriptions/types/{id}` — администратор, суперюзер.
- `POST /subscriptions/types`, `PATCH /subscriptions/types/{id}` — суперюзер.
- Поля: `name`, `price`, `unitKind` (`visits` | `minutes`), `balanceMode` (`shared` | `separate`),
  `totalUnits` (только shared, 1…100000), `durationValue` (0 — бессрочный), `durationUnit`
  (`day` | `month`), `activationMode` (`on_sale` | `first_visit`), `autoActivateDays` (только
  first_visit), `freezeAllowed`, `freezeMaxDays` (0 — без лимита), `isActive`, `sortOrder`,
  `services: [{salonId, serviceId, units}]` (`units` только separate).
  Ответ + `id`, `issuedCount`, `createdAt`, `updatedAt`.

**Продажа**
- `POST /records/{id}/payment`, `POST /finances/receipts`: `subscriptions: [{typeId}]`
  (в продаже без записи нужен `clientId`, иначе 422).
- Предпросмотр `GET /records/{id}/checkout`, `GET /finances/receipts/checkout`:
  `subscriptionTypeIds=` (повторяемый). В строке — `kind: "subscription"`, `subscriptionTypeId`.
- `ReceiptOut.subscriptions[]`: `id`, `typeId`, `name`, `amount`, `paidAmount`, `subscriptionId`.
- Отмена чека покупки после использования — 409 «Абонементом вже користувалися — скасувати чек не можна».

**Списание**
- `POST /records/{id}/payment`: `subscriptionUses: [{recordServiceId, subscriptionId}]`; любой отказ — 422.
- `GET /records/{id}/checkout`: `subscriptionUses=<recordServiceId>:<subscriptionId>` (повторяемый);
  в строке — `subscriptionId`, `subscriptionUnits`; в ответе — `subscriptionUsedAmount`.
- `RecordOut.services[]`: `recordServiceId`, `subscriptionId`, `subscriptionUnits`, `subscriptionUnitValue`.
- `GET /reports/services`: в строках услуг и категорий — `subscriptionValue`.

**Чтение и заморозка**
- `GET /clients/{id}/subscriptions?usableForSalon=` — администратор, суперюзер (мастеру 403); новые сверху.
- `GET /subscriptions/{id}` → `SubscriptionOut`.
- `POST /subscriptions/{id}/freeze`, `POST /subscriptions/{id}/unfreeze` — администратор, без тела;
  отказ — 409; ответ — `SubscriptionOut`.
- `GET /subscriptions/{id}/operations` — журнал, новые сверху: `id`, `type` (`issue` | `use` |
  `reversal` | `expire` | `cancel`), `delta`, `balanceAfter`, `balanceId`, `basketSalonId`,
  `basketServiceId`, `salonId`, `salonName`, `receiptId`, `recordId`, `recordServiceId`,
  `reversesId`, `comment`, `authorName`, `createdAt`.
- `GET /subscriptions?status=&typeId=&salonId=&q=&page=&perPage=` — реестр, суперюзер, пагинация в `meta`.

**`SubscriptionOut`**: `id`, `typeId`, `name`, `client {id, name}`, `status` (`pending` | `active` |
`frozen` | `spent` | `expired` | `cancelled`), `unitKind`, `balanceMode`, `unitsTotal`, `balance`,
`services [{salonId, salonName, serviceId, serviceName (может быть null), units, balance}]`,
`paidAmount`, `unitValue`, `durationValue`, `durationUnit`, `activationMode`, `autoActivateAt`,
`activatedAt`, `expiresAt`, `freezeAllowed`, `freezeMaxDays`, `freezeUsed`, `frozenAt`,
`freezeUntil`, `unfrozenAt`, `frozenDays`, `soldSalonId`, `soldSalonName`, `soldReceiptId`,
`soldAt`, `cancelledAt`, `cancelledByName`, `cancelReason`, `createdAt`.

**Сертификаты**
- Шаблон: `scope` (`any` | `services` | `products` | `services_products`),
  `products: [{salonId, productId}]`, `categoryId`, `validUntil` (nullable), `issuedCount`.
- Категории: `GET/POST/PATCH /certificates/categories`, `DELETE /certificates/categories/{id}` (204);
  поля `id`, `name`, `sortOrder`, `createdAt`; читать — администратор, менять — суперюзер.
- `POST /certificates/lookup`: `products`, `subscriptionRecordServiceIds`.
- Отказ сертификата в оплате визита теперь **422** (было 409) — проверить обработку ошибок в окнах оплаты.

## 4. Статусы абонемента (подписи)

| `status` | Подпись | Цвет тега |
|---|---|---|
| pending | Очікує активації | default |
| active | Активний | green |
| frozen | Заморожений | blue |
| spent | Використаний | default |
| expired | Термін минув | orange |
| cancelled | Анульований | red |
