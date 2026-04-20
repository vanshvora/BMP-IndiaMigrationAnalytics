from __future__ import annotations

from pydantic import BaseModel, Field


class ChatContext(BaseModel):
    page: str | None = None
    selected_state: str | None = None
    selected_district: str | None = None
    threshold: int | None = None


class ChatTurn(BaseModel):
    role: str = Field(pattern="^(user|assistant)$")
    content: str


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    context: ChatContext | None = None
    history: list[ChatTurn] = Field(default_factory=list)


class Citation(BaseModel):
    label: str
    detail: str | None = None


class ChatResponse(BaseModel):
    answer: str
    route: str
    sql: str | None = None
    citations: list[Citation] = Field(default_factory=list)
    data_preview: list[dict] = Field(default_factory=list)
    follow_ups: list[str] = Field(default_factory=list)
    error: str | None = None

