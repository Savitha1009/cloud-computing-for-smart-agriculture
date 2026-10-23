"""
simulator/sensor_simulator.py
=============================================================
IoT Sensor Data Simulator for Smart Agriculture Platform
=============================================================

This script generates realistic-looking agricultural sensor readings and
submits them to the backend API at a configurable interval.

ALL READINGS PRODUCED BY THIS SCRIPT ARE MARKED simulated=true.
They CANNOT be mistaken for readings from a physical sensor.

Usage:
------
  pip install requests python-dotenv
  # Set BACKEND_URL and JWT_TOKEN in .env or environment
  python sensor_simulator.py

Replacing with real ESP32 sensor data:
---------------------------------------
  1. Flash the ESP32 with MicroPython or Arduino code that reads from
     your soil moisture sensor (e.g. capacitive) and DHT22.
  2. POST the reading to POST /api/sensors/data with simulated=false
     and the Bearer token in the Authorization header.
  3. Remove or disable this script once real hardware is active.
"""
import os
import time
import random
import logging
import requests
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
logger = logging.getLogger("sensor_simulator")

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")
JWT_TOKEN = os.getenv("JWT_TOKEN", "")          # Required: login first and paste token
FIELD_ID = os.getenv("SIMULATOR_FIELD_ID", "")  # Required: field ID to post data to
INTERVAL_SECONDS = int(os.getenv("SIMULATOR_INTERVAL", "30"))

if not JWT_TOKEN or not FIELD_ID:
    raise SystemExit(
        "ERROR: Set JWT_TOKEN and SIMULATOR_FIELD_ID in your environment or .env file.\n"
        "  1. Login via POST /api/auth/login to get your JWT_TOKEN.\n"
        "  2. Create a field via POST /api/fields and use its ID as SIMULATOR_FIELD_ID."
    )

HEADERS = {"Authorization": f"Bearer {JWT_TOKEN}", "Content-Type": "application/json"}


def generate_reading() -> dict:
    """Generate realistic (not physically measured) agricultural sensor values."""
    hour = datetime.now(timezone.utc).hour
    # Soil moisture cycles — drier during midday
    base_moisture = 55 + 15 * (1 - abs(hour - 14) / 14)
    moisture = round(max(10, min(95, random.gauss(base_moisture, 8))), 2)

    # Temperature peaks midday
    base_temp = 22 + 10 * max(0, 1 - abs(hour - 13) / 13)
    soil_temp = round(random.gauss(base_temp, 2), 2)
    air_temp = round(soil_temp + random.gauss(2, 1), 2)

    return {
        "field_id": FIELD_ID,
        "soil_moisture": moisture,
        "soil_temperature": round(max(-10, min(80, soil_temp)), 2),
        "soil_ph": round(random.gauss(6.5, 0.4), 2),
        "air_temperature": round(max(-50, min(60, air_temp)), 2),
        "humidity": round(random.gauss(60, 10), 2),
        "simulated": True,   # ← always True for simulated data
    }


def post_reading(reading: dict):
    try:
        response = requests.post(
            f"{BACKEND_URL}/api/sensors/data",
            json=reading,
            headers=HEADERS,
            timeout=10,
        )
        response.raise_for_status()
        logger.info(
            "✅ [SIMULATED] Posted reading — moisture=%.1f%% soil_temp=%.1f°C pH=%.2f",
            reading["soil_moisture"], reading["soil_temperature"], reading["soil_ph"]
        )
    except requests.exceptions.ConnectionError:
        logger.error("❌ Cannot connect to backend at %s. Is it running?", BACKEND_URL)
    except requests.exceptions.HTTPError as exc:
        logger.error("❌ HTTP error: %s — %s", exc.response.status_code, exc.response.text)
    except Exception as exc:
        logger.error("❌ Unexpected error: %s", exc)


def main():
    logger.info("=" * 60)
    logger.info("Smart Agriculture — Sensor Simulator")
    logger.info("Backend : %s", BACKEND_URL)
    logger.info("Field ID: %s", FIELD_ID)
    logger.info("Interval: %d seconds", INTERVAL_SECONDS)
    logger.info("NOTE: All data is marked as SIMULATED.")
    logger.info("=" * 60)

    while True:
        reading = generate_reading()
        post_reading(reading)
        time.sleep(INTERVAL_SECONDS)


if __name__ == "__main__":
    main()
