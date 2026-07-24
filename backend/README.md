# EAD Chat Backend 🐍

FastAPI REST & Streaming SSE backend for the EAD Chat application.

## Requirements & Setup

1. **Python 3.10+** (Python 3.14 recommended with `uv`)
2. Virtual environment:
   ```bash
   uv venv
   .venv\Scripts\activate
   uv pip install -r pyproject.toml
   ```
3. Run dev server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```

## Architecture & Modules

* `main.py`: FastAPI entrypoint, SSE endpoint handlers (`/api/chat`, `/api/chat/regenerate`), auth and conversation endpoints.
* `auth.py`: Password hashing using `bcrypt` and JWT token creation/verification dependencies (`python-jose`).
* `db.py` & `*_repo.py`: PyMongo persistence layer for MongoDB collections (`users` and `conversations`).
* `rag/pipeline.py`: RAG integration layer (Weaviate vector retrieval -> BGE reranking -> Ollama streaming).
