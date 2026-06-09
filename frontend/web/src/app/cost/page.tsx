"use client";

import { useEffect, useState } from "react";
import { getCostSummary, type CostSummary } from "@/lib/api";
import { DollarSign, Loader2, WifiOff } from "lucide-react";

export default function CostPage() {
    const [data, setData] = useState<CostSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            try {
                const result = await getCostSummary();
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
                        <h1 className="text-lg font-semibold text-zinc-100">Cost Dashboard</h1>
                        <p className="text-sm text-zinc-500 mt-0.5">Infrastructure cost estimation</p>
                    </div>
                    {loading && <Loader2 className="w-4 h-4 text-zinc-500 animate-spin" />}
                    {error && <WifiOff className="w-4 h-4 text-amber-400" />}
                </div>
            </header>
            <div className="px-6 py-5 space-y-4">
                {data ? (
                    <>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-lg border border-[#21262d] bg-[#161b22] p-4">
                                <p className="text-[11px] text-[#8b949e] mb-1">Monthly Spend</p>
                                <p className="text-[28px] font-bold text-[#22d3ee] font-mono">{data.monthly_spend}</p>
                            </div>
                            <div className="rounded-lg border border-[#21262d] bg-[#161b22] p-4">
                                <p className="text-[11px] text-[#8b949e] mb-1">Potential Savings</p>
                                <p className="text-[28px] font-bold text-[#3fb950] font-mono">{data.potential_savings}</p>
                            </div>
                        </div>
                        {data.items.length > 0 && (
                            <div className="rounded-lg border border-[#21262d] bg-[#161b22] p-4">
                                <h3 className="text-[13px] font-semibold text-[#e6edf3] mb-3">Cost Breakdown</h3>
                                <div className="space-y-2">
                                    {data.items.map((item, i) => (
                                        <div key={i} className="flex items-center justify-between p-2 rounded-md bg-[#0d1117] border border-[#21262d]">
                                            <div>
                                                <p className="text-[11px] text-[#e6edf3] font-mono">{item.name}</p>
                                                <p className="text-[9px] text-[#8b949e]">{item.kind} · {item.namespace} · {item.basis}</p>
                                            </div>
                                            <span className="text-[12px] text-[#22d3ee] font-mono font-bold">{item.estimate}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {data.recommendations.length > 0 && (
                            <div className="rounded-lg border border-[#21262d] bg-[#161b22] p-4">
                                <h3 className="text-[13px] font-semibold text-[#e6edf3] mb-3">Optimization Recommendations</h3>
                                <div className="space-y-2">
                                    {data.recommendations.map((rec, i) => (
                                        <div key={i} className="p-3 rounded-md bg-[#0d1117] border border-[#21262d]">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-[12px] text-[#e6edf3] font-medium">{rec.title}</span>
                                                <span className="text-[11px] text-[#3fb950] font-mono font-bold">{rec.saving}</span>
                                            </div>
                                            <p className="text-[10px] text-[#8b949e]">{rec.detail}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                ) : !loading ? (
                    <div className="text-center py-12">
                        <DollarSign className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
                        <p className="text-sm text-zinc-400">{error ? "Cannot reach service" : "No cost data available"}</p>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
