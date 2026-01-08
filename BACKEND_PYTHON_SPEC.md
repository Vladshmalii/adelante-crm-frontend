# Backend API Specification - Python FastAPI

## ⚠️ Статус

**Backend НЕ РЕАЛІЗОВАНО** (0% готовності)

Ця специфікація описує технічну реалізацію backend на Python + FastAPI.
Frontend вже готовий на ~85% і очікує API endpoints.

---

## 🐍 Технологічний стек

### Core
- **Python**: 3.11+
- **FastAPI**: Веб-фреймворк
- **Uvicorn**: ASGI сервер
- **SQLAlchemy**: ORM
- **Alembic**: Міграції БД
- **PostgreSQL**: База даних
- **Redis**: Кешування та черги

### Аутентифікація
- **JWT**: JSON Web Tokens
- **python-jose**: JWT обробка
- **passlib**: Хешування паролів
- **aiogram**: Telegram Bot API (3.x)

### Додаткові бібліотеки
- **Pydantic**: Валідація даних
- **python-multipart**: Завантаження файлів
- **aiofiles**: Async робота з файлами
- **Pillow**: Обробка зображень
- **openpyxl**: Робота з Excel
- **reportlab** / **weasyprint**: Генерація PDF
- **aiosmtplib**: Async Email
- **aiohttp**: HTTP клієнт
- **celery**: Фонові задачі
- **python-socketio**: WebSocket
- **qrcode**: Генерація QR кодів

**Файлове сховище**: Локальне (без AWS S3)

---

## 🏗️ Структура проекту

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
│   │   ├── deps.py             # Залежності для роутів
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
│   │   ├── config.py           # Налаштування
│   │   └── exceptions.py       # Кастомні помилки
│   │
│   ├── utils/                  # Утиліти
│   │   ├── __init__.py
│   │   ├── validators.py
│   │   ├── formatters.py
│   │   └── helpers.py
│   │
│   ├── telegram/               # Telegram бот
│   │   ├── __init__.py
│   │   ├── bot.py              # Ініціалізація бота
│   │   ├── handlers.py         # Обробники команд
│   │   └── keyboards.py        # Клавіатури
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
├── tests/                      # Тести
│   ├── __init__.py
│   ├── conftest.py
│   ├── test_auth.py
│   ├── test_appointments.py
│   └── ...
│
├── .env                        # Змінні оточення
├── .env.example
├── requirements.txt            # Залежності
├── pyproject.toml              # Poetry config
├── alembic.ini                 # Alembic config
├── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## 🔐 Аутентифікація

### 1. JWT Аутентифікація

#### POST /api/v1/auth/login
**Опис**: Вхід через email/password

**Request Body**:
```python
class LoginRequest(BaseModel):
    email: EmailStr
    password: str
```

**Response**:
```python
class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse
```

**Логіка**:
```python
async def login(credentials: LoginRequest, db: Session):
    # 1. Знайти користувача по email
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # 2. Перевірити пароль
    if not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # 3. Перевірити активність
    if not user.is_active:
        raise HTTPException(status_code=403, detail="User is inactive")
    
    # 4. Створити токени
    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)
    
    # 5. Зберегти refresh token в Redis
    await redis.setex(
        f"refresh_token:{user.id}",
        REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        refresh_token
    )
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": UserResponse.from_orm(user)
    }
```

---

### 2. Telegram Аутентифікація

#### POST /api/v1/auth/telegram/init
**Опис**: Ініціювати вхід через Telegram

**Response**:
```python
class TelegramAuthInit(BaseModel):
    auth_code: str          # Унікальний код для входу
    bot_username: str       # Username бота
    deep_link: str          # Посилання для відкриття бота
    qr_code: str           # Base64 QR код
    expires_in: int        # Час дії коду (секунди)
```

**Логіка**:
```python
async def init_telegram_auth():
    # 1. Згенерувати унікальний код
    auth_code = secrets.token_urlsafe(32)
    
    # 2. Зберегти в Redis з TTL 5 хвилин
    await redis.setex(
        f"telegram_auth:{auth_code}",
        300,  # 5 хвилин
        json.dumps({"status": "pending", "created_at": datetime.utcnow().isoformat()})
    )
    
    # 3. Створити deep link
    bot_username = settings.TELEGRAM_BOT_USERNAME
    deep_link = f"https://t.me/{bot_username}?start={auth_code}"
    
    # 4. Згенерувати QR код
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(deep_link)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Конвертувати в base64
    buffered = BytesIO()
    img.save(buffered, format="PNG")
    qr_code_base64 = base64.b64encode(buffered.getvalue()).decode()
    
    return {
        "auth_code": auth_code,
        "bot_username": bot_username,
        "deep_link": deep_link,
        "qr_code": f"data:image/png;base64,{qr_code_base64}",
        "expires_in": 300
    }
```

