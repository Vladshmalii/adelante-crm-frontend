# Frontend TODO - Что нужно реализовать

## 🔴 Критический приоритет (Необходимо для работы)

### 1. State Management (Zustand)

#### 1.1 Создать stores ✅
```
src/
└── stores/
    ├── useAuthStore.ts ✅
    ├── useCalendarStore.ts ✅
    ├── useClientsStore.ts ✅
    ├── useStaffStore.ts ✅
    ├── useServicesStore.ts ✅
    ├── useFinancesStore.ts ✅
    ├── useInventoryStore.ts ✅
    ├── useNotificationsStore.ts ✅
    ├── useSettingsStore.ts ✅
    └── useUIStore.ts ✅ (дополнительный)
```

#### 1.2 useAuthStore.ts ✅
- [x] Состояние:
  - `user: UserProfile | null`
  - `token: string | null`
  - `isAuthenticated: boolean`
  - `isLoading: boolean`
- [x] Действия:
  - `login(email, password)`
  - `register(data)`
  - `logout()`
  - `refreshToken()`
  - `updateProfile(data)`
  - `checkAuth()` - проверка при загрузке

#### 1.3 useCalendarStore.ts ✅
- [x] Состояние:
  - `appointments: Appointment[]`
  - `selectedDate: string`
  - `view: CalendarView`
  - `isLoading: boolean`
  - `filters: AppointmentFilters`
- [x] Действия:
  - `fetchAppointments(date)`
  - `createAppointment(data)`
  - `updateAppointment(id, data)`
  - `deleteAppointment(id)`
  - `updateStatus(id, status)`
  - `setView(view)`
  - `setFilters(filters)`

#### 1.4 useClientsStore.ts ✅
- [x] Состояние:
  - `clients: Client[]`
  - `selectedClient: Client | null`
  - `isLoading: boolean`
  - `filters: ClientFilters`
  - `pagination: PaginationMeta`
- [x] Действия:
  - `fetchClients(page, filters)`
  - `fetchClientById(id)`
  - `createClient(data)`
  - `updateClient(id, data)`
  - `deleteClient(id)`
  - `importClients(file)`
  - `exportClients(filters)`
  - `setFilters(filters)`

#### 1.5 useStaffStore.ts ✅
- [x] Состояние:
  - `staff: StaffMember[]`
  - `selectedStaff: StaffMember | null`
  - `isLoading: boolean`
  - `filters: StaffFilters`
- [x] Действия:
  - `fetchStaff(filters)`
  - `fetchStaffById(id)`
  - `createStaff(data)`
  - `updateStaff(id, data)`
  - `deleteStaff(id)`
  - `updateSchedule(id, schedule)`

#### 1.6 useServicesStore.ts ✅
- [x] Состояние:
  - `services: Service[]`
  - `selectedService: Service | null`
  - `isLoading: boolean`
  - `filters: ServiceFilters`
- [x] Действия:
  - `fetchServices(filters)`
  - `fetchServiceById(id)`
  - `createService(data)`
  - `updateService(id, data)`
  - `deleteService(id)`

#### 1.7 useFinancesStore.ts ✅
- [x] Состояние:
  - `operations: FinanceOperation[]`
  - `documents: FinanceDocument[]`
  - `receipts: FinanceReceipt[]`
  - `paymentMethods: PaymentMethod[]`
  - `cashRegisters: CashRegister[]`
  - `dashboard: FinanceDashboard | null`
  - `isLoading: boolean`
  - `activeTab: FinanceTab`
- [x] Действия:
  - `fetchOperations(filters)`
  - `createOperation(data)`
  - `fetchDocuments(filters)`
  - `createDocument(data)`
  - `fetchReceipts(filters)`
  - `createReceipt(data)`
  - `fetchPaymentMethods()`
  - `fetchCashRegisters()`
  - `fetchDashboard(dateFrom, dateTo)`

#### 1.8 useInventoryStore.ts ✅
- [x] Состояние:
  - `products: Product[]`
  - `selectedProduct: Product | null`
  - `isLoading: boolean`
  - `filters: InventoryFilters`
- [x] Действия:
  - `fetchProducts(filters)`
  - `createProduct(data)`
  - `updateProduct(id, data)`
  - `deleteProduct(id)`
  - `createStockMovement(data)`
  - `exportProducts(options)`

