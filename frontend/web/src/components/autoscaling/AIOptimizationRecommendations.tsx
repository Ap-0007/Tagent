"use client";

// ─── AI Optimization Recommendations (3 cards in a row) ─────────────────────

const RECS = [
    {
        icon: "reduce",
        iconColor: "#3fb950",
        title: "Reduce API Gateway",
        sub: "min replicas",
        value: "$480",
        valueLabel: "/month",
        valueSub: "Potential Savings",
        confidence: 95,
        risk: "Low",
        riskColor: "#3fb950",
        action: "Optimize",
        actionColor: "#3fb950",
    },
    {
        icon: "increase",
        iconColor: "#58a6ff",
        title: "Increase AI Engine",
        sub: "max replicas",
        value: "18%",
        valueLabel: "",
        valueSub: "Latency Reduction",
        confidence: 92,
        risk: "Low",
        riskColor: "#3fb950",
        action: "Apply",
        actionColor: "#58a6ff",
    },
    {
        icon: "enable",
        iconColor: "#a371f7",
        title: "Enable predictive",
        sub: "scaling policy",
        value: "24%",
        valueLabel: "",
        valueSub: "Efficiency Improvement",
        confidence: 97,
        risk: "Low",
        riskColor: "#3fb950",
        action: "Enable",
        actionColor: "#a371f7",
    },
];

export function AIOptimizationRecommendations() {
    return (
        <div className="rounded-[12px] border border-[#21262d] bg-[#161b22] p-3.5">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-semibold text-[#e6edf3]">AI Optimization Recommendations</h3>
                <button className="text-[10px] text-[#8b949e] px-2 py-0.5 rounded-md border border-[#30363d] hover:text-[#e6edf3] hover:border-[#484f58] transition-colors">View all</button>
            </div>

            {/* 3 recommendation cards in a row */}
            <div className="grid grid-cols-3 gap-2.5">
                {RECS.map((r, i) => (
                    <div key={i} className="rounded-lg bg-[#0d1117] border border-[#21262d] p-3 hover:border-[#30363d] transition-colors">
                        {/* Icon + title */}
                        <div className="flex items-center gap-2 mb-2.5">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: `${r.iconColor}15`, border: `1.5px solid ${r.iconColor}` }}>
                                <RecIcon icon={r.icon} color={r.iconColor} />
                            </div>
                            <div>
                                <p className="text-[11px] font-semibold text-[#e6edf3] leading-tight">{r.title}</p>
                                <p className="text-[10px] text-[#8b949e]">{r.sub}</p>
                            </div>
                        </div>

                        {/* Value */}
                        <div className="mb-2.5">
                            <p className="text-[20px] font-bold text-[#e6edf3] font-mono leading-none">
                                {r.value}<span className="text-[11px] text-[#8b949e] font-normal">{r.valueLabel}</span>
                            </p>
                            <p className="text-[9.5px] text-[#8b949e] mt-0.5">{r.valueSub}</p>
                        </div>

                        {/* Confidence bar */}
                        <div className="mb-2">
                            <div className="w-full h-1 rounded-full bg-[#21262d] overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${r.confidence}%`, background: r.iconColor, boxShadow: `0 0 4px ${r.iconColor}` }} />
                            </div>
                            <div className="flex items-center justify-between mt-1 text-[9px]">
                                <span className="text-[#8b949e]">Confidence <span className="text-[#e6edf3] font-semibold ml-0.5">{r.confidence}%</span></span>
                            </div>
                        </div>

                        {/* Risk + Action */}
                        <div className="flex items-center justify-between pt-2 border-t border-[#21262d]">
                            <span className="text-[9.5px] text-[#8b949e]">Risk <span className="font-semibold ml-0.5" style={{ color: r.riskColor }}>{r.risk}</span></span>
                            <button className="px-2.5 py-1 rounded text-[10px] font-semibold text-white" style={{ background: r.actionColor, boxShadow: `0 0 6px ${r.actionColor}40` }}>
                                {r.action}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function RecIcon({ icon, color }: { icon: string; color: string }) {
    const props = { width: 14, height: 14, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
    if (icon === "reduce") return (<svg {...props}><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></svg>);
    if (icon === "increase") return (<svg {...props}><line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" /></svg>);
    // enable (sparkle)
    return (<svg {...props} fill={color} stroke="none"><path d="M12 0L14 9L24 12L14 15L12 24L10 15L0 12L10 9Z" /></svg>);
}
