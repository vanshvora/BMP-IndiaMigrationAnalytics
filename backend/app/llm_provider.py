from __future__ import annotations

from langchain_core.language_models.chat_models import BaseChatModel

from .config import Settings


class LLMInitializationError(RuntimeError):
    pass


def build_chat_model(settings: Settings) -> BaseChatModel:
    provider = settings.llm_provider.lower().strip()

    if provider == "google":
        if not settings.google_api_key:
            raise LLMInitializationError("GOOGLE_API_KEY is not configured.")
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
        except Exception as exc:  # pragma: no cover - import guard
            raise LLMInitializationError("langchain-google-genai is not installed.") from exc
        return ChatGoogleGenerativeAI(
            model=settings.google_model,
            google_api_key=settings.google_api_key,
            temperature=0,
        )

    if provider == "openai":
        if not settings.openai_api_key:
            raise LLMInitializationError("OPENAI_API_KEY is not configured.")
        try:
            from langchain_openai import ChatOpenAI
        except Exception as exc:  # pragma: no cover - import guard
            raise LLMInitializationError("langchain-openai is not installed.") from exc
        return ChatOpenAI(
            model=settings.openai_model,
            api_key=settings.openai_api_key,
            temperature=0,
        )

    if provider == "anthropic":
        if not settings.anthropic_api_key:
            raise LLMInitializationError("ANTHROPIC_API_KEY is not configured.")
        try:
            from langchain_anthropic import ChatAnthropic
        except Exception as exc:  # pragma: no cover - import guard
            raise LLMInitializationError("langchain-anthropic is not installed.") from exc
        return ChatAnthropic(
            model=settings.anthropic_model,
            api_key=settings.anthropic_api_key,
            temperature=0,
        )

    if provider == "xai":
        if not settings.xai_api_key:
            raise LLMInitializationError("XAI_API_KEY is not configured.")
        try:
            from langchain_openai import ChatOpenAI
        except Exception as exc:  # pragma: no cover - import guard
            raise LLMInitializationError("langchain-openai is not installed.") from exc
        return ChatOpenAI(
            model=settings.xai_model,
            api_key=settings.xai_api_key,
            base_url=settings.xai_base_url,
            temperature=0,
        )

    if provider == "groq":
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

    raise LLMInitializationError(
        "Unsupported LLM_PROVIDER. Use one of: google, openai, anthropic, xai, groq."
    )
