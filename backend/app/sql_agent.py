from __future__ import annotations

import difflib
import json
import re
from typing import Any

import sqlglot
from langchain_core.language_models.chat_models import BaseChatModel

from .config import Settings
from .db import DatabaseManager
from .prompting import build_rag_answer_prompt, build_sql_answer_prompt, build_sql_prompt
from .retrieval import LexicalRetriever
from .schemas import ChatContext, ChatRequest, ChatResponse, ChatTurn, Citation


class SQLValidationError(RuntimeError):
    pass


def _extract_json(raw_text: str) -> dict[str, Any]:
    raw_text = raw_text.strip()
    if raw_text.startswith("```"):
        raw_text = raw_text.strip("`")

    try:
        return json.loads(raw_text)
    except json.JSONDecodeError:
        pass

    match = re.search(r"\{.*\}", raw_text, flags=re.DOTALL)
    if not match:
        raise ValueError("Could not parse JSON from model output.")
    return json.loads(match.group(0))


def _normalize_sql(sql: str) -> str:
    return sql.strip().rstrip(";")


def _ensure_limit(sql: str, default_limit: int) -> str:
    if re.search(r"\blimit\s+\d+\b", sql, flags=re.IGNORECASE):
        return sql
    return f"{sql}\nLIMIT {default_limit}"


def _validate_select_sql(sql: str, allowed_tables: set[str]) -> tuple[str, list[str]]:
    normalized = _normalize_sql(sql)
    if not normalized:
        raise SQLValidationError("Generated SQL was empty.")

    lowered = normalized.lower()
    if not (lowered.startswith("select") or lowered.startswith("with")):
        raise SQLValidationError("Only SELECT SQL is allowed.")

    banned_words = [
        "insert",
        "update",
        "delete",
        "drop",
        "alter",
        "create",
        "replace",
        "truncate",
        "attach",
        "copy",
        "install",
        "load",
        "call",
    ]
    for word in banned_words:
        if re.search(rf"\b{word}\b", lowered):
            raise SQLValidationError(f"Disallowed SQL keyword detected: {word}")

    try:
        parsed = sqlglot.parse_one(normalized, read="duckdb")
    except Exception as exc:
        raise SQLValidationError(f"SQL parse failed: {exc}") from exc

    referenced = sorted({table.name for table in parsed.find_all(sqlglot.exp.Table) if table.name})
    if not referenced:
        raise SQLValidationError("SQL does not reference any table.")

    disallowed = [table for table in referenced if table not in allowed_tables]
    if disallowed:
        raise SQLValidationError(
            f"SQL referenced table(s) outside allow-list: {', '.join(disallowed)}"
        )

    return normalized, referenced


def _normalize_text(value: str | None) -> str:
    if not value:
        return ""
    return re.sub(r"[^a-z0-9]+", "", value.lower())


def _extract_top_n(question: str, default: int = 5, max_value: int = 25) -> int:
    match = re.search(r"\btop\s+(\d{1,2})\b", question.lower())
    if not match:
        return default
    value = int(match.group(1))
    if value < 1:
        return default
    return min(value, max_value)


def _extract_location_after_keyword(question: str, keyword: str) -> str:
    match = re.search(rf"\b{keyword}\s+([a-z][a-z\s&-]+)", question.lower())
    if not match:
        return ""
    location = match.group(1).strip()
    location = re.split(r"\b(?:from|to|into|by|for|with|in percentage|percentage|share|split)\b", location)[0].strip()
    return _normalize_text(location)


def _resolve_normalized_location(raw_location: str, candidates: list[str]) -> str:
    if not raw_location:
        return ""

    normalized_candidates = {_normalize_text(candidate): candidate for candidate in candidates}
    if raw_location in normalized_candidates:
        return raw_location

    match = difflib.get_close_matches(raw_location, list(normalized_candidates.keys()), n=1, cutoff=0.78)
    return match[0] if match else raw_location


