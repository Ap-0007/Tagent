"use client";

import { useEffect, useState } from "react";
import { getAutoscaling, type AutoscalingSummary } from "@/lib/api";
import { ArrowUpRight, Minus, Loader2, WifiOff } from "lucide-react";

export default function AutoscalingPage() {
    const [data, setData] = useState<AutoscalingSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const result = await getAutoscaling();
                setData(result);
                setError(null);
            } catch (e: any) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const hpas = data?.hpas || [];

    return (
        <div className="flex-1 overflow-y-auto scrollbar">
            <header className="px-6 py-5 border-b border-zinc-800/60">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-zinc-100">Autoscaling</h1>
                        <p className="text-sm text-zinc-500 mt-0.5">Autoscaling contract backed by live deployment replica state</p>
                    </div>
                    {loading && <Loader2 className="w-4 h-4 text-zinc-500 animate-spin" />}
                    {error && <span className="flex items-center gap-1 text-[10px] text-amber-400"><WifiOff className="w-3 h-3" />offline</span>}
                </div>
            </header>
            <div className="px-6 py-5 space-y-5">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg">
                    <div className="px-5 py-3 border-b border-zinc-800"><h2 className="text-sm font-medium text-zinc-200">Horizontal Pod Autoscalers</h2></div>
                    {hpas.length === 0 && !loading ? (
                        <div className="px-5 py-8 text-center text-sm text-zinc-500">
                            {error ? "Start API Gateway and Discovery Service to see autoscaling data." : "No autoscaling data returned."}
                        </div>
                    ) : (
                        <table className="w-full text-[12px]">
                            <thead><tr className="border-b border-zinc-800 text-zinc-500 text-[10px] uppercase tracking-wider">
                                <th className="text-left px-5 py-2 font-medium">Workload</th>
                                <th className="text-left px-3 py-2 font-medium">Replicas</th>
                                <th className="text-left px-3 py-2 font-medium">Min/Max</th>
                                <th className="text-left px-3 py-2 font-medium">Status</th>
                                <th className="text-right px-5 py-2 font-medium">Age</th>
                            </tr></thead>
                            <tbody className="divide-y divide-zinc-800/50 font-mono">
                                {hpas.map((h) => (
                                    <tr key={`${h.namespace}/${h.name}`} className="hover:bg-zinc-800/20">
                                        <td className="px-5 py-2.5">
                                            <span className="text-zinc-200">{h.name}</span>
                                            <span className="text-zinc-600 ml-1.5 text-[10px]">{h.namespace}</span>
                                        </td>
                                        <td className="px-3 py-2.5 text-zinc-200">{h.current}/{h.desired}</td>
                                        <td className="px-3 py-2.5 text-zinc-500">{h.min}/{h.max}</td>
                                        <td className="px-3 py-2.5">
                                            <span className={`flex items-center gap-1 ${h.status === "stable" ? "text-emerald-400" : "text-amber-400"}`}>
                                                {h.status === "stable" ? <Minus className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                                                {h.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-2.5 text-right text-zinc-500">{h.age}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
