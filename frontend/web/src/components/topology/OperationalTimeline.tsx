"use client";

// ─── Operational Timeline (bottom-left) ──────────────────────────────────────

const EVENTS = [
    { time: "12:31", label: "Anomaly Detected", desc: "High error rate in PostgreSQL", color: "#f85149", icon: "alert" },
    { time: "12:32", label: "Root Cause Identified", desc: "AI analysis completed. Confidence 94%", color: "#f0883e", icon: "search" },
    { time: "12:33", label: "Remediation Suggested", desc: "Scale connection pool from 20 to 50", color: "#a371f7", icon: "sparkle" },
    { time: "12:35", label: "Remediation Executed", desc: "Connection pool scaled automatically", color: "#3fb950", icon: "check", active: true },
    { time: "12:36", label: "Recovery Confirmed", desc: "Error rate back to normal", color: "#3fb950", icon: "shield" },
];

export function OperationalTimeline() {
    return (
        <div className="rounded-[12px] border border-[#21262d] bg-[#161b22] p-4">
            {/* Header */}
            <div className="flex items-center gap-2.5 mb-4">
                <h3 className="text-[14px] font-semibold text-[#e6edf3]">Operational Timeline</h3>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#3fb950]/10 border border-[#3fb950]/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3fb950]" style={{ boxShadow: "0 0 6px #3fb950", animation: "wi-pulse 2s infinite" }} />
                    <span className="text-[10px] text-[#3fb950] font-semibold">Live</span>
                </div>
            </div>

            {/* Timeline bar */}
            <div className="relative mb-4">
                <div className="flex items-center justify-between text-[10px] text-[#6e7681] font-mono mb-2">
                    {["12:31", "12:32", "12:33", "12:34", "12:35", "12:36", "12:37"].map(t => (
                        <span key={t} className={t === "12:35" ? "text-[#3fb950] font-bold text-[11px]" : ""}>{t}</span>
                    ))}
                </div>
                <div className="relative h-1.5 rounded-full bg-[#21262d] overflow-hidden">
                    <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: "70%", background: "linear-gradient(90deg, #f85149, #f0883e, #a371f7, #3fb950)", boxShadow: "0 0 6px rgba(63,185,80,0.4)" }} />
                </div>
                {/* Play button */}
                <button className="absolute right-0 top-0 w-6 h-6 rounded-full bg-[#21262d] border border-[#30363d] flex items-center justify-center text-[#8b949e] hover:text-[#e6edf3] transition-colors">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                </button>
            </div>

            {/* Event cards */}
            <div className="flex items-start gap-3 overflow-x-auto pb-1">
                {EVENTS.map((ev, i) => (
                    <div key={i} className={`shrink-0 w-[140px] rounded-md p-2.5 border ${ev.active ? "bg-[#3fb950]/5 border-[#3fb950]/30" : "bg-[#0d1117] border-[#21262d]"}`}>
                        <div className="flex items-center gap-1.5 mb-1">
                            <EventIcon icon={ev.icon} color={ev.color} />
                            <span className="text-[10px] font-semibold" style={{ color: ev.color }}>{ev.label}</span>
                        </div>
                        <p className="text-[9.5px] text-[#8b949e] leading-snug">{ev.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

function EventIcon({ icon, color }: { icon: string; color: string }) {
    const props = { width: 12, height: 12, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 2.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
    if (icon === "alert") return (<svg {...props}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>);
    if (icon === "search") return (<svg {...props}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>);
    if (icon === "sparkle") return (<svg {...props} fill={color} stroke="none"><path d="M12 0L14 9L24 12L14 15L12 24L10 15L0 12L10 9Z" /></svg>);
    if (icon === "check") return (<svg {...props}><polyline points="20 6 9 17 4 12" /></svg>);
    // shield
    return (<svg {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" /></svg>);
}
