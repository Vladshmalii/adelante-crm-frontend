from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List

from app.api.deps import get_db, get_current_user
from app.models.all_models import Appointment, User, Client, Staff, Service
from app.schemas.crm import AppointmentCreate, AppointmentUpdate, AppointmentResponse
from app.tasks.notifications import send_telegram_notification

router = APIRouter()

@router.get("/", response_model=List[AppointmentResponse])
async def get_appointments(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(
        select(Appointment)
        .options(selectinload(Appointment.client), selectinload(Appointment.staff).selectinload(Staff.user), selectinload(Appointment.service))
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()

@router.get("/{appointment_id}", response_model=AppointmentResponse)
async def get_appointment(appointment_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(
        select(Appointment)
        .options(selectinload(Appointment.client), selectinload(Appointment.staff).selectinload(Staff.user), selectinload(Appointment.service))
        .filter(Appointment.id == appointment_id)
    )
    appointment = result.scalars().first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return appointment

@router.post("/", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
async def create_appointment(appointment_in: AppointmentCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_appointment = Appointment(**appointment_in.model_dump())
    db.add(db_appointment)
    await db.commit()
    await db.refresh(db_appointment)

    result = await db.execute(
        select(Appointment)
        .options(selectinload(Appointment.client), selectinload(Appointment.staff).selectinload(Staff.user), selectinload(Appointment.service))
        .filter(Appointment.id == db_appointment.id)
    )

    appointment = result.scalars().first()

    if appointment.staff and appointment.staff.user and appointment.staff.user.telegram_id:
        msg = f"🔔 New Appointment!\n\n📅 Date: {appointment.date} {appointment.start_time}\n👤 Client: {appointment.client.first_name} {appointment.client.last_name}\n✂️ Service: {appointment.service.name}"
        send_telegram_notification.delay(appointment.staff.user.telegram_id, msg)

    return appointment

@router.put("/{appointment_id}", response_model=AppointmentResponse)
async def update_appointment(appointment_id: int, appointment_in: AppointmentUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(Appointment).filter(Appointment.id == appointment_id))
    db_appointment = result.scalars().first()
    if not db_appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    update_data = appointment_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_appointment, field, value)

    await db.commit()

    result = await db.execute(
        select(Appointment)
        .options(selectinload(Appointment.client), selectinload(Appointment.staff).selectinload(Staff.user), selectinload(Appointment.service))
        .filter(Appointment.id == appointment_id)
    )
    return result.scalars().first()
