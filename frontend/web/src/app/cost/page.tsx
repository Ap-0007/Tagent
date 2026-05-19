"use client";

import { useEffect, useState } from "react";
import { getCostSummary, type CostSummary } from "@/lib/api";
import { DollarSign, Lightbulb, Loader2, WifiOff } from "lucide-react";

export default function CostPage() {
    const [data, setData] = useState<CostSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const result = await getCostSummary();
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

    return (
        <div className="flex-1 overflow-y-auto scrollbar">
            <header className="px-6 py-5 border-b border-zinc-800/60">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-zinc-100">Cost Dashboard</h1>
                        <p className="text-sm text-zinc-500 mt-0.5">Backend cost contract from cluster inventory</p>
                    </div>
                    {loading && <Loader2 className="w-4 h-4 text-zinc-500 animate-spin" />}
                    {error && <span className="flex items-center gap-1 text-[10px] text-amber-400"><WifiOff className="w-3 h-3" />offline</span>}
                </div>
            </header>
            <div className="px-6 py-5 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Stat icon={DollarSign} label="Monthly Spend" value={data?.monthly_spend || "-"} />
                    <Stat icon={Lightbulb} label="Potential Savings" value={data?.potential_savings || "-"} sub={`${data?.recommendations.length || 0} recommendations`} />
                    <Stat icon={DollarSign} label="Inventory Items" value={String(data?.items.length ?? "-")} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg">
                        <div className="px-5 py-3 border-b border-zinc-800"><h2 className="text-sm font-medium text-zinc-200">Cost Inventory</h2></div>
                        {!data && !loading ? (
                            <div className="px-6 py-12 text-center text-sm text-zinc-500">{error ? "Start API Gateway and Discovery Service to see cost inventory." : "No cost inventory returned."}</div>
                        ) : (
                            <div className="divide-y divide-zinc-800/50">
                                {(data?.items || []).map((item) => (
                                    <div key={`${item.kind}-${item.namespace}-${item.name}`} className="px-5 py-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[13px] text-zinc-300 font-mono">{item.name}</span>
                                            <span className="text-[13px] text-zinc-200 font-mono">{item.estimate}</span>
                                        </div>
                                        <p className="text-[11px] text-zinc-500 mt-0.5">{item.kind} {item.namespace ? `- ${item.namespace}` : ""} - {item.basis}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg">
                        <div className="px-5 py-3 border-b border-zinc-800"><h2 className="text-sm font-medium text-zinc-200">Optimization Recommendations</h2></div>
                        {(data?.recommendations || []).length === 0 ? (
                            <div className="px-6 py-12 text-center text-sm text-zinc-500">No cost recommendations returned.</div>
                        ) : (
                            <div className="divide-y divide-zinc-800/50">
                                {data!.recommendations.map((r) => (
                                    <div key={r.title} className="px-5 py-3">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[13px] text-zinc-200 font-medium">{r.title}</span>
                                            <span className="text-[11px] text-emerald-400 font-mono">{r.saving}</span>
                                        </div>
                                        <p className="text-[11px] text-zinc-500">{r.detail}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function Stat({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string; sub?: string }) {
    return (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-zinc-400">{label}</span>
                <Icon className="w-4 h-4 text-zinc-600" />
            </div>
            <p className="text-xl font-semibold text-zinc-100 font-mono">{value}</p>
            {sub && <p className="text-[11px] text-zinc-500 mt-0.5">{sub}</p>}
        </div>
    );
}
