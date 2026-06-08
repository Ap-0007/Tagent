"""Tagent AI Engine — local LLM-powered cluster intelligence.

Answers questions about your Kubernetes cluster using:
1. Real cluster data (fetched from Discovery/Monitoring services)
2. Local Ollama LLM (llama3.1:8b) — no cloud APIs, no data leaves your cluster
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import chat, analysis, rca
from app.routers import knowledge as knowledge_router
from app.routers import risks as risks_router

app = FastAPI(
    title="Tagent AI Engine",
    description="Local LLM-powered Kubernetes incident intelligence",
    version="0.1.0",
)

# Allow frontend to call the AI Engine directly during development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    from app.providers import OllamaProvider
    provider = OllamaProvider()
    ollama_ok = await provider.health()
    return {
        "status": "healthy" if ollama_ok else "degraded",
        "service": "tagent-ai-engine",
        "version": "0.1.0",
        "ollama": "connected" if ollama_ok else "unreachable",
        "model": os.getenv("OLLAMA_MODEL", "llama3.1:8b"),
    }


app.include_router(chat.router, prefix="/api/v1/ai", tags=["chat"])
app.include_router(analysis.router, prefix="/api/v1/ai", tags=["analysis"])
app.include_router(rca.router, prefix="/api/v1/ai", tags=["rca"])
app.include_router(knowledge_router.router, prefix="/api/v1/knowledge", tags=["knowledge"])
app.include_router(risks_router.router, prefix="/api/v1/risks", tags=["risks"])


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8083"))
    uvicorn.run(app, host="0.0.0.0", port=port)
