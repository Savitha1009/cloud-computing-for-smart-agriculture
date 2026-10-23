"""
tests/conftest.py — shared pytest fixtures for all backend tests.
Uses in-memory-compatible test client and mocked DB where needed.
"""
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest_asyncio.fixture
async def client():
    """Async test client for the FastAPI app."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


@pytest.fixture
def sample_user():
    return {
        "name": "Test Farmer",
        "email": "farmer@test.com",
        "password": "securepass123",
        "role": "farmer",
    }


@pytest.fixture
def sample_field():
    return {
        "name": "North Field",
        "location": "Karnataka, India",
        "latitude": 13.0827,
        "longitude": 80.2707,
        "area_hectares": 2.5,
        "soil_type": "Loamy",
        "description": "Primary test field",
    }


@pytest.fixture
def sample_crop():
    return {
        "name": "Tomato",
        "planting_date": "2026-01-15",
        "soil_type": "Loamy",
        "growth_stage": "vegetative",
        "moisture_threshold_low": 30.0,
        "moisture_threshold_high": 80.0,
    }