---

#### GET /api/v1/auth/telegram/status/{auth_code}
**Опис**: Перевірити статус авторизації через Telegram

**Response**:
```python
class TelegramAuthStatus(BaseModel):
    status: str  # "pending" | "confirmed" | "expired" | "completed"
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    user: Optional[UserResponse] = None
```

**Логіка**:
```python
async def check_telegram_auth_status(auth_code: str):
    # 1. Отримати статус з Redis
    data = await redis.get(f"telegram_auth:{auth_code}")
    
    if not data:
        return {"status": "expired"}
    
    auth_data = json.loads(data)
    
    # 2. Якщо статус "completed" - повернути токени
    if auth_data["status"] == "completed":
        user_id = auth_data["user_id"]
        user = db.query(User).filter(User.id == user_id).first()
        
        access_token = create_access_token(user.id)
        refresh_token = create_refresh_token(user.id)
        
        # Видалити код з Redis
        await redis.delete(f"telegram_auth:{auth_code}")
        
        return {
            "status": "completed",
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": UserResponse.from_orm(user)
        }
    
    return {"status": auth_data["status"]}
```

---

#### Telegram Bot Handler

**Обробник команди /start (aiogram 3.x)**:
```python
from aiogram import Bot, Dispatcher, Router, F
from aiogram.filters import Command, CommandStart
from aiogram.types import Message, CallbackQuery, InlineKeyboardMarkup, InlineKeyboardButton
from aiogram.enums import ParseMode

# Ініціалізація
bot = Bot(token=settings.TELEGRAM_BOT_TOKEN, parse_mode=ParseMode.HTML)
dp = Dispatcher()
router = Router()

@router.message(CommandStart())
async def cmd_start(message: Message):
    # Отримати auth_code з deep link
    args = message.text.split()
    if len(args) < 2:
        await message.answer("Привіт! Це бот для авторизації в Adelante CRM.")
        return
    
    auth_code = args[1]
    
    # Перевірити код в Redis
    data = await redis.get(f"telegram_auth:{auth_code}")
    if not data:
        await message.answer("❌ Код авторизації недійсний або застарів.")
        return
    
    auth_data = json.loads(data)
    
    if auth_data["status"] != "pending":
        await message.answer("❌ Цей код вже використано.")
        return
    
    # Отримати Telegram user
    telegram_user = message.from_user
    
    # Знайти користувача в БД по telegram_id
    user = db.query(User).filter(User.telegram_id == telegram_user.id).first()
    
    if not user:
        # Якщо користувача немає - запропонувати реєстрацію
        keyboard = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(
                text="✅ Підтвердити реєстрацію",
                callback_data=f"register:{auth_code}"
            )],
            [InlineKeyboardButton(
                text="❌ Скасувати",
                callback_data=f"cancel:{auth_code}"
            )]
        ])
        
        await message.answer(
            f"👋 Привіт, {telegram_user.first_name}!\n\n"
            f"Ви ще не зареєстровані в системі.\n"
            f"Бажаєте створити обліковий запис?",
            reply_markup=keyboard
        )
        
        # Оновити статус в Redis
        auth_data["status"] = "awaiting_confirmation"
        auth_data["telegram_id"] = telegram_user.id
        auth_data["telegram_username"] = telegram_user.username
        auth_data["telegram_first_name"] = telegram_user.first_name
        auth_data["telegram_last_name"] = telegram_user.last_name
        await redis.setex(
            f"telegram_auth:{auth_code}",
            300,
            json.dumps(auth_data)
        )
        return
    
    # Якщо користувач є - підтвердити вхід
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(
            text="✅ Підтвердити вхід",
            callback_data=f"confirm:{auth_code}"
        )],
        [InlineKeyboardButton(
            text="❌ Скасувати",
            callback_data=f"cancel:{auth_code}"
        )]
    ])
    
    await message.answer(
        f"👋 Привіт, {user.first_name}!\n\n"
        f"Підтвердіть вхід в систему Adelante CRM.",
        reply_markup=keyboard
    )
    
    # Оновити статус
    auth_data["status"] = "confirmed"
    auth_data["user_id"] = user.id
    await redis.setex(
        f"telegram_auth:{auth_code}",
        300,
        json.dumps(auth_data)
    )

@router.callback_query(F.data.startswith("confirm:"))
async def process_confirm(callback: CallbackQuery):
    auth_code = callback.data.split(":")[1]
    
    # Отримати дані
    data = await redis.get(f"telegram_auth:{auth_code}")
    if not data:
        await callback.answer("❌ Код застарів", show_alert=True)
        return
    
    auth_data = json.loads(data)
    
    # Оновити статус на "completed"
    auth_data["status"] = "completed"
    await redis.setex(
        f"telegram_auth:{auth_code}",
        60,  # 1 хвилина на отримання токенів
        json.dumps(auth_data)
    )
    
    await callback.message.edit_text("✅ Вхід підтверджено! Поверніться до браузера.")
    await callback.answer()

@router.callback_query(F.data.startswith("register:"))
async def process_register(callback: CallbackQuery):
    auth_code = callback.data.split(":")[1]
    
    data = await redis.get(f"telegram_auth:{auth_code}")
    if not data:
        await callback.answer("❌ Код застарів", show_alert=True)
        return
    
    auth_data = json.loads(data)
    
    # Створити нового користувача
    new_user = User(
        telegram_id=auth_data["telegram_id"],
        telegram_username=auth_data.get("telegram_username"),
        first_name=auth_data["telegram_first_name"],
        last_name=auth_data.get("telegram_last_name", ""),
        email=f"telegram_{auth_data['telegram_id']}@adelante-crm.local",
        role="receptionist",  # За замовчуванням
        is_active=True
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Оновити статус
    auth_data["status"] = "completed"
    auth_data["user_id"] = new_user.id
    await redis.setex(
        f"telegram_auth:{auth_code}",
        60,
        json.dumps(auth_data)
    )
    
    await callback.message.edit_text(
        "✅ Обліковий запис створено!\n"
        "Поверніться до браузера для завершення входу."
    )
    await callback.answer()

@router.callback_query(F.data.startswith("cancel:"))
async def process_cancel(callback: CallbackQuery):
    auth_code = callback.data.split(":")[1]
    await redis.delete(f"telegram_auth:{auth_code}")
    await callback.message.edit_text("❌ Авторизацію скасовано.")
    await callback.answer()

# Реєстрація router
dp.include_router(router)

# Запуск бота
async def main():
    await dp.start_polling(bot)

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
```

