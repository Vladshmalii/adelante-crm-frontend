# Налаштування роботи з API

Цей додаток підтримує два режими роботи:
1. **Demo Mode** - використовує мокові дані для демонстрації заказчику
2. **Production Mode** - використовує реальний backend API

## Переключення режимів

### Варіант 1: Через змінні оточення

Створіть файл `.env.local` в кореневій директорії фронтенду:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

# Demo Mode
# true - використовувати мокові дані (для демо)
# false - використовувати реальний API
NEXT_PUBLIC_USE_MOCK_DATA=false
```

### Варіант 2: Через конфігураційний файл

Відредагуйте файл `src/lib/config.ts`:

```typescript
export const config = {
    API_URL: 'http://localhost:8000/api/v1',
    USE_MOCK_DATA: false, // змініть на true для демо режиму
    WS_URL: 'ws://localhost:8000/api/v1/ws',
} as const;
```

## Запуск з реальним API

1. Переконайтесь, що backend запущений:
```bash
cd adelante-crm-backend
docker-compose up -d
```

2. Backend буде доступний на `http://localhost:8000`

3. У фронтенді встановіть `USE_MOCK_DATA=false`

4. Запустіть фронтенд:
```bash
cd adelante-crm-frontend
npm run dev
```

5. Відкрийте `http://localhost:3000`

## Запуск в Demo режимі (для показу заказчику)

1. У фронтенді встановіть `USE_MOCK_DATA=true`

2. Запустіть фронтенд:
```bash
cd adelante-crm-frontend
npm run dev
```

3. Backend не потрібен - всі дані будуть моковими

## Що змінилось

- ✅ Додано хуки для роботи з API:
  - `useAuth` - авторизація (login, register, logout)
  - `useClients` - клієнти (CRUD + фільтри)
  - `useServices` - послуги (CRUD + категорії)
  - `useStaff` - співробітники (CRUD + розклад)
  - `useAppointments` - записи (CRUD + статуси)
  - `useFinances` - фінанси (операції + документи + дашборд)
  - `useInventory` - склад (CRUD + рух товарів)

- ✅ Мокові дані повністю збережені для демо режиму

- ✅ Автоматичне переключення між моками та API через одну змінну

- ✅ Адаптація всіх типів для сумісності з backend

- ✅ Імітація затримок мережі в мокових даних (300мс)

## Поточний стан модулів

| Модуль | Хук створено | API інтегровано | Моки збережено | Готовність |
|--------|--------------|-----------------|----------------|------------|
| Auth | ✅ | ✅ | ✅ | 100% |
| Clients | ✅ | ✅ | ✅ | 100% |
| Services | ✅ | ✅ | ✅ | 100% |
| Staff | ✅ | ✅ | ✅ | 100% |
| Appointments | ✅ | ✅ | ✅ | 100% |
| Finances | ✅ | ✅ | ✅ | 100% |
| Inventory | ✅ | ✅ | ✅ | 100% |

## Наступні кроки

1. ✅ ~~Створити хуки для всіх модулів~~ - ГОТОВО
2. ⏳ Оновити компоненти для використання хуків
3. ⏳ Протестувати роботу з реальним API
4. ⏳ Додати обробку помилок та loading states в UI

