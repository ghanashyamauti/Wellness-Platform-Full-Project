from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import datetime, timedelta
from typing import List
import os
import shutil
import uuid

from database import get_db, engine
from models import User, Service, Booking, Base, UserRole, BookingStatus, PaymentStatus
from schemas import (
    UserCreate, UserLogin, UserResponse, Token,
    ServiceCreate, ServiceUpdate, ServiceResponse,
    BookingCreate, BookingResponse, BookingAdminResponse,
    DashboardStats
)
from auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user,
    get_current_admin
)

# Initialize database
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Wellness Booking Platform API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files
os.makedirs("static/images/services", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Mock Payment Service
def mock_payment_gateway(amount: float):
    import random
    payment_id = f"PAY_{uuid.uuid4().hex[:12].upper()}"
    success = random.choice([True, True, True, False])  # 75% success rate
    return {
        "status": PaymentStatus.SUCCESS if success else PaymentStatus.FAILED,
        "payment_id": payment_id,
        "message": "Payment successful" if success else "Payment failed"
    }

# Mock Email Service
def send_email(to: str, subject: str, body: str):
    print(f"\n📧 MOCK EMAIL SENT")
    print(f"To: {to}")
    print(f"Subject: {subject}")
    print(f"Body: {body}\n")

# Initialize Admin Account & Sample Services
@app.on_event("startup")
async def startup_event():
    db = next(get_db())
    
    # Create admin if not exists
    admin = db.query(User).filter(User.email == "admin@wellness.com").first()
    if not admin:
        admin = User(
            email="admin@wellness.com",
            username="admin",
            hashed_password=get_password_hash("Admin@123"),
            full_name="System Administrator",
            role=UserRole.ADMIN,
            is_active=True
        )
        db.add(admin)
        db.commit()
        print("✅ Admin account created: admin@wellness.com / Admin@123")
    
    # Create sample services if none exist
    services_count = db.query(Service).count()
    if services_count == 0:
        sample_services = [
            Service(
                title="Morning Yoga Flow",
                category="Yoga Therapy",
                description="Start your day with energizing yoga poses and breathing exercises to improve flexibility and mental clarity",
                price=999.0,
                duration_minutes=60,
                expert_name="Dr. Sarah Johnson",
                is_active=True
            ),
            Service(
                title="Personalized Diet Plan",
                category="Nutrition Consultation",
                description="Get a customized nutrition plan based on your health goals, lifestyle, and dietary preferences",
                price=1499.0,
                duration_minutes=45,
                expert_name="Nutritionist Mike Chen",
                is_active=True
            ),
            Service(
                title="Stress Management Workshop",
                category="Mental Wellness Workshop",
                description="Learn evidence-based techniques to manage stress, anxiety, and improve overall mental well-being",
                price=799.0,
                duration_minutes=90,
                expert_name="Dr. Emily Roberts",
                is_active=True
            ),
            Service(
                title="Expert Wellness Consultation",
                category="One-on-One Expert Call",
                description="Private one-on-one consultation with experienced wellness experts for personalized guidance",
                price=599.0,
                duration_minutes=30,
                expert_name="Various Experts",
                is_active=True
            ),
            Service(
                title="Guided Meditation Session",
                category="Meditation & Mindfulness",
                description="Deep relaxation through guided meditation practices to reduce stress and enhance mindfulness",
                price=499.0,
                duration_minutes=45,
                expert_name="Master Li Wei",
                is_active=True
            ),
            Service(
                title="HIIT Workout Training",
                category="Fitness Training",
                description="High-intensity interval training designed for fitness enthusiasts to build strength and endurance",
                price=899.0,
                duration_minutes=60,
                expert_name="Coach David Martinez",
                is_active=True
            )
        ]
        for service in sample_services:
            db.add(service)
        db.commit()
        print("✅ 6 Sample services created successfully")

# ============ AUTH ROUTES ============
@app.post("/api/auth/register", response_model=UserResponse, status_code=201)
def register(user: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.query(User).filter(User.username == user.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")
    
    db_user = User(
        email=user.email,
        username=user.username,
        hashed_password=get_password_hash(user.password),
        full_name=user.full_name,
        phone=user.phone,
        role=UserRole.USER
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    send_email(
        user.email,
        "Welcome to Wellness Platform!",
        f"Hi {user.full_name or user.username}, welcome to our wellness community!"
    )
    
    return db_user

@app.post("/api/auth/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is inactive")
    
    access_token = create_access_token(data={"sub": user.email})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@app.get("/api/auth/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# ============ SERVICE ROUTES ============
@app.get("/api/services", response_model=List[ServiceResponse])
def get_services(
    skip: int = 0,
    limit: int = 100,
    category: str = None,
    db: Session = Depends(get_db)
):
    query = db.query(Service).filter(Service.is_active == True)
    if category:
        query = query.filter(Service.category == category)
    return query.offset(skip).limit(limit).all()

@app.get("/api/services/{service_id}", response_model=ServiceResponse)
def get_service(service_id: int, db: Session = Depends(get_db)):
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    return service

@app.get("/api/services/category/list")
def get_categories(db: Session = Depends(get_db)):
    categories = db.query(Service.category).distinct().all()
    return {"categories": [cat[0] for cat in categories]}

# ============ BOOKING ROUTES ============
@app.post("/api/bookings", response_model=BookingResponse, status_code=201)
async def create_booking(
    booking: BookingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = db.query(Service).filter(Service.id == booking.service_id).first()
    if not service or not service.is_active:
        raise HTTPException(status_code=404, detail="Service not found")
    
    booking_datetime = datetime.strptime(booking.booking_date, "%Y-%m-%d")
    
    # Check duplicate booking
    existing = db.query(Booking).filter(
        and_(
            Booking.user_id == current_user.id,
            Booking.service_id == booking.service_id,
            Booking.booking_date == booking_datetime,
            Booking.time_slot == booking.time_slot,
            Booking.status != BookingStatus.CANCELLED
        )
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="You already have a booking for this service at this time")
    
    # Create booking
    new_booking = Booking(
        user_id=current_user.id,
        service_id=service.id,
        booking_date=booking_datetime,
        time_slot=booking.time_slot,
        total_amount=service.price,
        notes=booking.notes,
        status=BookingStatus.PENDING,
        payment_status=PaymentStatus.PENDING
    )
    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)
    
    # Mock Payment
    payment_result = mock_payment_gateway(service.price)
    new_booking.payment_status = payment_result["status"]
    new_booking.payment_id = payment_result["payment_id"]
    
    if payment_result["status"] == PaymentStatus.SUCCESS:
        new_booking.status = BookingStatus.CONFIRMED
        send_email(
            current_user.email,
            "Booking Confirmed!",
            f"Your booking for {service.title} on {booking.booking_date} at {booking.time_slot} is confirmed! Payment ID: {payment_result['payment_id']}"
        )
    else:
        send_email(
            current_user.email,
            "Payment Failed",
            f"Payment for {service.title} failed. Please retry from your bookings page."
        )
    
    db.commit()
    db.refresh(new_booking)
    return new_booking

@app.get("/api/bookings/my", response_model=List[BookingResponse])
async def get_my_bookings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(Booking).filter(Booking.user_id == current_user.id).order_by(Booking.created_at.desc()).all()

@app.post("/api/bookings/{booking_id}/retry-payment", response_model=BookingResponse)
async def retry_payment(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    booking = db.query(Booking).filter(
        Booking.id == booking_id,
        Booking.user_id == current_user.id
    ).first()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking.payment_status == PaymentStatus.SUCCESS:
        raise HTTPException(status_code=400, detail="Payment already successful")
    
    payment_result = mock_payment_gateway(booking.total_amount)
    booking.payment_status = payment_result["status"]
    booking.payment_id = payment_result["payment_id"]
    
    if payment_result["status"] == PaymentStatus.SUCCESS:
        booking.status = BookingStatus.CONFIRMED
        send_email(
            current_user.email,
            "Payment Successful!",
            f"Your payment for booking #{booking.id} is now confirmed! Payment ID: {payment_result['payment_id']}"
        )
    
    db.commit()
    db.refresh(booking)
    return booking

@app.delete("/api/bookings/{booking_id}")
async def cancel_booking(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    booking = db.query(Booking).filter(
        Booking.id == booking_id,
        Booking.user_id == current_user.id
    ).first()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking.status == BookingStatus.CANCELLED:
        raise HTTPException(status_code=400, detail="Booking already cancelled")
    
    # Check 24-hour cancellation policy
    time_until_booking = booking.booking_date - datetime.utcnow()
    if time_until_booking.total_seconds() < 24 * 3600:
        raise HTTPException(status_code=400, detail="Cannot cancel within 24 hours of booking")
    
    booking.status = BookingStatus.CANCELLED
    booking.cancelled_at = datetime.utcnow()
    db.commit()
    
    send_email(
        current_user.email,
        "Booking Cancelled",
        f"Your booking #{booking.id} for {booking.service.title} has been cancelled successfully."
    )
    
    return {"message": "Booking cancelled successfully"}

# ============ ADMIN ROUTES ============
@app.get("/api/admin/dashboard", response_model=DashboardStats)
async def get_dashboard_stats(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    total_users = db.query(func.count(User.id)).filter(User.role == UserRole.USER).scalar()
    total_bookings = db.query(func.count(Booking.id)).scalar()
    total_revenue = db.query(func.sum(Booking.total_amount)).filter(
        Booking.payment_status == PaymentStatus.SUCCESS
    ).scalar() or 0
    
    pending = db.query(func.count(Booking.id)).filter(Booking.status == BookingStatus.PENDING).scalar()
    confirmed = db.query(func.count(Booking.id)).filter(Booking.status == BookingStatus.CONFIRMED).scalar()
    cancelled = db.query(func.count(Booking.id)).filter(Booking.status == BookingStatus.CANCELLED).scalar()
    
    return {
        "total_users": total_users,
        "total_bookings": total_bookings,
        "total_revenue": total_revenue,
        "pending_bookings": pending,
        "confirmed_bookings": confirmed,
        "cancelled_bookings": cancelled
    }

@app.get("/api/admin/users", response_model=List[UserResponse])
async def get_all_users(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    return db.query(User).filter(User.role == UserRole.USER).all()

@app.get("/api/admin/bookings", response_model=List[BookingAdminResponse])
async def get_all_bookings(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    return db.query(Booking).order_by(Booking.created_at.desc()).all()

@app.post("/api/admin/services", response_model=ServiceResponse, status_code=201)
async def create_service(
    service: ServiceCreate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    new_service = Service(**service.dict())
    db.add(new_service)
    db.commit()
    db.refresh(new_service)
    return new_service

@app.put("/api/admin/services/{service_id}", response_model=ServiceResponse)
async def update_service(
    service_id: int,
    service_update: ServiceUpdate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    for key, value in service_update.dict(exclude_unset=True).items():
        setattr(service, key, value)
    
    db.commit()
    db.refresh(service)
    return service

@app.delete("/api/admin/services/{service_id}")
async def delete_service(
    service_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    service.is_active = False
    db.commit()
    return {"message": "Service deactivated successfully"}

@app.post("/api/admin/upload-image")
async def upload_image(
    file: UploadFile = File(...),
    current_admin: User = Depends(get_current_admin)
):
    file_ext = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4().hex}{file_ext}"
    file_path = f"static/images/services/{filename}"
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    return {"image_url": f"/static/images/services/{filename}"}

@app.get("/")
def root():
    return {"message": "Wellness Booking Platform API", "version": "1.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)