from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from app.api.deps import get_db, get_current_user
from app.models.all_models import Finance, User
from app.schemas.crm import FinanceCreate, FinanceResponse

router = APIRouter()

@router.get("/", response_model=List[FinanceResponse])
async def get_finances(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(Finance).offset(skip).limit(limit))
    return result.scalars().all()

@router.post("/", response_model=FinanceResponse, status_code=status.HTTP_201_CREATED)
async def create_finance(finance_in: FinanceCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_finance = Finance(**finance_in.model_dump())
    db.add(db_finance)
    await db.commit()
    await db.refresh(db_finance)
    return db_finance
