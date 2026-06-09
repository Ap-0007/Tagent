"use client";

import { useEffect, useState } from "react";
import { getDeployments, type DeploymentInfo } from "@/lib/api";
import { Layers, Loader2, WifiOff } from "lucide-react";

export default function DeploymentsPage() {
    const [deployments, setDeployments] = useState<DeploymentInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            try {
                const data = await getDeployments();
                setDeployments(data || []);
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

    const healthy = deployments.filter(d => d.ready === d.replicas);
    const degraded = deployments.filter(d => d.ready < d.replicas && d.ready > 0);
    const down = deployments.filter(d => d.ready === 0 && d.replicas > 0);

    return (
        <div className="flex-1 overflow-y-auto scrollbar bg-[#0d1117]">
            <header className="px-6 py-5 border-b border-zinc-800/60">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-zinc-100">Deployments</h1>
                        <p className="text-sm text-zinc-500 mt-0.5">{deployments.length} deployments across all namespaces</p>
                    </div>
                    {loading && <Loader2 className="w-4 h-4 text-zinc-500 animate-spin" />}
                    {error && <WifiOff className="w-4 h-4 text-amber-400" />}
                </div>
            </header>

            <div className="px-6 py-5">
                {/* Stats */}
                {deployments.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        <StatCard label="Total" value={deployments.length} color="#22d3ee" />
                        <StatCard label="Healthy" value={healthy.length} color="#3fb950" />
                        <StatCard label="Degraded" value={degraded.length} color="#f0883e" />
                        <StatCard label="Down" value={down.length} color="#f85149" />
                    </div>
                )}

                {/* Table */}
                {deployments.length === 0 && !loading ? (
                    <div className="text-center py-12">
                        <Layers className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
                        <p className="text-sm text-zinc-400">{error ? "Cannot reach cluster" : "No deployments found"}</p>
                    </div>
                ) : (
                    <div className="rounded-lg border border-zinc-800 overflow-hidden">
                        <table className="w-full text-[12px]">
                            <thead className="bg-[#161b22] border-b border-zinc-800">
                                <tr>
                                    <th className="text-left px-4 py-3 text-[#8b949e] font-medium">Name</th>
                                    <th className="text-left px-4 py-3 text-[#8b949e] font-medium">Namespace</th>
                                    <th className="text-left px-4 py-3 text-[#8b949e] font-medium">Ready</th>
                                    <th className="text-left px-4 py-3 text-[#8b949e] font-medium">Available</th>
                                    <th className="text-left px-4 py-3 text-[#8b949e] font-medium">Status</th>
                                    <th className="text-left px-4 py-3 text-[#8b949e] font-medium">Age</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/50">
                                {deployments.map(dep => {
                                    const status = dep.ready === dep.replicas ? "healthy" : dep.ready > 0 ? "degraded" : "down";
                                    return (
                                        <tr key={`${dep.namespace}/${dep.name}`} className="hover:bg-[#161b22] transition-colors">
                                            <td className="px-4 py-3 text-[#e6edf3] font-mono font-medium">{dep.name}</td>
                                            <td className="px-4 py-3 text-[#8b949e]">{dep.namespace}</td>
                                            <td className="px-4 py-3 font-mono">
                                                <span className={dep.ready === dep.replicas ? "text-emerald-400" : "text-amber-400"}>{dep.ready}/{dep.replicas}</span>
                                            </td>
                                            <td className="px-4 py-3 text-[#e6edf3] font-mono">{dep.available}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${status === "healthy" ? "bg-emerald-500/10 text-emerald-400" : status === "degraded" ? "bg-amber-500/10 text-amber-400" : "bg-red-500/10 text-red-400"}`}>
                                                    {status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-[#8b949e]">{dep.age}</td>
                                        </tr>
                                    );
                                })}
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
            <p className="text-[20px] font-bold font-mono" style={{ color }}>{value}</p>
        </div>
    );
}