#### 1.9 useNotificationsStore.ts ✅
- [x] Состояние:
  - `notifications: Notification[]`
  - `unreadCount: number`
  - `isLoading: boolean`
- [x] Действия:
  - `fetchNotifications()`
  - `markAsRead(id)`
  - `markAllAsRead()`
  - `deleteNotification(id)`
  - `addNotification(notification)` - для WebSocket

#### 1.10 useSettingsStore.ts ✅
- [x] Состояние:
  - `salon: SalonSettings | null`
  - `profile: UserProfile | null`
  - `roles: RolePermissions[]`
  - `isLoading: boolean`
- [x] Действия:
  - `fetchSalonSettings()`
  - `updateSalonSettings(data)`
  - `fetchProfile()`
  - `updateProfile(data)`
  - `fetchRoles()`
  - `updateRole(role, permissions)`

---

### 2. API Интеграция

#### 2.1 Создать API клиент ✅
```
src/
└── lib/
    └── api/
        ├── client.ts          ✅ Axios instance
        ├── auth.ts            ✅ Auth endpoints
        ├── appointments.ts    ✅ Appointments endpoints
        ├── clients.ts         ✅ Clients endpoints
        ├── staff.ts           ✅ Staff endpoints
        ├── services.ts        ✅ Services endpoints
        ├── finances.ts        ✅ Finances endpoints
        ├── inventory.ts       ✅ Inventory endpoints
        ├── overview.ts        ✅ Overview endpoints
        ├── settings.ts        ✅ Settings endpoints
        ├── notifications.ts   ✅ Notifications endpoints
        └── reports.ts         ✅ Reports endpoints
```

#### 2.2 client.ts - Базовый клиент ✅
- [x] Создать Axios instance с baseURL
- [x] Добавить interceptor для токена
- [x] Добавить interceptor для обновления токена
- [x] Добавить interceptor для обработки ошибок
- [x] Типизация ответов
- [x] Обработка 401 (redirect на login)
- [x] Обработка 403 (показать ошибку)
- [x] Обработка 500 (показать toast)

#### 2.3 auth.ts ✅
- [x] `login(email, password)` → `POST /auth/login`
- [x] `register(data)` → `POST /auth/register`
- [x] `refreshToken(token)` → `POST /auth/refresh`
- [x] `logout()` → `POST /auth/logout`
- [x] `forgotPassword(email)` → `POST /auth/forgot-password`
- [x] `resetPassword(token, password)` → `POST /auth/reset-password`

#### 2.4 appointments.ts ✅
- [x] `getAppointments(params)` → `GET /appointments`
- [x] `getAppointmentById(id)` → `GET /appointments/:id`
- [x] `createAppointment(data)` → `POST /appointments`
- [x] `updateAppointment(id, data)` → `PUT /appointments/:id`
- [x] `deleteAppointment(id)` → `DELETE /appointments/:id`
- [x] `updateStatus(id, status)` → `PATCH /appointments/:id/status`

#### 2.5 clients.ts ✅
- [x] `getClients(params)` → `GET /clients`
- [x] `getClientById(id)` → `GET /clients/:id`
- [x] `createClient(data)` → `POST /clients`
- [x] `updateClient(id, data)` → `PUT /clients/:id`
- [x] `deleteClient(id)` → `DELETE /clients/:id`
- [x] `getClientHistory(id, params)` → `GET /clients/:id/history`
- [x] `importClients(file)` → `POST /clients/import`
- [x] `exportClients(params)` → `GET /clients/export`

#### 2.6 staff.ts ✅
- [x] `getStaff(params)` → `GET /staff`
- [x] `getStaffById(id)` → `GET /staff/:id`
- [x] `createStaff(data)` → `POST /staff`
- [x] `updateStaff(id, data)` → `PUT /staff/:id`
- [x] `deleteStaff(id)` → `DELETE /staff/:id`
- [x] `getSchedule(id, params)` → `GET /staff/:id/schedule`
- [x] `updateSchedule(id, data)` → `POST /staff/:id/schedule`

