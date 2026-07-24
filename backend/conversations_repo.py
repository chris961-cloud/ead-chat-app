from datetime import datetime
from bson import ObjectId
from db import conversations


def _assistant_version(content: str, sources: list[str] | None = None) -> dict:
    return {
        "content": content,
        "sources": sources or [],
        "created_at": datetime.utcnow(),
    }


def _normalize_assistant_message(msg: dict) -> None:
    """Upgrade legacy flat assistant messages to the versions schema in-place."""
    if msg.get("role") != "assistant" or "versions" in msg:
        return
    msg["versions"] = [_assistant_version(msg.get("content", ""), msg.get("sources"))]
    msg["active_version"] = 0
    msg.pop("content", None)
    msg.pop("sources", None)


def create_conversation(first_message: str, user_id: str) -> str:
    """Creates a new conversation for *user_id* and returns its ID as a string."""
    doc = {
        "title": first_message[:50],
        "created_at": datetime.utcnow(),
        "messages": [],
        "user_id": ObjectId(user_id),
    }
    result = conversations.insert_one(doc)
    return str(result.inserted_id)


def add_message(conversation_id: str, role: str, content: str, sources: list[str] | None = None):
    """Appends a single message to an existing conversation."""
    if role == "assistant":
        message = {
            "role": "assistant",
            "versions": [_assistant_version(content, sources)],
            "active_version": 0,
        }
    else:
        message = {"role": "user", "content": content}

    conversations.update_one(
        {"_id": ObjectId(conversation_id)},
        {"$push": {"messages": message}},
    )


def add_assistant_version(
    conversation_id: str, message_index: int, content: str, sources: list[str] | None = None
) -> bool:
    """Appends a new response version to an existing assistant message."""
    doc = conversations.find_one({"_id": ObjectId(conversation_id)}, {"messages": 1})
    if not doc:
        return False

    messages = doc.get("messages", [])
    if message_index >= len(messages) or messages[message_index].get("role") != "assistant":
        return False

    version_index = len(messages[message_index].get("versions", []))
    conversations.update_one(
        {"_id": ObjectId(conversation_id)},
        {
            "$push": {f"messages.{message_index}.versions": _assistant_version(content, sources)},
            "$set": {f"messages.{message_index}.active_version": version_index},
        },
    )
    return True


def set_active_version(conversation_id: str, message_index: int, version_index: int) -> bool:
    """Sets which response version is displayed for an assistant message."""
    doc = conversations.find_one({"_id": ObjectId(conversation_id)}, {"messages": 1})
    if not doc:
        return False

    messages = doc.get("messages", [])
    if message_index >= len(messages):
        return False

    msg = messages[message_index]
    if msg.get("role") != "assistant":
        return False

    versions = msg.get("versions", [])
    if version_index < 0 or version_index >= len(versions):
        return False

    conversations.update_one(
        {"_id": ObjectId(conversation_id)},
        {"$set": {f"messages.{message_index}.active_version": version_index}},
    )
    return True


def get_regeneration_query(conversation_id: str, message_index: int) -> str | None:
    """Returns the user message that prompted the assistant message at message_index."""
    doc = conversations.find_one({"_id": ObjectId(conversation_id)}, {"messages": 1})
    if not doc:
        return None

    messages = doc.get("messages", [])
    if message_index <= 0 or message_index >= len(messages):
        return None
    if messages[message_index].get("role") != "assistant":
        return None

    user_msg = messages[message_index - 1]
    if user_msg.get("role") != "user":
        return None

    return user_msg.get("content")


def get_conversation(conversation_id: str, user_id: str):
    """Fetches one conversation by ID, scoped to *user_id*."""
    doc = conversations.find_one({"_id": ObjectId(conversation_id), "user_id": ObjectId(user_id)})
    if not doc:
        return None

    doc["_id"] = str(doc["_id"])
    if "user_id" in doc:
        doc["user_id"] = str(doc["user_id"])
    if isinstance(doc.get("created_at"), datetime):
        doc["created_at"] = doc["created_at"].isoformat()
    for msg in doc.get("messages", []):
        _normalize_assistant_message(msg)
        if msg.get("role") == "assistant":
            for version in msg.get("versions", []):
                created_at = version.get("created_at")
                if isinstance(created_at, datetime):
                    version["created_at"] = created_at.isoformat()
                fb = version.get("feedback")
                if fb and isinstance(fb.get("created_at"), datetime):
                    fb["created_at"] = fb["created_at"].isoformat()
    return doc


def list_conversations(user_id: str):
    """Returns a summary list of conversations belonging to *user_id* — no full messages."""
    docs = conversations.find(
        {"user_id": ObjectId(user_id)},
        {"title": 1, "created_at": 1},
    ).sort("created_at", -1)
    return [
        {"id": str(doc["_id"]), "title": doc["title"], "created_at": doc["created_at"].isoformat()}
        for doc in docs
    ]


def set_feedback(
    conversation_id: str,
    message_index: int,
    version_index: int,
    rating: str,
    reasons: list[str] | None = None,
    comment: str | None = None,
) -> bool:
    """Stores thumbs up/down feedback on a specific assistant response version."""
    doc = conversations.find_one({"_id": ObjectId(conversation_id)}, {"messages": 1})
    if not doc:
        return False

    messages = doc.get("messages", [])
    if message_index >= len(messages):
        return False

    msg = messages[message_index]
    if msg.get("role") != "assistant":
        return False

    versions = msg.get("versions", [])
    if version_index < 0 or version_index >= len(versions):
        return False

    feedback = {
        "rating": rating,
        "reasons": reasons or [],
        "comment": (comment or "").strip(),
        "created_at": datetime.utcnow(),
    }

    conversations.update_one(
        {"_id": ObjectId(conversation_id)},
        {"$set": {f"messages.{message_index}.versions.{version_index}.feedback": feedback}},
    )
    return True


def delete_conversation(conversation_id: str, user_id: str) -> bool:
    """Delete a conversation only if it belongs to *user_id*."""
    result = conversations.delete_one(
        {"_id": ObjectId(conversation_id), "user_id": ObjectId(user_id)}
    )
    return result.deleted_count > 0
