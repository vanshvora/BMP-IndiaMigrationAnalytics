from __future__ import annotations

from pathlib import Path
from threading import Lock

import duckdb

from .config import Settings


TABLE_FILE_MAP: dict[str, str] = {
    "state_d01_flows": "D01_cleaned.csv",
    "state_d02_duration": "D02_cleaned.csv",
    "state_d03_reasons": "D03_cleaned.csv",
    "state_d04_education": "D04_cleaned.csv",
    "state_d06_activity": "D06_cleaned.csv",
    "state_d10_marital": "D10_cleaned.csv",
    "state_d12_reference": "D12_cleaned.csv",
    "district_interstate_flows": "district_interstate_flows.csv",
    "district_duration_residence_flows": "district_duration_residence_flows.csv",
    "district_reason_migration_flows": "district_reason_migration_flows.csv",
    "district_education_levels": "district_education_levels.csv",
    "district_economic_activity": "district_economic_activity.csv",
    "district_marital_status": "district_marital_status.csv",
}


class DatabaseManager:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self._lock = Lock()
        self.initialized = False

    def _connect(self) -> duckdb.DuckDBPyConnection:
        return duckdb.connect(str(self.settings.db_file))

    @staticmethod
    def _escape_path(path: Path) -> str:
        return str(path).replace("\\", "/").replace("'", "''")

    def initialize(self) -> None:
        self.settings.db_file.parent.mkdir(parents=True, exist_ok=True)

        with self._lock:
            connection = self._connect()
            try:
                for table_name, csv_name in TABLE_FILE_MAP.items():
                    csv_path = self.settings.csv_dir / csv_name
                    if not csv_path.exists():
                        raise FileNotFoundError(f"Missing CSV file: {csv_path}")

                    escaped_path = self._escape_path(csv_path)
                    connection.execute(
                        f"""
                        CREATE OR REPLACE TABLE {table_name} AS
                        SELECT * FROM read_csv_auto('{escaped_path}', HEADER=TRUE)
                        """
                    )
                    self._add_normalized_columns(connection, table_name)

                self.initialized = True
            finally:
                connection.close()

    @staticmethod
    def _column_exists(connection: duckdb.DuckDBPyConnection, table_name: str, column_name: str) -> bool:
        rows = connection.execute(f"PRAGMA table_info('{table_name}')").fetchall()
        return any(row[1] == column_name for row in rows)

    def _add_normalized_columns(self, connection: duckdb.DuckDBPyConnection, table_name: str) -> None:
        candidates = ["state", "district", "origin", "destination", "AreaName", "BirthPlace"]
        for column in candidates:
            if not self._column_exists(connection, table_name, column):
                continue

            normalized_column = f"{column}_norm"
            if self._column_exists(connection, table_name, normalized_column):
                continue

            connection.execute(
                f"""
                ALTER TABLE {table_name}
                ADD COLUMN {normalized_column} VARCHAR
                """
            )
            connection.execute(
                f"""
                UPDATE {table_name}
                SET {normalized_column} = regexp_replace(lower(trim({column})), '[^a-z0-9]+', '', 'g')
                """
            )

    def execute_query(self, sql: str) -> list[dict]:
        with self._lock:
            connection = self._connect()
            try:
                cursor = connection.execute(sql)
                columns = [desc[0] for desc in cursor.description]
                rows = cursor.fetchall()
                return [dict(zip(columns, row)) for row in rows]
            finally:
                connection.close()

    def list_tables(self) -> list[str]:
        rows = self.execute_query("SHOW TABLES")
        tables = [row.get("name") for row in rows if row.get("name")]
        tables.sort()
        return tables

    def schema_summary(self) -> str:
        lines: list[str] = []
        for table in self.list_tables():
            info_rows = self.execute_query(f"PRAGMA table_info('{table}')")
            columns = [f"{row['name']} ({row['type']})" for row in info_rows]
            lines.append(f"- {table}: {', '.join(columns)}")
        return "\n".join(lines)

    def context_options(self) -> dict:
        states = [
            row["state"]
            for row in self.execute_query(
                """
                SELECT DISTINCT state
                FROM district_interstate_flows
                WHERE state IS NOT NULL AND trim(state) <> ''
                ORDER BY state
                """
            )
        ]

        districts_by_state = {}
        district_rows = self.execute_query(
            """
            SELECT state, district
            FROM district_interstate_flows
            WHERE state IS NOT NULL AND district IS NOT NULL
            GROUP BY state, district
            ORDER BY state, district
            """
        )
        for row in district_rows:
            state = row["state"]
            district = row["district"]
            districts_by_state.setdefault(state, []).append(district)

        return {
            "states": states,
            "districtsByState": districts_by_state,
            "tables": TABLE_FILE_MAP,
        }

