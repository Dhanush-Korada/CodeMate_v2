# CodeMate Pro

CodeMate Pro upgrades the original CodeMate LangGraph coding agent into a professional AI coding workspace. The original CLI agent is still available, and the new web workspace adds project management, memory, file editing, live preview, prompt history, versions, and terminal execution around the existing backend.# CodeMate

AI-powered coding workspace.

[![Python](https://img.shields.io/badge/Python-3.11%2B-blue.svg)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-18%2B-61DAFB.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5%2B-3178C6.svg)](https://www.typescriptlang.org/)
[![LangGraph](https://img.shields.io/badge/LangGraph-Agent-orange.svg)](https://www.langchain.com/langgraph)
[![Flask](https://img.shields.io/badge/Flask-Backend-black.svg)](https://flask.palletsprojects.com/)

## Architecture

- `agent/` keeps the existing planner, architect, and coder LangGraph workflow.
- `backend/` exposes Flask APIs for projects, files, memory, history, preview, terminal commands, and AI runs.
- `frontend/` contains the React, TypeScript, Vite, Tailwind, Zustand, Monaco, Framer Motion, Markdown, and Lucide workspace.
- `.codemate/` stores CodeMate Pro metadata such as project index, memory, prompt history, and version history.
- `workspace/` stores managed project files.
- `generated_project/` remains the default output folder for the original CLI path.

## Requirements

- Python 3.11+
- Node.js 20+
- `uv`
- A Groq API key for AI generation

Create `.env` from `.sample_env`:

```bash
GROQ_API_KEY=<YOUR_API_KEY_HERE>
```

The web API can start without `GROQ_API_KEY`, but AI prompt execution requires it.

## Install

```bash
uv venv
uv pip install -r pyproject.toml
cd frontend
npm install
```

## Run The API

```bash
python main.py serve
```

The API starts at `http://127.0.0.1:5000`.

## Run The Workspace

```bash
cd frontend
npm run dev
```

Open `http://127.0.0.1:5173`.

## Original CLI

The original behavior is preserved:

```bash
python main.py
```

CLI output is written to `generated_project/` unless the agent tools are given another project root by the API.

## API Surface

- `GET /api/health`
- `GET /api/projects`
- `POST /api/projects`
- `GET/PATCH/DELETE /api/projects/:id`
- `POST /api/projects/:id/duplicate`
- `GET /api/projects/:id/export`
- `GET/POST/PATCH/DELETE /api/projects/:id/files`
- `GET/PUT /api/projects/:id/files/content`
- `GET/PUT /api/projects/:id/memory`
- `GET /api/projects/:id/versions`
- `GET /api/projects/:id/prompts`
- `POST /api/projects/:id/agent/run`
- `POST /api/projects/:id/terminal`
- `GET /api/projects/:id/preview/*`

## Verification

```bash
python -m compileall main.py agent backend
cd frontend
npm run lint
npm run build
```

## Notes

CodeMate Pro stores every AI run with prompt, duration, modified files, and a summary. Project memory is updated after file changes so the assistant can remember framework, language, dependencies, commands, folder structure, recent prompts, and user preferences across sessions.