def _canonicalize_question(question: str) -> str:
    canonical = question.strip().lower()

    replacements = [
        (r"\bwhich states have the highest in[- ]migration corridors\b", "top destination states by total migrants"),
        (r"\bwhich states have the highest out[- ]migration corridors\b", "top origin states by total migrants"),
        (r"\bwhich states receive the most migrants\b", "top destination states by total migrants"),
        (r"\bwhich states attract the most migrants\b", "top destination states by total migrants"),
        (r"\bwhich states send the most migrants\b", "top origin states by total migrants"),
        (r"\bhow many people migrated from ([a-z][a-z\s&-]+)\b", r"total migrants from \1"),
        (r"\bhow many migrated from ([a-z][a-z\s&-]+)\b", r"total migrants from \1"),
        (r"\bhow many people migrated to ([a-z][a-z\s&-]+)\b", r"total migrants to \1"),
        (r"\bhow many migrated to ([a-z][a-z\s&-]+)\b", r"total migrants to \1"),
        (r"\bmale vs female\b", "gender split"),
        (r"\brural vs urban\b", "rural urban split"),
        (r"\brural versus urban\b", "rural urban split"),
        (r"\bin migration\b", "in-migration"),
        (r"\bout migration\b", "out-migration"),
    ]

    for pattern, replacement in replacements:
        canonical = re.sub(pattern, replacement, canonical)

    return canonical


def _canonicalize_follow_up(question: str, history: list[ChatTurn]) -> str:
    canonical = _canonicalize_question(question)
    if "out-migration" not in canonical and "in-migration" not in canonical:
        return canonical

    is_short_follow_up = bool(
        re.search(r"\b(what about|how about|and|what of)\b", canonical)
    ) or len(canonical.split()) <= 5
    if not is_short_follow_up:
        return canonical

    previous_user = next(
        (turn.content for turn in reversed(history) if turn.role == "user"),
        "",
    )
    previous = _canonicalize_question(previous_user)
    had_top_state_intent = (
        ("top" in previous or "highest" in previous or "largest" in previous)
        and "state" in previous
        and ("migration" in previous or "migrants" in previous)
    )
    if not had_top_state_intent:
        return canonical

    if "out-migration" in canonical:
        return "top origin states by total migrants"
    return "top destination states by total migrants"


def _is_quota_error(exc: Exception) -> bool:
    text = str(exc).lower()
    return "quota" in text or "rate limit" in text or "429" in text


def _smalltalk_response(question: str) -> str | None:
    lowered = question.strip().lower()
    compact = re.sub(r"[^a-z]+", "", lowered)
    greetings = {"hi", "hello", "hey", "hii", "hola", "namaste"}
    help_prompts = {"help", "start", "menu"}
    how_are_you_prompts = {"how are you", "how are u", "how r you", "hi how are you", "hello how are you"}

    if compact in greetings:
        return (
            "Hello! Ask me about state-wise or district-wise migration data, and I can return exact numbers, "
            "rankings, and short insights."
        )

    if lowered in how_are_you_prompts:
        return (
            "I am doing well and ready to help. Ask me about migration by state or district, gender split, "
            "rural versus urban share, migration reasons, or totals."
        )

    if compact in help_prompts or lowered in {"what can you do", "what can you do?", "help me"}:
        return (
            "I can help with migration questions like top destination states, top origin regions for a district, "
            "gender split, rural versus urban share, migration reasons, and methodology/source explanations."
        )

    return None


def _needs_rephrase_response(question: str) -> str | None:
    text = question.strip()
    compact = re.sub(r"[^a-z0-9]+", "", text.lower())
    alpha_only = re.sub(r"[^a-z]+", "", text.lower())
    lowered = text.lower()

    casual_markers = {
        "whatever",
        "okay",
        "ok",
        "okk",
        "hmm",
        "hmmm",
        "lol",
        "fine",
        "nice",
        "cool",
        "bro",
        "huh",
        "alright",
    }

    if len(compact) < 2:
        return "I am here when you're ready. You can ask me about migration by state, district, gender split, reasons, or totals."

    if compact in casual_markers or lowered in casual_markers:
        return (
            "No problem. I am here whenever you want to explore the data. You can ask about top migration corridors, "
            "gender split, rural versus urban share, migration reasons, or district-level trends."
        )

    if alpha_only and len(set(alpha_only)) <= 3 and len(alpha_only) >= 12:
        return (
            "That does not look like a migration question yet, but I am here to help when you're ready. You can ask something like "
            "'Which states have the highest in-migration corridors?' or 'Give male vs female share in percentage terms.'"
        )

    if not re.search(r"[aeiou]", alpha_only) and len(alpha_only) >= 8:
        return (
            "I am not sure what you meant there, but I can help with migration questions in plain language about states, districts, "
            "gender split, migration reasons, or totals."
        )

    return None


