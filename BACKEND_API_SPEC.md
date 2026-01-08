# Backend API Спецификация - Adelante CRM

## ⚠️ Статус

**Backend НЕ РЕАЛІЗОВАНО** (0% готовності)

Ця специфікація описує API endpoints, які повинні бути реалізовані на backend.
Frontend вже готовий і очікує ці endpoints.

---

## Базовая информация

**Base URL**: `https://api.adelante-crm.com/v1`  
**Аутентификация**: Bearer Token (JWT)  
**Content-Type**: `application/json`

---

## 🔐 Аутентификация

### POST /auth/login
**Описание**: Вход в систему

**Request Body**:
```typescript
{
  email: string;        // Email пользователя
  password: string;     // Пароль
}
```

**Response** (200):
```typescript
{
  token: string;        // JWT токен
  refreshToken: string; // Refresh токен
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: 'admin' | 'manager' | 'master' | 'receptionist';
    avatar?: string;
  }
}
```

**Логика**:
1. Проверить email и password в базе данных
2. Сравнить хэш пароля
3. Если успешно - создать JWT токен (срок действия 24 часа)
4. Создать refresh токен (срок действия 30 дней)
5. Вернуть токены и данные пользователя

---

### POST /auth/register
**Описание**: Регистрация нового пользователя

**Request Body**:
```typescript
{
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  salonName: string;    // Название салона
}
```

**Response** (201):
```typescript
{
  token: string;
  refreshToken: string;
  user: UserProfile;
}
```

**Логика**:
1. Проверить уникальность email
2. Хэшировать пароль (bcrypt)
3. Создать пользователя с ролью 'admin'
4. Создать салон и привязать к пользователю
5. Создать JWT токены
6. Вернуть данные

---

### POST /auth/refresh
**Описание**: Обновление токена

**Request Body**:
```typescript
{
  refreshToken: string;
}
```

**Response** (200):
```typescript
{
  token: string;
  refreshToken: string;
}
```

**Логика**:
1. Проверить валидность refresh токена
2. Создать новые JWT и refresh токены
3. Инвалидировать старый refresh токен
4. Вернуть новые токены

---

### POST /auth/logout
**Описание**: Выход из системы

**Headers**: `Authorization: Bearer {token}`

**Response** (204): No Content

**Логика**:
1. Инвалидировать текущий токен
2. Удалить refresh токен из базы

---

### POST /auth/forgot-password
**Описание**: Восстановление пароля

**Request Body**:
```typescript
{
  email: string;
}
```

**Response** (200):
```typescript
{
  message: string;
}
```

**Логика**:
1. Проверить существование email
2. Создать токен восстановления (срок 1 час)
3. Отправить email с ссылкой
4. Вернуть успех

---

### POST /auth/reset-password
**Описание**: Сброс пароля

**Request Body**:
```typescript
{
  token: string;        // Токен из email
  newPassword: string;
}
```

**Response** (200):
```typescript
{
  message: string;
}
```

**Логика**:
1. Проверить валидность токена
2. Хэшировать новый пароль
3. Обновить пароль в базе
4. Инвалидировать токен восстановления

---

## 📅 Календарь (Appointments)

### GET /appointments
**Описание**: Получить список записей

**Query Parameters**:
```typescript
{
  date?: string;           // YYYY-MM-DD
  dateFrom?: string;       // YYYY-MM-DD
  dateTo?: string;         // YYYY-MM-DD
  staffId?: string;
  status?: AppointmentStatus;
  page?: number;           // default: 1
  limit?: number;          // default: 50
}
```

**Response** (200):
```typescript
{
  data: Appointment[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }
}
```

**Логика**:
1. Построить SQL запрос с фильтрами
2. Применить пагинацию
3. Получить записи с JOIN на staff, clients, services
4. Вернуть данные с метаданными пагинации

---

### GET /appointments/:id
**Описание**: Получить запись по ID

**Response** (200):
```typescript
Appointment
```

**Логика**:
1. Найти запись по ID
2. Загрузить связанные данные (staff, client, service)
3. Вернуть полные данные

---

### POST /appointments
**Описание**: Создать новую запись

