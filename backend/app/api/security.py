"""Аутентификация трёх API-плоскостей.

Admin API — JWT (access/refresh) с клеймом salon_ids; доступ к салону
разрешён, только если X-Salon-Id входит в salon_ids токена.
Bot API — статический service-ключ X-API-Key (два одновременно валидных
ключа для ротации); бот — транспорт, не источник авторизации.
Booking API — публичный, аутентификации нет.

Роли (решение от 23.09.2026, ACCESS.md): master — только свои записи и
клиенты; administrator — всё, кроме финансов и выгрузок; administrator с
is_superuser — ещё финансы, выгрузки, зарплаты и управление администраторами.
Права проверяются здесь, фронт только прячет недоступное.
"""

import enum
import secrets
import time
import uuid
from typing import Annotated, Any

import jwt
from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pwdlib import PasswordHash
from pydantic import BaseModel

from app.config import Settings, get_settings
from app.tenancy.deps import SalonId

password_hasher = PasswordHash.recommended()  # argon2

_bearer = HTTPBearer(auto_error=False)


class TokenType(enum.StrEnum):
    ACCESS = "access"
    REFRESH = "refresh"


class Role(enum.StrEnum):
    ADMINISTRATOR = "administrator"
    MASTER = "master"


class AuthenticatedUser(BaseModel):
    id: uuid.UUID
    role: Role
    salon_ids: list[uuid.UUID]
    is_superuser: bool = False

    @property
    def is_admin(self) -> bool:
        return self.role == Role.ADMINISTRATOR

    @property
    def is_master(self) -> bool:
        return self.role == Role.MASTER


def create_token(
    settings: Settings,
    *,
    user_id: uuid.UUID,
    role: Role,
    salon_ids: list[uuid.UUID],
    token_type: TokenType,
    is_superuser: bool = False,
) -> str:
    ttl = settings.jwt_access_ttl if token_type == TokenType.ACCESS else settings.jwt_refresh_ttl
    now = int(time.time())
    payload = {
        "sub": str(user_id),
        "role": role.value,
        "salon_ids": [str(s) for s in salon_ids],
        "su": is_superuser and role == Role.ADMINISTRATOR,
        "type": token_type.value,
        "iat": now,
        "exp": now + ttl,
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


def decode_token(settings: Settings, token: str, expected_type: TokenType) -> dict[str, Any]:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
    except jwt.InvalidTokenError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Невалидный или истёкший токен")
    if payload.get("type") != expected_type.value:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Неверный тип токена")
    return payload


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> AuthenticatedUser:
    if credentials is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Требуется Bearer-токен")
    payload = decode_token(settings, credentials.credentials, TokenType.ACCESS)
    return AuthenticatedUser(
        id=uuid.UUID(payload["sub"]),
        role=Role(payload["role"]),
        salon_ids=[uuid.UUID(s) for s in payload["salon_ids"]],
        is_superuser=bool(payload.get("su", False)),
    )


async def require_salon_access(
    salon_id: SalonId,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
) -> AuthenticatedUser:
    if salon_id not in user.salon_ids:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Нет доступа к этому салону")
    return user


CurrentUser = Annotated[AuthenticatedUser, Depends(require_salon_access)]


def forbidden(message: str = "Недостатньо прав") -> HTTPException:
    return HTTPException(status.HTTP_403_FORBIDDEN, message)


async def require_admin(user: CurrentUser) -> AuthenticatedUser:
    if not user.is_admin:
        raise forbidden()
    return user


async def require_superuser(user: CurrentUser) -> AuthenticatedUser:
    if not (user.is_admin and user.is_superuser):
        raise forbidden()
    return user


AdminUser = Annotated[AuthenticatedUser, Depends(require_admin)]
SuperUser = Annotated[AuthenticatedUser, Depends(require_superuser)]


async def verify_bot_api_key(
    settings: Annotated[Settings, Depends(get_settings)],
    x_api_key: Annotated[str | None, Header(alias="X-API-Key")] = None,
) -> None:
    if not x_api_key or not any(
        secrets.compare_digest(x_api_key, key) for key in settings.bot_api_keys
    ):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Невалидный service-ключ")
