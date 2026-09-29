from __future__ import annotations

from contextlib import contextmanager
from typing import Generator

import threading
import time
import psycopg2
from psycopg2.pool import ThreadedConnectionPool
from psycopg2.extras import RealDictCursor

from .config import Settings

class DatabaseManager:

    def __init__(self, settings: Settings) -> None:
        self.database_url = settings.database_url
        self.pool = None
        self.db_ok = False
        self._schema: str = ""
        
        self._init_db()
        if not self.db_ok and self.database_url:
            print("[WARNING] Database init failed at startup. Retrying in background.")
            threading.Thread(target=self._background_retry, daemon=True).start()

    def _init_db(self) -> None:
        if not self.database_url:
            return
        try:
            self.pool = ThreadedConnectionPool(1, 10, dsn=self.database_url)
            self.db_ok = True
            self._schema = self._build_schema_summary()
            print("[SUCCESS] Database connected successfully.")
        except Exception as e:
            self.db_ok = False
            if self.pool:
                self.pool.closeall()
            self.pool = None

    def _background_retry(self) -> None:
        while not self.db_ok:
            time.sleep(5)
            self._init_db()

    @contextmanager
    def _connect(self) -> Generator:
        if not self.pool:
            raise Exception("Database connection pool is not initialized.")
        conn = self.pool.getconn()
        try:
            yield conn
        finally:
            self.pool.putconn(conn)

    def execute_query(self, sql: str) -> list[dict]:
        with self._connect() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("SET statement_timeout = 15000")
                cur.execute("SET TRANSACTION READ ONLY")
                cur.execute(sql)
                conn.commit()
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
