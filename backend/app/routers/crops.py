"""
app/routers/crops.py — CRUD endpoints for crop management.
"""
from fastapi import APIRouter, HTTPException, Depends
from app.models.crop import CropCreate, CropUpdate, CropOut
from app.routers.auth import get_current_user
from app.database import get_db
from app.utils.helpers import utc_now, doc_to_dict, str_to_objectid
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/crops", tags=["Crops"])


def _crop_out(doc: dict) -> CropOut:
    return CropOut(
        id=doc["id"],
        name=doc["name"],
        field_id=doc["field_id"],
        planting_date=str(doc["planting_date"]),
        soil_type=doc.get("soil_type"),
        growth_stage=doc.get("growth_stage", "seedling"),
        variety=doc.get("variety"),
        notes=doc.get("notes"),
        moisture_threshold_low=doc.get("moisture_threshold_low", 30.0),
        moisture_threshold_high=doc.get("moisture_threshold_high", 80.0),
        owner_id=doc["owner_id"],
        created_at=doc["created_at"],
    )


async def _assert_field_owned(field_id: str, owner_id: str):
    """Raise 404 if the field does not belong to the owner."""
    db = get_db()
    try:
        oid = str_to_objectid(field_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid field ID.")
    field = await db.fields.find_one({"_id": oid, "owner_id": owner_id})
    if not field:
        raise HTTPException(status_code=404, detail="Field not found or access denied.")


@router.get("", response_model=list[CropOut])
async def list_crops(field_id: str | None = None, current_user: dict = Depends(get_current_user)):
    """List all crops for the current user, optionally filtered by field."""
    db = get_db()
    query: dict = {"owner_id": current_user["id"]}
    if field_id:
        query["field_id"] = field_id
    cursor = db.crops.find(query).sort("created_at", -1)
    docs = await cursor.to_list(length=500)
    return [_crop_out(doc_to_dict(d)) for d in docs]


@router.post("", response_model=CropOut, status_code=201)
async def create_crop(data: CropCreate, current_user: dict = Depends(get_current_user)):
    """Create a new crop record linked to a field owned by the current user."""
    await _assert_field_owned(data.field_id, current_user["id"])
    db = get_db()
    doc = {
        **data.model_dump(),
        "planting_date": data.planting_date.isoformat(),
        "owner_id": current_user["id"],
        "created_at": utc_now(),
    }
    result = await db.crops.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _crop_out(doc_to_dict(doc))


@router.put("/{crop_id}", response_model=CropOut)
async def update_crop(crop_id: str, data: CropUpdate, current_user: dict = Depends(get_current_user)):
    """Update a crop record."""
    db = get_db()
    try:
        oid = str_to_objectid(crop_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid crop ID.")
    updates = data.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update.")
    result = await db.crops.find_one_and_update(
        {"_id": oid, "owner_id": current_user["id"]},
        {"$set": updates},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Crop not found.")
    return _crop_out(doc_to_dict(result))


@router.delete("/{crop_id}", status_code=204)
async def delete_crop(crop_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a crop record."""
    db = get_db()
    try:
        oid = str_to_objectid(crop_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid crop ID.")
    result = await db.crops.delete_one({"_id": oid, "owner_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Crop not found.")
