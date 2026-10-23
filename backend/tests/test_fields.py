"""
tests/test_fields.py — CRUD tests for field management including ownership enforcement.
"""
import pytest


async def _register_and_token(client, email="f1@test.com"):
    resp = await client.post("/api/auth/register", json={
        "name": "Farmer", "email": email, "password": "securepass123", "role": "farmer"
    })
    return resp.json()["access_token"]


@pytest.mark.asyncio
async def test_create_field(client, sample_field):
    token = await _register_and_token(client)
    resp = await client.post("/api/fields", json=sample_field,
                             headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 201
    assert resp.json()["name"] == sample_field["name"]


@pytest.mark.asyncio
async def test_list_fields_empty(client):
    token = await _register_and_token(client, "empty@test.com")
    resp = await client.get("/api/fields", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json() == []


@pytest.mark.asyncio
async def test_update_field(client, sample_field):
    token = await _register_and_token(client, "update@test.com")
    create = await client.post("/api/fields", json=sample_field,
                               headers={"Authorization": f"Bearer {token}"})
    fid = create.json()["id"]
    resp = await client.put(f"/api/fields/{fid}", json={"name": "Updated Field"},
                            headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["name"] == "Updated Field"


@pytest.mark.asyncio
async def test_delete_field(client, sample_field):
    token = await _register_and_token(client, "del@test.com")
    create = await client.post("/api/fields", json=sample_field,
                               headers={"Authorization": f"Bearer {token}"})
    fid = create.json()["id"]
    resp = await client.delete(f"/api/fields/{fid}",
                               headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 204


@pytest.mark.asyncio
async def test_other_user_cannot_access_field(client, sample_field):
    """Security: user A cannot read user B's field."""
    token_a = await _register_and_token(client, "a@test.com")
    token_b = await _register_and_token(client, "b@test.com")
    create = await client.post("/api/fields", json=sample_field,
                               headers={"Authorization": f"Bearer {token_a}"})
    fid = create.json()["id"]
    resp = await client.get(f"/api/fields/{fid}",
                            headers={"Authorization": f"Bearer {token_b}"})
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_field_requires_auth(client, sample_field):
    resp = await client.post("/api/fields", json=sample_field)
    assert resp.status_code == 401
