# EAD Chat Application 🚀

An enterprise-grade Retrieval-Augmented Generation (RAG) chat platform built with **FastAPI**, **React (Vite)**, **Weaviate**, **MongoDB**, and **Ollama (Llama 3.2)**. It provides real-time streaming answers grounded in CIS Controls documentation, user authentication, multi-version answer regeneration, granular feedback collection, and an interactive onboarding tour.

---

## ⚡ 5-Minute Quickstart

Get the complete stack running on your local machine in under 5 minutes.

### 1. Prerequisites Check

Ensure you have the following installed and running:
* **Python**: 3.10+ (Python 3.14 recommended with `uv`)
* **Node.js**: 18+ and `npm`
* **MongoDB**: Running locally on `mongodb://localhost:27017`
* **Weaviate**: Vector DB running locally on `localhost:8080` (with indexed `CISControls` collection)
* **Ollama**: Running locally with `llama3.2:1b` model pulled (`ollama run llama3.2:1b`)

---

### 2. Backend Setup (2 minutes)

1. Open a terminal in the `backend/` folder:
   ```bash
   cd backend
   ```

2. Create virtual environment and install dependencies:
   ```bash
   # Using uv (recommended):
   uv venv
   .venv\Scripts\activate   # On Windows PowerShell
   uv pip install -r pyproject.toml

   # Or using standard pip:
   python -m venv .venv
   .venv\Scripts\activate
   pip install fastapi uvicorn pymongo python-jose bcrypt pydantic langchain-huggingface sentence-transformers weaviate-client requests
   ```

3. Launch the FastAPI server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   *The backend server will start at `http://127.0.0.1:8000` (API docs available at `http://127.0.0.1:8000/docs`).*

---

### 3. Frontend Setup (2 minutes)

1. Open a second terminal in the `frontend/` folder:
   ```bash
   cd frontend
   ```

2. Install dependencies & start dev server:
   ```bash
   npm install
   npm run dev
   ```
   *The Vite frontend server will launch at `http://localhost:5173`.*

---

### 4. Launch & Test (1 minute)

1. Open your browser and navigate to `http://localhost:5173`.
2. Click **Sign Up** to create a test user account (e.g. Username: `testuser`, Password: `password123`).
3. Upon first login, the interactive **Guided Tour** will launch automatically to walk you through the key features!
4. Ask a question such as: *"How should administrator and privileged accounts be managed?"*

---

## 🏗 System Architecture

```
                           ┌───────────────────────────┐
                           │   React Frontend (Vite)   │
                           │   Tailwind CSS + Lucide   │
                           └─────────────┬─────────────┘
                                         │ REST API / SSE
                                         ▼
                           ┌───────────────────────────┐
                           │   FastAPI Backend (Py)    │
                           └──────┬──────────┬───────┬─┘
                                  │          │       │
                 ┌────────────────┘          │       └────────────────┐
                 ▼                           ▼                        ▼
      ┌────────────────────┐      ┌────────────────────┐   ┌────────────────────┐
      │   MongoDB Store    │      │  Weaviate Vector   │   │    Ollama LLM      │
      │ Users & Conversations │    │     Database       │   │  (llama3.2:1b)     │
      └────────────────────┘      └────────────────────┘   └────────────────────┘
```

---

## ✨ Key Features

* **JWT Authentication**: Secure user registration and login with bcrypt password hashing and token-based protection on chat endpoints.
* **RAG Retrieval & Reranking**: Queries top vector chunks from Weaviate (`BAAI/bge-small-en-v1.5`), reranks using `BAAI/bge-reranker-v2-m3`, and generates grounded answers.
* **Real-time SSE Streaming**: Answers stream live to the UI via Server-Sent Events with cited source accordions.
* **Multi-Version Response Generation**: Regenerate responses for any message and seamlessly toggle between alternative assistant responses (v1, v2, ...).
* **Feedback Collection**: Submit positive (thumbs up) or detailed negative feedback (categorized reasons + comments) per version.
* **Interactive Guided Tour**: First-time user onboarding tour with keyboard navigation (`Escape`, `←`, `→`) and manual re-trigger from the sidebar.

---

## 🔌 API Overview

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/signup` | Register a new user | ❌ Public |
| `POST` | `/api/auth/login` | Authenticate user & receive JWT token | ❌ Public |
| `POST` | `/api/chat` | Send prompt & stream RAG response (SSE) | 🔒 Bearer Token |
| `POST` | `/api/chat/regenerate` | Regenerate alternative answer for query | 🔒 Bearer Token |
| `GET` | `/api/conversations` | List user conversation history | 🔒 Bearer Token |
| `GET` | `/api/conversations/{id}` | Retrieve full conversation messages & versions | 🔒 Bearer Token |
| `DELETE` | `/api/conversations/{id}` | Delete conversation | 🔒 Bearer Token |
| `PATCH` | `/api/conversations/{id}/messages/{idx}/version` | Switch active assistant response version | 🔒 Bearer Token |
| `POST` | `/api/feedback` | Store thumbs up/down rating and reasons | 🔒 Bearer Token |

---

## 🛠 Project Structure

```
ead-chat-app/
├── backend/
│   ├── auth.py                 # Password hashing & JWT dependencies
│   ├── config.py               # JWT secret & expiration settings
│   ├── db.py                   # PyMongo database connection
│   ├── users_repo.py           # User CRUD & index creation
│   ├── conversations_repo.py   # Conversation, versioning & feedback CRUD
│   ├── main.py                 # FastAPI application routes & SSE handlers
│   └── rag/
│       └── pipeline.py         # Weaviate retrieval, BGE reranking, Ollama generation
├── frontend/
│   ├── src/
│   │   ├── api.js              # Fetch wrapper with JWT header handling
│   │   ├── components/
│   │   │   ├── auth/AuthPage.jsx         # Sign in / Sign up page
│   │   │   └── chat/
│   │   │       ├── ChatWindow.jsx        # Main chat message feed & input
│   │   │       ├── Citation.jsx          # Interactive source citation tooltips
│   │   │       ├── FeedbackModal.jsx     # Negative feedback reason selector
│   │   │       ├── GuidedTour.jsx        # First-time user onboarding modal
│   │   │       ├── MessageContent.jsx    # Markdown renderer & sources accordion
│   │   │       ├── ResponseActions.jsx   # Feedback, regenerate & version nav
│   │   │       └── Sidebar.jsx           # Thread list, user menu & tour trigger
│   │   └── hooks/
│   │       ├── useAuth.js                # Auth state management hook
│   │       ├── useChat.js                # Chat SSE & messaging state hook
│   │       └── useGuidedTour.js          # Onboarding tour step state hook
├── CLAUDE.md                   # AI tooling usage & impact documentation
└── README.md                   # Project documentation (this file)
```

---

## ❓ Troubleshooting

* **Could not reach document database**: Ensure Weaviate is running on port 8080 and the vector collection `CISControls` is populated.
* **Could not reach AI model**: Verify Ollama service is active (`ollama serve`) and model `llama3.2:1b` is available.
* **MongoDB connection error**: Ensure MongoDB service is listening on `mongodb://localhost:27017`.
* **CORS error**: Make sure the backend CORS configuration in `main.py` permits requests from `http://localhost:5173`.
