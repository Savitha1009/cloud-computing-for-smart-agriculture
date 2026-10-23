"""app/models/alert.py — Pydantic models for farm alerts."""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class AlertOut(BaseModel):
    id: str
    owner_id: str
    field_id: str
    field_name: Optional[str]
    alert_type: str    # e.g. "low_moisture" | "high_temp" | "stale_data" | "heavy_rain"
    severity: str      # "info" | "warning" | "critical"
    message: str
    status: str        # "active" | "read" | "resolved"
    created_at: datetime
    updated_at: Optional[datetime]


class AlertStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(read|resolved)$")
