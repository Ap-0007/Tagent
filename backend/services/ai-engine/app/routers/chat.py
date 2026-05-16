"""Chat router — natural-language interface backed by a local LLM."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.providers import OllamaProvider

router = APIRouter()
provider = OllamaProvider()

SYSTEM_PROMPT = (
    "You are Tagent, an AI Site Reliability Engineer for Kubernetes. "
    "Be concise, technical, and explainable. Cite the evidence behind every conclusion. "
    "Never recommend destructive actions without clearly stating the risk."
)


class ChatRequest(BaseModel):
    message: str
    context: dict | None = None


class ChatResponse(BaseModel):
    response: str
    model: str


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    if not await provider.health():
        raise HTTPException(503, "Local LLM runtime not reachable")
    answer = await provider.chat(request.message, system=SYSTEM_PROMPT)
    return ChatResponse(response=answer, model=provider.model)