#### 2.7 services.ts ✅
- [x] `getServices(params)` → `GET /services`
- [x] `getServiceById(id)` → `GET /services/:id`
- [x] `createService(data)` → `POST /services`
- [x] `updateService(id, data)` → `PUT /services/:id`
- [x] `deleteService(id)` → `DELETE /services/:id`

#### 2.8 finances.ts ✅
- [x] `getOperations(params)` → `GET /finances/operations`
- [x] `createOperation(data)` → `POST /finances/operations`
- [x] `getDocuments(params)` → `GET /finances/documents`
- [x] `createDocument(data)` → `POST /finances/documents`
- [x] `getReceipts(params)` → `GET /finances/receipts`
- [x] `createReceipt(data)` → `POST /finances/receipts`
- [x] `getPaymentMethods()` → `GET /finances/payment-methods`
- [x] `createPaymentMethod(data)` → `POST /finances/payment-methods`
- [x] `getCashRegisters()` → `GET /finances/cash-registers`
- [x] `getDashboard(params)` → `GET /finances/dashboard`

#### 2.9 inventory.ts ✅
- [x] `getProducts(params)` → `GET /inventory/products`
- [x] `createProduct(data)` → `POST /inventory/products`
- [x] `updateProduct(id, data)` → `PUT /inventory/products/:id`
- [x] `deleteProduct(id)` → `DELETE /inventory/products/:id`
- [x] `createStockMovement(data)` → `POST /inventory/stock-movement`
- [x] `exportProducts(params)` → `GET /inventory/export`

#### 2.10 overview.ts ✅
- [x] `getRecords(params)` → `GET /overview/records`
- [x] `getReviews(params)` → `GET /overview/reviews`
- [x] `getChanges(params)` → `GET /overview/changes`

#### 2.11 settings.ts ✅
- [x] `getSalonSettings()` → `GET /settings/salon`
- [x] `updateSalonSettings(data)` → `PUT /settings/salon`
- [x] `getProfile()` → `GET /settings/profile`
- [x] `updateProfile(data)` → `PUT /settings/profile`
- [x] `getRoles()` → `GET /settings/roles`
- [x] `updateRole(role, data)` → `PUT /settings/roles/:role`

#### 2.12 notifications.ts ✅
- [x] `getNotifications(params)` → `GET /notifications`
- [x] `markAsRead(id)` → `PATCH /notifications/:id/read`
- [x] `markAllAsRead()` → `PATCH /notifications/read-all`
- [x] `deleteNotification(id)` → `DELETE /notifications/:id`

#### 2.13 reports.ts ✅
- [x] `getRevenueReport(params)` → `GET /reports/revenue`
- [x] `getStaffPerformance(params)` → `GET /reports/staff-performance`
- [x] `getServicesPopularity(params)` → `GET /reports/services-popularity`
- [x] `exportReport(params)` → `GET /reports/export`

---

### 3. Авторизация и защита роутов


#### 3.2 Страница регистрации (не требуется, сотрудников создает админ)
- [ ] (Пропущено по требованиям, страница регистрации не будет реализовываться)


#### 3.4 Middleware для защиты роутов ✅
- [x] Создать `middleware.ts` в корне
- [x] Проверка токена
- [x] Redirect на /login если не авторизован
- [x] Проверка прав доступа по ролям
- [x] Публичные роуты (login, register, forgot-password)

#### 3.5 Хук useAuth ✅
- [x] Создать `src/shared/hooks/useAuth.ts`
- [x] Получение данных пользователя
- [x] Проверка авторизации
- [x] Проверка прав доступа
- [x] Logout функция

#### 3.6 Авторизация через Telegram бот ✅
- [x] Интеграция с Telegram ботом (редирект/Deep Link)
- [x] Обработка успешной авторизации и ошибок
- [x] Отображение статуса привязки Telegram в профиле пользователя


## 🟡 Средний приоритет (Важно для полноценной работы)

### 7. Хуки

#### 7.1 usePagination.ts ✅
- [x] Создать `src/shared/hooks/usePagination.ts`
- [x] Управление текущей страницей
- [x] Управление количеством элементов
- [x] Расчет offset
- [x] Расчет общего количества страниц

#### 7.2 useFilter.ts ✅
- [x] Создать `src/shared/hooks/useFilter.ts`
- [x] Управление фильтрами
- [x] Сброс фильтров
- [x] Применение фильтров
- [x] Сохранение в URL

