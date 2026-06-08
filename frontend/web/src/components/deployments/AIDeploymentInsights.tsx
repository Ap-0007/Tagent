"use client";

const INSIGHTS = [
    { text: "Deployment fleet is healthy", sub: "No critical issues detected across all namespaces", confidence: 99, color: "#3fb950" },
    { text: "Ollama deployment unavailable", sub: "Replica set is 0/2 for 2h 40m", confidence: 91, color: "#f85149" },
    { text: "Elevated rollout risk detected in staging", sub: "Image pull latency and readiness time increased", confidence: 94, color: "#f0883e" },
    { text: "No restart anomalies observed", sub: "All deployments stable", confidence: 96, color: "#3fb950" },
    { text: "PostgreSQL operating normally", sub: "Performance within baseline", confidence: 98, color: "#3fb950" },
];

export function AIDeploymentInsights() {
    return (
        <div className="rounded-[12px] border border-[#21262d] bg-[#161b22] p-3.5 flex flex-col">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <h3 className="text-[13px] font-semibold text-[#e6edf3]">AI Deployment Insights</h3>
                    <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#3fb950]/10 border border-[#3fb950]/30">
                        <span className="w-1 h-1 rounded-full bg-[#3fb950]" style={{ boxShadow: "0 0 4px #3fb950", animation: "wi-pulse 2s infinite" }} />
                        <span className="text-[9px] text-[#3fb950] font-semibold">Live</span>
                    </div>
                </div>
                <button className="text-[10px] text-[#58a6ff] hover:text-[#79c0ff]">View all</button>
            </div>
            <div className="space-y-2 flex-1">
                {INSIGHTS.map((ins, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded-md bg-[#0d1117] border border-[#21262d]">
                        <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: ins.color, boxShadow: `0 0 4px ${ins.color}` }} />
                        <div className="flex-1 min-w-0">
                            <p className="text-[11px] text-[#e6edf3] leading-snug">{ins.text}</p>
                            <p className="text-[10px] text-[#8b949e] mt-0.5">{ins.sub}</p>
                        </div>
                        <span className="text-[10px] text-[#8b949e] font-mono shrink-0">Confidence <span className="font-semibold" style={{ color: ins.color }}>{ins.confidence}%</span></span>
                    </div>
                ))}
            </div>

            {/* Risk Analysis section */}
            <div className="mt-3 pt-3 border-t border-[#21262d]">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <h4 className="text-[12px] font-semibold text-[#e6edf3]">Risk Analysis</h4>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase" style={{ background: "rgba(248,81,73,0.15)", color: "#f85149" }}>Critical</span>
                    </div>
                    <button className="text-[10px] text-[#58a6ff]">View full analysis</button>
                </div>
                <div className="rounded-md bg-[#0d1117] border border-[#21262d] p-2.5">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-[10px] text-[#8b949e]">Deployment</p>
                            <p className="text-[12px] font-semibold text-[#e6edf3]">tagent-ollama</p>
                            <p className="text-[10px] text-[#8b949e] mt-1">Issue</p>
                            <p className="text-[11px] text-[#f85149] font-medium">Replica unavailable</p>
                            <p className="text-[10px] text-[#8b949e] mt-1">Likely Cause</p>
                            <p className="text-[11px] text-[#e6edf3]">Image pull delay</p>
                        </div>
                        <div className="text-right shrink-0">
                            <p className="text-[9px] text-[#8b949e]">Confidence</p>
                            <p className="text-[18px] font-bold text-[#3fb950] font-mono">91%</p>
                        </div>
                    </div>
                    <div className="mt-2">
                        <p className="text-[10px] text-[#8b949e]">Suggested Action</p>
                        <p className="text-[10.5px] text-[#e6edf3]">Verify image registry availability and network access.</p>
                    </div>
                    <button className="mt-2 w-full py-1.5 rounded-md text-[11px] font-semibold text-white" style={{ background: "linear-gradient(135deg, #1f6feb, #7c3aed)", boxShadow: "0 0 8px rgba(124,58,237,0.3)" }}>
                        View Remediation Steps
                    </button>
                </div>
            </div>
        </div>
    );
}
