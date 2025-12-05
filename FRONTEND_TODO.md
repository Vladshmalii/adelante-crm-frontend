# Frontend TODO - Что нужно реализовать

## 🔴 Критический приоритет (Необходимо для работы)

### 1. State Management (Zustand)

#### 1.1 Создать stores
```
src/
└── stores/
    ├── useAuthStore.ts
    ├── useCalendarStore.ts
    ├── useClientsStore.ts
    ├── useStaffStore.ts
    ├── useServicesStore.ts
    ├── useFinancesStore.ts
    ├── useInventoryStore.ts
    ├── useNotificationsStore.ts
    └── useSettingsStore.ts
```

#### 1.2 useAuthStore.ts
- [ ] Состояние:
  - `user: UserProfile | null`
  - `token: string | null`
  - `isAuthenticated: boolean`
  - `isLoading: boolean`
- [ ] Действия:
  - `login(email, password)`
  - `register(data)`
  - `logout()`
  - `refreshToken()`
  - `updateProfile(data)`
  - `checkAuth()` - проверка при загрузке

#### 1.3 useCalendarStore.ts
- [ ] Состояние:
  - `appointments: Appointment[]`
  - `selectedDate: string`
  - `view: CalendarView`
  - `isLoading: boolean`
  - `filters: AppointmentFilters`
- [ ] Действия:
  - `fetchAppointments(date)`
  - `createAppointment(data)`
  - `updateAppointment(id, data)`
  - `deleteAppointment(id)`
  - `updateStatus(id, status)`
  - `setView(view)`
  - `setFilters(filters)`

#### 1.4 useClientsStore.ts
- [ ] Состояние:
  - `clients: Client[]`
  - `selectedClient: Client | null`
  - `isLoading: boolean`
  - `filters: ClientFilters`
  - `pagination: PaginationMeta`
- [ ] Действия:
  - `fetchClients(page, filters)`
  - `fetchClientById(id)`
  - `createClient(data)`
  - `updateClient(id, data)`
  - `deleteClient(id)`
  - `importClients(file)`
  - `exportClients(filters)`
  - `setFilters(filters)`

#### 1.5 useStaffStore.ts
- [ ] Состояние:
  - `staff: StaffMember[]`
  - `selectedStaff: StaffMember | null`
  - `isLoading: boolean`
  - `filters: StaffFilters`
- [ ] Действия:
  - `fetchStaff(filters)`
  - `fetchStaffById(id)`
  - `createStaff(data)`
  - `updateStaff(id, data)`
  - `deleteStaff(id)`
  - `updateSchedule(id, schedule)`

#### 1.6 useServicesStore.ts
- [ ] Состояние:
  - `services: Service[]`
  - `selectedService: Service | null`
  - `isLoading: boolean`
  - `filters: ServiceFilters`
- [ ] Действия:
  - `fetchServices(filters)`
  - `fetchServiceById(id)`
  - `createService(data)`
  - `updateService(id, data)`
  - `deleteService(id)`

#### 1.7 useFinancesStore.ts
- [ ] Состояние:
  - `operations: FinanceOperation[]`
  - `documents: FinanceDocument[]`
  - `receipts: FinanceReceipt[]`
  - `paymentMethods: PaymentMethod[]`
  - `cashRegisters: CashRegister[]`
  - `dashboard: FinanceDashboard | null`
  - `isLoading: boolean`
  - `activeTab: FinanceTab`
- [ ] Действия:
  - `fetchOperations(filters)`
  - `createOperation(data)`
  - `fetchDocuments(filters)`
  - `createDocument(data)`
  - `fetchReceipts(filters)`
  - `createReceipt(data)`
  - `fetchPaymentMethods()`
  - `fetchCashRegisters()`
  - `fetchDashboard(dateFrom, dateTo)`

#### 1.8 useInventoryStore.ts
- [ ] Состояние:
  - `products: Product[]`
  - `selectedProduct: Product | null`
  - `isLoading: boolean`
  - `filters: InventoryFilters`
- [ ] Действия:
  - `fetchProducts(filters)`
  - `createProduct(data)`
  - `updateProduct(id, data)`
  - `deleteProduct(id)`
  - `createStockMovement(data)`
  - `exportProducts(options)`

#### 1.9 useNotificationsStore.ts
- [ ] Состояние:
  - `notifications: Notification[]`
  - `unreadCount: number`
  - `isLoading: boolean`