**Request Body**:
```typescript
{
  staffId: string;
  clientName: string;
  clientPhone?: string;
  service: string;
  startTime: string;      // HH:mm
  endTime: string;        // HH:mm
  date: string;           // YYYY-MM-DD
  status: AppointmentStatus;
  type: AppointmentType;
  notes?: string;
  price?: number;
}
```

**Response** (201):
```typescript
Appointment
```

**Логика**:
1. Валидировать данные
2. Проверить доступность времени для сотрудника
3. Создать запись в базе
4. Создать уведомление
5. Отправить SMS/Email клиенту (если настроено)
6. Вернуть созданную запись

---

### PUT /appointments/:id
**Описание**: Обновить запись

**Request Body**: Те же поля что и при создании

**Response** (200):
```typescript
Appointment
```

**Логика**:
1. Найти запись по ID
2. Проверить права доступа
3. Если изменилось время - проверить доступность
4. Обновить данные
5. Создать запись в истории изменений
6. Отправить уведомление о изменении
7. Вернуть обновленную запись

---

### DELETE /appointments/:id
**Описание**: Удалить запись

**Response** (204): No Content

**Логика**:
1. Найти запись по ID
2. Проверить права доступа
3. Мягкое удаление (soft delete)
4. Создать запись в истории
5. Отправить уведомление об отмене

---

### PATCH /appointments/:id/status
**Описание**: Изменить статус записи

**Request Body**:
```typescript
{
  status: AppointmentStatus;
}
```

**Response** (200):
```typescript
Appointment
```

**Логика**:
1. Найти запись
2. Обновить статус
3. Создать запись в истории
4. Если статус "paid" - создать финансовую операцию
5. Вернуть обновленную запись

---

## 👥 Клиенты (Clients)

### GET /clients
**Описание**: Получить список клиентов

**Query Parameters**:
```typescript
{
  search?: string;         // Поиск по имени, телефону, email
  segment?: 'new' | 'regular' | 'lost' | 'vip' | 'all';
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'lastVisit' | 'totalSpent';
  sortOrder?: 'asc' | 'desc';
}
```

**Response** (200):
```typescript
{
  data: Client[];
  pagination: PaginationMeta;
}
```

**Логика**:
1. Построить запрос с фильтрами и поиском
2. Применить сортировку
3. Применить пагинацию
4. Вычислить сегмент для каждого клиента
5. Вернуть данные

---

### GET /clients/:id
**Описание**: Получить клиента по ID

**Response** (200):
```typescript
Client & {
  statistics: {
    totalVisits: number;
    totalSpent: number;
    averageCheck: number;
    lastVisit: string;
    favoriteService: string;
    bonusBalance: number;
  }
}
```

**Логика**:
1. Найти клиента по ID
2. Вычислить статистику из записей и операций
3. Получить баланс бонусов
4. Вернуть полные данные

---

### POST /clients
**Описание**: Создать клиента

**Request Body**:
```typescript
{
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  birthDate?: string;
  gender?: 'male' | 'female' | 'other';
  source?: string;
  notes?: string;
  discount?: number;
}
```

**Response** (201):
```typescript
Client
```

**Логика**:
1. Валидировать данные
2. Проверить уникальность телефона
3. Создать клиента
4. Создать карту лояльности (если настроено)
5. Вернуть созданного клиента

---

### PUT /clients/:id
**Описание**: Обновить клиента

**Request Body**: Те же поля что и при создании

**Response** (200):
```typescript
Client
```

**Логика**:
1. Найти клиента
2. Проверить права доступа
3. Обновить данные
4. Создать запись в истории изменений
5. Вернуть обновленного клиента

---

### DELETE /clients/:id
**Описание**: Удалить клиента

**Response** (204): No Content

**Логика**:
1. Найти клиента
2. Проверить права доступа
3. Проверить наличие активных записей
4. Мягкое удаление
5. Создать запись в истории

---

### GET /clients/:id/history
**Описание**: Получить историю клиента

**Query Parameters**:
```typescript
{
  type?: 'appointments' | 'purchases' | 'all';
  page?: number;
  limit?: number;
}
```