def _rule_based_sql(question: str, context: ChatContext | None, state_names: list[str] | None = None) -> tuple[str, str] | None:
    lowered = _canonicalize_question(question)
    top_n = _extract_top_n(lowered)
    selected_state = _normalize_text(context.selected_state if context else None)
    selected_district = _normalize_text(context.selected_district if context else None)
    candidates = state_names or []
    state_from_question = _resolve_normalized_location(_extract_location_after_keyword(question, "from"), candidates)
    destination_from_question = _resolve_normalized_location(_extract_location_after_keyword(question, "to"), candidates)

    asks_gender = "male" in lowered or "female" in lowered or "gender" in lowered
    asks_rural_urban = "rural" in lowered or "urban" in lowered
    asks_top = "top" in lowered or "highest" in lowered or "largest" in lowered
    asks_in_migration = "in-migration" in lowered or "in migration" in lowered or "destination" in lowered
    asks_out_migration = "out-migration" in lowered or "out migration" in lowered
    asks_total_migrants = (
        "how many" in lowered
        or "total" in lowered
        or "migrated" in lowered
        or "moved" in lowered
        or "migrants" in lowered
    )

    if asks_top and asks_in_migration and ("state" in lowered or "corridor" in lowered):
        return (
            (
                "SELECT AreaName AS destination_state, SUM(Total_Persons) AS total_migrants "
                "FROM state_d01_flows "
                "GROUP BY AreaName "
                "ORDER BY total_migrants DESC "
                f"LIMIT {top_n}"
            ),
            "Rule-based planner: top destination states by D01 totals.",
        )

    if asks_top and (("origin" in lowered and "state" in lowered) or (asks_out_migration and ("state" in lowered or "corridor" in lowered))):
        return (
            (
                "SELECT BirthPlace AS origin_state, SUM(Total_Persons) AS total_migrants "
                "FROM state_d01_flows "
                "GROUP BY BirthPlace "
                "ORDER BY total_migrants DESC "
                f"LIMIT {top_n}"
            ),
            "Rule-based planner: top origin states by D01 totals.",
        )

    origin_state = state_from_question or selected_state
    destination_state = destination_from_question or selected_state

    if origin_state and destination_state and asks_total_migrants:
        return (
            (
                "SELECT BirthPlace AS origin_state, AreaName AS destination_state, "
                "SUM(Total_Persons) AS total_migrants "
                "FROM state_d01_flows "
                "WHERE BirthPlace_norm = '{origin_state}' AND AreaName_norm = '{destination_state}' "
                "GROUP BY BirthPlace, AreaName"
            ).format(origin_state=origin_state, destination_state=destination_state),
            "Rule-based planner: total migrants between specified origin and destination states.",
        )

    if origin_state and asks_total_migrants and ("from" in lowered or "out" in lowered):
        return (
            (
                "SELECT BirthPlace AS origin_state, SUM(Total_Persons) AS total_migrants "
                "FROM state_d01_flows "
                "WHERE BirthPlace_norm = '{state_norm}' "
                "GROUP BY BirthPlace"
            ).format(state_norm=origin_state),
            "Rule-based planner: total migrants from selected origin state.",
        )

    if destination_state and asks_total_migrants and ("to" in lowered or "into" in lowered):
        return (
            (
                "SELECT AreaName AS destination_state, SUM(Total_Persons) AS total_migrants "
                "FROM state_d01_flows "
                "WHERE AreaName_norm = '{state_norm}' "
                "GROUP BY AreaName"
            ).format(state_norm=destination_state),
            "Rule-based planner: total migrants to selected destination state.",
        )

    if asks_top and ("origin region" in lowered or "origin regions" in lowered or "origin" in lowered):
        if selected_district:
            return (
                (
                    "SELECT origin, SUM(count) AS total_migrants "
                    "FROM district_interstate_flows "
                    "WHERE district_norm = '{district_norm}' "
                    "GROUP BY origin "
                    "ORDER BY total_migrants DESC "
                    "LIMIT {top_n}"
                ).format(district_norm=selected_district, top_n=top_n),
                "Rule-based planner: top origins for selected district.",
            )
        return (
            (
                "SELECT BirthPlace AS origin_state, SUM(Total_Persons) AS total_migrants "
                "FROM state_d01_flows "
                "GROUP BY BirthPlace "
                "ORDER BY total_migrants DESC "
                f"LIMIT {top_n}"
            ),
            "Rule-based planner: top origin states by D01 totals.",
        )

    if selected_district and ("origin" in lowered or asks_top):
        metric = "count"
        alias = "total_migrants"
        if "female" in lowered:
            metric = "female"
            alias = "female_migrants"
        elif "male" in lowered:
            metric = "male"
            alias = "male_migrants"

        return (
            (
                "SELECT origin, SUM({metric}) AS {alias} "
                "FROM district_interstate_flows "
                "WHERE district_norm = '{district_norm}' "
                "GROUP BY origin "
                "ORDER BY {alias} DESC "
                "LIMIT {top_n}"
            ).format(metric=metric, alias=alias, district_norm=selected_district, top_n=top_n),
            "Rule-based planner: top origins for selected district.",
        )

    if selected_state and asks_top and "district" in lowered:
        return (
            (
                "SELECT district, SUM(count) AS total_migrants "
                "FROM district_interstate_flows "
                "WHERE state_norm = '{state_norm}' "
                "GROUP BY district "
                "ORDER BY total_migrants DESC "
                "LIMIT {top_n}"
            ).format(state_norm=selected_state, top_n=top_n),
            "Rule-based planner: top districts for selected state.",
        )

    if asks_gender:
        if selected_district:
            return (
                (
                    "SELECT district, state, SUM(male) AS male_total, SUM(female) AS female_total, "
                    "SUM(count) AS total_migrants "
                    "FROM district_interstate_flows "
                    "WHERE district_norm = '{district_norm}' "
                    "GROUP BY district, state"
                ).format(district_norm=selected_district),
                "Rule-based planner: gender split for selected district.",
            )
        if selected_state:
            return (
                (
                    "SELECT state, SUM(male) AS male_total, SUM(female) AS female_total, "
                    "SUM(count) AS total_migrants "
                    "FROM district_interstate_flows "
                    "WHERE state_norm = '{state_norm}' "
                    "GROUP BY state"
                ).format(state_norm=selected_state),
                "Rule-based planner: gender split for selected state.",
            )
        return (
            (
                "SELECT SUM(Total_Males) AS male_total, SUM(Total_Females) AS female_total, "
                "SUM(Total_Persons) AS total_migrants "
                "FROM state_d01_flows"
            ),
            "Rule-based planner: national gender split.",
        )

    if asks_rural_urban:
        if selected_district:
            return (
                (
                    "SELECT district, state, SUM(rural) AS rural_total, SUM(urban) AS urban_total, "
                    "SUM(count) AS total_migrants "
                    "FROM district_interstate_flows "
                    "WHERE district_norm = '{district_norm}' "
                    "GROUP BY district, state"
                ).format(district_norm=selected_district),
                "Rule-based planner: rural/urban split for selected district.",
            )
        if selected_state:
            return (
                (
                    "SELECT state, SUM(rural) AS rural_total, SUM(urban) AS urban_total, "
                    "SUM(count) AS total_migrants "
                    "FROM district_interstate_flows "
                    "WHERE state_norm = '{state_norm}' "
                    "GROUP BY state"
                ).format(state_norm=selected_state),
                "Rule-based planner: rural/urban split for selected state.",
            )
        return (
            (
                "SELECT SUM(Rural_Persons) AS rural_total, SUM(Urban_Persons) AS urban_total, "
                "SUM(Total_Persons) AS total_migrants "
                "FROM state_d01_flows"
            ),
            "Rule-based planner: national rural/urban split.",
        )

    if selected_state and ("total" in lowered or "migrant" in lowered):
        return (
            (
                "SELECT state, SUM(count) AS total_migrants "
                "FROM district_interstate_flows "
                "WHERE state_norm = '{state_norm}' "
                "GROUP BY state"
            ).format(state_norm=selected_state),
            "Rule-based planner: total migrants for selected state.",
        )

    if selected_district and ("total" in lowered or "migrant" in lowered):
        return (
            (
                "SELECT district, state, SUM(count) AS total_migrants "
                "FROM district_interstate_flows "
                "WHERE district_norm = '{district_norm}' "
                "GROUP BY district, state"
            ).format(district_norm=selected_district),
            "Rule-based planner: total migrants for selected district.",
        )

    return None


