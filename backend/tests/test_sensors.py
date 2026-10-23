"""
tests/test_sensors.py — sensor data ingestion, validation and history tests.
"""
import pytest


async def _setup(client, email="sensor@test.com"):
    reg = await client.post("/api/auth/register", json={
        "name": "Farmer", "email": email, "password": "securepass123", "role": "farmer"
    })
    token = reg.json()["access_token"]
    field = await client.post("/api/fields", json={
        "name": "Sensor Field", "location": "Test", "latitude": 13.0, "longitude": 80.0,
        "area_hectares": 1.0
    }, headers={"Authorization": f"Bearer {token}"})
    return token, field.json()["id"]


@pytest.mark.asyncio
async def test_ingest_sensor_data(client):
    token, field_id = await _setup(client)
    resp = await client.post("/api/sensors/data", json={
        "field_id": field_id,
        "soil_moisture": 55.0,
        "soil_temperature": 24.5,
        "soil_ph": 6.8,
        "simulated": True,
    }, headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 201
    assert resp.json()["simulated"] is True


@pytest.mark.asyncio
async def test_invalid_moisture_rejected(client):
    token, field_id = await _setup(client, "inv@test.com")
    resp = await client.post("/api/sensors/data", json={
        "field_id": field_id,
        "soil_moisture": 150,   # invalid — > 100
        "soil_temperature": 24.5,
        "soil_ph": 6.8,
        "simulated": True,
    }, headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_latest_reading(client):
    token, field_id = await _setup(client, "latest@test.com")
    await client.post("/api/sensors/data", json={
        "field_id": field_id, "soil_moisture": 40.0,
        "soil_temperature": 22.0, "soil_ph": 6.5, "simulated": True,
    }, headers={"Authorization": f"Bearer {token}"})
    resp = await client.get(f"/api/sensors/latest?field_id={field_id}",
                            headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["soil_moisture"] == 40.0


@pytest.mark.asyncio
async def test_sensor_history_pagination(client):
    token, field_id = await _setup(client, "hist@test.com")
    for i in range(5):
        await client.post("/api/sensors/data", json={
            "field_id": field_id, "soil_moisture": 50.0 + i,
            "soil_temperature": 20.0, "soil_ph": 6.5, "simulated": True,
        }, headers={"Authorization": f"Bearer {token}"})
    resp = await client.get(f"/api/sensors/history?field_id={field_id}&limit=3",
                            headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 5
    assert len(body["data"]) == 3
