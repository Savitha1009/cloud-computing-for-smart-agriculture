"""
app/routers/alerts.py — list and update alerts.
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from app.models.alert import AlertOut, AlertStatusUpdate
from app.routers.auth import get_current_user
from app.database import get_db
from app.utils.helpers import utc_now, doc_to_dict, str_to_objectid
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/alerts", tags=["Alerts"])


@router.get("", response_model=list[AlertOut])
async def list_alerts(
    status: str | None = Query(default=None, description="Filter by status: active | read | resolved"),
    limit: int = Query(default=50, ge=1, le=200),
    skip: int = Query(default=0, ge=0),
    current_user: dict = Depends(get_current_user)
):
    """Return alerts for the authenticated user, optionally filtered by status."""
    db = get_db()
    query: dict = {"owner_id": current_user["id"]}
    if status:
        query["status"] = status
    cursor = db.alerts.find(query).sort("created_at", -1).skip(skip).limit(limit)
    docs = await cursor.to_list(length=limit)
    result = []
    for d in docs:
        r = doc_to_dict(d)
        result.append(AlertOut(
            id=r["id"],
            owner_id=r["owner_id"],
            field_id=r["field_id"],
            field_name=r.get("field_name"),
            alert_type=r["alert_type"],
            severity=r["severity"],
            message=r["message"],
            status=r["status"],
            created_at=d["created_at"],
            updated_at=d.get("updated_at"),
        ))
    return result


@router.patch("/{alert_id}", response_model=AlertOut)
async def update_alert_status(
    alert_id: str,
    data: AlertStatusUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Mark an alert as read or resolved."""
    db = get_db()
    try:
        oid = str_to_objectid(alert_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid alert ID.")

    now = utc_now()
    result = await db.alerts.find_one_and_update(
        {"_id": oid, "owner_id": current_user["id"]},
        {"$set": {"status": data.status, "updated_at": now}},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Alert not found.")
    r = doc_to_dict(result)
    return AlertOut(
        id=r["id"], owner_id=r["owner_id"], field_id=r["field_id"],
        field_name=r.get("field_name"), alert_type=r["alert_type"],
        severity=r["severity"], message=r["message"], status=r["status"],
        created_at=result["created_at"], updated_at=result.get("updated_at"),
    )
