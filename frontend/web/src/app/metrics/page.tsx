"use client";

import { useEffect, useState } from "react";
import { getMetricsSummary, type MetricsSummary } from "@/lib/api";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { Loader2, WifiOff } from "lucide-react";

export default function MetricsPage() {
    const [metrics, setMetrics] = useState<MetricsSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        async function fetchData() {
            try {
                const data = await getMetricsSummary();
                setMetrics(data);
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

    const chartData = metrics ? [{
        time: "now",
        cpu: Number(metrics.cluster_cpu_percent || 0),
        mem: Number(metrics.cluster_memory_percent || 0),
    }] : [];

    return (
        <div className="flex-1 overflow-y-auto scrollbar">
            <header className="px-6 py-5 border-b border-zinc-800/60">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-zinc-100">Metrics</h1>
                        <p className="text-sm text-zinc-500 mt-0.5">Cluster resource utilization from Prometheus</p>
                    </div>
                    {loading && <Loader2 className="w-4 h-4 text-zinc-500 animate-spin" />}
                    {error && <span className="flex items-center gap-1 text-[10px] text-amber-400"><WifiOff className="w-3 h-3" />offline</span>}
                </div>
            </header>
            <div className="px-6 py-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Stat label="Cluster CPU" value={metrics ? `${metrics.cluster_cpu_percent.toFixed(1)}%` : "-"} />
                    <Stat label="Cluster Memory" value={metrics ? `${metrics.cluster_memory_percent.toFixed(1)}%` : "-"} />
                </div>

                <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-5">
                    <h2 className="text-sm font-medium text-zinc-200 mb-4">CPU & Memory</h2>
                    <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
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
                    {error && <p className="mt-3 text-center text-[12px] text-zinc-500">Start Monitoring Service and Prometheus to see live metrics.</p>}
                </div>

                <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg overflow-hidden">
                    <div className="px-5 py-3 border-b border-zinc-800"><h2 className="text-sm font-medium text-zinc-200">Active Prometheus Alerts</h2></div>
                    {(metrics?.alerts || []).length === 0 ? (
                        <div className="px-5 py-8 text-center text-[12px] text-zinc-500">No firing alerts returned.</div>
                    ) : (
                        <div className="divide-y divide-zinc-800/50">
                            {metrics!.alerts!.map((a) => (
                                <div key={`${a.name}-${a.since}`} className="px-5 py-3 flex items-center justify-between">
                                    <div>
                                        <p className="text-[13px] text-zinc-200">{a.name}</p>
                                        <p className="text-[11px] text-zinc-500">{a.message}</p>
                                    </div>
                                    <span className="text-[10px] text-amber-400 font-mono">{a.severity}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
            <span className="text-xs text-zinc-400">{label}</span>
            <p className="text-2xl font-semibold font-mono text-zinc-100 mt-2">{value}</p>
        </div>
    );
}
