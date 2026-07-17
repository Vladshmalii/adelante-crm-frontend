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

    model_config = {"from_attributes": True}

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse

class TelegramAuthInit(BaseModel):
    auth_code: str
    bot_username: str
    deep_link: str
    qr_code: str
    expires_in: int

class TelegramAuthStatus(BaseModel):
    status: str
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    user: Optional[UserResponse] = None

class TelegramLinkResponse(BaseModel):
    link_code: str
    bot_username: str
    deep_link: str
    expires_in: int