- [ ] Действия:
  - `fetchNotifications()`
  - `markAsRead(id)`
  - `markAllAsRead()`
  - `deleteNotification(id)`
  - `addNotification(notification)` - для WebSocket

#### 1.10 useSettingsStore.ts
- [ ] Состояние:
  - `salon: SalonSettings | null`
  - `profile: UserProfile | null`
  - `roles: RolePermissions[]`
  - `isLoading: boolean`
- [ ] Действия:
  - `fetchSalonSettings()`
  - `updateSalonSettings(data)`
  - `fetchProfile()`
  - `updateProfile(data)`
  - `fetchRoles()`
  - `updateRole(role, permissions)`

---

### 2. API Интеграция

#### 2.1 Создать API клиент
```
src/
└── lib/
    └── api/
        ├── client.ts          # Axios instance
        ├── auth.ts            # Auth endpoints
        ├── appointments.ts    # Appointments endpoints
        ├── clients.ts         # Clients endpoints
        ├── staff.ts           # Staff endpoints
        ├── services.ts        # Services endpoints
        ├── finances.ts        # Finances endpoints
        ├── inventory.ts       # Inventory endpoints
        ├── overview.ts        # Overview endpoints
        ├── settings.ts        # Settings endpoints
        ├── notifications.ts   # Notifications endpoints
        └── reports.ts         # Reports endpoints
```

#### 2.2 client.ts - Базовый клиент
- [ ] Создать Axios instance с baseURL
- [ ] Добавить interceptor для токена
- [ ] Добавить interceptor для обновления токена
- [ ] Добавить interceptor для обработки ошибок
- [ ] Типизация ответов
- [ ] Обработка 401 (redirect на login)
- [ ] Обработка 403 (показать ошибку)
- [ ] Обработка 500 (показать toast)

#### 2.3 auth.ts
- [ ] `login(email, password)` → `POST /auth/login`
- [ ] `register(data)` → `POST /auth/register`
- [ ] `refreshToken(token)` → `POST /auth/refresh`
- [ ] `logout()` → `POST /auth/logout`
- [ ] `forgotPassword(email)` → `POST /auth/forgot-password`
- [ ] `resetPassword(token, password)` → `POST /auth/reset-password`

#### 2.4 appointments.ts
- [ ] `getAppointments(params)` → `GET /appointments`
- [ ] `getAppointmentById(id)` → `GET /appointments/:id`
- [ ] `createAppointment(data)` → `POST /appointments`
- [ ] `updateAppointment(id, data)` → `PUT /appointments/:id`
- [ ] `deleteAppointment(id)` → `DELETE /appointments/:id`
- [ ] `updateStatus(id, status)` → `PATCH /appointments/:id/status`

#### 2.5 clients.ts
- [ ] `getClients(params)` → `GET /clients`
- [ ] `getClientById(id)` → `GET /clients/:id`
- [ ] `createClient(data)` → `POST /clients`
- [ ] `updateClient(id, data)` → `PUT /clients/:id`
- [ ] `deleteClient(id)` → `DELETE /clients/:id`
- [ ] `getClientHistory(id, params)` → `GET /clients/:id/history`
- [ ] `importClients(file)` → `POST /clients/import`
- [ ] `exportClients(params)` → `GET /clients/export`

#### 2.6 staff.ts
- [ ] `getStaff(params)` → `GET /staff`
- [ ] `getStaffById(id)` → `GET /staff/:id`
- [ ] `createStaff(data)` → `POST /staff`
- [ ] `updateStaff(id, data)` → `PUT /staff/:id`
- [ ] `deleteStaff(id)` → `DELETE /staff/:id`
- [ ] `getSchedule(id, params)` → `GET /staff/:id/schedule`
- [ ] `updateSchedule(id, data)` → `POST /staff/:id/schedule`

#### 2.7 services.ts
- [ ] `getServices(params)` → `GET /services`
- [ ] `getServiceById(id)` → `GET /services/:id`
- [ ] `createService(data)` → `POST /services`
- [ ] `updateService(id, data)` → `PUT /services/:id`
- [ ] `deleteService(id)` → `DELETE /services/:id`

#### 2.8 finances.ts
- [ ] `getOperations(params)` → `GET /finances/operations`
- [ ] `createOperation(data)` → `POST /finances/operations`
- [ ] `getDocuments(params)` → `GET /finances/documents`
- [ ] `createDocument(data)` → `POST /finances/documents`
- [ ] `getReceipts(params)` → `GET /finances/receipts`
- [ ] `createReceipt(data)` → `POST /finances/receipts`
- [ ] `getPaymentMethods()` → `GET /finances/payment-methods`
- [ ] `createPaymentMethod(data)` → `POST /finances/payment-methods`
- [ ] `getCashRegisters()` → `GET /finances/cash-registers`
- [ ] `getDashboard(params)` → `GET /finances/dashboard`

