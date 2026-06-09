"use client";

import { useEffect, useState } from "react";
import { getRiskScores, getIncidents, type ServiceRisk, type Incident } from "@/lib/api";

// ─── AI insights Panel (bottom-right) ────────────────────────────────────────

interface Insight {
    title: string;
    desc: string;
    confidence: number;
    color: string;
}

export function AIInsightsPanel() {
    const [insights, setInsights] = useState<Insight[]>([]);

    useEffect(() => {
        async function load() {
            try {
                const [riskData, incidentData] = await Promise.all([
                    getRiskScores().catch(() => ({ services: [], total: 0, calculated_at: "" })),
                    getIncidents().catch(() => ({ incidents: [], total: 0 })),
                ]);
                const derived: Insight[] = [];
                const services = riskData.services || [];
                const incidents = incidentData.incidents || [];

                // Derive insights from risk scores
                const highRisk = services.filter(s => s.risk_level === "high" || s.risk_level === "critical");
                const lowRisk = services.filter(s => s.risk_level === "low");

                if (lowRisk.length > 0 && highRisk.length === 0) {
                    derived.push({ title: "Service mesh is operating normally", desc: "No anomalies detected", confidence: 99, color: "#3fb950" });
                }
                for (const s of highRisk.slice(0, 2)) {
                    derived.push({ title: `${s.service} at risk`, desc: s.prediction || s.recommended_action, confidence: Math.round(100 - s.risk_score), color: s.risk_level === "critical" ? "#f85149" : "#f0883e" });
                }
                if (incidents.length === 0) {
                    derived.push({ title: "No active incidents", desc: "Across all namespaces", confidence: 98, color: "#3fb950" });
                }
                for (const inc of incidents.filter(i => i.status === "active").slice(0, 2)) {
                    derived.push({ title: inc.title, desc: inc.rootCause || inc.service, confidence: inc.confidence || 90, color: inc.severity === "critical" ? "#f85149" : "#f0883e" });
                }

                setInsights(derived.slice(0, 4));
            } catch { }
        }
        load();
        const interval = setInterval(load, 15000);
        return () => clearInterval(interval);
    }, []);
    return (
        <div className="rounded-[12px] border border-[#21262d] bg-[#161b22] p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                    <h3 className="text-[14px] font-semibold text-[#e6edf3]">AI insights</h3>
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#3fb950]/10 border border-[#3fb950]/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#3fb950]" style={{ boxShadow: "0 0 6px #3fb950", animation: "wi-pulse 2s infinite" }} />
                        <span className="text-[10px] text-[#3fb950] font-semibold">Live</span>
                    </div>
                </div>
                <button className="text-[11px] text-[#58a6ff] hover:text-[#79c0ff] font-medium">View All insights</button>
            </div>

            {/* 2x2 grid of insights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {insights.map((insight, i) => (
                    <div key={i} className="rounded-md bg-[#0d1117] border border-[#21262d] p-2.5 hover:border-[#30363d] transition-colors">
                        <div className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: insight.color, boxShadow: `0 0 4px ${insight.color}` }} />
                            <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-semibold text-[#e6edf3] leading-snug">{insight.title}</p>
                                <p className="text-[10px] text-[#8b949e] mt-0.5">{insight.desc}</p>
                                <p className="text-[10px] text-[#6e7681] mt-1 font-mono">
                                    Confidence <span className="font-semibold" style={{ color: insight.color }}>{insight.confidence}%</span>
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
