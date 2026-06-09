"use client";

import { useEffect, useState } from "react";
import { getCostSummary, type CostSummary } from "@/lib/api";

const BADGES = ["Optimize", "Migrate", "Delete", "Rightsize", "Scale", "Reserve"];

interface Rec {
    action: string;
    sub: string;
    savings: string;
    confidence: number;
    risk: string;
    riskColor: string;
    badge: string;
}

export function OptimizationRecommendations() {
    const [recs, setRecs] = useState<Rec[]>([]);

    useEffect(() => {
        const load = () => {
            getCostSummary()
                .then((data: CostSummary) => {
                    const mapped: Rec[] = data.recommendations.map((r, i) => ({
                        action: r.title,
                        sub: r.detail,
                        savings: r.saving.startsWith("$") ? r.saving + "/mo" : "$" + r.saving + "/mo",
                        confidence: 96 - i * 2,
                        risk: "Low Risk",
                        riskColor: "#3fb950",
                        badge: BADGES[i % BADGES.length],
                    }));
                    setRecs(mapped);
                })
                .catch(() => null);
        };
        load();
        const id = setInterval(load, 15000);
        return () => clearInterval(id);
    }, []);

    return (
        <div className="rounded-[12px] border border-[#21262d] bg-[#161b22] p-3.5">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-semibold text-[#e6edf3]">Optimization Recommendations</h3>
                <button className="text-[10px] text-[#58a6ff]">View all</button>
            </div>
            <div className="space-y-2">
                {recs.length === 0 && (
                    <div className="flex items-center gap-2.5 p-2 rounded-md bg-[#0d1117] border border-[#21262d]">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-[#8b949e]" />
                        <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-semibold text-[#8b949e]">Loading recommendations…</p>
                            <p className="text-[10px] text-[#6e7681]">Fetching optimization data</p>
                        </div>
                    </div>
                )}
                {recs.map((r, i) => (
                    <div key={i} className="flex items-center gap-2.5 p-2 rounded-md bg-[#0d1117] border border-[#21262d] hover:border-[#30363d] transition-colors">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: r.riskColor, boxShadow: `0 0 3px ${r.riskColor}` }} />
                        <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-semibold text-[#e6edf3] truncate">{r.action}</p>
                            <p className="text-[10px] text-[#8b949e] truncate">{r.sub}</p>
                        </div>
                        <div className="text-right shrink-0">
                            <p className="text-[11px] font-bold text-[#3fb950] font-mono">{r.savings}</p>
                            <p className="text-[9px] text-[#8b949e]">Potential Savings</p>
                        </div>
                        <span className="text-[9px] font-mono text-[#8b949e] shrink-0">{r.confidence}%</span>
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded shrink-0" style={{ background: `${r.riskColor}18`, color: r.riskColor }}>{r.risk}</span>
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-[#1f6feb]/15 text-[#58a6ff] shrink-0">{r.badge}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
