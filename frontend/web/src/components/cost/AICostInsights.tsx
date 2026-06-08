"use client";

import { useState } from "react";

const ALL_INSIGHTS = [
    { icon: "⚡", text: "3 workloads over-provisioned", sub: "CPU requests significantly above utilization", savings: "$2,140/mo", confidence: 97, color: "#f0883e" },
    { icon: "💻", text: "GPU cluster utilization below 25%", sub: "Underutilized GPU resources detected", savings: "$1,780/mo", confidence: 95, color: "#a371f7" },
    { icon: "💾", text: "Idle EBS volumes detected", sub: "18 volumes not attached to any workload", savings: "$480/mo", confidence: 99, color: "#22d3ee" },
    { icon: "☁️", text: "Spot instances operating efficiently", sub: "Great savings with low interruption rate", savings: "$3,120/mo", confidence: 98, color: "#3fb950" },
    { icon: "🌐", text: "Network egress cost increasing", sub: "High egress from us-east-1 to external", savings: "$320/mo", confidence: 90, color: "#f85149" },
    { icon: "📦", text: "Container right-sizing opportunity", sub: "12 containers using <30% of requested memory", savings: "$640/mo", confidence: 94, color: "#f0883e" },
    { icon: "🔄", text: "Reserved instance coverage gap", sub: "40% of compute running on-demand", savings: "$1,200/mo", confidence: 92, color: "#a371f7" },
];

export function AICostInsights() {
    const [showAll, setShowAll] = useState(false);
    const visible = showAll ? ALL_INSIGHTS : ALL_INSIGHTS.slice(0, 5);

    return (
        <div className="rounded-[12px] border border-[#21262d] bg-[#161b22] p-3.5">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-semibold text-[#e6edf3]">AI Cost Insights</h3>
                <button onClick={() => setShowAll(s => !s)} className="text-[10px] text-[#58a6ff] hover:text-[#79c0ff] transition-colors">
                    {showAll ? "Show less" : "View all"}
                </button>
            </div>
            <div className="space-y-2">
                {visible.map((ins, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded-md bg-[#0d1117] border border-[#21262d] hover:border-[#30363d] transition-colors">
                        <span className="text-[14px] shrink-0 mt-0.5">{ins.icon}</span>
                        <div className="flex-1 min-w-0">
                            <p className="text-[11px] text-[#e6edf3] font-medium leading-snug">{ins.text}</p>
                            <p className="text-[10px] text-[#8b949e] mt-0.5">{ins.sub}</p>
                        </div>
                        <div className="text-right shrink-0">
                            <p className="text-[11px] font-bold text-[#3fb950] font-mono">{ins.savings}</p>
                            <p className="text-[9px] text-[#8b949e]">Potential Savings</p>
                        </div>
                        <span className="text-[10px] font-mono font-semibold shrink-0 mt-0.5" style={{ color: ins.color }}>{ins.confidence}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
