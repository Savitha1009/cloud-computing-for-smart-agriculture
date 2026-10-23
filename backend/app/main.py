"""
app/main.py — FastAPI application entry point.
Registers all routers, sets up CORS, and manages database lifecycle.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.config import settings
from app.database import connect_db, close_db
from app.routers import auth, dashboard, fields, crops, sensors, weather, irrigation, alerts
import logging

# --- Logging ---
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage DB connection across application lifecycle."""
    await connect_db()
    yield
    await close_db()


app = FastAPI(
    title="Smart Agriculture API",
    description=(
        "Cloud-based REST API for smart agricultural monitoring. "
        "Provides sensor ingestion, weather forecasts, irrigation advisories, and alert management."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Routers ---
app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(fields.router)
app.include_router(crops.router)
app.include_router(sensors.router)
app.include_router(weather.router)
app.include_router(irrigation.router)
app.include_router(alerts.router)


@app.get("/", tags=["Health"])
async def health_check():
    return {"status": "ok", "message": "Smart Agriculture API is running."}


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok"}
