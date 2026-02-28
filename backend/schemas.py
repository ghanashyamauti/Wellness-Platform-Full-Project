from pydantic import BaseModel, EmailStr, Field, ConfigDict
from datetime import datetime
from typing import Optional, List
from models import UserRole, BookingStatus, PaymentStatus

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: Optional[str] = None
    phone: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None

class UserResponse(UserBase):
    id: int
    role: UserRole
    is_active: bool
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# Service Schemas
class ServiceBase(BaseModel):
    title: str
    category: str
    description: Optional[str] = None
    price: float
    duration_minutes: int = 60
    expert_name: Optional[str] = None
    image_url: Optional[str] = " "

class ServiceCreate(ServiceBase):
    pass

class ServiceUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    duration_minutes: Optional[int] = None
    expert_name: Optional[str] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None

class ServiceResponse(ServiceBase):
    id: int
    is_active: bool
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# Booking Schemas
class BookingCreate(BaseModel):
    service_id: int
    booking_date: str
    time_slot: str
    notes: Optional[str] = None

class BookingResponse(BaseModel):
    id: int
    user_id: int
    service_id: int
    booking_date: datetime
    time_slot: str
    status: BookingStatus
    payment_status: PaymentStatus
    payment_id: Optional[str] = None
    total_amount: float
    notes: Optional[str] = None
    created_at: datetime
    service: ServiceResponse
    
    model_config = ConfigDict(from_attributes=True)

class BookingAdminResponse(BookingResponse):
    user: UserResponse
    
    model_config = ConfigDict(from_attributes=True)

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class TokenData(BaseModel):
    email: Optional[str] = None

# Payment Schemas
class PaymentRequest(BaseModel):
    booking_id: int
    amount: float

class PaymentResponse(BaseModel):
    status: PaymentStatus
    payment_id: str
    message: str

# Dashboard Stats
class DashboardStats(BaseModel):
    total_users: int
    total_bookings: int
    total_revenue: float
    pending_bookings: int
    confirmed_bookings: int
    cancelled_bookings: int