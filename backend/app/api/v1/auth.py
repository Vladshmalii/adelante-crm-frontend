from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import secrets
import json
import base64
from io import BytesIO
from datetime import datetime
import qrcode
from redis.asyncio import Redis

from app.api.deps import get_db, get_current_user
from app.models.all_models import User
from app.schemas.user import LoginRequest, TokenResponse, TelegramAuthInit, TelegramAuthStatus, TelegramLinkResponse
from app.core.security import verify_password, create_access_token, create_refresh_token
from app.core.config import settings

router = APIRouter()
redis = Redis.from_url(settings.REDIS_URL, decode_responses=True)

@router.post("/login", response_model=TokenResponse)
async def login(credentials: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).filter(User.email == credentials.email))
    user = result.scalars().first()

    if not user or not user.hashed_password:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="User is inactive")

    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)

    await redis.setex(
        f"refresh_token:{user.id}",
        settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        refresh_token
    )

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/telegram/init", response_model=TelegramAuthInit)
async def init_telegram_auth():
    auth_code = secrets.token_urlsafe(32)

    await redis.setex(
        f"telegram_auth:{auth_code}",
        300,
        json.dumps({"status": "pending", "created_at": datetime.utcnow().isoformat()})
    )

    bot_username = settings.TELEGRAM_BOT_USERNAME
    deep_link = f"https://t.me/{bot_username}?start={auth_code}"

    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(deep_link)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")

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

@router.get("/telegram/status/{auth_code}", response_model=TelegramAuthStatus)
async def check_telegram_auth_status(auth_code: str, db: AsyncSession = Depends(get_db)):
    data = await redis.get(f"telegram_auth:{auth_code}")

    if not data:
        return {"status": "expired"}

    auth_data = json.loads(data)

    if auth_data["status"] == "completed":
        user_id = auth_data["user_id"]
        result = await db.execute(select(User).filter(User.id == user_id))
        user = result.scalars().first()

        if not user:
             return {"status": "expired"}

        access_token = create_access_token(user.id)
        refresh_token = create_refresh_token(user.id)

        await redis.delete(f"telegram_auth:{auth_code}")

        return {
            "status": "completed",
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": user
        }

    return {"status": auth_data["status"]}

@router.post("/telegram/link", response_model=TelegramLinkResponse)
async def init_telegram_link(current_user: User = Depends(get_current_user)):
    link_code = secrets.token_urlsafe(32)

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