**Response** (200):
```typescript
{
  appointments: Appointment[];
  purchases: FinanceOperation[];
  pagination: PaginationMeta;
}
```

**Логика**:
1. Получить записи клиента
2. Получить покупки клиента
3. Объединить и отсортировать по дате
4. Применить пагинацию
5. Вернуть данные

---

### POST /clients/import
**Описание**: Импорт клиентов из Excel

**Request**: `multipart/form-data`
```typescript
{
  file: File;           // Excel файл
}
```

**Response** (200):
```typescript
{
  imported: number;
  failed: number;
  errors: Array<{
    row: number;
    error: string;
  }>;
}
```

**Логика**:
1. Парсить Excel файл
2. Валидировать каждую строку
3. Проверить дубликаты по телефону
4. Создать клиентов пакетно
5. Вернуть статистику импорта

---

### GET /clients/export
**Описание**: Экспорт клиентов в Excel

**Query Parameters**:
```typescript
{
  segment?: ClientSegment;
  fields?: string[];    // Какие поля экспортировать
}
```

**Response** (200): Excel файл

**Логика**:
1. Получить клиентов с фильтрами
2. Сформировать Excel файл
3. Вернуть файл для скачивания

---

## 👨‍💼 Сотрудники (Staff)

### GET /staff
**Описание**: Получить список сотрудников

**Query Parameters**:
```typescript
{
  role?: StaffRole;
  status?: 'active' | 'inactive' | 'all';
  search?: string;
  page?: number;
  limit?: number;
}
```

**Response** (200):
```typescript
{
  data: StaffMember[];
  pagination: PaginationMeta;
}
```

**Логика**:
1. Построить запрос с фильтрами
2. Применить пагинацию
3. Вернуть данные

---

### GET /staff/:id
**Описание**: Получить сотрудника по ID

**Response** (200):
```typescript
StaffMember & {
  statistics: {
    totalAppointments: number;
    completedAppointments: number;
    totalRevenue: number;
    averageRating: number;
    clientsServed: number;
  }
}
```

**Логика**:
1. Найти сотрудника
2. Вычислить статистику
3. Вернуть полные данные

---

### POST /staff
**Описание**: Создать сотрудника

**Request Body**:
```typescript
{
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  role: StaffRole;
  specialization?: string;
  hireDate: string;
  salary?: number;
  commission?: number;
  workSchedule?: string;
  services?: string[];      // ID услуг
}
```

**Response** (201):
```typescript
StaffMember
```

**Логика**:
1. Валидировать данные
2. Проверить уникальность email
3. Создать сотрудника
4. Создать учетную запись для входа
5. Отправить приглашение на email
6. Вернуть созданного сотрудника

---

### PUT /staff/:id
**Описание**: Обновить сотрудника

**Request Body**: Те же поля что и при создании

**Response** (200):
```typescript
StaffMember
```

**Логика**:
1. Найти сотрудника
2. Проверить права доступа
3. Обновить данные
4. Создать запись в истории
5. Вернуть обновленного сотрудника

---

### DELETE /staff/:id
**Описание**: Удалить сотрудника

**Response** (204): No Content

**Логика**:
1. Найти сотрудника
2. Проверить права доступа
3. Проверить наличие активных записей
4. Деактивировать (не удалять физически)
5. Создать запись в истории

---

### GET /staff/:id/schedule
**Описание**: Получить график работы сотрудника

**Query Parameters**:
```typescript
{
  dateFrom: string;     // YYYY-MM-DD
  dateTo: string;       // YYYY-MM-DD
}
```

**Response** (200):
```typescript
{
  schedule: Array<{
    date: string;
    dayOfWeek: string;
    workFrom: string;   // HH:mm
    workTo: string;     // HH:mm
    isWorkingDay: boolean;
    breaks?: Array<{
      from: string;
      to: string;
    }>;
  }>;
}
```

**Логика**:
1. Получить базовый график сотрудника
2. Получить исключения (отпуска, больничные)
3. Сформировать график на период
4. Вернуть данные

---

### POST /staff/:id/schedule
**Описание**: Установить график работы

