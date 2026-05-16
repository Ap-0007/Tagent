# Tagent Helm Chart

AI-powered Kubernetes Incident Intelligence & Auto-Remediation platform.

## Install from the Helm Repository

> Replace `YOUR-GH-USER` with your GitHub username/org once the chart is published.
> The chart repo URL is `https://YOUR-GH-USER.github.io/Tagent` (whatever the repo is named).

### 1. Add the Helm repo

```bash
helm repo add tagent https://YOUR-GH-USER.github.io/Tagent
helm repo update
```

### 2. Install

**Local cluster (minikube, kind, Docker Desktop, Rancher Desktop):**

```bash
helm install tagent tagent/tagent \
  --namespace tagent \
  --create-namespace \
  -f https://raw.githubusercontent.com/YOUR-GH-USER/Tagent/main/helm-charts/tagent/values-development.yaml
```

**EKS (production):**

```bash
helm install tagent tagent/tagent \
  --namespace tagent \
  --create-namespace \
  -f https://raw.githubusercontent.com/YOUR-GH-USER/Tagent/main/helm-charts/tagent/values-production.yaml \
  --set ingress.hosts[0].host=tagent.yourdomain.com
```

### 3. Verify

```bash
kubectl get pods -n tagent
kubectl get svc  -n tagent
kubectl get ingress -n tagent
```

You should see `tagent-web` pod running.

### 4. Access the UI

#### Option A — Port-forward (works everywhere, fastest for testing)

```bash
kubectl port-forward -n tagent svc/tagent-web 3000:80
```

Open: http://localhost:3000

#### Option B — Ingress (EKS with AWS ALB)

```bash
kubectl get ingress -n tagent
```

Wait for `ADDRESS` column to show the ALB DNS name (1-2 minutes), then open it in your browser.
Point your DNS (Route53) `tagent.yourdomain.com` at that ALB.

#### Option C — LoadBalancer (any cloud)

Set `web.service.type=LoadBalancer`:

```bash
helm upgrade tagent tagent/tagent -n tagent \
  --reuse-values \
  --set web.service.type=LoadBalancer
kubectl get svc -n tagent tagent-web
```

Open the `EXTERNAL-IP`.

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

## Configuration

See `values.yaml` for all available options. Common overrides:

| Setting | Default | Description |
|---------|---------|-------------|
| `web.replicaCount` | 1 | Number of frontend pods |
| `web.image.repository` | `ghcr.io/tagent-ai/web` | Container image |
| `web.image.tag` | `Chart.appVersion` | Image tag |
| `web.service.type` | `ClusterIP` | `ClusterIP`, `NodePort`, `LoadBalancer` |
| `web.apiUrl` | `http://tagent-api-gateway` | Backend API URL (used once backend is built) |
| `ingress.enabled` | `false` | Enable Ingress |
| `ingress.className` | `""` | `alb` for EKS, `nginx` for nginx-ingress |
| `ingress.hosts[0].host` | `tagent.local` | Hostname |
