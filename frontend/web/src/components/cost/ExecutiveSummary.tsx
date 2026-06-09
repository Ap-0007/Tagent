"use client";

import { useEffect, useState } from "react";
import { getCostSummary, getRiskSummary, type CostSummary, type RiskSummaryResponse } from "@/lib/api";

export function ExecutiveSummary() {
    const [costData, setCostData] = useState<CostSummary | null>(null);
    const [riskData, setRiskData] = useState<RiskSummaryResponse | null>(null);

    useEffect(() => {
        const load = () => {
            getCostSummary().then(setCostData).catch(() => null);
            getRiskSummary().then(setRiskData).catch(() => null);
        };
        load();
        const id = setInterval(load, 15000);
        return () => clearInterval(id);
    }, []);

    const savings = costData?.potential_savings ?? "—";
    const recCount = costData?.recommendations.length ?? 0;
    const overallLevel = riskData?.overall_level ?? "—";
    const aiConfidence = riskData?.ai_confidence ?? 0;
    const overallScore = riskData?.overall_score ?? 0;
    const efficiency = overallScore > 0 ? `${Math.max(0, 100 - overallScore)}%` : "—";
    const trend = riskData?.trend ?? "stable";
    const trendLabel = trend === "improving" ? "↘ vs last month" : trend === "degrading" ? "↗ vs last month" : "→ stable";
    const criticalIssues = riskData ? riskData.critical_count : 0;
    const healthLabel = criticalIssues === 0 ? "No critical issues" : `${criticalIssues} critical issue${criticalIssues > 1 ? "s" : ""}`;
    const healthColor = criticalIssues === 0 ? "#3fb950" : "#f85149";

    return (
        <div className="rounded-[12px] border border-[#21262d] bg-[#161b22] p-3.5">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-semibold text-[#e6edf3]">Executive Summary</h3>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#a371f7]/15 text-[#a371f7] font-semibold">AI Generated</span>
            </div>
            <p className="text-[11px] text-[#8b949e] leading-relaxed mb-3">
                Infrastructure spending remains healthy and within budget. AI has identified {savings} in potential monthly savings across {recCount} optimization opportunities.
            </p>
            <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="rounded-md bg-[#0d1117] border border-[#21262d] p-2 text-center">
                    <p className="text-[9px] text-[#8b949e]">Overall Efficiency</p>
                    <p className="text-[16px] font-bold text-[#3fb950] font-mono">{efficiency}</p>
                </div>
                <div className="rounded-md bg-[#0d1117] border border-[#21262d] p-2 text-center">
                    <p className="text-[9px] text-[#8b949e]">Cost Efficiency</p>
                    <p className="text-[16px] font-bold text-[#3fb950] font-mono">{overallLevel || "—"}</p>
                </div>
                <div className="rounded-md bg-[#0d1117] border border-[#21262d] p-2 text-center">
                    <p className="text-[9px] text-[#8b949e]">Budget Health</p>
                    <p className="text-[16px] font-bold text-[#3fb950] font-mono">Good</p>
                </div>
                <div className="rounded-md bg-[#0d1117] border border-[#21262d] p-2 text-center">
                    <p className="text-[9px] text-[#8b949e]">Cost Trend</p>
                    <p className="text-[11px] font-semibold text-[#3fb950]">{trendLabel}</p>
                </div>
            </div>
            <div className="flex items-center justify-between text-[10px] pt-2 border-t border-[#21262d]">
                <span className="text-[#8b949e]">Risk Level <span className="text-[#3fb950] font-semibold ml-1">{riskData ? `${riskData.overall_score}%` : "—"}</span></span>
                <span className="font-semibold" style={{ color: healthColor }}>{healthLabel}</span>
            </div>
            <p className="text-[9px] text-[#6e7681] mt-2">Generated with {aiConfidence > 0 ? `${aiConfidence}%` : "—"} confidence. AI-powered analysis.</p>
        </div>
    );
}
