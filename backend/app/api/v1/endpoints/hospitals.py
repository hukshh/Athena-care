"""
Hospital endpoints — AI-powered recommendation with NLP diagnosis understanding
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import datetime
import logging
import traceback

from app.core.database import get_database
from app.core.security import get_current_user
from app.services.recommendation_engine import HospitalRecommendationEngine

router = APIRouter()
logger = logging.getLogger(__name__)

# Singleton engine
_engine = None

def get_engine() -> HospitalRecommendationEngine:
    global _engine
    if _engine is None:
        _engine = HospitalRecommendationEngine()
    return _engine


class RecommendationRequest(BaseModel):
    diagnosis: str
    medical_history: Optional[str] = None
    budget: Optional[float] = None
    preferred_country: Optional[str] = None
    urgency: str = "normal"
    age: Optional[int] = None
    treatment_type: Optional[str] = None  # user-selected specialty (may be overridden)

    @field_validator("budget", mode="before")
    @classmethod
    def parse_budget(cls, v):
        if v is None:
            return None
        if isinstance(v, (int, float)):
            return float(v)
        if isinstance(v, str):
            v = v.replace("$", "").replace(",", "").strip()
            if v.upper().endswith("K"):
                try:
                    return float(v[:-1]) * 1000
                except ValueError:
                    return None
            if v in ("", "Any Budget", "any", "null"):
                return None
            try:
                return float(v)
            except ValueError:
                return None
        return None

    @field_validator("diagnosis")
    @classmethod
    def validate_diagnosis(cls, v):
        if not v or len(v.strip()) < 2:
            raise ValueError("Please enter a valid diagnosis or condition")
        return v.strip()


class HospitalSearchRequest(BaseModel):
    diagnosis: Optional[str] = None
    country: Optional[str] = None
    specialty: Optional[str] = None
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    urgency: Optional[str] = "normal"
    age: Optional[int] = None
    limit: int = 20


@router.get("/")
async def get_hospitals(
    country: Optional[str] = Query(None),
    specialty: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db=Depends(get_database),
    current_user=Depends(get_current_user),
):
    """Get paginated list of hospitals"""
    try:
        if db is None:
            return {"hospitals": [], "total": 0, "page": page}

        query = {}
        if country and country not in ("All Countries", ""):
            query["country"] = country
        if specialty and specialty not in ("All Specialties", ""):
            query["$or"] = [
                {"specialty": {"$regex": specialty, "$options": "i"}},
                {"specialties": {"$in": [specialty]}},
            ]

        skip = (page - 1) * limit
        cursor = db.hospitals.find(query).skip(skip).limit(limit).sort("rating", -1)
        hospitals = []
        async for h in cursor:
            h["id"] = str(h["_id"])
            del h["_id"]
            hospitals.append(h)

        total = await db.hospitals.count_documents(query)
        return {"hospitals": hospitals, "total": total, "page": page, "pages": (total + limit - 1) // limit}

    except Exception as e:
        logger.error(f"GET /hospitals/ error: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch hospitals: {str(e)}")


@router.post("/recommend")
async def get_recommendations(
    request: RecommendationRequest,
    db=Depends(get_database),
    current_user=Depends(get_current_user),
):
    """
    AI-powered hospital recommendations.
    Uses NLP to understand diagnosis, detect specialty, and rank hospitals.
    """
    try:
        logger.info(f"Recommendation request: diagnosis='{request.diagnosis}', country={request.preferred_country}")

        # Fetch hospitals from DB
        hospitals = []
        if db is not None:
            query = {}
            # Pre-filter by country if specified (optimization)
            if request.preferred_country and request.preferred_country not in ("All Countries", ""):
                query["country"] = request.preferred_country

            cursor = db.hospitals.find(query).limit(100)
            async for h in cursor:
                h["id"] = str(h["_id"])
                del h["_id"]
                hospitals.append(h)

            # If country filter returned too few, fetch all
            if len(hospitals) < 5:
                hospitals = []
                cursor = db.hospitals.find({}).limit(100)
                async for h in cursor:
                    h["id"] = str(h["_id"])
                    del h["_id"]
                    hospitals.append(h)

        if not hospitals:
            logger.warning("No hospitals in DB — returning empty result")
            return {
                "recommendations": [],
                "diagnosis_analysis": {"detected_specialty": "Unknown", "confidence": 0},
                "total": 0,
                "message": "No hospitals found. Please seed the database first.",
            }

        # Run AI recommendation engine
        engine = get_engine()
        result = engine.recommend(
            diagnosis=request.diagnosis,
            hospitals=hospitals,
            budget=request.budget,
            preferred_country=request.preferred_country,
            urgency=request.urgency,
            age=request.age,
            selected_specialty=request.treatment_type,
            limit=10,
        )

        # Log recommendation event
        if db is not None:
            try:
                await db.recommendations.insert_one({
                    "user_id": current_user.get("id", ""),
                    "diagnosis": request.diagnosis,
                    "detected_specialty": result["diagnosis_analysis"].get("detected_specialty"),
                    "results_count": result["total"],
                    "created_at": datetime.utcnow(),
                })
            except Exception:
                pass

        logger.info(
            f"Recommendation complete: {result['total']} results, "
            f"specialty={result['diagnosis_analysis'].get('detected_specialty')}"
        )

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"POST /hospitals/recommend error: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Recommendation failed: {str(e)}")


@router.post("/search")
async def search_hospitals(
    request: HospitalSearchRequest,
    db=Depends(get_database),
    current_user=Depends(get_current_user),
):
    """Search hospitals with filters"""
    try:
        if db is None:
            return {"hospitals": [], "total": 0}

        query = {}
        if request.country and request.country not in ("All Countries", ""):
            query["country"] = request.country
        if request.specialty and request.specialty not in ("All Specialties", ""):
            query["$or"] = [
                {"specialty": {"$regex": request.specialty, "$options": "i"}},
                {"specialties": {"$in": [request.specialty]}},
            ]

        cursor = db.hospitals.find(query).limit(request.limit).sort("rating", -1)
        hospitals = []
        async for h in cursor:
            h["id"] = str(h["_id"])
            del h["_id"]
            hospitals.append(h)

        return {"hospitals": hospitals, "total": len(hospitals)}

    except Exception as e:
        logger.error(f"POST /hospitals/search error: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


@router.get("/{hospital_id}")
async def get_hospital(
    hospital_id: str,
    db=Depends(get_database),
    current_user=Depends(get_current_user),
):
    """Get detailed hospital information"""
    try:
        if db is None:
            raise HTTPException(status_code=503, detail="Database unavailable")

        from bson import ObjectId
        try:
            oid = ObjectId(hospital_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid hospital ID")

        hospital = await db.hospitals.find_one({"_id": oid})
        if not hospital:
            raise HTTPException(status_code=404, detail="Hospital not found")

        hospital["id"] = str(hospital["_id"])
        del hospital["_id"]
        return hospital

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"GET /hospitals/{hospital_id} error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
