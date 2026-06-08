"use client";

// ─── Dashboard KPI Cards (4 cards matching reference) ───────────────────────

export function DashboardKPIs({
    healthScore,
    activeIncidents,
    criticalCount,
    warningCount,
    services,
    remediations,
}: {
    healthScore: number;
    activeIncidents: number;
    criticalCount: number;
    warningCount: number;
    services: number;
    remediations: number;
}) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            {/* Cluster Health */}
            <ClusterHealthCard score={healthScore} />

            {/* AI Incident Analysis */}
            <IncidentAnalysisCard
                count={activeIncidents}
                criticalCount={criticalCount}
                warningCount={warningCount}
            />

            {/* Active Services */}
            <ActiveServicesCard count={services} />

            {/* Autonomous Remediation */}
            <RemediationCard count={remediations} />
        </div>
    );
}

// ─── Card 1: Cluster Health (with green ring) ───────────────────────────────

function ClusterHealthCard({ score }: { score: number }) {
    const r = 28;
    const circumference = 2 * Math.PI * r;
    const offset = circumference - (score / 100) * circumference;

    return (
        <div
            className="relative rounded-[12px] border border-[#21262d] bg-[#161b22] overflow-hidden hover:border-[#30363d] transition-colors"
            style={{
                background: `radial-gradient(circle at 80% 30%, rgba(63, 185, 80, 0.15) 0%, transparent 55%), #161b22`,
            }}
        >
            <div className="px-4 pt-4 pb-2 flex items-start justify-between gap-3">
                <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-2.5">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3fb950" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                        </svg>
                        <span className="text-[12px] text-[#3fb950] font-semibold">Cluster Health</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-[36px] font-bold text-[#e6edf3] leading-none tracking-tight">{score}</span>
                        <span className="text-[14px] text-[#6e7681] font-medium">/100</span>
                    </div>
                    <div className="mt-2">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#3fb950]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#3fb950]" style={{ boxShadow: "0 0 4px #3fb950" }} />
                            Excellent
                        </span>
                    </div>
                </div>
                {/* Donut ring */}
                <div className="shrink-0 relative">
                    <svg width="68" height="68" viewBox="0 0 68 68">
                        <defs>
                            <linearGradient id="health-grad-dash" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#3fb950" />
                                <stop offset="100%" stopColor="#22d3ee" />
                            </linearGradient>
                        </defs>
                        <circle cx="34" cy="34" r={r} fill="none" stroke="#21262d" strokeWidth="5" />
                        <circle
                            cx="34" cy="34" r={r}
                            fill="none"
                            stroke="url(#health-grad-dash)"
                            strokeWidth="5"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            transform="rotate(-90 34 34)"
                            style={{ filter: "drop-shadow(0 0 4px rgba(63,185,80,0.6))" }}
                        />
                    </svg>
                </div>
            </div>
            {/* Full-width sparkline */}
            <div className="h-[44px] px-1 pb-1">
                <Sparkline
                    points="0,18 10,16 20,14 30,15 40,11 50,13 60,8 70,10 80,6 90,8 100,5 110,7 120,4 130,6 140,3 150,5 160,2 170,4 180,3"
                    color="#3fb950"
                />
            </div>
        </div>
    );
}

// ─── Card 2: AI Incident Analysis ────────────────────────────────────────────

function IncidentAnalysisCard({ count, criticalCount, warningCount }: { count: number; criticalCount: number; warningCount: number }) {
    return (
        <div
            className="relative rounded-[12px] border border-[#21262d] bg-[#161b22] overflow-hidden hover:border-[#30363d] transition-colors"
            style={{
                background: `radial-gradient(circle at 80% 30%, rgba(168, 85, 247, 0.15) 0%, transparent 55%), #161b22`,
            }}
        >
            <div className="px-4 pt-4 pb-2">
                <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-1.5">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a371f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                        <span className="text-[12px] text-[#a371f7] font-semibold">AI Incident Analysis</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px]">
                        {criticalCount > 0 && (
                            <span className="flex items-center gap-1 text-[#f85149] font-semibold">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#f85149]" style={{ boxShadow: "0 0 4px #f85149" }} />
                                {criticalCount} Critical
                            </span>
                        )}
                        {warningCount > 0 && (
                            <span className="flex items-center gap-1 text-[#f0883e] font-semibold">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#f0883e]" style={{ boxShadow: "0 0 4px #f0883e" }} />
                                {warningCount} Warning
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex items-end justify-between">
                    <div>
                        <p className="text-[36px] font-bold text-[#e6edf3] leading-none tracking-tight">{count}</p>
                        <p className="text-[11px] text-[#8b949e] mt-1">Active Incidents</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] text-[#8b949e]">Confidence</p>
                        <p className="text-[18px] font-bold text-[#a371f7] font-mono">94%</p>
                    </div>
                </div>
            </div>
            <div className="h-[44px] px-1 pb-1">
                <Sparkline
                    points="0,12 10,14 20,10 30,16 40,8 50,18 60,6 70,15 80,9 90,17 100,7 110,14 120,11 130,18 140,5 150,13 160,8 170,15 180,9"
                    color="#a371f7"
                />
            </div>
        </div>
    );
}

// ─── Card 3: Active Services ─────────────────────────────────────────────────

function ActiveServicesCard({ count }: { count: number }) {
    return (
        <div
            className="relative rounded-[12px] border border-[#21262d] bg-[#161b22] overflow-hidden hover:border-[#30363d] transition-colors"
            style={{
                background: `radial-gradient(circle at 85% 30%, rgba(34, 211, 238, 0.15) 0%, transparent 55%), #161b22`,
            }}
        >
            <div className="px-4 pt-4 pb-2 flex items-start justify-between gap-3">
                <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-2.5">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <line x1="3" y1="9" x2="21" y2="9" />
                            <line x1="9" y1="21" x2="9" y2="9" />
                        </svg>
                        <span className="text-[12px] text-[#22d3ee] font-semibold">Active Services</span>
                    </div>
                    <p className="text-[36px] font-bold text-[#e6edf3] leading-none tracking-tight">{count}</p>
                    <p className="text-[11px] text-[#3fb950] mt-2 font-medium">↑ 12 this week</p>
                </div>
                <Hexagon color="#22d3ee">
                    <CubeIcon color="#22d3ee" />
                </Hexagon>
            </div>
            <div className="h-[44px] px-1 pb-1">
                <Sparkline
                    points="0,18 10,17 20,15 30,16 40,13 50,14 60,11 70,12 80,9 90,10 100,7 110,9 120,6 130,8 140,4 150,6 160,3 170,5 180,2"
                    color="#22d3ee"
                />
            </div>
        </div>
    );
}

// ─── Card 4: Autonomous Remediation ─────────────────────────────────────────

function RemediationCard({ count }: { count: number }) {
    return (
        <div
            className="relative rounded-[12px] border border-[#21262d] bg-[#161b22] overflow-hidden hover:border-[#30363d] transition-colors"
            style={{
                background: `radial-gradient(circle at 85% 30%, rgba(63, 185, 80, 0.12) 0%, transparent 55%), #161b22`,
            }}
        >
            <div className="px-4 pt-4 pb-2 flex items-start justify-between gap-3">
                <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-2.5">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3fb950" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                        </svg>
                        <span className="text-[12px] text-[#3fb950] font-semibold">Autonomous Remediation</span>
                    </div>
                    <p className="text-[36px] font-bold text-[#e6edf3] leading-none tracking-tight">{count}</p>
                    <p className="text-[11px] text-[#8b949e] mt-2">Actions Executed</p>
                </div>
                <div className="text-right space-y-2 shrink-0">
                    <div>
                        <p className="text-[9.5px] text-[#8b949e]">MTTR Saved</p>
                        <p className="text-[12px] text-[#a371f7] font-mono font-bold">4h 27m</p>
                    </div>
                    <div>
                        <p className="text-[9.5px] text-[#8b949e]">Success Rate</p>
                        <p className="text-[12px] text-[#3fb950] font-mono font-bold">97%</p>
                    </div>
                </div>
            </div>
            <div className="h-[44px] px-1 pb-1">
                <Sparkline
                    points="0,18 10,17 20,16 30,14 40,15 50,12 60,13 70,10 80,11 90,8 100,9 110,6 120,8 130,5 140,7 150,4 160,5 170,3 180,4"
                    color="#3fb950"
                />
            </div>
        </div>
    );
}

// ─── Shared Sub-components ───────────────────────────────────────────────────

function Hexagon({ color, children }: { color: string; children: React.ReactNode }) {
    const id = color.replace("#", "");
    return (
        <div className="relative w-[52px] h-[52px] flex items-center justify-center shrink-0">
            <svg width="52" height="52" viewBox="0 0 52 52" className="absolute inset-0">
                <defs>
                    <linearGradient id={`hex-d-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={color} stopOpacity="0.35" />
                        <stop offset="100%" stopColor={color} stopOpacity="0.08" />
                    </linearGradient>
                    <filter id={`hex-g-${id}`} x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="3" result="b" />
                        <feFlood floodColor={color} floodOpacity="0.6" />
                        <feComposite in2="b" operator="in" />
                        <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                </defs>
                <polygon
                    points="26,2 48,13 48,39 26,50 4,39 4,13"
                    fill={`url(#hex-d-${id})`}
                    stroke={color}
                    strokeWidth="1.5"
                    strokeOpacity="0.85"
                    filter={`url(#hex-g-${id})`}
                />
            </svg>
            <div className="relative z-10">{children}</div>
        </div>
    );
}

function CubeIcon({ color }: { color: string }) {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 3px ${color})` }}>
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
    );
}

function Sparkline({ points, color }: { points: string; color: string }) {
    const id = color.replace("#", "");
    return (
        <svg width="100%" height="44" viewBox="0 0 180 24" preserveAspectRatio="none" className="overflow-visible">
            <defs>
                <linearGradient id={`spark-d-${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={color} stopOpacity="0.4" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <polygon points={`${points} 180,24 0,24`} fill={`url(#spark-d-${id})`} />
            <polyline points={points} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" style={{ filter: `blur(2px)` }} />
            <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}
