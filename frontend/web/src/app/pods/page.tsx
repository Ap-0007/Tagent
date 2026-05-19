"use client";

import { useEffect, useState } from "react";
import { getPods, type PodInfo } from "@/lib/api";
import { Search, Loader2, WifiOff } from "lucide-react";

function Bar({ pct }: { pct: number }) {
    const color = pct > 80 ? "bg-red-500" : pct > 60 ? "bg-amber-500" : "bg-emerald-500";
    return (
        <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
        </div>
    );
}

export default function PodsPage() {
    const [pods, setPods] = useState<PodInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState("");
    const [ns, setNs] = useState("all");

    useEffect(() => {
        let interval: NodeJS.Timeout;
        async function fetch() {
            try {
                const data = await getPods();
                setPods(data || []);
                setError(null);
            } catch (e: any) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        }
        fetch();
        interval = setInterval(fetch, 15000);
        return () => clearInterval(interval);
    }, []);

    const namespaces = ["all", ...new Set(pods.map((p) => p.namespace))];
    const filtered = pods.filter((p) => {
        if (ns !== "all" && p.namespace !== ns) return false;
        if (filter && !p.name.toLowerCase().includes(filter.toLowerCase())) return false;
        return true;
    });

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            <header className="px-6 py-5 border-b border-zinc-800/60 shrink-0">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-zinc-100">Pods</h1>
                        <p className="text-sm text-zinc-500 mt-0.5">
                            {loading ? "Loading..." : error ? "Backend not connected" : `${pods.length} pods across ${namespaces.length - 1} namespaces`}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {error && <span className="flex items-center gap-1 text-[10px] text-amber-400"><WifiOff className="w-3 h-3" />offline</span>}
                        {loading && <Loader2 className="w-4 h-4 text-zinc-500 animate-spin" />}
                    </div>
                </div>
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
                {filtered.length === 0 && !loading ? (
                    <div className="px-6 py-12 text-center text-zinc-500 text-sm">
                        {error ? "Backend not connected. Start the Discovery Service to see real pods." : "No pods found."}
                    </div>
                ) : (
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
                                    <td className="px-3 py-2 text-zinc-500">{p.namespace}</td>
                                    <td className="px-3 py-2">
                                        <span className={p.status === "Running" ? "text-emerald-400" : p.status === "Succeeded" ? "text-zinc-400" : "text-red-400"}>{p.status}</span>
                                    </td>
                                    <td className="px-3 py-2 text-zinc-300">{p.cpu_request || "-"}</td>
                                    <td className="px-3 py-2 text-zinc-300">{p.memory_request || "-"}</td>
                                    <td className="px-3 py-2">
                                        <span className={p.restarts > 0 ? "text-red-400" : "text-zinc-500"}>{p.restarts}</span>
                                    </td>
                                    <td className="px-3 py-2 text-zinc-500">{p.age}</td>
                                    <td className="px-3 py-2 text-zinc-500">{p.node}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