#### 2.9 inventory.ts
- [ ] `getProducts(params)` → `GET /inventory/products`
- [ ] `createProduct(data)` → `POST /inventory/products`
- [ ] `updateProduct(id, data)` → `PUT /inventory/products/:id`
- [ ] `deleteProduct(id)` → `DELETE /inventory/products/:id`
- [ ] `createStockMovement(data)` → `POST /inventory/stock-movement`
- [ ] `exportProducts(params)` → `GET /inventory/export`

#### 2.10 overview.ts
- [ ] `getRecords(params)` → `GET /overview/records`
- [ ] `getReviews(params)` → `GET /overview/reviews`
- [ ] `getChanges(params)` → `GET /overview/changes`

#### 2.11 settings.ts
- [ ] `getSalonSettings()` → `GET /settings/salon`
- [ ] `updateSalonSettings(data)` → `PUT /settings/salon`
- [ ] `getProfile()` → `GET /settings/profile`
- [ ] `updateProfile(data)` → `PUT /settings/profile`
- [ ] `getRoles()` → `GET /settings/roles`
- [ ] `updateRole(role, data)` → `PUT /settings/roles/:role`

#### 2.12 notifications.ts
- [ ] `getNotifications(params)` → `GET /notifications`
- [ ] `markAsRead(id)` → `PATCH /notifications/:id/read`
- [ ] `markAllAsRead()` → `PATCH /notifications/read-all`
- [ ] `deleteNotification(id)` → `DELETE /notifications/:id`

#### 2.13 reports.ts
- [ ] `getRevenueReport(params)` → `GET /reports/revenue`
- [ ] `getStaffPerformance(params)` → `GET /reports/staff-performance`
- [ ] `getServicesPopularity(params)` → `GET /reports/services-popularity`
- [ ] `exportReport(params)` → `GET /reports/export`

---

### 3. Авторизация и защита роутов


#### 3.2 Страница регистрации (не требуется, сотрудников создает админ)
- [ ] (Пропущено по требованиям, страница регистрации не будет реализовываться)


#### 3.4 Middleware для защиты роутов
- [ ] Создать `middleware.ts` в корне
- [ ] Проверка токена
- [ ] Redirect на /login если не авторизован
- [ ] Проверка прав доступа по ролям
- [ ] Публичные роуты (login, register, forgot-password)

#### 3.5 Хук useAuth
- [ ] Создать `src/shared/hooks/useAuth.ts`
- [ ] Получение данных пользователя
- [ ] Проверка авторизации
- [ ] Проверка прав доступа
- [ ] Logout функция

#### 3.6 Авторизация через Telegram бот
- [ ] Интеграция с Telegram ботом (редирект/Deep Link)
- [ ] Обработка успешной авторизации и ошибок
- [ ] Отображение статуса привязки Telegram в профиле пользователя


## 🟡 Средний приоритет (Важно для полноценной работы)

### 7. Недостающие хуки

#### 7.1 usePagination.ts
- [ ] Создать `src/shared/hooks/usePagination.ts`
- [ ] Управление текущей страницей
- [ ] Управление количеством элементов
- [ ] Расчет offset
- [ ] Расчет общего количества страниц

#### 7.2 useFilter.ts
- [ ] Создать `src/shared/hooks/useFilter.ts`
- [ ] Управление фильтрами
- [ ] Сброс фильтров
- [ ] Применение фильтров
- [ ] Сохранение в URL

#### 7.3 useSort.ts
- [ ] Создать `src/shared/hooks/useSort.ts`
- [ ] Управление сортировкой
- [ ] Направление сортировки
- [ ] Множественная сортировка

#### 7.4 useApi.ts
- [ ] Создать `src/shared/hooks/useApi.ts`
- [ ] Generic хук для API запросов
- [ ] Loading состояние
- [ ] Error состояние
- [ ] Retry логика

#### 7.5 usePermissions.ts
- [ ] Создать `src/shared/hooks/usePermissions.ts`
- [ ] Проверка прав на действие
- [ ] Проверка прав на модуль
- [ ] HOC для компонентов

---

### 8. WebSocket интеграция

