# Backend TODO - Python + FastAPI + Telegram

## 🐍 Технологічний стек

- **Python**: 3.11+
- **FastAPI**: Веб-фреймворк
- **SQLAlchemy**: ORM
- **Alembic**: Міграції БД
- **PostgreSQL**: База даних
- **Redis**: Кешування та черги
- **aiogram**: Telegram Bot (3.x)
- **JWT**: Аутентифікація
- **Celery**: Фонові задачі
- **Локальне файлове сховище**: Без AWS S3

---

## 🔴 Критичний пріоритет (Без цього система не працює)

### 1. Інфраструктура та налаштування

#### 1.1 Базова налаштування проекту
- [ ] Створити Python проект (Python 3.11+)
- [ ] Налаштувати віртуальне середовище (venv або poetry)
- [ ] Встановити залежності:
  ```bash
  pip install fastapi uvicorn[standard]
  pip install sqlalchemy alembic psycopg2-binary
  pip install redis aioredis
  pip install python-jose[cryptography] passlib[bcrypt]
  pip install aiogram==3.3.0  # Telegram Bot
  pip install pydantic pydantic-settings email-validator
  pip install python-multipart aiofiles  # Для файлів
  pip install openpyxl pandas
  pip install reportlab weasyprint
  pip install aiosmtplib jinja2
  pip install celery flower
  pip install python-socketio
  pip install python-dotenv
  pip install qrcode[pil]
  pip install pillow  # Для обробки зображень
  pip install pytest pytest-asyncio httpx
  ```

