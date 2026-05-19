"use client";

import { useEffect, useState } from "react";
import { getNodes, type NodeInfo } from "@/lib/api";
import { Server, Loader2, WifiOff } from "lucide-react";

export default function NodesPage() {
    const [nodes, setNodes] = useState<NodeInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        async function fetch() {
            try {
                const data = await getNodes();
                setNodes(data || []);
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

    const ready = nodes.filter((n) => n.status === "Ready").length;

    return (
        <div className="flex-1 overflow-y-auto scrollbar">
            <header className="px-6 py-5 border-b border-zinc-800/60">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-zinc-100">Nodes</h1>
                        <p className="text-sm text-zinc-500 mt-0.5">
                            {loading ? "Loading..." : error ? "Backend not connected" : `${ready}/${nodes.length} ready`}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {error && <span className="flex items-center gap-1 text-[10px] text-amber-400"><WifiOff className="w-3 h-3" />offline</span>}
                        {loading && <Loader2 className="w-4 h-4 text-zinc-500 animate-spin" />}
                    </div>
                </div>
            </header>

            <div className="px-6 py-5 space-y-4">
                {nodes.length === 0 && !loading ? (
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg px-6 py-12 text-center">
                        <Server className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
                        <p className="text-sm text-zinc-400">No nodes found</p>
                        <p className="text-[11px] text-zinc-600 mt-1">
                            {error ? "Start the Discovery Service and API Gateway to see real node data." : "Your cluster has no nodes."}
                        </p>
                    </div>
                ) : (
                    nodes.map((n) => (
                        <div key={n.name} className={`bg-zinc-900/50 border rounded-lg p-5 ${n.status === "NotReady" ? "border-red-500/30" : "border-zinc-800"}`}>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <Server className="w-5 h-5 text-zinc-400" />
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[14px] text-zinc-100 font-mono font-medium">{n.name}</span>
                                            <span className={`px-1.5 py-0.5 text-[9px] font-semibold uppercase rounded ${n.status === "Ready" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>{n.status}</span>
                                            <span className="px-1.5 py-0.5 text-[9px] font-medium uppercase rounded bg-zinc-800 text-zinc-400">{n.role}</span>
                                        </div>
                                        <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                                            IP: {n.internal_ip || "unknown"} · age {n.age}
                                            {n.external_ip && ` · external: ${n.external_ip}`}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <span className="text-[10px] text-zinc-500 uppercase font-medium">CPU Capacity</span>
                                    <p className="text-[13px] text-zinc-200 font-mono mt-0.5">{n.cpu_capacity}</p>
                                </div>
                                <div>
                                    <span className="text-[10px] text-zinc-500 uppercase font-medium">Memory Capacity</span>
                                    <p className="text-[13px] text-zinc-200 font-mono mt-0.5">{n.memory_capacity}</p>
                                </div>
                                <div>
                                    <span className="text-[10px] text-zinc-500 uppercase font-medium">Pod Capacity</span>
                                    <p className="text-[13px] text-zinc-200 font-mono mt-0.5">{n.pod_capacity}</p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
