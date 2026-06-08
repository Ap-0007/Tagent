"use client";

import { useState } from "react";

const WORKLOADS = [
    { name: "API Gateway", sub: "api-gateway", status: "Scaling Up", statusColor: "#3fb950", current: 8, recommended: 10, minMax: "4 / 20", cpu: 68, memory: 62, trend: "↗ Increasing", trendColor: "#3fb950", hpa: "Healthy", vpa: "Active", category: "scaling-up" },
    { name: "Monitoring", sub: "tagent-monitoring", status: "Stable", statusColor: "#58a6ff", current: 4, recommended: 4, minMax: "2 / 10", cpu: 34, memory: 41, trend: "→ Stable", trendColor: "#58a6ff", hpa: "Healthy", vpa: "Active", category: "stable" },
    { name: "AI Engine", sub: "ai-engine", status: "Scaling Up", statusColor: "#3fb950", current: 3, recommended: 6, minMax: "2 / 12", cpu: 82, memory: 76, trend: "↗ Surge", trendColor: "#f0883e", hpa: "Healthy", vpa: "Active", category: "scaling-up" },
    { name: "Checkout Service", sub: "checkout", status: "High Pressure", statusColor: "#f0883e", current: 6, recommended: 6, minMax: "3 / 15", cpu: 87, memory: 71, trend: "↗ Increasing", trendColor: "#f0883e", hpa: "Active", vpa: "Active", category: "scaling-up" },
    { name: "Notification", sub: "notification-svc", status: "Stable", statusColor: "#58a6ff", current: 3, recommended: 3, minMax: "2 / 8", cpu: 28, memory: 35, trend: "→ Stable", trendColor: "#58a6ff", hpa: "Healthy", vpa: "Active", category: "stable" },
    { name: "Worker Job", sub: "worker-batch", status: "Idle", statusColor: "#6e7681", current: 1, recommended: 1, minMax: "1 / 5", cpu: 5, memory: 12, trend: "→ Idle", trendColor: "#6e7681", hpa: "Healthy", vpa: "Inactive", category: "idle" },
    { name: "Remediation", sub: "tagent-remediation", status: "Scaling Down", statusColor: "#22d3ee", current: 4, recommended: 2, minMax: "2 / 6", cpu: 18, memory: 22, trend: "↘ Decreasing", trendColor: "#22d3ee", hpa: "Healthy", vpa: "Active", category: "scaling-down" },
];

const FILTERS = [
    { key: "all", label: "AI", count: 7 },
    { key: "scaling-up", label: "Scaling Up", count: 3 },
    { key: "stable", label: "Stable", count: 8 },
    { key: "scaling-down", label: "Scaling Down", count: 1 },
    { key: "idle", label: "Idle", count: 2 },
];