#### 7.3 useSort.ts ✅
- [x] Создать `src/shared/hooks/useSort.ts`
- [x] Управление сортировкой
- [x] Направление сортировки
- [x] Множественная сортировка

#### 7.4 useApi.ts ✅
- [x] Создать `src/shared/hooks/useApi.ts`
- [x] Generic хук для API запросов
- [x] Loading состояние
- [x] Error состояние
- [x] Retry логика

#### 7.5 usePermissions.ts ✅
- [x] Создать `src/shared/hooks/usePermissions.ts`
- [x] Проверка прав на действие
- [x] Проверка прав на модуль
- [x] HOC для компонентов

#### 7.6 useToast.ts ✅
- [x] Создать `src/shared/hooks/useToast.ts`
- [x] Интеграция с ToastProvider
- [x] Методы show, success, error, warning, info

#### 7.7 useWebSocket.ts ✅
- [x] Создать `src/shared/hooks/useWebSocket.ts`
- [x] Подписка на события
- [x] Отправка сообщений
- [x] Отписка при unmount

#### 7.8 useHotkeys.ts ✅
- [x] Создать `src/shared/hooks/useHotkeys.ts`
- [x] Обработка комбинаций клавиш
- [x] Поддержка модификаторов (Ctrl, Alt, Shift, Cmd)

#### 7.9 useAuth.ts ✅
- [x] Создать `src/shared/hooks/useAuth.ts`
- [x] Получение данных пользователя
- [x] Проверка авторизации
- [x] Проверка прав доступа

#### 7.10 useTheme.ts ✅
- [x] Создать `src/shared/hooks/useTheme.ts`
- [x] Переключение темы (light/dark)
- [x] Сохранение в localStorage

#### 7.11 Дополнительные хуки ✅
- [x] `useDebounce.ts` - задержка выполнения
- [x] `useLocalStorage.ts` - работа с localStorage
- [x] `useClickOutside.ts` - обработка клика вне элемента
- [x] `useCurrentTime.ts` - текущее время
- [x] `useHeaderActions.ts` - действия в заголовке
- [x] `useApi.ts` - generic хук для API запросов

---

### 8. WebSocket интеграция

#### 8.1 WebSocket клиент ✅
- [x] Создать `src/lib/websocket/client.ts`
- [x] Подключение к серверу
- [x] Аутентификация через токен
- [x] Переподключение при разрыве
- [x] Обработка событий

#### 8.2 WebSocket Provider ✅
- [x] Создать `src/shared/providers/WebSocketProvider.tsx`
- [x] Context для WebSocket
- [x] Добавить в root layout

#### 8.3 Хук useWebSocket ✅
- [x] Создать `src/shared/hooks/useWebSocket.ts`
- [x] Подписка на события
- [x] Отправка событий
- [x] Отписка при unmount

#### 8.4 Обработка событий ✅
- [x] `notification:new` - добавить в store
- [x] `appointment:created` - обновить календарь
- [x] `appointment:updated` - обновить календарь
- [x] `appointment:deleted` - обновить календарь

---

### 9. Экспорт в PDF (Перенесено на бэкенд)

#### 9.1 Утилита для PDF
- [x] (Логика на бэкенде)

#### 9.2 Экспорт чеков
- [x] (Логика на бэкенде)

#### 9.3 Экспорт отчетов
- [x] (Логика на бэкенде)

---

---

### 11. Обработка ошибок

#### 11.1 Error Boundary ✅
- [x] Глобальный `global-error.tsx`
- [x] `error.tsx` для роутов
- [x] Отправка ошибок в Sentry (опционально, логгирование в консоль)

---

### 12. Loading состояния ✅
- [x] Глобальный Loader (GlobalLoader.tsx)
- [x] Skeleton компонент (Skeleton.tsx)
- [x] Skeleton для таблиц (Clients)
- [x] Skeleton для Sidebar
- [x] Loader компонент (Loader.tsx)
- [x] NavigationProgress для навигации

### 13. Toast уведомления ✅
- [x] ToastProvider (src/shared/providers/ToastProvider.tsx)
- [x] Toast компонент (src/shared/components/ui/Toast.tsx)
- [x] Хук useToast (src/shared/hooks/useToast.ts)
- [x] Интеграция в root layout
- [x] Методы: show, success, error, warning, info

