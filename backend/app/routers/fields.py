"""
app/routers/fields.py — CRUD endpoints for agricultural fields.
Field ownership is always derived from the authenticated JWT — never from client input.
"""
from fastapi import APIRouter, HTTPException, Depends, status
from app.models.field import FieldCreate, FieldUpdate, FieldOut
from app.routers.auth import get_current_user
from app.database import get_db
from app.utils.helpers import utc_now, doc_to_dict, str_to_objectid
from bson import ObjectId
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/fields", tags=["Fields"])


def _field_out(doc: dict) -> FieldOut:
    return FieldOut(**{
        "id": doc["id"],
        "name": doc["name"],
        "location": doc["location"],
        "latitude": doc["latitude"],
        "longitude": doc["longitude"],
        "area_hectares": doc["area_hectares"],
        "soil_type": doc.get("soil_type"),
        "description": doc.get("description"),
        "owner_id": doc["owner_id"],
        "created_at": doc["created_at"],
    })


@router.get("", response_model=list[FieldOut])
async def list_fields(current_user: dict = Depends(get_current_user)):
    """Return all fields owned by the authenticated user."""
    db = get_db()
    cursor = db.fields.find({"owner_id": current_user["id"]})
    docs = await cursor.to_list(length=200)
    return [_field_out(doc_to_dict(d)) for d in docs]


@router.post("", response_model=FieldOut, status_code=201)
async def create_field(data: FieldCreate, current_user: dict = Depends(get_current_user)):
    """Create a new field for the authenticated user."""
    db = get_db()
    doc = {
        **data.model_dump(),
        "owner_id": current_user["id"],   # ownership from JWT, never from client
        "created_at": utc_now(),
    }
    result = await db.fields.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _field_out(doc_to_dict(doc))


@router.get("/{field_id}", response_model=FieldOut)
async def get_field(field_id: str, current_user: dict = Depends(get_current_user)):
    """Fetch a single field — only if owned by the requester."""
    db = get_db()
    try:
        oid = str_to_objectid(field_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid field ID.")
    doc = await db.fields.find_one({"_id": oid, "owner_id": current_user["id"]})
    if not doc:
        raise HTTPException(status_code=404, detail="Field not found.")
    return _field_out(doc_to_dict(doc))


@router.put("/{field_id}", response_model=FieldOut)
async def update_field(field_id: str, data: FieldUpdate, current_user: dict = Depends(get_current_user)):
    """Update a field — only if owned by the requester."""
    db = get_db()
    try:
        oid = str_to_objectid(field_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid field ID.")
    updates = data.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update.")
    result = await db.fields.find_one_and_update(
        {"_id": oid, "owner_id": current_user["id"]},
        {"$set": updates},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Field not found.")
    return _field_out(doc_to_dict(result))


@router.delete("/{field_id}", status_code=204)
async def delete_field(field_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a field and its associated data — only if owned by the requester."""
    db = get_db()
    try:
        oid = str_to_objectid(field_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid field ID.")
    result = await db.fields.delete_one({"_id": oid, "owner_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Field not found.")
    # Cascade delete associated data
    await db.sensor_readings.delete_many({"field_id": field_id})
    await db.crops.delete_many({"field_id": field_id})
    await db.weather_records.delete_many({"field_id": field_id})
    await db.irrigation_recommendations.delete_many({"field_id": field_id})
    await db.alerts.delete_many({"field_id": field_id})
    logger.info("Field %s deleted by user %s (cascade complete)", field_id, current_user["id"])
