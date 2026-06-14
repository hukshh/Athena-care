from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth, reports, hospitals, doctors, cost, travel, chat, dashboard, admin
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(reports.router, prefix="/reports", tags=["Medical Reports"])
api_router.include_router(hospitals.router, prefix="/hospitals", tags=["Hospitals"])
api_router.include_router(doctors.router, prefix="/doctors", tags=["Doctors"])
api_router.include_router(cost.router, prefix="/cost", tags=["Cost Predictor"])
api_router.include_router(travel.router, prefix="/travel", tags=["Travel Planner"])
api_router.include_router(chat.router, prefix="/chat", tags=["AI Chatbot"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
api_router.include_router(admin.router, prefix="/admin", tags=["Admin"])
