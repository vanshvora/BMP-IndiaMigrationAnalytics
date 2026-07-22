from __future__ import annotations

from contextlib import contextmanager
from typing import Generator

import psycopg2
from psycopg2.extras import RealDictCursor

from .config import Settings


class DatabaseManager:
    """
    Manages all PostgreSQL interactions.

    Two query methods are exposed:
      • execute_query  – raises on error  (used by seed script, context_options)
      • safe_execute   – returns error as string (used by the LangGraph agent
                          so it can read the error and fix its own SQL)
    """

    def __init__(self, settings: Settings) -> None:
        self.database_url = settings.database_url

    # ── Connection Helper ──────────────────────────────────────────────

    @contextmanager
    def _connect(self) -> Generator:
        """Opens a PostgreSQL connection and guarantees it is closed."""
        conn = psycopg2.connect(self.database_url)
        try:
            yield conn
        finally:
            conn.close()

    # ── Query Methods ──────────────────────────────────────────────────

    def execute_query(self, sql: str) -> list[dict]:
        """Runs a SQL query and returns every row as a dictionary."""
        with self._connect() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(sql)
                return [dict(row) for row in cur.fetchall()]

    def safe_execute(self, sql: str) -> tuple[list[dict] | None, str | None]:
        """
        Tries to run SQL.  Returns (rows, None) on success,
        or (None, error_message) on failure.

        The LangGraph agent calls this so it can read the Postgres
        error message, fix the SQL, and retry — instead of crashing.
        """
        try:
            rows = self.execute_query(sql)
            return rows, None
        except Exception as exc:
            return None, str(exc)

    # ── Schema Introspection ───────────────────────────────────────────

    def list_tables(self) -> list[str]:
        """Returns all user-created table names in the public schema."""
        rows = self.execute_query(
            "SELECT table_name FROM information_schema.tables "
            "WHERE table_schema = 'public' ORDER BY table_name"
        )
        return [row["table_name"] for row in rows]

    def schema_summary(self) -> str:
        """
        Human-readable summary of every table and its columns.
        This string is injected into the LLM prompt so the model
        knows which columns exist before writing SQL.
        Columns with uppercase letters are double-quoted so the LLM
        uses correct PostgreSQL syntax.
        """
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

    # ── UI Dropdown Helpers ────────────────────────────────────────────

    def context_options(self) -> dict:
        """Returns the list of states and districts for the frontend dropdowns."""
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
