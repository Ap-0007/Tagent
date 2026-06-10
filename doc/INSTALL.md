# Installing Tagent

## Prerequisites

- Kubernetes 1.25+ (EKS, GKE, AKS, minikube, kind, Docker Desktop)
- Helm 3.10+
- kubectl configured for your cluster

---

## Quick Install (from Helm repo)

```bash
helm repo add tagent https://tagent-dev.github.io/Tagent
helm repo update
helm install tagent tagent/tagent --namespace tagent --create-namespace
```

## Install from Source

```bash
git clone https://github.com/Tagent-dev/Tagent.git
cd Tagent
helm install tagent ./helm-charts/tagent --namespace tagent --create-namespace
```

## Verify Installation

```bash
kubectl get pods -n tagent
```
```bash
kubectl get all -n tagent
```

Expected (all Running within 2-3 minutes):
```
tagent-api-gateway-xxx      1/1   Running
tagent-discovery-xxx        1/1   Running
tagent-monitoring-xxx       1/1   Running
tagent-ai-engine-xxx        1/1   Running
tagent-remediation-xxx      1/1   Running
tagent-notification-xxx     1/1   Running
tagent-web-xxx              1/1   Running
tagent-ollama-xxx           1/1   Running
tagent-postgres-xxx         1/1   Running
tagent-redis-xxx            1/1   Running
tagent-kafka-xxx            1/1   Running
```

## Access the UI

```bash
kubectl port-forward -n tagent svc/tagent-web 3000:3000
```
or
```bash
kubectl port-forward -n tagent svc/tagent-web 3000:80 --address 0.0.0.0 &
```

Open: **http://localhost:3000**

## Pull AI Model (automatic)

Models are pulled automatically on first start via the Ollama postStart hook.
You can also install/switch models from the **AI Models** page in the dashboard.

If auto-pull didn't work (first-time deploy can be slow):
```bash
kubectl exec -it -n tagent deploy/tagent-ollama -- ollama pull llama3.1:8b
kubectl exec -it -n tagent deploy/tagent-ollama -- ollama pull nomic-embed-text
```

---

## Configuration

Override values during install:

```bash
helm install tagent tagent/tagent -n tagent --create-namespace \
  --set nightGuardian.enabled=true \
  --set remediation.mode=auto \
  --set escalation.enabled=true \
  --set secrets.slackWebhookUrl="https://hooks.slack.com/..." \
  --set secrets.smtpHost="smtp.gmail.com" \
  --set secrets.smtpUser="you@gmail.com" \
  --set secrets.smtpPassword="app-password"
```

## Install on EKS with Ingress

```bash
helm install tagent tagent/tagent -n tagent --create-namespace \
  --set ingress.enabled=true \
  --set ingress.className=alb \
  --set ingress.hosts[0].host=tagent.yourdomain.com \
  --set ingress.hosts[0].paths[0].path=/ \
  --set ingress.hosts[0].paths[0].pathType=Prefix
```

---

## Upgrade

```bash
helm repo update
helm upgrade tagent tagent/tagent -n tagent
```

## Uninstall

```bash
helm uninstall tagent -n tagent
kubectl delete namespace tagent
```

---

## What Gets Deployed

| Pod | Port | Purpose |
|-----|------|---------|
| tagent-web | 3000 | Dashboard UI |
| tagent-api-gateway | 8080 | API routing, auth, rate limit, cache |
| tagent-discovery | 8081 | K8s resource scanning, HPA, logs, cost |
| tagent-monitoring | 8082 | Metrics + incident detection |
| tagent-ai-engine | 8083 | Local LLM, knowledge base, risks, plugins |
| tagent-remediation | 8084 | Auto-fix, Night Guardian, chaos testing |
| tagent-notification | 8085 | Slack, email, phone, escalation |
| tagent-ollama | 11434 | Local LLM runtime |
| tagent-postgres | 5432 | Database (pgvector) |
| tagent-redis | 6379 | Cache, rate limiting, sessions |
| tagent-kafka | 9092 | Event streaming |

---

## Troubleshooting

**Pods in ImagePullBackOff:**
- Images are public on Docker Hub (`yaswanth111/tagent-*`). Check internet.

**Ollama pod Pending:**
- Persistence is disabled by default (works everywhere).
- To enable persistent storage (keeps models across restarts):
  ```bash
  helm upgrade tagent ./helm-charts/tagent -n tagent \
    --set ollama.persistence.enabled=true \
    --set ollama.persistence.storageClass=gp2
  ```
- On EKS: make sure the EBS CSI driver is installed (`aws-ebs-csi-driver` addon).

**AI chat not working:**
- Pull the model: `kubectl exec -it deploy/tagent-ollama -n tagent -- ollama pull llama3.1:8b`

**UI shows "Backend offline":**
- Check gateway logs: `kubectl logs deploy/tagent-api-gateway -n tagent`
- The web pod needs internal access to the gateway.

**Port-forward not working:**
- Kill old: `pkill -f "port-forward"`
- Restart: `kubectl port-forward -n tagent svc/tagent-web 3000:3000`


```bash
# Stop any running port-forward process
jobs
kill %1

# Uninstall the Helm release
helm uninstall tagent -n tagent

# Delete the namespace and all resources inside it
kubectl delete namespace tagent
```

```bash
# Remove Helm release
helm uninstall tagent -n tagent

# Verify resources are gone
kubectl get all -n tagent

# Delete the namespace and everything inside it
kubectl delete namespace tagent
```