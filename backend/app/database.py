"""
app/database.py — manages the async Motor MongoDB connection.
Call connect_db() at startup and close_db() at shutdown.
"""
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings
import logging

logger = logging.getLogger(__name__)

class Database:
    client: AsyncIOMotorClient = None
    db = None

db_instance = Database()


async def connect_db():
    """Open the MongoDB connection pool."""
    try:
        db_instance.client = AsyncIOMotorClient(
            settings.MONGODB_URL,
            serverSelectionTimeoutMS=5000,
        )
        db_instance.db = db_instance.client[settings.MONGODB_DB_NAME]
        # Verify connectivity
        await db_instance.client.admin.command("ping")
        logger.info("✅ Connected to MongoDB Atlas — database: %s", settings.MONGODB_DB_NAME)
        await _create_indexes()
    except Exception as exc:
        logger.error("❌ MongoDB connection failed: %s", exc)
        raise


async def close_db():
    """Close the MongoDB connection pool."""
    if db_instance.client:
        db_instance.client.close()
        logger.info("MongoDB connection closed.")


async def _create_indexes():
    """Create indexes that support the most common query patterns."""
    db = db_instance.db
    # users
    await db.users.create_index("email", unique=True)
    # fields
    await db.fields.create_index("owner_id")
    # crops
    await db.crops.create_index([("owner_id", 1), ("field_id", 1)])
    # sensor_readings
    await db.sensor_readings.create_index([("field_id", 1), ("timestamp", -1)])
    # weather_records
    await db.weather_records.create_index([("field_id", 1), ("recorded_at", -1)])
    # irrigation_recommendations
    await db.irrigation_recommendations.create_index([("field_id", 1), ("created_at", -1)])
    # alerts
    await db.alerts.create_index([("owner_id", 1), ("created_at", -1)])
    logger.info("Database indexes verified/created.")


def get_db():
    """Return the active database handle."""
    return db_instance.db
