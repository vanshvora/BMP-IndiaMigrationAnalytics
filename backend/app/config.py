from __future__ import annotations

from functools import cached_property
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = "India Migration AI Chatbot API"
    api_prefix: str = "/api"

    backend_host: str = Field(default="127.0.0.1", alias="BACKEND_HOST")
    backend_port: int = Field(default=8000, alias="BACKEND_PORT")
    allowed_origins: str = Field(
        default="http://localhost:5173,http://127.0.0.1:5173",
        alias="ALLOWED_ORIGINS",
    )

    llm_provider: str = Field(default="google", alias="LLM_PROVIDER")
    google_api_key: str | None = Field(default=None, alias="GOOGLE_API_KEY")
    google_model: str = Field(default="gemini-2.5-flash", alias="GOOGLE_MODEL")
    openai_api_key: str | None = Field(default=None, alias="OPENAI_API_KEY")
    openai_model: str = Field(default="gpt-4.1-mini", alias="OPENAI_MODEL")
    anthropic_api_key: str | None = Field(default=None, alias="ANTHROPIC_API_KEY")
    anthropic_model: str = Field(default="claude-3-7-sonnet-latest", alias="ANTHROPIC_MODEL")
    xai_api_key: str | None = Field(default=None, alias="XAI_API_KEY")
    xai_model: str = Field(default="grok-4-fast", alias="XAI_MODEL")
    xai_base_url: str = Field(default="https://api.x.ai/v1", alias="XAI_BASE_URL")
    groq_api_key: str | None = Field(default=None, alias="GROQ_API_KEY")
    groq_model: str = Field(default="llama-3.1-8b-instant", alias="GROQ_MODEL")
    groq_base_url: str = Field(default="https://api.groq.com/openai/v1", alias="GROQ_BASE_URL")

    max_rows_preview: int = 25
    max_history_turns: int = 8
    sql_default_limit: int = 200
    chat_rate_limit_per_minute: int = Field(default=40, alias="CHAT_RATE_LIMIT_PER_MINUTE")
    chat_cache_ttl_seconds: int = Field(default=180, alias="CHAT_CACHE_TTL_SECONDS")
    chat_cache_max_entries: int = Field(default=500, alias="CHAT_CACHE_MAX_ENTRIES")

    @cached_property
    def project_root(self) -> Path:
        return Path(__file__).resolve().parents[2]

    @cached_property
    def csv_dir(self) -> Path:
        return self.project_root / "react-app" / "public"

    @cached_property
    def db_file(self) -> Path:
        return self.project_root / "backend" / "data" / "migration.duckdb"

    @cached_property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]


settings = Settings()
