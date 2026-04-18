from __future__ import annotations

import json
import unittest
from types import SimpleNamespace

from app.schemas import ChatRequest, ChatTurn
from app.sql_agent import ChatOrchestrator


class FakeLLM:
    def __init__(self) -> None:
        self.prompts: list[str] = []

    def invoke(self, prompt: str) -> SimpleNamespace:
        self.prompts.append(prompt)
        return SimpleNamespace(
            content=json.dumps(
                {
                    "sql": (
                        "SELECT AreaName AS destination_state, "
                        "SUM(Total_Persons) AS total_migrants "
                        "FROM state_d01_flows "
                        "GROUP BY AreaName "
                        "ORDER BY total_migrants DESC "
                        "LIMIT 3"
                    ),
                    "reason": "LLM planner test query.",
                }
            )
        )


class FakeDatabase:
    initialized = True

    def schema_summary(self) -> str:
        return "- state_d01_flows: AreaName (VARCHAR), Total_Persons (BIGINT)"

    def list_tables(self) -> list[str]:
        return ["state_d01_flows"]

    def context_options(self) -> dict:
        return {"states": []}

    def execute_query(self, sql: str) -> list[dict]:
        return [{"destination_state": "Maharashtra", "total_migrants": 123}]


class FakeRetriever:
    def retrieve(self, query: str, top_k: int = 4) -> list[dict[str, str]]:
        return []


class ChatOrchestratorTests(unittest.TestCase):
    def test_common_metric_question_uses_llm_planner_before_rule_fallback(self) -> None:
        llm = FakeLLM()
        orchestrator = ChatOrchestrator(
            settings=SimpleNamespace(
                max_history_turns=8,
                sql_default_limit=200,
                max_rows_preview=25,
            ),
            db=FakeDatabase(),
            retriever=FakeRetriever(),
            llm=llm,
        )

        response = orchestrator.chat(ChatRequest(message="Top 3 destination states by total migrants"))

        self.assertEqual(len(llm.prompts), 1)
        self.assertEqual(response.route, "sql")
        self.assertEqual(response.sql, "SELECT AreaName AS destination_state, SUM(Total_Persons) AS total_migrants FROM state_d01_flows GROUP BY AreaName ORDER BY total_migrants DESC LIMIT 3")
        self.assertEqual(response.data_preview[0]["destination_state"], "Maharashtra")

    def test_out_migration_follow_up_keeps_previous_top_state_intent(self) -> None:
        llm = FakeLLM()
        orchestrator = ChatOrchestrator(
            settings=SimpleNamespace(
                max_history_turns=8,
                sql_default_limit=200,
                max_rows_preview=25,
            ),
            db=FakeDatabase(),
            retriever=FakeRetriever(),
            llm=llm,
        )

        orchestrator.chat(
            ChatRequest(
                message="what about out migration",
                history=[
                    ChatTurn(role="user", content="what state has highest migration"),
                    ChatTurn(
                        role="assistant",
                        content="Based on the available data, about 9,963,382 people migrated to MAHARASHTRA.",
                    ),
                ],
            )
        )

        self.assertIn("Canonical interpretation:\ntop origin states by total migrants", llm.prompts[0])


if __name__ == "__main__":
    unittest.main()