def _deterministic_rag_answer(question: str, docs: list[dict[str, str]]) -> str:
    if not docs:
        return (
            "I could not retrieve enough reference context for this question. "
            "Try asking about migration source, threshold meaning, duration, reasons, or activity categories."
        )

    snippets = []
    for doc in docs[:3]:
        snippets.append(f"{doc['title']}: {doc['content']}")
    return " ".join(snippets)


def _deterministic_sql_answer(rows: list[dict]) -> str:
    if not rows:
        return "No data found for this question and current filters."

    first = rows[0]
    keys = set(first.keys())

    if {"origin_state", "destination_state", "total_migrants"} <= keys:
        return (
            f"Based on the available data, about {int(first['total_migrants']):,} people moved from "
            f"{first['origin_state']} to {first['destination_state']}."
        )

    if {"origin_state", "total_migrants"} <= keys:
        return (
            f"Based on the available data, about {int(first['total_migrants']):,} people migrated from "
            f"{first['origin_state']}."
        )

    if {"destination_state", "total_migrants"} <= keys and len(rows) == 1:
        return (
            f"Based on the available data, about {int(first['total_migrants']):,} people migrated to "
            f"{first['destination_state']}."
        )

    if {"destination_state", "total_migrants"} <= keys:
        top_items = ", ".join(
            [f"{row['destination_state']} ({int(row['total_migrants']):,})" for row in rows[:5]]
        )
        return f"The top destination states by migrants are: {top_items}."

    if {"origin", "total_migrants"} <= keys:
        top_items = ", ".join([f"{row['origin']} ({int(row['total_migrants']):,})" for row in rows[:5]])
        return f"The top origin regions by migrants are: {top_items}."

    if {"origin_state", "total_migrants"} <= keys:
        top_items = ", ".join([f"{row['origin_state']} ({int(row['total_migrants']):,})" for row in rows[:5]])
        return f"The top origin states by migrants are: {top_items}."

    if {"origin", "female_migrants"} <= keys:
        top_items = ", ".join([f"{row['origin']} ({int(row['female_migrants']):,})" for row in rows[:5]])
        return f"The top origin regions by female migrants are: {top_items}."

    if {"origin", "male_migrants"} <= keys:
        top_items = ", ".join([f"{row['origin']} ({int(row['male_migrants']):,})" for row in rows[:5]])
        return f"The top origin regions by male migrants are: {top_items}."

    if {"male_total", "female_total", "total_migrants"} <= keys:
        male = float(first["male_total"] or 0)
        female = float(first["female_total"] or 0)
        total = float(first["total_migrants"] or 0)
        if total > 0:
            male_pct = male * 100.0 / total
            female_pct = female * 100.0 / total
            return (
                f"The gender split is {male_pct:.1f}% male ({int(male):,}) and "
                f"{female_pct:.1f}% female ({int(female):,}), out of {int(total):,} total migrants."
            )
        return f"The totals are {int(male):,} male migrants and {int(female):,} female migrants."

    if {"rural_total", "urban_total", "total_migrants"} <= keys:
        rural = float(first["rural_total"] or 0)
        urban = float(first["urban_total"] or 0)
        total = float(first["total_migrants"] or 0)
        if total > 0:
            rural_pct = rural * 100.0 / total
            urban_pct = urban * 100.0 / total
            return (
                f"The rural-urban split is {rural_pct:.1f}% rural ({int(rural):,}) and "
                f"{urban_pct:.1f}% urban ({int(urban):,}), out of {int(total):,} total migrants."
            )
        return f"The totals are {int(rural):,} rural migrants and {int(urban):,} urban migrants."

    if len(rows) == 1:
        parts = [f"{k.replace('_', ' ')}: {v}" for k, v in first.items()]
        return "I found one matching result. " + ", ".join(parts) + "."

    return f"I found {len(rows)} matching results. Please check the table below for the details."


