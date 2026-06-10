# Tagent Plugin SDK

Build custom detectors, analyzers, and actions for Tagent.

## How It Works (No Setup Required)

When you install Tagent via Helm, **3 built-in plugins are already running automatically:**

| Plugin | What It Detects |
|--------|----------------|
| `high-restart-detector` | Pods with restart count > 5 |
| `degraded-deployment-detector` | Deployments with fewer ready replicas than desired |
| `pending-pod-detector` | Pods stuck in Pending state (scheduling failure) |

These run every 15 seconds and any detections appear in the Incidents page. **You don't need to do anything — it works out of the box.**

## When Do You Need the Plugin SDK?

Only when you want to add **custom detection rules** that don't exist in the built-in set. Examples:

- SSL certificates expiring within 7 days
- Database connection pool at 90%
- Pods running without resource limits
- Pods running as root (security policy)
- Custom business logic ("order queue > 10,000 items")
- Compliance checks specific to your organization

## Quick Start — Write a Custom Plugin

Create a Python file with a class that subclasses `DetectorPlugin`:

```python
from app.plugins.sdk import DetectorPlugin, Detection

class MyDetector(DetectorPlugin):
    name = "my-custom-detector"
    version = "1.0.0"
    description = "Detects my custom condition"
    author = "Your Name"

    def detect(self, cluster_data: dict) -> list[Detection]:
        detections = []
        for pod in cluster_data.get("pods", []):
            if pod.get("restarts", 0) > 100:
                detections.append(Detection(
                    title=f"Extremely high restarts: {pod['name']}",
                    severity="critical",
                    service=pod["name"],
                    namespace=pod.get("namespace", "default"),
                    evidence=[f"Restarts: {pod['restarts']}"],
                    recommendation="Immediate investigation needed",
                ))
        return detections
```

## Install Your Plugin

**Option 1: Via API (no restart needed)**
```bash
curl -X POST http://localhost:8080/api/v1/plugins/install \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "my_detector.py",
    "code": "from app.plugins.sdk import DetectorPlugin, Detection\n\nclass MyDetector(DetectorPlugin):\n    name = \"my-detector\"\n    version = \"1.0.0\"\n    description = \"My custom check\"\n    author = \"Me\"\n\n    def detect(self, cluster_data: dict) -> list[Detection]:\n        return []"
  }'
```

**Option 2: Place file in plugins directory**
```bash
# Copy to the AI Engine's plugin directory (inside the container)
kubectl cp my_detector.py tagent-ai-engine-xxx:/data/plugins/my_detector.py -n tagent

# Trigger a manual detection run
curl -X POST http://localhost:8080/api/v1/plugins/run-detectors
```

## Plugin Types

### DetectorPlugin (most common)

Scans cluster data every 15 seconds and produces detections. Detections appear as incidents in the UI.

```python
from app.plugins.sdk import DetectorPlugin, Detection

class DetectorPlugin(ABC):
    name: str           # unique identifier
    version: str        # semver
    description: str    # what it does
    author: str         # who made it
    enabled: bool       # can be toggled on/off

    def detect(self, cluster_data: dict) -> list[Detection]:
        """Called every 15 seconds with fresh cluster data.
        Return a list of Detection objects for any issues found."""
        pass

    def on_load(self):
        """Called once when plugin is first loaded."""
        pass

    def on_unload(self):
        """Called when plugin is removed."""
        pass
```

### AnalyzerPlugin

Analyzes incidents and provides custom insights (called on demand).

```python
from app.plugins.sdk import AnalyzerPlugin, AnalysisResult

class MyAnalyzer(AnalyzerPlugin):
    name = "my-analyzer"
    version = "1.0.0"

    def analyze(self, incident: dict, cluster_data: dict) -> AnalysisResult:
        return AnalysisResult(
            summary="My analysis of this incident",
            severity="high",
            confidence=0.85,
            recommendations=["Do X", "Check Y"],
        )
```

