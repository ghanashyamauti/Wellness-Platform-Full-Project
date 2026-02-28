# 🏥 Wellness Service Booking Platform

A full-stack web application connecting users with certified wellness experts for yoga therapy, nutrition consultations, mental wellness workshops, and fitness training.

## 🚀 Live Demo

- **Frontend:** https://wellness-platform.netlify.app
- **Backend API:** https://wellness-backend.up.railway.app
- **API Docs:** https://wellness-backend.up.railway.app/docs

## 🛠️ Tech Stack

### Backend
- FastAPI (Python)
- PostgreSQL
- SQLAlchemy ORM
- JWT Authentication
- Pydantic Validation

### Frontend
- React 18
- Vite
- Tailwind CSS
- React Router
- Axios

### Deployment
- Backend: Railway
- Frontend: Netlify
- Database: Render (PostgreSQL)

## ✨ Features

- ✅ User registration & JWT authentication
- ✅ Browse and search wellness services
- ✅ Book services with date/time selection
- ✅ Mock payment gateway integration
- ✅ 24-hour cancellation policy
- ✅ Admin panel for service management
- ✅ Booking history and management
- ✅ Role-based access control

## 🏃 Running Locally

### Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Mac/Linux
pip install -r requirements.txt
```

Create `.env` file:
```
DATABASE_URL=postgresql://user:pass@localhost:5432/wellness_platform
SECRET_KEY=your-secret-key-here
```

Run:
```bash
uvicorn main:app --reload
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 📝 Default Credentials

**Admin:**
- Email: admin@wellness.com
- Password: Admin@123

## 📄 License

MIT License

## 👤 Author

[Your Name]
