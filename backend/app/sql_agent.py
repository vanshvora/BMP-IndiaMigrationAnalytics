from __future__ import annotations

import re
from contextlib import nullcontext
from typing import TypedDict

from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
from langchain_core.language_models.chat_models import BaseChatModel

from .config import Settings
from .db import DatabaseManager
from .prompting import build_sql_generation_prompt, build_answer_prompt
from .schemas import ChatContext, ChatRequest, ChatResponse, ChatTurn, Citation

try:
    import logfire
except ImportError:
    logfire = None  # type: ignore[assignment]


def _span(name: str, **attrs):
    if logfire:
        return logfire.span(name, **attrs)
    return nullcontext()


class AgentState(TypedDict):
    question: str
    context: ChatContext | None
    history: list[ChatTurn]
    schema: str
    sql: str
    sql_error: str
    result: list[dict]
    answer: str
    attempts: int
    route: str


def _smalltalk_response(question: str) -> str | None:
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


def _validate_sql(sql: str) -> str | None:
    """Ensures the SQL is a SELECT and contains no dangerous keywords."""
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


def _generate_sql(state: AgentState, llm: BaseChatModel) -> dict:
    attempt = state.get("attempts", 0) + 1
    with _span("agent.generate_sql", attempt=attempt):
        prompt = build_sql_generation_prompt(
            schema_summary=state["schema"],
            question=state["question"],
            context=state.get("context"),
            history=state.get("history", []),
            error_context=state.get("sql_error") or None,
        )

        response = llm.invoke(prompt)
        raw_sql = str(response.content).strip()

        if raw_sql.startswith("```"):
            raw_sql = re.sub(r"^```(?:sql)?\n?", "", raw_sql)
            raw_sql = re.sub(r"\n?```$", "", raw_sql)

        return {
            "sql": raw_sql.strip(),
            "attempts": attempt,
        }


def _execute_sql(state: AgentState, db: DatabaseManager) -> dict:
    sql = state["sql"]
    with _span("agent.execute_sql", sql=sql[:200]):
        validation_error = _validate_sql(sql)
        if validation_error:
            return {"sql_error": validation_error, "result": []}

        rows, error = db.safe_execute(sql)
        if error:
            return {"sql_error": error, "result": []}

        return {"sql_error": "", "result": rows or []}


def _generate_answer(state: AgentState, llm: BaseChatModel) -> dict:
    rows = state.get("result", [])

    if not rows:
        return {
            "answer": (
                "No data was found for your question with the current "
                "filters. Try rephrasing or changing the selected "
                "state / district."
            ),
            "route": "sql",
        }

    with _span("agent.generate_answer", row_count=len(rows)):
        prompt = build_answer_prompt(
            question=state["question"],
            context=state.get("context"),
            sql=state["sql"],
            rows=rows,
        )

        response = llm.invoke(prompt)
        return {"answer": str(response.content).strip(), "route": "sql"}


def _should_retry(state: AgentState) -> str:
    has_error = bool(state.get("sql_error"))
    under_limit = state.get("attempts", 0) < 3

    if has_error and under_limit:
        return "retry"
    return "answer"


def build_sql_agent(llm: BaseChatModel, db: DatabaseManager):
    graph = StateGraph(AgentState)

    graph.add_node("generate_sql", lambda s: _generate_sql(s, llm))
    graph.add_node("execute_sql", lambda s: _execute_sql(s, db))
    graph.add_node("generate_answer", lambda s: _generate_answer(s, llm))

    graph.set_entry_point("generate_sql")
    graph.add_edge("generate_sql", "execute_sql")
    graph.add_conditional_edges("execute_sql", _should_retry, {
        "retry": "generate_sql",
        "answer": "generate_answer",
    })
    graph.add_edge("generate_answer", END)

    memory = MemorySaver()
    return graph.compile(checkpointer=memory)


class ChatOrchestrator:

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
        self.agent = build_sql_agent(llm, db) if llm else None

    def _follow_ups(
        self, state: str | None, district: str | None,
    ) -> list[str]:
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

    def chat(self, request: ChatRequest) -> ChatResponse:
        ctx_state = request.context.selected_state if request.context else None
        ctx_district = request.context.selected_district if request.context else None
        follow_ups = self._follow_ups(ctx_state, ctx_district)

        smalltalk = _smalltalk_response(request.message)
        if smalltalk:
            return ChatResponse(
                answer=smalltalk, route="smalltalk", follow_ups=follow_ups,
            )

        if not self.agent:
            return ChatResponse(
                answer=self.llm_error or "LLM is not configured.",
                route="error",
                error=self.llm_error,
            )

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
