# Adelante CRM — web

Админ-панель салона. SPA на React 19 + Ant Design 6, ходит в отдельный бекенд (`../backend`, FastAPI).

## Стек

| Задача                   | Инструмент                                                                                           |
| ------------------------ | ---------------------------------------------------------------------------------------------------- |
| Сборка / dev-сервер      | Vite 8                                                                                               |
| UI                       | antd 6 + `@ant-design/pro-components` 3 (ProLayout, ProTable, ProForm)                               |
| Роутинг                  | TanStack Router (file-based, типизированные пути и search-параметры)                                 |
| Серверное состояние      | TanStack Query                                                                                       |
| Клиентское состояние     | Zustand (сессия, UI-настройки)                                                                       |
| HTTP                     | `openapi-fetch` + типы, сгенерированные из OpenAPI бекенда                                           |
| Валидация URL-параметров | zod                                                                                                  |
| Даты                     | dayjs (локаль `uk`), всё время — в поясе салона `Europe/Kyiv` (`shared/lib/date.ts`)                 |
| Графики                  | `@ant-design/plots` (только в чанке страницы «Фінанси»)                                              |
| Качество                 | TypeScript strict, ESLint 10 (typescript-eslint strict, react-hooks, TanStack, boundaries), Prettier |
| Тесты                    | Vitest + Testing Library (jsdom)                                                                     |

`@ant-design/pro-components` сейчас в beta (единственная ветка под antd 6) — версия
зафиксирована точно, обновлять осознанно.

## Запуск

```bash
nvm use            # Node 22
npm ci
cp .env.example .env.local
npm run dev        # http://localhost:5173
```

Бекенд пускает CORS только с прод-доменов, поэтому локально API проксируется через dev-сервер
Vite. В `.env.local`:

```bash
VITE_API_URL=http://localhost:5173
API_PROXY_TARGET=http://localhost:8000
# уведомления в реальном времени (сервис ws/ бекенда); без них колокольчик просто пустой
VITE_WS_URL=ws://localhost:5173/ws
WS_PROXY_TARGET=http://localhost:8001
```

## Скрипты

| Скрипт                      | Что делает                                                             |
| --------------------------- | ---------------------------------------------------------------------- |
| `npm run dev`               | dev-сервер                                                             |
| `npm run build`             | typecheck + production-сборка в `dist/`                                |
| `npm run check`             | typecheck + lint + format:check + тесты (то же, что стоит гонять в CI) |
| `npm run lint` / `lint:fix` | ESLint                                                                 |
| `npm run format`            | Prettier                                                               |
| `npm test`                  | Vitest в watch-режиме                                                  |
| `npm run api:generate`      | перегенерировать `src/shared/api/schema.gen.ts` из OpenAPI бекенда     |

### Типы API

Все пути, параметры и ответы бекенда типизированы из его OpenAPI-схемы. После изменений
в API бекенда:

```bash
npm run api:generate                                   # берёт http://localhost:8000/openapi.json
OPENAPI_URL=./openapi.json npm run api:generate        # или из файла
```

Заголовок `X-Salon-Id` из схемы вырезается — его подставляет middleware клиента.

## Структура: одна страница — один модуль

```
src/
  main.tsx            точка входа
  app/                провайдеры, роутер, QueryClient, тема antd
  routes/             TanStack Router (file-based). Тонкие файлы: URL → модуль страницы,
                      guard'ы, валидация search, предзагрузка данных в loader
  pages/<page>/       модуль страницы — всё, что нужно только ей
    index.ts          public API модуля (единственная точка входа снаружи)
    ui/               компоненты страницы
    api/              queryOptions / мутации
    model/            схемы search-параметров, типы, локальные сторы, константы
  widgets/<widget>/   блоки, используемые несколькими страницами (AppLayout)
  shared/<module>/    инфраструктура без бизнес-логики: api, session, auth, config, preferences
  routeTree.gen.ts    генерируется плагином роутера — не редактировать
```

Правила импорта проверяет ESLint (`eslint-plugin-boundaries`), нарушение — ошибка линта:

- импорт только «вниз»: `app → routes → pages → widgets → shared`;
- **страница не импортирует другую страницу**. Если код нужен двум страницам — он уезжает
  в `widgets/` (UI-блок) или `shared/` (инфраструктура);
- в `pages/*` и `widgets/*` снаружи заходим только через `index.ts`.

### Как добавить страницу

1. `src/pages/<name>/` с `ui/<Name>Page.tsx` и `index.ts`.
2. `src/routes/_app/<name>.tsx` — `createFileRoute('/_app/<name>')({ component: <Name>Page })`.
   Роуты внутри `_app/` автоматически закрыты авторизацией и обёрнуты в `AppLayout`.
3. Проверка прав в `beforeLoad`: `requireSection(context.viewer, '<section>')`.
4. Пункт меню в `src/widgets/app-layout/menu.tsx` (с тем же `section`).

Готовые страницы — образцы для следующих: `pages/clients`, `pages/staff`, `pages/services`,
`pages/overview` (вкладки в URL), `pages/finances` (вкладки, общий период, графики).
Состояние таблицы (страница, поиск, фильтры, открытая карточка) хранится в URL и валидируется
zod, данные грузятся в loader роута и через `useQuery` в компоненте, формы — `ModalForm`.

Если раздел закрыт для роли — `beforeLoad` роута вызывает `requireSection` (`routes/-lib/guard.ts`),
пункт меню скрывается по тому же правилу. Права по ролям — `shared/auth/access.ts` и
[docs/ACCESS.md](docs/ACCESS.md).

## Документация

- [docs/FEATURES.md](docs/FEATURES.md) — функционал страниц и принятые решения
- [docs/ACCESS.md](docs/ACCESS.md) — права доступа по ролям
- [docs/COMPONENTS.md](docs/COMPONENTS.md) — компоненты antd по страницам и чего не хватает

## Состояние

- **Данные с сервера** — только TanStack Query (кеш, инвалидация, loading/error).
  Не копировать их в Zustand.
- **Zustand** — то, чего нет на сервере: токены и активный салон (`shared/session`),
  тема и свёрнутость меню (`shared/preferences`).
- **URL** — фильтры, пагинация, открытые вкладки (search-параметры роутера).

## Авторизация

- Токены и `salonId` хранятся в `localStorage` (`shared/session`).
- `shared/api/client.ts` добавляет `Authorization` и `X-Salon-Id`, на 401 один раз
  обновляет токены (параллельные запросы ждут один refresh) и повторяет запрос.
  Если refresh не удался — сессия очищается, роутер уводит на `/login?redirect=…`.
- Guard — `beforeLoad` в `routes/_app.tsx`.

## Docker

```bash
docker build -t adelante-web .
docker run -p 8080:80 \
  -e API_URL=https://api-adelante.dvms.tech \
  -e WS_URL=wss://ws-adelante.dvms.tech/ws \
  adelante-web
```

Статика отдаётся nginx. `API_URL` и `WS_URL` читаются при старте контейнера (`/config.js`),
поэтому один образ подходит для любого окружения. Без `WS_URL`
уведомления в реальном времени выключены — пересобирать под каждый бекенд не нужно.
