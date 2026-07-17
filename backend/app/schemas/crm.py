from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, date, time

class ClientBase(BaseModel):
    first_name: str
    last_name: str
    phone: str
    email: Optional[EmailStr] = None
    notes: Optional[str] = None

class ClientCreate(ClientBase):
    pass

class ClientUpdate(ClientBase):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None

class ClientResponse(ClientBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}

class ServiceBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    duration: int

class ServiceCreate(ServiceBase):
    pass

class ServiceUpdate(ServiceBase):
    name: Optional[str] = None
    price: Optional[float] = None
    duration: Optional[int] = None

class ServiceResponse(ServiceBase):
    id: int

    model_config = {"from_attributes": True}

class StaffBase(BaseModel):
    user_id: int
    specialization: str

class StaffCreate(StaffBase):
    pass

class StaffUpdate(BaseModel):
    specialization: Optional[str] = None

class StaffResponse(StaffBase):
    id: int
    user: "UserResponse"
    services: List[ServiceResponse] = []

    model_config = {"from_attributes": True}

class AppointmentBase(BaseModel):
    client_id: int
    staff_id: int
    service_id: int
    date: date
    start_time: time
    end_time: time
    status: str = "scheduled"
    notes: Optional[str] = None

class AppointmentCreate(AppointmentBase):
    pass

class AppointmentUpdate(BaseModel):
    date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    status: Optional[str] = None
    notes: Optional[str] = None

class AppointmentResponse(AppointmentBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    client: ClientResponse
    staff: StaffResponse
    service: ServiceResponse

    model_config = {"from_attributes": True}

class FinanceBase(BaseModel):
    amount: float
    type: str
    description: Optional[str] = None
    appointment_id: Optional[int] = None

class FinanceCreate(FinanceBase):
    pass

class FinanceResponse(FinanceBase):
    id: int
    date: datetime

    model_config = {"from_attributes": True}

class InventoryBase(BaseModel):
    name: str
    quantity: int = 0
    price: float

class InventoryCreate(InventoryBase):
    pass

class InventoryUpdate(BaseModel):
    name: Optional[str] = None
    quantity: Optional[int] = None
    price: Optional[float] = None

class InventoryResponse(InventoryBase):
    id: int

    model_config = {"from_attributes": True}

from app.schemas.user import UserResponse
StaffResponse.model_rebuild()