#### 8.1 WebSocket клиент
- [ ] Создать `src/lib/websocket/client.ts`
- [ ] Подключение к серверу
- [ ] Аутентификация через токен
- [ ] Переподключение при разрыве
- [ ] Обработка событий

#### 8.2 WebSocket Provider
- [ ] Создать `src/shared/providers/WebSocketProvider.tsx`
- [ ] Context для WebSocket
- [ ] Добавить в root layout

#### 8.3 Хук useWebSocket
- [ ] Создать `src/shared/hooks/useWebSocket.ts`
- [ ] Подписка на события
- [ ] Отправка событий
- [ ] Отписка при unmount

#### 8.4 Обработка событий
- [ ] `notification:new` - добавить в store
- [ ] `appointment:created` - обновить календарь
- [ ] `appointment:updated` - обновить календарь
- [ ] `appointment:deleted` - обновить календарь

---

### 9. Экспорт в PDF

#### 9.1 Утилита для PDF
- [ ] Создать `src/lib/utils/pdf.ts`
- [ ] Использовать библиотеку (jsPDF или react-pdf)
- [ ] Генерация PDF из данных

#### 9.2 Экспорт чеков
- [ ] Шаблон чека
- [ ] Генерация PDF
- [ ] Скачивание файла

#### 9.3 Экспорт отчетов
- [ ] Шаблоны отчетов
- [ ] Графики в PDF
- [ ] Таблицы в PDF

---

---

### 11. Обработка ошибок

#### 11.1 Error Boundary
- [ ] Отправка ошибок в Sentry (опционально)

---

### 12. Loading состояния


## 🟢 Низкий приоритет (Можно добавить позже)

### 13. Программа лояльности (новый модуль)

#### 13.1 Структура
```
src/features/loyalty/
├── types.ts
├── constants.ts
├── data/
│   └── mockLoyalty.ts
├── components/
│   ├── LoyaltyLayout.tsx
│   ├── LoyaltyHeader.tsx
│   ├── BonusesView.tsx
│   ├── DiscountsView.tsx
│   └── CertificatesView.tsx
└── modals/
    ├── CreateBonusModal.tsx
    ├── CreateDiscountModal.tsx
    └── CreateCertificateModal.tsx
```

#### 13.2 Типы (types.ts)
- [ ] `BonusProgram`
- [ ] `Discount`
- [ ] `Certificate`
- [ ] `LoyaltyFilters`

#### 13.3 Компоненты
- [ ] `LoyaltyLayout.tsx` - главный layout с табами
- [ ] `BonusesView.tsx` - управление бонусами
- [ ] `DiscountsView.tsx` - управление скидками
- [ ] `CertificatesView.tsx` - управление сертификатами

#### 13.4 Модальные окна
- [ ] `CreateBonusModal.tsx`
- [ ] `CreateDiscountModal.tsx`
- [ ] `CreateCertificateModal.tsx`

#### 13.5 Страница
- [ ] Создать `/app/loyalty/page.tsx`
- [ ] Добавить в Sidebar

---

### 14. Интеграции (новый модуль)

#### 14.1 Структура
```
src/features/integrations/
├── types.ts
├── components/
│   ├── IntegrationsLayout.tsx
│   ├── TelegramIntegration.tsx
│   ├── PhoneIntegration.tsx
│   ├── CalendarIntegration.tsx
│   ├── PaymentIntegration.tsx
│   └── SMSIntegration.tsx
└── modals/
    ├── TelegramSetupModal.tsx
    ├── PhoneSetupModal.tsx
    └── CalendarSetupModal.tsx
```

#### 14.2 Компоненты
- [ ] `IntegrationsLayout.tsx` - список интеграций
- [ ] `TelegramIntegration.tsx` - настройка Telegram
- [ ] `PhoneIntegration.tsx` - настройка телефонии
- [ ] `CalendarIntegration.tsx` - синхронизация календарей
- [ ] `PaymentIntegration.tsx` - платежные системы
- [ ] `SMSIntegration.tsx` - SMS рассылки

#### 14.3 Страница
- [ ] Создать `/app/integrations/page.tsx`
- [ ] Добавить в Sidebar

---

### 15. Отчеты и аналитика

Страница отчетов перенесена в Настройки (доступно только админу)



### 16. Онлайн бронирование (виджет)

#### 16.1 Публичная страница
- [ ] Создать `/app/booking/page.tsx`
- [ ] Выбор услуги
- [ ] Выбор мастера
- [ ] Выбор даты и времени
- [ ] Форма клиента
- [ ] Подтверждение

