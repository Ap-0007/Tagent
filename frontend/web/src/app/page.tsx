"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
    getClusterState,
    getIncidents,
    getMetricsSummary,
    type ClusterState,
    type Incident,
    type MetricsSummary,
} from "@/lib/api";
import { useTagentWS } from "@/lib/useWebSocket";
import { timeAgo } from "@/lib/utils";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { Box, Activity, Server, Loader2, WifiOff, Radio } from "lucide-react";

export default function Dashboard() {
    const [data, setData] = useState<ClusterState | null>(null);
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const { events: wsEvents, connected: wsConnected } = useTagentWS("incident");
    const [metrics, setMetrics] = useState<MetricsSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        async function fetchData() {
            try {
                const [state, incidentData, metricData] = await Promise.all([
                    getClusterState(),
                    getIncidents(),
                    getMetricsSummary().catch(() => null),
                ]);
                setData(state);
                setIncidents(incidentData.incidents || []);
                setMetrics(metricData);
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
    const unhealthy = summary ? summary.total_pods - summary.running_pods : 0;
    const active = incidents.filter((i) => i.status !== "resolved");
    const utilization = metrics ? [{
        time: "now",
        cpu: Number(metrics.cluster_cpu_percent || 0),
        mem: Number(metrics.cluster_memory_percent || 0),
    }] : [];

    return (
        <div className="flex-1 overflow-y-auto scrollbar">
            <header className="px-6 py-5 border-b border-zinc-800/60">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-zinc-100">Dashboard</h1>
                        <p className="text-sm text-zinc-500 mt-0.5">
                            {data ? `Live data - scanned ${new Date(data.scanned_at).toLocaleTimeString()}` : "Waiting for backend services"}
                        </p>
                    </div>
                    {error && (
                        <span className="flex items-center gap-1.5 text-[11px] text-amber-400 font-mono">
                            <WifiOff className="w-3 h-3" />Backend offline
                        </span>
                    )}
                    {wsConnected && (
                        <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono">
                            <Radio className="w-3 h-3" />Live
                        </span>
                    )}
                    {loading && <Loader2 className="w-4 h-4 text-zinc-500 animate-spin" />}
                </div>
            </header>

            <div className="px-6 py-5 space-y-5">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <Stat label="Pods" value={summary ? `${summary.running_pods}/${summary.total_pods}` : "-"} sub={summary ? unhealthy > 0 ? `${unhealthy} unhealthy` : "all healthy" : "waiting for discovery"} icon={Box} tone={unhealthy > 0 ? "warn" : undefined} />
                    <Stat label="Deployments" value={summary?.total_deployments ?? "-"} sub={data ? `${data.namespaces?.length || 0} namespaces` : "waiting for discovery"} icon={Activity} />
                    <Stat label="Services" value={summary?.total_services ?? "-"} icon={Server} />
                    <Stat label="Nodes" value={summary ? `${summary.ready_nodes}/${summary.total_nodes}` : "-"} sub={summary ? summary.ready_nodes < summary.total_nodes ? `${summary.total_nodes - summary.ready_nodes} not ready` : "all ready" : "waiting for discovery"} icon={Server} tone={summary && summary.ready_nodes < summary.total_nodes ? "crit" : undefined} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-lg">
                        <div className="px-5 py-3 border-b border-zinc-800 flex items-center justify-between">
                            <div>
                                <h2 className="text-sm font-medium text-zinc-200">Cluster Utilization</h2>
                                <p className="text-[11px] text-zinc-500">CPU & memory from Monitoring Service</p>
                            </div>
                            <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />live
                            </span>
                        </div>
                        <div className="p-4">
                            <ResponsiveContainer width="100%" height={200}>
                                <AreaChart data={utilization} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="gc" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#22c55e" stopOpacity={0.15} /><stop offset="100%" stopColor="#22c55e" stopOpacity={0} /></linearGradient>
                                        <linearGradient id="gm" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity={0.12} /><stop offset="100%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient>
                                    </defs>
                                    <XAxis dataKey="time" tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                                    <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 6, fontSize: 11 }} />
                                    <Area type="monotone" dataKey="cpu" stroke="#22c55e" strokeWidth={1.5} fill="url(#gc)" dot={false} name="CPU" />
                                    <Area type="monotone" dataKey="mem" stroke="#3b82f6" strokeWidth={1.5} fill="url(#gm)" dot={false} name="Memory" />
                                </AreaChart>
                            </ResponsiveContainer>
                            {utilization.length === 0 && (
                                <p className="mt-3 text-center text-[12px] text-zinc-500">Monitoring Service is not returning metrics yet.</p>
                            )}
                        </div>
                    </div>

                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg flex flex-col">
                        <div className="px-5 py-3 border-b border-zinc-800 flex items-center justify-between">
                            <h2 className="text-sm font-medium text-zinc-200">Active Incidents</h2>
                            <Link href="/incidents" className="text-[11px] text-emerald-400 hover:underline">View all</Link>
                        </div>
                        <div className="flex-1 divide-y divide-zinc-800/60">
                            {active.length === 0 ? (
                                <div className="px-5 py-8 text-center text-[12px] text-zinc-500">No active incidents from live cluster data.</div>
                            ) : active.map((i) => (
                                <Link key={i.id} href={`/incidents/${i.id}`} className="block px-5 py-3 hover:bg-zinc-800/30 transition-colors">
                                    <div className="flex items-center justify-between mb-1">
                                        <SevBadge s={i.severity} />
                                        <span className="text-[10px] text-zinc-500 font-mono">{timeAgo(i.startedAt)}</span>
                                    </div>
                                    <p className="text-[13px] text-zinc-200 font-medium truncate">{i.title}</p>
                                    <p className="text-[11px] text-zinc-500 font-mono mt-0.5">{i.namespace}/{i.service}</p>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>

                {data && data.pods && data.pods.filter(p => p.status !== "Running" && p.status !== "Succeeded").length > 0 && (
                    <div className="bg-zinc-900/50 border border-red-500/20 rounded-lg">
                        <div className="px-5 py-3 border-b border-zinc-800">
                            <h2 className="text-sm font-medium text-red-400">Failing Pods (Live)</h2>
                        </div>
                        <div className="divide-y divide-zinc-800/50">
                            {data.pods.filter(p => p.status !== "Running" && p.status !== "Succeeded").slice(0, 10).map((p) => (
                                <div key={`${p.namespace}/${p.name}`} className="px-5 py-2.5 flex items-center justify-between text-[12px] font-mono">
                                    <span className="text-zinc-200 truncate max-w-[300px]">{p.namespace}/{p.name}</span>
                                    <div className="flex items-center gap-3">
                                        <span className="text-red-400">{p.status}</span>
                                        <span className="text-zinc-500">restarts: {p.restarts}</span>
                                        <span className="text-zinc-500">{p.node}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function Stat({ label, value, sub, icon: Icon, tone }: { label: string; value: string | number; sub?: string; icon: any; tone?: string | boolean }) {
    return (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-zinc-400">{label}</span>
                <Icon className="w-4 h-4 text-zinc-600" />
            </div>
            <p className={`text-2xl font-semibold font-mono ${tone === "warn" ? "text-amber-400" : tone === "crit" ? "text-red-400" : "text-zinc-100"}`}>{value}</p>
            {sub && <p className="text-[11px] text-zinc-500 mt-1">{sub}</p>}
        </div>
    );
}

function SevBadge({ s }: { s: string }) {
    const c = s === "critical" ? "bg-red-500/10 text-red-400 border-red-500/20" : s === "high" ? "bg-orange-500/10 text-orange-400 border-orange-500/20" : s === "medium" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20";
    return <span className={`px-1.5 py-0.5 text-[10px] font-medium border rounded ${c}`}>{s}</span>;
}
