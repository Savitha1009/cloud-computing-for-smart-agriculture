"""app/models/crop.py — Pydantic models for crop management."""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime


GROWTH_STAGES = ["seedling", "vegetative", "flowering", "fruiting", "harvest", "dormant"]


class CropCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    field_id: str
    planting_date: date
    soil_type: Optional[str] = Field(None, max_length=100)
    growth_stage: str = Field(default="seedling")
    variety: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = Field(None, max_length=500)
    # Configurable thresholds for irrigation decisions
    moisture_threshold_low: float = Field(default=30.0, ge=0, le=100)
    moisture_threshold_high: float = Field(default=80.0, ge=0, le=100)


class CropUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    soil_type: Optional[str] = Field(None, max_length=100)
    growth_stage: Optional[str] = None
    variety: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = Field(None, max_length=500)
    moisture_threshold_low: Optional[float] = Field(None, ge=0, le=100)
    moisture_threshold_high: Optional[float] = Field(None, ge=0, le=100)


class CropOut(BaseModel):
    id: str
    name: str
    field_id: str
    planting_date: str
    soil_type: Optional[str]
    growth_stage: str
    variety: Optional[str]
    notes: Optional[str]
    moisture_threshold_low: float
    moisture_threshold_high: float
    owner_id: str
    created_at: datetime