#### 16.2 Виджет
- [ ] Создать отдельный build для виджета
- [ ] Встраивание через iframe
- [ ] Настройка внешнего вида
- [ ] Генератор кода виджета

---

### 17. Мобильная адаптация

#### 17.1 Улучшить адаптивность
- [ ] Проверить все страницы на мобильных
- [ ] Оптимизировать таблицы для мобильных
- [ ] Мобильное меню
- [ ] Свайпы для календаря

#### 17.2 PWA
- [ ] Настроить Service Worker
- [ ] Manifest.json
- [ ] Оффлайн режим
- [ ] Push уведомления

---

### 18. Производительность

#### 18.1 Оптимизация
- [ ] Code splitting
- [ ] Lazy loading компонентов
- [ ] Мемоизация (useMemo, useCallback)
- [ ] Виртуализация списков (react-window)
- [ ] Оптимизация изображений

#### 18.2 Мониторинг
- [ ] Google Analytics
- [ ] Отслеживание ошибок (Sentry)
- [ ] Performance metrics

---

### 19. Тестирование

#### 19.1 Unit тесты
- [ ] Тесты для компонентов (Jest + React Testing Library)
- [ ] Тесты для хуков
- [ ] Тесты для утилит
- [ ] Покрытие минимум 70%

#### 19.2 E2E тесты
- [ ] Playwright или Cypress
- [ ] Тесты основных сценариев:
  - Логин
  - Создание записи
  - Создание клиента
  - Оплата

---

### 20. Документация

#### 20.1 Storybook
- [ ] Настроить Storybook
- [ ] Stories для всех UI компонентов
- [ ] Документация компонентов

#### 20.2 README
- [ ] Обновить README.md
- [ ] Инструкции по установке
- [ ] Инструкции по разработке
- [ ] Архитектура проекта

---

### 21. Дополнительные фичи

#### 21.2 Мультиязычность (i18n)
- [ ] Настроить next-i18next
- [ ] Перевести все тексты
- [ ] Переключатель языка
- [ ] Поддержка украинского и русского

#### 21.3 Горячие клавиши
- [ ] Создать хук useHotkeys
- [ ] Ctrl+K - поиск
- [ ] Ctrl+N - новая запись
- [ ] Esc - закрыть модалку

#### 21.4 Поиск
- [ ] Глобальный поиск (Cmd+K)
- [ ] Поиск по всем модулям
- [ ] Быстрый переход

---

## 📊 Приоритизация по времени

### Неделя 1-2: Критические задачи
1. ✅ State Management (Zustand stores)
2. ✅ API интеграция (базовая структура)
3. ✅ Авторизация (login, logout, middleware)
4. ✅ Toast уведомления

### Неделя 3-4: Важные компоненты
5. ✅ Недостающие UI компоненты (Skeleton, Pagination, etc.)
6. ✅ Недостающие модальные окна (Финансы)
7. ✅ Недостающие хуки (usePagination, useFilter, etc.)
8. ✅ WebSocket интеграция

### Неделя 5-6: Улучшения
9. ✅ Экспорт в PDF
10. ✅ Обработка ошибок
11. ✅ Loading состояния
12. ✅ Улучшение существующих компонентов

### Неделя 7-8: Дополнительные модули
13. ✅ Программа лояльности
14. ✅ Интеграции
15. ✅ Отчеты и аналитика

### Неделя 9+: Полировка
16. ✅ Онлайн бронирование
17. ✅ Мобильная адаптация
18. ✅ Производительность
19. ✅ Тестирование
20. ✅ Документация
21. ✅ Дополнительные фичи

---

## 📝 Чеклист перед продакшеном

### Обязательно
- [ ] Все критические задачи выполнены
- [ ] API интеграция работает
- [ ] Авторизация настроена
- [ ] Обработка ошибок везде
- [ ] Loading состояния везде
- [ ] Мобильная адаптация
- [ ] Базовые тесты написаны
- [ ] README обновлен

### Желательно
- [ ] Все средние задачи выполнены
- [ ] WebSocket работает
- [ ] PDF экспорт работает
- [ ] Программа лояльности
- [ ] Отчеты
- [ ] E2E тесты

### Опционально
- [ ] Темная тема
- [ ] Мультиязычность
- [ ] PWA
- [ ] Storybook
- [ ] Онлайн бронирование

---

**Общее количество задач**: ~150+  
**Оценка времени**: 2-3 месяца для одного разработчика  
**Текущий прогресс**: ~40% (базовые модули готовы)
