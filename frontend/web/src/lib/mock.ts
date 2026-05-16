export type Severity = "low" | "medium" | "high" | "critical";
export type Status = "active" | "investigating" | "resolved";

export interface Incident {
    id: string;
    title: string;
    severity: Severity;
    status: Status;
    service: string;
    namespace: string;
    startedAt: string;
    rootCause?: string;
    confidence?: number;
    blastRadius?: string[];
}

export interface ClusterStats {
    pods: number;
    healthy: number;
    deployments: number;
    services: number;
    nodes: number;
}

export const cluster: ClusterStats = {
    pods: 142, healthy: 138, deployments: 24, services: 31, nodes: 6,
};

export const incidents: Incident[] = [
    { id: "INC-0142", title: "checkout-api CrashLoopBackOff", severity: "high", status: "active", service: "checkout-api", namespace: "production", startedAt: new Date(Date.now() - 4 * 60000).toISOString(), rootCause: "DB connection pool exhausted", confidence: 0.87, blastRadius: ["checkout-api", "payment-service", "orders-api"] },
    { id: "INC-0141", title: "Elevated p99 latency on payment-service", severity: "medium", status: "investigating", service: "payment-service", namespace: "production", startedAt: new Date(Date.now() - 22 * 60000).toISOString(), rootCause: "Memory pressure from recent deploy", confidence: 0.72, blastRadius: ["payment-service", "checkout-api"] },
    { id: "INC-0140", title: "Node ip-10-0-3-21 NotReady", severity: "critical", status: "resolved", service: "infrastructure", namespace: "kube-system", startedAt: new Date(Date.now() - 3 * 3600000).toISOString(), rootCause: "Disk pressure from log accumulation", confidence: 0.94, blastRadius: ["12 pods rescheduled"] },
];

export const metrics = Array.from({ length: 24 }, (_, i) => ({
    hour: `${String(i).padStart(2, "0")}:00`,
    cpu: Math.floor(35 + Math.random() * 35),
    mem: Math.floor(45 + Math.random() * 30),
}));
