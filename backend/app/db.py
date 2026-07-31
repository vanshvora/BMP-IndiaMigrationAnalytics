from __future__ import annotations

from contextlib import contextmanager
from typing import Generator

import psycopg2
from psycopg2.extras import RealDictCursor

from .config import Settings

try:
    import logfire
except ImportError:
    logfire = None  # type: ignore[assignment]


def _span(name: str, **attrs):
    if logfire:
        return logfire.span(name, **attrs)
    from contextlib import nullcontext as _nc
    return _nc()


class DatabaseManager:

    def __init__(self, settings: Settings) -> None:
        self.database_url = settings.database_url
        self._schema: str = self._build_schema_summary()

    @contextmanager
    def _connect(self) -> Generator:
        conn = psycopg2.connect(self.database_url)
        try:
            yield conn
        finally:
            conn.close()

    def execute_query(self, sql: str) -> list[dict]:
        with _span("db.execute", sql=sql[:200]):
            with self._connect() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute(sql)
                    return [dict(row) for row in cur.fetchall()]

    def safe_execute(self, sql: str) -> tuple[list[dict] | None, str | None]:
        """Returns (rows, None) on success or (None, error_message) on failure."""
        try:
            rows = self.execute_query(sql)
            return rows, None
        except Exception as exc:
            return None, str(exc)

    def list_tables(self) -> list[str]:
        rows = self.execute_query(
            "SELECT table_name FROM information_schema.tables "
            "WHERE table_schema = 'public' ORDER BY table_name"
        )
        return [row["table_name"] for row in rows]

    def schema_summary(self) -> str:
        return self._schema

    def _build_schema_summary(self) -> str:
        """Queries information_schema once at startup and builds a schema string for the LLM."""
        with _span("db.schema_summary"):
            rows = self.execute_query(
                "SELECT table_name, column_name, data_type "
                "FROM information_schema.columns "
                "WHERE table_schema = 'public' "
                "ORDER BY table_name, ordinal_position"
            )
            tables: dict[str, list[str]] = {}
            for row in rows:
                col_name = row["column_name"]
                quoted_col = f'"{col_name}"' if any(c.isupper() for c in col_name) else col_name
                col_desc = f"{quoted_col} ({row['data_type']})"
                tables.setdefault(row["table_name"], []).append(col_desc)

            return "\n".join(
                f"- {tbl}: {', '.join(cols)}" for tbl, cols in tables.items()
            )

    def context_options(self) -> dict:
        """Returns states and districts for frontend dropdowns."""
        states = [
            row["state"]
            for row in self.execute_query(
                "SELECT DISTINCT state FROM district_interstate_flows "
                "WHERE state IS NOT NULL AND TRIM(state) <> '' "
                "ORDER BY state"
            )
        ]

        district_rows = self.execute_query(
            "SELECT state, district FROM district_interstate_flows "
            "WHERE state IS NOT NULL AND district IS NOT NULL "
            "GROUP BY state, district ORDER BY state, district"
        )
        districts_by_state: dict[str, list[str]] = {}
        for row in district_rows:
            districts_by_state.setdefault(row["state"], []).append(row["district"])

        return {"states": states, "districtsByState": districts_by_state}
