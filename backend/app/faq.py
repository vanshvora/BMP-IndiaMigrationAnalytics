from __future__ import annotations

import re
from typing import Any


FAQ_ITEMS: list[dict[str, str]] = [
    {
        "question": "Which states have the highest in-migration corridors?",
        "answer": "Ask for top destination states by total persons, and the assistant will compute exact rankings from D01 data.",
    },
    {
        "question": "Which states have the highest out-migration corridors?",
        "answer": "Ask for top origin states by total persons, and the assistant will return ranked outflow corridors from D01.",
    },
    {
        "question": "What are the top origin states for a selected district?",
        "answer": "Select a state and district context, then ask for top origins; results are computed from district_interstate_flows.",
    },
    {
        "question": "What is the male vs female migration split for my selection?",
        "answer": "Provide state/district context and ask for gender split; the assistant computes totals and percentages.",
    },
    {
        "question": "What is the rural vs urban split for my selection?",
        "answer": "Ask for rural/urban share and the assistant will compute both count and percentage values.",
    },
    {
        "question": "Which reasons for migration are most common in a district?",
        "answer": "Ask for migration reasons and the assistant will rank reason categories using district_reason_migration_flows.",
    },
    {
        "question": "How should I interpret the threshold filter in the dashboard?",
        "answer": "Higher thresholds remove smaller corridors, so charts focus on major flows and reduce noise.",
    },
    {
        "question": "What data year and source is used here?",
        "answer": "The dashboard is based on Census 2011 migration D-series tables (cleaned CSV extracts in this repository).",
    },
]


def _tokenize(text: str) -> set[str]:
    return set(re.findall(r"[a-z0-9]+", text.lower()))


def match_faq(question: str, threshold: float = 0.45) -> dict[str, Any] | None:
    query_tokens = _tokenize(question)
    if not query_tokens:
        return None

    best_item = None
    best_score = 0.0

    for item in FAQ_ITEMS:
        item_tokens = _tokenize(item["question"])
        if not item_tokens:
            continue
        overlap = len(query_tokens & item_tokens)
        union = len(query_tokens | item_tokens)
        score = overlap / union if union else 0.0

        if score > best_score:
            best_score = score
            best_item = item

    if best_item and best_score >= threshold:
        return {"item": best_item, "score": best_score}
    return None

