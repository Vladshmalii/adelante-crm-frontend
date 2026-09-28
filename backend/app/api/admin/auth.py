"""Аутентификация админ-панели: login, refresh, восстановление пароля, /me."""

import contextlib
import logging
import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from pydantic import EmailStr, Field
from redis.exceptions import RedisError
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import security
from app.api.schemas import ApiModel, Envelope
from app.api.security import Role
from app.config import Settings, get_settings
from app.models.base import Gender
from app.models.master import Administrator, Master
from app.models.shard import StaffProfile, StaffStatus
from app.tenancy.deps import SALON_HEADER, MasterSession, get_registry
from app.tenancy.registry import EngineRegistry, SalonNotFound, SalonSuspended
from app.timeutils import SALON_TZ_NAME

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])

RESET_TOKEN_TTL = 3600

Account = Administrator | Master


class UserOut(ApiModel):
    id: uuid.UUID
    name: str
    role: Role
    is_superuser: bool
    salon_ids: list[uuid.UUID]


class TokenPairOut(ApiModel):
    access_token: str
    refresh_token: str
    user: UserOut


class LoginIn(ApiModel):
    email: EmailStr
    password: str


async def _find_account(master_session, email: str) -> tuple[Account, Role] | None:
    admin = await master_session.scalar(
        select(Administrator).where(
            func.lower(Administrator.email) == email.lower(), Administrator.is_active.is_(True)
        )
    )
    if admin is not None:
        return admin, Role.ADMINISTRATOR
    master = await master_session.scalar(
        select(Master).where(func.lower(Master.email) == email.lower(), Master.is_active.is_(True))
    )
    if master is not None and master.password_hash:
        return master, Role.MASTER
    return None


def _is_superuser(person: Account) -> bool:
    return isinstance(person, Administrator) and person.is_superuser


def _issue_tokens(
    settings: Settings, person: Account, role: Role
) -> tuple[str, str, list[uuid.UUID]]:
    # Уволенный из салона (неактивная привязка) в этот салон не входит
    salon_ids = [salon.id for salon in person.active_salons]
    access, refresh = (
        security.create_token(
            settings,
            user_id=person.id,
            role=role,
            salon_ids=salon_ids,
            is_superuser=_is_superuser(person),
            token_type=token_type,
        )
        for token_type in (security.TokenType.ACCESS, security.TokenType.REFRESH)
    )
    return access, refresh, salon_ids


@router.post("/login", response_model=Envelope[TokenPairOut])
async def login(
    body: LoginIn,
    master_session: MasterSession,
    settings: Annotated[Settings, Depends(get_settings)],
) -> Envelope[TokenPairOut]:
    account = await _find_account(master_session, body.email)
    if account is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Невірний email або пароль")
    person, role = account
    if person.password_hash is None or not security.password_hasher.verify(
        body.password, person.password_hash
    ):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Невірний email або пароль")
    access, refresh_token, salon_ids = _issue_tokens(settings, person, role)
    return Envelope(
        data=TokenPairOut(
            access_token=access,
            refresh_token=refresh_token,
            user=UserOut(
                id=person.id,
                name=person.full_name,
                role=role,
                is_superuser=_is_superuser(person),
                salon_ids=salon_ids,
            ),
        )
    )


class RefreshIn(ApiModel):
    refresh_token: str


class TokensOnlyOut(ApiModel):
    access_token: str
    refresh_token: str


async def _load_account(master_session, user_id: uuid.UUID, role: Role) -> Account | None:
    model = Administrator if role == Role.ADMINISTRATOR else Master
    person = await master_session.get(model, user_id)
    if person is None or not person.is_active:
        return None
    return person


@router.post("/refresh", response_model=Envelope[TokensOnlyOut])
async def refresh(
    body: RefreshIn,
    master_session: MasterSession,
    settings: Annotated[Settings, Depends(get_settings)],
) -> Envelope[TokensOnlyOut]:
    """Новая пара токенов. Роль, салоны и is_superuser перечитываются из БД —
    увольнение и снятие прав вступают в силу не позже срока жизни access-токена.
    """
    payload = security.decode_token(settings, body.refresh_token, security.TokenType.REFRESH)
    person = await _load_account(master_session, uuid.UUID(payload["sub"]), Role(payload["role"]))
    if person is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Обліковий запис недоступний")
    access, refresh_token, _ = _issue_tokens(settings, person, Role(payload["role"]))
    return Envelope(data=TokensOnlyOut(access_token=access, refresh_token=refresh_token))


class ForgotPasswordIn(ApiModel):
    email: EmailStr


@router.post("/forgot-password", status_code=status.HTTP_204_NO_CONTENT)
async def forgot_password(
    body: ForgotPasswordIn,
    master_session: MasterSession,
    request: Request,
    settings: Annotated[Settings, Depends(get_settings)],
) -> None:
    """Выдаёт одноразовый токен сброса (TTL 1 час) и отправляет письмо со ссылкой.

    Ответ всегда 204, чтобы не раскрывать, существует ли email.
    """
    account = await _find_account(master_session, body.email)
    if account is None:
        return
    token = uuid.uuid4().hex
    try:
        await request.app.state.redis.set(
            f"pwdreset:{token}", str(account[0].id), ex=RESET_TOKEN_TTL
        )
    except RedisError:
        logger.exception("forgot-password: Redis недоступен, токен не сохранён")
        return

    link = f"{settings.frontend_url.rstrip('/')}/reset-password?token={token}"
    from workers.tasks.mail import send_password_reset

    try:
        send_password_reset.delay(str(body.email), account[0].first_name, link)
    except Exception:
        logger.exception("forgot-password: не удалось поставить письмо в очередь")


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
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Спробуйте пізніше")
    if not user_id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Токен недійсний або прострочений")

    person: Account | None = await master_session.get(Administrator, uuid.UUID(user_id))
    if person is None:
        person = await master_session.get(Master, uuid.UUID(user_id))
    if person is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Користувача не знайдено")

    person.password_hash = security.password_hasher.hash(body.password)
    with contextlib.suppress(RedisError):
        await redis.delete(f"pwdreset:{body.token}")


