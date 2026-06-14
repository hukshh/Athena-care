from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

client: AsyncIOMotorClient = None
database = None


async def connect_db():
    global client, database
    try:
        client = AsyncIOMotorClient(
            settings.MONGODB_URL,
            serverSelectionTimeoutMS=5000,
        )
        database = client[settings.DATABASE_NAME]
        await client.admin.command("ping")
        logger.info(f"✅ Connected to MongoDB: {settings.DATABASE_NAME}")
        await create_indexes()
    except Exception as e:
        logger.error(f"❌ MongoDB connection failed: {e}")
        # Don't raise — allow app to start even without DB (uses mock data)
        logger.warning("⚠️  Running without database — some features will use mock data")


async def disconnect_db():
    global client
    if client:
        client.close()
        logger.info("Disconnected from MongoDB")


async def create_indexes():
    """Create database indexes"""
    try:
        await database.users.create_index("email", unique=True)
        await database.users.create_index("role")
        await database.hospitals.create_index("country")
        await database.hospitals.create_index("specialty")
        await database.doctors.create_index("specialty")
        await database.reports.create_index("user_id")
        await database.chat_history.create_index("user_id")
        logger.info("✅ Database indexes created")
    except Exception as e:
        logger.warning(f"Index creation warning: {e}")


def get_database():
    """Dependency — returns database instance"""
    return database
