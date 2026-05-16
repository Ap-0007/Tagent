<p align="center">
  <img src="https://img.shields.io/badge/Tagent-AI%20SRE%20Platform-22c55e?style=for-the-badge&logo=kubernetes&logoColor=white" alt="Tagent" />
</p>

<h1 align="center">Tagent</h1>

<p align="center">
  <strong>AI-Powered Kubernetes Incident Intelligence & Auto-Remediation Platform</strong>
</p>

<p align="center">
  <a href="#installation"><img src="https://img.shields.io/badge/Install-Helm-0f766e?style=flat-square&logo=helm" alt="Helm" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-Apache%202.0-blue?style=flat-square" alt="License" /></a>
  <a href="#local-models-only"><img src="https://img.shields.io/badge/AI-Local%20Models%20Only-22c55e?style=flat-square" alt="Local AI" /></a>
  <img src="https://img.shields.io/badge/Status-Alpha-orange?style=flat-square" alt="Status" />
  <a href="https://github.com/Tagent-dev/Tagent"><img src="https://img.shields.io/github/stars/Tagent-dev/Tagent?style=flat-square&color=22c55e" alt="Stars" /></a>
</p>

<p align="center">
  Tagent watches your Kubernetes clusters, detects incidents, identifies root causes,<br/>
  executes safe fixes, and documents everything — automatically.<br/>
  <strong>Runs entirely on your hardware. No data leaves your cluster.</strong>
</p>

---

## What is Tagent?

Tagent is an open-source AI SRE (Site Reliability Engineer) that lives inside your Kubernetes cluster. It continuously monitors your infrastructure, correlates signals across logs, metrics, and traces, and takes action when things go wrong.

**The problem:** Engineers spend hours manually correlating dashboards, logs, and alerts during incidents. Incidents happen at night. The same problems get fixed repeatedly. Postmortems are written late or never.

**Tagent's solution:**

```
Incident detected → Root cause identified → Safe fix executed → Report generated → Team notified
```

All of this happens automatically, with full transparency and human approval for risky actions.

---

## Key Features

| Feature | Description |
|---------|-------------|
| **Auto-Detection** | Monitors pods, deployments, nodes, metrics, logs in real-time |
| **AI Root Cause Analysis** | Correlates signals to identify why something broke |
| **Blast Radius** | Shows which services are affected downstream |
| **Auto-Remediation** | Restarts pods, scales deployments, rolls back — with safety checks |
| **Night Guardian** | Autonomous overnight mode with configurable confidence thresholds |
| **Escalation Chain** | Slack → Email → Phone call → Auto-fix (configurable timing) |
| **Video Briefing** | Morning AI briefing explaining what happened overnight |
| **Incident Reports** | Auto-generated postmortems with timeline, RCA, and prevention |
| **Knowledge Base** | Learns from past incidents, recommends proven fixes |
| **Cost Dashboard** | Infrastructure spend tracking with optimization recommendations |
| **Chaos Testing** | Validate remediation logic with controlled failure simulations |
| **HPA/VPA Monitoring** | Track autoscaling status and events |
| **Service Topology** | Visual dependency graph with health indicators |
| **CLI** | `tagent incidents`, `tagent analyze`, `tagent remediate` |

---

## Local Models Only

Tagent's AI engine runs **entirely on local models**. No OpenAI, no Anthropic, no cloud APIs. Ever.

