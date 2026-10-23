"""
app/services/weather_service.py — fetches and caches weather data from Open-Meteo.
Cache TTL: 10 minutes (reduces redundant external calls).
"""
import httpx
import logging
from datetime import datetime, timedelta, timezone
from app.config import settings
from app.database import get_db
from app.utils.helpers import utc_now

logger = logging.getLogger(__name__)

_CACHE: dict = {}          # { field_id: {"data": {...}, "expires": datetime} }
CACHE_TTL_MINUTES = 10


async def get_weather(latitude: float, longitude: float, field_id: str) -> dict:
    """
    Return current weather + 7-day forecast for the given coordinates.
    Uses an in-process cache keyed by field_id to avoid hammering Open-Meteo.
    """
    # Check cache
    cached = _CACHE.get(field_id)
    if cached and cached["expires"] > datetime.now(timezone.utc):
        logger.debug("Weather cache hit for field %s", field_id)
        return cached["data"]

    url = f"{settings.OPEN_METEO_BASE_URL}/forecast"
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "current": [
            "temperature_2m",
            "relative_humidity_2m",
            "precipitation",
            "wind_speed_10m",
            "weather_code",
        ],
        "daily": [
            "temperature_2m_max",
            "temperature_2m_min",
            "precipitation_sum",
            "weather_code",
        ],
        "timezone": "auto",
        "forecast_days": 7,
    }

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            raw = response.json()
    except httpx.TimeoutException:
        logger.warning("Open-Meteo request timed out for field %s", field_id)
        raise RuntimeError("Weather API timed out. Please try again later.")
    except httpx.HTTPStatusError as exc:
        logger.error("Open-Meteo HTTP error %s for field %s", exc.response.status_code, field_id)
        raise RuntimeError(f"Weather API returned an error: {exc.response.status_code}")
    except Exception as exc:
        logger.error("Unexpected weather fetch error: %s", exc)
        raise RuntimeError("Unable to retrieve weather data at this time.")

    data = _parse_weather(raw)

    # Persist to MongoDB
    try:
        db = get_db()
        await db.weather_records.insert_one({
            "field_id": field_id,
            "latitude": latitude,
            "longitude": longitude,
            "current": data["current"],
            "daily": data["daily"],
            "recorded_at": utc_now(),
        })
    except Exception as exc:
        logger.warning("Could not persist weather record: %s", exc)

    # Update cache
    _CACHE[field_id] = {
        "data": data,
        "expires": datetime.now(timezone.utc) + timedelta(minutes=CACHE_TTL_MINUTES),
    }
    return data


def _parse_weather(raw: dict) -> dict:
    current_data = raw.get("current", {})
    current_units = raw.get("current_units", {})
    daily_data = raw.get("daily", {})

    current = {
        "temperature": current_data.get("temperature_2m"),
        "humidity": current_data.get("relative_humidity_2m"),
        "precipitation": current_data.get("precipitation"),
        "wind_speed": current_data.get("wind_speed_10m"),
        "weather_code": current_data.get("weather_code"),
        "time": current_data.get("time"),
    }

    times = daily_data.get("time", [])
    daily = []
    for i, t in enumerate(times):
        daily.append({
            "date": t,
            "temp_max": daily_data.get("temperature_2m_max", [None] * len(times))[i],
            "temp_min": daily_data.get("temperature_2m_min", [None] * len(times))[i],
            "precipitation_sum": daily_data.get("precipitation_sum", [None] * len(times))[i],
            "weather_code": daily_data.get("weather_code", [None] * len(times))[i],
        })

    return {"current": current, "daily": daily}