### 14. UI Компоненты ✅
- [x] Button, Modal, Input, Textarea
- [x] Dropdown, DatePicker, TimePicker
- [x] Badge, Alert, Loader, Tooltip
- [x] Tabs, EmptyState, SearchInput
- [x] Card, ChartCard, ConfirmDialog
- [x] ExcelDropdown, NotificationsDropdown, ProfileDropdown
- [x] **Toast** ✅
- [x] **Skeleton** ✅
- [x] **Pagination** ✅
- [x] **Select** ✅
- [x] **FileUpload** ✅
- [x] **Avatar** ✅
- [x] Progress, Switch, Checkbox, Radio
- [x] Breadcrumbs, RangeDatePicker
- [x] ThemeToggle


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

#### 13.2 Типы (types.ts) ✅
- [x] `BonusProgram`
- [x] `Discount`
- [x] `Certificate`
- [x] `LoyaltyFilters`

#### 13.3 Компоненты ✅
- [x] `LoyaltyLayout.tsx` - главный layout с табами
- [x] `BonusesView.tsx` - управление бонусами
- [x] `DiscountsView.tsx` - управление скидками
- [x] `CertificatesView.tsx` - управление сертификатами

#### 13.4 Модальные окна ✅
- [x] `CreateBonusModal.tsx`
- [x] `CreateDiscountModal.tsx`
- [x] `CreateCertificateModal.tsx`

#### 13.5 Страница ✅

### 16. Онлайн бронирование (виджет)

#### 16.1 Публичная страница ✅
- [x] Создать `/app/booking/page.tsx`
- [x] Выбор услуги
- [x] Выбор мастера
- [x] Выбор даты и времени
- [x] Форма клиента
- [x] Подтверждение

#### 16.2 Виджет ✅
- [x] Создать отдельный build для виджета
- [x] Встраивание через iframe
- [x] Настройка внешнего вида (частично)
- [x] Генератор кода виджета

---

### 17. Мобильная адаптация

#### 17.1 Улучшить адаптивность ✅
- [x] Проверить все страницы на мобильных (AppShell и Sidebar адаптированы)
- [x] Оптимизировать таблицы для мобильных (Columns hiding implemented)
- [x] Мобильное меню (Sidebar mobile mode)
- [x] Свайпы для календаря (Отложено)

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

#### 21.3 Горячие клавиши ✅
- [x] Создать хук useHotkeys
- [x] Ctrl+K - поиск (интегрирован глобально)
- [x] Alt+N - новая запись (интегрирован глобально)
- [x] Esc - закрыть модалку (встроено в Dialog)

#### 21.4 Поиск ✅
- [x] Глобальный поиск (Cmd+K)
- [x] Поиск по всем модулям (макет)
- [x] Быстрый переход

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
- [ ] PWA
- [ ] Storybook
- [x] Онлайн бронирование

---

**Общее количество задач**: ~150+  
**Оценка времени**: 2-3 месяца для одного разработчика  
**Текущий прогресс**: ~85% 

### ✅ Полностью готово:
- ✅ Все Zustand stores (9 stores + useUIStore)
- ✅ Все API клиенты (11 модулей)
- ✅ Все хуки (16 хуков)
- ✅ Все UI компоненты (37 компонентов)
- ✅ WebSocket интеграция (клиент, provider, хук)
- ✅ Toast система (provider, компонент, хук)
- ✅ Middleware для защиты роутов
- ✅ Error boundaries (global-error, error.tsx)
- ✅ Loading состояния (GlobalLoader, Skeleton, Loader)
- ✅ Программа лояльности
- ✅ Онлайн бронирование
- ✅ Мобильная адаптация (базовая)

### ⚠️ Частично готово:
- ⚠️ Интеграция с реальным API (используются mock данные)
- ⚠️ Telegram авторизация (UI готов, нужен backend)

### ❌ Не готово:
- ❌ PWA (Service Worker, Manifest)
- ❌ Тестирование (Unit, E2E)
- ❌ Storybook
- ❌ Оптимизация производительности (code splitting, lazy loading)
- ❌ Мониторинг (Analytics, Sentry)
