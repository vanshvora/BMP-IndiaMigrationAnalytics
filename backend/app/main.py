from __future__ import annotations

import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import settings
from .db import DatabaseManager
from .llm_provider import LLMInitializationError, build_chat_model
from .schemas import ChatRequest, ChatResponse
from .sql_agent import ChatOrchestrator


# Logfire observability
try:
    import logfire as _logfire

    if settings.logfire_token:
        _logfire.configure(token=settings.logfire_token)
        _LOGFIRE_READY = True
    else:
        _LOGFIRE_READY = False
except ImportError:
    _logfire = None          # type: ignore[assignment]
    _LOGFIRE_READY = False

if _LOGFIRE_READY and _logfire is not None:
    try:
        _logfire.instrument_openai()
    except Exception:
        pass


app = FastAPI(title=settings.app_name)

if _LOGFIRE_READY and _logfire is not None:
    _logfire.instrument_fastapi(app)


def _logfire_span(name: str, **attrs):
    if _LOGFIRE_READY and _logfire is not None:
        return _logfire.span(name, **attrs)
    from contextlib import nullcontext
    return nullcontext()

is_local = settings.backend_host in {"127.0.0.1", "localhost", "0.0.0.0"}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if is_local else settings.cors_origins,
    allow_credentials=False if is_local else True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# NeMo Guardrails
_guardrails_engine = None
_GUARDRAIL_BLOCK_PHRASE = "I can only assist with questions about India"


def _init_guardrails() -> None:
    global _guardrails_engine

    try:
        guardrails_dir = Path(__file__).parent.parent / "guardrails"
        if not guardrails_dir.exists():
            print("[INFO] guardrails/ dir not found — skipping NeMo Guardrails.")
            return

        os.environ.setdefault("OPENAI_API_KEY", settings.groq_api_key or "")
        os.environ.setdefault("OPENAI_BASE_URL", settings.groq_base_url)

        from nemoguardrails import RailsConfig, LLMRails

        config = RailsConfig.from_path(str(guardrails_dir))
        _guardrails_engine = LLMRails(config)
        print("[SUCCESS] NeMo Guardrails loaded.")
    except Exception as exc:
        print(f"[WARNING] Guardrails not loaded: {exc}")


# Startup

def _build_orchestrator() -> ChatOrchestrator:
    db = DatabaseManager(settings)

    llm = None
    llm_error = None
    try:
        llm = build_chat_model(settings)
    except LLMInitializationError as exc:
        llm_error = str(exc)

    return ChatOrchestrator(
        settings=settings,
        db=db,
        llm=llm,
        llm_error=llm_error,
    )


@app.on_event("startup")
def on_startup() -> None:
    app.state.orchestrator = _build_orchestrator()
    _init_guardrails()


# Chat endpoint

@app.post(f"{settings.api_prefix}/chat", response_model=ChatResponse)
def chat(payload: ChatRequest) -> ChatResponse:

    if _guardrails_engine is not None:
        with _logfire_span("guardrails_check", message=payload.message[:120]):
            try:
                result = _guardrails_engine.generate(
                    messages=[{"role": "user", "content": payload.message}]
                )
                content = (
                    result.get("content", "")
                    if isinstance(result, dict)
                    else str(result)
                )
                if content and content.strip():
                    lowered = content.lower()
                    if "can't respond" in lowered or "cannot help" in lowered or "can only assist" in lowered or "blocked" in lowered:
                        blocked_answer = (
                            "I can only assist with questions about India's Census 2011 "
                            "migration data. Try asking about migration statistics, state or "
                            "district trends, gender splits, or migration reasons."
                        )
                        return ChatResponse(answer=blocked_answer, route="blocked")
            except Exception:
                pass

    orchestrator: ChatOrchestrator = app.state.orchestrator
    return orchestrator.chat(payload)


@app.exception_handler(Exception)
def unhandled_exception_handler(_, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "error": "internal_server_error",
            "message": str(exc),
        },
    )