**Request Body**:
```typescript
{
  workDays: {
    [key: string]: {    // 'mon', 'tue', etc.
      enabled: boolean;
      from: string;
      to: string;
      breaks?: Array<{ from: string; to: string }>;
    }
  };
  exceptions?: Array<{
    date: string;
    type: 'vacation' | 'sick' | 'dayoff';
    reason?: string;
  }>;
}
```

**Response** (200):
```typescript
{
  message: string;
}
```

**Логика**:
1. Валидировать данные
2. Сохранить график
3. Сохранить исключения
4. Вернуть успех

---

## 💼 Услуги (Services)

### GET /services
**Описание**: Получить список услуг

**Query Parameters**:
```typescript
{
  category?: ServiceCategory;
  status?: ServiceStatus;
  search?: string;
  page?: number;
  limit?: number;
}
```

**Response** (200):
```typescript
{
  data: Service[];
  pagination: PaginationMeta;
}
```

**Логика**:
1. Построить запрос с фильтрами
2. Применить пагинацию
3. Вернуть данные

---

### GET /services/:id
**Описание**: Получить услугу по ID

**Response** (200):
```typescript
Service & {
  statistics: {
    totalBookings: number;
    totalRevenue: number;
    averageRating: number;
    popularityRank: number;
  }
}
```

**Логика**:
1. Найти услугу
2. Вычислить статистику
3. Вернуть полные данные

---

### POST /services
**Описание**: Создать услугу

**Request Body**:
```typescript
{
  name: string;
  category: ServiceCategory;
  duration: number;       // минуты
  price: number;
  description?: string;
  color?: string;
  status: ServiceStatus;
}
```

**Response** (201):
```typescript
Service
```

**Логика**:
1. Валидировать данные
2. Создать услугу
3. Вернуть созданную услугу

---

### PUT /services/:id
**Описание**: Обновить услугу

**Request Body**: Те же поля что и при создании

**Response** (200):
```typescript
Service
```

**Логика**:
1. Найти услугу
2. Обновить данные
3. Создать запись в истории
4. Вернуть обновленную услугу

---

### DELETE /services/:id
**Описание**: Удалить услугу

**Response** (204): No Content

**Логика**:
1. Найти услугу
2. Проверить наличие активных записей
3. Мягкое удаление
4. Создать запись в истории

---

## 💰 Финансы (Finances)

### GET /finances/operations
**Описание**: Получить список операций

**Query Parameters**:
```typescript
{
  dateFrom?: string;
  dateTo?: string;
  type?: OperationType;
  status?: OperationStatus;
  cashRegister?: string;
  page?: number;
  limit?: number;
}
```

**Response** (200):
```typescript
{
  data: FinanceOperation[];
  pagination: PaginationMeta;
  summary: {
    totalIncome: number;
    totalExpense: number;
    balance: number;
  }
}
```

**Логика**:
1. Построить запрос с фильтрами
2. Вычислить суммарные показатели
3. Применить пагинацию
4. Вернуть данные с итогами

---

### POST /finances/operations
**Описание**: Создать операцию

**Request Body**:
```typescript
{
  date: string;
  documentNumber: string;
  cashRegister: string;
  client?: string;
  amount: number;
  paymentMethod: string;
  type: OperationType;
  status: OperationStatus;
  description?: string;
}
```

**Response** (201):
```typescript
FinanceOperation
```

**Логика**:
1. Валидировать данные
2. Создать операцию
3. Обновить баланс кассы
4. Создать запись в истории
5. Вернуть созданную операцию

---

### GET /finances/documents
**Описание**: Получить список документов

**Query Parameters**:
```typescript
{
  dateFrom?: string;
  dateTo?: string;
  type?: DocumentType;
  status?: DocumentStatus;
  page?: number;
  limit?: number;
}
```

**Response** (200):
```typescript
{
  data: FinanceDocument[];
  pagination: PaginationMeta;
}
```

**Логика**:
1. Построить запрос с фильтрами
2. Применить пагинацию
3. Вернуть данные

---

### POST /finances/documents
**Описание**: Создать документ

