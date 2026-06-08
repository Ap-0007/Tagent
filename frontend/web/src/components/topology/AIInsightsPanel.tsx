"use client";

// ─── AI Insights Panel (bottom-right) ────────────────────────────────────────

const INSIGHTS = [
    { title: "Service mesh is operating normally", desc: "No anomalies detected", confidence: 99, color: "#3fb950" },
    { title: "AI Engine memory pressure rising", desc: "Memory usage at 82% and increasing", confidence: 92, color: "#f0883e" },
    { title: "No pod restart anomalies detected", desc: "Across all namespaces", confidence: 98, color: "#3fb950" },
    { title: "PostgreSQL latency within baseline", desc: "Performance is optimal", confidence: 96, color: "#3fb950" },
];

export function AIInsightsPanel() {
    return (
        <div className="rounded-[12px] border border-[#21262d] bg-[#161b22] p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                    <h3 className="text-[14px] font-semibold text-[#e6edf3]">AI Insights</h3>
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#3fb950]/10 border border-[#3fb950]/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#3fb950]" style={{ boxShadow: "0 0 6px #3fb950", animation: "wi-pulse 2s infinite" }} />
                        <span className="text-[10px] text-[#3fb950] font-semibold">Live</span>
                    </div>
                </div>
                <button className="text-[11px] text-[#58a6ff] hover:text-[#79c0ff] font-medium">View All Insights</button>
            </div>

            {/* 2x2 grid of insights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {INSIGHTS.map((insight, i) => (
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
