"use client";

import { useState } from "react";
import { Search, ArrowUpDown } from "lucide-react";

const pods = [
    { name: "checkout-api-7d8f4b9c6-x2k9p", ns: "production", status: "Running", cpu: "245m", cpuPct: 61, mem: "312Mi", memPct: 62, restarts: 3, age: "2d", node: "ip-10-0-1-12" },
    { name: "checkout-api-7d8f4b9c6-m4n7q", ns: "production", status: "Running", cpu: "198m", cpuPct: 49, mem: "287Mi", memPct: 57, restarts: 0, age: "2d", node: "ip-10-0-1-12" },
    { name: "checkout-api-7d8f4b9c6-p8r2w", ns: "production", status: "CrashLoopBackOff", cpu: "0m", cpuPct: 0, mem: "0Mi", memPct: 0, restarts: 14, age: "4m", node: "ip-10-0-2-8" },
    { name: "payment-service-5f6a8d-k3j9", ns: "production", status: "Running", cpu: "412m", cpuPct: 82, mem: "489Mi", memPct: 95, restarts: 0, age: "8h", node: "ip-10-0-2-8" },
    { name: "payment-service-5f6a8d-n7m2", ns: "production", status: "Running", cpu: "387m", cpuPct: 77, mem: "456Mi", memPct: 89, restarts: 0, age: "8h", node: "ip-10-0-1-12" },
    { name: "orders-api-8c4e2f-q5t8", ns: "production", status: "Running", cpu: "89m", cpuPct: 22, mem: "156Mi", memPct: 31, restarts: 0, age: "5d", node: "ip-10-0-3-21" },
    { name: "orders-api-8c4e2f-w2x6", ns: "production", status: "Running", cpu: "76m", cpuPct: 19, mem: "142Mi", memPct: 28, restarts: 0, age: "5d", node: "ip-10-0-3-21" },
    { name: "postgres-primary-0", ns: "data", status: "Running", cpu: "890m", cpuPct: 89, mem: "2.1Gi", memPct: 84, restarts: 0, age: "14d", node: "ip-10-0-1-12" },
    { name: "redis-cache-0", ns: "data", status: "Running", cpu: "34m", cpuPct: 8, mem: "128Mi", memPct: 25, restarts: 0, age: "14d", node: "ip-10-0-2-8" },
    { name: "kafka-broker-0", ns: "data", status: "Running", cpu: "156m", cpuPct: 39, mem: "1.2Gi", memPct: 60, restarts: 0, age: "14d", node: "ip-10-0-3-21" },
    { name: "notifications-6b9d3e-h4k7", ns: "production", status: "Running", cpu: "23m", cpuPct: 5, mem: "89Mi", memPct: 17, restarts: 0, age: "3d", node: "ip-10-0-2-8" },
    { name: "coredns-7f89b4-t9p2", ns: "kube-system", status: "Running", cpu: "12m", cpuPct: 3, mem: "42Mi", memPct: 8, restarts: 0, age: "30d", node: "ip-10-0-1-12" },
];

function Bar({ pct, warn }: { pct: number; warn?: boolean }) {
    const color = pct > 80 ? "bg-red-500" : pct > 60 ? "bg-amber-500" : "bg-emerald-500";
    return (
        <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
        </div>
    );
}

export default function PodsPage() {
    const [filter, setFilter] = useState("");
    const [ns, setNs] = useState("all");

    const namespaces = ["all", ...new Set(pods.map((p) => p.ns))];
    const filtered = pods.filter((p) => {
        if (ns !== "all" && p.ns !== ns) return false;
        if (filter && !p.name.toLowerCase().includes(filter.toLowerCase())) return false;
        return true;
    });

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            <header className="px-6 py-5 border-b border-zinc-800/60 shrink-0">
                <h1 className="text-lg font-semibold text-zinc-100">Pods</h1>
                <p className="text-sm text-zinc-500 mt-0.5">{pods.length} pods across {namespaces.length - 1} namespaces</p>
            </header>
            <div className="px-6 py-3 border-b border-zinc-800/60 flex items-center gap-2 shrink-0">
                <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter pods..." className="w-full h-8 bg-zinc-900 border border-zinc-800 rounded-md pl-8 pr-3 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50" />
                </div>
                {namespaces.map((n) => (
                    <button key={n} onClick={() => setNs(n)} className={`h-8 px-2.5 text-[10px] font-mono border rounded-md ${ns === n ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "border-zinc-800 text-zinc-500 hover:text-zinc-300"}`}>{n}</button>
                ))}
            </div>
            <div className="flex-1 overflow-y-auto scrollbar">
                <table className="w-full text-[11px]">
                    <thead className="sticky top-0 bg-[#0c0c0f] z-10">
                        <tr className="border-b border-zinc-800 text-zinc-500 text-[10px] uppercase tracking-wider">
                            <th className="text-left px-4 py-2 font-medium">Pod</th>
                            <th className="text-left px-3 py-2 font-medium">Namespace</th>
                            <th className="text-left px-3 py-2 font-medium">Status</th>
                            <th className="text-left px-3 py-2 font-medium">CPU</th>
                            <th className="text-left px-3 py-2 font-medium">Memory</th>
                            <th className="text-left px-3 py-2 font-medium">Restarts</th>
                            <th className="text-left px-3 py-2 font-medium">Age</th>
                            <th className="text-left px-3 py-2 font-medium">Node</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/40 font-mono">
                        {filtered.map((p) => (
                            <tr key={p.name} className="hover:bg-zinc-800/20">
                                <td className="px-4 py-2 text-zinc-200 truncate max-w-[220px]">{p.name}</td>
                                <td className="px-3 py-2 text-zinc-500">{p.ns}</td>
                                <td className="px-3 py-2">
                                    <span className={p.status === "Running" ? "text-emerald-400" : "text-red-400"}>{p.status}</span>
                                </td>
                                <td className="px-3 py-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-zinc-300 w-10">{p.cpu}</span>
                                        <Bar pct={p.cpuPct} />
                                        <span className="text-zinc-500 w-8">{p.cpuPct}%</span>
                                    </div>
                                </td>
                                <td className="px-3 py-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-zinc-300 w-12">{p.mem}</span>
                                        <Bar pct={p.memPct} />
                                        <span className="text-zinc-500 w-8">{p.memPct}%</span>
                                    </div>
                                </td>
                                <td className="px-3 py-2">
                                    <span className={p.restarts > 0 ? "text-red-400" : "text-zinc-500"}>{p.restarts}</span>
                                </td>
                                <td className="px-3 py-2 text-zinc-500">{p.age}</td>
                                <td className="px-3 py-2 text-zinc-500">{p.node}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
