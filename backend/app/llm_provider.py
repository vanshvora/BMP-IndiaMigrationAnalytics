from __future__ import annotations

from langchain_core.language_models.chat_models import BaseChatModel

from .config import Settings


class LLMInitializationError(RuntimeError):
    pass


def build_chat_model(settings: Settings) -> BaseChatModel:
    provider = settings.llm_provider.lower().strip()
    if provider != "groq":
        raise LLMInitializationError("Unsupported LLM_PROVIDER. This backend is configured for groq only.")

    if not settings.groq_api_key:
        raise LLMInitializationError("GROQ_API_KEY is not configured.")
    try:
        from langchain_openai import ChatOpenAI
    except Exception as exc:  # pragma: no cover - import guard
        raise LLMInitializationError("langchain-openai is not installed.") from exc
    return ChatOpenAI(
        model=settings.groq_model,
        api_key=settings.groq_api_key,
        base_url=settings.groq_base_url,
        temperature=0,
    )
