"""
app/services/irrigation_service.py — rule-based advisory irrigation recommendation engine.

ADVISORY NOTICE: Recommendations are generated using configurable thresholds and
forecast data. They are not the output of a validated crop-water-demand model.
Always cross-check with local agronomic expertise.
"""
import logging
from app.database import get_db
from app.utils.helpers import utc_now, doc_to_dict

logger = logging.getLogger(__name__)

ADVISORY = (
    "This recommendation is advisory only and based on configurable thresholds. "
    "Verify with local agronomic knowledge before acting."
)


async def generate_recommendation(field_id: str, owner_id: str) -> dict:
    """
    Generate and persist an irrigation recommendation for a field.
    Rules (evaluated in priority order):
      1. If soil moisture < crop threshold_low  → irrigation likely needed
      2. If rainfall forecast >= 5 mm tomorrow  → reassess after rainfall
      3. If soil moisture < 40%               → check irrigation needs
      4. Otherwise                             → no immediate action required
    """
    db = get_db()

    # --- Latest sensor reading ---
    reading_doc = await db.sensor_readings.find_one(
        {"field_id": field_id},
        sort=[("timestamp", -1)]
    )
    moisture = reading_doc.get("soil_moisture") if reading_doc else None

    # --- Active crop for this field (newest) ---
    crop_doc = await db.crops.find_one(
        {"field_id": field_id, "owner_id": owner_id},
        sort=[("created_at", -1)]
    )
    threshold_low = crop_doc.get("moisture_threshold_low", 30.0) if crop_doc else 30.0
    threshold_high = crop_doc.get("moisture_threshold_high", 80.0) if crop_doc else 80.0
    crop_name = crop_doc.get("name") if crop_doc else None
    growth_stage = crop_doc.get("growth_stage") if crop_doc else None

    # --- Latest weather record for this field ---
    weather_doc = await db.weather_records.find_one(
        {"field_id": field_id},
        sort=[("recorded_at", -1)]
    )
    tomorrow_rain = None
    if weather_doc and weather_doc.get("daily"):
        daily = weather_doc["daily"]
        if len(daily) > 1:
            tomorrow_rain = daily[1].get("precipitation_sum")

    # --- Apply rules ---
    if moisture is not None and moisture < threshold_low:
        rec = "Irrigation may be needed"
        reason = (
            f"Soil moisture ({moisture:.1f}%) is below the configured low threshold "
            f"({threshold_low:.1f}%) for "
            f"{'crop ' + crop_name if crop_name else 'this field'}."
        )
        if growth_stage:
            reason += f" Growth stage: {growth_stage}."
        severity = "high"
    elif tomorrow_rain is not None and tomorrow_rain >= 5:
        rec = "Rainfall is forecast — reassess watering"
        reason = (
            f"Significant rainfall ({tomorrow_rain:.1f} mm) is forecast for tomorrow. "
            "Consider delaying irrigation to avoid over-watering."
        )
        severity = "low"
    elif moisture is not None and moisture < 40:
        rec = "Check irrigation needs"
        reason = (
            f"Soil moisture ({moisture:.1f}%) is moderately low. "
            "Monitor over the next 24 hours."
        )
        severity = "medium"
    else:
        rec = "No immediate irrigation action required"
        reason = (
            f"Soil moisture "
            + (f"({moisture:.1f}%)" if moisture is not None else "(no recent reading)")
            + " appears adequate based on current thresholds."
        )
        severity = "none"

    doc = {
        "field_id": field_id,
        "owner_id": owner_id,
        "crop_id": str(crop_doc["_id"]) if crop_doc else None,
        "recommendation": rec,
        "reason": reason,
        "severity": severity,
        "soil_moisture_at_time": moisture,
        "rainfall_forecast_mm": tomorrow_rain,
        "advisory_note": ADVISORY,
        "created_at": utc_now(),
    }

    result = await db.irrigation_recommendations.insert_one(doc)
    doc["_id"] = result.inserted_id
    return doc_to_dict(doc)


async def get_recommendation_history(field_id: str, owner_id: str, limit: int = 20, skip: int = 0):
    """Return paginated recommendation history for a field."""
    db = get_db()
    cursor = db.irrigation_recommendations.find(
        {"field_id": field_id, "owner_id": owner_id}
    ).sort("created_at", -1).skip(skip).limit(limit)
    docs = await cursor.to_list(length=limit)
    return [doc_to_dict(d) for d in docs]
