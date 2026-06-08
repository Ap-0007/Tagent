/**
 * Tagent API Client
 * Uses Next.js API proxy — browser calls /api/proxy/... on same origin.
 * No CORS, no localhost issues, no port-forward for API Gateway needed.
 */

const API_PREFIX = "/api/proxy";

export class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
        super(message);
        this.status = status;
    }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
    // Convert /api/v1/resources → /api/proxy/resources
    const proxyPath = path.replace("/api/v1/", "");
    const url = `${API_PREFIX}/${proxyPath}`;
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
    return request<HealthResponse>("/api/v1/health");
}

// ===== Integrations =====

export interface IntegrationInfo {
    id: string;
    name: string;
    status: string;
    last_sync: string;
    last_sync_at: string;
    setup_type: string;
    health: string;
    env_vars: string[];
    configured: boolean;
}

export interface IntegrationsListResponse {
    integrations: IntegrationInfo[];
    total: number;
    connected: number;
}

export interface IntegrationHealthResponse {
    total_integrations: number;
    healthy: number;
    unhealthy: number;
    overall_health: number;
}

export interface IntegrationTestResponse {
    id: string;
    status: string;
    message: string;
    health: string;
}

export async function getIntegrations(): Promise<IntegrationsListResponse> {
    return request<IntegrationsListResponse>("/api/v1/integrations");
}

export async function getIntegration(id: string): Promise<IntegrationInfo> {
    return request<IntegrationInfo>(`/api/v1/integrations/${encodeURIComponent(id)}`);
}

export async function getIntegrationsHealth(): Promise<IntegrationHealthResponse> {
    return request<IntegrationHealthResponse>("/api/v1/integrations/health");
}

export async function testIntegration(id: string): Promise<IntegrationTestResponse> {
    return request<IntegrationTestResponse>(`/api/v1/integrations/${encodeURIComponent(id)}/test`, {
        method: "POST",
        body: JSON.stringify({}),
    });
}

// ===== Integration Configuration (K8s Secrets) =====

export interface IntegrationFieldDef {
    key: string;
    label: string;
    placeholder: string;
    required: boolean;
    secret: boolean;
}

export interface IntegrationConfigDef {
    id: string;
    name: string;
    setup_type: string;
    fields: IntegrationFieldDef[];
}

export interface IntegrationConfigResponse {
    integration: IntegrationConfigDef;
    saved: Record<string, string>;
    configured: boolean;
}

export async function getIntegrationConfig(id: string): Promise<IntegrationConfigResponse> {
    return request<IntegrationConfigResponse>(`/api/v1/integrations/config/${encodeURIComponent(id)}`);
}

export async function saveIntegrationConfig(id: string, credentials: Record<string, string>): Promise<{ status: string; message: string }> {
    return request<{ status: string; message: string }>(`/api/v1/integrations/config/${encodeURIComponent(id)}`, {
        method: "POST",
        body: JSON.stringify(credentials),
    });
}

export async function deleteIntegrationConfig(id: string): Promise<{ status: string }> {
    return request<{ status: string }>(`/api/v1/integrations/config/${encodeURIComponent(id)}`, {
        method: "DELETE",
    });
}

// ===== Auth & User Management =====

export interface AdminInfo {
    id: string;
    name: string;
    email: string;
    phone: string;
    company: string;
    role: string;
    cluster_name: string;
}

export interface UserInfo {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    permissions: string[];
    token: string;
    created_at: string;
    last_access: string | null;
}

export interface UsersListResponse {
    users: UserInfo[];
    total: number;
}

export async function getAuthStatus(): Promise<{ setup_complete: boolean }> {
    return request<{ setup_complete: boolean }>("/api/v1/auth/status");
}

export async function getAdminInfo(): Promise<AdminInfo> {
    return request<AdminInfo>("/api/v1/auth/admin");
}

