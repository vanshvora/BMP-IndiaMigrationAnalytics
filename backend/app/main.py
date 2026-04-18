from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import settings
from .db import DatabaseManager
from .llm_provider import LLMInitializationError, build_chat_model
from .retrieval import LexicalRetriever, build_default_documents
from .schemas import ChatRequest, ChatResponse, HealthResponse
from .sql_agent import ChatOrchestrator


app = FastAPI(title=settings.app_name)

is_local_backend = settings.backend_host in {"127.0.0.1", "localhost", "0.0.0.0"}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if is_local_backend else settings.cors_origins,
    allow_credentials=False if is_local_backend else True,
    allow_methods=["*"],
    allow_headers=["*"],
)




def _build_orchestrator() -> tuple[ChatOrchestrator, str | None]:
    db = DatabaseManager(settings)
    db.initialize()

    retriever = LexicalRetriever(build_default_documents())

    llm = None
    llm_error = None
    try:
        llm = build_chat_model(settings)
    except LLMInitializationError as exc:
        llm_error = str(exc)

    orchestrator = ChatOrchestrator(
        settings=settings,
        db=db,
        retriever=retriever,
        llm=llm,
        llm_error=llm_error,
    )
    return orchestrator, llm_error


@app.on_event("startup")
def on_startup() -> None:
    orchestrator, llm_error = _build_orchestrator()
    app.state.orchestrator = orchestrator
    app.state.llm_error = llm_error


@app.get(f"{settings.api_prefix}/health", response_model=HealthResponse)
def health() -> HealthResponse:
    orchestrator: ChatOrchestrator = app.state.orchestrator
    return HealthResponse(
        ok=True,
        db_ready=orchestrator.db.initialized,
        llm_ready=orchestrator.llm is not None,
        llm_provider=settings.llm_provider,
        llm_error=app.state.llm_error,
    )




@app.get(f"{settings.api_prefix}/context/options")
def context_options() -> dict:
    orchestrator: ChatOrchestrator = app.state.orchestrator
    return orchestrator.db.context_options()


@app.get(f"{settings.api_prefix}/schema")
def schema() -> dict:
    orchestrator: ChatOrchestrator = app.state.orchestrator
    return {"tables": orchestrator.db.list_tables(), "schema": orchestrator.db.schema_summary()}


@app.post(f"{settings.api_prefix}/chat", response_model=ChatResponse)
def chat(payload: ChatRequest) -> ChatResponse:
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
