from __future__ import annotations

import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from fastapi.responses import JSONResponse
import asyncio
from concurrent.futures import ThreadPoolExecutor

from .config import settings
from .db import DatabaseManager
from .llm_provider import LLMInitializationError, build_chat_model
from .schemas import ChatRequest, ChatResponse
from .sql_agent import ChatOrchestrator


app = FastAPI(title=settings.app_name)

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
    db_error = None
    try:
        db = DatabaseManager(settings)
        if not db.db_ok:
            db_error = "Database connection failed at startup."
    except Exception as exc:
        db = None
        db_error = str(exc)

    llm = None
    llm_error = None
    try:
        llm = build_chat_model(settings)
    except Exception as exc:
        llm_error = str(exc)

    return ChatOrchestrator(
        settings=settings,
        db=db,
        llm=llm,
        llm_error=llm_error,
        db_error=db_error,
    )


@asynccontextmanager
async def lifespan_context(app_instance: FastAPI):
    app_instance.state.orchestrator = _build_orchestrator()
    _init_guardrails()
    yield
    analytics_pool.shutdown(wait=False)
    if hasattr(app_instance.state, "orchestrator") and app_instance.state.orchestrator.db:
        if app_instance.state.orchestrator.db.pool:
            app_instance.state.orchestrator.db.pool.closeall()

app.router.lifespan_context = lifespan_context


# Chat endpoint

@app.get(f"{settings.api_prefix}/health")
def health_check():
    orchestrator = getattr(app.state, "orchestrator", None)
    db_ok = False
    llm_ok = False
    schema_tables = 0
    if orchestrator:
        if orchestrator.db:
            db_ok = orchestrator.db.db_ok
            if orchestrator.db._schema:
                schema_tables = len(orchestrator.db._schema.split("\n"))
        llm_ok = orchestrator.llm_error is None
        
    return {
        "db_ok": db_ok,
        "llm_ok": llm_ok,
        "schema_tables": schema_tables
    }


# Dedicated Analytics Thread Pool
analytics_pool = ThreadPoolExecutor(
    max_workers=10, 
    thread_name_prefix="analytics_worker"
)

@app.post(f"{settings.api_prefix}/chat", response_model=ChatResponse)
async def chat(payload: ChatRequest) -> ChatResponse:
    # Wrap the heavy synchronous AI/DB work in a dedicated thread to prevent blocking the async event loop
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(
        analytics_pool, 
        _sync_chat_execution, 
        payload, 
        getattr(app.state, "orchestrator", None)
    )

def _sync_chat_execution(payload: ChatRequest, orchestrator) -> ChatResponse:
    if _guardrails_engine is not None:
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

    if not orchestrator:
        return ChatResponse(answer="System is not fully initialized yet.", route="error", error="not_initialized")
        
    return orchestrator.chat(payload)


@app.exception_handler(Exception)
def unhandled_exception_handler(_, exc: Exception):
    return JSONResponse(
        status_code=503,
        content={
            "error": "service_unavailable",
            "message": "An internal error occurred while processing your request.",
            "details": str(exc) if is_local else "Internal Server Error"
        },
    )