**Request Body**:
```typescript
{
  number: string;
  date: string;
  type: DocumentType;
  contentType: DocumentContentType;
  amount: number;
  items: Array<{
    type: 'service' | 'product';
    id: string;
    quantity: number;
    price: number;
  }>;
  counterparty: string;
  comment?: string;
  status: DocumentStatus;
}
```

**Response** (201):
```typescript
FinanceDocument
```

**Логика**:
1. Валидировать данные
2. Создать документ
3. Создать позиции документа
4. Если тип "receipt" - создать чек
5. Обновить склад (если есть товары)
6. Вернуть созданный документ

---

### GET /finances/receipts
**Описание**: Получить список чеков

**Query Parameters**:
```typescript
{
  dateFrom?: string;
  dateTo?: string;
  status?: ReceiptStatus;
  cashRegister?: string;
  page?: number;
  limit?: number;
}
```

**Response** (200):
```typescript
{
  data: FinanceReceipt[];
  pagination: PaginationMeta;
}
```

**Логика**:
1. Построить запрос с фильтрами
2. Применить пагинацию
3. Вернуть данные

---

### POST /finances/receipts
**Описание**: Создать чек

**Request Body**:
```typescript
{
  date: string;
  receiptNumber: string;
  documentNumber: string;
  cashRegister: string;
  client: string;
  amount: number;
  paymentMethod: string;
  status: ReceiptStatus;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}
```

**Response** (201):
```typescript
FinanceReceipt
```

**Логика**:
1. Валидировать данные
2. Создать чек
3. Обновить баланс кассы
4. Создать финансовую операцию
5. Отправить чек на email (если настроено)
6. Вернуть созданный чек

---

### GET /finances/payment-methods
**Описание**: Получить методы оплаты

**Response** (200):
```typescript
PaymentMethod[]
```

**Логика**:
1. Получить все активные методы оплаты
2. Отсортировать по sortOrder
3. Вернуть данные

---

### POST /finances/payment-methods
**Описание**: Создать метод оплаты

**Request Body**:
```typescript
{
  name: string;
  type: PaymentMethodType;
  cashRegister: string;
  commissionType: CommissionType;
  commissionValue: number;
  commissionPayer: CommissionPayer;
  availableOnline: boolean;
  allowPartialPayment: boolean;
  allowTips: boolean;
  sortOrder: number;
  isActive: boolean;
}
```

**Response** (201):
```typescript
PaymentMethod
```

**Логика**:
1. Валидировать данные
2. Создать метод оплаты
3. Вернуть созданный метод

---

### GET /finances/cash-registers
**Описание**: Получить список касс

**Response** (200):
```typescript
CashRegister[]
```

**Логика**:
1. Получить все кассы
2. Вычислить текущий баланс каждой
3. Вернуть данные

---

### POST /finances/cash-registers
**Описание**: Создать кассу

**Request Body**:
```typescript
{
  name: string;
  location: string;
  balance: number;
  isActive: boolean;
}
```

**Response** (201):
```typescript
CashRegister
```

**Логика**:
1. Валидировать данные
2. Создать кассу
3. Создать начальную операцию (если balance > 0)
4. Вернуть созданную кассу

---

### GET /finances/dashboard
**Описание**: Получить данные для дашборда финансов

**Query Parameters**:
```typescript
{
  dateFrom: string;
  dateTo: string;
}
```

**Response** (200):
```typescript
{
  totalRevenue: number;
  totalExpenses: number;
  profit: number;
  profitMargin: number;
  revenueByDay: Array<{ date: string; amount: number }>;
  expensesByCategory: Array<{ category: string; amount: number }>;
  paymentMethodsSplit: Array<{ method: string; amount: number; percentage: number }>;
  topServices: Array<{ service: string; revenue: number; count: number }>;
}
```

**Логика**:
1. Получить все операции за период
2. Вычислить общие показатели
3. Сгруппировать по дням
4. Сгруппировать по категориям
5. Вычислить распределение по методам оплаты
6. Получить топ услуг
7. Вернуть агрегированные данные

---

## 📦 Склад (Inventory)

### GET /inventory/products
**Описание**: Получить список товаров

