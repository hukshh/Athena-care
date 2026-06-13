from fastapi import APIRouter, Depends, Query, HTTPException
from datetime import datetime, timedelta
from bson import ObjectId
from app.core.database import get_database
from app.core.security import get_current_admin

router = APIRouter()


@router.get("/stats")
async def get_admin_stats(
    db=Depends(get_database),
    admin=Depends(get_current_admin),
):
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    total_users = await db.users.count_documents({})
    total_reports = await db.reports.count_documents({})
    total_matches = await db.recommendations.count_documents({})
    total_hospitals = await db.hospitals.count_documents({})

    return {
        "total_users": total_users,
        "total_reports": total_reports,
        "total_matches": total_matches,
        "total_hospitals": total_hospitals,
        "mrr": 284000,
        "active_users_today": 248,
    }


@router.get("/users")
async def get_users(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: str = Query(""),
    db=Depends(get_database),
    admin=Depends(get_current_admin),
):
    if db is None:
        return {"users": [], "total": 0, "page": page}

    query = {}
    if search:
        query["$or"] = [
            {"full_name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
        ]

    skip = (page - 1) * limit
    cursor = db.users.find(query, {"password_hash": 0}).skip(skip).limit(limit).sort("created_at", -1)
    users = []
    async for user in cursor:
        user["id"] = str(user["_id"])
        del user["_id"]
        users.append(user)

    total = await db.users.count_documents(query)
    return {"users": users, "total": total, "page": page}


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    db=Depends(get_database),
    admin=Depends(get_current_admin),
):
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")

    try:
        result = await db.users.delete_one({"_id": ObjectId(user_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user ID")

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")

    return {"message": "User deleted successfully"}


@router.get("/reports")
async def get_all_reports(
    page: int = Query(1, ge=1),
    limit: int = Query(20),
    db=Depends(get_database),
    admin=Depends(get_current_admin),
):
    if db is None:
        return {"reports": [], "total": 0}

    skip = (page - 1) * limit
    cursor = db.reports.find({}).skip(skip).limit(limit).sort("created_at", -1)
    reports = []
    async for report in cursor:
        report["id"] = str(report["_id"])
        del report["_id"]
        reports.append(report)

    total = await db.reports.count_documents({})
    return {"reports": reports, "total": total}