---

### 3. Прив'язка Telegram до існуючого акаунту

#### POST /api/v1/auth/telegram/link
**Опис**: Прив'язати Telegram до існуючого акаунту

**Headers**: `Authorization: Bearer {token}`

**Response**:
```python
class TelegramLinkResponse(BaseModel):
    link_code: str
    bot_username: str
    deep_link: str
    expires_in: int
```

**Логіка**:
```python
async def init_telegram_link(current_user: User):
    # Згенерувати код для прив'язки
    link_code = secrets.token_urlsafe(32)
    
    # Зберегти в Redis
    await redis.setex(
        f"telegram_link:{link_code}",
        300,
        json.dumps({
            "user_id": current_user.id,
            "status": "pending"
        })
    )
    
    bot_username = settings.TELEGRAM_BOT_USERNAME
    deep_link = f"https://t.me/{bot_username}?start=link_{link_code}"
    
    return {
        "link_code": link_code,
        "bot_username": bot_username,
        "deep_link": deep_link,
        "expires_in": 300
    }
```

**Telegram Bot Handler для прив'язки**:
```python
@dp.message(Command("start"))
async def cmd_start(message: types.Message):
    args = message.text.split()
    if len(args) < 2:
        return
    
    param = args[1]
    
    # Перевірити чи це код прив'язки
    if param.startswith("link_"):
        link_code = param[5:]  # Видалити "link_"
        
        data = await redis.get(f"telegram_link:{link_code}")
        if not data:
            await message.answer("❌ Код прив'язки недійсний.")
            return
        
        link_data = json.loads(data)
        user_id = link_data["user_id"]
        telegram_user = message.from_user
        
        # Перевірити чи не прив'язаний вже цей Telegram
        existing = db.query(User).filter(User.telegram_id == telegram_user.id).first()
        if existing:
            await message.answer("❌ Цей Telegram акаунт вже прив'язано до іншого користувача.")
            return
        
        # Прив'язати
        user = db.query(User).filter(User.id == user_id).first()
        user.telegram_id = telegram_user.id
        user.telegram_username = telegram_user.username
        db.commit()
        
        # Видалити код
        await redis.delete(f"telegram_link:{link_code}")
        
        await message.answer(
            f"✅ Telegram успішно прив'язано до акаунту {user.first_name} {user.last_name}!"
        )
```

