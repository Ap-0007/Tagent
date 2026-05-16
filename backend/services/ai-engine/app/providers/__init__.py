"""LLM provider implementations.

HARD CONSTRAINT: only local/self-hosted runtimes are allowed here.
No cloud APIs (OpenAI, Anthropic, etc.). See doc/AI_REQUIREMENTS.md.
"""

from app.providers.base import LLMProvider
from app.providers.ollama_provider import OllamaProvider

__all__ = ["LLMProvider", "OllamaProvider"]
