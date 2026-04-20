# AI Chatbot Backend (Local)

## 1) Create virtual environment

From the project root:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
cd backend
```

## 2) Install dependencies

```powershell
pip install -r requirements.txt
```

## 3) Configure environment

```powershell
Copy-Item .env.example .env
```

Update `.env` with your API key.

Groq config:

```env
LLM_PROVIDER=groq
GROQ_API_KEY=your_real_key
GROQ_MODEL=llama-3.1-8b-instant
GROQ_BASE_URL=https://api.groq.com/openai/v1
```

## 4) Run backend

```powershell
python -m app
```

API base URL: `http://127.0.0.1:8000/api`

Key endpoints:
- `POST /api/chat`
