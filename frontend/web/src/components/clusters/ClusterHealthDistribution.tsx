"use client";

// ─── Cluster Health Distribution (donut chart) ───────────────────────────────

const SEGMENTS = [
    { label: "Healthy", count: 2, percent: 50, color: "#3fb950" },
    { label: "Warning", count: 1, percent: 25, color: "#f0883e" },
    { label: "Critical", count: 0, percent: 0, color: "#f85149" },
    { label: "Unknown", count: 1, percent: 25, color: "#6e7681" },
];

export function ClusterHealthDistribution() {
    const total = 4;
    const r = 40;
    const c = 2 * Math.PI * r;

    // Build donut segments
    let accumulated = 0;
    const arcs = SEGMENTS.filter(s => s.percent > 0).map(s => {
        const start = accumulated;
        accumulated += s.percent;
        return { ...s, startOffset: c - (start / 100) * c, length: (s.percent / 100) * c };
    });

    return (
        <div className="rounded-[12px] border border-[#21262d] bg-[#161b22] p-3.5">
            <h3 className="text-[13px] font-semibold text-[#e6edf3] mb-3">Cluster Health Distribution</h3>
            <div className="flex items-center gap-4">
                {/* Donut */}
                <div className="relative shrink-0">
                    <svg width="100" height="100" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r={r} fill="none" stroke="#21262d" strokeWidth="8" />
                        {arcs.map((arc, i) => (
                            <circle
                                key={i}
                                cx="50" cy="50" r={r}
                                fill="none"
                                stroke={arc.color}
                                strokeWidth="8"
                                strokeLinecap="round"
                                strokeDasharray={`${arc.length} ${c - arc.length}`}
                                strokeDashoffset={arc.startOffset}
                                transform="rotate(-90 50 50)"
                                style={{ filter: `drop-shadow(0 0 3px ${arc.color})` }}
                            />
                        ))}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-[20px] font-bold text-[#e6edf3] font-mono leading-none">{total}</span>
                        <span className="text-[9px] text-[#8b949e]">Total</span>
                    </div>
                </div>
                {/* Legend */}
                <div className="space-y-2">
                    {SEGMENTS.map((s, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
                            <span className="text-[11px] text-[#8b949e]">{s.label}</span>
                            <span className="text-[11px] text-[#e6edf3] font-mono font-semibold ml-auto">{s.count} ({s.percent}%)</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
