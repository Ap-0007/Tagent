"use client";

// ─── Bottom status bar ───────────────────────────────────────────────────────

export function InfrastructureStatusBar() {
    return (
        <div className="rounded-[10px] border border-[#21262d] bg-[#161b22] px-4 py-2.5 flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px]">
            <div className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3fb950" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
                <span className="text-[#8b949e]">Infrastructure Pulse</span>
                <span className="inline-flex items-center gap-1 text-[#3fb950] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3fb950]" style={{ boxShadow: "0 0 4px #3fb950", animation: "wi-pulse 2s infinite" }} />
                    Live
                </span>
            </div>
            <Stat icon="server" iconColor="#58a6ff" value="24" label="Nodes Online" />
            <Stat icon="layers" iconColor="#a371f7" value="326" label="Workloads Running" />
            <Stat icon="memory" iconColor="#22d3ee" value="2.4 TB" label="Total Memory" />
            <Stat icon="storage" iconColor="#3fb950" value="45.7 TB" label="Total Storage" />
            <Stat icon="network" iconColor="#58a6ff" value="3.2 Tbps" label="Network Throughput" />
            <div className="flex items-center gap-2 ml-auto">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3fb950" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <polyline points="9 12 11 14 15 10" />
                </svg>
                <span className="text-[#3fb950] font-mono font-bold">99.99%</span>
                <span className="text-[#8b949e]">Infrastructure SLA</span>
            </div>
        </div>
    );
}

function Stat({ icon, iconColor, value, label }: { icon: string; iconColor: string; value: string; label: string }) {
    return (
        <div className="flex items-center gap-2">
            <StatIcon icon={icon} color={iconColor} />
            <span className="font-bold text-[#e6edf3] font-mono">{value}</span>
            <span className="text-[#8b949e]">{label}</span>
        </div>
    );
}

function StatIcon({ icon, color }: { icon: string; color: string }) {
    const props = { width: 14, height: 14, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
    if (icon === "server") return (
        <svg {...props}>
            <rect x="2" y="2" width="20" height="8" rx="2" />
            <rect x="2" y="14" width="20" height="8" rx="2" />
            <line x1="6" y1="6" x2="6.01" y2="6" />
            <line x1="6" y1="18" x2="6.01" y2="18" />
        </svg>
    );
    if (icon === "layers") return (
        <svg {...props}>
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
        </svg>
    );
    if (icon === "memory") return (
        <svg {...props}>
            <rect x="3" y="6" width="18" height="12" rx="2" />
            <line x1="7" y1="10" x2="7" y2="14" />
            <line x1="11" y1="10" x2="11" y2="14" />
            <line x1="15" y1="10" x2="15" y2="14" />
            <line x1="19" y1="10" x2="19" y2="14" />
        </svg>
    );
    if (icon === "storage") return (
        <svg {...props}>
            <ellipse cx="12" cy="5" rx="9" ry="3" />
            <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" />
            <path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3" />
        </svg>
    );
    // network
    return (
        <svg {...props}>
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
    );
}
