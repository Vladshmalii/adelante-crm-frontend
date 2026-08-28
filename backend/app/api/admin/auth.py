"""Аутентификация админ-панели: login, refresh, восстановление пароля, /me."""

import contextlib
import logging
import uuid
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import EmailStr, Field
from redis.exceptions import RedisError
from sqlalchemy import select

from app.api import security
from app.api.schemas import ApiModel, Envelope
from app.api.security import Role
from app.config import Settings, get_settings
from app.models.master import Administrator, Master
from app.tenancy.deps import MasterSession

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])

RESET_TOKEN_TTL = 3600


class UserOut(ApiModel):
    id: uuid.UUID
    name: str
    role: Role
    salon_ids: list[uuid.UUID]


class TokenPairOut(ApiModel):
    access_token: str
    refresh_token: str
    user: UserOut


class LoginIn(ApiModel):
    email: EmailStr
    password: str


async def _find_account(master_session, email: str) -> tuple[Administrator | Master, Role] | None:
    admin = await master_session.scalar(
        select(Administrator).where(Administrator.email == email, Administrator.is_active.is_(True))
    )
    if admin is not None:
        return admin, Role.ADMINISTRATOR
    master = await master_session.scalar(
        select(Master).where(Master.email == email, Master.is_active.is_(True))
    )
    if master is not None and master.password_hash:
        return master, Role.MASTER
    return None


@router.post("/login", response_model=Envelope[TokenPairOut])
async def login(
    body: LoginIn,
    master_session: MasterSession,
    settings: Annotated[Settings, Depends(get_settings)],
) -> Envelope[TokenPairOut]:
    account = await _find_account(master_session, body.email)
    if account is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Неверный email или пароль")
    person, role = account
    if person.password_hash is None or not security.password_hasher.verify(
        body.password, person.password_hash
    ):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Неверный email или пароль")
    salon_ids = [salon.id for salon in person.salons]
    return Envelope(
        data=TokenPairOut(
            access_token=security.create_token(
                settings,
                user_id=person.id,
                role=role,
                salon_ids=salon_ids,
                token_type=security.TokenType.ACCESS,
            ),
            refresh_token=security.create_token(
                settings,
                user_id=person.id,
                role=role,
                salon_ids=salon_ids,
                token_type=security.TokenType.REFRESH,
            ),
            user=UserOut(id=person.id, name=person.full_name, role=role, salon_ids=salon_ids),
        )
    )


class RefreshIn(ApiModel):
    refresh_token: str


class TokensOnlyOut(ApiModel):
    access_token: str
    refresh_token: str


@router.post("/refresh", response_model=Envelope[TokensOnlyOut])
async def refresh(
    body: RefreshIn,
    settings: Annotated[Settings, Depends(get_settings)],
) -> Envelope[TokensOnlyOut]:
    payload = security.decode_token(settings, body.refresh_token, security.TokenType.REFRESH)
    user_id = uuid.UUID(payload["sub"])
    role = Role(payload["role"])
    salon_ids = [uuid.UUID(s) for s in payload["salon_ids"]]
    return Envelope(
        data=TokensOnlyOut(
            access_token=security.create_token(
                settings,
                user_id=user_id,
                role=role,
                salon_ids=salon_ids,
                token_type=security.TokenType.ACCESS,
            ),
            refresh_token=security.create_token(
                settings,
                user_id=user_id,
                role=role,
                salon_ids=salon_ids,
                token_type=security.TokenType.REFRESH,
            ),
        )
    )


class ForgotPasswordIn(ApiModel):
    email: EmailStr


@router.post("/forgot-password", status_code=status.HTTP_204_NO_CONTENT)
async def forgot_password(
    body: ForgotPasswordIn, master_session: MasterSession, request: Request
) -> None:
    """Выдаёт одноразовый токен сброса (TTL 1 час).

    Отправка письма не подключена: токен пишется в лог — при интеграции SMTP
    заменить logger на отправку. Ответ всегда 204, чтобы не раскрывать,
    существует ли email.
    """
    account = await _find_account(master_session, body.email)
    if account is None:
        return
    token = uuid.uuid4().hex
    with contextlib.suppress(RedisError):
        await request.app.state.redis.set(
            f"pwdreset:{token}", str(account[0].id), ex=RESET_TOKEN_TTL
        )
        logger.info("Password-reset token для %s: %s", body.email, token)


class ResetPasswordIn(ApiModel):
    token: str
    password: str = Field(min_length=8)


@router.post("/reset-password", status_code=status.HTTP_204_NO_CONTENT)
async def reset_password(
    body: ResetPasswordIn, master_session: MasterSession, request: Request
) -> None:
    redis = request.app.state.redis
    try:
        user_id = await redis.get(f"pwdreset:{body.token}")
    except RedisError:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Попробуйте позже")
    if not user_id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Токен недействителен или истёк")

    person: Administrator | Master | None = await master_session.get(
        Administrator, uuid.UUID(user_id)
    )
    if person is None:
        person = await master_session.get(Master, uuid.UUID(user_id))
    if person is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Пользователь не найден")

    person.password_hash = security.password_hasher.hash(body.password)
    with contextlib.suppress(RedisError):
        await redis.delete(f"pwdreset:{body.token}")


class SalonOut(ApiModel):
    id: uuid.UUID
    name: str
    slug: str


class MeOut(ApiModel):
    id: uuid.UUID
    first_name: str
    last_name: str | None
    name: str
    email: str | None
    phone: str | None
    avatar_url: str | None
    role: Role
    created_at: datetime
    salons: list[SalonOut]


@router.get("/me", response_model=Envelope[MeOut])
async def me(
    user: Annotated[security.AuthenticatedUser, Depends(security.get_current_user)],
    master_session: MasterSession,
) -> Envelope[MeOut]:
    person: Administrator | Master | None
    if user.role == Role.ADMINISTRATOR:
        person = await master_session.get(Administrator, user.id)
    else:
        person = await master_session.get(Master, user.id)
    if person is None or not person.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Учётная запись недоступна")
    return Envelope(
        data=MeOut(
            id=person.id,
            first_name=person.first_name,
            last_name=person.last_name,
            name=person.full_name,
            email=getattr(person, "email", None),
            phone=person.phone,
            avatar_url=person.avatar_url,
            role=user.role,
            created_at=person.created_at,
            salons=[SalonOut.model_validate(s) for s in person.salons],
        )
    )
