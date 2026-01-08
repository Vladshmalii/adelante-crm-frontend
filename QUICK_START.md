# 🚀 Швидкий старт Adelante CRM Frontend

## Використання хуків для роботи з даними

Всі модулі тепер мають хуки, які автоматично працюють з моками або API залежно від налаштувань.

### 1. Авторизація (`useAuth`)

```typescript
import { useAuth } from '@/shared/hooks/useAuth';

function LoginPage() {
    const { login, register, logout, user, isLoading, error } = useAuth();

    const handleLogin = async () => {
        await login('demo@adelante.com', 'password');
        // Автоматично перенаправить після успішного логіну
    };

    return <div>...</div>;
}
```

### 2. Клієнти (`useClients`)

```typescript
import { useClients } from '@/features/clients/hooks/useClients';

function ClientsPage() {
    const { 
        clients, 
        isLoading, 
        error,
        createClient, 
        updateClient, 
        deleteClient 
    } = useClients({
        search: 'Іван',
        segment: 'repeat',
    });

    const handleCreate = async () => {
        await createClient({
            firstName: 'Новий',
            lastName: 'Клієнт',
            phone: '+380501234567',
            totalVisits: 0,
            totalSpent: 0,
        });
    };

    return <div>...</div>;
}
```

### 3. Послуги (`useServices`)

```typescript
import { useServices } from '@/features/services/hooks/useServices';

function ServicesPage() {
    const { services, isLoading, createService, updateService, deleteService } = useServices({
        category: 'hair',
        isActive: true,
    });

    return <div>...</div>;
}
```

### 4. Співробітники (`useStaff`)

```typescript
import { useStaff } from '@/features/staff/hooks/useStaff';

function StaffPage() {
    const { staff, isLoading, createStaff, updateStaff, deleteStaff } = useStaff({
        position: 'master',
        isActive: true,
    });

    return <div>...</div>;
}
```

### 5. Записи (`useAppointments`)

```typescript
import { useAppointments } from '@/features/calendar/hooks/useAppointments';

function CalendarPage() {
    const { 
        appointments, 
        isLoading,
        createAppointment, 
        updateAppointment,
        updateAppointmentStatus,
        deleteAppointment 
    } = useAppointments({
        dateFrom: '2024-01-01',
        dateTo: '2024-01-31',
        staffId: 1,
    });

    return <div>...</div>;
}
```

### 6. Фінанси (`useFinances`)

```typescript
import { useFinances } from '@/features/finances/hooks/useFinances';

function FinancesPage() {
    const { 
        operations,
        documents,
        isLoading,
        createOperation,
        createDocument,
        getDashboard 
    } = useFinances({
        dateFrom: '2024-01-01',
        dateTo: '2024-01-31',
        type: 'income',
    });

    return <div>...</div>;
}
```

### 7. Склад (`useInventory`)

```typescript
import { useInventory } from '@/features/inventory/hooks/useInventory';

function InventoryPage() {
    const { 
        products, 
        isLoading,
        createProduct, 
        updateProduct,
        deleteProduct,
        createStockMovement 
    } = useInventory({
        category: 'professional',
        stockStatus: 'low',
    });

    const handleStockIn = async (productId: number, quantity: number) => {
        await createStockMovement({
            productId,
            type: 'in',
            quantity,
            reason: 'Поповнення складу',
        });
    };

    return <div>...</div>;
}
```

## Переключення режимів

### Demo режим (мокові дані)
```typescript
// src/lib/config.ts
export const config = {
    USE_MOCK_DATA: true, // ← змініть на true
};
```

### Production режим (реальний API)
```typescript
// src/lib/config.ts
export const config = {
    USE_MOCK_DATA: false, // ← змініть на false
};
```

## Тести (smoke)

- API: `npm run test:api` (потребує запущений backend на http://localhost:8000 або BACKEND_URL)
- Frontend: `npm run test:frontend` (потребує запущений frontend на http://localhost:3000 або FRONTEND_URL)
- Усе разом: `npm test`

## Особливості

✅ **Автоматичне переключення** - хуки самі визначають з чим працювати (моки чи API)

✅ **Однаковий інтерфейс** - код компонента не змінюється при переключенні режимів

✅ **Типізація** - повна підтримка TypeScript з автодоповненням

✅ **Обробка помилок** - всі хуки повертають `error` для відображення проблем

✅ **Loading states** - всі хуки повертають `isLoading` для UI індикаторів

✅ **Імітація затримок** - моки мають затримку 300мс для реалістичності

## Приклад повного використання

```typescript
import { useClients } from '@/features/clients/hooks/useClients';
import { useServices } from '@/features/services/hooks/useServices';

function BookingPage() {
    const { clients, isLoading: clientsLoading } = useClients();
    const { services, isLoading: servicesLoading } = useServices();

    if (clientsLoading || servicesLoading) {
        return <div>Завантаження...</div>;
    }

    return (
        <div>
            <ClientSelect clients={clients} />
            <ServiceSelect services={services} />
            <BookingForm />
        </div>
    );
}
```

## Де дивитись приклади

- `src/features/*/hooks/*.ts` - всі хуки
- `src/lib/config.ts` - конфігурація
- `src/lib/api/*.ts` - API клієнти
- `src/features/*/data/*.ts` - мокові дані

## Наступні кроки

1. Оновіть існуючі компоненти для використання нових хуків
2. Встановіть `USE_MOCK_DATA: false` для роботи з backend
3. Запустіть backend: `cd adelante-crm-backend && docker-compose up -d`
4. Запустіть frontend: `npm run dev`
5. Перевірте роботу на http://localhost:3000

Готово! 🎉