**Query Parameters**:
```typescript
{
  category?: ProductCategory;
  type?: ProductType;
  stockStatus?: StockStatus;
  search?: string;
  page?: number;
  limit?: number;
}
```

**Response** (200):
```typescript
{
  data: Product[];
  pagination: PaginationMeta;
  summary: {
    totalProducts: number;
    totalValue: number;
    lowStockCount: number;
    outOfStockCount: number;
  }
}
```

**Логика**:
1. Построить запрос с фильтрами
2. Вычислить статус запасов для каждого товара
3. Вычислить суммарные показатели
4. Применить пагинацию
5. Вернуть данные

---

### POST /inventory/products
**Описание**: Создать товар

**Request Body**:
```typescript
{
  name: string;
  sku: string;
  category: ProductCategory;
  type: ProductType;
  quantity: number;
  unit: ProductUnit;
  price: number;
  costPrice: number;
  minQuantity: number;
  description?: string;
}
```

**Response** (201):
```typescript
Product
```

**Логика**:
1. Валидировать данные
2. Проверить уникальность SKU
3. Создать товар
4. Создать начальное движение товара
5. Вернуть созданный товар

---

### PUT /inventory/products/:id
**Описание**: Обновить товар

**Request Body**: Те же поля что и при создании

**Response** (200):
```typescript
Product
```

**Логика**:
1. Найти товар
2. Обновить данные
3. Создать запись в истории
4. Вернуть обновленный товар

---

### POST /inventory/stock-movement
**Описание**: Движение товара

**Request Body**:
```typescript
{
  productId: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason?: string;
  documentNumber?: string;
}
```

**Response** (201):
```typescript
{
  message: string;
  newQuantity: number;
}
```

**Логика**:
1. Валидировать данные
2. Найти товар
3. Обновить количество
4. Создать запись движения
5. Проверить минимальный остаток
6. Создать уведомление если нужно
7. Вернуть новое количество

---

### GET /inventory/export
**Описание**: Экспорт товаров в Excel

**Query Parameters**:
```typescript
{
  category?: ProductCategory;
  includeBasicInfo?: boolean;
  includeStockInfo?: boolean;
  includeFinancialInfo?: boolean;
  includeDescription?: boolean;
}
```

**Response** (200): Excel файл

**Логика**:
1. Получить товары с фильтрами
2. Сформировать Excel с выбранными полями
3. Вернуть файл

---

## 📊 Обзор (Overview)

### GET /overview/records
**Описание**: Получить записи для обзора

**Query Parameters**:
```typescript
{
  createdFrom?: string;
  createdTo?: string;
  visitFrom?: string;
  visitTo?: string;
  employee?: string;
  client?: string;
  serviceCategory?: string;
  visitStatus?: RecordStatus;
  paymentStatus?: PaymentStatus;
  source?: RecordSource;
  page?: number;
  limit?: number;
}
```

**Response** (200):
```typescript
{
  data: Record[];
  pagination: PaginationMeta;
  statistics: {
    total: number;
    completed: number;
    cancelled: number;
    noShow: number;
    totalRevenue: number;
  }
}
```

**Логика**:
1. Построить запрос с фильтрами
2. Вычислить статистику
3. Применить пагинацию
4. Вернуть данные

---

### GET /overview/reviews
**Описание**: Получить отзывы

**Query Parameters**:
```typescript
{
  dateFrom?: string;
  dateTo?: string;
  type?: ReviewType;
  rating?: ReviewRating;
  page?: number;
  limit?: number;
}
```

**Response** (200):
```typescript
{
  data: Review[];
  pagination: PaginationMeta;
  statistics: {
    averageRating: number;
    totalReviews: number;
    ratingDistribution: {
      1: number;
      2: number;
      3: number;
      4: number;
      5: number;
    }
  }
}
```

**Логика**:
1. Построить запрос с фильтрами
2. Вычислить статистику
3. Применить пагинацию
4. Вернуть данные

---

### GET /overview/changes
**Описание**: Получить историю изменений

