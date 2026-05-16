# 🚀 Adelante CRM - API Specification & Backend Guide

Цей документ описує вимоги до Backend API, виходячи з поточної реалізації Frontend.

---

## 🔑 1. Аутентифікація (JWT)

Фронтенд очікує стандартну схему Bearer токенів.

### Endpoints:
- `POST /auth/login`: Приймає `{ email, password }`. Повертає `{ user, accessToken, refreshToken }`.
- `POST /auth/refresh`: Оновлення токена.
- `GET /auth/me`: Повертає профіль поточного користувача.

---

## 📊 2. Моделі Даних (Схема БД)

### **Record (Запис у календарі)**
```typescript
{
  id: string;           // UUID
  clientId: string;     // FK to Client
  serviceId: string;    // FK to Service
  employeeId: string;   // FK to Staff
  visitTime: string;    // ISO Date
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  amount: number;
  paymentStatus: 'paid' | 'unpaid' | 'partial';
  paymentMethod?: 'cash' | 'card';
  actualStartTime?: string;
  actualEndTime?: string;
  closedBy?: string;    // User name
  internalNotes?: string;
  photos: string[];     // URLs to S3/Storage
  history: Array<{      // Audit trail
    date: string;
    action: string;
    author: string;
    details: string;
  }>;
}
```

### **Client (Клієнт)**
```typescript
{
  id: string;
  name: string;
  phone: string;
  email?: string;
  totalVisits: number;
  lastVisit?: string;
  loyaltyPoints: number;
  tags: string[];
}
```

---

## 📡 3. Основні API Ендпоінти

### **Records (Записи)**
- `GET /records`: Фільтрація за датою, статусом, майстром.
- `POST /records`: Створення нового запису.
- `PATCH /records/:id`: Оновлення (включаючи зміну статусу на 'completed' та фіксацію часу).
- `POST /records/:id/photos`: Завантаження зображень (Multipart/form-data).

### **Overview & Audit (Аналітика)**
- `GET /overview/stats`: Загальна статистика для карток (К-сть записів, виручка).
- `GET /overview/reviews`: Список відгуків.
- `GET /overview/changes`: Глобальний лог змін системи (History).

---

## 🛡 4. Формат Відповідей

Фронтенд очікує дані у форматі JSON:

**Успіх:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Помилка (400, 401, 500):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Поле обов'язкове для заповнення"
  }
}
```

---

## 📁 5. Робота з файлами
Всі фотографії, що завантажуються через модалку аудиту, мають зберігатися на бекенді (або в S3) та повертати прямий URL, який фронтенд запише в масив `photos`.

---
*Це ТЗ є базою для побудови бекенду на Node.js (Express/Fastify) або Python (FastAPI).*
