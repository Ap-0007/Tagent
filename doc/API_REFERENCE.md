# Tagent API Reference

Base URL: `http://localhost:8080` (API Gateway)

All endpoints are prefixed with `/api/v1/`.

---

## Health & Metrics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | API Gateway health check |
| GET | `/ready` | Readiness probe |
| GET | `/metrics` | Prometheus metrics |
| GET | `/ws` | WebSocket connection (real-time updates) |

---

## Cluster / Discovery

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/clusters` | Cluster summary (nodes, pods, deployments count) |
| GET | `/api/v1/resources` | Full cluster state (all resources) |
| GET | `/api/v1/nodes` | List all nodes |
| GET | `/api/v1/pods?namespace=X` | List pods (optional namespace filter) |
| GET | `/api/v1/deployments` | List deployments |
| GET | `/api/v1/services` | List services |
| POST | `/api/v1/scan` | Trigger manual cluster scan |
| GET | `/api/v1/autoscaling` | HPA/VPA data |
| GET | `/api/v1/cost/summary` | Cost estimation based on resources |
| GET | `/api/v1/logs?pod=X&namespace=Y` | Pod logs or K8s events |

---

## Incidents

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/incidents` | List all active incidents (from Monitoring detector) |
| GET | `/api/v1/incidents/:id` | Get incident detail (searches monitoring + remediation DB) |
| GET | `/api/v1/incidents/stored` | List incidents from PostgreSQL |

---

## AI Engine

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/ai/chat` | Chat with AI (body: `{"message":"..."}`) |
| POST | `/api/v1/ai/rca` | Root cause analysis (body: `{"incident_id":"..."}`) |
| POST | `/api/v1/ai/analyze` | Incident correlation analysis |

---

## Morning Briefing

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/briefing/latest` | Get latest morning briefing |
| POST | `/api/v1/briefing/generate` | Generate a new briefing |
| GET | `/api/v1/briefing/history` | Past briefings |

---

## Knowledge Base

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/knowledge/entries?category=X` | List knowledge entries |
| GET | `/api/v1/knowledge/stats` | Knowledge base statistics |
| POST | `/api/v1/knowledge/search` | Semantic similarity search (body: `{"query":"...", "limit":5}`) |
| POST | `/api/v1/knowledge/ingest` | Manually add an entry |
| POST | `/api/v1/knowledge/auto-ingest` | Auto-populate from live incidents |
| POST | `/api/v1/knowledge/recommend` | AI fix recommendations |
| PUT | `/api/v1/knowledge/feedback` | Update fix success rate |

---

## Risk Scoring

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/risks/scores` | All service risk scores |
| GET | `/api/v1/risks/summary` | Overall risk dashboard stats |
| GET | `/api/v1/risks/predictions` | AI-predicted future failures |
| POST | `/api/v1/risks/analyze` | Deep AI analysis for a service |

---

## Predictive Detection

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/predictive/predictions` | Current failure predictions |
| GET | `/api/v1/predictive/stats` | Predictive model stats |
| POST | `/api/v1/predictive/explain` | AI explanation of a prediction |
| POST | `/api/v1/predictive/collect` | Trigger manual data collection |

---

## Plugin SDK

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/plugins` | List all loaded plugins |
| GET | `/api/v1/plugins/detections` | Recent detections from plugins |
| POST | `/api/v1/plugins/run-detectors` | Manually trigger detectors |
| POST | `/api/v1/plugins/install` | Install plugin from source code |
| POST | `/api/v1/plugins/enable/:name` | Enable a plugin |
| POST | `/api/v1/plugins/disable/:name` | Disable a plugin |
| DELETE | `/api/v1/plugins/:name` | Unload a plugin |
| POST | `/api/v1/plugins/analyze` | Run an analyzer plugin |
| POST | `/api/v1/plugins/action` | Run an action plugin |

---

## Remediation

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/remediation/execute` | Execute action (body: `{"action":"restart-pod","namespace":"...","target":"...","dry_run":false}`) |
| GET | `/api/v1/remediation/history` | Remediation action history |
| GET | `/api/v1/remediation/audit` | Audit log |

---

## Night Guardian

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/night-guardian/status` | Guardian config + latest run |
| PUT | `/api/v1/night-guardian/config` | Update guardian configuration |
| POST | `/api/v1/night-guardian/run` | Trigger manual guardian scan |
| GET | `/api/v1/night-guardian/reports` | Guardian reports |
| POST | `/api/v1/guardian/enable` | Enable guardian |
| POST | `/api/v1/guardian/disable` | Disable guardian |

---

## Chaos Testing

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/chaos/experiments` | List available experiments |
| POST | `/api/v1/chaos/experiments/:id/run` | Run an experiment (dry-run) |

---

## Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/reports` | List generated reports |
| GET | `/api/v1/reports/:id` | Get full report (markdown) |
| GET | `/api/v1/reports/:id/pdf` | Get report as PDF-ready HTML |
| POST | `/api/v1/reports/generate` | Generate report for an incident |
| POST | `/api/v1/reports/generate-all` | Generate for all incidents |

---

## Escalation Chain

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/escalation/config` | Get escalation configuration |
| PUT | `/api/v1/escalation/config` | Update escalation config |
| POST | `/api/v1/escalation/trigger` | Start escalation for an incident |
| POST | `/api/v1/escalation/acknowledge` | Acknowledge (stops escalation) |
| GET | `/api/v1/escalation/active` | List active escalations |
| GET | `/api/v1/escalation/history` | Escalation history |

---

## Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/notify` | Send notification (body: `{"channel":"slack","title":"...","message":"..."}`) |
| POST | `/api/v1/notify/test/slack` | Test Slack |
| POST | `/api/v1/notify/test/email` | Test Email |

---

## Integrations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/integrations` | List all integrations with status |
| GET | `/api/v1/integrations/health` | Integration health summary |
| GET | `/api/v1/integrations/:id` | Get specific integration |
| POST | `/api/v1/integrations/:id/test` | Test integration connection |
| GET | `/api/v1/integrations/config/:id` | Get integration config |
| POST | `/api/v1/integrations/config/:id` | Save credentials |
| DELETE | `/api/v1/integrations/config/:id` | Delete credentials |

---

## Multi-Cluster Fleet

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/fleet/clusters` | List all clusters with live health |
| GET | `/api/v1/fleet/summary` | Aggregated fleet stats |
| POST | `/api/v1/fleet/clusters` | Register a new cluster |
| DELETE | `/api/v1/fleet/clusters/:id` | Remove a cluster |

---

## Auth & Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/auth/status` | Check if setup is complete |
| POST | `/api/v1/auth/setup` | First-time admin registration |
| GET | `/api/v1/auth/admin` | Get admin info |
| GET | `/api/v1/auth/verify/:token` | Verify user access token |
| GET | `/api/v1/users` | List all users |
| POST | `/api/v1/users` | Create user |
| DELETE | `/api/v1/users/:id` | Delete user |

---

## Sessions & Cache

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/sessions` | Create session |
| GET | `/api/v1/sessions/:id` | Get session |
| DELETE | `/api/v1/sessions/:id` | Delete session |
| GET | `/api/v1/cache/stats` | Redis cache statistics |

---

## Events

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/events/recent` | Recent Kafka events (for UI feed) |

---

## Total: 80+ API endpoints
