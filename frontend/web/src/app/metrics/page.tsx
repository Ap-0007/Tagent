"use client";

import { metrics } from "@/lib/mock";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

export default function MetricsPage() {
    return (
        <div className="flex-1 overflow-y-auto scrollbar">
            <header className="px-6 py-5 border-b border-zinc-800/60">
                <h1 className="text-lg font-semibold text-zinc-100">Metrics</h1>
                <p className="text-sm text-zinc-500 mt-0.5">Cluster resource utilization</p>
            </header>
            <div className="px-6 py-5">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-5">
                    <h2 className="text-sm font-medium text-zinc-200 mb-4">CPU & Memory — 24h</h2>
                    <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={metrics} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="gc" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#22c55e" stopOpacity={0.15} /><stop offset="100%" stopColor="#22c55e" stopOpacity={0} /></linearGradient>
                                <linearGradient id="gm" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity={0.12} /><stop offset="100%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient>
                            </defs>
                            <XAxis dataKey="hour" tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} interval={3} />
                            <YAxis tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                            <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 6, fontSize: 11 }} />
                            <Area type="monotone" dataKey="cpu" stroke="#22c55e" strokeWidth={1.5} fill="url(#gc)" dot={false} name="CPU" />
                            <Area type="monotone" dataKey="mem" stroke="#3b82f6" strokeWidth={1.5} fill="url(#gm)" dot={false} name="Memory" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
