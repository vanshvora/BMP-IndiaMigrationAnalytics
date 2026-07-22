from __future__ import annotations

from functools import cached_property
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Centralized configuration loaded from environment variables and .env file.
    Every setting has a sensible default so the app can start locally
    without a full .env file — but production deploys should set all values.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── App Identity ───────────────────────────────────────────────────
    app_name: str = "India Migration AI Chatbot API"
    api_prefix: str = "/api"

    # ── Network ────────────────────────────────────────────────────────
    backend_host: str = Field(default="127.0.0.1", alias="BACKEND_HOST")
    backend_port: int = Field(default=8000, alias="BACKEND_PORT")
    allowed_origins: str = Field(
        default="http://localhost:5173,http://127.0.0.1:5173",
        alias="ALLOWED_ORIGINS",
    )

    # ── LLM (Groq) ────────────────────────────────────────────────────
    llm_provider: str = Field(default="groq", alias="LLM_PROVIDER")
    groq_api_key: str | None = Field(default=None, alias="GROQ_API_KEY")
    groq_model: str = Field(default="llama-3.3-70b-versatile", alias="GROQ_MODEL")
    groq_base_url: str = Field(
        default="https://api.groq.com/openai/v1", alias="GROQ_BASE_URL"
    )

    # ── PostgreSQL ─────────────────────────────────────────────────────
    database_url: str = Field(default="", alias="DATABASE_URL")

    # ── Observability (Logfire) ────────────────────────────────────────
    logfire_token: str | None = Field(default=None, alias="LOGFIRE_TOKEN")

    # ── Agent Behaviour ────────────────────────────────────────────────
    max_sql_retries: int = 3
    max_rows_preview: int = 25
    max_history_turns: int = 8

    # ── Derived Paths ──────────────────────────────────────────────────
    @cached_property
    def project_root(self) -> Path:
        return Path(__file__).resolve().parents[2]

    @cached_property
    def csv_dir(self) -> Path:
        return self.project_root / "react-app" / "public"

    @cached_property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]


settings = Settings()
