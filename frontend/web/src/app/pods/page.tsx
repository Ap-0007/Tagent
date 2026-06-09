"use client";

import { useEffect, useState } from "react";
import { getPods, type PodInfo } from "@/lib/api";
import { Box, Loader2, WifiOff, Search } from "lucide-react";

export default function PodsPage() {
    const [pods, setPods] = useState<PodInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    useEffect(() => {
        async function load() {
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
        load();
        const interval = setInterval(load, 15000);
        return () => clearInterval(interval);
    }, []);

    const filtered = pods.filter(p => {
        const matchSearch = !search || p.name.includes(search) || p.namespace.includes(search);
        const matchStatus = statusFilter === "all" || p.status.toLowerCase() === statusFilter;
        return matchSearch && matchStatus;
    });

    const statuses = [...new Set(pods.map(p => p.status))];

    return (
        <div className="flex-1 overflow-y-auto scrollbar bg-[#0d1117]">
            <header className="px-6 py-5 border-b border-zinc-800/60">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-zinc-100">Pods</h1>
                        <p className="text-sm text-zinc-500 mt-0.5">{pods.length} pods across all namespaces</p>
                    </div>
                    {loading && <Loader2 className="w-4 h-4 text-zinc-500 animate-spin" />}
                    {error && <WifiOff className="w-4 h-4 text-amber-400" />}
                </div>
            </header>

            <div className="px-6 py-5">
                {/* Stats */}
                {pods.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                        <StatCard label="Total" value={pods.length} color="#22d3ee" />
                        <StatCard label="Running" value={pods.filter(p => p.status === "Running").length} color="#3fb950" />
                        <StatCard label="Failed" value={pods.filter(p => p.status !== "Running" && p.status !== "Succeeded" && p.status !== "Completed").length} color="#f85149" />
                        <StatCard label="High Restarts" value={pods.filter(p => p.restarts > 5).length} color="#f0883e" />
                        <StatCard label="Namespaces" value={new Set(pods.map(p => p.namespace)).size} color="#a371f7" />
                    </div>
                )}

                {/* Filters */}
                <div className="flex gap-2 mb-4">
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search pods..." className="w-full h-9 bg-zinc-900 border border-zinc-800 rounded-md pl-9 pr-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50" />
                    </div>
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-9 px-3 bg-zinc-900 border border-zinc-800 rounded-md text-[12px] text-zinc-200">
                        <option value="all">All Status</option>
                        {statuses.map(s => <option key={s} value={s.toLowerCase()}>{s}</option>)}
                    </select>
                </div>

                {/* Table */}
                {filtered.length === 0 && !loading ? (
                    <div className="text-center py-12">
                        <Box className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
                        <p className="text-sm text-zinc-400">{error ? "Cannot reach cluster" : "No pods found"}</p>
                    </div>
                ) : (
                    <div className="rounded-lg border border-zinc-800 overflow-hidden">
                        <table className="w-full text-[11px]">
                            <thead className="bg-[#161b22] border-b border-zinc-800">
                                <tr>
                                    <th className="text-left px-3 py-2.5 text-[#8b949e] font-medium">Name</th>
                                    <th className="text-left px-3 py-2.5 text-[#8b949e] font-medium">Namespace</th>
                                    <th className="text-left px-3 py-2.5 text-[#8b949e] font-medium">Status</th>
                                    <th className="text-left px-3 py-2.5 text-[#8b949e] font-medium">Restarts</th>
                                    <th className="text-left px-3 py-2.5 text-[#8b949e] font-medium">Node</th>
                                    <th className="text-left px-3 py-2.5 text-[#8b949e] font-medium">Age</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/50">
                                {filtered.slice(0, 100).map(pod => (
                                    <tr key={`${pod.namespace}/${pod.name}`} className="hover:bg-[#161b22] transition-colors">
                                        <td className="px-3 py-2.5 text-[#e6edf3] font-mono">{pod.name}</td>
                                        <td className="px-3 py-2.5 text-[#8b949e]">{pod.namespace}</td>
                                        <td className="px-3 py-2.5">
                                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${pod.status === "Running" ? "bg-emerald-500/10 text-emerald-400" : pod.status === "Succeeded" || pod.status === "Completed" ? "bg-blue-500/10 text-blue-400" : "bg-red-500/10 text-red-400"}`}>
                                                {pod.status}
                                            </span>
                                        </td>
                                        <td className={`px-3 py-2.5 font-mono ${pod.restarts > 5 ? "text-[#f85149]" : pod.restarts > 0 ? "text-[#f0883e]" : "text-[#8b949e]"}`}>{pod.restarts}</td>
                                        <td className="px-3 py-2.5 text-[#8b949e] font-mono">{pod.node}</td>
                                        <td className="px-3 py-2.5 text-[#8b949e]">{pod.age}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filtered.length > 100 && (
                            <div className="px-3 py-2 text-[10px] text-[#8b949e] bg-[#161b22] border-t border-zinc-800">
                                Showing 100 of {filtered.length} pods
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div className="rounded-lg border border-[#21262d] bg-[#161b22] p-3">
            <p className="text-[10px] text-[#8b949e] mb-1">{label}</p>
            <p className="text-[20px] font-bold font-mono" style={{ color }}>{value}</p>
        </div>
    );
}