# --- Мій профіль ------------------------------------------------------------


class SalonOut(ApiModel):
    id: uuid.UUID
    name: str
    slug: str


class SalonProfileOut(ApiModel):
    """Условия работы в текущем салоне (заголовок X-Salon-Id). Свой оклад видит каждый."""

    salon_id: uuid.UUID
    position: str | None
    specializations: list[str]
    status: StaffStatus
    salary: Decimal | None
    commission_percent: Decimal | None
    hire_date: date | None


class MeOut(ApiModel):
    id: uuid.UUID
    first_name: str
    middle_name: str | None
    last_name: str | None
    name: str
    email: str | None
    phone: str | None
    additional_phone: str | None
    gender: Gender | None
    birth_date: date | None
    avatar_url: str | None
    address: str | None
    emergency_contact_name: str | None
    emergency_contact_phone: str | None
    telegram_linked: bool
    role: Role
    is_superuser: bool
    # Часовой пояс для всех дат и времени (фиксированный)
    timezone: str
    created_at: datetime
    salons: list[SalonOut]
    profile: SalonProfileOut | None = None


async def _salon_profile(
    registry: EngineRegistry, salon_id: uuid.UUID, staff_id: uuid.UUID
) -> SalonProfileOut | None:
    try:
        factory = await registry.get_sessionmaker(salon_id)
    except (SalonNotFound, SalonSuspended):
        return None
    tenant_session: AsyncSession
    async with factory() as tenant_session:
        profile = await tenant_session.get(StaffProfile, staff_id)
    if profile is None:
        return None
    return SalonProfileOut(
        salon_id=salon_id,
        position=profile.position,
        specializations=profile.specializations or [],
        status=profile.status,
        salary=profile.salary,
        commission_percent=profile.commission_percent,
        hire_date=profile.hire_date,
    )


async def _me_out(
    person: Account,
    user: security.AuthenticatedUser,
    registry: EngineRegistry,
    salon_id: uuid.UUID | None,
) -> MeOut:
    profile = None
    if salon_id is not None and salon_id in user.salon_ids:
        profile = await _salon_profile(registry, salon_id, person.id)
    return MeOut(
        id=person.id,
        first_name=person.first_name,
        middle_name=person.middle_name,
        last_name=person.last_name,
        name=person.full_name,
        email=person.email,
        phone=person.phone,
        additional_phone=person.additional_phone,
        gender=person.gender,
        birth_date=person.birth_date,
        avatar_url=person.avatar_url,
        address=person.address,
        emergency_contact_name=person.emergency_contact_name,
        emergency_contact_phone=person.emergency_contact_phone,
        telegram_linked=person.telegram_user_id is not None,
        role=user.role,
        is_superuser=_is_superuser(person),
        timezone=SALON_TZ_NAME,
        created_at=person.created_at,
        salons=[SalonOut.model_validate(s) for s in person.active_salons],
        profile=profile,
    )


CurrentAccountUser = Annotated[security.AuthenticatedUser, Depends(security.get_current_user)]
OptionalSalonId = Annotated[uuid.UUID | None, Header(alias=SALON_HEADER)]


@router.get("/me", response_model=Envelope[MeOut])
async def me(
    user: CurrentAccountUser,
    master_session: MasterSession,
    registry: Annotated[EngineRegistry, Depends(get_registry)],
    salon_id: OptionalSalonId = None,
) -> Envelope[MeOut]:
    person = await _load_account(master_session, user.id, user.role)
    if person is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Обліковий запис недоступний")
    return Envelope(data=await _me_out(person, user, registry, salon_id))


class MePatchIn(ApiModel):
    """Свои контакты. Имя, должность, оклад и прочее меняет администратор."""

    phone: str | None = Field(default=None, max_length=32)
    additional_phone: str | None = Field(default=None, max_length=32)
    address: str | None = Field(default=None, max_length=500)
    emergency_contact_name: str | None = Field(default=None, max_length=255)
    emergency_contact_phone: str | None = Field(default=None, max_length=32)
    avatar_url: str | None = Field(default=None, max_length=1024)


@router.patch("/me", response_model=Envelope[MeOut])
async def patch_me(
    body: MePatchIn,
    user: CurrentAccountUser,
    master_session: MasterSession,
    registry: Annotated[EngineRegistry, Depends(get_registry)],
    salon_id: OptionalSalonId = None,
) -> Envelope[MeOut]:
    person = await _load_account(master_session, user.id, user.role)
    if person is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Обліковий запис недоступний")
    for field, value in body.model_dump(exclude_unset=True, by_alias=False).items():
        setattr(person, field, value)
    return Envelope(data=await _me_out(person, user, registry, salon_id))
