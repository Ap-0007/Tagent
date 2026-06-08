"use client";

const METRICS = [
    { label: "CPU", value: 62, waste: "14%", wasteCost: "$890", color: "#3fb950" },
    { label: "Memory", value: 68, waste: "18%", wasteCost: "$480", color: "#a371f7" },
    { label: "Storage", value: 81, waste: "7%", wasteCost: "$210", color: "#22d3ee" },
    { label: "GPU", value: 24, waste: "7%", wasteCost: "$1,780", color: "#f0883e" },
    { label: "Network", value: 93, waste: "7%", wasteCost: "$210", color: "#3fb950" },
];

export function ResourceEfficiencyCenter() {
    return (
        <div className="rounded-[12px] border border-[#21262d] bg-[#161b22] p-3.5">
            <h3 className="text-[13px] font-semibold text-[#e6edf3] mb-3">Resource Efficiency Center</h3>
            <div className="grid grid-cols-2 gap-3">
                {METRICS.map((m, i) => {
                    const r = 20; const c = 2 * Math.PI * r;
                    const offset = c - (m.value / 100) * c;
                    return (
                        <div key={i} className="flex items-center gap-2.5 p-2 rounded-md bg-[#0d1117] border border-[#21262d]">
                            <div className="relative shrink-0">
                                <svg width="48" height="48" viewBox="0 0 48 48">
                                    <circle cx="24" cy="24" r={r} fill="none" stroke="#21262d" strokeWidth="4" />
                                    <circle cx="24" cy="24" r={r} fill="none" stroke={m.color} strokeWidth="4" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset} transform="rotate(-90 24 24)" style={{ filter: `drop-shadow(0 0 3px ${m.color})` }} />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-[10px] font-bold font-mono" style={{ color: m.color }}>{m.value}%</span>
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: m.color }} />
                                    <span className="text-[11px] font-semibold text-[#e6edf3]">{m.label}</span>
                                </div>
                                <p className="text-[10px] text-[#8b949e] mt-0.5">{m.waste} Waste</p>
                                <p className="text-[10px] text-[#f0883e] font-mono font-semibold">{m.wasteCost}</p>
                                <p className="text-[9px] text-[#6e7681]">Potential Savings</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
