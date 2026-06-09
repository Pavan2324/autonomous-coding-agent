# 🤖 Autonomous Coding Agent

An AI-powered system that automatically finds bugs in GitHub repositories and opens Pull Requests with fixes — no human intervention required.

Built with LangGraph, FastAPI, and React. Supports OpenAI, Gemini, Grok, and DeepSeek.

---

## 🎥 How It Works

1. Submit any GitHub repo URL
2. **Explorer** agent reads the repository files via GitHub API
3. **Analyzer** agent finds all bugs in the code using LLM
4. **Coder** agent writes the complete fixes
5. **Critic** agent reviews quality — retries if rejected (max 3 times)
6. **Create PR** agent opens a real GitHub Pull Request automatically

If no bugs are found — no PR is raised. The agent tells you the code is clean.

---

## ✨ Features

- 🔍 **Real GitHub integration** — reads actual files, creates real branches and PRs
- 🤖 **Multi-agent LangGraph pipeline** — 5 specialized AI agents
- 🔄 **Retry loop with circuit breaker** — max 3 retries to prevent token waste
- ✅ **Smart detection** — no bugs found = no PR raised, clean message shown
- 🔑 **BYOK** — Bring Your Own API Key, never stored on server
- 🌐 **Multi-LLM support** — OpenAI, Gemini, Grok, DeepSeek
- 📊 **Live progress tracking** — watch each agent run in real time
- 🔒 **Privacy first** — API keys stored in your browser only

---

## 🚀 How To Use The App

### Step 1 — Open the app
Go to **http://localhost:5173** (or the deployed URL).

You will see the **Setup Wizard** on first visit.

---

### Step 2 — Choose your LLM Provider

Pick from:

| Provider | Free Tier? | Best Model |
|----------|-----------|------------|
| OpenAI | ❌ Paid | gpt-4o |
| Gemini | ✅ Free tier | gemini-1.5-pro |
| Grok | ✅ Free tier | grok-2 |
| DeepSeek | ✅ Very cheap | deepseek-chat |

> 💡 **Tip:** Start with Gemini or Grok if you want to try for free!

---

### Step 3 — Get your API Key

The wizard shows step-by-step instructions for each provider:

**OpenAI:**
1. Go to https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Copy the key (starts with `sk-`)

**Gemini:**
1. Go to https://aistudio.google.com/app/apikey
2. Click "Get API Key"
3. Copy the key

**Grok:**
1. Go to https://console.x.ai
2. Click "API Keys" → Create new key
3. Copy the key (starts with `xai-`)

**DeepSeek:**
1. Go to https://platform.deepseek.com/api_keys
2. Create new key and copy it

---

### Step 4 — Get your GitHub Token

You need a GitHub Personal Access Token to:
- Read repository files
- Create branches
- Open Pull Requests

**How to generate:**
1. Go to **github.com** → click your profile photo → **Settings**
2. Scroll down → click **Developer settings**
3. Click **Personal access tokens** → **Tokens (classic)**
4. Click **Generate new token (classic)**
5. Give it a name (e.g. "coding-agent")
6. Select scope: ✅ **repo**
7. Click **Generate token**
8. **Copy immediately** — GitHub shows it only once!

> ⚠️ Token expires after the period you set. Regenerate when expired.

---

### Step 5 — Submit a Repository

After setup you will see the main page:

1. Paste a **GitHub repo URL** (e.g. `https://github.com/owner/repo`)
2. Set the **branch** (default: `main`)
3. Set the **task** (default: `find and fix all bugs`)
4. Click **🚀 Run Agent**

You will see live progress as each agent runs:
```
🔍 Explorer   → Reading repo files     ✓ Done
🐛 Analyzer   → Finding bugs           ✓ Done
💻 Coder      → Writing fixes          ✓ Done
👀 Critic     → Reviewing quality      ✓ Done
🚀 Create PR  → Opening pull request   ✓ Done
```

---

### Step 6 — Review the Result

**If bugs were found:**
```
🎉 Pull Request Created!
Bugs were found and fixed automatically.
View Pull Request → (clickable link)
```
Click the link → review the changes → merge if happy!

**If no bugs were found:**
```
✅ Code is clean! No bugs found — no PR needed.
All agents ran successfully. No fixes were needed.
```

---

### Step 7 — Change Settings

Click **⚙ Change Settings** in the top bar to:
- Switch LLM provider
- Update API key
- Update GitHub token
- Delete all saved keys

---

## 🔒 Privacy & Security

### We do NOT store anything sensitive

| Data | Where it lives | Stored on server? |
|------|---------------|-------------------|
| API Key | Your browser (localStorage) | ❌ Never |
| GitHub Token | Your browser (localStorage) | ❌ Never |
| Repo URL | Database | ✅ Run history only |
| Run status | Database | ✅ Progress tracking |
| Agent logs | Database | ✅ Node names only |

