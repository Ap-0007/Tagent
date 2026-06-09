"use client";

import { useEffect, useState } from "react";
import { getAutoscaling, type AutoscalingSummary } from "@/lib/api";
import { TrendingUp, Loader2, WifiOff } from "lucide-react";

export default function AutoscalingPage() {
    const [data, setData] = useState<AutoscalingSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            try {
                const result = await getAutoscaling();
                setData(result);
                setError(null);
            } catch (e: any) { setError(e.message); }
            finally { setLoading(false); }
        }
        load();
    }, []);

    return (
        <div className="flex-1 overflow-y-auto scrollbar bg-[#0d1117]">
            <header className="px-6 py-5 border-b border-zinc-800/60">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-zinc-100">Autoscaling</h1>
                        <p className="text-sm text-zinc-500 mt-0.5">HPA and VPA status</p>
                    </div>
                    {loading && <Loader2 className="w-4 h-4 text-zinc-500 animate-spin" />}
                    {error && <WifiOff className="w-4 h-4 text-amber-400" />}
                </div>
            </header>
            <div className="px-6 py-5 space-y-4">
                {data && data.hpas.length > 0 ? (
                    <div className="rounded-lg border border-zinc-800 overflow-hidden">
                        <table className="w-full text-[12px]">
                            <thead className="bg-[#161b22] border-b border-zinc-800">
                                <tr>
                                    <th className="text-left px-4 py-3 text-[#8b949e]">Name</th>
                                    <th className="text-left px-4 py-3 text-[#8b949e]">Namespace</th>
                                    <th className="text-left px-4 py-3 text-[#8b949e]">Current</th>
                                    <th className="text-left px-4 py-3 text-[#8b949e]">Desired</th>
                                    <th className="text-left px-4 py-3 text-[#8b949e]">Min/Max</th>
                                    <th className="text-left px-4 py-3 text-[#8b949e]">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/50">
                                {data.hpas.map(h => (
                                    <tr key={`${h.namespace}/${h.name}`} className="hover:bg-[#161b22]">
                                        <td className="px-4 py-3 text-[#e6edf3] font-mono">{h.name}</td>
                                        <td className="px-4 py-3 text-[#8b949e]">{h.namespace}</td>
                                        <td className="px-4 py-3 text-[#e6edf3] font-mono">{h.current}</td>
                                        <td className="px-4 py-3 text-[#e6edf3] font-mono">{h.desired}</td>
                                        <td className="px-4 py-3 text-[#8b949e] font-mono">{h.min}/{h.max}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${h.status === "stable" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>{h.status}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : !loading ? (
                    <div className="text-center py-12">
                        <TrendingUp className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
                        <p className="text-sm text-zinc-400">{error ? "Cannot reach cluster" : "No HPAs configured in this cluster"}</p>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
