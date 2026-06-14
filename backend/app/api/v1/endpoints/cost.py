"""
Treatment Cost Predictor — XGBoost ML model
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from app.core.database import get_database
from app.core.security import get_current_user
from app.services.cost_predictor import CostPredictor

router = APIRouter()
predictor = CostPredictor()


class CostPredictionRequest(BaseModel):
    procedure: str
    country: str
    age: Optional[int] = None
    insurance: Optional[str] = "none"
    complexity: Optional[str] = "standard"


class CostCompareRequest(BaseModel):
    procedure: str
    countries: Optional[List[str]] = None
    age: Optional[int] = None


@router.post("/predict")
async def predict_cost(
    request: CostPredictionRequest,
    db=Depends(get_database),
    current_user=Depends(get_current_user),
):
    """Predict treatment cost using XGBoost model"""
    prediction = predictor.predict(
        procedure=request.procedure,
        country=request.country,
        age=request.age or 45,
        insurance=request.insurance,
    )

    # Log prediction
    if db is not None:
        await db.cost_predictions.insert_one({
            "user_id": current_user["id"],
            "procedure": request.procedure,
            "country": request.country,
            "prediction": prediction,
            "created_at": datetime.utcnow(),
        })

    return prediction


@router.post("/breakdown")
async def get_cost_breakdown(
    request: CostPredictionRequest,
    current_user=Depends(get_current_user),
):
    """Get detailed cost breakdown by category"""
    breakdown = predictor.get_breakdown(
        procedure=request.procedure,
        country=request.country,
        age=request.age or 45,
    )
    return breakdown


@router.post("/compare")
async def compare_countries(
    request: CostCompareRequest,
    current_user=Depends(get_current_user),
):
    """Compare treatment costs across multiple countries"""
    countries = request.countries or ["India", "Thailand", "Turkey", "Singapore", "Germany", "USA"]
    comparison = predictor.compare_countries(
        procedure=request.procedure,
        countries=countries,
        age=request.age or 45,
    )
    return {"comparison": comparison, "procedure": request.procedure}
