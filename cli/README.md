# Tagent CLI

Command-line interface for the Tagent AI SRE platform.

## Install

**From GitHub Releases:**
```bash
# Linux (amd64)
curl -Lo tagent https://github.com/Tagent-dev/Tagent/releases/latest/download/tagent-linux-amd64
chmod +x tagent && sudo mv tagent /usr/local/bin/

# macOS (Apple Silicon)
curl -Lo tagent https://github.com/Tagent-dev/Tagent/releases/latest/download/tagent-darwin-arm64
chmod +x tagent && sudo mv tagent /usr/local/bin/

# Windows
# Download tagent-windows-amd64.exe from GitHub Releases
```

**From source:**
```bash
cd cli && go build -o tagent .
```

## Configuration

The CLI connects to your Tagent API Gateway.

```bash
# Option 1: Environment variable
export TAGENT_API_URL=http://localhost:8080

# Option 2: Flag
tagent --api http://tagent.company.com:8080 status

# Option 3: Port-forward (when running in K8s)
kubectl port-forward -n tagent svc/tagent-api-gateway 8080:8080
tagent status
```

## Commands

| Command | Description |
|---------|-------------|
| `tagent status` | Cluster health summary |
| `tagent incidents` | List active incidents |
| `tagent incidents <id>` | Incident detail with evidence |
| `tagent chat '<question>'` | Ask AI about your cluster |
| `tagent analyze '<problem>'` | AI analyzes a problem |
| `tagent risks` | Service risk scores |
| `tagent remediate <action> -n <ns> -t <target>` | Execute remediation |
| `tagent remediate <action> --dry-run` | Preview without executing |
| `tagent guardian` | Night Guardian status |
| `tagent version` | Show version |

## Examples

```bash
# Check cluster health
$ tagent status
⎈ Cluster Status: HEALTHY

Nodes        4/4 Ready
Pods         96 Running, 4 Failed, 100 Total
Deployments  14
Services     248

# List incidents
$ tagent incidents
● Active Incidents (3)

ID        Severity  Status   Service                          Title
INC-0001  critical  active   production/payment-service       High Error Rate in Payment Service
INC-0002  medium    active   production/analytics             Memory pressure on analytics pods
INC-0003  high      active   production/order-service         Elevated latency on order-service

# Ask AI
$ tagent chat 'how many pods are failing?'
→ You: how many pods are failing?
← Tagent: Based on the current cluster state, there are 4 failing pods...

# Restart a pod (dry-run)
$ tagent remediate restart-pod -n production -t payment-api-xyz --dry-run
⟳ [DRY-RUN] restart-pod on production/payment-api-xyz
ℹ [DRY-RUN] Would execute: restart-pod on payment-api-xyz

# Check risks
$ tagent risks
⚠ Service Risk Scores (5 services)

Score  Level     Service                    Prediction
85     critical  production/payment-svc     Service will likely enter CrashLoopBackOff...
62     high      production/checkout-api    Restart count trending up...
```
