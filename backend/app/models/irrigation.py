"""app/models/irrigation.py — Pydantic models for irrigation recommendations."""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class IrrigationRecommendationOut(BaseModel):
    id: str
    field_id: str
    crop_id: Optional[str]
    recommendation: str          # e.g. "Irrigation may be needed"
    reason: str                  # plain-language explanation
    severity: str                # "low" | "medium" | "high" | "none"
    soil_moisture_at_time: Optional[float]
    rainfall_forecast_mm: Optional[float]
    advisory_note: str = (
        "This recommendation is advisory only and is based on configurable thresholds. "
        "Always verify with local agronomic knowledge before making irrigation decisions."
    )
    created_at: datetime
