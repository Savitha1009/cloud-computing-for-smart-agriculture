"""
app/routers/sensors.py — ingest and query sensor readings.
Validates data, triggers alert checks, and stores readings in MongoDB.
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from app.models.sensor import SensorDataIn, SensorReadingOut
from app.routers.auth import get_current_user
from app.database import get_db
from app.services.alert_service import check_and_create_alerts
from app.utils.helpers import utc_now, doc_to_dict, str_to_objectid
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/sensors", tags=["Sensors"])


async def _assert_field_owned(field_id: str, owner_id: str) -> dict:
    db = get_db()
    try:
        oid = str_to_objectid(field_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid field ID.")
    field = await db.fields.find_one({"_id": oid, "owner_id": owner_id})
    if not field:
        raise HTTPException(status_code=404, detail="Field not found or access denied.")
    return doc_to_dict(field)


@router.post("/data", response_model=SensorReadingOut, status_code=201)
async def ingest_sensor_data(data: SensorDataIn, current_user: dict = Depends(get_current_user)):
    """
    Ingest a sensor reading for a field owned by the current user.
    Simulated readings must set simulated=True.
    """
    field = await _assert_field_owned(data.field_id, current_user["id"])
    db = get_db()

    doc = {
        **data.model_dump(),
        "timestamp": utc_now(),
    }
    result = await db.sensor_readings.insert_one(doc)
    doc["_id"] = result.inserted_id
    reading = doc_to_dict(doc)

    # Fire-and-forget alert checks (non-blocking for response)
    try:
        await check_and_create_alerts(reading, field, current_user["id"])
    except Exception as exc:
        logger.warning("Alert check failed: %s", exc)

    return SensorReadingOut(
        id=reading["id"],
        field_id=reading["field_id"],
        soil_moisture=reading["soil_moisture"],
        soil_temperature=reading["soil_temperature"],
        soil_ph=reading["soil_ph"],
        air_temperature=reading.get("air_temperature"),
        humidity=reading.get("humidity"),
        simulated=reading["simulated"],
        timestamp=doc["timestamp"],
    )


@router.get("/latest", response_model=SensorReadingOut | None)
async def get_latest_reading(
    field_id: str = Query(..., description="Field ID to query"),
    current_user: dict = Depends(get_current_user)
):
    """Return the most recent sensor reading for a field."""
    await _assert_field_owned(field_id, current_user["id"])
    db = get_db()
    doc = await db.sensor_readings.find_one(
        {"field_id": field_id},
        sort=[("timestamp", -1)]
    )
    if not doc:
        return None
    r = doc_to_dict(doc)
    return SensorReadingOut(
        id=r["id"], field_id=r["field_id"],
        soil_moisture=r["soil_moisture"], soil_temperature=r["soil_temperature"],
        soil_ph=r["soil_ph"], air_temperature=r.get("air_temperature"),
        humidity=r.get("humidity"), simulated=r["simulated"], timestamp=doc["timestamp"],
    )


@router.get("/history")
async def get_sensor_history(
    field_id: str = Query(...),
    limit: int = Query(default=50, ge=1, le=500),
    skip: int = Query(default=0, ge=0),
    current_user: dict = Depends(get_current_user)
):
    """Return paginated historical sensor readings for a field."""
    await _assert_field_owned(field_id, current_user["id"])
    db = get_db()
    cursor = db.sensor_readings.find({"field_id": field_id})\
        .sort("timestamp", -1).skip(skip).limit(limit)
    docs = await cursor.to_list(length=limit)
    total = await db.sensor_readings.count_documents({"field_id": field_id})
    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "data": [doc_to_dict(d) for d in docs],
    }
