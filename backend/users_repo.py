from bson import ObjectId
from pymongo import ASCENDING
from pymongo.errors import DuplicateKeyError

from db import users

# ── Indexes ───────────────────────────────────────────────────────────────────
# Created once at startup (pymongo is idempotent — safe to call every time).
# These enforce uniqueness at the database level, not just in application code.
users.create_index([("username", ASCENDING)], unique=True)
users.create_index([("email", ASCENDING)], unique=True, sparse=True)
#   sparse=True on email means documents without an email field are allowed
#   (so a user can sign up with only a username).


# ── Write ─────────────────────────────────────────────────────────────────────
def create_user(username: str, email: str | None, hashed_password: str) -> dict | None:
    """
    Insert a new user document and return it.
    Returns None if the username or email is already taken.
    """
    doc = {"username": username, "hashed_password": hashed_password}
    if email:
        doc["email"] = email

    try:
        result = users.insert_one(doc)
    except DuplicateKeyError:
        return None

    doc["_id"] = str(result.inserted_id)
    return doc


# ── Read ──────────────────────────────────────────────────────────────────────
def get_user_by_username(username: str) -> dict | None:
    """Look up a user by username.  Used at login."""
    return users.find_one({"username": username})


def get_user_by_id(user_id: str) -> dict | None:
    """Look up a user by their MongoDB _id string.  Used by the auth dependency."""
    try:
        return users.find_one({"_id": ObjectId(user_id)})
    except Exception:
        return None
