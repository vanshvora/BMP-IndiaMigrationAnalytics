from __future__ import annotations

import json

from .schemas import ChatContext, ChatTurn


# ── Domain Knowledge ───────────────────────────────────────────────────
# Previously these lived in retrieval.py as separate "documents" that were
# searched with Jaccard overlap.  Since there are only six short paragraphs,
# it is far more efficient to inject them directly into the LLM context.

METHODOLOGY_CONTEXT = """
Key domain knowledge & table guide for India Census 2011 migration dataset:

1. Table Selection Guide:
   • For overall inter-state migration flows or top origin/destination corridors:
     Use `district_interstate_flows` (columns: `state`, `district`, `origin`, `count`, `male`, `female`, `rural`, `urban`).
     `origin` is the origin state, `state` is the destination state, `district` is destination district, and `count` is total migrants.
   • For migration reasons (Work, Business, Education, Marriage, Move with Household):
     Use `district_reason_migration_flows` or `state_d03_reasons`.
   • For duration of residence (<1yr, 1-4yr, 5-9yr, 10-19yr, 20+yr):
     Use `district_duration_residence_flows` or `state_d02_duration`.
   • For education levels:
     Use `district_education_levels` or `state_d04_education`.
   • For economic activity (Main / Marginal / Non-workers):
     Use `district_economic_activity` or `state_d06_activity`.
   • For marital status:
     Use `district_marital_status` or `state_d10_marital`.
   • For state-level birthplace flows:
     Use `state_d01_flows` (columns: `AreaName`, `BirthPlace`, "Total_Persons", "Total_Males", "Total_Females").

2. PostgreSQL Syntax & Quote Rules:
   • PostgreSQL column names containing ANY capital letters MUST be wrapped in double quotes exactly as written in the schema (e.g. "Persons_Total", "Total_Persons", "Persons_Work", "districtCode", "AreaName", "BirthPlace").
   • Unquoted column names are automatically lowercased by PostgreSQL and WILL FAIL if the schema uses mixed case.
   • Plain lowercase columns like `state`, `district`, `origin`, `count`, `male`, `female`, `rural`, `urban`, `state_norm`, `district_norm`, `origin_norm` do NOT require quotes.
   • Use `ILIKE` for case-insensitive text matching (e.g., `state ILIKE 'Maharashtr%'` or `origin ILIKE 'Uttar Pradesh'`).
""".strip()


# ── Helpers ────────────────────────────────────────────────────────────

def _context_block(context: ChatContext | None) -> str:
    """Serialises the dashboard context (selected state / district / etc.)."""
    if context is None:
        return "No active dashboard context."
    data = context.model_dump(exclude_none=True)
    return json.dumps(data, indent=2) if data else "No active dashboard context."


def _history_block(history: list[ChatTurn]) -> str:
    """Formats conversation history for the prompt."""
    if not history:
        return "No prior conversation."
    return "\n".join(f"{t.role}: {t.content}" for t in history)


# ── Prompt Builders ────────────────────────────────────────────────────

def build_sql_generation_prompt(
    *,
    schema_summary: str,
    question: str,
    context: ChatContext | None,
    history: list[ChatTurn],
    error_context: str | None = None,
) -> str:
    """
    Prompt for the LangGraph agent's **generate_sql** node.

    If `error_context` is provided it means a previous SQL attempt failed;
    the LLM should read the Postgres error and fix the query.
    """
    error_section = ""
    if error_context:
        error_section = f"""
⚠️  Your previous SQL query failed with this error:
{error_context}

Fix the query based on this error. Double-check column names, table names, and double quotes for mixed-case columns.
"""

    return f"""
You are a PostgreSQL expert.  Convert the user's natural-language question
about India's Census 2011 migration data into a single valid SQL query.

Rules
─────
1. Only SELECT queries.  Never INSERT / UPDATE / DELETE / DROP.
2. Use ONLY tables and columns listed in the schema below.
3. Wrap any mixed-case column names in double quotes (e.g. "Persons_Total", "BirthPlace", "Total_Persons").
4. Use ILIKE or _norm columns for case-insensitive text filtering.
5. When querying totals per state, district, or category, ALWAYS use SUM(...) and GROUP BY (e.g., `SELECT origin, SUM(count) AS total FROM district_interstate_flows GROUP BY origin ORDER BY total DESC LIMIT 1`).
6. Respect limits based on user intent:
   • If the user asks for the "highest", "lowest", "most", or "top" (singular), use ORDER BY ... LIMIT 1.
   • If a number N is specified (e.g., "top 5"), use LIMIT N.
   • Otherwise, for general list questions, default to LIMIT 10.
7. Return ONLY raw SQL — no markdown, no explanation, no code fences.

{METHODOLOGY_CONTEXT}

Database schema (columns with uppercase letters are double-quoted)
──────────────────────────────────────────────────────────────────
{schema_summary}

Dashboard context
─────────────────
{_context_block(context)}

Conversation history
────────────────────
{_history_block(history)}
{error_section}
User question: {question}

SQL:""".strip()


def build_answer_prompt(
    *,
    question: str,
    context: ChatContext | None,
    sql: str,
    rows: list[dict],
) -> str:
    """
    Prompt for the LangGraph agent's **generate_answer** node.
    Takes the SQL result rows and writes a plain-English answer.
    """
    return f"""
You are a friendly analytics assistant for India's Census 2011 migration data.
Write a clear, concise answer using ONLY the data below.

Rules
─────
• Directly answer the user's specific question:
  - If asked for the "highest", "top state/district", or "most", state the #1 result clearly right in the first sentence with its exact figure.
  - Do NOT dump or list all rows if the user only asked for the single highest item.
• Never invent numbers — use only what the results contain.
• If results are empty, say no data was found for the current filters.
• Format large numbers with commas  (e.g. 1,234,567).
• Include percentages when relevant.
• Keep the answer to 2-3 concise sentences.
• Do NOT output SQL, code blocks, JSON, or raw row dumps.

{METHODOLOGY_CONTEXT}

Question: {question}

Dashboard context:
{_context_block(context)}

SQL used:
{sql}

Results (up to 25 rows):
{json.dumps(rows[:25], ensure_ascii=False, default=str)}
""".strip()
