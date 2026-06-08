"use client";

// ─── Top stat row: Total Nodes, Cluster Health, Active Workloads, Infrastructure Pulse, Infrastructure Insight ───

export function NodesStatsRow() {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-[1fr_1.2fr_1fr_1fr_1.6fr] gap-3">
            <TotalNodesCard count={24} />
            <ClusterHealthCard score={94} />
            <ActiveWorkloadsCard count={326} />
            <InfrastructurePulseCard />
            <InfrastructureInsightCard />
        </div>
    );
}

// ─── Card 1: Total Nodes ─────────────────────────────────────────────────────

function TotalNodesCard({ count }: { count: number }) {
    return (
        <div
            className="relative rounded-[12px] border border-[#21262d] bg-[#161b22] overflow-hidden hover:border-[#30363d] transition-colors p-3.5"
            style={{ background: `radial-gradient(circle at 80% 30%, rgba(63, 185, 80, 0.12) 0%, transparent 55%), #161b22` }}
        >
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-[11px] text-[#8b949e] font-medium mb-1.5">Total Nodes</p>
                    <p className="text-[32px] font-bold text-[#e6edf3] leading-none tracking-tight">{count}</p>
                    <p className="text-[10.5px] text-[#3fb950] mt-2 font-medium">↗ 2 this week</p>
                </div>
                <ServerStackIcon />
            </div>
        </div>
    );
}

function ServerStackIcon() {
    return (
        <div className="relative w-[52px] h-[52px] flex items-center justify-center shrink-0">
            <svg width="48" height="48" viewBox="0 0 48 48" style={{ filter: "drop-shadow(0 0 4px rgba(59,130,246,0.5))" }}>
                <defs>
                    <linearGradient id="srv-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#58a6ff" />
                        <stop offset="100%" stopColor="#1f6feb" />
                    </linearGradient>
                </defs>
                {/* Stack of 3 server units */}
                {[0, 1, 2].map(i => (
                    <g key={i} transform={`translate(0, ${i * 12})`}>
                        <rect x="8" y="6" width="32" height="10" rx="1.5" fill="url(#srv-grad)" fillOpacity="0.25" stroke="#58a6ff" strokeWidth="1" strokeOpacity="0.8" />
                        <circle cx="13" cy="11" r="1.2" fill="#3fb950" style={{ filter: "drop-shadow(0 0 2px #3fb950)" }} />
                        <line x1="18" y1="11" x2="35" y2="11" stroke="#58a6ff" strokeWidth="0.6" strokeOpacity="0.5" />
                    </g>
                ))}
            </svg>
        </div>
    );
}

// ─── Card 2: Cluster Health Score (with donut) ───────────────────────────────

function ClusterHealthCard({ score }: { score: number }) {
    const r = 24;
    const c = 2 * Math.PI * r;
    const offset = c - (score / 100) * c;
    return (
        <div
            className="relative rounded-[12px] border border-[#21262d] bg-[#161b22] overflow-hidden hover:border-[#30363d] transition-colors p-3.5"
            style={{ background: `radial-gradient(circle at 80% 50%, rgba(63, 185, 80, 0.15) 0%, transparent 55%), #161b22` }}
        >
            <div className="flex items-start justify-between gap-3 h-full">
                <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#3fb950]" style={{ boxShadow: "0 0 4px #3fb950", animation: "wi-pulse 2s infinite" }} />
                        <p className="text-[11px] text-[#8b949e] font-medium">Cluster Health Score</p>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-[32px] font-bold text-[#e6edf3] leading-none tracking-tight">{score}</span>
                        <span className="text-[14px] text-[#6e7681] font-medium">/100</span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#3fb950] mt-2">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Excellent
                    </span>
                </div>
                <div className="shrink-0 relative">
                    <svg width="60" height="60" viewBox="0 0 60 60">
                        <defs>
                            <linearGradient id="ch-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#3fb950" />
                                <stop offset="100%" stopColor="#22d3ee" />
                            </linearGradient>
                        </defs>
                        <circle cx="30" cy="30" r={r} fill="none" stroke="#21262d" strokeWidth="5" />
                        <circle cx="30" cy="30" r={r} fill="none" stroke="url(#ch-grad)" strokeWidth="5" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset} transform="rotate(-90 30 30)" style={{ filter: "drop-shadow(0 0 4px rgba(63,185,80,0.6))" }} />
                    </svg>
                </div>
            </div>
        </div>
    );
}

// ─── Card 3: Active Workloads ────────────────────────────────────────────────

function ActiveWorkloadsCard({ count }: { count: number }) {
    return (
        <div
            className="relative rounded-[12px] border border-[#21262d] bg-[#161b22] overflow-hidden hover:border-[#30363d] transition-colors p-3.5"
            style={{ background: `radial-gradient(circle at 90% 30%, rgba(34, 211, 238, 0.12) 0%, transparent 55%), #161b22` }}
        >
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-[11px] text-[#8b949e] font-medium mb-1.5">Active Workloads</p>
                    <p className="text-[32px] font-bold text-[#e6edf3] leading-none tracking-tight">{count}</p>
                    <p className="text-[10.5px] text-[#3fb950] mt-2 font-medium">↗ 18 this week</p>
                </div>
                <div className="text-[#22d3ee] text-[20px] font-bold opacity-60" style={{ filter: "drop-shadow(0 0 4px #22d3ee)" }}>3<sub className="text-[12px]">26</sub></div>
            </div>
        </div>
    );
}

// ─── Card 4: Infrastructure Pulse (waveform) ─────────────────────────────────

function InfrastructurePulseCard() {
    // Simulated pulse waveform
    const points = Array.from({ length: 50 }, (_, i) => {
        const x = i * 2.5;
        const y = 20 + Math.sin(i * 0.6) * 5 + (Math.sin(i * 1.7) * 4) + (i % 7 === 0 ? -8 : 0) + (i % 11 === 0 ? 6 : 0);
        return `${x},${y}`;
    }).join(" ");

    return (
        <div
            className="relative rounded-[12px] border border-[#21262d] bg-[#161b22] overflow-hidden hover:border-[#30363d] transition-colors p-3.5"
            style={{ background: `radial-gradient(circle at 90% 30%, rgba(63, 185, 80, 0.10) 0%, transparent 55%), #161b22` }}
        >
            <div className="flex items-start justify-between gap-3 mb-2">
                <p className="text-[11px] text-[#8b949e] font-medium">Infrastructure Pulse</p>
                <button className="w-5 h-5 rounded-full bg-[#21262d] border border-[#30363d] flex items-center justify-center text-[#8b949e] hover:text-[#e6edf3] transition-colors">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                </button>
            </div>
            <div className="flex items-center gap-1.5 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3fb950]" style={{ boxShadow: "0 0 4px #3fb950", animation: "wi-pulse 1.4s infinite" }} />
                <span className="text-[14px] font-bold text-[#3fb950]">Live</span>
            </div>
            <svg width="100%" height="36" viewBox="0 0 125 40" preserveAspectRatio="none">
                <defs>
                    <linearGradient id="pulse-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#3fb950" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#3fb950" stopOpacity="0" />
                    </linearGradient>
                </defs>
                <polygon points={`${points} 125,40 0,40`} fill="url(#pulse-grad)" />
                <polyline points={points} fill="none" stroke="#3fb950" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" style={{ filter: "blur(2px)" }} />
                <polyline points={points} fill="none" stroke="#3fb950" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
        </div>
    );
}

// ─── Card 5: Infrastructure Insight (wide) ───────────────────────────────────

function InfrastructureInsightCard() {
    return (
        <div
            className="relative rounded-[12px] border border-[#21262d] bg-[#161b22] overflow-hidden hover:border-[#30363d] transition-colors p-3.5"
            style={{ background: `radial-gradient(circle at 95% 30%, rgba(124, 58, 237, 0.18) 0%, transparent 55%), #161b22` }}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1.5">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="#a371f7"><path d="M12 0L14 9L24 12L14 15L12 24L10 15L0 12L10 9Z" /></svg>
                        <p className="text-[12px] text-[#a371f7] font-semibold">Infrastructure Insight</p>
                    </div>
                    <p className="text-[12px] text-[#e6edf3] leading-relaxed">All systems operational. 2 nodes showing early signs of CPU saturation. AI recommends proactive scaling.</p>
                    <div className="flex items-center gap-2 mt-3">
                        <span className="text-[10.5px] text-[#8b949e]">Confidence</span>
                        <div className="flex-1 h-1 rounded-full bg-[#21262d] overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: "96%", background: "linear-gradient(90deg, #a371f7, #3fb950)", boxShadow: "0 0 4px #3fb950" }} />
                        </div>
                        <span className="text-[11px] text-[#3fb950] font-mono font-bold">96%</span>
                    </div>
                </div>
                <BrainNetworkIcon />
            </div>
        </div>
    );
}

function BrainNetworkIcon() {
    return (
        <svg width="64" height="64" viewBox="0 0 64 64" className="shrink-0" style={{ filter: "drop-shadow(0 0 6px rgba(124,58,237,0.5))" }}>
            <defs>
                <radialGradient id="brain-grad">
                    <stop offset="0%" stopColor="#a371f7" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#a371f7" stopOpacity="0.1" />
                </radialGradient>
            </defs>
            {/* Outer rings */}
            {[18, 26].map((r, i) => (
                <circle key={i} cx="32" cy="32" r={r} fill="none" stroke="#a371f7" strokeWidth="0.6" strokeOpacity="0.4" strokeDasharray="2 3" />
            ))}
            {/* Network nodes */}
            <circle cx="32" cy="32" r="14" fill="url(#brain-grad)" stroke="#a371f7" strokeWidth="1.2" />
            {[
                { x: 18, y: 18 }, { x: 46, y: 18 }, { x: 50, y: 32 }, { x: 46, y: 46 },
                { x: 18, y: 46 }, { x: 14, y: 32 }, { x: 32, y: 12 }, { x: 32, y: 52 },
            ].map((p, i) => (
                <g key={i}>
                    <line x1="32" y1="32" x2={p.x} y2={p.y} stroke="#a371f7" strokeWidth="0.6" strokeOpacity="0.5" />
                    <circle cx={p.x} cy={p.y} r="2" fill="#a371f7" style={{ filter: "drop-shadow(0 0 2px #a371f7)" }} />
                </g>
            ))}
            <circle cx="32" cy="32" r="3" fill="#fff" style={{ filter: "drop-shadow(0 0 4px #a371f7)" }} />
        </svg>
    );
}
