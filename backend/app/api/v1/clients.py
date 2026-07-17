from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from app.api.deps import get_db, get_current_user
from app.models.all_models import Client, User
from app.schemas.crm import ClientCreate, ClientUpdate, ClientResponse

router = APIRouter()

@router.get("/", response_model=List[ClientResponse])
async def get_clients(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(Client).offset(skip).limit(limit))
    return result.scalars().all()

@router.get("/{client_id}", response_model=ClientResponse)
async def get_client(client_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(Client).filter(Client.id == client_id))
    client = result.scalars().first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client

@router.post("/", response_model=ClientResponse, status_code=status.HTTP_201_CREATED)
async def create_client(client_in: ClientCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(Client).filter(Client.phone == client_in.phone))
    if result.scalars().first():
         raise HTTPException(status_code=400, detail="Client with this phone already exists")
    db_client = Client(**client_in.model_dump())
    db.add(db_client)
    await db.commit()
    await db.refresh(db_client)
    return db_client

@router.put("/{client_id}", response_model=ClientResponse)
async def update_client(client_id: int, client_in: ClientUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(Client).filter(Client.id == client_id))
    db_client = result.scalars().first()
    if not db_client:
        raise HTTPException(status_code=404, detail="Client not found")

    update_data = client_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_client, field, value)

    await db.commit()
    await db.refresh(db_client)
    return db_client
