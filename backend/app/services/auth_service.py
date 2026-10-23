"""
app/services/auth_service.py — password hashing and user-lookup helpers.
"""
from passlib.context import CryptContext
from app.database import get_db
from app.utils.helpers import doc_to_dict

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


async def get_user_by_email(email: str) -> dict | None:
    db = get_db()
    doc = await db.users.find_one({"email": email})
    return doc_to_dict(doc) if doc else None


async def get_user_by_id(user_id: str) -> dict | None:
    from app.utils.helpers import str_to_objectid
    db = get_db()
    try:
        oid = str_to_objectid(user_id)
    except ValueError:
        return None
    doc = await db.users.find_one({"_id": oid})
    return doc_to_dict(doc) if doc else None
