"use client";

import { useEffect, useState } from "react";
import { getClusterState, type ClusterState } from "@/lib/api";
import { Network, Loader2, WifiOff } from "lucide-react";

export default function TopologyPage() {
    const [data, setData] = useState<ClusterState | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            try {
                const state = await getClusterState();
                setData(state);
                setError(null);
            } catch (e: any) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    return (
        <div className="flex-1 overflow-y-auto scrollbar bg-[#0d1117]">
            <header className="px-6 py-5 border-b border-zinc-800/60">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-zinc-100">Service Topology</h1>
                        <p className="text-sm text-zinc-500 mt-0.5">
                            {data ? `${data.services?.length || 0} services · ${data.deployments?.length || 0} deployments · ${data.nodes?.length || 0} nodes` : "Loading..."}
                        </p>
                    </div>
                    {loading && <Loader2 className="w-4 h-4 text-zinc-500 animate-spin" />}
                    {error && <WifiOff className="w-4 h-4 text-amber-400" />}
                </div>
            </header>

            <div className="px-6 py-5">
                {!data && !loading && (
                    <div className="text-center py-12">
                        <Network className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
                        <p className="text-sm text-zinc-400">{error ? "Cannot reach cluster" : "No topology data"}</p>
                    </div>
                )}

                {data && (
                    <div className="space-y-4">
                        {/* Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            <StatCard label="Nodes" value={data.nodes?.length || 0} color="#22d3ee" />
                            <StatCard label="Pods" value={data.pods?.length || 0} color="#3fb950" />
                            <StatCard label="Deployments" value={data.deployments?.length || 0} color="#a371f7" />
                            <StatCard label="Services" value={data.services?.length || 0} color="#58a6ff" />
                            <StatCard label="Namespaces" value={data.namespaces?.length || 0} color="#f0883e" />
                        </div>

                        {/* Node → Pod mapping */}
                        <div className="rounded-[12px] border border-[#21262d] bg-[#161b22] p-4">
                            <h3 className="text-[14px] font-semibold text-[#e6edf3] mb-3">Node → Pod Distribution</h3>
                            <div className="space-y-3">
                                {data.nodes?.map(node => {
                                    const nodePods = data.pods?.filter(p => p.node === node.name) || [];
                                    const running = nodePods.filter(p => p.status === "Running").length;
                                    const failing = nodePods.filter(p => p.status !== "Running" && p.status !== "Succeeded" && p.status !== "Completed").length;
                                    return (
                                        <div key={node.name} className="p-3 rounded-lg bg-[#0d1117] border border-[#21262d]">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-2 h-2 rounded-full ${node.status === "Ready" ? "bg-emerald-400" : "bg-red-400"}`} />
                                                    <span className="text-[12px] text-[#e6edf3] font-mono font-medium">{node.name}</span>
                                                    <span className="text-[10px] text-[#8b949e]">{node.role}</span>
                                                </div>
                                                <span className="text-[10px] text-[#8b949e]">{nodePods.length} pods</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 h-2 bg-[#21262d] rounded-full overflow-hidden">
                                                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${nodePods.length > 0 ? (running / nodePods.length) * 100 : 0}%` }} />
                                                </div>
                                                <span className="text-[10px] text-emerald-400">{running} running</span>
                                                {failing > 0 && <span className="text-[10px] text-red-400">{failing} failing</span>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Services list */}
                        <div className="rounded-[12px] border border-[#21262d] bg-[#161b22] p-4">
                            <h3 className="text-[14px] font-semibold text-[#e6edf3] mb-3">Services ({data.services?.length || 0})</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                {data.services?.slice(0, 30).map(svc => (
                                    <div key={`${svc.namespace}/${svc.name}`} className="flex items-center gap-2 p-2 rounded-md bg-[#0d1117] border border-[#21262d]">
                                        <span className="w-2 h-2 rounded-full bg-[#58a6ff]" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[11px] text-[#e6edf3] font-mono truncate">{svc.name}</p>
                                            <p className="text-[9px] text-[#8b949e]">{svc.namespace} · {svc.type} · {svc.ports}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
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