**Your API keys and GitHub token:**
- Are stored ONLY in your browser's localStorage
- Are sent to the backend ONLY during a run
- Are NEVER logged to files or terminal
- Are NEVER saved to the database
- Are used for that single run then discarded

### You can verify this yourself
This project is fully open source. Check:
- `backend/app/models/run.py` — no api_key column in database
- `backend/app/services/agent_runner.py` — keys passed as function args, never saved
- `backend/app/api/runs.py` — keys received but not persisted

### Delete your keys anytime
Click **⚙ Change Settings** → **🗑 Delete all saved keys**

This clears localStorage completely. The app returns to the setup wizard.

---

## ⚠️ Precautions

### Before running on a repository

**1. Use a test repo first**
Do not run on production repos without testing. The agent will create branches and open PRs.

**2. Review the PR before merging**
The agent is AI — it may occasionally make mistakes. Always review the diff before merging.

**3. Check your API costs**
Each run makes multiple LLM calls (4-10 depending on retries). Monitor your usage:
- OpenAI: https://platform.openai.com/usage
- Gemini: https://aistudio.google.com
- Grok: https://console.x.ai

**4. GitHub rate limits**
GitHub API allows 5000 requests/hour with a token. Normal usage is well within limits.

**5. Token expiry**
GitHub tokens expire. If you get auth errors, regenerate your token and update via "Change Settings".

**6. Large repositories**
The agent reads up to 5 source files + README + requirements. Very large repos may hit LLM token limits. Use a specific task to focus the agent.

**7. Private repositories**
Your GitHub token must have access to the repo. For org repos, ensure the token has the right permissions.

---

## 🏗️ Architecture

```
User → React Frontend (Vite)
     → FastAPI Backend
     → LangGraph Orchestrator
          → Explorer Agent  → GitHub API (reads files)
          → Analyzer Agent  → LLM (finds bugs)
          → Coder Agent     → LLM (writes fixes)
          → Critic Agent    → LLM (reviews quality)
          → Create PR Node  → GitHub API (opens PR)
     → SQLite Database (run history only)
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite |
| Backend | FastAPI + Python 3.12 |
| AI Orchestration | LangGraph + LangChain |
| LLM Providers | OpenAI / Gemini / Grok / DeepSeek |
| Database | SQLite + SQLAlchemy (async) |
| GitHub Integration | GitHub REST API + httpx |
| Logging | structlog (structured JSON logs) |
| Package Management | Poetry (backend) + npm (frontend) |

---

## 🚀 Running Locally

### Prerequisites

- Python 3.11+
- Node.js 18+
- Poetry (`pip install poetry`)
- A GitHub Personal Access Token (with `repo` scope)
- An API key from OpenAI, Gemini, Grok, or DeepSeek

### Backend

```bash
cd backend
poetry install
poetry run uvicorn server:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** and follow the setup wizard.

---

## 📁 Project Structure

```
autonomous-coding-agent/
├── backend/
│   ├── app/
│   │   ├── agents/
│   │   │   ├── state.py          # AgentState TypedDict
│   │   │   ├── nodes.py          # 5 agent node functions
│   │   │   └── graph.py          # LangGraph StateGraph
│   │   ├── api/
│   │   │   ├── health.py         # GET /api/v1/health
│   │   │   └── runs.py           # POST/GET /api/v1/runs
│   │   ├── core/
│   │   │   ├── config.py         # Pydantic settings
│   │   │   ├── logging.py        # structlog setup
│   │   │   └── database.py       # SQLAlchemy async engine
│   │   ├── models/
│   │   │   └── run.py            # Run SQLAlchemy model
│   │   └── services/
│   │       ├── agent_runner.py   # Orchestrates graph execution
│   │       └── github_service.py # GitHub API client
│   ├── server.py
│   └── pyproject.toml
└── frontend/
    └── src/
        ├── components/
        │   ├── SetupWizard.jsx   # First-time API key setup
        │   ├── RunForm.jsx       # Submit repo form
        │   └── RunStatus.jsx     # Live agent progress
        ├── api.js                # Axios API client
        └── App.jsx               # Main app
```

---

## 🧠 Key Design Decisions

**Why LangGraph?**
State machine approach gives precise control over agent flow, retry logic, and circuit breaking.

**Why TypedDict for AgentState?**
LangGraph does partial state updates — each agent only sets its own keys. Pydantic would reject partial updates.

**Why BackgroundTasks?**
Agents take 1-3 minutes. BackgroundTasks returns the run ID instantly while agents work asynchronously.

**Why circuit breaker (max_loops = 3)?**
Without it, a bad Critic could loop forever wasting API tokens. Max 3 retries = bounded cost.

**Why store keys in browser only?**
API keys are secrets. Browser localStorage is simpler and more private than server-side storage.

---

## 📄 License

MIT — feel free to use, modify, and distribute.
