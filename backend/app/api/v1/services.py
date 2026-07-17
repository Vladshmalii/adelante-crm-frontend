from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from app.api.deps import get_db, get_current_user
from app.models.all_models import Service, User
from app.schemas.crm import ServiceCreate, ServiceUpdate, ServiceResponse

router = APIRouter()

@router.get("/", response_model=List[ServiceResponse])
async def get_services(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Service).offset(skip).limit(limit))
    return result.scalars().all()

@router.get("/{service_id}", response_model=ServiceResponse)
async def get_service(service_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Service).filter(Service.id == service_id))
    service = result.scalars().first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    return service

@router.post("/", response_model=ServiceResponse, status_code=status.HTTP_201_CREATED)
async def create_service(service_in: ServiceCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_service = Service(**service_in.model_dump())
    db.add(db_service)
    await db.commit()
    await db.refresh(db_service)
    return db_service

@router.put("/{service_id}", response_model=ServiceResponse)
async def update_service(service_id: int, service_in: ServiceUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(Service).filter(Service.id == service_id))
    db_service = result.scalars().first()
    if not db_service:
        raise HTTPException(status_code=404, detail="Service not found")

    update_data = service_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_service, field, value)

    await db.commit()
    await db.refresh(db_service)
    return db_service
