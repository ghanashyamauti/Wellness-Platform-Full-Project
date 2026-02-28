from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime
import enum

Base = declarative_base()

# ================= ENUMS =================
class UserRole(str, enum.Enum):
    USER = "USER"
    ADMIN = "ADMIN"

class BookingStatus(str, enum.Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    CANCELLED = "CANCELLED"

class PaymentStatus(str, enum.Enum):
    PENDING = "PENDING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"

# ================= TABLES =================
class Admin(Base):
    __tablename__ = "admins"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(50), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(50), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255))
    phone = Column(String(20))
    role = Column(Enum(UserRole, name='user_role'), default=UserRole.USER)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    bookings = relationship("Booking", back_populates="user", lazy="select")

class Service(Base):
    __tablename__ = "services"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    category = Column(String(255), nullable=False)
    description = Column(Text)
    price = Column(Float, nullable=False)
    duration_minutes = Column(Integer)
    expert_name = Column(String(255))
    image_url = Column(String(500))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    bookings = relationship("Booking", back_populates="service", lazy="select")

class Booking(Base):
    __tablename__ = "bookings"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    service_id = Column(Integer, ForeignKey("services.id"), nullable=False)
    booking_date = Column(DateTime, nullable=False)
    time_slot = Column(String(50))
    status = Column(Enum(BookingStatus, name='booking_status'), default=BookingStatus.PENDING)
    payment_status = Column(Enum(PaymentStatus, name='payment_status'), default=PaymentStatus.PENDING)
    payment_id = Column(String(50))
    total_amount = Column(Float)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    cancelled_at = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="bookings", lazy="joined")
    service = relationship("Service", back_populates="bookings", lazy="joined")