---

## 📦 SQLAlchemy Моделі

### User Model
```python
from sqlalchemy import Column, Integer, String, Boolean, DateTime, BigInteger
from sqlalchemy.sql import func
from app.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=True)  # Nullable для Telegram users
    
    # Telegram
    telegram_id = Column(BigInteger, unique=True, nullable=True, index=True)
    telegram_username = Column(String, nullable=True)
    
    # Profile
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    avatar = Column(String, nullable=True)
    
    # Role and status
    role = Column(String, nullable=False)  # admin, manager, master, receptionist
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    # appointments = relationship("Appointment", back_populates="staff")
    # ...
```

---

## 🔧 Core Security

### security.py
```python
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Перевірити пароль"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Хешувати пароль"""
    return pwd_context.hash(password)

def create_access_token(user_id: int, expires_delta: Optional[timedelta] = None) -> str:
    """Створити access token"""
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "sub": str(user_id),
        "exp": expire,
        "type": "access"
    }
    
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def create_refresh_token(user_id: int) -> str:
    """Створити refresh token"""
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    to_encode = {
        "sub": str(user_id),
        "exp": expire,
        "type": "refresh"
    }
    
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_token(token: str) -> dict:
    """Декодувати токен"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None
```

---

## 🎯 Dependencies

### deps.py
```python
from typing import Generator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.core.security import decode_token
from app.models.user import User

security = HTTPBearer()

def get_db() -> Generator:
    """Отримати DB session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Отримати поточного користувача з токену"""
    token = credentials.credentials
    
    payload = decode_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )
    
    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type"
        )
    
    user_id: int = int(payload.get("sub"))
    user = db.query(User).filter(User.id == user_id).first()
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is inactive"
        )
    
    return user

async def get_current_active_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """Перевірити що користувач - адмін"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user
```

---

## 📝 Pydantic Schemas

### user.py
```python
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    phone: Optional[str] = None
    role: str

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    avatar: Optional[str] = None

class UserResponse(UserBase):
    id: int
    telegram_id: Optional[int] = None
    telegram_username: Optional[str] = None
    avatar: Optional[str] = None
    is_active: bool
    is_verified: bool
    created_at: datetime
    
    class Config:
        from_attributes = True
```

---

## 🚀 Main Application

### main.py
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import auth, appointments, clients, staff, services, finances
from app.core.config import settings

app = FastAPI(
    title="Adelante CRM API",
    description="API для системи управління салоном краси",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(appointments.router, prefix="/api/v1/appointments", tags=["appointments"])
app.include_router(clients.router, prefix="/api/v1/clients", tags=["clients"])
app.include_router(staff.router, prefix="/api/v1/staff", tags=["staff"])
app.include_router(services.router, prefix="/api/v1/services", tags=["services"])
app.include_router(finances.router, prefix="/api/v1/finances", tags=["finances"])

@app.get("/")
async def root():
    return {"message": "Adelante CRM API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
```

---

## 📦 Requirements

### requirements.txt
```txt
# FastAPI
fastapi==0.109.0
uvicorn[standard]==0.27.0
python-multipart==0.0.6

# Database
sqlalchemy==2.0.25
alembic==1.13.1
psycopg2-binary==2.9.9
asyncpg==0.29.0

# Redis
redis==5.0.1
aioredis==2.0.1

# Auth
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4

# Telegram Bot
aiogram==3.3.0

# Validation
pydantic==2.5.3
pydantic-settings==2.1.0
email-validator==2.1.0

# Files
aiofiles==23.2.1
pillow==10.2.0

# Excel
openpyxl==3.1.2
pandas==2.1.4

# PDF
reportlab==4.0.8
weasyprint==60.2

# Email
aiosmtplib==3.0.1
jinja2==3.1.3

# Tasks
celery==5.3.4
flower==2.0.1

# WebSocket
python-socketio==5.11.0

# Utils
python-dotenv==1.0.0
qrcode[pil]==7.4.2

# Testing
pytest==7.4.4
pytest-asyncio==0.23.3
httpx==0.26.0
```

---

**Версія**: 1.0.0  
**Дата**: 03.12.2025  
**Дата оновлення**: 03.12.2025  
**Статус**: Не розпочато (0%)  
**Stack**: Python 3.11+ | FastAPI | PostgreSQL | Redis | Telegram Bot
