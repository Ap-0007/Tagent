"use client";

import Link from "next/link";
import { cluster, incidents, metrics } from "@/lib/mock";
import { timeAgo } from "@/lib/utils";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { Box, Activity, Server, AlertTriangle } from "lucide-react";

function Stat({ label, value, sub, icon: Icon, tone }: { label: string; value: string | number; sub?: string; icon: any; tone?: string }) {
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

export default function Dashboard() {
    const active = incidents.filter((i) => i.status !== "resolved");
    const unhealthy = cluster.pods - cluster.healthy;

    return (
        <div className="flex-1 overflow-y-auto scrollbar">
            <header className="px-6 py-5 border-b border-zinc-800/60">
                <h1 className="text-lg font-semibold text-zinc-100">Dashboard</h1>
                <p className="text-sm text-zinc-500 mt-0.5">Cluster health and incident overview</p>
            </header>

            <div className="px-6 py-5 space-y-5">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <Stat label="Pods" value={`${cluster.healthy}/${cluster.pods}`} sub={unhealthy > 0 ? `${unhealthy} unhealthy` : "all healthy"} icon={Box} tone={unhealthy > 0 ? "warn" : undefined} />
                    <Stat label="Deployments" value={cluster.deployments} sub="4 namespaces" icon={Activity} />
                    <Stat label="Services" value={cluster.services} icon={Server} />
                    <Stat label="Incidents" value={active.length} sub={active.length > 0 ? "needs attention" : "all clear"} icon={AlertTriangle} tone={active.length > 0 ? "crit" : undefined} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-lg">
                        <div className="px-5 py-3 border-b border-zinc-800 flex items-center justify-between">
                            <div>
                                <h2 className="text-sm font-medium text-zinc-200">Cluster Utilization</h2>
                                <p className="text-[11px] text-zinc-500">CPU & memory — last 24h</p>
                            </div>
                            <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />live
                            </span>
                        </div>
                        <div className="p-4">
                            <ResponsiveContainer width="100%" height={200}>
                                <AreaChart data={metrics} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="gc" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#22c55e" stopOpacity={0.15} /><stop offset="100%" stopColor="#22c55e" stopOpacity={0} /></linearGradient>
                                        <linearGradient id="gm" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity={0.12} /><stop offset="100%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient>
                                    </defs>
                                    <XAxis dataKey="hour" tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} interval={4} />
                                    <YAxis tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                                    <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 6, fontSize: 11 }} />
                                    <Area type="monotone" dataKey="cpu" stroke="#22c55e" strokeWidth={1.5} fill="url(#gc)" dot={false} name="CPU" />
                                    <Area type="monotone" dataKey="mem" stroke="#3b82f6" strokeWidth={1.5} fill="url(#gm)" dot={false} name="Memory" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg flex flex-col">
                        <div className="px-5 py-3 border-b border-zinc-800 flex items-center justify-between">
                            <h2 className="text-sm font-medium text-zinc-200">Active Incidents</h2>
                            <Link href="/incidents" className="text-[11px] text-emerald-400 hover:underline">View all</Link>
                        </div>
                        <div className="flex-1 divide-y divide-zinc-800/60">
                            {active.map((i) => (
                                <Link key={i.id} href={`/incidents`} className="block px-5 py-3 hover:bg-zinc-800/30 transition-colors">
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
            </div>
        </div>
    );
}
