"use client";

import { useEffect, useState } from "react";
import { getNodes, type NodeInfo } from "@/lib/api";
import { Server, Loader2, WifiOff } from "lucide-react";

export default function NodesPage() {
    const [nodes, setNodes] = useState<NodeInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
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
        load();
        const interval = setInterval(load, 15000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex-1 overflow-y-auto scrollbar bg-[#0d1117]">
            <header className="px-6 py-5 border-b border-zinc-800/60">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-zinc-100">Nodes</h1>
                        <p className="text-sm text-zinc-500 mt-0.5">{nodes.length} nodes in cluster</p>
                    </div>
                    {loading && <Loader2 className="w-4 h-4 text-zinc-500 animate-spin" />}
                    {error && <WifiOff className="w-4 h-4 text-amber-400" />}
                </div>
            </header>

            <div className="px-6 py-5">
                {/* Stats Row */}
                {nodes.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        <StatCard label="Total Nodes" value={nodes.length} color="#22d3ee" />
                        <StatCard label="Ready" value={nodes.filter(n => n.status === "Ready").length} color="#3fb950" />
                        <StatCard label="Not Ready" value={nodes.filter(n => n.status !== "Ready").length} color="#f85149" />
                        <StatCard label="Total Pods" value={nodes.reduce((sum, n) => sum + n.pod_count, 0)} color="#a371f7" />
                    </div>
                )}

                {/* Nodes Table */}
                {nodes.length === 0 && !loading ? (
                    <div className="text-center py-12">
                        <Server className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
                        <p className="text-sm text-zinc-400">{error ? "Cannot reach cluster" : "No nodes found"}</p>
                    </div>
                ) : (
                    <div className="rounded-lg border border-zinc-800 overflow-hidden">
                        <table className="w-full text-[12px]">
                            <thead className="bg-[#161b22] border-b border-zinc-800">
                                <tr>
                                    <th className="text-left px-4 py-3 text-[#8b949e] font-medium">Node</th>
                                    <th className="text-left px-4 py-3 text-[#8b949e] font-medium">Status</th>
                                    <th className="text-left px-4 py-3 text-[#8b949e] font-medium">Role</th>
                                    <th className="text-left px-4 py-3 text-[#8b949e] font-medium">CPU</th>
                                    <th className="text-left px-4 py-3 text-[#8b949e] font-medium">Memory</th>
                                    <th className="text-left px-4 py-3 text-[#8b949e] font-medium">Pods</th>
                                    <th className="text-left px-4 py-3 text-[#8b949e] font-medium">IP</th>
                                    <th className="text-left px-4 py-3 text-[#8b949e] font-medium">Age</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/50">
                                {nodes.map(node => (
                                    <tr key={node.name} className="hover:bg-[#161b22] transition-colors">
                                        <td className="px-4 py-3 text-[#e6edf3] font-mono font-medium">{node.name}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${node.status === "Ready" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                                                {node.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-[#8b949e]">{node.role}</td>
                                        <td className="px-4 py-3 text-[#e6edf3] font-mono">{node.cpu_capacity}</td>
                                        <td className="px-4 py-3 text-[#e6edf3] font-mono">{node.memory_capacity}</td>
                                        <td className="px-4 py-3 text-[#e6edf3] font-mono">{node.pod_count}</td>
                                        <td className="px-4 py-3 text-[#8b949e] font-mono">{node.internal_ip}</td>
                                        <td className="px-4 py-3 text-[#8b949e]">{node.age}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
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
            <p className="text-[22px] font-bold font-mono" style={{ color }}>{value}</p>
        </div>
    );
}
