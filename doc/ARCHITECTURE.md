# Tagent Architecture

## System Overview

Tagent is a microservices platform deployed in Kubernetes. All services communicate via HTTP REST + Kafka events. Redis provides caching/rate-limiting. PostgreSQL (with pgvector) stores persistent data.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Ingress (ALB / NGINX)                         │
└────────────────────────────────────┬────────────────────────────────┘
                                     │
┌────────────────────────────────────▼────────────────────────────────┐
│                        API Gateway (Go/Gin :8080)                     │
│                                                                       │
│  • Rate Limiting (Redis sliding window, 120 req/min/IP)              │
│  • Response Caching (Redis, 15s TTL for GET requests)                │
│  • Prometheus /metrics (request count, duration, in-flight)          │
│  • WebSocket Hub (broadcasts incidents to connected clients)         │
│  • Multi-Cluster Manager (queries multiple Discovery instances)      │
│  • User Management (PostgreSQL, token-based auth)                    │
│  • Session Management (Redis, 24h TTL)                               │
└──┬──────────┬──────────┬──────────┬──────────┬──────────────────────┘
   │          │          │          │          │
   ▼          ▼          ▼          ▼          ▼
┌──────┐ ┌────────┐ ┌──────────────────────┐ ┌────────┐ ┌────────────┐
│Disco-│ │Monitor-│ │     AI Engine        │ │Remedi- │ │Notification│
│very  │ │  ing   │ │   (Python :8083)     │ │ation   │ │  (:8085)   │
│(:8081)│ │(:8082) │ │                      │ │(:8084) │ │            │
│      │ │        │ │ Routers:             │ │        │ │ Channels:  │
│• Scan│ │• Detect│ │ • /ai/chat           │ │• Execute│ │ • Slack    │
│• HPA │ │• Alert │ │ • /ai/rca            │ │• Guardian│ │ • Email   │
│• Logs│ │• Kafka │ │ • /ai/analyze        │ │• Chaos  │ │ • Phone   │
│• Cost│ │  Publish│ │ • /knowledge/*       │ │• Reports│ │ • Kafka   │
│      │ │        │ │ • /risks/*           │ │• Kafka  │ │   Consumer│
│      │ │        │ │ • /predictive/*      │ │  Publish│ │ • Escalation│
│      │ │        │ │ • /plugins/*         │ │        │ │   Engine  │
│      │ │        │ │ • /reports/*         │ │        │ │            │
│      │ │        │ │ • /briefing/*        │ │        │ │            │
│      │ │        │ │                      │ │        │ │            │
│      │ │        │ │ Background:          │ │        │ │            │
│      │ │        │ │ • Predictive collector│ │        │ │            │
│      │ │        │ │   (every 15s)        │ │        │ │            │
│      │ │        │ │ • Plugin runner      │ │        │ │            │
└──┬───┘ └───┬────┘ └──────────┬───────────┘ └───┬────┘ └──────┬─────┘
   │         │                 │                 │              │
   └─────────┴─────────────────┼─────────────────┴──────────────┘
                               │
   ┌───────────────────────────┼───────────────────────────────────┐
   │                    Data Layer                                    │
   │                                                                  │
   │  PostgreSQL (pgvector)     Redis 7           Kafka               │
   │  • Users/Auth              • Rate limiting   • incidents.detected│
   │  • Incidents               • Response cache  • remediation.completed│
   │  • Reports                 • Sessions        • discovery.changed │
   │  • Audit logs              • LLM cache       • escalation.triggered│
   │  • Knowledge entries       • Embeddings cache                    │
   │    (vector embeddings)                                           │
   │                                                                  │
   │  Prometheus                Ollama (Local LLM)                    │
   │  • Scrapes all services    • llama3.1:8b (chat)                 │
   │  • /metrics endpoints      • nomic-embed-text (embeddings)      │
   └──────────────────────────────────────────────────────────────────┘
```

## Service Responsibilities

| Service | Language | Port | Role |
|---------|----------|------|------|
| API Gateway | Go | 8080 | Single entry point, routing, auth, rate limit, cache, WebSocket, multi-cluster |
| Discovery | Go | 8081 | Scans K8s (pods, nodes, deployments, services, HPA), logs, cost estimation |
| Monitoring | Go | 8082 | Queries Prometheus, detects incidents (CrashLoop, OOM, NodeNotReady), publishes to Kafka |
| AI Engine | Python | 8083 | LLM chat, RCA, analysis, knowledge base, risk scoring, predictive detection, plugins, reports, briefing |
| Remediation | Go | 8084 | Executes K8s actions, Night Guardian, chaos testing, PostgreSQL persistence, publishes to Kafka |
| Notification | Go | 8085 | Slack/email/phone delivery, escalation chain, Kafka consumer (auto-notify on incidents) |
| Web | Next.js | 3000 | Frontend UI, API proxy to gateway |

## Data Flow

### Incident Detection → Notification
```
Monitoring (scans K8s every 10s)
  → detects CrashLoopBackOff
  → publishes to Kafka: tagent.incidents.detected
      → Notification consumes
          → sends Slack message
          → sends Email
          → triggers Escalation Chain (if high/critical)
      → WebSocket Hub broadcasts to connected browsers
```

### AI Chat Request
```
Browser → /api/proxy/ai/chat
  → Next.js proxy → API Gateway → AI Engine
      → check Redis cache (60s TTL)
      → if miss: fetch cluster context from Discovery (cached 15s)
      → inject context into Ollama prompt
      → Ollama generates response
      → cache in Redis
      → return to browser
```

### Night Guardian Auto-Fix
```
Remediation (Night Guardian loop, every 30s)
  → fetch incidents from Monitoring
  → if CrashLoopBackOff + confidence > threshold
      → delete pod (controller recreates)
      → publish to Kafka: tagent.remediation.completed
      → Notification sends Slack message
      → store in PostgreSQL audit log
```

### Knowledge Base Search
```
User types query in Knowledge page
  → AI Engine: POST /knowledge/search
      → generate embedding via Ollama (nomic-embed-text)
      → check Redis embedding cache (1h TTL)
      → query pgvector: cosine similarity search
      → return top-K similar past incidents
```

## Frontend Architecture

```
Next.js 15 (App Router)
├── /api/proxy/[...path]/route.ts  → proxies all API calls to Gateway
├── /app/                          → 26 pages
├── /components/                   → 50+ components
├── /lib/api.ts                    → typed API client (all endpoints)
└── /lib/useWebSocket.ts           → real-time updates
```

The browser never calls backend services directly. All requests go through the Next.js API proxy route, which forwards to the API Gateway internally.

## Deployment Architecture (Kubernetes)

```yaml
Namespace: tagent
├── Deployment: tagent-api-gateway (1 replica)
├── Deployment: tagent-discovery (1 replica)
├── Deployment: tagent-monitoring (1 replica)
├── Deployment: tagent-ai-engine (1 replica)
├── Deployment: tagent-remediation (1 replica)
├── Deployment: tagent-notification (1 replica)
├── Deployment: tagent-web (1 replica)
├── Deployment: tagent-ollama (1 replica, GPU optional)
├── Deployment: tagent-postgres (1 replica, pgvector)
├── Deployment: tagent-redis (1 replica, LRU 128MB)
├── Deployment: tagent-kafka (1 replica, KRaft mode)
├── ServiceAccount + RBAC (read cluster, write pods)
├── Services (ClusterIP for all)
├── Ingress (optional, ALB/NGINX)
└── ServiceMonitor (optional, for Prometheus Operator)
```

## Security Model

- All services run as non-root with read-only filesystem
- Capabilities dropped (ALL)
- API Gateway handles rate limiting (120 req/min per IP)
- Remediation blocked in read-only mode by default
- Destructive actions require mode=auto or Night Guardian enabled
- All actions audit-logged in PostgreSQL
- No data leaves the cluster (local LLM only)
- Redis sessions with 24h expiry
- Plugin SDK blocks dangerous imports (subprocess, shutil, ctypes)

## Technology Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| LLM | Ollama (local only) | Privacy, air-gapped, cost-free, no vendor lock-in |
| Vector DB | PostgreSQL + pgvector | One DB for everything, no separate vector service |
| Event Bus | Kafka | Stream replay, consumer groups, decoupling |
| Cache | Redis | Fast, proven, supports rate limiting + sessions |
| API Framework (Go) | Gin | High performance, K8s ecosystem standard |
| API Framework (Python) | FastAPI | Async, auto-docs, Pydantic validation |
| Frontend | Next.js 15 | SSR, API routes, React 18, TypeScript |
| Deployment | Helm | K8s standard, one-command install |
| CI/CD | GitHub Actions | Free for OSS, multi-arch builds |
| Metrics | Prometheus | K8s native, all services expose /metrics |
