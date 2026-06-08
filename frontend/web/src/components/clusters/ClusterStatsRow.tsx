"use client";

export function ClusterStatsRow() {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard label="Connected Clusters" value="4" trend="+ 1 this week" trendColor="#3fb950" color="#3fb950" />
            <StatCard label="Fleet Health Score" value="94.6" suffix="/100" badge="Excellent" color="#3fb950" ring={94.6} />
            <StatCard label="Active Workloads" value="1,762" trend="+ 156 this week" trendColor="#3fb950" color="#22d3ee" />
            <StatCard label="Open Incidents" value="2" trend="−1 since last 24h" trendColor="#f0883e" color="#f85149" />
            <StatCard label="AI Confidence" value="96" suffix="%" badge="High Confidence" color="#a371f7" ring={96} />
            <StatCard label="Autonomous Actions" value="24" trend="+ 8 this week" trendColor="#3fb950" color="#3fb950" sparkline />
        </div>
    );
}

function StatCard({ label, value, suffix, trend, trendColor, badge, color, ring, sparkline }: {
    label: string; value: string; suffix?: string; trend?: string; trendColor?: string;
    badge?: string; color: string; ring?: number; sparkline?: boolean;
}) {
    const r = 22;
    const c = 2 * Math.PI * r;
    const offset = ring ? c - (ring / 100) * c : 0;

    return (
        <div className="rounded-[10px] border border-[#21262d] bg-[#161b22] p-3 hover:border-[#30363d] transition-colors" style={{ background: `radial-gradient(circle at 85% 25%, ${color}18 0%, transparent 55%), #161b22` }}>
            <p className="text-[10.5px] text-[#8b949e] font-medium mb-1.5">{label}</p>
            <div className="flex items-end justify-between gap-2">
                <div>
                    <div className="flex items-baseline gap-0.5">
                        <span className="text-[24px] font-bold text-[#e6edf3] leading-none font-mono">{value}</span>
                        {suffix && <span className="text-[12px] text-[#6e7681] font-medium">{suffix}</span>}
                    </div>
                    {trend && <p className="text-[10px] mt-1.5 font-medium" style={{ color: trendColor }}>{trend}</p>}
                    {badge && <p className="text-[10px] mt-1.5 font-semibold" style={{ color }}>✓ {badge}</p>}
                </div>
                {ring && (
                    <svg width="48" height="48" viewBox="0 0 48 48" className="shrink-0">
                        <circle cx="24" cy="24" r={r} fill="none" stroke="#21262d" strokeWidth="4" />
                        <circle cx="24" cy="24" r={r} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset} transform="rotate(-90 24 24)" style={{ filter: `drop-shadow(0 0 3px ${color})` }} />
                    </svg>
                )}
                {sparkline && (
                    <svg width="60" height="28" viewBox="0 0 60 20" className="shrink-0">
                        <polyline points="0,16 8,14 16,12 24,14 32,8 40,10 48,5 56,7 60,3" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                )}
            </div>
        </div>
    );
}
