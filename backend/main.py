import json

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from auth import create_access_token, get_current_user, hash_password, verify_password
from rag.pipeline import stream_answer
from users_repo import create_user, get_user_by_username
from conversations_repo import (
    create_conversation,
    add_message,
    add_assistant_version,
    set_active_version,
    set_feedback,
    get_regeneration_query,
    get_conversation,
    list_conversations,
    delete_conversation,
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request / response models ─────────────────────────────────────────────────

class SignupRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=30)
    email: str | None = None
    password: str = Field(..., min_length=6)


class LoginRequest(BaseModel):
    username: str
    password: str


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    conversation_id: str | None = None


class RegenerateRequest(BaseModel):
    conversation_id: str
    message_index: int = Field(..., ge=0)


class SetVersionRequest(BaseModel):
    version_index: int = Field(..., ge=0)


class FeedbackRequest(BaseModel):
    conversation_id: str
    message_index: int = Field(..., ge=0)
    version_index: int = Field(..., ge=0)
    rating: str = Field(..., pattern="^(up|down)$")
    reasons: list[str] = Field(default_factory=list)
    comment: str = ""


# ── Shared SSE helper ─────────────────────────────────────────────────────────

def _stream_rag_answer(query: str, on_complete):
    """Shared SSE generator for chat and regenerate endpoints."""
    full_answer = ""
    sources = []

    for token in stream_answer(query):
        if token.startswith("[SOURCES]"):
            sources = json.loads(token.replace("[SOURCES]", ""))
            yield f"data: {token}\n\n"
            continue

        if token.startswith("[ERROR]"):
            yield f"data: {token}\n\n"
            yield "data: [DONE]\n\n"
            return

        full_answer += token
        yield f"data: {token}\n\n"

    on_complete(full_answer, sources)
    yield "data: [DONE]\n\n"


# ── Health check ──────────────────────────────────────────────────────────────

@app.get("/")
def read_root():
    return {"status": "Backend is running"}


# ── Auth routes (public — no token required) ──────────────────────────────────

@app.post("/api/auth/signup", status_code=status.HTTP_201_CREATED)
def signup(request: SignupRequest):
    hashed = hash_password(request.password)
    user = create_user(request.username, request.email, hashed)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username or email is already taken",
        )
    token = create_access_token(str(user["_id"]))
    return {"access_token": token, "token_type": "bearer", "username": user["username"]}


@app.post("/api/auth/login")
def login(request: LoginRequest):
    user = get_user_by_username(request.username)
    if not user or not verify_password(request.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    token = create_access_token(str(user["_id"]))
    return {"access_token": token, "token_type": "bearer", "username": user["username"]}


# ── Protected chat routes ─────────────────────────────────────────────────────

@app.post("/api/chat")
def chat(request: ChatRequest, current_user_id: str = Depends(get_current_user)):
    conversation_id = request.conversation_id
    if not conversation_id:
        conversation_id = create_conversation(request.message, current_user_id)

    add_message(conversation_id, "user", request.message)

    def on_complete(answer, sources):
        add_message(conversation_id, "assistant", answer, sources)

    def event_stream():
        yield f"data: [CONVERSATION_ID]{conversation_id}\n\n"
        yield from _stream_rag_answer(request.message, on_complete)

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@app.post("/api/chat/regenerate")
def regenerate_chat(
    request: RegenerateRequest,
    current_user_id: str = Depends(get_current_user),
):
    query = get_regeneration_query(request.conversation_id, request.message_index)
    if not query:
        raise HTTPException(status_code=400, detail="Cannot regenerate this message")

    def on_complete(answer, sources):
        add_assistant_version(request.conversation_id, request.message_index, answer, sources)

    return StreamingResponse(
        _stream_rag_answer(query, on_complete),
        media_type="text/event-stream",
    )


@app.post("/api/feedback")
def submit_feedback(
    request: FeedbackRequest,
    current_user_id: str = Depends(get_current_user),
):
    if request.rating == "down" and not request.reasons:
        raise HTTPException(status_code=400, detail="At least one reason is required for negative feedback")

    saved = set_feedback(
        request.conversation_id,
        request.message_index,
        request.version_index,
        request.rating,
        request.reasons,
        request.comment,
    )
    if not saved:
        raise HTTPException(status_code=400, detail="Invalid conversation, message, or version index")
    return {"status": "ok"}


@app.patch("/api/conversations/{conversation_id}/messages/{message_index}/version")
def update_active_version(
    conversation_id: str,
    message_index: int,
    request: SetVersionRequest,
    current_user_id: str = Depends(get_current_user),
):
    updated = set_active_version(conversation_id, message_index, request.version_index)
    if not updated:
        raise HTTPException(status_code=400, detail="Invalid conversation, message, or version index")
    return {"status": "ok", "active_version": request.version_index}


@app.get("/api/conversations")
def get_conversations(current_user_id: str = Depends(get_current_user)):
    return list_conversations(current_user_id)


@app.get("/api/conversations/{conversation_id}")
def get_single_conversation(
    conversation_id: str,
    current_user_id: str = Depends(get_current_user),
):
    conversation = get_conversation(conversation_id, current_user_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conversation


@app.delete("/api/conversations/{conversation_id}")
def delete_single_conversation(
    conversation_id: str,
    current_user_id: str = Depends(get_current_user),
):
    deleted = delete_conversation(conversation_id, current_user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"status": "deleted"}
