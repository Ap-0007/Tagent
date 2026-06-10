# Tagent — AI Engine Requirements (HARD CONSTRAINT)

## Local Models Only

**This is a non-negotiable architectural requirement.**

Tagent's AI Engine **must run entirely on local/self-hosted models**. No cloud API calls to OpenAI, Anthropic, Google, Cohere, or any other external LLM provider. Ever.

## Why

- **Privacy** — cluster telemetry (logs, configs, secrets context) never leaves the customer environment
- **Cost predictability** — no per-token charges, no surprise bills
- **Air-gapped deployments** — works in environments with zero internet egress
- **Compliance** — SOC 2, HIPAA, FedRAMP-friendly by default
- **Offline reliability** — incidents during a network outage still get analyzed
- **Vendor independence** — no dependency on any third-party API uptime or pricing changes

## Default Stack

| Component | Tool |
|-----------|------|
| LLM runtime | Ollama |
| Default chat model | `llama3.1:8b-instruct-q4_K_M` |
| Default embedding model | `nomic-embed-text` |
| Vector store | PostgreSQL with `pgvector` |
| Optional larger model | `qwen2.5:14b-instruct-q4_K_M` (for high-end hardware) |

## Deployment Options

### Option A — Ollama as a sidecar in Tagent's namespace (default)

Helm chart deploys Ollama alongside the AI Engine. Models are pulled on first run and cached in a PersistentVolume.

```yaml
ollama:
  enabled: true
  model: llama3.1:8b
  embeddingModel: nomic-embed-text
  persistence:
    enabled: true
    size: 20Gi
```

### Option B — User-supplied Ollama endpoint

If the user already runs Ollama elsewhere (on a GPU node, on their workstation, in another namespace), point Tagent at it:

```yaml
ollama:
  enabled: false
  endpoint: "http://my-ollama.ai-namespace.svc.cluster.local:11434"
```

### Option C — Other local runtimes

The AI Engine has a provider abstraction. Swap `OllamaProvider` for `LlamaCppProvider`, `vLLMProvider`, etc. Same interface, different backend. Cloud providers are explicitly excluded from the abstraction.

## Hardware Recommendations

| Model size | Min RAM | GPU recommended | Notes |
|------------|---------|-----------------|-------|
| 7-8B (q4) | 8 GB | optional | Works on CPU, slow but usable |
| 13-14B (q4) | 16 GB | yes | GPU strongly recommended |
| 70B (q4) | 48 GB+ | yes (multi-GPU) | Enterprise tier only |

For Kubernetes deployments, the Ollama pod should request:

```yaml
resources:
  requests:
    cpu: 2
    memory: 8Gi
  limits:
    cpu: 4
    memory: 12Gi
```

Add NVIDIA GPU resource if available:

```yaml
resources:
  limits:
    nvidia.com/gpu: 1
```

## What This Means For The Code

- `backend/services/ai-engine/app/providers/` exists and contains **only local-runtime adapters** (Ollama, llama.cpp, vLLM)
- No `import openai` anywhere in the AI Engine
- No `import anthropic` anywhere in the AI Engine
- `requirements.txt` does not include `openai` or `anthropic` packages
- All LLM-related env vars start with `OLLAMA_` (no `OPENAI_API_KEY`)
- Documentation and marketing always say "runs entirely on your hardware"

## Revisiting This Decision

Do not revisit. If a user explicitly asks for cloud-LLM support, it can be added as an opt-in plugin (separate package), but it is **never** the default and **never** required.
