"""
app/utils/helpers.py — small shared utilities used across the application.
"""
from bson import ObjectId
from datetime import datetime, timezone


def utc_now() -> datetime:
    """Return the current time in UTC (timezone-aware)."""
    return datetime.now(timezone.utc)


def str_to_objectid(id_str: str) -> ObjectId:
    """Convert a string to a BSON ObjectId, raising ValueError on invalid input."""
    try:
        return ObjectId(id_str)
    except Exception:
        raise ValueError(f"'{id_str}' is not a valid ObjectId.")


def doc_to_dict(doc: dict) -> dict:
    """
    Convert a MongoDB document to a JSON-serialisable dict.
    Converts ObjectId → str and datetime → ISO-8601 string.
    """
    if doc is None:
        return None
    result = {}
    for key, value in doc.items():
        if isinstance(value, ObjectId):
            result[key] = str(value)
        elif isinstance(value, datetime):
            result[key] = value.isoformat()
        elif isinstance(value, dict):
            result[key] = doc_to_dict(value)
        elif isinstance(value, list):
            result[key] = [
                doc_to_dict(i) if isinstance(i, dict) else
                str(i) if isinstance(i, ObjectId) else i
                for i in value
            ]
        else:
            result[key] = value
    return result
