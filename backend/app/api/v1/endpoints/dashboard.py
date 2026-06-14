from fastapi import APIRouter, Depends
from datetime import datetime, timedelta
from app.core.database import get_database
from app.core.security import get_current_user
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/stats")
async def get_dashboard_stats(
    db=Depends(get_database),
    current_user=Depends(get_current_user),
):
    user_id = current_user["id"]

    try:
        reports_count = await db.reports.count_documents({"user_id": user_id}) if db else 0
        matches_count = await db.recommendations.count_documents({"user_id": user_id}) if db else 0
        chat_count = await db.chat_history.count_documents({"user_id": user_id, "role": "user"}) if db else 0

        # Calculate health score from reports
        health_score = 75
        if reports_count > 0:
            health_score = min(75 + (reports_count * 3), 98)

        # Estimate savings based on matches
        potential_savings = max(matches_count * 8000, 50000)

        return {
            "reports_analyzed": reports_count,
            "hospital_matches": matches_count,
            "chat_sessions": chat_count,
            "health_score": health_score,
            "potential_savings": potential_savings,
        }
    except Exception as e:
        logger.error(f"Dashboard stats error: {e}")
        return {
            "reports_analyzed": 0,
            "hospital_matches": 0,
            "chat_sessions": 0,
            "health_score": 75,
            "potential_savings": 50000,
        }


@router.get("/activity")
async def get_activity(
    db=Depends(get_database),
    current_user=Depends(get_current_user),
):
    user_id = current_user["id"]

    try:
        since = datetime.utcnow() - timedelta(days=7)
        cursor = db.activity_logs.find(
            {"user_id": user_id, "timestamp": {"$gte": since}}
        ).sort("timestamp", -1).limit(20)

        activities = []
        async for act in cursor:
            act["id"] = str(act["_id"])
            del act["_id"]
            activities.append(act)

        return {"activities": activities}
    except Exception as e:
        logger.error(f"Activity fetch error: {e}")
        return {"activities": []}


@router.get("/insights")
async def get_insights(
    db=Depends(get_database),
    current_user=Depends(get_current_user),
):
    user_id = current_user["id"]
    insights = []

    try:
        # Check if user has reports
        reports_count = await db.reports.count_documents({"user_id": user_id}) if db else 0

        if reports_count == 0:
            insights.append({
                "type": "onboarding",
                "title": "Upload Your First Report",
                "description": "Upload a medical report to get AI-powered hospital recommendations tailored to your condition.",
                "priority": "high",
                "action": "/reports",
            })
        else:
            # Get latest report for insights
            latest_report = await db.reports.find_one(
                {"user_id": user_id, "status": "analyzed"},
                sort=[("created_at", -1)]
            )
            if latest_report and latest_report.get("conditions"):
                conditions = latest_report["conditions"]
                insights.append({
                    "type": "recommendation",
                    "title": f"Specialist Consultation Recommended",
                    "description": f"Based on your report, conditions detected: {', '.join(conditions[:2])}. We found matching hospitals.",
                    "priority": "high",
                    "action": "/hospitals",
                })

        insights.append({
            "type": "cost",
            "title": "Save up to 85% on Treatment",
            "description": "Treatment in India or Thailand can save you significantly compared to US/UK prices.",
            "priority": "medium",
            "action": "/cost-predictor",
        })

    except Exception as e:
        logger.error(f"Insights error: {e}")
        insights = [{
            "type": "info",
            "title": "Welcome to AthenaCare AI",
            "description": "Upload your medical reports to get personalized AI recommendations.",
            "priority": "high",
            "action": "/reports",
        }]

    return {"insights": insights}
