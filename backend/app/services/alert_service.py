"""
app/services/alert_service.py — generates and persists alerts based on sensor readings.
"""
import logging
from datetime import timedelta
from app.database import get_db
from app.utils.helpers import utc_now, doc_to_dict

logger = logging.getLogger(__name__)

# Configurable alert thresholds (could be moved to per-field config in a future version)
MOISTURE_LOW_THRESHOLD = 25.0     # percent
TEMP_HIGH_THRESHOLD = 38.0        # Celsius
DATA_STALE_HOURS = 6              # hours without a new reading
HEAVY_RAIN_THRESHOLD_MM = 20.0   # mm forecast


async def check_and_create_alerts(reading: dict, field: dict, owner_id: str):
    """
    Evaluate a new sensor reading against thresholds and create alerts as needed.
    Avoids creating duplicate active alerts of the same type for the same field.
    """
    db = get_db()
    field_id = reading["field_id"]
    field_name = field.get("name", "Unknown Field")

    async def _alert_exists(alert_type: str) -> bool:
        existing = await db.alerts.find_one({
            "field_id": field_id,
            "alert_type": alert_type,
            "status": "active",
        })
        return existing is not None

    async def _create(alert_type: str, severity: str, message: str):
        if await _alert_exists(alert_type):
            return
        now = utc_now()
        await db.alerts.insert_one({
            "owner_id": owner_id,
            "field_id": field_id,
            "field_name": field_name,
            "alert_type": alert_type,
            "severity": severity,
            "message": message,
            "status": "active",
            "created_at": now,
            "updated_at": now,
        })
        logger.info("Alert created — type=%s field=%s", alert_type, field_id)

    moisture = reading.get("soil_moisture")
    temp = reading.get("soil_temperature")

    if moisture is not None and moisture < MOISTURE_LOW_THRESHOLD:
        await _create(
            "low_moisture",
            "warning",
            f"Soil moisture ({moisture:.1f}%) is below {MOISTURE_LOW_THRESHOLD}% "
            f"in field '{field_name}'.",
        )

    if temp is not None and temp > TEMP_HIGH_THRESHOLD:
        await _create(
            "high_temp",
            "critical",
            f"Soil temperature ({temp:.1f}°C) exceeds {TEMP_HIGH_THRESHOLD}°C "
            f"in field '{field_name}'.",
        )


async def check_stale_data_alerts(owner_id: str):
    """Check all fields for stale sensor data and create alerts."""
    db = get_db()
    stale_cutoff = utc_now() - timedelta(hours=DATA_STALE_HOURS)
    fields_cursor = db.fields.find({"owner_id": owner_id})
    fields = await fields_cursor.to_list(length=100)

    for field in fields:
        field_id = str(field["_id"])
        latest = await db.sensor_readings.find_one(
            {"field_id": field_id},
            sort=[("timestamp", -1)]
        )
        if latest is None or latest["timestamp"] < stale_cutoff:
            if not await db.alerts.find_one({"field_id": field_id, "alert_type": "stale_data", "status": "active"}):
                now = utc_now()
                await db.alerts.insert_one({
                    "owner_id": owner_id,
                    "field_id": field_id,
                    "field_name": field.get("name", "Unknown"),
                    "alert_type": "stale_data",
                    "severity": "info",
                    "message": f"No sensor data received from field '{field.get('name')}' in the last {DATA_STALE_HOURS} hours.",
                    "status": "active",
                    "created_at": now,
                    "updated_at": now,
                })
