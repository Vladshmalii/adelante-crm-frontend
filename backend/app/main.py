import asyncio
import contextlib
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.api.admin.router import router as admin_router
from app.api.booking.router import router as booking_router
from app.api.bot.router import router as bot_router
from app.config import get_settings
from app.tenancy.registry import EngineRegistry


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()

    master_engine = create_async_engine(settings.master_db_dsn, pool_pre_ping=True)
    master_sessionmaker = async_sessionmaker(master_engine, expire_on_commit=False)
    redis = Redis.from_url(settings.redis_url, decode_responses=True)
    registry = EngineRegistry(settings, redis, master_sessionmaker)

    app.state.settings = settings
    app.state.master_sessionmaker = master_sessionmaker
    app.state.redis = redis
    app.state.engine_registry = registry

    listener = asyncio.create_task(registry.run_invalidation_listener())
    try:
        yield
    finally:
        listener.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await listener
        await registry.dispose_all()
        await master_engine.dispose()
        await redis.aclose()


app = FastAPI(title="Adelante CRM API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

app.include_router(admin_router)
app.include_router(bot_router)
app.include_router(booking_router)

# Загрузки (фото визитов, аватары) — локальное хранилище
_upload_dir = Path(get_settings().upload_dir)
_upload_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=_upload_dir), name="uploads")


# Формат ошибок, который ожидает фронтенд: { message, code?, details? }
@app.exception_handler(HTTPException)
async def http_exception_handler(_request: Request, exc: HTTPException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"message": str(exc.detail)},
        headers=exc.headers,
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    _request: Request, exc: RequestValidationError
) -> JSONResponse:
    details: dict[str, list[str]] = {}
    for error in exc.errors():
        field = ".".join(str(part) for part in error["loc"][1:]) or "body"
        details.setdefault(field, []).append(error["msg"])
    return JSONResponse(
        status_code=422,
        content={"message": "Ошибка валидации", "code": "validation_error", "details": details},
    )


@app.get("/health", tags=["service"])
async def health() -> dict[str, str]:
    return {"status": "ok"}