### ActionPlugin

Defines custom remediation actions (called explicitly by users).

```python
from app.plugins.sdk import ActionPlugin, ActionResult

class MyAction(ActionPlugin):
    name = "restart-and-notify"
    version = "1.0.0"
    risk_level = "medium"

    def execute(self, params: dict, dry_run: bool = False) -> ActionResult:
        if dry_run:
            return ActionResult(status="dry-run", message="Would restart and notify")
        # Do the actual work
        return ActionResult(status="success", message="Done")

    def validate(self, params: dict) -> tuple[bool, str]:
        if "target" not in params:
            return False, "target parameter required"
        return True, ""
```

## Cluster Data Structure

Your `detect()` method receives the full cluster state:

```json
{
  "pods": [
    {
      "name": "app-xyz",
      "namespace": "production",
      "status": "Running",
      "restarts": 3,
      "node": "node-1",
      "cpu_request": "100m",
      "memory_request": "256Mi",
      "cpu_used": "80m",
      "memory_used": "200Mi"
    }
  ],
  "nodes": [
    {"name": "node-1", "status": "Ready", "cpu_capacity": "4", "memory_capacity": "16Gi"}
  ],
  "deployments": [
    {"name": "app", "namespace": "production", "replicas": 3, "ready": 3, "available": 3}
  ],
  "services": [...],
  "summary": {
    "total_nodes": 4,
    "ready_nodes": 4,
    "total_pods": 100,
    "running_pods": 96,
    "failed_pods": 4
  }
}
```

## API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/plugins` | GET | List all loaded plugins |
| `/api/v1/plugins/detections` | GET | Recent detections from all plugins |
| `/api/v1/plugins/run-detectors` | POST | Manually trigger all detectors |
| `/api/v1/plugins/install` | POST | Install from Python source code |
| `/api/v1/plugins/enable/:name` | POST | Enable a disabled plugin |
| `/api/v1/plugins/disable/:name` | POST | Disable a plugin |
| `/api/v1/plugins/:name` | DELETE | Unload and remove a plugin |
| `/api/v1/plugins/analyze` | POST | Run a specific analyzer |
| `/api/v1/plugins/action` | POST | Run a specific action |

## Manage Plugins

```bash
# List all plugins
curl http://localhost:8080/api/v1/plugins

# Disable a plugin
curl -X POST http://localhost:8080/api/v1/plugins/disable/high-restart-detector

# Enable it back
curl -X POST http://localhost:8080/api/v1/plugins/enable/high-restart-detector

# Remove a plugin
curl -X DELETE http://localhost:8080/api/v1/plugins/my-custom-detector

# Manually run all detectors
curl -X POST http://localhost:8080/api/v1/plugins/run-detectors
```

## Safety

- Plugins run inside the AI Engine process (trusted environment)
- Dangerous imports are blocked on install (`subprocess`, `shutil`, `ctypes`)
- Plugins cannot access Kubernetes secrets directly
- Action plugins require explicit user invocation (never auto-executed)
- All plugin activity is logged

## Built-in Plugin Examples

See working code in:
```
backend/services/ai-engine/app/plugins/builtin/
├── high_restart_detector.py      — detects pods with high restart counts
├── resource_quota_detector.py    — detects degraded deployments
└── pending_pod_detector.py       — detects scheduling failures
```

## Who Should Write Plugins?

- **SRE teams** — custom rules for your specific infrastructure
- **Security teams** — compliance checks (no privileged pods, no root, etc.)
- **Community contributors** — share detectors for common patterns
- **Enterprise customers** — organization-specific policies

## Summary

| What | How |
|------|-----|
| Install Tagent | 3 built-in plugins run automatically |
| Want more detections | Write a Python file, install via API |
| Want to share plugins | Put on GitHub, others install via curl |
| Manage plugins | API calls (list, enable, disable, remove) |