**Query Parameters**:
```typescript
{
  dateFrom?: string;
  dateTo?: string;
  entity?: ChangeEntity;
  author?: string;
  action?: ChangeAction;
  page?: number;
  limit?: number;
}
```

**Response** (200):
```typescript
{
  data: Change[];
  pagination: PaginationMeta;
}
```

**Логика**:
1. Построить запрос с фильтрами
2. Применить пагинацию
3. Вернуть данные

---

## ⚙️ Настройки (Settings)

### GET /settings/salon
**Описание**: Получить настройки салона

**Response** (200):
```typescript
{
  name: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  workDays: {
    [key: string]: {
      enabled: boolean;
      from: string;
      to: string;
    }
  };
  timezone: string;
  currency: string;
  language: string;
}
```

**Логика**:
1. Получить настройки салона из базы
2. Вернуть данные

---

### PUT /settings/salon
**Описание**: Обновить настройки салона

**Request Body**: Те же поля что и в GET

**Response** (200):
```typescript
{
  message: string;
}
```

**Логика**:
1. Валидировать данные
2. Обновить настройки
3. Создать запись в истории
4. Вернуть успех

---

### GET /settings/profile
**Описание**: Получить профиль текущего пользователя

**Response** (200):
```typescript
UserProfile
```

**Логика**:
1. Получить ID пользователя из токена
2. Найти пользователя
3. Вернуть данные профиля

---

### PUT /settings/profile
**Описание**: Обновить профиль

**Request Body**:
```typescript
{
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  birthDate?: string;
  address?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
}
```

**Response** (200):
```typescript
UserProfile
```

**Логика**:
1. Валидировать данные
2. Обновить профиль
3. Вернуть обновленные данные

---

### GET /settings/roles
**Описание**: Получить роли и права доступа

**Response** (200):
```typescript
Array<{
  role: StaffRole;
  name: string;
  permissions: {
    [module: string]: {
      view: boolean;
      create: boolean;
      edit: boolean;
      delete: boolean;
    }
  }
}>
```

**Логика**:
1. Получить все роли
2. Получить права для каждой роли
3. Вернуть данные

---

### PUT /settings/roles/:role
**Описание**: Обновить права роли

**Request Body**:
```typescript
{
  permissions: {
    [module: string]: {
      view: boolean;
      create: boolean;
      edit: boolean;
      delete: boolean;
    }
  }
}
```

**Response** (200):
```typescript
{
  message: string;
}
```

**Логика**:
1. Проверить права доступа (только admin)
2. Обновить права роли
3. Создать запись в истории
4. Вернуть успех

---

## 📱 Уведомления (Notifications)

### GET /notifications
**Описание**: Получить уведомления пользователя

**Query Parameters**:
```typescript
{
  unreadOnly?: boolean;
  page?: number;
  limit?: number;
}
```

**Response** (200):
```typescript
{
  data: Array<{
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    link?: string;
  }>;
  pagination: PaginationMeta;
  unreadCount: number;
}
```

**Логика**:
1. Получить уведомления пользователя
2. Применить фильтры
3. Посчитать непрочитанные
4. Вернуть данные

---

### PATCH /notifications/:id/read
**Описание**: Отметить уведомление как прочитанное

**Response** (200):
```typescript
{
  message: string;
}
```

**Логика**:
1. Найти уведомление
2. Отметить как прочитанное
3. Вернуть успех

---

### PATCH /notifications/read-all
**Описание**: Отметить все как прочитанные

**Response** (200):
```typescript
{
  message: string;
}
```

**Логика**:
1. Найти все непрочитанные уведомления пользователя
2. Отметить все как прочитанные
3. Вернуть успех

---

### DELETE /notifications/:id
**Описание**: Удалить уведомление

**Response** (204): No Content

**Логика**:
1. Найти уведомление
2. Удалить
3. Вернуть успех

---

## 📈 Отчеты (Reports)

### GET /reports/revenue
**Описание**: Отчет по выручке

**Query Parameters**:
```typescript
{
  dateFrom: string;
  dateTo: string;
  groupBy: 'day' | 'week' | 'month';
  staffId?: string;
  serviceId?: string;
}
```

