from fastapi import APIRouter, Depends, Query, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.core.database import get_database
from app.core.security import get_current_user

router = APIRouter()


class DoctorSearchRequest(BaseModel):
    specialty: Optional[str] = None
    country: Optional[str] = None
    language: Optional[str] = None
    min_experience: Optional[int] = None
    max_fee: Optional[float] = None
    diagnosis: Optional[str] = None


@router.get("/")
async def get_doctors(
    specialty: Optional[str] = Query(None),
    country: Optional[str] = Query(None),
    language: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db=Depends(get_database),
    current_user=Depends(get_current_user),
):
    if db is None:
        return {"doctors": [], "total": 0, "page": page}

    query = {}
    if specialty and specialty != "All Specialties":
        query["specialty"] = {"$regex": specialty, "$options": "i"}
    if country and country != "All Countries":
        query["country"] = country
    if language and language != "All Languages":
        query["languages"] = {"$in": [language]}

    skip = (page - 1) * limit
    cursor = db.doctors.find(query).skip(skip).limit(limit).sort("rating", -1)
    doctors = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
        doctors.append(doc)

    total = await db.doctors.count_documents(query)
    return {"doctors": doctors, "total": total, "page": page}


@router.post("/recommend")
async def recommend_doctors(
    request: DoctorSearchRequest,
    db=Depends(get_database),
    current_user=Depends(get_current_user),
):
    if db is None:
        return {"doctors": [], "total": 0}

    query = {}
    if request.specialty:
        query["specialty"] = {"$regex": request.specialty, "$options": "i"}
    if request.country:
        query["country"] = request.country

    cursor = db.doctors.find(query).limit(10).sort("rating", -1)
    doctors = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
        doctors.append(doc)

    return {"doctors": doctors, "total": len(doctors)}


@router.get("/{doctor_id}")
async def get_doctor(
    doctor_id: str,
    db=Depends(get_database),
    current_user=Depends(get_current_user),
):
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")

    from bson import ObjectId
    try:
        doctor = await db.doctors.find_one({"_id": ObjectId(doctor_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid doctor ID")

    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    doctor["id"] = str(doctor["_id"])
    del doctor["_id"]
    return doctor
