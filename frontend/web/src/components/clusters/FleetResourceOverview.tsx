"use client";

// ─── Fleet Resource Overview (bottom-right) ──────────────────────────────────

const METRICS = [
    { label: "CPU Utilization", value: "62%", change: "+8%", changeColor: "#f0883e", sparkColor: "#22d3ee", sparkPoints: "0,14 10,12 20,13 30,10 40,11 50,8 60,9 70,6 80,7 90,4 100,5" },
    { label: "Memory Utilization", value: "71%", change: "+5%", changeColor: "#f0883e", sparkColor: "#a371f7", sparkPoints: "0,16 10,14 20,15 30,12 40,13 50,10 60,11 70,8 80,9 90,6 100,7" },
    { label: "Network I/O", value: "1.2Tbps", change: "+12%", changeColor: "#3fb950", sparkColor: "#3fb950", sparkPoints: "0,15 10,13 20,14 30,11 40,12 50,9 60,10 70,7 80,8 90,5 100,6" },
];

export function FleetResourceOverview() {
    return (
        <div className="rounded-[12px] border border-[#21262d] bg-[#161b22] p-3.5">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <h3 className="text-[13px] font-semibold text-[#e6edf3]">Fleet Resource Overview</h3>
                    <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#3fb950]/10 border border-[#3fb950]/30">
                        <span className="w-1 h-1 rounded-full bg-[#3fb950]" style={{ boxShadow: "0 0 4px #3fb950", animation: "wi-pulse 2s infinite" }} />
                        <span className="text-[9px] text-[#3fb950] font-semibold">Live</span>
                    </div>
                </div>
            </div>
            <div className="space-y-3">
                {METRICS.map((m, i) => (
                    <div key={i}>
                        <div className="flex items-baseline justify-between mb-1">
                            <span className="text-[10.5px] text-[#8b949e]">{m.label}</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-[16px] font-bold text-[#e6edf3] font-mono">{m.value}</span>
                                <span className="text-[10px] font-semibold" style={{ color: m.changeColor }}>{m.change}</span>
                            </div>
                        </div>
                        <svg width="100%" height="20" viewBox="0 0 100 18" preserveAspectRatio="none">
                            <defs>
                                <linearGradient id={`fr-${i}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor={m.sparkColor} stopOpacity="0.4" />
                                    <stop offset="100%" stopColor={m.sparkColor} stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            <polygon points={`${m.sparkPoints} 100,18 0,18`} fill={`url(#fr-${i})`} />
                            <polyline points={m.sparkPoints} fill="none" stroke={m.sparkColor} strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                    </div>
                ))}
            </div>
        </div>
    );
}
