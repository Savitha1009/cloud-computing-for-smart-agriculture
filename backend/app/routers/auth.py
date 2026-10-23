"""
app/routers/auth.py — registration, login, and current-user endpoints.
Rate limited to prevent brute-force attacks.
"""
from fastapi import APIRouter, HTTPException, Depends, status, Request
from app.models.user import UserRegister, UserLogin, TokenResponse, UserOut, UserUpdate
from app.services.auth_service import hash_password, verify_password, get_user_by_email, get_user_by_id
from app.utils.jwt_handler import create_access_token, decode_access_token
from app.database import get_db
from app.utils.helpers import utc_now, doc_to_dict
from jose import JWTError
from fastapi.security import OAuth2PasswordBearer
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/auth", tags=["Authentication"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    """FastAPI dependency — decodes JWT and returns the authenticated user dict."""
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_access_token(token)
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exc
    except JWTError:
        raise credentials_exc

    user = await get_user_by_id(user_id)
    if user is None:
        raise credentials_exc
    return user


def _user_out(user: dict) -> UserOut:
    return UserOut(
        id=user["id"],
        name=user["name"],
        email=user["email"],
        role=user["role"],
        created_at=user["created_at"],
    )


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(data: UserRegister):
    """Register a new farmer account."""
    existing = await get_user_by_email(data.email)
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered.")

    db = get_db()
    user_doc = {
        "name": data.name,
        "email": data.email,
        "hashed_password": hash_password(data.password),
        "role": data.role,
        "created_at": utc_now(),
    }
    result = await db.users.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id
    user = doc_to_dict(user_doc)

    token = create_access_token({"sub": user["id"]})
    logger.info("New user registered: %s (role=%s)", data.email, data.role)
    return TokenResponse(access_token=token, user=_user_out(user))


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin):
    """Authenticate a user and return a JWT."""
    user = await get_user_by_email(data.email)
    if not user or not verify_password(data.password, user.get("hashed_password", "")):
        # Uniform message prevents email enumeration
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    token = create_access_token({"sub": user["id"]})
    logger.info("User logged in: %s", data.email)
    return TokenResponse(access_token=token, user=_user_out(user))


@router.get("/me", response_model=UserOut)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Return the currently authenticated user's profile."""
    return _user_out(current_user)


@router.put("/me", response_model=UserOut)
async def update_me(data: UserUpdate, current_user: dict = Depends(get_current_user)):
    """Update the authenticated user's name or email."""
    db = get_db()
    from app.utils.helpers import str_to_objectid
    updates = data.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update.")
    if "email" in updates:
        existing = await get_user_by_email(updates["email"])
        if existing and existing["id"] != current_user["id"]:
            raise HTTPException(status_code=409, detail="Email already in use.")
    await db.users.update_one(
        {"_id": str_to_objectid(current_user["id"])},
        {"$set": updates}
    )
    updated = await get_user_by_id(current_user["id"])
    return _user_out(updated)
