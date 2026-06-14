"""
Medical Report endpoints — Upload → Validate → Analyze
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from datetime import datetime
from bson import ObjectId
import os
import uuid
import logging
import traceback

from app.core.database import get_database
from app.core.security import get_current_user
from app.core.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)

ALLOWED_TYPES = {
    "application/pdf", "image/jpeg", "image/jpg",
    "image/png", "image/tiff", "image/bmp", "image/webp",
}


@router.get("/")
async def get_reports(
    db=Depends(get_database),
    current_user=Depends(get_current_user),
):
    """Get all reports for current user"""
    try:
        if db is None:
            return {"reports": [], "total": 0}

        user_id = current_user.get("id") or str(current_user.get("_id", ""))
        logger.info(f"Fetching reports for user: {user_id}")

        cursor = db.reports.find({"user_id": user_id}).sort("created_at", -1)
        reports = []
        async for report in cursor:
            try:
                report["id"] = str(report["_id"])
                del report["_id"]
                report.pop("extracted_text", None)
                # Convert datetime objects to strings
                for key in ["created_at", "updated_at"]:
                    if isinstance(report.get(key), datetime):
                        report[key] = report[key].isoformat()
                reports.append(report)
            except Exception as e:
                logger.warning(f"Error serializing report: {e}")
                continue

        logger.info(f"Found {len(reports)} reports for user {user_id}")
        return {"reports": reports, "total": len(reports)}

    except Exception as e:
        logger.error(f"GET /reports/ error: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch reports: {str(e)}")


@router.post("/upload")
async def upload_report(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db=Depends(get_database),
    current_user=Depends(get_current_user),
):
    """Upload and analyze a medical report"""
    try:
        logger.info(f"Upload request: filename={file.filename}, content_type={file.content_type}")

        # Validate file type
        content_type = (file.content_type or "").lower()
        # Be lenient — accept octet-stream too and detect from extension
        ext = os.path.splitext(file.filename or "")[1].lower()
        ext_type_map = {
            ".pdf": "application/pdf",
            ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".tiff": "image/tiff", ".tif": "image/tiff",
        }
        if content_type == "application/octet-stream" and ext in ext_type_map:
            content_type = ext_type_map[ext]

        if content_type not in ALLOWED_TYPES and ext not in ext_type_map:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type '{content_type}'. Please upload PDF, JPG, PNG, or TIFF."
            )

        # Read file
        content = await file.read()
        file_size = len(content)
        logger.info(f"File read: {file_size} bytes")

        if file_size < 100:
            raise HTTPException(status_code=400, detail="File appears to be empty or corrupted")
        if file_size > 20 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File size exceeds 20MB limit")

        # Save file
        file_id = str(uuid.uuid4())
        upload_dir = os.path.join(settings.UPLOAD_DIR, "reports")
        os.makedirs(upload_dir, exist_ok=True)
        file_path = os.path.join(upload_dir, f"{file_id}{ext or '.pdf'}")

        with open(file_path, "wb") as f:
            f.write(content)
        logger.info(f"File saved: {file_path}")

        # Create DB record
        user_id = current_user.get("id") or str(current_user.get("_id", ""))
        now = datetime.utcnow()
        report_doc = {
            "user_id": user_id,
            "original_name": file.filename or "report",
            "file_path": file_path,
            "file_type": content_type,
            "file_size": file_size,
            "status": "processing",
            "is_medical": None,
            "created_at": now,
            "updated_at": now,
        }

        report_id = file_id  # fallback
        if db is not None:
            result = await db.reports.insert_one(report_doc)
            report_id = str(result.inserted_id)
            logger.info(f"Report saved to DB: {report_id}")

        # Run analysis in background
        background_tasks.add_task(
            _analyze_background,
            report_id=report_id,
            file_path=file_path,
            file_type=content_type,
            user_id=user_id,
            db=db,
        )

        return {
            "id": report_id,
            "name": file.filename,
            "status": "processing",
            "message": "File uploaded. AI validation and analysis in progress...",
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"POST /reports/upload error: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


async def _analyze_background(report_id: str, file_path: str, file_type: str, user_id: str, db):
    """Background task: validate + analyze report"""
    try:
        logger.info(f"Starting background analysis for report {report_id}")

        # Import here to avoid startup errors if OCR libs missing
        from app.services.report_analyzer import analyze_report
        analysis = await analyze_report(file_path, file_type)

        update_data = {
            "status": "analyzed" if analysis["is_medical"] else "rejected",
            "is_medical": analysis["is_medical"],
            "document_type": analysis.get("document_type", "Unknown"),
            "classification_confidence": analysis.get("confidence", 0),
            "updated_at": datetime.utcnow(),
        }

        if analysis["is_medical"]:
            update_data.update({
                "summary": analysis.get("summary", ""),
                "conditions": analysis.get("conditions", []),
                "medications": analysis.get("medications", []),
                "abnormal_values": analysis.get("abnormal_values", []),
                "normal_values": analysis.get("normal_values", []),
                "match_score": analysis.get("match_score", 0),
                "word_count": analysis.get("word_count", 0),
                "extracted_text": analysis.get("extracted_text", ""),
                "medical_indicators": analysis.get("medical_indicators", []),
            })
        else:
            update_data.update({
                "rejection_message": analysis.get("message", ""),
                "detected_non_medical_indicators": analysis.get("detected_non_medical_indicators", []),
            })

        if db is not None:
            await db.reports.update_one(
                {"_id": ObjectId(report_id)},
                {"$set": update_data}
            )
            if analysis["is_medical"]:
                await db.activity_logs.insert_one({
                    "user_id": user_id,
                    "action": "report_analyzed",
                    "report_id": report_id,
                    "document_type": analysis.get("document_type"),
                    "timestamp": datetime.utcnow(),
                })

        logger.info(
            f"Report {report_id} done: is_medical={analysis['is_medical']}, "
            f"type={analysis.get('document_type')}, confidence={analysis.get('confidence')}"
        )

    except Exception as e:
        logger.error(f"Background analysis failed for {report_id}: {traceback.format_exc()}")
        if db is not None:
            try:
                await db.reports.update_one(
                    {"_id": ObjectId(report_id)},
                    {"$set": {
                        "status": "failed",
                        "error": str(e),
                        "updated_at": datetime.utcnow(),
                    }}
                )
            except Exception:
                pass


@router.get("/{report_id}")
async def get_report(
    report_id: str,
    db=Depends(get_database),
    current_user=Depends(get_current_user),
):
    """Get a specific report"""
    try:
        if db is None:
            raise HTTPException(status_code=503, detail="Database unavailable")

        user_id = current_user.get("id") or str(current_user.get("_id", ""))

        try:
            oid = ObjectId(report_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid report ID format")

        report = await db.reports.find_one({"_id": oid, "user_id": user_id})
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")

        report["id"] = str(report["_id"])
        del report["_id"]
        for key in ["created_at", "updated_at"]:
            if isinstance(report.get(key), datetime):
                report[key] = report[key].isoformat()
        return report

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"GET /reports/{report_id} error: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch report: {str(e)}")


@router.delete("/{report_id}")
async def delete_report(
    report_id: str,
    db=Depends(get_database),
    current_user=Depends(get_current_user),
):
    """Delete a report"""
    try:
        if db is None:
            raise HTTPException(status_code=503, detail="Database unavailable")

        user_id = current_user.get("id") or str(current_user.get("_id", ""))

        try:
            oid = ObjectId(report_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid report ID")

        report = await db.reports.find_one({"_id": oid, "user_id": user_id})
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")

        # Delete file
        file_path = report.get("file_path", "")
        if file_path and os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception as e:
                logger.warning(f"Could not delete file {file_path}: {e}")

        await db.reports.delete_one({"_id": oid})
        return {"message": "Report deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"DELETE /reports/{report_id} error: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Failed to delete report: {str(e)}")
