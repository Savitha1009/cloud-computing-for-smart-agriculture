"""
app/utils/jwt_handler.py — creates and verifies JWT access tokens.
"""
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from app.config import settings


def create_access_token(data: dict) -> str:
    """Create a signed JWT with an expiry claim."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> dict:
    """
    Decode and verify a JWT.  Returns the payload dict or raises JWTError.
    Never call this directly — use the get_current_user dependency instead.
    """
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
