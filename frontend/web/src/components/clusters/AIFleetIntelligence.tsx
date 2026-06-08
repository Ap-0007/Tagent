"use client";

// ─── AI Fleet Intelligence + Active Incident Timeline ────────────────────────

const INSIGHTS = [
    { text: "Production US-East is operating normally", sub: "No anomalies detected", confidence: 99, color: "#3fb950" },
    { text: "No pod restart anomalies detected", sub: "Across all production clusters", confidence: 97, color: "#3fb950" },
    { text: "Memory pressure increasing in EU-West", sub: "8% increase in last 15m", confidence: 88, color: "#f0883e" },
    { text: "Deployment risk detected in Staging", sub: "High failure probability detected", confidence: 88, color: "#f85149" },
    { text: "Network latency within baseline", sub: "All clusters performing normally", confidence: 99, color: "#3fb950" },
];

const TIMELINE = [
    { time: "12:31", badge: "Anomaly Detected", desc: "Memory pressure in EU-West", color: "#f85149" },
    { time: "12:34", badge: "Root Cause Identified", desc: "Connection pool exhaustion", color: "#f0883e" },
    { time: "12:36", badge: "Remediation Started", desc: "Scaling connection pool", color: "#a371f7" },
    { time: "12:38", badge: "Incident Resolved", desc: "All systems normal", color: "#3fb950" },
];

export function AIFleetIntelligence() {
    return (
        <>
            {/* AI Fleet Intelligence */}
            <div className="rounded-[12px] border border-[#21262d] bg-[#161b22] p-3.5">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <h3 className="text-[13px] font-semibold text-[#e6edf3]">AI Fleet Intelligence</h3>
                        <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#3fb950]/10 border border-[#3fb950]/30">
                            <span className="w-1 h-1 rounded-full bg-[#3fb950]" style={{ boxShadow: "0 0 4px #3fb950", animation: "wi-pulse 2s infinite" }} />
                            <span className="text-[9px] text-[#3fb950] font-semibold">Live</span>
                        </div>
                    </div>
                    <button className="text-[10px] text-[#58a6ff] hover:text-[#79c0ff]">View all</button>
                </div>
                <div className="space-y-2">
                    {INSIGHTS.map((ins, i) => (
                        <div key={i} className="flex items-start gap-2 p-2 rounded-md bg-[#0d1117] border border-[#21262d] hover:border-[#30363d] transition-colors">
                            <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: ins.color, boxShadow: `0 0 4px ${ins.color}` }} />
                            <div className="flex-1 min-w-0">
                                <p className="text-[11px] text-[#e6edf3] leading-snug">{ins.text}</p>
                                <p className="text-[10px] text-[#8b949e] mt-0.5">{ins.sub}</p>
                            </div>
                            <span className="text-[10px] text-[#8b949e] font-mono shrink-0">Confidence <span className="font-semibold" style={{ color: ins.color }}>{ins.confidence}%</span></span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Active Incident Timeline */}
            <div className="rounded-[12px] border border-[#21262d] bg-[#161b22] p-3.5">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[13px] font-semibold text-[#e6edf3]">Active Incident Timeline</h3>
                    <button className="text-[10px] text-[#58a6ff] hover:text-[#79c0ff]">View all</button>
                </div>
                <div className="space-y-2">
                    {TIMELINE.map((ev, i) => (
                        <div key={i} className="flex items-center gap-2.5">
                            <span className="text-[10px] text-[#6e7681] font-mono w-10 shrink-0">{ev.time}</span>
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: ev.color, boxShadow: `0 0 4px ${ev.color}` }} />
                            <span className="text-[10.5px] font-semibold px-1.5 py-0.5 rounded" style={{ background: `${ev.color}18`, color: ev.color }}>{ev.badge}</span>
                            <span className="text-[10.5px] text-[#8b949e] truncate">{ev.desc}</span>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}
