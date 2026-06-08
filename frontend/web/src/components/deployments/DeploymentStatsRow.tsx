"use client";

export function DeploymentStatsRow() {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard label="Active Deployments" value="28" trend="↗ 4 this week" trendColor="#3fb950" color="#3fb950" />
            <StatCard label="Healthy Deployments" value="21" badge="75% of total" color="#3fb950" />
            <StatCard label="Degraded Deployments" value="4" badge="14% of total" color="#f0883e" />
            <StatCard label="Rollouts In Progress" value="3" trend="+ 2 since last 24h" trendColor="#22d3ee" color="#22d3ee" />
            <StatCard label="AI Risk Score" value="32" badge="Medium Risk" color="#f0883e" ring={32} ringMax={100} />
            <StatCard label="Incident Exposure Score" value="18" badge="Low Exposure" color="#a371f7" ring={18} ringMax={100} />
        </div>
    );
}

function StatCard({ label, value, trend, trendColor, badge, color, ring, ringMax }: {
    label: string; value: string; trend?: string; trendColor?: string;
    badge?: string; color: string; ring?: number; ringMax?: number;
}) {
    const r = 20;
    const c = 2 * Math.PI * r;
    const offset = ring !== undefined && ringMax ? c - (ring / ringMax) * c : 0;

    return (
        <div className="rounded-[10px] border border-[#21262d] bg-[#161b22] p-3 hover:border-[#30363d] transition-colors" style={{ background: `radial-gradient(circle at 85% 25%, ${color}15 0%, transparent 55%), #161b22` }}>
            <p className="text-[10.5px] text-[#8b949e] font-medium mb-1.5">{label}</p>
            <div className="flex items-end justify-between gap-2">
                <div>
                    <span className="text-[24px] font-bold text-[#e6edf3] leading-none font-mono">{value}</span>
                    {trend && <p className="text-[10px] mt-1.5 font-medium" style={{ color: trendColor }}>{trend}</p>}
                    {badge && <p className="text-[10px] mt-1.5 font-semibold" style={{ color }}>{badge}</p>}
                </div>
                {ring !== undefined && (
                    <svg width="44" height="44" viewBox="0 0 44 44" className="shrink-0">
                        <circle cx="22" cy="22" r={r} fill="none" stroke="#21262d" strokeWidth="4" />
                        <circle cx="22" cy="22" r={r} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset} transform="rotate(-90 22 22)" style={{ filter: `drop-shadow(0 0 3px ${color})` }} />
                    </svg>
                )}
            </div>
        </div>
    );
}
