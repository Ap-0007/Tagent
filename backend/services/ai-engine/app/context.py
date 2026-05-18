"""Context builder — fetches REAL cluster data from Discovery Service.

When Discovery Service is running, this fetches live data.
When it's not running (local dev without K8s), falls back to mock data.
"""

import os
import httpx

DISCOVERY_URL = os.getenv("DISCOVERY_URL", "http://localhost:8081")


async def fetch_cluster_context() -> str:
    """Fetch current cluster state from Discovery Service."""

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            r = await client.get(f"{DISCOVERY_URL}/resources")
            if r.status_code == 200:
                data = r.json()
                return format_live_context(data)
        except Exception as e:
            # Discovery Service not reachable — fall back to mock
            pass

    # Fallback to mock if Discovery Service is not reachable
    return MOCK_CONTEXT


def format_live_context(data: dict) -> str:
    """Format live cluster data into a readable context for the LLM."""
    lines = []
    lines.append(f"CLUSTER STATE (live scan at {data.get('scanned_at', 'unknown')}):")
    lines.append("")

    summary = data.get("summary", {})
    lines.append("SUMMARY:")
    lines.append(f"- Nodes: {summary.get('total_nodes', 0)} total, {summary.get('ready_nodes', 0)} Ready")
    lines.append(f"- Pods: {summary.get('total_pods', 0)} total, {summary.get('running_pods', 0)} Running, {summary.get('failed_pods', 0)} Failed/CrashLoop")
    lines.append(f"- Deployments: {summary.get('total_deployments', 0)}")
    lines.append(f"- Services: {summary.get('total_services', 0)}")
    lines.append(f"- Namespaces: {', '.join(data.get('namespaces', []))}")
    lines.append("")

    # Nodes
    nodes = data.get("nodes", [])
    if nodes:
        lines.append("NODES:")
        for n in nodes:
            lines.append(f"- {n['name']}: {n['status']}, role={n['role']}, CPU capacity={n['cpu_capacity']}, Memory capacity={n['memory_capacity']}, Pods={n.get('pod_count', '?')}, IP={n.get('internal_ip', '?')}")
        lines.append("")

    # Pods (show first 50 + any failing ones)
    pods = data.get("pods", [])
    failing = [p for p in pods if p["status"] not in ("Running", "Succeeded", "Completed")]
    running = [p for p in pods if p["status"] == "Running"]

    if failing:
        lines.append("FAILING PODS:")
        for p in failing:
            lines.append(f"- {p['namespace']}/{p['name']}: status={p['status']}, restarts={p['restarts']}, node={p['node']}, cpu_req={p.get('cpu_request','?')}, mem_req={p.get('memory_request','?')}")
        lines.append("")

    if running:
        lines.append(f"RUNNING PODS ({len(running)} total, showing first 30):")
        for p in running[:30]:
            lines.append(f"- {p['namespace']}/{p['name']}: restarts={p['restarts']}, node={p['node']}, cpu_req={p.get('cpu_request','?')}, mem_req={p.get('memory_request','?')}")
        lines.append("")

    # Deployments
    deps = data.get("deployments", [])
    if deps:
        lines.append("DEPLOYMENTS:")
        for d in deps:
            status = "healthy" if d["ready"] == d["replicas"] else "DEGRADED"
            lines.append(f"- {d['namespace']}/{d['name']}: {d['ready']}/{d['replicas']} ready ({status})")
        lines.append("")

    return "\n".join(lines)


MOCK_CONTEXT = """
CLUSTER STATE (mock data — Discovery Service not connected):
- This is mock data. Start the Discovery Service to get real cluster information.
- Nodes: 6 total, 5 Ready, 1 NotReady (ip-10-0-3-21 disk pressure)
- Pods: 142 total, 138 Running, 3 CrashLoopBackOff, 1 Pending
- Deployments: 24 total
- Services: 31

FAILING PODS:
- production/checkout-api-7d8f4: CrashLoopBackOff, 14 restarts, node=ip-10-0-2-8
- production/checkout-api-m4n7q: CrashLoopBackOff, 8 restarts, node=ip-10-0-1-12
- production/checkout-api-p8r2w: CrashLoopBackOff, 3 restarts, node=ip-10-0-2-8

NODES:
- ip-10-0-1-12: Ready, worker, CPU 4 cores, Memory 16Gi, 28 pods
- ip-10-0-2-8: Ready, worker, CPU 4 cores, Memory 16Gi, 34 pods
- ip-10-0-3-21: NotReady, worker, CPU 4 cores, Memory 16Gi, 0 pods (DISK PRESSURE 91%)
- ip-10-0-1-5: Ready, worker, CPU 2 cores, Memory 8Gi, 18 pods
- ip-10-0-2-14: Ready, worker, CPU 2 cores, Memory 8Gi, 14 pods
- ip-10-0-3-9: Ready, control-plane, CPU 2 cores, Memory 8Gi, 12 pods

NOTE: This is mock data. For real results, ensure Discovery Service is running.
"""
