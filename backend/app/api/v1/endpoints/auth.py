"""
Authentication endpoints — register, login, JWT
"""

from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, EmailStr, field_validator
from datetime import datetime
from bson import ObjectId
from typing import Optional
import logging

from app.core.database import get_database
from app.core.security import (
    hash_password, verify_password,
    create_access_token, get_current_user
)

router = APIRouter()
logger = logging.getLogger(__name__)


# ── Request schemas ───────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    confirm_password: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None
    nationality: Optional[str] = None
    gender: Optional[str] = None

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

    @field_validator("full_name")
    @classmethod
    def validate_name(cls, v):
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Full name must be at least 2 characters")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


# ── Helpers ───────────────────────────────────────────────────────────────────

def serialize_user(user: dict) -> dict:
    """Convert MongoDB document to safe API response"""
    created = user.get("created_at")
    return {
        "id": str(user.get("_id", "")),
        "full_name": user.get("full_name", ""),
        "email": user.get("email", ""),
        "phone": user.get("phone"),
        "nationality": user.get("nationality"),
        "gender": user.get("gender"),
        "date_of_birth": user.get("date_of_birth"),
        "role": user.get("role", "patient"),
        "blood_type": user.get("blood_type"),
        "allergies": user.get("allergies"),
        "chronic_conditions": user.get("chronic_conditions"),
        "created_at": created.isoformat() if isinstance(created, datetime) else str(created or ""),
    }


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(data: RegisterRequest, db=Depends(get_database)):
    """Register a new patient account"""
    try:
        # Check DB is available
        if db is None:
            raise HTTPException(
                status_code=503,
                detail="Database unavailable. Please try again later."
            )

        # Check duplicate email
        existing = await db.users.find_one({"email": data.email.lower()})
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email already exists"
            )

        # Hash password
        try:
            hashed = hash_password(data.password)
        except Exception as e:
            logger.error(f"Password hashing failed: {e}")
            raise HTTPException(status_code=500, detail="Failed to process password")

        # Build user document
        now = datetime.utcnow()
        user_doc = {
            "full_name": data.full_name,
            "email": data.email.lower(),
            "password_hash": hashed,
            "phone": data.phone,
            "date_of_birth": data.date_of_birth,
            "nationality": data.nationality,
            "gender": data.gender,
            "role": "patient",
            "is_active": True,
            "is_verified": False,
            "created_at": now,
            "updated_at": now,
            "profile_complete": False,
            "reports_count": 0,
            "matches_count": 0,
        }

        # Insert into MongoDB
        result = await db.users.insert_one(user_doc)
        user_doc["_id"] = result.inserted_id

        # Create JWT
        token = create_access_token({
            "sub": str(result.inserted_id),
            "role": "patient"
        })

        # Log activity (non-blocking)
        try:
            await db.activity_logs.insert_one({
                "user_id": str(result.inserted_id),
                "action": "register",
                "timestamp": now,
            })
        except Exception:
            pass  # Don't fail registration if logging fails

        logger.info(f"New user registered: {data.email}")

        return {
            "access_token": token,
            "token_type": "bearer",
            "user": serialize_user(user_doc),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Registration failed: {str(e)}"
        )


@router.post("/login")
async def login(data: LoginRequest, db=Depends(get_database)):
    """Authenticate user and return JWT"""
    try:
        if db is None:
            raise HTTPException(status_code=503, detail="Database unavailable")

        user = await db.users.find_one({"email": data.email.lower()})

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

        if not verify_password(data.password, user.get("password_hash", "")):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

        if not user.get("is_active", True):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account has been deactivated"
            )

        # Update last login (non-blocking)
        try:
            await db.users.update_one(
                {"_id": user["_id"]},
                {"$set": {"last_login": datetime.utcnow()}}
            )
        except Exception:
            pass

        token = create_access_token({
            "sub": str(user["_id"]),
            "role": user.get("role", "patient")
        })

        logger.info(f"User logged in: {data.email}")

        return {
            "access_token": token,
            "token_type": "bearer",
            "user": serialize_user(user),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")


@router.get("/me")
async def get_me(current_user=Depends(get_current_user)):
    """Get current user profile"""
    return serialize_user(current_user)


@router.post("/forgot-password")
async def forgot_password(data: ForgotPasswordRequest, db=Depends(get_database)):
    """Send password reset link"""
    try:
        if db is not None:
            user = await db.users.find_one({"email": data.email.lower()})
            if user:
                reset_token = create_access_token({
                    "sub": str(user["_id"]),
                    "type": "reset"
                })
                await db.password_resets.insert_one({
                    "user_id": str(user["_id"]),
                    "token": reset_token,
                    "created_at": datetime.utcnow(),
                    "used": False,
                })
    except Exception as e:
        logger.error(f"Forgot password error: {e}")

    # Always return success (prevent email enumeration)
    return {"message": "If an account exists with this email, a reset link has been sent."}


@router.put("/me")
async def update_profile(
    update_data: dict,
    current_user=Depends(get_current_user),
    db=Depends(get_database)
):
    """Update user profile"""
    try:
        if db is None:
            raise HTTPException(status_code=503, detail="Database unavailable")

        forbidden = {"password_hash", "role", "email", "_id", "id"}
        safe_update = {k: v for k, v in update_data.items() if k not in forbidden}
        safe_update["updated_at"] = datetime.utcnow()

        await db.users.update_one(
            {"_id": ObjectId(current_user["id"])},
            {"$set": safe_update}
        )
        updated = await db.users.find_one({"_id": ObjectId(current_user["id"])})
        return serialize_user(updated)
    except Exception as e:
        logger.error(f"Profile update error: {e}")
        raise HTTPException(status_code=500, detail="Failed to update profile")
