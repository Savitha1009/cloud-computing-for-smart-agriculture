"""
app/routers/dashboard.py — aggregate stats endpoint for the main dashboard.
"""
from fastapi import APIRouter, Depends
from app.routers.auth import get_current_user
from app.database import get_db
from app.utils.helpers import doc_to_dict
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("")
async def get_dashboard(current_user: dict = Depends(get_current_user)):
    """
    Return aggregated statistics for the authenticated user's dashboard.
    All data originates from the database — no hard-coded values.
    """
    db = get_db()
    owner_id = current_user["id"]

    # Counts
    field_count = await db.fields.count_documents({"owner_id": owner_id})
    crop_count = await db.crops.count_documents({"owner_id": owner_id})
    active_alerts = await db.alerts.count_documents({"owner_id": owner_id, "status": "active"})

    # Collect all field IDs for this user
    field_docs = await db.fields.find({"owner_id": owner_id}, {"_id": 1}).to_list(length=200)
    field_ids = [str(f["_id"]) for f in field_docs]

    # Latest sensor reading across all fields
    latest_reading = None
    if field_ids:
        doc = await db.sensor_readings.find_one(
            {"field_id": {"$in": field_ids}},
            sort=[("timestamp", -1)]
        )
        if doc:
            latest_reading = doc_to_dict(doc)

    # Latest weather record across all fields
    latest_weather = None
    if field_ids:
        wdoc = await db.weather_records.find_one(
            {"field_id": {"$in": field_ids}},
            sort=[("recorded_at", -1)]
        )
        if wdoc:
            latest_weather = doc_to_dict(wdoc)

    # Recent alerts (5)
    alert_cursor = db.alerts.find({"owner_id": owner_id}).sort("created_at", -1).limit(5)
    recent_alerts = [doc_to_dict(d) for d in await alert_cursor.to_list(length=5)]

    # Recent recommendations (3)
    rec_cursor = db.irrigation_recommendations.find(
        {"owner_id": owner_id}
    ).sort("created_at", -1).limit(3)
    recent_recommendations = [doc_to_dict(d) for d in await rec_cursor.to_list(length=3)]

    return {
        "field_count": field_count,
        "crop_count": crop_count,
        "active_alerts": active_alerts,
        "latest_reading": latest_reading,
        "latest_weather": latest_weather,
        "recent_alerts": recent_alerts,
        "recent_recommendations": recent_recommendations,
    }
