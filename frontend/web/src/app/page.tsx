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
} from "@/lib/api";
import { useTagentWS } from "@/lib/useWebSocket";
import { DashboardKPIs } from "@/components/dashboard/DashboardKPIs";
import { KubernetesTopology } from "@/components/dashboard/KubernetesTopology";
import { IncidentAnalysisPanel } from "@/components/dashboard/IncidentAnalysisPanel";
import { OperationsFeed } from "@/components/dashboard/OperationsFeed";
import { WifiOff } from "lucide-react";

const DEMO_SUMMARY = {
    total_nodes: 4, ready_nodes: 4,
    total_pods: 100, running_pods: 96, failed_pods: 4,
    total_deployments: 14, total_services: 248,
};

const DEMO_INCIDENTS: Incident[] = [
    {
        id: "INC-48291", title: "High Error Rate in Payment Service", severity: "critical", status: "active",
        service: "payment-service", namespace: "production",
        startedAt: new Date(Date.now() - 7 * 60 * 1000).toISOString(),
        rootCause: "Connection pool exhaustion in PostgreSQL caused by slow queries after recent deployment.",
        confidence: 96,
    },
    {
        id: "INC-48290", title: "Memory pressure on analytics pods", severity: "medium", status: "investigating",
        service: "analytics", namespace: "production",
        startedAt: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
        confidence: 88,
    },
    {
        id: "INC-48289", title: "Elevated latency on order-service", severity: "high", status: "active",
        service: "order-service", namespace: "production",
        startedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        confidence: 91,
    },
];

export default function Dashboard() {
    const [data, setData] = useState<ClusterState | null>(null);
    const [incidents, setIncidents] = useState<Incident[]>([]);
    useTagentWS("incident");
    const [, setMetrics] = useState<MetricsSummary | null>(null);
    const [remediationCount, setRemediationCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
                if (incidentData.incidents?.length) setIncidents(incidentData.incidents);
                if (metricData) setMetrics(metricData);
                setRemediationCount(remHistory.total || remHistory.history?.length || 0);
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

    const summary = data?.summary || DEMO_SUMMARY;
    const displayIncidents = incidents.length > 0 ? incidents : DEMO_INCIDENTS;
    const activeIncidents = displayIncidents.filter(i => i.status !== "resolved");
    const criticalCount = activeIncidents.filter(i => i.severity === "critical").length;
    const warningCount = activeIncidents.filter(i => i.severity === "medium" || i.severity === "high").length;

    const healthScore = Math.round(
        ((summary.running_pods / (summary.total_pods || 1)) * 50) +
        ((summary.ready_nodes / (summary.total_nodes || 1)) * 50)
    );

    const totalRemediation = remediationCount || 18;

    return (
        <div className="flex-1 overflow-y-auto wi-scrollbar bg-[#0d1117]">
            <style jsx global>{`
                .wi-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
                .wi-scrollbar::-webkit-scrollbar-track { background: #161b22; }
                .wi-scrollbar::-webkit-scrollbar-thumb { background: #30363d; border-radius: 3px; }
                .wi-scrollbar::-webkit-scrollbar-thumb:hover { background: #484f58; }
                @keyframes wi-dash { to { stroke-dashoffset: -24; } }
                .wi-flow-high { stroke-dasharray: 8 4; animation: wi-dash 0.8s linear infinite; }
                .wi-flow-medium { stroke-dasharray: 6 4; animation: wi-dash 1.2s linear infinite; }
                .wi-flow-low { stroke-dasharray: 4 4; animation: wi-dash 1.8s linear infinite; }
                @keyframes wi-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
            `}</style>

            <div className="px-4 pt-4 pb-6 space-y-3 relative">
                {/* Error banner only - no loading overlay */}
                {error && !loading && (
                    <div className="flex items-center gap-3 px-4 py-2.5 rounded-md bg-amber-500/5 border border-amber-500/15">
                        <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
                        <p className="text-xs text-amber-300">Backend offline — showing demo data. Start API Gateway for live telemetry.</p>
                    </div>
                )}

                {/* KPI Row */}
                <DashboardKPIs
                    healthScore={healthScore}
                    activeIncidents={activeIncidents.length}
                    criticalCount={criticalCount}
                    warningCount={warningCount}
                    services={summary.total_services}
                    remediations={totalRemediation}
                />

                {/* Topology + Incident Analysis */}
                <div className="grid grid-cols-1 xl:grid-cols-[1fr_440px] gap-3">
                    <KubernetesTopology />
                    <IncidentAnalysisPanel />
                </div>

                {/* Operations Feed */}
                <OperationsFeed />
            </div>
        </div>
    );
}
