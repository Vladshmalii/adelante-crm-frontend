from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List

from app.api.deps import get_db, get_current_user
from app.models.all_models import Staff, User
from app.schemas.crm import StaffCreate, StaffUpdate, StaffResponse

router = APIRouter()

@router.get("/", response_model=List[StaffResponse])
async def get_staff(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Staff)
        .options(selectinload(Staff.user), selectinload(Staff.services))
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()

@router.get("/{staff_id}", response_model=StaffResponse)
async def get_staff_member(staff_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Staff)
        .options(selectinload(Staff.user), selectinload(Staff.services))
        .filter(Staff.id == staff_id)
    )
    staff = result.scalars().first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")
    return staff

@router.post("/", response_model=StaffResponse, status_code=status.HTTP_201_CREATED)
async def create_staff(staff_in: StaffCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_staff = Staff(**staff_in.model_dump())
    db.add(db_staff)
    await db.commit()

    result = await db.execute(
        select(Staff)
        .options(selectinload(Staff.user), selectinload(Staff.services))
        .filter(Staff.id == db_staff.id)
    )
    return result.scalars().first()
