"""
LangGraph-based SQL Agent & Chat Orchestrator.

Instead of the previous 500+ line rule-based SQL generator, this module
uses a **cyclic LangGraph state machine** that can:

    1. generate_sql  — ask the LLM to write a PostgreSQL query
    2. execute_sql   — run the query against the database
    3. (if error)    — feed the error back to the LLM so it can fix itself
    4. generate_answer — write a human-friendly answer from the results

The agent retries up to MAX_RETRIES times before giving up, making it
far more resilient than the old one-shot approach.
"""
from __future__ import annotations

import re
from typing import TypedDict

from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
from langchain_core.language_models.chat_models import BaseChatModel

from .config import Settings
from .db import DatabaseManager
from .prompting import build_sql_generation_prompt, build_answer_prompt
from .schemas import ChatContext, ChatRequest, ChatResponse, ChatTurn, Citation


# ── LangGraph State Definition ─────────────────────────────────────────

class AgentState(TypedDict):
    """Shared state that flows through every node in the graph."""
    question: str                   # the user's natural-language question
    context: ChatContext | None     # dashboard filters (state, district …)
    history: list[ChatTurn]         # recent conversation turns
    schema: str                     # database schema summary for the LLM
    sql: str                        # the most recent SQL query
    sql_error: str                  # error message from last execution (empty = ok)
    result: list[dict]              # rows returned by the last successful query
    answer: str                     # the final plain-English answer
    attempts: int                   # how many generate→execute cycles so far
    route: str                      # label for the response (sql / smalltalk / …)


# ── Smalltalk Detection ────────────────────────────────────────────────

def _smalltalk_response(question: str) -> str | None:
    """
    Returns a canned reply for greetings and help requests.
    Returns None if the message is a real data question.
    """
    lowered = question.strip().lower()
    compact = re.sub(r"[^a-z]+", "", lowered)

    greetings = {"hi", "hello", "hey", "hii", "hola", "namaste"}
    if compact in greetings:
        return (
            "Hello! Ask me about state-wise or district-wise migration data, "
            "and I can return exact numbers, rankings, and short insights."
        )

    if lowered in {"help", "start", "what can you do", "what can you do?"}:
        return (
            "I can help with questions like top destination states, gender "
            "split, rural vs urban share, migration reasons, and totals."
        )

    return None


# ── SQL Safety Check ───────────────────────────────────────────────────

def _validate_sql(sql: str) -> str | None:
    """
    Basic safety gate: ensures the generated SQL is a SELECT and
    does not contain dangerous keywords.
    Returns an error string if invalid, None if it looks safe.
    """
    cleaned = sql.strip().rstrip(";")
    if not cleaned:
        return "Generated SQL was empty."

    lowered = cleaned.lower()
    if not (lowered.startswith("select") or lowered.startswith("with")):
        return "Only SELECT queries are allowed."

    banned = [
        "insert", "update", "delete", "drop", "alter", "create",
        "truncate", "attach", "copy", "install", "load",
    ]
    for word in banned:
        if re.search(rf"\b{word}\b", lowered):
            return f"Disallowed SQL keyword: {word}"

    return None


# ── LangGraph Node Functions ───────────────────────────────────────────
# Each function receives the current state, does one thing, and returns
# a dict of updated fields.  LangGraph merges the dict into the state.

def _generate_sql(state: AgentState, llm: BaseChatModel) -> dict:
    """
    Node 1 – Ask the LLM to write a SQL query.
    If there was a previous error, the prompt includes it so the LLM
    can fix its own mistake (self-correction).
    """
    prompt = build_sql_generation_prompt(
        schema_summary=state["schema"],
        question=state["question"],
        context=state.get("context"),
        history=state.get("history", []),
        error_context=state.get("sql_error") or None,
    )

    response = llm.invoke(prompt)
    raw_sql = str(response.content).strip()

    # Strip markdown code fences if the LLM wrapped the SQL
    if raw_sql.startswith("```"):
        raw_sql = re.sub(r"^```(?:sql)?\n?", "", raw_sql)
        raw_sql = re.sub(r"\n?```$", "", raw_sql)

    return {
        "sql": raw_sql.strip(),
        "attempts": state.get("attempts", 0) + 1,
    }


def _execute_sql(state: AgentState, db: DatabaseManager) -> dict:
    """
    Node 2 – Run the SQL against PostgreSQL.
    Uses safe_execute() so a bad query returns an error string
    instead of crashing the whole request.
    """
    sql = state["sql"]

    # Quick safety check before hitting the database
    validation_error = _validate_sql(sql)
    if validation_error:
        return {"sql_error": validation_error, "result": []}

    rows, error = db.safe_execute(sql)
    if error:
        return {"sql_error": error, "result": []}

    return {"sql_error": "", "result": rows or []}


