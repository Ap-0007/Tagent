"use client";

import { useState } from "react";

const GROUPS: Record<string, { label: string; amount: string; percent: number; change: string; color: string }[]> = {
    "Service Category": [
        { label: "Compute", amount: "$11,240", percent: 45.2, change: "+8.1%", color: "#3fb950" },
        { label: "Storage", amount: "$6,180", percent: 24.8, change: "+2.4%", color: "#58a6ff" },
        { label: "Network", amount: "$3,120", percent: 12.5, change: "+1.2%", color: "#22d3ee" },
        { label: "Databases", amount: "$2,430", percent: 9.8, change: "+3.2%", color: "#a371f7" },
        { label: "AI / GPU", amount: "$1,680", percent: 6.8, change: "+15.4%", color: "#f0883e" },
        { label: "Other Services", amount: "$220", percent: 0.9, change: "+5.5%", color: "#6e7681" },
    ],
    "Namespace": [
        { label: "production", amount: "$14,200", percent: 57.1, change: "+5.2%", color: "#3fb950" },
        { label: "ai-engine", amount: "$5,800", percent: 23.3, change: "+18.4%", color: "#a371f7" },
        { label: "monitoring", amount: "$2,400", percent: 9.6, change: "+1.1%", color: "#22d3ee" },
        { label: "staging", amount: "$1,600", percent: 6.4, change: "-2.3%", color: "#58a6ff" },
        { label: "development", amount: "$870", percent: 3.5, change: "+0.8%", color: "#f0883e" },
    ],
    "Team": [
        { label: "Platform", amount: "$10,500", percent: 42.2, change: "+4.1%", color: "#3fb950" },
        { label: "AI/ML", amount: "$7,200", percent: 28.9, change: "+22.3%", color: "#a371f7" },
        { label: "Backend", amount: "$4,100", percent: 16.5, change: "+2.8%", color: "#58a6ff" },
        { label: "DevOps", amount: "$2,070", percent: 8.3, change: "+1.5%", color: "#22d3ee" },
        { label: "QA", amount: "$1,000", percent: 4.0, change: "-1.2%", color: "#f0883e" },
    ],
};

export function CostBreakdown() {
    const [groupBy, setGroupBy] = useState("Service Category");
    const [groupOpen, setGroupOpen] = useState(false);

    const categories = GROUPS[groupBy] || GROUPS["Service Category"];
    const total = "$24,870";
    const r = 60;
    const c = 2 * Math.PI * r;
    let accumulated = 0;

    return (
        <div className="rounded-[12px] border border-[#21262d] bg-[#161b22] p-3.5">
            <div className="flex items-center justify-between mb-3">
                <div>
                    <h3 className="text-[13px] font-semibold text-[#e6edf3]">Cost Breakdown</h3>
                    <p className="text-[10px] text-[#8b949e] mt-0.5">Total <span className="text-[#e6edf3] font-bold font-mono text-[14px] ml-1">{total}</span></p>
                    <p className="text-[10px] text-[#3fb950] mt-0.5">+ 6.2% vs last month</p>
                </div>
                <div className="relative">
                    <button
                        onClick={() => setGroupOpen(o => !o)}
                        className="flex items-center gap-1 h-7 px-2.5 rounded-md bg-[#0d1117] border border-[#30363d] text-[11px] text-[#8b949e] hover:text-[#e6edf3] hover:border-[#484f58] transition-colors"
                    >
                        Group by: {groupBy}
                        <svg width="9" height="9" viewBox="0 0 12 12" fill="none" className={`transition-transform ${groupOpen ? "rotate-180" : ""}`}>
                            <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                    {groupOpen && (
                        <div className="absolute top-full mt-1 right-0 z-30 w-44 rounded-md bg-[#161b22] border border-[#30363d] shadow-[0_8px_24px_rgba(0,0,0,0.5)] py-1">
                            {Object.keys(GROUPS).map(g => (
                                <button key={g} onClick={() => { setGroupBy(g); setGroupOpen(false); }} className={`w-full text-left px-3 py-1.5 text-[11.5px] hover:bg-[#21262d] transition-colors ${groupBy === g ? "text-[#58a6ff]" : "text-[#e6edf3]"}`}>
                                    {g}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                    <svg width="140" height="140" viewBox="0 0 140 140">
                        {categories.map((cat, i) => {
                            const start = accumulated;
                            accumulated += cat.percent;
                            const dashLen = (cat.percent / 100) * c;
                            const dashOffset = c - (start / 100) * c;
                            return (
                                <circle key={i} cx="70" cy="70" r={r} fill="none" stroke={cat.color} strokeWidth="14" strokeDasharray={`${dashLen} ${c - dashLen}`} strokeDashoffset={dashOffset} transform="rotate(-90 70 70)" style={{ filter: `drop-shadow(0 0 2px ${cat.color}40)` }} />
                            );
                        })}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-[9px] text-[#8b949e]">Total Cost</span>
                        <span className="text-[14px] font-bold text-[#e6edf3] font-mono">{total}</span>
                        <span className="text-[9px] text-[#8b949e]">This Month</span>
                    </div>
                </div>
                <div className="flex-1 space-y-1.5">
                    {categories.map((cat, i) => (
                        <div key={i} className="flex items-center gap-2 text-[10.5px]">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: cat.color }} />
                            <span className="text-[#8b949e] flex-1">{cat.label}</span>
                            <span className="text-[#e6edf3] font-mono font-semibold">{cat.amount}</span>
                            <span className="text-[#8b949e] font-mono w-[40px] text-right">{cat.percent}%</span>
                            <span className="font-mono w-[45px] text-right" style={{ color: cat.change.startsWith("+") ? "#f0883e" : "#3fb950" }}>{cat.change}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
