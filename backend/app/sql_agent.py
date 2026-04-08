from __future__ import annotations

import hashlib
import json
import re
import time
from collections import OrderedDict
from threading import Lock
from typing import Any

import sqlglot
from langchain_core.language_models.chat_models import BaseChatModel

from .config import Settings
from .db import DatabaseManager
from .faq import match_faq
from .prompting import build_rag_answer_prompt, build_sql_answer_prompt, build_sql_prompt
from .retrieval import LexicalRetriever
from .schemas import ChatContext, ChatRequest, ChatResponse, Citation


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


def _is_quota_error(exc: Exception) -> bool:
    text = str(exc).lower()
    return "quota" in text or "rate limit" in text or "429" in text


def _rule_based_sql(question: str, context: ChatContext | None) -> tuple[str, str] | None:
    lowered = question.lower()
    top_n = _extract_top_n(lowered)
    selected_state = _normalize_text(context.selected_state if context else None)
    selected_district = _normalize_text(context.selected_district if context else None)

    asks_gender = "male" in lowered or "female" in lowered or "gender" in lowered
    asks_rural_urban = "rural" in lowered or "urban" in lowered
    asks_top = "top" in lowered or "highest" in lowered or "largest" in lowered

    if asks_top and "destination" in lowered and "state" in lowered:
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

    if asks_top and "origin" in lowered and "state" in lowered:
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
        return "No rows were found for this question and current filters."

    first = rows[0]
    keys = set(first.keys())

    if {"destination_state", "total_migrants"} <= keys:
        top_items = ", ".join(
            [f"{row['destination_state']} ({int(row['total_migrants']):,})" for row in rows[:5]]
        )
        return f"Top destination states by migrants: {top_items}."

    if {"origin", "total_migrants"} <= keys:
        top_items = ", ".join([f"{row['origin']} ({int(row['total_migrants']):,})" for row in rows[:5]])
        return f"Top origins by migrants: {top_items}."

    if {"origin", "female_migrants"} <= keys:
        top_items = ", ".join([f"{row['origin']} ({int(row['female_migrants']):,})" for row in rows[:5]])
        return f"Top origins by female migrants: {top_items}."

    if {"origin", "male_migrants"} <= keys:
        top_items = ", ".join([f"{row['origin']} ({int(row['male_migrants']):,})" for row in rows[:5]])
        return f"Top origins by male migrants: {top_items}."

    if {"male_total", "female_total", "total_migrants"} <= keys:
        male = float(first["male_total"] or 0)
        female = float(first["female_total"] or 0)
        total = float(first["total_migrants"] or 0)
        if total > 0:
            male_pct = male * 100.0 / total
            female_pct = female * 100.0 / total
            return (
                f"Gender split: Male {int(male):,} ({male_pct:.1f}%), "
                f"Female {int(female):,} ({female_pct:.1f}%), Total {int(total):,}."
            )
        return f"Gender totals: Male {int(male):,}, Female {int(female):,}, Total {int(total):,}."

    if {"rural_total", "urban_total", "total_migrants"} <= keys:
        rural = float(first["rural_total"] or 0)
        urban = float(first["urban_total"] or 0)
        total = float(first["total_migrants"] or 0)
        if total > 0:
            rural_pct = rural * 100.0 / total
            urban_pct = urban * 100.0 / total
            return (
                f"Rural/Urban split: Rural {int(rural):,} ({rural_pct:.1f}%), "
                f"Urban {int(urban):,} ({urban_pct:.1f}%), Total {int(total):,}."
            )
        return f"Rural {int(rural):,}, Urban {int(urban):,}, Total {int(total):,}."

    if len(rows) == 1:
        parts = [f"{k}={v}" for k, v in first.items()]
        return "Result: " + ", ".join(parts)

    return f"Computed {len(rows)} row(s). Open data preview for detailed values."


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
        self._cache_lock = Lock()
        self._cache: OrderedDict[str, tuple[float, dict[str, Any]]] = OrderedDict()

    def _cache_key(self, request: ChatRequest) -> str:
        payload = {
            "message": request.message,
            "context": request.context.model_dump(exclude_none=True) if request.context else {},
            "history": [turn.model_dump() for turn in request.history[-self.settings.max_history_turns :]],
        }
        encoded = json.dumps(payload, sort_keys=True, ensure_ascii=True)
        return hashlib.sha256(encoded.encode("utf-8")).hexdigest()

    def _cache_get(self, key: str) -> ChatResponse | None:
        now = time.time()
        with self._cache_lock:
            item = self._cache.get(key)
            if not item:
                return None

            expires_at, payload = item
            if now > expires_at:
                self._cache.pop(key, None)
                return None

            # refresh LRU position
            self._cache.move_to_end(key)
            return ChatResponse.model_validate(payload)

    def _cache_set(self, key: str, response: ChatResponse) -> None:
        ttl = max(1, self.settings.chat_cache_ttl_seconds)
        expires_at = time.time() + ttl
        payload = response.model_dump()

        with self._cache_lock:
            self._cache[key] = (expires_at, payload)
            self._cache.move_to_end(key)

            max_entries = max(1, self.settings.chat_cache_max_entries)
            while len(self._cache) > max_entries:
                self._cache.popitem(last=False)

    def _invoke_llm(self, prompt: str) -> str:
        if not self.llm:
            raise RuntimeError(self.llm_error or "LLM is not configured.")
        response = self.llm.invoke(prompt)
        content = getattr(response, "content", "")
        if isinstance(content, list):
            return " ".join(str(item) for item in content)
        return str(content)

    def _route_question(self, question: str) -> str:
        lowered = question.lower()
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
            "Show the top 5 origin regions for this selection.",
            "Give male vs female share in percentage terms.",
            "Explain one key insight and one caveat from this data.",
        ]
        if context_state:
            prompts.insert(0, f"Compare {context_state} with national average.")
        if context_district:
            prompts.insert(0, f"Show the top migration reasons for {context_district}.")
        return prompts[:4]

    def chat(self, request: ChatRequest) -> ChatResponse:
        cache_key = self._cache_key(request)
        cached = self._cache_get(cache_key)
        if cached:
            return cached

        def finalize(response: ChatResponse) -> ChatResponse:
            self._cache_set(cache_key, response)
            return response

        faq_hit = match_faq(request.message)
        if faq_hit and faq_hit["score"] >= 0.62:
            item = faq_hit["item"]
            return finalize(ChatResponse(
                answer=item["answer"],
                route="faq",
                citations=[Citation(label="FAQ", detail=item["question"])],
                follow_ups=self._follow_ups(
                    request.context.selected_state if request.context else None,
                    request.context.selected_district if request.context else None,
                ),
            ))

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
                return finalize(ChatResponse(
                    answer=answer,
                    route="rag",
                    citations=[Citation(label="RAG Fallback", detail=str(exc))],
                    follow_ups=[],
                    error=str(exc),
                ))

            citations = [Citation(label=doc["title"], detail=doc["source"]) for doc in docs]
            return finalize(ChatResponse(
                answer=answer.strip(),
                route="rag",
                citations=citations,
                follow_ups=self._follow_ups(
                    request.context.selected_state if request.context else None,
                    request.context.selected_district if request.context else None,
                ),
            ))

        schema = self.db.schema_summary()
        allowed_tables = set(self.db.list_tables())
        limited_history = request.history[-self.settings.max_history_turns :]
        sql_prompt = build_sql_prompt(
            schema_summary=schema,
            question=request.message,
            context=request.context,
            history=limited_history,
            allowed_tables=sorted(allowed_tables),
        )

        rule_plan = _rule_based_sql(request.message, request.context)

        try:
            if rule_plan:
                sql, reason = rule_plan
            else:
                plan_raw = self._invoke_llm(sql_prompt)
                plan = _extract_json(plan_raw)
                sql = str(plan.get("sql", "")).strip()
                reason = str(plan.get("reason", "")).strip()
            if not sql:
                raise SQLValidationError("Planner returned empty SQL.")
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
                return finalize(ChatResponse(
                    answer=answer.strip(),
                    route="rag-fallback",
                    citations=citations,
                    follow_ups=self._follow_ups(
                        request.context.selected_state if request.context else None,
                        request.context.selected_district if request.context else None,
                    ),
                    error=str(exc),
                ))

            if _is_quota_error(exc):
                quota_message = (
                    "LLM quota is currently exceeded for the configured provider. "
                    "Update billing/quota or switch provider key. "
                    "For now, ask direct metric questions with selected state/district to use deterministic SQL."
                )
                return finalize(ChatResponse(
                    answer=quota_message,
                    route="sql",
                    citations=[Citation(label="LLM Quota", detail=str(exc))],
                    follow_ups=self._follow_ups(
                        request.context.selected_state if request.context else None,
                        request.context.selected_district if request.context else None,
                    ),
                    error=str(exc),
                ))

            return finalize(ChatResponse(
                answer=(
                    "I could not build a safe SQL query for that request. "
                    "Try rephrasing with explicit state/district and metric."
                ),
                route="sql",
                citations=[],
                follow_ups=[],
                error=str(exc),
            ))

        preview = rows[: self.settings.max_rows_preview]
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

        try:
            answer = self._invoke_llm(answer_prompt).strip()
        except Exception:
            answer = _deterministic_sql_answer(preview)

        citations = [Citation(label=f"table:{table}") for table in used_tables] + extra_citations
        if rule_plan:
            citations.append(Citation(label="planner:rule-based", detail=reason))
        return finalize(ChatResponse(
            answer=answer,
            route=route,
            sql=validated_sql,
            citations=citations,
            data_preview=preview,
            follow_ups=self._follow_ups(
                request.context.selected_state if request.context else None,
                request.context.selected_district if request.context else None,
            ),
        ))
