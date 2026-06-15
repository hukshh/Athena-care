"""
AthenaCare AI — FastAPI Backend
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging
import sys

from app.core.config import settings
from app.core.database import connect_db, disconnect_db
from app.api.v1.router import api_router

# ── Logging ─────────────────────────────────────────────────────────────────
if settings.is_production:
    # Structured JSON-style logging for production (easier to parse in log aggregators)
    logging.basicConfig(
        level=logging.WARNING,
        format='{"time":"%(asctime)s","name":"%(name)s","level":"%(levelname)s","msg":"%(message)s"}',
        stream=sys.stdout,
    )
else:
    logging.basicConfig(
        level=logging.DEBUG if settings.DEBUG else logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )
logger = logging.getLogger(__name__)


# ── Rate Limiting ───────────────────────────────────────────────────────────
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[f"{settings.RATE_LIMIT_PER_MINUTE}/minute"],
)


# ── Lifespan ────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    import traceback
    logger.info("🚀 AthenaCare AI starting up...")
    logger.info(f"   Environment: {settings.ENVIRONMENT}")
    try:
        await connect_db()
        logger.info("✅ Database connected")
    except Exception as e:
        logger.error(f"❌ Startup Error: {traceback.format_exc()}")
    yield
    logger.info("🛑 Shutting down...")
    try:
        await disconnect_db()
    except Exception as e:
        logger.error(f"❌ Shutdown Error: {traceback.format_exc()}")


# ── App ─────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="AthenaCare AI API",
    description="AI-Powered Medical Tourism & Hospital Recommendation Platform",
    version="1.0.0",
    # Disable API docs in production
    docs_url="/docs" if not settings.is_production else None,
    redoc_url="/redoc" if not settings.is_production else None,
    lifespan=lifespan,
    redirect_slashes=False,
)

# Attach rate limiter to app
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS — use configured origins, no wildcard ──────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# ── Routes ───────────────────────────────────────────────────────────────────
app.include_router(api_router, prefix="/api/v1")


@app.get("/")
async def root():
    return {"name": "AthenaCare AI API", "version": "1.0.0", "status": "operational"}


@app.get("/health")
async def health_check():
    """Health check — verifies database connectivity for orchestrators."""
    from app.core.database import get_database
    db = get_database()
    db_status = "disconnected"

    if db is not None:
        try:
            # Fast ping to verify connection is alive
            await db.command("ping")
            db_status = "connected"
        except Exception:
            db_status = "error"

    status = "healthy" if db_status == "connected" else "degraded"
    return {
        "status": status,
        "database": db_status,
        "environment": settings.ENVIRONMENT,
    }


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import traceback
    tb = traceback.format_exc()
    logger.error(f"Unhandled exception on {request.method} {request.url}: {tb}")

    # Only expose error details in development
    if settings.DEBUG and not settings.is_production:
        detail = str(exc) if str(exc) else "Internal server error"
    else:
        detail = "Internal server error"

    return JSONResponse(
        status_code=500,
        content={"detail": detail},
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
