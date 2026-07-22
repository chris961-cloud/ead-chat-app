# AI Tooling Notes

This project was built with assistance from Claude (Anthropic), used throughout the EAD Internship for both backend and frontend development.

## How Claude was used

- **Backend**: Designing the FastAPI structure, wiring the existing RAG pipeline (retrieval, reranking, generation via Ollama) into a streaming `/api/chat` endpoint using Server-Sent Events (SSE).
- **Frontend**: Scaffolding the Vite + React project, configuring Tailwind CSS and shadcn/ui, building the chat UI (`ChatWindow.jsx`, `useChat.js`), and integrating `react-markdown` for formatted AI responses.
- **Debugging**: Diagnosing environment issues (PATH configuration, PowerShell execution policy, dependency conflicts between Python versions across sub-projects).
- **Git workflow**: Guidance on branching, committing, and pushing to GitHub.

## How to use Claude effectively on this project

- Paste terminal output directly when something errors — exact error text gets a faster, more accurate fix than a description.
- When editing config files (`vite.config.js`, `jsconfig.json`, etc.), confirm changes were actually saved to disk before re-running commands, since editor saves can occasionally fail silently.
- For RAG-specific questions, refer to the original `rag_setup` project (Week 1) for the base pipeline logic reused here.

## Known project conventions

- Backend: Python 3.14, managed with `uv`.
- Frontend: Vite + React (JavaScript, not TypeScript), Tailwind CSS v4, shadcn/ui (Radix UI + Nova preset).
- Feature work stays on `feature/*` branches; `main`/`master` is not merged into until reviewed.