export function LiveScalingOverview() {
    const [filter, setFilter] = useState("all");
    const [view, setView] = useState<"grid" | "list">("grid");
    const [workloadFilter, setWorkloadFilter] = useState("all");
    const [wfOpen, setWfOpen] = useState(false);

    const workloadOptions = ["all", ...Array.from(new Set(WORKLOADS.map(w => w.sub)))];

    const filtered = WORKLOADS.filter(w => {
        if (filter !== "all" && w.category !== filter) return false;
        if (workloadFilter !== "all" && w.sub !== workloadFilter) return false;
        return true;
    });

    return (
        <div className="rounded-[12px] border border-[#21262d] bg-[#161b22] p-3.5">
            <div className="flex items-center justify-between mb-3">
                <div>
                    <h3 className="text-[14px] font-semibold text-[#e6edf3]">Live Scaling Overview</h3>
                    <p className="text-[10px] text-[#8b949e] mt-0.5">Real-time status of all autoscaled workloads</p>
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                    {/* All Workloads dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setWfOpen(o => !o)}
                            className="flex items-center gap-1 h-7 px-2.5 rounded-md bg-[#0d1117] border border-[#30363d] text-[11px] text-[#8b949e] hover:text-[#e6edf3] hover:border-[#484f58] transition-colors"
                        >
                            {workloadFilter === "all" ? "All Workloads" : workloadFilter}
                            <svg width="9" height="9" viewBox="0 0 12 12" fill="none" className={`transition-transform ${wfOpen ? "rotate-180" : ""}`}><path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </button>
                        {wfOpen && (
                            <div className="absolute top-full mt-1 right-0 z-30 w-44 rounded-md bg-[#161b22] border border-[#30363d] shadow-[0_8px_24px_rgba(0,0,0,0.5)] py-1">
                                {workloadOptions.map(o => (
                                    <button key={o} onClick={() => { setWorkloadFilter(o); setWfOpen(false); }} className={`w-full text-left px-3 py-1.5 text-[11.5px] hover:bg-[#21262d] ${workloadFilter === o ? "text-[#58a6ff]" : "text-[#e6edf3]"}`}>
                                        {o === "all" ? "All Workloads" : o}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    {/* List view */}
                    <button
                        onClick={() => setView("list")}
                        className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${view === "list" ? "bg-[#1f6feb]/20 border border-[#1f6feb]/50 text-[#58a6ff]" : "bg-[#0d1117] border border-[#30363d] text-[#8b949e] hover:text-[#e6edf3]"}`}
                    >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
                            <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
                        </svg>
                    </button>
                    {/* Grid view */}
                    <button
                        onClick={() => setView("grid")}
                        className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${view === "grid" ? "bg-[#1f6feb]/20 border border-[#1f6feb]/50 text-[#58a6ff]" : "bg-[#0d1117] border border-[#30363d] text-[#8b949e] hover:text-[#e6edf3]"}`}
                    >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                            <rect x="3" y="3" width="4" height="4" rx="1" /><rect x="10" y="3" width="4" height="4" rx="1" /><rect x="17" y="3" width="4" height="4" rx="1" />
                            <rect x="3" y="10" width="4" height="4" rx="1" /><rect x="10" y="10" width="4" height="4" rx="1" /><rect x="17" y="10" width="4" height="4" rx="1" />
                            <rect x="3" y="17" width="4" height="4" rx="1" /><rect x="10" y="17" width="4" height="4" rx="1" /><rect x="17" y="17" width="4" height="4" rx="1" />
                        </svg>
                    </button>
                    {/* Status filter tabs */}
                    {FILTERS.map(f => (
                        <button
                            key={f.key}
                            onClick={() => setFilter(f.key)}
                            className={`px-2 py-0.5 rounded transition-colors ${filter === f.key ? "bg-[#1f6feb]/20 text-[#58a6ff] font-semibold" : "text-[#8b949e] hover:text-[#e6edf3]"}`}
                        >
                            {f.label} ({f.count})
                        </button>
                    ))}
                </div>
            </div>

            {/* Empty state */}
            {filtered.length === 0 && (
                <div className="py-8 text-center">
                    <p className="text-[12px] text-[#8b949e]">No workloads match the current filter.</p>
                    <button onClick={() => { setFilter("all"); setWorkloadFilter("all"); }} className="mt-2 text-[11px] text-[#58a6ff]">Clear filters</button>
                </div>
            )}

            {/* Grid view */}
            {filtered.length > 0 && view === "grid" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5">
                    {filtered.map((w, i) => (
                        <div key={i} className="rounded-lg bg-[#0d1117] border border-[#21262d] p-3 hover:border-[#30363d] transition-colors">
                            {/* Header: icon + name + status badge */}
                            <div className="flex items-center justify-between mb-2.5">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 flex items-center justify-center">
                                        <svg width="28" height="28" viewBox="0 0 32 32">
                                            <polygon points="16,2 28,9 28,23 16,30 4,23 4,9" fill={`${w.statusColor}15`} stroke={w.statusColor} strokeWidth="1.5" strokeOpacity="0.7" />
                                            <g transform="translate(16, 16)" style={{ filter: `drop-shadow(0 0 3px ${w.statusColor})` }}>
                                                <path d="M0,-6 L6,-3 L0,0 L-6,-3 Z" fill={w.statusColor} fillOpacity="0.5" stroke={w.statusColor} strokeWidth="0.6" strokeLinejoin="round" />
                                                <path d="M-6,-3 L0,0 L0,6 L-6,3 Z" fill={w.statusColor} fillOpacity="0.2" stroke={w.statusColor} strokeWidth="0.6" strokeLinejoin="round" />
                                                <path d="M6,-3 L0,0 L0,6 L6,3 Z" fill={w.statusColor} fillOpacity="0.35" stroke={w.statusColor} strokeWidth="0.6" strokeLinejoin="round" />
                                            </g>
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-[12px] font-semibold text-[#e6edf3]">{w.name}</p>
                                        <p className="text-[9.5px] text-[#8b949e] font-mono">{w.sub}</p>
                                    </div>
                                </div>
                                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded" style={{ background: `${w.statusColor}18`, color: w.statusColor }}>{w.status}</span>
                            </div>

                            {/* Current + Recommended with bar charts */}
                            <div className="flex items-end gap-4 mb-3">
                                <div className="flex items-center gap-2">
                                    {/* Current donut */}
                                    <div className="relative">
                                        <svg width="40" height="40" viewBox="0 0 40 40">
                                            <circle cx="20" cy="20" r="16" fill="none" stroke="#21262d" strokeWidth="3" />
                                            <circle cx="20" cy="20" r="16" fill="none" stroke={w.statusColor} strokeWidth="3" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 16 * (w.current / w.recommended)} ${2 * Math.PI * 16}`} transform="rotate(-90 20 20)" style={{ filter: `drop-shadow(0 0 3px ${w.statusColor})` }} />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-[12px] font-bold text-[#e6edf3] font-mono">{w.current}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[8.5px] text-[#6e7681]">Current</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[18px] font-bold text-[#3fb950] font-mono leading-none">{w.recommended}</p>
                                    <p className="text-[8.5px] text-[#6e7681]">Recommended</p>
                                </div>
                                {/* Mini bar chart */}
                                <svg width="60" height="28" viewBox="0 0 60 24" className="shrink-0">
                                    {[4, 8, 6, 10, 7, 12, 9, 14, 11, 16].map((h, j) => (
                                        <rect key={j} x={j * 6} y={24 - h} width="4" height={h} rx="0.5" fill={j < 6 ? w.statusColor : "#3fb950"} opacity={0.5 + (h / 16) * 0.5} />
                                    ))}
                                </svg>
                            </div>

                            {/* Min/Max + CPU + Memory row */}
                            <div className="grid grid-cols-3 gap-2 mb-2 text-center">
                                <div>
                                    <p className="text-[8.5px] text-[#6e7681]">Min / Max</p>
                                    <p className="text-[11px] font-bold text-[#e6edf3] font-mono">{w.minMax}</p>
                                </div>
                                <div>
                                    <p className="text-[8.5px] text-[#6e7681]">CPU</p>
                                    <p className="text-[11px] font-bold font-mono" style={{ color: w.cpu > 80 ? "#f85149" : w.cpu > 60 ? "#f0883e" : "#e6edf3" }}>{w.cpu}%</p>
                                    {/* Mini CPU donut */}
                                    <svg width="20" height="20" viewBox="0 0 20 20" className="mx-auto mt-0.5">
                                        <circle cx="10" cy="10" r="7" fill="none" stroke="#21262d" strokeWidth="2" />
                                        <circle cx="10" cy="10" r="7" fill="none" stroke={w.cpu > 80 ? "#f85149" : w.cpu > 60 ? "#f0883e" : "#3fb950"} strokeWidth="2" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 7 * (w.cpu / 100)} ${2 * Math.PI * 7}`} transform="rotate(-90 10 10)" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-[8.5px] text-[#6e7681]">Memory</p>
                                    <p className="text-[11px] font-bold text-[#e6edf3] font-mono">{w.memory}%</p>
                                    <svg width="20" height="20" viewBox="0 0 20 20" className="mx-auto mt-0.5">
                                        <circle cx="10" cy="10" r="7" fill="none" stroke="#21262d" strokeWidth="2" />
                                        <circle cx="10" cy="10" r="7" fill="none" stroke="#a371f7" strokeWidth="2" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 7 * (w.memory / 100)} ${2 * Math.PI * 7}`} transform="rotate(-90 10 10)" />
                                    </svg>
                                </div>
                            </div>

                            {/* Trend sparkline */}
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-[9px] text-[#8b949e]">Trend</span>
                                <svg width="60" height="14" viewBox="0 0 60 12" className="flex-1">
                                    <polyline points="0,10 8,8 16,9 24,6 32,7 40,4 48,5 56,2 60,3" fill="none" stroke={w.trendColor} strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                                <span className="text-[9px] font-semibold" style={{ color: w.trendColor }}>{w.trend}</span>
                            </div>

                            {/* HPA / VPA status */}
                            <div className="flex items-center gap-3 text-[9px] pt-2 border-t border-[#21262d]">
                                <span className="text-[#8b949e]">HPA <span className="text-[#3fb950] font-semibold ml-0.5">● {w.hpa}</span></span>
                                <span className="text-[#8b949e]">VPA <span className="text-[#58a6ff] font-semibold ml-0.5">{w.vpa}</span></span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* List view */}
            {filtered.length > 0 && view === "list" && (
                <div className="space-y-1.5">
                    {filtered.map((w, i) => (
                        <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-md bg-[#0d1117] border border-[#21262d] hover:border-[#30363d] transition-colors">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: w.statusColor, boxShadow: `0 0 4px ${w.statusColor}` }} />
                            <span className="text-[11px] font-semibold text-[#e6edf3] w-[120px] truncate">{w.name}</span>
                            <span className="text-[9.5px] font-semibold px-1.5 py-0.5 rounded shrink-0" style={{ background: `${w.statusColor}18`, color: w.statusColor }}>{w.status}</span>
                            <span className="text-[10px] text-[#8b949e] font-mono">Current: <span className="text-[#e6edf3]">{w.current}</span></span>
                            <span className="text-[10px] text-[#8b949e] font-mono">Rec: <span className="text-[#3fb950]">{w.recommended}</span></span>
                            <span className="text-[10px] font-mono" style={{ color: w.cpu > 80 ? "#f85149" : "#e6edf3" }}>CPU {w.cpu}%</span>
                            <span className="text-[10px] text-[#e6edf3] font-mono">MEM {w.memory}%</span>
                            <span className="text-[9.5px] ml-auto" style={{ color: w.trendColor }}>{w.trend}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