def _looks_like_raw_technical_answer(answer: str) -> bool:
    lowered = answer.lower()
    suspicious_markers = [
        "```",
        "select ",
        "from state_d01_flows",
        "from district_interstate_flows",
        '"male_percentage"',
        '"female_percentage"',
        "sql used",
        "result:",
        "[{",
    ]
    return any(marker in lowered for marker in suspicious_markers)


class ChatOrchestrator:
    def __init__(
        self,
        *,
        settings: Settings,
        db: DatabaseManager,
        retriever: LexicalRetriever,
        llm: BaseChatModel | None,
        llm_error: str | None = None,
    ) -> None:
        self.settings = settings
        self.db = db
        self.retriever = retriever
        self.llm = llm
        self.llm_error = llm_error

    def _invoke_llm(self, prompt: str) -> str:
        if not self.llm:
            raise RuntimeError(self.llm_error or "LLM is not configured.")
        response = self.llm.invoke(prompt)
        content = getattr(response, "content", "")
        if isinstance(content, list):
            return " ".join(str(item) for item in content)
        return str(content)

    def _route_question(self, question: str) -> str:
        lowered = _canonicalize_question(question)
        conceptual_tokens = {
            "what is",
            "define",
            "meaning",
            "interpret",
            "methodology",
            "source",
            "difference between",
            "explain",
        }
        numeric_tokens = {
            "top",
            "highest",
            "lowest",
            "rank",
            "total",
            "sum",
            "count",
            "compare",
            "share",
            "percentage",
            "male",
            "female",
            "rural",
            "urban",
            "migration split",
            "split",
            "migrated",
            "destination",
            "origin",
            "receive the most migrants",
            "send the most migrants",
            "district",
            "state",
        }

        has_conceptual = any(token in lowered for token in conceptual_tokens)
        has_numeric = any(token in lowered for token in numeric_tokens)

        if has_conceptual and has_numeric:
            return "hybrid"
        if has_conceptual:
            return "rag"
        return "sql"

    def _follow_ups(self, context_state: str | None, context_district: str | None) -> list[str]:
        prompts = [
            "Show the top 5 origin states by total migrants.",
            "Give male vs female share in percentage terms.",
            "Explain one key insight and one caveat from this data.",
        ]
        if context_state:
            prompts.insert(0, f"Compare {context_state} with national average.")
        if context_district:
            prompts[0] = f"Show the top 5 origin regions for {context_district}."
            prompts.insert(0, f"Show the top migration reasons for {context_district}.")
        return prompts[:4]

    def chat(self, request: ChatRequest) -> ChatResponse:
        smalltalk = _smalltalk_response(request.message)
        if smalltalk:
            return ChatResponse(
                answer=smalltalk,
                route="smalltalk",
                follow_ups=self._follow_ups(
                    request.context.selected_state if request.context else None,
                    request.context.selected_district if request.context else None,
                ),
            )

        rephrase = _needs_rephrase_response(request.message)
        if rephrase:
            return ChatResponse(
                answer=rephrase,
                route="clarify",
                follow_ups=self._follow_ups(
                    request.context.selected_state if request.context else None,
                    request.context.selected_district if request.context else None,
                ),
            )

        route = self._route_question(request.message)

        if route == "rag":
            docs = self.retriever.retrieve(request.message, top_k=4)
            rag_prompt = build_rag_answer_prompt(
                question=request.message,
                context=request.context,
                retrieved_docs=docs,
            )
            try:
                answer = self._invoke_llm(rag_prompt)
            except Exception as exc:
                answer = _deterministic_rag_answer(request.message, docs)
                return ChatResponse(
                    answer=answer,
                    route="rag",
                    citations=[Citation(label="RAG Fallback", detail=str(exc))],
                    follow_ups=[],
                    error=str(exc),
                )

            citations = [Citation(label=doc["title"], detail=doc["source"]) for doc in docs]
            return ChatResponse(
                answer=answer.strip(),
                route="rag",
                citations=citations,
                follow_ups=self._follow_ups(
                    request.context.selected_state if request.context else None,
                    request.context.selected_district if request.context else None,
                ),
            )

        schema = self.db.schema_summary()
        allowed_tables = set(self.db.list_tables())
        limited_history = request.history[-self.settings.max_history_turns :]
        state_names = self.db.context_options().get("states", [])
        canonical_question = _canonicalize_follow_up(request.message, limited_history)
        sql_prompt = build_sql_prompt(
            schema_summary=schema,
            question=request.message,
            canonical_question=canonical_question,
            context=request.context,
            history=limited_history,
            allowed_tables=sorted(allowed_tables),
        )

        rule_plan = _rule_based_sql(request.message, request.context, state_names)
        planner_label = "llm"

        try:
            try:
                plan_raw = self._invoke_llm(sql_prompt)
                plan = _extract_json(plan_raw)
                sql = str(plan.get("sql", "")).strip()
                reason = str(plan.get("reason", "")).strip()
                if not sql:
                    raise SQLValidationError("Planner returned empty SQL.")
                validated_sql, used_tables = _validate_select_sql(sql, allowed_tables)
            except Exception:
                if not rule_plan:
                    raise
                sql, reason = rule_plan
                planner_label = "rule-based"
                validated_sql, used_tables = _validate_select_sql(sql, allowed_tables)

            validated_sql = _ensure_limit(validated_sql, self.settings.sql_default_limit)
            rows = self.db.execute_query(validated_sql)
        except Exception as exc:
            if route == "hybrid":
                docs = self.retriever.retrieve(request.message, top_k=4)
                rag_prompt = build_rag_answer_prompt(
                    question=request.message,
                    context=request.context,
                    retrieved_docs=docs,
                )
                answer = self._invoke_llm(rag_prompt)
                citations = [Citation(label=doc["title"], detail=doc["source"]) for doc in docs]
                return ChatResponse(
                    answer=answer.strip(),
                    route="rag-fallback",
                    citations=citations,
                    follow_ups=self._follow_ups(
                        request.context.selected_state if request.context else None,
                        request.context.selected_district if request.context else None,
                    ),
                    error=str(exc),
                )

            if _is_quota_error(exc):
                quota_message = (
                    "LLM quota is currently exceeded for the configured provider. "
                    "Update billing/quota or switch provider key. "
                    "For now, ask direct metric questions with selected state/district to use deterministic SQL."
                )
                return ChatResponse(
                    answer=quota_message,
                    route="sql",
                    citations=[Citation(label="LLM Quota", detail=str(exc))],
                    follow_ups=self._follow_ups(
                        request.context.selected_state if request.context else None,
                        request.context.selected_district if request.context else None,
                    ),
                    error=str(exc),
                )

            return ChatResponse(
                answer=(
                    "Please ask migration-related questions only. You can ask about states, districts, gender split, "
                    "rural versus urban share, migration reasons, or totals."
                ),
                route="sql",
                citations=[],
                follow_ups=[],
                error=str(exc),
            )

        preview = rows[: self.settings.max_rows_preview]
        if not preview:
            return ChatResponse(
                answer=_deterministic_sql_answer(preview),
                route=route,
                sql=validated_sql,
                citations=[Citation(label=f"table:{table}") for table in used_tables],
                data_preview=[],
                follow_ups=self._follow_ups(
                    request.context.selected_state if request.context else None,
                    request.context.selected_district if request.context else None,
                ),
            )

        answer_prompt = build_sql_answer_prompt(
            question=request.message,
            context=request.context,
            sql=validated_sql,
            rows=preview,
        )

        if route == "hybrid":
            docs = self.retriever.retrieve(request.message, top_k=3)
            answer_prompt = f"{answer_prompt}\n\nAdditional context:\n{json.dumps(docs, ensure_ascii=True)}"
            extra_citations = [Citation(label=doc["title"], detail=doc["source"]) for doc in docs]
        else:
            extra_citations = []

        deterministic_answer = _deterministic_sql_answer(preview)
        if route == "hybrid":
            try:
                answer = self._invoke_llm(answer_prompt).strip()
                if _looks_like_raw_technical_answer(answer):
                    answer = deterministic_answer
            except Exception:
                answer = deterministic_answer
        else:
            answer = deterministic_answer

        citations = [Citation(label=f"table:{table}") for table in used_tables] + extra_citations
        if planner_label == "rule-based":
            citations.append(Citation(label="planner:rule-based", detail=reason))
        return ChatResponse(
            answer=answer,
            route=route,
            sql=validated_sql,
            citations=citations,
            data_preview=preview,
            follow_ups=self._follow_ups(
                request.context.selected_state if request.context else None,
                request.context.selected_district if request.context else None,
            ),
        )
