"""
app/routers/irrigation.py — generate and retrieve irrigation recommendations.
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from app.routers.auth import get_current_user
from app.services.irrigation_service import generate_recommendation, get_recommendation_history
from app.database import get_db
from app.utils.helpers import str_to_objectid
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/irrigation", tags=["Irrigation"])


async def _assert_field_owned(field_id: str, owner_id: str):
    db = get_db()
    try:
        oid = str_to_objectid(field_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid field ID.")
    field = await db.fields.find_one({"_id": oid, "owner_id": owner_id})
    if not field:
        raise HTTPException(status_code=404, detail="Field not found or access denied.")


@router.get("/recommendation")
async def get_recommendation(
    field_id: str = Query(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Generate a fresh irrigation recommendation for the given field.
    The recommendation is advisory only — see the advisory_note field in the response.
    """
    await _assert_field_owned(field_id, current_user["id"])
    try:
        rec = await generate_recommendation(field_id, current_user["id"])
    except Exception as exc:
        logger.error("Irrigation recommendation error: %s", exc)
        raise HTTPException(status_code=500, detail="Could not generate recommendation.")
    return rec


@router.get("/history")
async def recommendation_history(
    field_id: str = Query(...),
    limit: int = Query(default=20, ge=1, le=100),
    skip: int = Query(default=0, ge=0),
    current_user: dict = Depends(get_current_user)
):
    """Return paginated historical irrigation recommendations for a field."""
    await _assert_field_owned(field_id, current_user["id"])
    history = await get_recommendation_history(field_id, current_user["id"], limit, skip)
    return {"field_id": field_id, "total": len(history), "data": history}