- **Default runtime:** [Ollama](https://ollama.ai)
- **Chat model:** `llama3.1:8b`
- **Embedding model:** `nomic-embed-text`

**Why:** Privacy, cost predictability, air-gapped support, compliance (SOC 2, HIPAA, FedRAMP), zero vendor lock-in.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Ingress (ALB/NGINX)                   │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                      API Gateway (Go)                        │
│              Auth · Routing · Rate Limit · WebSocket         │
└──┬──────────┬──────────┬──────────┬──────────┬──────────────┘
   │          │          │          │          │
   ▼          ▼          ▼          ▼          ▼
┌──────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌──────────────┐
│Disco-│ │Monitor-│ │   AI   │ │Remedi- │ │ Notification │
│very  │ │  ing   │ │ Engine │ │ation   │ │   Service    │
│(Go)  │ │ (Go)   │ │(Python)│ │ (Go)   │ │    (Go)      │
└──┬───┘ └───┬────┘ └───┬────┘ └───┬────┘ └──────┬───────┘
   │         │          │          │              │
   └─────────┴──────────┴──────────┴──────────────┘
                         │
   ┌─────────────────────┼─────────────────────────┐
   │  PostgreSQL · Redis · Kafka · Prometheus · Ollama │
   └───────────────────────────────────────────────────┘
```

**All services run as pods in the `tagent` namespace.**

---

## Installation

### Prerequisites

- Kubernetes 1.25+ (local: minikube, kind, Docker Desktop; cloud: EKS, GKE, AKS)
- Helm 3.10+
- `kubectl` configured for your cluster

### Quick Install

```bash
# Add the Helm repository
helm repo add tagent https://tagent-dev.github.io/Tagent
helm repo update

# Install
helm install tagent tagent/tagent \
  --namespace tagent \
  --create-namespace

# Verify
kubectl get pods -n tagent

# Access the UI
kubectl port-forward -n tagent svc/tagent-web 3000:80
```

Open **http://localhost:3000**

### Install from Source

```bash
git clone https://github.com/Tagent-dev/Tagent.git
cd Tagent

helm install tagent ./helm-charts/tagent \
  --namespace tagent \
  --create-namespace \
  -f helm-charts/tagent/values-development.yaml
```

### EKS with Ingress

```bash
helm install tagent tagent/tagent \
  --namespace tagent \
  --create-namespace \
  -f helm-charts/tagent/values-production.yaml \
  --set ingress.enabled=true \
  --set ingress.className=alb \
  --set ingress.hosts[0].host=tagent.yourdomain.com
```

---

## What Gets Deployed

```
kubectl get pods -n tagent

NAME                                    READY   STATUS    AGE
tagent-api-gateway-xxx                  1/1     Running   2m
tagent-discovery-xxx                    1/1     Running   2m
tagent-monitoring-xxx                   1/1     Running   2m
tagent-ai-engine-xxx                    1/1     Running   2m
tagent-remediation-xxx                  1/1     Running   2m
tagent-notification-xxx                 1/1     Running   2m
tagent-ollama-xxx                       1/1     Running   2m
tagent-web-xxx                          1/1     Running   2m
```

---

## Configuration

Key settings in `values.yaml`:

```yaml
# Remediation safety mode
remediation:
  mode: "read-only"  # read-only | approval-required | auto

# Night Guardian (autonomous overnight mode)
nightGuardian:
  enabled: false
  confidence: "85"

# Escalation timing
escalation:
  phoneDelayMin: "3"
  autoFixDelayMin: "10"
  quietStart: "22:00"
  quietEnd: "06:00"

# Local AI model
ollama:
  model: "llama3.1:8b"
  embeddingModel: "nomic-embed-text"
```

See [full values.yaml](helm-charts/tagent/values.yaml) for all options.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| API Gateway | Go + Gin |
| Discovery, Monitoring, Remediation, Notification | Go |
| AI Engine | Python + FastAPI + Ollama |
| Frontend | Next.js 14 + TypeScript + Tailwind CSS |
| Database | PostgreSQL |
| Cache | Redis |
| Queue | Kafka |
| Metrics | Prometheus |
| LLM | Ollama (local, llama3.1:8b) |
| Deployment | Kubernetes + Helm |
| CI/CD | GitHub Actions |

---

## Development

```bash
# Start local infrastructure
docker compose -f docker-compose.dev.yml up -d

# Frontend
cd frontend/web && npm install && npm run dev

# API Gateway
cd backend/services/api-gateway && go run cmd/server/main.go

# AI Engine
cd backend/services/ai-engine
pip install -r requirements.txt
uvicorn app.main:app --port 8083

# Pull the local LLM model
docker compose exec ollama ollama pull llama3.1:8b
docker compose exec ollama ollama pull nomic-embed-text
```

---

## Documentation

- [Development Roadmap](doc/DEVELOPMENT_ROADMAP.md)
- [AI Requirements (Local Models Only)](doc/AI_REQUIREMENTS.md)
- [Advanced Features Spec](doc/FEATURES_ADVANCED.md)
- [Installation Guide](doc/INSTALL.md)
- [Helm Chart README](helm-charts/tagent/README.md)

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup instructions, commit conventions, and PR guidelines.

---

## Security

See [SECURITY.md](SECURITY.md) for vulnerability reporting and security architecture.

---

## License

[Apache License 2.0](LICENSE)

---

<p align="center">
  <sub>Built for engineers who are tired of being paged at 3 AM.</sub>
</p>
