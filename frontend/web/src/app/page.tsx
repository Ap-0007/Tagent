"use client";

import { useEffect, useState } from "react";
import {
    getClusterState,
    getIncidents,
    getMetricsSummary,
    getRemediationHistory,
    type ClusterState,
    type Incident,
    type MetricsSummary,
    type RemediationResult,
} from "@/lib/api";
import { useTagentWS } from "@/lib/useWebSocket";
import { WifiOff, Loader2, Activity, AlertTriangle, Server, Shield } from "lucide-react";

export default function Dashboard() {
    const [data, setData] = useState<ClusterState | null>(null);
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [metrics, setMetrics] = useState<MetricsSummary | null>(null);
    const [remediations, setRemediations] = useState<RemediationResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    useTagentWS("incident");

    useEffect(() => {
        let interval: NodeJS.Timeout;
        async function fetchData() {
            try {
                const [state, incidentData, metricData, remHistory] = await Promise.all([
                    getClusterState().catch(() => null),
                    getIncidents().catch(() => ({ incidents: [], total: 0 })),
                    getMetricsSummary().catch(() => null),
                    getRemediationHistory().catch(() => ({ history: [], total: 0 })),
                ]);
                if (state) setData(state);
                setIncidents(incidentData.incidents || []);
                if (metricData) setMetrics(metricData);
                setRemediations(remHistory.history || []);
                setError(null);
            } catch (e: any) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
        interval = setInterval(fetchData, 15000);
        return () => clearInterval(interval);
    }, []);

    const summary = data?.summary;
    const activeIncidents = incidents.filter(i => i.status !== "resolved");
    const criticalCount = activeIncidents.filter(i => i.severity === "critical").length;
    const warningCount = activeIncidents.filter(i => i.severity === "medium" || i.severity === "high").length;

    const healthScore = summary
        ? Math.round(((summary.running_pods / (summary.total_pods || 1)) * 50) + ((summary.ready_nodes / (summary.total_nodes || 1)) * 50))
        : 0;

    return (
        <div className="flex-1 overflow-y-auto scrollbar bg-[#0d1117]">
            <div className="px-4 pt-4 pb-6 space-y-3">
                {/* Error banner */}
                {error && !loading && (
                    <div className="flex items-center gap-3 px-4 py-2.5 rounded-md bg-amber-500/5 border border-amber-500/15">
                        <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
                        <p className="text-xs text-amber-300">Backend offline — connect API Gateway for live data.</p>
                    </div>
                )}

                {/* Loading state */}
                {loading && (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-5 h-5 text-zinc-500 animate-spin mr-2" />
                        <span className="text-sm text-zinc-500">Connecting to cluster...</span>
                    </div>
                )}

                {/* KPI Row */}
                {summary && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        <KPICard label="Health Score" value={`${healthScore}`} suffix="/100" color={healthScore >= 80 ? "#3fb950" : healthScore >= 50 ? "#f0883e" : "#f85149"} badge={healthScore >= 80 ? "Healthy" : healthScore >= 50 ? "Degraded" : "Critical"} />
                        <KPICard label="Active Incidents" value={`${activeIncidents.length}`} color={criticalCount > 0 ? "#f85149" : warningCount > 0 ? "#f0883e" : "#3fb950"} badge={`${criticalCount} critical`} />
                        <KPICard label="Nodes" value={`${summary.ready_nodes}/${summary.total_nodes}`} color="#22d3ee" badge="Ready" />
                        <KPICard label="Pods" value={`${summary.running_pods}`} color="#3fb950" badge={`${summary.failed_pods} failed`} />
                        <KPICard label="Deployments" value={`${summary.total_deployments}`} color="#a371f7" badge="Total" />
                        <KPICard label="Remediations" value={`${remediations.length}`} color="#58a6ff" badge={`${remediations.filter(r => r.status === "success").length} success`} />
                    </div>
                )}

                {/* Incidents + Cluster Info */}
                {!loading && (
                    <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-3">
                        {/* Left: Cluster Overview */}
                        <div className="space-y-3">
                            {/* Pods by status */}
                            {data && (
                                <div className="rounded-[12px] border border-[#21262d] bg-[#161b22] p-4">
                                    <h3 className="text-[14px] font-semibold text-[#e6edf3] mb-3 flex items-center gap-2">
                                        <Server className="w-4 h-4 text-emerald-400" />Cluster Resources
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        <MiniStat label="Running Pods" value={summary?.running_pods || 0} color="#3fb950" />
                                        <MiniStat label="Failed Pods" value={summary?.failed_pods || 0} color="#f85149" />
                                        <MiniStat label="Services" value={summary?.total_services || 0} color="#58a6ff" />
                                        <MiniStat label="Namespaces" value={data.namespaces?.length || 0} color="#a371f7" />
                                    </div>
                                    {/* Failing pods list */}
                                    {data.pods && data.pods.filter(p => p.status !== "Running" && p.status !== "Succeeded" && p.status !== "Completed").length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-[#21262d]">
                                            <p className="text-[11px] text-[#f85149] font-semibold mb-2">Failing Pods:</p>
                                            <div className="space-y-1">
                                                {data.pods.filter(p => p.status !== "Running" && p.status !== "Succeeded" && p.status !== "Completed").slice(0, 5).map(p => (
                                                    <div key={p.name} className="flex items-center gap-2 text-[11px]">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-[#f85149]" />
                                                        <span className="text-[#e6edf3] font-mono">{p.namespace}/{p.name}</span>
                                                        <span className="text-[#f85149]">{p.status}</span>
                                                        <span className="text-[#8b949e]">({p.restarts} restarts)</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Recent Remediations */}
                            {remediations.length > 0 && (
                                <div className="rounded-[12px] border border-[#21262d] bg-[#161b22] p-4">
                                    <h3 className="text-[14px] font-semibold text-[#e6edf3] mb-3 flex items-center gap-2">
                                        <Shield className="w-4 h-4 text-blue-400" />Recent Remediations
                                    </h3>
                                    <div className="space-y-2">
                                        {remediations.slice(0, 5).map((r, i) => (
                                            <div key={i} className="flex items-center gap-3 p-2 rounded-md bg-[#0d1117] border border-[#21262d]">
                                                <span className={`w-2 h-2 rounded-full ${r.status === "success" ? "bg-emerald-400" : r.status === "failed" ? "bg-red-400" : "bg-zinc-500"}`} />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[11px] text-[#e6edf3] truncate">{r.action} → {r.target}</p>
                                                    <p className="text-[10px] text-[#8b949e]">{r.message}</p>
                                                </div>
                                                <span className={`text-[10px] ${r.status === "success" ? "text-emerald-400" : "text-red-400"}`}>{r.status}{r.dry_run ? " (dry-run)" : ""}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right: Incidents Panel */}
                        <div className="rounded-[12px] border border-[#21262d] bg-[#161b22] p-4">
                            <h3 className="text-[14px] font-semibold text-[#e6edf3] mb-3 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-400" />
                                Active Incidents ({activeIncidents.length})
                            </h3>
                            {activeIncidents.length === 0 ? (
                                <div className="text-center py-8">
                                    <Activity className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                                    <p className="text-[12px] text-emerald-400 font-medium">All Clear</p>
                                    <p className="text-[10px] text-[#8b949e] mt-1">No active incidents detected</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {activeIncidents.slice(0, 8).map(inc => (
                                        <div key={inc.id} className="p-3 rounded-lg bg-[#0d1117] border border-[#21262d] hover:border-[#30363d] transition-colors">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${inc.severity === "critical" ? "bg-red-500/10 text-red-400" : inc.severity === "high" ? "bg-orange-500/10 text-orange-400" : "bg-amber-500/10 text-amber-400"}`}>{inc.severity}</span>
                                                <span className="text-[9px] text-[#8b949e] font-mono">{inc.id}</span>
                                            </div>
                                            <p className="text-[12px] text-[#e6edf3] font-medium">{inc.title}</p>
                                            <p className="text-[10px] text-[#8b949e] mt-0.5">{inc.namespace}/{inc.service}</p>
                                            {inc.rootCause && (
                                                <p className="text-[10px] text-[#8b949e] mt-1 border-l-2 border-amber-500/40 pl-2">{inc.rootCause}</p>
                                            )}
                                            {inc.confidence && (
                                                <div className="flex items-center gap-2 mt-1.5">
                                                    <span className="text-[9px] text-[#8b949e]">Confidence</span>
                                                    <div className="flex-1 h-1 bg-[#21262d] rounded-full overflow-hidden">
                                                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${inc.confidence}%` }} />
                                                    </div>
                                                    <span className="text-[9px] text-emerald-400 font-mono">{inc.confidence}%</span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* No data state */}
                {!loading && !data && !error && (
                    <div className="text-center py-12">
                        <Server className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
                        <p className="text-sm text-zinc-400">No cluster data available</p>
                        <p className="text-[11px] text-zinc-600 mt-1">Waiting for Discovery Service to scan your cluster...</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function KPICard({ label, value, suffix, color, badge }: { label: string; value: string; suffix?: string; color: string; badge: string }) {
    return (
        <div className="rounded-[10px] border border-[#21262d] bg-[#161b22] p-3" style={{ background: `radial-gradient(circle at 85% 25%, ${color}15 0%, transparent 55%), #161b22` }}>
            <div className="flex items-center justify-between mb-1.5">
                <p className="text-[10.5px] text-[#8b949e] font-medium">{label}</p>
                <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold" style={{ background: `${color}18`, color }}>{badge}</span>
            </div>
            <div className="flex items-baseline gap-0.5">
                <span className="text-[24px] font-bold text-[#e6edf3] leading-none font-mono">{value}</span>
                {suffix && <span className="text-[12px] text-[#6e7681]">{suffix}</span>}
            </div>
        </div>
    );
}

function MiniStat({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div className="rounded-md bg-[#0d1117] border border-[#21262d] p-2.5 text-center">
            <p className="text-[9px] text-[#8b949e]">{label}</p>
            <p className="text-[18px] font-bold font-mono" style={{ color }}>{value}</p>
        </div>
    );
}
