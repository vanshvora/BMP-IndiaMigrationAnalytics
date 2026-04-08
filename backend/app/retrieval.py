from __future__ import annotations

import re
from dataclasses import dataclass


@dataclass
class RetrievalDocument:
    doc_id: str
    title: str
    content: str
    source: str


class LexicalRetriever:
    def __init__(self, documents: list[RetrievalDocument]) -> None:
        self.documents = documents

    @staticmethod
    def _tokenize(text: str) -> set[str]:
        return set(re.findall(r"[a-z0-9]+", text.lower()))

    def retrieve(self, query: str, top_k: int = 4) -> list[dict[str, str]]:
        query_tokens = self._tokenize(query)
        if not query_tokens:
            return []

        scored_docs: list[tuple[float, RetrievalDocument]] = []

        for doc in self.documents:
            doc_tokens = self._tokenize(doc.title + " " + doc.content)
            if not doc_tokens:
                continue
            overlap = len(query_tokens & doc_tokens)
            union = len(query_tokens | doc_tokens)
            score = overlap / union if union else 0.0
            if score > 0:
                scored_docs.append((score, doc))

        scored_docs.sort(key=lambda item: item[0], reverse=True)
        return [
            {
                "doc_id": doc.doc_id,
                "title": doc.title,
                "content": doc.content,
                "source": doc.source,
                "score": f"{score:.3f}",
            }
            for score, doc in scored_docs[:top_k]
        ]


def build_default_documents() -> list[RetrievalDocument]:
    return [
        RetrievalDocument(
            doc_id="method-source",
            title="Data Source",
            content=(
                "All dashboard numbers come from Census 2011 migration D-series cleaned tables included in this project. "
                "The chatbot should report table names used in each answer."
            ),
            source="repo:README.md",
        ),
        RetrievalDocument(
            doc_id="method-threshold",
            title="Threshold Interpretation",
            content=(
                "Threshold filters remove small corridors from visible analysis. "
                "Lower threshold increases coverage but can increase chart noise."
            ),
            source="dashboard-methodology",
        ),
        RetrievalDocument(
            doc_id="def-main-workers",
            title="Economic Activity Terms",
            content=(
                "Main workers, marginal workers, and non-workers are activity categories used in D06 and district_economic_activity tables."
            ),
            source="table:D06,district_economic_activity",
        ),
        RetrievalDocument(
            doc_id="def-migration-reasons",
            title="Reason for Migration",
            content=(
                "Reason categories include work, business, education, marriage, post-birth move, move with household, and other."
            ),
            source="table:D03,district_reason_migration_flows",
        ),
        RetrievalDocument(
            doc_id="def-duration",
            title="Duration of Residence",
            content=(
                "Duration buckets are less than 1 year, 1-4 years, 5-9 years, 10-19 years, 20+ years, and not stated."
            ),
            source="table:D02,district_duration_residence_flows",
        ),
        RetrievalDocument(
            doc_id="def-gender",
            title="Gender Split",
            content=(
                "Gender breakdowns use Male and Female columns, and totals use Persons columns where available."
            ),
            source="table:multiple",
        ),
    ]

