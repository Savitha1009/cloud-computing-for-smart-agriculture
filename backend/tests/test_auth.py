"""
tests/test_auth.py — tests for authentication endpoints.
"""
import pytest
import pytest_asyncio


@pytest.mark.asyncio
async def test_register_success(client, sample_user):
    resp = await client.post("/api/auth/register", json=sample_user)
    assert resp.status_code == 201
    data = resp.json()
    assert "access_token" in data
    assert data["user"]["email"] == sample_user["email"]
    assert data["user"]["role"] == "farmer"


@pytest.mark.asyncio
async def test_register_duplicate_email(client, sample_user):
    await client.post("/api/auth/register", json=sample_user)
    resp = await client.post("/api/auth/register", json=sample_user)
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_login_success(client, sample_user):
    await client.post("/api/auth/register", json=sample_user)
    resp = await client.post("/api/auth/login", json={
        "email": sample_user["email"],
        "password": sample_user["password"],
    })
    assert resp.status_code == 200
    assert "access_token" in resp.json()


@pytest.mark.asyncio
async def test_login_wrong_password(client, sample_user):
    await client.post("/api/auth/register", json=sample_user)
    resp = await client.post("/api/auth/login", json={
        "email": sample_user["email"],
        "password": "wrongpassword",
    })
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_get_me_requires_auth(client):
    resp = await client.get("/api/auth/me")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_get_me_with_token(client, sample_user):
    reg = await client.post("/api/auth/register", json=sample_user)
    token = reg.json()["access_token"]
    resp = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["email"] == sample_user["email"]


@pytest.mark.asyncio
async def test_register_short_password(client, sample_user):
    bad = {**sample_user, "password": "short", "email": "new@test.com"}
    resp = await client.post("/api/auth/register", json=bad)
    assert resp.status_code == 422
