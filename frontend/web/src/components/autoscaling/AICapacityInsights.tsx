"use client";

import { useState } from "react";

const ALL_INSIGHTS = [
    { text: "API Gateway scaling efficiently", sub: "Traffic pattern matches capacity", confidence: 96, impact: "Optimal", impactColor: "#3fb950" },
    { text: "AI Engine expected to scale", sub: "Demand surge predicted in 12m", confidence: 95, impact: "High", impactColor: "#f0883e" },
    { text: "Checkout workload near CPU limit", sub: "CPU at 87%, scaling recommended", confidence: 92, impact: "Medium", impactColor: "#f0883e" },
    { text: "Resource allocation optimized", sub: "No over-provisioning detected", confidence: 97, impact: "Optimal", impactColor: "#3fb950" },
    { text: "No scaling anomalies detected", sub: "Scaling behavior is normal", confidence: 96, impact: "Optimal", impactColor: "#3fb950" },
    { text: "Notification service stable", sub: "No scaling needed in next 30m", confidence: 94, impact: "Optimal", impactColor: "#3fb950" },
    { text: "Worker batch job idle", sub: "Consider scaling to zero", confidence: 91, impact: "Low", impactColor: "#22d3ee" },
];

export function AICapacityInsights() {
    const [showAll, setShowAll] = useState(false);
    const visible = showAll ? ALL_INSIGHTS : ALL_INSIGHTS.slice(0, 5);
    return (
        <div className="rounded-[12px] border border-[#21262d] bg-[#161b22] p-3.5">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-semibold text-[#e6edf3]">AI Capacity Insights</h3>
                <button onClick={() => setShowAll(s => !s)} className="text-[10px] text-[#58a6ff] hover:text-[#79c0ff] transition-colors">{showAll ? "Show less" : "View all"}</button>
            </div>
            <div className="space-y-2">
                {visible.map((ins, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded-md bg-[#0d1117] border border-[#21262d] hover:border-[#30363d] transition-colors">
                        <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: ins.impactColor, boxShadow: `0 0 4px ${ins.impactColor}` }} />
                        <div className="flex-1 min-w-0">
                            <p className="text-[11px] text-[#e6edf3] font-medium leading-snug">{ins.text}</p>
                            <p className="text-[10px] text-[#8b949e] mt-0.5">{ins.sub}</p>
                        </div>
                        <div className="text-right shrink-0">
                            <p className="text-[10px] text-[#8b949e] font-mono">Confidence</p>
                            <p className="text-[12px] font-bold text-[#3fb950] font-mono">{ins.confidence}%</p>
                        </div>
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded shrink-0 mt-0.5" style={{ background: `${ins.impactColor}18`, color: ins.impactColor }}>
                            {ins.impact}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
