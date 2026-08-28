# Frontend Review — Adelante CRM

Зафіксований стан фронтенду станом на 2026-08-25, після перенесення коду в `/ui`
(поруч з майбутніми `/backend` і `/bot`).

## Про проєкт

**Adelante CRM** — система управління салоном краси (beauty salon CRM):
запис клієнтів, календар/розклад майстрів, картки клієнтів, склад
(товари/матеріали), фінанси, програма лояльності, звіти, довідник послуг,
персонал, публічна сторінка онлайн-бронювання (`/booking`) та адмін-налаштування.
Інтерфейс українською (`<html lang="uk">`).

Продукт явно проєктувався для трьох компонентів одного репозиторію
(`ui` / `backend` / `bot` — звідси й `BOT_TOKEN`, `JWT_SECRET` у корені `.env`),
але наразі в репозиторії реалізований лише фронтенд.

## Стек

- **Framework:** Next.js 15 (App Router), React 18.3, TypeScript 5 (strict).
- **Збірка/деплой:** `output: 'export'` — статичний експорт для GitHub Pages
  (`.github/workflows/deploy.yml`), з `basePath`/`assetPrefix` під production,
  `trailingSlash: true`. Локальний dev — звичайний `next dev`.
- **Стилі:** Tailwind CSS 3 + власна тема (кастомні кольори/токени в
  `tailwind.config.mjs`), глобальні стилі в `src/styles/global.css`, підтримка
  темної теми через `class` (`dark`), локальні шрифти SF UI Display
  (`next/font/local`).
- **Стан:** Zustand — окремий store на кожен домен (`useAuthStore`,
  `useCalendarStore`, `useClientsStore`, `useFinancesStore`,
  `useInventoryStore`, `useNotificationsStore`, `useServicesStore`,
  `useSettingsStore`, `useStaffStore`, `useUIStore`).
- **HTTP:** axios-обгортка `ApiClient` (`src/lib/api/client.ts`) з
  interceptors: підстановка `Authorization`, авто-refresh access token по 401
  (з дедуплікацією через `refreshPromise`), redirect на `/login` при відсутності
  токена, зберігання токена в `localStorage` + дублювання в cookie
  (`auth_token`) для читання в middleware.
- **Real-time:** власний WebSocket-клієнт (`src/lib/websocket/client.ts`) +
  `WebSocketProvider`.
- **UI/UX бібліотеки:** `@dnd-kit/*` (drag-and-drop — календар/дошки),
  `recharts` (графіки у фінансах/звітах/overview), `lucide-react` (іконки),
  `date-fns` (дати), `clsx` (умовні класи).
- **Роутинг/захист:** `middleware.ts` на рівні Next.js — читає cookie
  `auth_token`, пускає публічні маршрути (`/login`, `/register`,
  `/forgot-password`, `/booking`, `/setup`), інше — тільки з токеном; враховує
  `basePath` для GitHub Pages.
- **Лінт/типи:** ESLint (`eslint-config-next`, білд не падає на lint-помилках —
  `ignoreDuringBuilds: true`), TypeScript-помилки збірку зупиняють
  (`ignoreBuildErrors: false`).
- **Тестів наразі немає** (`tests/api-smoke.mjs`, `tests/frontend-smoke.mjs`
  видалені зі staged-змін до цього ревʼю, npm-скрипти `test:*` посилаються на
  неіснуючі файли).

## Архітектура

Feature-based структура під `ui/src`:

```
ui/src/
  app/            # Next.js App Router: маршрути = сторінки-обгортки
  features/       # бізнес-логіка по доменах (booking, calendar, clients,
                   #   finances, inventory, loyalty, overview, profile,
                   #   reports, services, settings, staff)
    <feature>/
      components/ # UI feature-а
      data/       # mock-дані (MOCK_*), типи домену
      hooks/      # feature hooks (де є)
      modals/     # модалки feature-а
  shared/         # спільне: components/layout (AppShell, Sidebar, TopBar,
                   #   PageHeader, GlobalSearch...), components/ui
                   #   (примітиви), providers (Toast, WebSocket, Auth), hooks
  stores/         # zustand-стори, по одному на домен
  lib/
    api/          # ApiClient + per-domain API модулі (auth, clients,
                   #   appointments, finances, inventory, staff, services,
                   #   settings, reports, notifications, overview)
    websocket/    # WS-клієнт
    utils/        # cn, formatters, validators, constants
    config.ts     # єдина точка правди для env (API_URL, WS_URL, BASE_PATH,
                   #   USE_MOCK_DATA)
  styles/         # global.css (Tailwind + теми)
```

Ключові архітектурні рішення:

- **Сторінки `app/*/page.tsx` тонкі** — рендерять компонент з відповідного
  `features/<domain>`, вся логіка живе у feature-модулі, не в роуті.
- **Перемикач mock/real API через один прапорець.** `NEXT_PUBLIC_USE_MOCK_DATA`
  → `config.USE_MOCK_DATA` (`src/lib/config.ts`). У `false`-режимі
  `ApiClient` реально ходить на `NEXT_PUBLIC_API_URL`
  (`http://localhost:8000/api/v1` за замовчуванням) через `/lib/api/*`;
  бекенду під цей контракт у репозиторії ще немає (буде в `/backend`). У
  `true`-режимі (поточний прод-деплой на GitHub Pages) UI живе повністю на
  `MOCK_*`-даних з `features/*/data`.
- **Auth:** JWT access+refresh у `localStorage`, access-token додатково
  дублюється в cookie, щоб `middleware.ts` (server-side, на edge) міг
  перевірити доступ до захищених маршрутів ще до рендеру сторінки.
  Access-token з `exp` перевіряється на клієнті перед запитом; протухлий —
  силіентно рефрешиться через `/auth/refresh` до відправки основного запиту.
- **Статичний експорт (`output: 'export'`)** означає, що в проді немає
  Node-сервера: весь захист доступу на проді фактично лежить на клієнтському
  JS + auth middleware, який працює лише в dev/при звичайному Next-сервері;
  для GitHub Pages деплою це просто статичні файли, реальний backend буде
  окремим сервісом (звідси розмежування на `/ui`, `/backend`, `/bot`).
- **Домени зі своїми stores + data-моками** ізольовані одне від одного —
  дозволяє розробляти/дискавами кожен фіче-модуль незалежно, поки бекенд не
  готовий.

## Що варто мати на увазі під час розробки `/backend`

- Контракт відповіді очікується у формі `ApiResponse<T>` (`data`, опційно
  `message`, `meta.{page,perPage,total,totalPages}`) — див.
  `ui/src/lib/api/client.ts`.
- Ендпоінти авторизації, які фронтенд смикає без токена:
  `/auth/login`, `/auth/register`, `/auth/setup`, `/auth/refresh`,
  `/auth/forgot-password`, `/auth/reset-password`.
- Формат помилки, який парситься: `{ message, code?, details? }`
  (або `detail` — обидва варіанти підтримані).
- `.env` у корені репо вже містить `JWT_SECRET` і `BOT_TOKEN` — судячи з назв,
  підготовлені під майбутні `/backend` і `/bot`, фронтенд їх не використовує.