def _generate_answer(state: AgentState, llm: BaseChatModel) -> dict:
    """
    Node 3 – Convert the SQL results into a human-readable answer.
    """
    rows = state.get("result", [])

    # If no rows came back, give a simple "not found" message
    if not rows:
        return {
            "answer": (
                "No data was found for your question with the current "
                "filters. Try rephrasing or changing the selected "
                "state / district."
            ),
            "route": "sql",
        }

    prompt = build_answer_prompt(
        question=state["question"],
        context=state.get("context"),
        sql=state["sql"],
        rows=rows,
    )

    response = llm.invoke(prompt)
    return {"answer": str(response.content).strip(), "route": "sql"}


def _should_retry(state: AgentState) -> str:
    """
    Decision edge – called after execute_sql.
    • If there was an error AND we haven't hit the retry limit → retry
    • Otherwise → move on to generate_answer
    """
    has_error = bool(state.get("sql_error"))
    under_limit = state.get("attempts", 0) < 3

    if has_error and under_limit:
        return "retry"
    return "answer"


# ── Graph Builder ──────────────────────────────────────────────────────

def build_sql_agent(llm: BaseChatModel, db: DatabaseManager):
    """
    Constructs the LangGraph state machine.

    Flow diagram:
        ┌──────────────┐
        │ generate_sql  │◄─── retry (error + attempts < 3)
        └──────┬───────┘
               ▼
        ┌──────────────┐
        │  execute_sql  │
        └──────┬───────┘
               ▼
          (should_retry?)
            │         │
          retry     answer
            │         ▼
            │   ┌─────────────────┐
            │   │ generate_answer  │ ──► END
            │   └─────────────────┘
            └─────────────────────────┘
    """
    graph = StateGraph(AgentState)

    # Register nodes — lambdas inject the LLM and DB dependencies
    graph.add_node("generate_sql", lambda s: _generate_sql(s, llm))
    graph.add_node("execute_sql", lambda s: _execute_sql(s, db))
    graph.add_node("generate_answer", lambda s: _generate_answer(s, llm))

    # Wire the edges
    graph.set_entry_point("generate_sql")
    graph.add_edge("generate_sql", "execute_sql")
    graph.add_conditional_edges("execute_sql", _should_retry, {
        "retry": "generate_sql",
        "answer": "generate_answer",
    })
    graph.add_edge("generate_answer", END)

    # MemorySaver keeps agent state across invocations (thread-safe)
    memory = MemorySaver()
    return graph.compile(checkpointer=memory)


# ── Chat Orchestrator ──────────────────────────────────────────────────

class ChatOrchestrator:
    """
    Top-level entry point for the /chat endpoint.

    Responsibilities:
        1. Catch smalltalk (greetings, "help") → return canned reply
        2. Everything else → delegate to the LangGraph SQL agent
    """

    def __init__(
        self,
        *,
        settings: Settings,
        db: DatabaseManager,
        llm: BaseChatModel | None,
        llm_error: str | None = None,
    ) -> None:
        self.settings = settings
        self.db = db
        self.llm = llm
        self.llm_error = llm_error

        # Build the LangGraph agent (if the LLM loaded successfully)
        self.agent = build_sql_agent(llm, db) if llm else None

    def _follow_ups(
        self, state: str | None, district: str | None,
    ) -> list[str]:
        """Suggests contextual follow-up questions."""
        prompts = [
            "Show the top 5 destination states by total migrants.",
            "What is the gender split of migrants?",
            "Show rural vs urban migration share.",
        ]
        if state:
            prompts.insert(0, f"Give key migration insights for {state}.")
        if district:
            prompts.insert(0, f"Show top origin regions for {district}.")
        return prompts[:4]

    # ── Main Chat Method ───────────────────────────────────────────────

    def chat(self, request: ChatRequest) -> ChatResponse:
        ctx_state = request.context.selected_state if request.context else None
        ctx_district = request.context.selected_district if request.context else None
        follow_ups = self._follow_ups(ctx_state, ctx_district)

        # 1. Smalltalk
        smalltalk = _smalltalk_response(request.message)
        if smalltalk:
            return ChatResponse(
                answer=smalltalk, route="smalltalk", follow_ups=follow_ups,
            )

        # 2. Guard: LLM must be available
        if not self.agent:
            return ChatResponse(
                answer=self.llm_error or "LLM is not configured.",
                route="error",
                error=self.llm_error,
            )

        # 3. Run the LangGraph SQL agent
        try:
            schema = self.db.schema_summary()
            history = request.history[-self.settings.max_history_turns :]

            result = self.agent.invoke(
                {
                    "question": request.message,
                    "context": request.context,
                    "history": history,
                    "schema": schema,
                    "sql": "",
                    "sql_error": "",
                    "result": [],
                    "answer": "",
                    "attempts": 0,
                    "route": "sql",
                },
                config={"configurable": {"thread_id": "default"}},
            )

            return ChatResponse(
                answer=result.get("answer", "I could not generate an answer."),
                route=result.get("route", "sql"),
                sql=result.get("sql"),
                data_preview=result.get("result", [])[:self.settings.max_rows_preview],
                citations=[Citation(label="LangGraph SQL Agent")],
                follow_ups=follow_ups,
            )

        except Exception as exc:
            return ChatResponse(
                answer="Something went wrong while processing your question. Please try again.",
                route="error",
                error=str(exc),
                follow_ups=follow_ups,
            )
