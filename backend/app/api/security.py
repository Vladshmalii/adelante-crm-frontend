"""Аутентификация трёх API-плоскостей.

Admin API — JWT (access/refresh) с клеймом salon_ids; доступ к салону
разрешён, только если X-Salon-Id входит в salon_ids токена.
Bot API — статический service-ключ X-API-Key (два одновременно валидных
ключа для ротации); бот — транспорт, не источник авторизации.
Booking API — публичный, аутентификации нет.
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


def create_token(
    settings: Settings,
    *,
    user_id: uuid.UUID,
    role: Role,
    salon_ids: list[uuid.UUID],
    token_type: TokenType,
) -> str:
    ttl = settings.jwt_access_ttl if token_type == TokenType.ACCESS else settings.jwt_refresh_ttl
    now = int(time.time())
    payload = {
        "sub": str(user_id),
        "role": role.value,
        "salon_ids": [str(s) for s in salon_ids],
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
    )


async def require_salon_access(
    salon_id: SalonId,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
) -> AuthenticatedUser:
    if salon_id not in user.salon_ids:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Нет доступа к этому салону")
    return user


CurrentUser = Annotated[AuthenticatedUser, Depends(require_salon_access)]


async def verify_bot_api_key(
    settings: Annotated[Settings, Depends(get_settings)],
    x_api_key: Annotated[str | None, Header(alias="X-API-Key")] = None,
) -> None:
    if not x_api_key or not any(
        secrets.compare_digest(x_api_key, key) for key in settings.bot_api_keys
    ):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Невалидный service-ключ")
