"use client";

const RECS = [
    { action: "Reduce AI Engine CPU requests", sub: "Lower CPU requests by 30%", savings: "$820/mo", confidence: 96, risk: "Low Risk", riskColor: "#3fb950", badge: "Optimize" },
    { action: "Move workloads to Spot Instances", sub: "Migrate 6 workloads to spot", savings: "$1,240/mo", confidence: 93, risk: "Low Risk", riskColor: "#3fb950", badge: "Migrate" },
    { action: "Delete idle EBS volumes", sub: "Remove 18 unattached volumes", savings: "$480/mo", confidence: 99, risk: "None Risk", riskColor: "#3fb950", badge: "Delete" },
    { action: "Rightsize worker nodes", sub: "Downsize 3 over-provisioned nodes", savings: "$1,120/mo", confidence: 92, risk: "Low Risk", riskColor: "#3fb950", badge: "Rightsize" },
];

export function OptimizationRecommendations() {
    return (
        <div className="rounded-[12px] border border-[#21262d] bg-[#161b22] p-3.5">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-semibold text-[#e6edf3]">Optimization Recommendations</h3>
                <button className="text-[10px] text-[#58a6ff]">View all</button>
            </div>
            <div className="space-y-2">
                {RECS.map((r, i) => (
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
