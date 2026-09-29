from __future__ import annotations

import re
from contextlib import nullcontext
from typing import TypedDict

from langgraph.graph import StateGraph, END
from langchain_core.language_models.chat_models import BaseChatModel

from .config import Settings
from .db import DatabaseManager
from .prompting import build_sql_generation_prompt, build_answer_prompt
from .schemas import ChatContext, ChatRequest, ChatResponse, ChatTurn, Citation


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


import sqlglot
from sqlglot import exp

def _validate_and_limit_sql(sql: str, allowed_tables: set[str]) -> tuple[str, str | None]:
    """
    Parses SQL into an AST to verify it's a safe SELECT query,
    checks tables against an allowlist, and enforces LIMIT 100.
    Returns (safe_sql, error_message).
    """
    try:
        parsed = sqlglot.parse_one(sql, dialect="postgres")
    except Exception as exc:
        return "", f"SQL syntax error: {exc}"

    if not isinstance(parsed, exp.Select):
        return "", "Only SELECT queries are allowed."

    for table in parsed.find_all(exp.Table):
        tbl_name = table.name.lower()
        if tbl_name not in allowed_tables:
            return "", f"Access to table '{tbl_name}' is not permitted."

    current_limit = parsed.args.get("limit")
    if current_limit:
        try:
            limit_val = int(current_limit.expression.name)
            if limit_val > 100:
                parsed.set("limit", sqlglot.parse_one("LIMIT 100"))
        except Exception:
            parsed.set("limit", sqlglot.parse_one("LIMIT 100"))
    else:
        parsed = parsed.limit(100)

    return parsed.sql(dialect="postgres"), None


def _generate_sql(state: AgentState, llm: BaseChatModel) -> dict:
    attempt = state.get("attempts", 0) + 1
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
    # Extract allowed tables dynamically from the schema in the state
    allowed_tables = {
        line.split(":")[0].lstrip("- ").strip().lower()
        for line in state["schema"].split("\n") if line.strip().startswith("-")
    }
    
    safe_sql, validation_error = _validate_and_limit_sql(sql, allowed_tables)
    if validation_error:
        return {"sql_error": validation_error, "result": []}

    rows, error = db.safe_execute(safe_sql)
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

    return graph.compile()


class ChatOrchestrator:

    def __init__(
        self,
        *,
        settings: Settings,
        db: DatabaseManager | None,
        llm: BaseChatModel | None,
        llm_error: str | None = None,
        db_error: str | None = None,
    ) -> None:
        self.settings = settings
        self.db = db
        self.db_error = db_error
        self.llm = llm
        self.llm_error = llm_error
        self.agent = build_sql_agent(llm, db) if (llm and db) else None

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

        if self.db_error or (self.db and not self.db.db_ok):
            err = self.db_error or "Database connection is not healthy."
            return ChatResponse(
                answer="I'm temporarily unable to access the database. Please try again later.",
                route="error",
                error=err,
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
                }
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
