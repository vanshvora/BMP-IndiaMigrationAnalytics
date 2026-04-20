from __future__ import annotations

import json

from .schemas import ChatContext, ChatTurn


FEW_SHOT_SQL_EXAMPLES = [
    {
        "question": "Top 5 destination states by total migrants",
        "sql": (
            "SELECT AreaName AS destination_state, SUM(Total_Persons) AS total_migrants "
            "FROM state_d01_flows "
            "GROUP BY AreaName "
            "ORDER BY total_migrants DESC "
            "LIMIT 5"
        ),
    },
    {
        "question": "Top 5 origin states for Pune district by female migrants",
        "sql": (
            "SELECT origin, SUM(female) AS female_migrants "
            "FROM district_interstate_flows "
            "WHERE district_norm = 'pune' "
            "GROUP BY origin "
            "ORDER BY female_migrants DESC "
            "LIMIT 5"
        ),
    },
    {
        "question": "For Karnataka, show male and female totals for district inflows",
        "sql": (
            "SELECT state, SUM(male) AS male_total, SUM(female) AS female_total "
            "FROM district_interstate_flows "
            "WHERE state_norm = 'karnataka' "
            "GROUP BY state"
        ),
    },
    {
        "question": "Which states receive the most migrants?",
        "sql": (
            "SELECT AreaName AS destination_state, SUM(Total_Persons) AS total_migrants "
            "FROM state_d01_flows "
            "GROUP BY AreaName "
            "ORDER BY total_migrants DESC "
            "LIMIT 5"
        ),
    },
    {
        "question": "How many people migrated from Gujarat?",
        "sql": (
            "SELECT BirthPlace AS origin_state, SUM(Total_Persons) AS total_migrants "
            "FROM state_d01_flows "
            "WHERE BirthPlace_norm = 'gujarat' "
            "GROUP BY BirthPlace"
        ),
    },
    {
        "question": "What is the national rural vs urban migration split?",
        "sql": (
            "SELECT SUM(Rural_Persons) AS rural_total, SUM(Urban_Persons) AS urban_total, "
            "SUM(Total_Persons) AS total_migrants "
            "FROM state_d01_flows"
        ),
    },
]


def _context_block(context: ChatContext | None) -> str:
    if context is None:
        return "No active dashboard context."
    data = context.model_dump(exclude_none=True)
    if not data:
        return "No active dashboard context."
    return json.dumps(data, indent=2)


def _history_block(history: list[ChatTurn]) -> str:
    if not history:
        return "No prior history."
    lines = [f"{turn.role}: {turn.content}" for turn in history]
    return "\n".join(lines)


def build_sql_prompt(
    *,
    schema_summary: str,
    question: str,
    canonical_question: str,
    context: ChatContext | None,
    history: list[ChatTurn],
    allowed_tables: list[str],
) -> str:
    examples = "\n".join(
        [f"Q: {item['question']}\nSQL: {item['sql']}" for item in FEW_SHOT_SQL_EXAMPLES]
    )
    return f"""
You are a strict SQL planner for DuckDB.
Return ONLY valid JSON, no markdown.

Rules:
1) Only generate SELECT queries.
2) Use only tables from this allow-list: {", ".join(sorted(allowed_tables))}
3) Prefer normalized columns (*_norm) for text filtering where available.
4) Respect active context when relevant (selected_state, selected_district, threshold).
5) Add LIMIT if query may return many rows.
6) If question is not answerable with SQL from available schema, return sql as empty string and explain why.

Schema:
{schema_summary}

Few-shot examples:
{examples}

Conversation history:
{_history_block(history)}

Active dashboard context:
{_context_block(context)}

User question:
{question}

Canonical interpretation:
{canonical_question}

Output JSON schema:
{{
  "sql": "SELECT ...",
  "reason": "brief reason"
}}
""".strip()


def build_sql_answer_prompt(
    *,
    question: str,
    context: ChatContext | None,
    sql: str,
    rows: list[dict],
) -> str:
    return f"""
You are an analytics assistant for India Migration data.
Use only the SQL result rows below and do not invent values.
If rows are empty, say that no rows were found for the current filters.
Keep answer concise and insight-oriented.
Do NOT show SQL, code blocks, JSON, lists of raw rows, or headings like "SQL used" or "Result".
Answer for a non-technical end user in plain English.
If percentages are relevant, state them directly in one or two sentences.

Question:
{question}

Context:
{_context_block(context)}

SQL used:
{sql}

Rows:
{json.dumps(rows, ensure_ascii=True)}
""".strip()


def build_rag_answer_prompt(
    *,
    question: str,
    context: ChatContext | None,
    retrieved_docs: list[dict[str, str]],
) -> str:
    return f"""
You are a migration analytics assistant.
Answer using only the retrieved context and the dashboard context.
If context is insufficient, say so clearly.

Question:
{question}

Dashboard context:
{_context_block(context)}

Retrieved context:
{json.dumps(retrieved_docs, ensure_ascii=True)}
""".strip()

