"""Tagent AI Engine — FastAPI service for incident intelligence."""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import chat, analysis, rca

app = FastAPI(
    title="Tagent AI Engine",
    description="AI-powered incident intelligence and root cause analysis",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "tagent-ai-engine", "version": "0.1.0"}


app.include_router(chat.router, prefix="/api/v1/ai", tags=["chat"])
app.include_router(analysis.router, prefix="/api/v1/ai", tags=["analysis"])
app.include_router(rca.router, prefix="/api/v1/ai", tags=["rca"])


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8083"))
    uvicorn.run(app, host="0.0.0.0", port=port)
