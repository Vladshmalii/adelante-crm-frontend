from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import auth_router, appointments_router, clients_router, staff_router, services_router, finances_router
from app.core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(appointments_router, prefix=f"{settings.API_V1_STR}/appointments", tags=["appointments"])
app.include_router(clients_router, prefix=f"{settings.API_V1_STR}/clients", tags=["clients"])
app.include_router(staff_router, prefix=f"{settings.API_V1_STR}/staff", tags=["staff"])
app.include_router(services_router, prefix=f"{settings.API_V1_STR}/services", tags=["services"])
app.include_router(finances_router, prefix=f"{settings.API_V1_STR}/finances", tags=["finances"])

@app.get("/")
async def root():
    return {"message": "Adelante CRM API", "version": settings.VERSION}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
