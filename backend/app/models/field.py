"""app/models/field.py — Pydantic models for agricultural field management."""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class FieldCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    location: str = Field(..., min_length=1, max_length=200)
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    area_hectares: float = Field(..., gt=0, le=100000)
    soil_type: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = Field(None, max_length=500)


class FieldUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    location: Optional[str] = Field(None, max_length=200)
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    area_hectares: Optional[float] = Field(None, gt=0)
    soil_type: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = Field(None, max_length=500)


class FieldOut(BaseModel):
    id: str
    name: str
    location: str
    latitude: float
    longitude: float
    area_hectares: float
    soil_type: Optional[str]
    description: Optional[str]
    owner_id: str
    created_at: datetime
