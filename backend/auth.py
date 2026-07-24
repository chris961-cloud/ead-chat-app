from datetime import datetime, timedelta, timezone

import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from config import ACCESS_TOKEN_EXPIRE_MINUTES, ALGORITHM, SECRET_KEY

# ── Password hashing ──────────────────────────────────────────────────────────
# We call bcrypt directly rather than through passlib, because passlib 1.7.4
# is incompatible with bcrypt 4.x / 5.x (it looks for a __about__ attribute
# that no longer exists).  The bcrypt library itself is perfectly stable.


def hash_password(plain: str) -> str:
    """Return a bcrypt hash of *plain*.  Never store plain-text passwords."""
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    """Return True if *plain* matches the stored *hashed* password."""
    return bcrypt.checkpw(plain.encode(), hashed.encode())


# ── JWT helpers ───────────────────────────────────────────────────────────────
def create_access_token(user_id: str) -> str:
    """
    Create a signed JWT that encodes the user's MongoDB _id as the 'sub' claim.
    The token expires after ACCESS_TOKEN_EXPIRE_MINUTES minutes.
    """
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": user_id, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


# ── FastAPI dependency ────────────────────────────────────────────────────────
_bearer = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
) -> str:
    """
    FastAPI dependency.  Add  `current_user_id: str = Depends(get_current_user)`
    to any route handler to protect it.

    Reads the 'Authorization: Bearer <token>' header, decodes the JWT, and
    returns the user_id string.  Raises HTTP 401 if the token is missing,
    expired, or tampered with.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str | None = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        return user_id
    except JWTError:
        raise credentials_exception