**Response** (200):
```typescript
{
  data: Array<{
    period: string;
    revenue: number;
    expenses: number;
    profit: number;
    appointmentsCount: number;
  }>;
  totals: {
    revenue: number;
    expenses: number;
    profit: number;
  }
}
```

**Логика**:
1. Получить операции за период
2. Сгруппировать по выбранному периоду
3. Вычислить показатели
4. Вернуть данные

---

### GET /reports/staff-performance
**Описание**: Отчет по эффективности сотрудников

**Query Parameters**:
```typescript
{
  dateFrom: string;
  dateTo: string;
}
```

**Response** (200):
```typescript
Array<{
  staffId: string;
  staffName: string;
  appointmentsCount: number;
  completedCount: number;
  cancelledCount: number;
  revenue: number;
  averageCheck: number;
  rating: number;
}>
```

**Логика**:
1. Получить данные по всем сотрудникам
2. Вычислить показатели для каждого
3. Отсортировать по выручке
4. Вернуть данные

---

### GET /reports/services-popularity
**Описание**: Отчет по популярности услуг

**Query Parameters**:
```typescript
{
  dateFrom: string;
  dateTo: string;
}
```

**Response** (200):
```typescript
Array<{
  serviceId: string;
  serviceName: string;
  bookingsCount: number;
  revenue: number;
  averagePrice: number;
  popularityRank: number;
}>
```

**Логика**:
1. Получить записи за период
2. Сгруппировать по услугам
3. Вычислить показатели
4. Отсортировать по популярности
5. Вернуть данные

---

### GET /reports/export
**Описание**: Экспорт отчета в PDF/Excel

**Query Parameters**:
```typescript
{
  type: 'revenue' | 'staff' | 'services';
  format: 'pdf' | 'excel';
  dateFrom: string;
  dateTo: string;
  // + параметры конкретного отчета
}
```

**Response** (200): PDF или Excel файл

**Логика**:
1. Получить данные отчета
2. Сформировать файл в выбранном формате
3. Вернуть файл для скачивания

---

## 🔔 WebSocket Events

### Connection
**URL**: `wss://api.adelante-crm.com/ws`  
**Auth**: Query parameter `?token={jwt_token}`

### Events от сервера:

#### `notification:new`
```typescript
{
  type: 'notification:new';
  data: Notification;
}
```

#### `appointment:created`
```typescript
{
  type: 'appointment:created';
  data: Appointment;
}
```

#### `appointment:updated`
```typescript
{
  type: 'appointment:updated';
  data: Appointment;
}
```

#### `appointment:deleted`
```typescript
{
  type: 'appointment:deleted';
  data: { id: string };
}
```

---

## 📝 Общие типы ошибок

### 400 Bad Request
```typescript
{
  error: 'Bad Request';
  message: string;
  fields?: {
    [fieldName: string]: string;
  }
}
```

### 401 Unauthorized
```typescript
{
  error: 'Unauthorized';
  message: 'Invalid or expired token';
}
```

### 403 Forbidden
```typescript
{
  error: 'Forbidden';
  message: 'Insufficient permissions';
}
```

### 404 Not Found
```typescript
{
  error: 'Not Found';
  message: string;
}
```

### 409 Conflict
```typescript
{
  error: 'Conflict';
  message: string;
}
```

### 500 Internal Server Error
```typescript
{
  error: 'Internal Server Error';
  message: 'Something went wrong';
}
```

---

## 🔒 Права доступа по ролям

| Модуль | Admin | Manager | Master | Receptionist |
|--------|-------|---------|--------|--------------|
| Календарь | CRUD | CRUD | R | CRUD |
| Клиенты | CRUD | CRUD | R | CRUD |
| Сотрудники | CRUD | R | - | R |
| Услуги | CRUD | CRUD | R | R |
| Финансы | CRUD | R | - | R |
| Склад | CRUD | CRUD | - | R |
| Настройки | CRUD | R | - | - |
| Отчеты | R | R | - | - |

**Обозначения**: C - Create, R - Read, U - Update, D - Delete

---

**Версия API**: 1.0.0  
**Последнее обновление**: 03.12.2025  
**Статус**: Не реализовано (0%)
