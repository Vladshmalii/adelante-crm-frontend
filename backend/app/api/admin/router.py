"""Admin API — агрегатор доменных роутеров. Base URL: /api/admin/v1."""

from fastapi import APIRouter

from app.api.admin.audit import router as audit_router
from app.api.admin.auth import router as auth_router
from app.api.admin.clients import router as clients_router
from app.api.admin.finances import router as finances_router
from app.api.admin.records import router as records_router
from app.api.admin.reviews import router as reviews_router
from app.api.admin.services import router as services_router
from app.api.admin.staff import router as staff_router

router = APIRouter(prefix="/api/admin/v1")

router.include_router(auth_router)
router.include_router(records_router)
router.include_router(staff_router)
router.include_router(clients_router)
router.include_router(services_router)
router.include_router(reviews_router)
router.include_router(audit_router)
router.include_router(finances_router)
