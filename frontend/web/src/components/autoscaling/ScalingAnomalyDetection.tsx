"use client";

// ─── Scaling Anomaly Detection (compact card layout) ─────────────────────────

const ANOMALIES = [
    { icon: "warning", title: "Unexpected scale spike", sub: "API Engine scaled 3x in 8 minutes", confidence: 95, color: "#f0883e" },
    { icon: "oscillate", title: "Oscillating replicas", sub: "", confidence: 91, color: "#f85149" },
    { icon: "frequency", title: "High scale event frequency", sub: "", confidence: 86, color: "#f0883e" },
    { icon: "flapping", title: "CPU threshold flapping", sub: "", confidence: 93, color: "#f85149" },
];

export function ScalingAnomalyDetection() {
    return (
        <div className="rounded-[12px] border border-[#21262d] bg-[#161b22] p-3.5">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-semibold text-[#e6edf3]">Scaling Anomaly Detection</h3>
                <button className="text-[10px] text-[#8b949e] px-2 py-0.5 rounded-md border border-[#30363d] hover:text-[#e6edf3] hover:border-[#484f58] transition-colors">View all</button>
            </div>

            {/* Main anomaly (featured) */}
            <div className="flex items-start gap-3 mb-3 p-2.5 rounded-md bg-[#0d1117] border border-[#21262d]">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(240,136,62,0.15)", border: "2px solid #f0883e" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f0883e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-[#e6edf3]">Unexpected scale spike</p>
                    <p className="text-[10.5px] text-[#8b949e] mt-0.5">API Engine scaled 3x in 8 minutes</p>
                </div>
                <div className="text-right shrink-0">
                    <p className="text-[9px] text-[#8b949e]">Confidence</p>
                    <p className="text-[16px] font-bold text-[#e6edf3] font-mono">95%</p>
                </div>
            </div>

            {/* Secondary anomalies (compact list) */}
            <div className="space-y-1.5 mb-3">
                {ANOMALIES.slice(1).map((a, i) => (
                    <div key={i} className="flex items-center gap-2 text-[10.5px]">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: a.color, boxShadow: `0 0 4px ${a.color}` }} />
                        <span className="text-[#e6edf3] flex-1">{a.title}</span>
                        <span className="text-[#8b949e] font-mono shrink-0">{a.confidence}%</span>
                    </div>
                ))}
            </div>

            {/* Root Cause section */}
            <div className="pt-3 border-t border-[#21262d]">
                <p className="text-[10px] text-[#8b949e] font-semibold mb-1">Root Cause</p>
                <p className="text-[11px] text-[#e6edf3]">Traffic surge from external service</p>
                <p className="text-[10px] text-[#8b949e] mt-1.5">Affected</p>
                <p className="text-[11px] text-[#e6edf3]">ai-engine, geo-workers</p>
                <p className="text-[10px] text-[#8b949e] mt-1.5">Recommended Action</p>
                <p className="text-[11px] text-[#e6edf3]">Review external traffic pattern</p>
                <button className="mt-2.5 px-3 py-1.5 rounded-md text-[10px] font-semibold text-white" style={{ background: "linear-gradient(135deg, #f0883e, #f85149)", boxShadow: "0 0 8px rgba(248,81,73,0.3)" }}>
                    Investigate
                </button>
            </div>
        </div>
    );
}