export async function setupAdmin(data: { name: string; email: string; phone: string; company: string; role: string; cluster_name: string }): Promise<{ status: string; id: string }> {
    return request<{ status: string; id: string }>("/api/v1/auth/setup", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function getUsers(): Promise<UsersListResponse> {
    return request<UsersListResponse>("/api/v1/users");
}

export async function createUser(data: { name: string; email: string; phone: string; role: string; permissions: string[] }): Promise<{ status: string; id: string; token: string; access_link: string }> {
    return request<{ status: string; id: string; token: string; access_link: string }>("/api/v1/users", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function deleteUser(id: string): Promise<{ status: string }> {
    return request<{ status: string }>(`/api/v1/users/${encodeURIComponent(id)}`, {
        method: "DELETE",
    });
}

export async function verifyUserToken(token: string): Promise<{ valid: boolean; user: { id: string; name: string; email: string; role: string }; company: string }> {
    return request<{ valid: boolean; user: { id: string; name: string; email: string; role: string }; company: string }>(`/api/v1/auth/verify/${encodeURIComponent(token)}`);
}

// ===== Knowledge Base =====

export interface KnowledgeEntry {
    id: string;
    title: string;
    category: string;
    description: string;
    root_cause: string;
    fix_action: string;
    severity: string;
    service: string;
    namespace: string;
    occurrence_count: number;
    success_rate: number;
    last_seen_at: string;
    first_seen_at: string;
    tags: string[];
    metadata: Record<string, any>;
    similarity?: number;
}

export interface KnowledgeListResponse {
    entries: KnowledgeEntry[];
    total: number;
}

export interface KnowledgeSearchResponse {
    results: KnowledgeEntry[];
    query: string;
    model: string;
}

export interface KnowledgeStatsResponse {
    total_entries: number;
    categories: Record<string, number>;
    top_services: Array<{ service: string; entries: number; total_occurrences: number }>;
}

export interface KnowledgeRecommendation {
    action: string;
    target: string;
    confidence: number;
    reasoning: string;
    risk: string;
    similar_incidents?: number;
    knowledge_base_match?: string | null;
}

export interface KnowledgeRecommendResponse {
    recommendations: KnowledgeRecommendation[];
    query: string;
    model: string;
}

export async function getKnowledgeEntries(category?: string): Promise<KnowledgeListResponse> {
    const path = category
        ? `/api/v1/knowledge/entries?category=${encodeURIComponent(category)}`
        : "/api/v1/knowledge/entries";
    return request<KnowledgeListResponse>(path);
}

export async function getKnowledgeStats(): Promise<KnowledgeStatsResponse> {
    return request<KnowledgeStatsResponse>("/api/v1/knowledge/stats");
}

export async function searchKnowledge(query: string, limit?: number): Promise<KnowledgeSearchResponse> {
    return request<KnowledgeSearchResponse>("/api/v1/knowledge/search", {
        method: "POST",
        body: JSON.stringify({ query, limit: limit || 5, threshold: 0.4 }),
    });
}

export async function ingestKnowledge(entry: {
    title: string;
    category: string;
    description: string;
    root_cause: string;
    fix_action: string;
    severity: string;
    service: string;
    namespace: string;
    tags?: string[];
}): Promise<{ status: string; id: string }> {
    return request<{ status: string; id: string }>("/api/v1/knowledge/ingest", {
        method: "POST",
        body: JSON.stringify(entry),
    });
}

export async function autoIngestKnowledge(): Promise<{ status: string; ingested: number; errors: string[] }> {
    return request<{ status: string; ingested: number; errors: string[] }>("/api/v1/knowledge/auto-ingest", {
        method: "POST",
        body: JSON.stringify({}),
    });
}

export async function getKnowledgeRecommendations(query: string, service?: string, namespace?: string): Promise<KnowledgeRecommendResponse> {
    return request<KnowledgeRecommendResponse>("/api/v1/knowledge/recommend", {
        method: "POST",
        body: JSON.stringify({ query, service, namespace }),
    });
}

export async function submitKnowledgeFeedback(entryId: string, success: boolean): Promise<{ status: string }> {
    return request<{ status: string }>("/api/v1/knowledge/feedback", {
        method: "PUT",
        body: JSON.stringify({ entry_id: entryId, success }),
    });
}

// ===== Risk Scoring =====

export interface ServiceRisk {
    service: string;
    namespace: string;
    risk_score: number;
    risk_level: string;
    factors: Array<{ type: string; detail: string; weight: number }>;
    prediction: string;
    recommended_action: string;
}

export interface RiskScoresResponse {
    services: ServiceRisk[];
    total: number;
    calculated_at: string;
}

export interface RiskSummaryResponse {
    overall_score: number;
    overall_level: string;
    total_services_at_risk: number;
    critical_count: number;
    high_count: number;
    medium_count: number;
    low_count: number;
    prevented_incidents: number;
    ai_confidence: number;
    categories: Record<string, number>;
    top_risks: Array<{ service: string; namespace: string; score: number; level: string; top_factor: string }>;
    trend: string;
}

export interface RiskPrediction {
    service: string;
    namespace: string;
    predicted_issue: string;
    probability: number;
    time_horizon: string;
    evidence: string[];
    preventive_action: string;
}

export interface RiskPredictionsResponse {
    predictions: RiskPrediction[];
    total: number;
}

export interface RiskAnalysisResponse {
    service: string;
    analysis: {
        risk_score: number;
        risk_level: string;
        summary: string;
        factors: Array<{ category: string; detail: string; weight: number }>;
        prediction: string;
        time_to_failure?: string;
        recommended_actions: Array<{ action: string; priority: string; impact: string }>;
        dependencies_at_risk?: string[];
    };
    model: string;
}

export async function getRiskScores(): Promise<RiskScoresResponse> {
    return request<RiskScoresResponse>("/api/v1/risks/scores");
}

export async function getRiskSummary(): Promise<RiskSummaryResponse> {
    return request<RiskSummaryResponse>("/api/v1/risks/summary");
}

export async function getRiskPredictions(): Promise<RiskPredictionsResponse> {
    return request<RiskPredictionsResponse>("/api/v1/risks/predictions");
}

export async function analyzeServiceRisk(service: string, namespace?: string): Promise<RiskAnalysisResponse> {
    return request<RiskAnalysisResponse>("/api/v1/risks/analyze", {
        method: "POST",
        body: JSON.stringify({ service, namespace }),
    });
}
