from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.core.database import get_database
from app.core.security import get_current_user

router = APIRouter()


class TravelPlanRequest(BaseModel):
    destination: str
    hospital: Optional[str] = None
    procedure: str
    travel_date: Optional[str] = None
    companions: int = 1
    budget: Optional[float] = None


@router.post("/plan")
async def generate_travel_plan(
    request: TravelPlanRequest,
    db=Depends(get_database),
    current_user=Depends(get_current_user),
):
    """Generate AI travel plan for medical tourism"""
    # In production: use LLM to generate personalized plan
    plan = _generate_mock_plan(request)

    # Save plan
    if db is not None:
        plan_doc = {
            "user_id": current_user["id"],
            "destination": request.destination,
            "procedure": request.procedure,
            "plan": plan,
            "created_at": datetime.utcnow(),
        }
        result = await db.travel_plans.insert_one(plan_doc)
        plan["id"] = str(result.inserted_id)

    return plan


@router.get("/visa/{country}")
async def get_visa_info(
    country: str,
    current_user=Depends(get_current_user),
):
    """Get visa requirements for medical tourism"""
    visa_info = {
        "India": {
            "visa_type": "e-Medical Visa",
            "processing_time": "3-5 business days",
            "validity": "60 days (triple entry)",
            "requirements": [
                "Valid passport (6+ months)",
                "Hospital invitation letter",
                "Medical diagnosis documents",
                "Proof of funds",
                "Return flight tickets",
                "Travel insurance",
            ],
            "fee": "$25 USD",
            "url": "https://indianvisaonline.gov.in",
        },
        "Thailand": {
            "visa_type": "Medical Visa (Non-IM)",
            "processing_time": "5-7 business days",
            "validity": "90 days",
            "requirements": [
                "Valid passport",
                "Hospital appointment letter",
                "Medical records",
                "Financial proof",
                "Accommodation proof",
            ],
            "fee": "$40 USD",
        },
        "Turkey": {
            "visa_type": "e-Visa",
            "processing_time": "24-48 hours",
            "validity": "30-90 days",
            "requirements": [
                "Valid passport",
                "Credit/debit card",
                "Email address",
            ],
            "fee": "$50 USD",
            "url": "https://www.evisa.gov.tr",
        },
    }

    info = visa_info.get(country, {
        "visa_type": "Tourist/Medical Visa",
        "processing_time": "5-10 business days",
        "requirements": ["Valid passport", "Medical documents", "Proof of funds"],
        "fee": "Varies",
    })

    return {"country": country, "visa_info": info}


@router.get("/plans/{plan_id}")
async def get_travel_plan(
    plan_id: str,
    db=Depends(get_database),
    current_user=Depends(get_current_user),
):
    from bson import ObjectId
    try:
        plan = await db.travel_plans.find_one({
            "_id": ObjectId(plan_id),
            "user_id": current_user["id"]
        })
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid plan ID")

    if not plan:
        raise HTTPException(status_code=404, detail="Travel plan not found")

    plan["id"] = str(plan["_id"])
    del plan["_id"]
    return plan


def _generate_mock_plan(request: TravelPlanRequest) -> dict:
    return {
        "destination": request.destination,
        "procedure": request.procedure,
        "total_days": 21,
        "timeline": [
            {"day": "Day 1-2", "phase": "Arrival & Orientation", "tasks": ["Airport pickup", "Hotel check-in", "Hospital registration"]},
            {"day": "Day 3-5", "phase": "Pre-Surgery Preparation", "tasks": ["Consultations", "Pre-op tests", "Surgery briefing"]},
            {"day": "Day 6", "phase": "Surgery Day", "tasks": ["Surgery", "ICU admission"]},
            {"day": "Day 7-15", "phase": "Recovery", "tasks": ["ICU monitoring", "Physiotherapy", "Wound care"]},
            {"day": "Day 16-21", "phase": "Discharge & Departure", "tasks": ["Final evaluation", "Medical records", "Return flight"]},
        ],
        "visa_checklist": [
            {"item": "Valid passport (6+ months)", "done": False},
            {"item": "Medical visa application", "done": False},
            {"item": "Hospital invitation letter", "done": False},
            {"item": "Medical reports", "done": False},
            {"item": "Travel insurance", "done": False},
            {"item": "Proof of funds", "done": False},
        ],
        "estimated_cost": {
            "surgery": 8000,
            "hospital_stay": 2200,
            "medicines": 800,
            "travel": 1200,
            "accommodation": 900,
            "total": 13100,
        },
    }
