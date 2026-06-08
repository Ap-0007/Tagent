"use client";

const STEPS = [
    { label: "Created", time: "1:02 PM", desc: "Deployment created. Version: v2.4.1 By: arjunpatel", color: "#58a6ff", done: true },
    { label: "Rollout Started", time: "1:03 PM", desc: "Rolling update started. Strategy: RollingUpdate. Max Unavailable: 1", color: "#22d3ee", done: true },
    { label: "Replica Updated", time: "1:03 PM", desc: "Pods updated. 3/6 replicas updated. No errors.", color: "#a371f7", done: true },
    { label: "Readiness Achieved", time: "1:05 PM", desc: "All pods ready. All replicas ready. Available: 6/6. Probes passed.", color: "#3fb950", done: true },
    { label: "Stabilized", time: "1:08 PM", desc: "Deployment stable. Duration: 5m 12s", color: "#3fb950", done: true },
];

export function RolloutTimeline() {
    return (
        <div className="rounded-[12px] border border-[#21262d] bg-[#161b22] p-3.5">
            <div className="flex items-center gap-2.5 mb-3">
                <h3 className="text-[13px] font-semibold text-[#e6edf3]">Rollout Timeline</h3>
                <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#3fb950]/10 border border-[#3fb950]/30">
                    <span className="w-1 h-1 rounded-full bg-[#3fb950]" style={{ boxShadow: "0 0 4px #3fb950", animation: "wi-pulse 2s infinite" }} />
                    <span className="text-[9px] text-[#3fb950] font-semibold">Live</span>
                </div>
            </div>

            {/* Horizontal step indicators */}
            <div className="flex items-center gap-1 mb-3 overflow-x-auto pb-1">
                {STEPS.map((s, i) => (
                    <div key={i} className="flex items-center gap-1 shrink-0">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: `${s.color}20`, border: `2px solid ${s.color}` }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        </div>
                        {i < STEPS.length - 1 && <div className="w-6 h-0.5 rounded-full" style={{ background: s.color, opacity: 0.5 }} />}
                    </div>
                ))}
            </div>

            {/* Step details */}
            <div className="space-y-2">
                {STEPS.map((s, i) => (
                    <div key={i} className="flex items-start gap-2">
                        <span className="text-[9px] text-[#6e7681] font-mono w-12 shrink-0 mt-0.5">{s.time}</span>
                        <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: s.color }} />
                        <div>
                            <p className="text-[10.5px] font-semibold" style={{ color: s.color }}>{s.label}</p>
                            <p className="text-[9.5px] text-[#8b949e] leading-snug">{s.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