#### 1.2 Структура проекту
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app
│   ├── config.py               # Налаштування
│   ├── database.py             # Database connection
│   ├── dependencies.py         # Залежності (auth, db session)
│   │
│   ├── models/                 # SQLAlchemy моделі
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── client.py
│   │   ├── staff.py
│   │   ├── appointment.py
│   │   ├── service.py
│   │   ├── finance.py
│   │   ├── inventory.py
│   │   └── ...
│   │
│   ├── schemas/                # Pydantic схеми
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── client.py
│   │   ├── staff.py
│   │   ├── appointment.py
│   │   └── ...
│   │
│   ├── api/                    # API роути
│   │   ├── __init__.py
│   │   ├── deps.py
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── auth.py
│   │       ├── appointments.py
│   │       ├── clients.py
│   │       ├── staff.py
│   │       ├── services.py
│   │       ├── finances.py
│   │       ├── inventory.py
│   │       ├── overview.py
│   │       ├── settings.py
│   │       └── notifications.py
│   │
│   ├── services/               # Бізнес-логіка
│   │   ├── __init__.py
│   │   ├── auth_service.py
│   │   ├── telegram_service.py
│   │   ├── appointment_service.py
│   │   ├── client_service.py
│   │   ├── email_service.py
│   │   ├── sms_service.py
│   │   ├── file_service.py
│   │   └── ...
│   │
│   ├── core/                   # Ядро
│   │   ├── __init__.py
│   │   ├── security.py         # JWT, хешування
│   │   ├── config.py
│   │   └── exceptions.py
│   │
│   ├── utils/                  # Утиліти
│   │   ├── __init__.py
│   │   ├── validators.py
│   │   ├── formatters.py
│   │   └── helpers.py
│   │
│   ├── telegram/               # Telegram бот
│   │   ├── __init__.py
│   │   ├── bot.py
│   │   ├── handlers.py
│   │   └── keyboards.py
│   │
│   └── tasks/                  # Celery задачі
│       ├── __init__.py
│       ├── email_tasks.py
│       ├── sms_tasks.py
│       └── report_tasks.py
│
├── alembic/                    # Міграції
│   ├── versions/
│   └── env.py
│
├── tests/
├── .env
├── requirements.txt
├── pyproject.toml
├── alembic.ini
├── Dockerfile
└── docker-compose.yml
```

#### 1.3 База даних
- [ ] Створити PostgreSQL базу даних
- [ ] Налаштувати SQLAlchemy
- [ ] Створити схему бази даних (див. BACKEND_PYTHON_SPEC.md)
- [ ] Ініціалізувати Alembic
- [ ] Створити міграції
- [ ] Створити seed дані для розробки

#### 1.4 Конфігурація
- [ ] Створити `.env` файл:
  ```
  DATABASE_URL=postgresql://user:password@localhost/adelante_crm
  REDIS_URL=redis://localhost:6379
  
  SECRET_KEY=your-secret-key-here
  ALGORITHM=HS256
  ACCESS_TOKEN_EXPIRE_MINUTES=30
  REFRESH_TOKEN_EXPIRE_DAYS=30
  
  TELEGRAM_BOT_TOKEN=your-bot-token
  TELEGRAM_BOT_USERNAME=your_bot_username
  
  SMTP_HOST=smtp.gmail.com
  SMTP_PORT=587
  SMTP_USER=your-email@gmail.com
  SMTP_PASSWORD=your-password
  
  # Локальне файлове сховище
  UPLOAD_DIR=/var/www/adelante-crm/uploads
  MAX_FILE_SIZE=10485760  # 10MB
  ALLOWED_EXTENSIONS=jpg,jpeg,png,pdf,xlsx,xls
  
  ALLOWED_ORIGINS=http://localhost:3000,https://adelante-crm.com
  ```
- [ ] Створити config.py з Pydantic Settings
- [ ] Налаштувати CORS
- [ ] Налаштувати rate limiting
- [ ] Створити директорії для файлів:
  ```bash
  mkdir -p uploads/avatars
  mkdir -p uploads/documents
  mkdir -p uploads/receipts
  mkdir -p uploads/reports
  mkdir -p uploads/temp
  ```

---

### 2. Аутентифікація та авторизація

#### 2.1 Core Security (app/core/security.py)
- [ ] Функція хешування паролів (passlib + bcrypt)
- [ ] Функція перевірки паролів
- [ ] Функція створення access token (JWT)
- [ ] Функція створення refresh token (JWT)
- [ ] Функція декодування токену
- [ ] Генерація випадкових токенів

#### 2.2 User Model (app/models/user.py)
- [ ] Створити SQLAlchemy модель User:
  - id, email, hashed_password
  - telegram_id, telegram_username (для Telegram auth)
  - first_name, last_name, phone, avatar
  - role (admin, manager, master, receptionist)
  - is_active, is_verified
  - created_at, updated_at

#### 2.3 Dependencies (app/api/deps.py)
- [ ] get_db() - отримати DB session
- [ ] get_current_user() - отримати користувача з JWT
- [ ] get_current_active_user() - перевірити активність
- [ ] get_current_admin() - перевірити роль admin

#### 2.4 Auth API (app/api/v1/auth.py)
- [ ] `POST /api/v1/auth/login` - вхід через email/password
- [ ] `POST /api/v1/auth/register` - реєстрація
- [ ] `POST /api/v1/auth/refresh` - оновлення токену
- [ ] `POST /api/v1/auth/logout` - вихід
- [ ] `POST /api/v1/auth/forgot-password` - відновлення пароля
- [ ] `POST /api/v1/auth/reset-password` - скидання пароля

#### 2.5 Telegram Auth API
- [ ] `POST /api/v1/auth/telegram/init` - ініціювати вхід через Telegram
  - Згенерувати auth_code
  - Створити deep link
  - Згенерувати QR код (qrcode library)
  - Зберегти в Redis з TTL 5 хвилин
  - Повернути auth_code, deep_link, qr_code_base64
  
- [ ] `GET /api/v1/auth/telegram/status/{auth_code}` - перевірити статус
  - Отримати дані з Redis
  - Якщо status="completed" - повернути токени
  - Видалити код після успіху
  
- [ ] `POST /api/v1/auth/telegram/link` - прив'язати Telegram до акаунту
  - Згенерувати link_code
  - Створити deep link
  - Зберегти в Redis

#### 2.6 Telegram Bot (app/telegram/)
- [ ] Створити бота в @BotFather
- [ ] Налаштувати **aiogram 3.x**
- [ ] bot.py - ініціалізація бота:
  ```python
  from aiogram import Bot, Dispatcher
  from aiogram.enums import ParseMode
  
  bot = Bot(token=settings.TELEGRAM_BOT_TOKEN, parse_mode=ParseMode.HTML)
  dp = Dispatcher()
  ```

- [ ] handlers.py - обробники команд (aiogram 3.x):
  
  **Команда /start**:
  ```python
  from aiogram import Router, F
  from aiogram.filters import Command, CommandStart
  from aiogram.types import Message, CallbackQuery
  
  router = Router()
  
  @router.message(CommandStart())
  async def cmd_start(message: Message):
      # Парсинг auth_code з deep link
      args = message.text.split()
      if len(args) < 2:
          await message.answer("👋 Привіт! Це бот Adelante CRM.")
          return
      
      auth_code = args[1]
      # Перевірка коду в Redis
      # Пошук користувача по telegram_id
      # Якщо немає - запропонувати реєстрацію
      # Якщо є - запропонувати підтвердити вхід
  ```
  
  **Callback handlers** (aiogram 3.x):
  ```python
  @router.callback_query(F.data.startswith("confirm:"))
  async def process_confirm(callback: CallbackQuery):
      auth_code = callback.data.split(":")[1]
      # Оновити статус в Redis на "completed"
      await callback.message.edit_text("✅ Вхід підтверджено!")
      await callback.answer()
  
  @router.callback_query(F.data.startswith("register:"))
  async def process_register(callback: CallbackQuery):
      auth_code = callback.data.split(":")[1]
      # Створити User з telegram_id
      # Оновити статус на "completed"
      await callback.message.edit_text("✅ Акаунт створено!")
      await callback.answer()
  
  @router.callback_query(F.data.startswith("cancel:"))
  async def process_cancel(callback: CallbackQuery):
      auth_code = callback.data.split(":")[1]
      # Видалити код з Redis
      await callback.message.edit_text("❌ Скасовано.")
      await callback.answer()
  ```
  
  **Прив'язка акаунту**:
  - [ ] Обробник для link_code (параметр start з префіксом "link_")
  - [ ] Оновлення telegram_id користувача
  
  **Додаткові команди**:
  ```python
  @router.message(Command("help"))
  async def cmd_help(message: Message):
      await message.answer("📖 Довідка...")
  
  @router.message(Command("profile"))
  async def cmd_profile(message: Message):
      # Показати профіль користувача
      pass
  
  @router.message(Command("appointments"))
  async def cmd_appointments(message: Message):
      # Показати записи користувача
      pass
  
  @router.message(Command("today"))
  async def cmd_today(message: Message):
      # Показати записи на сьогодні (для співробітників)
      pass
  ```

- [ ] keyboards.py - клавіатури (aiogram 3.x):
  ```python
  from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton
  
  def get_confirm_keyboard(auth_code: str) -> InlineKeyboardMarkup:
      return InlineKeyboardMarkup(inline_keyboard=[
          [InlineKeyboardButton(
              text="✅ Підтвердити вхід",
              callback_data=f"confirm:{auth_code}"
          )],
          [InlineKeyboardButton(
              text="❌ Скасувати",
              callback_data=f"cancel:{auth_code}"
          )]
      ])
  
  def get_register_keyboard(auth_code: str) -> InlineKeyboardMarkup:
      return InlineKeyboardMarkup(inline_keyboard=[
          [InlineKeyboardButton(
              text="✅ Зареєструватись",
              callback_data=f"register:{auth_code}"
          )],
          [InlineKeyboardButton(
              text="❌ Скасувати",
              callback_data=f"cancel:{auth_code}"
          )]
      ])
  ```

- [ ] Запуск бота в окремому процесі або через webhook

---

### 3. Модуль Календаря (Appointments)

#### 3.1 Модель (app/models/appointment.py)
- [ ] Створити SQLAlchemy модель Appointment
- [ ] Relationships: staff, client, service

#### 3.2 Схеми (app/schemas/appointment.py)
- [ ] AppointmentBase, AppointmentCreate, AppointmentUpdate
- [ ] AppointmentResponse з вкладеними даними

#### 3.3 Сервіс (app/services/appointment_service.py)
- [ ] get_appointments(filters) - список з фільтрами
- [ ] get_appointment_by_id(id) - отримати запис
- [ ] create_appointment(data) - створити
- [ ] update_appointment(id, data) - оновити
- [ ] delete_appointment(id) - видалити
- [ ] update_status(id, status) - змінити статус
- [ ] check_availability(staff_id, date, time) - перевірити доступність

#### 3.4 API (app/api/v1/appointments.py)
- [ ] `GET /api/v1/appointments` - список
- [ ] `GET /api/v1/appointments/{id}` - отримати
- [ ] `POST /api/v1/appointments` - створити
- [ ] `PUT /api/v1/appointments/{id}` - оновити
- [ ] `DELETE /api/v1/appointments/{id}` - видалити
- [ ] `PATCH /api/v1/appointments/{id}/status` - змінити статус

#### 3.5 Бізнес-логіка
- [ ] Перевірка доступності часу сотрудника
- [ ] Перевірка пересічення записів
- [ ] Автоматичний розрахунок endTime
- [ ] Створення уведомлень
- [ ] Відправка SMS/Email нагадувань (Celery task)
- [ ] Історія змін

---

### 4. Модуль Клієнтів (Clients)

#### 4.1 Модель (app/models/client.py)
- [ ] Створити SQLAlchemy модель Client
- [ ] Поля: id, first_name, last_name, phone, email, etc.
- [ ] Relationships: appointments, operations

#### 4.2 Схеми (app/schemas/client.py)
- [ ] ClientBase, ClientCreate, ClientUpdate
- [ ] ClientResponse з статистикою

#### 4.3 Сервіс (app/services/client_service.py)
- [ ] get_clients(filters, pagination) - список
- [ ] get_client_by_id(id) - отримати з статистикою
- [ ] create_client(data) - створити
- [ ] update_client(id, data) - оновити
- [ ] delete_client(id) - soft delete
- [ ] get_client_history(id) - історія
- [ ] import_from_excel(file) - імпорт
- [ ] export_to_excel(filters) - експорт
- [ ] calculate_segment(client) - визначити сегмент

#### 4.4 API (app/api/v1/clients.py)
- [ ] `GET /api/v1/clients` - список
- [ ] `GET /api/v1/clients/{id}` - отримати
- [ ] `POST /api/v1/clients` - створити
- [ ] `PUT /api/v1/clients/{id}` - оновити
- [ ] `DELETE /api/v1/clients/{id}` - видалити
- [ ] `GET /api/v1/clients/{id}/history` - історія
- [ ] `POST /api/v1/clients/import` - імпорт Excel
- [ ] `GET /api/v1/clients/export` - експорт Excel

---

### 5. Модуль Співробітників (Staff)

#### 5.1 Модель (app/models/staff.py)
- [ ] Створити SQLAlchemy модель Staff
- [ ] Модель StaffSchedule для графіку
- [ ] Модель ScheduleException для виключень

#### 5.2 Схеми (app/schemas/staff.py)
- [ ] StaffBase, StaffCreate, StaffUpdate
- [ ] StaffResponse з статистикою
- [ ] ScheduleSchema

#### 5.3 Сервіс (app/services/staff_service.py)
- [ ] get_staff(filters) - список
- [ ] get_staff_by_id(id) - отримати
- [ ] create_staff(data) - створити
- [ ] update_staff(id, data) - оновити
- [ ] delete_staff(id) - деактивувати
- [ ] get_schedule(id, date_from, date_to) - графік
- [ ] update_schedule(id, schedule) - оновити графік
- [ ] check_availability(id, date, time) - доступність

#### 5.4 API (app/api/v1/staff.py)
- [ ] `GET /api/v1/staff` - список
- [ ] `GET /api/v1/staff/{id}` - отримати
- [ ] `POST /api/v1/staff` - створити
- [ ] `PUT /api/v1/staff/{id}` - оновити
- [ ] `DELETE /api/v1/staff/{id}` - видалити
- [ ] `GET /api/v1/staff/{id}/schedule` - графік
- [ ] `POST /api/v1/staff/{id}/schedule` - оновити графік

---

### 6. Модуль Послуг (Services)

#### 6.1 Модель (app/models/service.py)
- [ ] Створити SQLAlchemy модель Service

#### 6.2 Схеми (app/schemas/service.py)
- [ ] ServiceBase, ServiceCreate, ServiceUpdate
- [ ] ServiceResponse

#### 6.3 Сервіс (app/services/service_service.py)
- [ ] CRUD операції
- [ ] Статистика послуги

#### 6.4 API (app/api/v1/services.py)
- [ ] `GET /api/v1/services` - список
- [ ] `GET /api/v1/services/{id}` - отримати
- [ ] `POST /api/v1/services` - створити
- [ ] `PUT /api/v1/services/{id}` - оновити
- [ ] `DELETE /api/v1/services/{id}` - видалити

---

### 7. Модуль Фінансів (Finances)

#### 7.1 Моделі (app/models/finance.py)
- [ ] FinanceOperation
- [ ] FinanceDocument
- [ ] FinanceReceipt
- [ ] PaymentMethod
- [ ] CashRegister

#### 7.2 Схеми (app/schemas/finance.py)
- [ ] Схеми для всіх моделей

#### 7.3 Сервіс (app/services/finance_service.py)
- [ ] CRUD для операцій
- [ ] CRUD для документів
- [ ] CRUD для чеків
- [ ] CRUD для методів оплати
- [ ] CRUD для кас
- [ ] Дашборд з аналітикою
- [ ] Генерація PDF чеків

#### 7.4 API (app/api/v1/finances.py)
- [ ] Endpoints для операцій
- [ ] Endpoints для документів
- [ ] Endpoints для чеків
- [ ] Endpoints для методів оплати
- [ ] Endpoints для кас
- [ ] `GET /api/v1/finances/dashboard` - дашборд

---

### 8. Модуль Складу (Inventory)

#### 8.1 Моделі (app/models/inventory.py)
- [ ] Product
- [ ] StockMovement

#### 8.2 Схеми (app/schemas/inventory.py)
- [ ] ProductBase, ProductCreate, ProductUpdate
- [ ] StockMovementSchema

#### 8.3 Сервіс (app/services/inventory_service.py)
- [ ] CRUD для товарів
- [ ] Рух товарів
- [ ] Експорт в Excel
- [ ] Перевірка мінімального залишку

#### 8.4 API (app/api/v1/inventory.py)
- [ ] `GET /api/v1/inventory/products` - список
- [ ] `POST /api/v1/inventory/products` - створити
- [ ] `PUT /api/v1/inventory/products/{id}` - оновити
- [ ] `DELETE /api/v1/inventory/products/{id}` - видалити
- [ ] `POST /api/v1/inventory/stock-movement` - рух
- [ ] `GET /api/v1/inventory/export` - експорт

---

### 9. Модуль Огляду (Overview)

#### 9.1 Моделі (app/models/overview.py)
- [ ] Review
- [ ] Change

#### 9.2 API (app/api/v1/overview.py)
- [ ] `GET /api/v1/overview/records` - записи
- [ ] `GET /api/v1/overview/reviews` - відгуки
- [ ] `POST /api/v1/overview/reviews` - створити відгук
- [ ] `GET /api/v1/overview/changes` - історія змін

---

### 10. Модуль Налаштувань (Settings)

#### 10.1 Моделі (app/models/settings.py)
- [ ] SalonSettings

#### 10.2 API (app/api/v1/settings.py)
- [ ] `GET /api/v1/settings/salon` - налаштування салону
- [ ] `PUT /api/v1/settings/salon` - оновити
- [ ] `GET /api/v1/settings/profile` - профіль користувача
- [ ] `PUT /api/v1/settings/profile` - оновити профіль
- [ ] `GET /api/v1/settings/roles` - ролі
- [ ] `PUT /api/v1/settings/roles/{role}` - оновити права

---

### 11. Модуль Уведомлень (Notifications)

#### 11.1 Модель (app/models/notification.py)
- [ ] Notification

#### 11.2 Сервіс (app/services/notification_service.py)
- [ ] create_notification(user_id, type, message)
- [ ] get_notifications(user_id)
- [ ] mark_as_read(id)
- [ ] mark_all_as_read(user_id)

#### 11.3 API (app/api/v1/notifications.py)
- [ ] `GET /api/v1/notifications` - список
- [ ] `PATCH /api/v1/notifications/{id}/read` - прочитати
- [ ] `PATCH /api/v1/notifications/read-all` - всі прочитані
- [ ] `DELETE /api/v1/notifications/{id}` - видалити

---

## 🟡 Середній пріоритет

### 12. Email сервіс (app/services/email_service.py)

- [ ] Налаштувати aiosmtplib
- [ ] Створити Jinja2 шаблони
- [ ] send_confirmation_email()
- [ ] send_password_reset_email()
- [ ] send_appointment_confirmation()
- [ ] send_appointment_reminder()
- [ ] send_receipt_email()

### 13. SMS сервіс (app/services/sms_service.py)

- [ ] Інтеграція з SMS провайдером (Twilio, Vonage)
- [ ] send_appointment_confirmation()
- [ ] send_appointment_reminder()

### 14. Файлове сховище (app/services/file_service.py)

- [ ] Створити сервіс для роботи з локальними файлами
- [ ] upload_file(file, folder) - завантажити файл:
  ```python
  import aiofiles
  import os
  from pathlib import Path
  
  async def upload_file(file: UploadFile, folder: str) -> str:
      # Перевірити розмір
      # Перевірити розширення
      # Згенерувати унікальне ім'я
      # Зберегти в uploads/{folder}/
      # Повернути шлях до файлу
  ```
- [ ] delete_file(file_path) - видалити файл
- [ ] get_file_url(file_path) - отримати URL файлу
- [ ] Обробка зображень (resize, crop) з Pillow
- [ ] Валідація типів файлів
- [ ] Валідація розміру файлів
- [ ] Очищення старих файлів (Celery task)

### 15. WebSocket (app/services/websocket_service.py)

- [ ] Налаштувати python-socketio
- [ ] Broadcast events (appointment:created, etc.)
- [ ] Аутентифікація через JWT

### 16. Celery Tasks (app/tasks/)

- [ ] Налаштувати Celery + Redis
- [ ] email_tasks.py - відправка email
- [ ] sms_tasks.py - відправка SMS
- [ ] report_tasks.py - генерація звітів
- [ ] reminder_tasks.py - нагадування

### 17. Кешування (Redis)

- [ ] Кешування списку послуг
- [ ] Кешування списку співробітників
- [ ] Кешування налаштувань салону
- [ ] Інвалідація кешу при змінах

### 18. Логування

- [ ] Налаштувати Python logging
- [ ] Логування запитів
- [ ] Логування помилок
- [ ] Логування важливих дій
- [ ] Ротація логів

---

## 🟢 Низький пріоритет

### 19. Програма лояльності

- [ ] Моделі: BonusTransaction, Discount, Certificate
- [ ] API для бонусів
- [ ] API для знижок
- [ ] API для сертифікатів
- [ ] Автоматичне нарахування бонусів

### 20. Інтеграції

- [ ] Telegram Bot розширений функціонал
- [ ] Google Calendar синхронізація
- [ ] IP-телефонія
- [ ] Платіжні системи (Stripe, PayPal)

### 21. Онлайн бронювання

- [ ] Публічний API
- [ ] Віджет для сайту

### 22. Розширена аналітика

- [ ] Когортний аналіз
- [ ] RFM аналіз
- [ ] Прогнозування виручки
- [ ] ABC аналіз послуг

### 23. Тестування

- [ ] Unit тести (pytest)
- [ ] Integration тести
- [ ] E2E тести
- [ ] Покриття мінімум 70%

### 24. DevOps

- [ ] Dockerfile
- [ ] docker-compose.yml
- [ ] CI/CD (GitHub Actions)
- [ ] Деплой на сервер
- [ ] Backup БД
- [ ] Моніторинг (Sentry)

---

## 📊 Оцінка часу

- **Критичний пріоритет**: 8-10 тижнів
- **Середній пріоритет**: 4-6 тижнів
- **Низький пріоритет**: 4-6 тижнів

**Загалом**: 16-22 тижні (4-5.5 місяців) для одного розробника

---

**Версія**: 1.0.0  
**Дата**: 03.12.2025  
**Stack**: Python 3.11+ | FastAPI | PostgreSQL | Redis | Telegram Bot
