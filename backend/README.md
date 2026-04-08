# AI Chatbot Backend (Local)

## 1) Create virtual environment

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
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

Example for Gemini:

```env
LLM_PROVIDER=google
GOOGLE_API_KEY=your_real_key
GOOGLE_MODEL=gemini-2.5-flash
```

Example for Groq:

```env
LLM_PROVIDER=groq
GROQ_API_KEY=your_real_key
GROQ_MODEL=llama-3.1-8b-instant
GROQ_BASE_URL=https://api.groq.com/openai/v1
```

Optional safeguards:

```env
CHAT_RATE_LIMIT_PER_MINUTE=40
CHAT_CACHE_TTL_SECONDS=180
CHAT_CACHE_MAX_ENTRIES=500
```

## 4) Run backend

```powershell
python -m app
```

API base URL: `http://127.0.0.1:8000/api`

Key endpoints:
- `GET /api/health`
- `GET /api/faq`
- `GET /api/context/options`
- `POST /api/chat`
