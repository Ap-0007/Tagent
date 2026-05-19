/**
 * Tagent API Client
 * Calls the API Gateway which proxies to backend services.
 * Auto-detects API URL: same host as the browser, port 8080.
 */

function getApiBase(): string {
    if (typeof window === "undefined") {
        // Server-side rendering — use internal service name
        return process.env.NEXT_PUBLIC_API_URL || "http://tagent-api-gateway:8080";
    }
    // Browser — use same host as current page, port 8080
    return process.env.NEXT_PUBLIC_API_URL || `http://${window.location.hostname}:8080`;
}

const API_BASE = getApiBase();

export class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
        super(message);
        this.status = status;
    }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE}${path}`;
    try {
        const res = await fetch(url, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...(options?.headers || {}),
            },
            cache: "no-store",
        });
        if (!res.ok) {
            throw new ApiError(`API ${path}: ${res.statusText}`, res.status);
        }
        return res.json() as Promise<T>;
    } catch (err) {
        if (err instanceof ApiError) throw err;
        throw new ApiError(`Cannot reach API at ${url}`, 0);
    }
}

// ===== Cluster / Discovery =====

export interface ClusterSummary {
    total_nodes: number;
    ready_nodes: number;
    total_pods: number;
    running_pods: number;
    failed_pods: number;
    total_deployments: number;
    total_services: number;
}

export interface PodInfo {
    name: string;
    namespace: string;
    status: string;
    restarts: number;
    cpu_request: string;
    memory_request: string;
    cpu_used: string;
    memory_used: string;
    node: string;
    age: string;
    containers: number;
}

export interface NodeInfo {
    name: string;
    status: string;
    role: string;
    cpu_capacity: string;
    memory_capacity: string;
    pod_capacity: string;
    cpu_used: string;
    memory_used: string;
    pod_count: number;
    internal_ip: string;
    external_ip: string;
    age: string;
}

export interface ClusterState {
    scanned_at: string;
    nodes: NodeInfo[];
    pods: PodInfo[];
    deployments: any[];
    services: any[];
    namespaces: string[];
    summary: ClusterSummary;
}

export interface DeploymentInfo {
    name: string;
    namespace: string;
    replicas: number;
    ready: number;
    available: number;
    age: string;
}

export interface ServiceInfo {
    name: string;
    namespace: string;
    type: string;
    cluster_ip: string;
    ports: string;
}

export type Severity = "low" | "medium" | "high" | "critical";
export type IncidentStatus = "active" | "investigating" | "resolved";

export interface Incident {
    id: string;
    title: string;
    severity: Severity;
    status: IncidentStatus;
    service: string;
    namespace: string;
    startedAt: string;
    rootCause?: string;
    confidence?: number;
    blastRadius?: string[];
    evidence?: string[];
}

export interface IncidentListResponse {
    incidents: Incident[];
    total: number;
}

export interface MetricsSummary {
    cluster_cpu_percent: number;
    cluster_memory_percent: number;
    pod_metrics: Array<{
        pod: string;
        namespace: string;
        cpu_cores: number;
        memory_bytes: number;
    }> | null;
    node_metrics: Array<{
        node: string;
        cpu_percent: number;
        memory_percent: number;
        disk_percent: number;
    }> | null;
    alerts: Array<{
        name: string;
        severity: string;
        message: string;
        since: string;
    }> | null;
}

export interface RemediationRequest {
    action: "restart-pod" | "scale-deployment" | "rollback-deployment";
    namespace: string;
    target: string;
    dry_run: boolean;
}

export interface RemediationResult {
    action: string;
    target: string;
    status: string;
    message: string;
    timestamp: string;
    dry_run: boolean;
}

export interface RemediationHistoryResponse {
    history: RemediationResult[];
    total: number;
}

export interface ReportsResponse {
    reports: Array<{
        id?: string;
        title?: string;
        severity?: string;
        duration?: string;
        resolved_at?: string;
        content?: string;
    }>;
    total: number;
}

export interface AutoscalingSummary {
    hpas: Array<{
        name: string;
        namespace: string;
        current: number;
        desired: number;
        min: number;
        max: number;
        status: string;
        age: string;
    }>;
    vpas: any[];
    events: any[];
}

export interface CostSummary {
    monthly_spend: string;
    potential_savings: string;
    items: Array<{
        name: string;
        kind: string;
        namespace: string;
        estimate: string;
        basis: string;
    }>;
    recommendations: Array<{
        title: string;
        saving: string;
        detail: string;
    }>;
}

export interface ChaosExperiment {
    id: string;
    name: string;
    target: string;
    type: string;
    last_run: string;
    last_result: string;
    description: string;
}

export interface ChaosExperimentsResponse {
    experiments: ChaosExperiment[];
    total: number;
}

export interface ChaosRun {
    id: string;
    status: string;
    message: string;
    timestamp: string;
}

export interface NightGuardianConfig {
    enabled: boolean;
    auto_fix: boolean;
    confidence: number;
    interval_seconds: number;
    min_restarts: number;
    protected_namespace: string;
}

export interface NightGuardianReport {
    id: string;
    incident_id: string;
    title: string;
    namespace: string;
    target: string;
    detected_status: string;
    confidence: number;
    action: string;
    result: RemediationResult;
    recommendation: string;
    created_at: string;
    dry_run: boolean;
    evidence: string[];
}

export interface NightGuardianRun {
    started_at: string;
    finished_at: string;
    findings: number;
    fixed: number;
    reports: NightGuardianReport[];
}

export interface NightGuardianStatus {
    config: NightGuardianConfig;
    latest_run: NightGuardianRun;
    run_count: number;
    report_count: number;
    mode: string;
}

export interface NightGuardianReportsResponse {
    reports: NightGuardianReport[];
    total: number;
}

export async function getClusterState(): Promise<ClusterState> {
    return request<ClusterState>("/api/v1/resources");
}

export async function getClusterSummary(): Promise<ClusterSummary> {
    return request<ClusterSummary>("/api/v1/clusters");
}

export async function getPods(namespace?: string): Promise<PodInfo[]> {
    const path = namespace ? `/api/v1/pods?namespace=${namespace}` : "/api/v1/pods";
    return request<PodInfo[]>(path);
}

export async function getNodes(): Promise<NodeInfo[]> {
    return request<NodeInfo[]>("/api/v1/nodes");
}

export async function getDeployments(): Promise<DeploymentInfo[]> {
    return request<DeploymentInfo[]>("/api/v1/deployments");
}

export async function getServices(): Promise<ServiceInfo[]> {
    return request<ServiceInfo[]>("/api/v1/services");
}

// ===== Incidents =====

export async function getIncidents(): Promise<IncidentListResponse> {
    return request<IncidentListResponse>("/api/v1/incidents");
}

export async function getIncident(id: string): Promise<Incident> {
    return request<Incident>(`/api/v1/incidents/${encodeURIComponent(id)}`);
}

// ===== Metrics / Monitoring =====

export async function getMetricsSummary(): Promise<MetricsSummary> {
    return request<MetricsSummary>("/api/v1/metrics/summary");
}

// ===== Remediation =====

export async function executeRemediation(payload: RemediationRequest): Promise<RemediationResult> {
    return request<RemediationResult>("/api/v1/remediation/execute", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function getRemediationHistory(): Promise<RemediationHistoryResponse> {
    return request<RemediationHistoryResponse>("/api/v1/remediation/history");
}

// ===== Reports =====

export async function getReports(): Promise<ReportsResponse> {
    return request<ReportsResponse>("/api/v1/reports");
}

// ===== Autoscaling / Cost / Chaos =====

export async function getAutoscaling(): Promise<AutoscalingSummary> {
    return request<AutoscalingSummary>("/api/v1/autoscaling");
}

export async function getCostSummary(): Promise<CostSummary> {
    return request<CostSummary>("/api/v1/cost/summary");
}

export async function getChaosExperiments(): Promise<ChaosExperimentsResponse> {
    return request<ChaosExperimentsResponse>("/api/v1/chaos/experiments");
}

export async function runChaosExperiment(id: string): Promise<ChaosRun> {
    return request<ChaosRun>(`/api/v1/chaos/experiments/${encodeURIComponent(id)}/run`, {
        method: "POST",
        body: JSON.stringify({}),
    });
}

// ===== Night Guardian =====

export async function getNightGuardianStatus(): Promise<NightGuardianStatus> {
    return request<NightGuardianStatus>("/api/v1/night-guardian/status");
}

export async function updateNightGuardianConfig(config: NightGuardianConfig): Promise<NightGuardianConfig> {
    return request<NightGuardianConfig>("/api/v1/night-guardian/config", {
        method: "PUT",
        body: JSON.stringify(config),
    });
}

export async function runNightGuardianNow(): Promise<NightGuardianRun> {
    return request<NightGuardianRun>("/api/v1/night-guardian/run", {
        method: "POST",
        body: JSON.stringify({}),
    });
}

export async function getNightGuardianReports(): Promise<NightGuardianReportsResponse> {
    return request<NightGuardianReportsResponse>("/api/v1/night-guardian/reports");
}

// ===== AI Chat =====

export interface ChatResponse {
    response: string;
    model: string;
    context_source: string;
}

export async function sendChat(message: string): Promise<ChatResponse> {
    return request<ChatResponse>("/api/v1/ai/chat", {
        method: "POST",
        body: JSON.stringify({ message }),
    });
}

// ===== Health =====

export interface HealthResponse {
    status: string;
    service: string;
    version: string;
}

export async function getHealth(): Promise<HealthResponse> {
    return request<HealthResponse>("/health");
}
