"""
app/routers/weather.py — proxy endpoint for Open-Meteo weather data.
Uses the weather_service cache to minimise external API calls.
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from app.routers.auth import get_current_user
from app.services.weather_service import get_weather
from app.database import get_db
from app.utils.helpers import str_to_objectid, doc_to_dict
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/weather", tags=["Weather"])


@router.get("")
async def weather(
    field_id: str = Query(..., description="Field ID — used to fetch lat/lon and cache the response"),
    current_user: dict = Depends(get_current_user)
):
    """
    Return current weather and 7-day forecast for the given field's coordinates.
    Requires the field to be owned by the authenticated user.
    """
    db = get_db()
    try:
        oid = str_to_objectid(field_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid field ID.")

    field = await db.fields.find_one({"_id": oid, "owner_id": current_user["id"]})
    if not field:
        raise HTTPException(status_code=404, detail="Field not found or access denied.")

    try:
        data = await get_weather(field["latitude"], field["longitude"], field_id)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))

    return {
        "field_id": field_id,
        "field_name": field.get("name"),
        "latitude": field["latitude"],
        "longitude": field["longitude"],
        **data,
    }
