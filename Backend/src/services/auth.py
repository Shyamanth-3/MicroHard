import os
import time
from typing import Optional
import jwt
from fastapi import Depends, HTTPException, Header

JWT_SECRET = os.environ.get("JWT_SECRET", "change-me-secret")
JWT_ALG = "HS256"
JWT_EXP_SECONDS = 60 * 60 * 12  # 12 hours

DEFAULT_USER_EMAIL = os.environ.get("DEFAULT_USER_EMAIL", "demo@microhard.local")
DEFAULT_USER_PASSWORD = os.environ.get("DEFAULT_USER_PASSWORD", "demo123")


def verify_password(plain_password: str, stored_password: str) -> bool:
    """Simple password verification (for MVP)"""
    try:
        return plain_password == stored_password
    except Exception:
        return False


def create_access_token(sub: str, extra: Optional[dict] = None) -> str:
    payload = {
        "sub": sub,
        "iat": int(time.time()),
        "exp": int(time.time()) + JWT_EXP_SECONDS,
    }
    if extra:
        payload.update(extra)
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)
    return token


def authenticate(email: str, password: str) -> Optional[dict]:
    # MVP: single user; extend to DB later
    if email.lower() == DEFAULT_USER_EMAIL.lower() and verify_password(password, DEFAULT_USER_PASSWORD):
        return {"email": DEFAULT_USER_EMAIL}
    return None


def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    """Dependency to extract and validate JWT from Authorization header"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")
    
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    token = parts[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {"email": email}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except (jwt.InvalidTokenError, Exception):
        raise HTTPException(status_code=401, detail="Invalid token")
