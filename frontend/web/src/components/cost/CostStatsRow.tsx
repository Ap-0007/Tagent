"use client";

export function CostStatsRow() {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard label="Monthly Spend" value="$24,870" trend="+ 6.2% vs last month" trendColor="#f0883e" icon="dollar" color="#58a6ff" />
            <StatCard label="Potential Savings" value="$6,420" trend="+ 25.8% opportunity" trendColor="#3fb950" icon="trending" color="#3fb950" />
            <StatCard label="Efficiency Score" value="92%" trend="+ 8% vs last month" trendColor="#3fb950" icon="gauge" color="#a371f7" ring={92} />
            <StatCard label="Idle Resources" value="18" trend="−3 vs last month" trendColor="#3fb950" icon="pause" color="#f0883e" />
            <StatCard label="Forecast Next Month" value="$22,300" trend="+ 8.6% predicted" trendColor="#f0883e" icon="chart" color="#22d3ee" />
            <StatCard label="Optimization Opportunities" value="14" trend="↗ 4 new opportunities" trendColor="#3fb950" icon="target" color="#3fb950" ring={70} />
        </div>
    );
}

function StatCard({ label, value, trend, trendColor, icon, color, ring }: {
    label: string; value: string; trend: string; trendColor: string; icon: string; color: string; ring?: number;
}) {
    const r = 18; const c = 2 * Math.PI * r;
    const offset = ring ? c - (ring / 100) * c : 0;
    return (
        <div className="rounded-[10px] border border-[#21262d] bg-[#161b22] p-3 hover:border-[#30363d] transition-colors" style={{ background: `radial-gradient(circle at 85% 25%, ${color}15 0%, transparent 55%), #161b22` }}>
            <div className="flex items-center justify-between mb-1.5">
                <p className="text-[10.5px] text-[#8b949e] font-medium">{label}</p>
                <IconSmall icon={icon} color={color} />
            </div>
            <p className="text-[22px] font-bold text-[#e6edf3] leading-none font-mono">{value}</p>
            <p className="text-[10px] mt-1.5 font-medium" style={{ color: trendColor }}>{trend}</p>
            {ring && (
                <div className="mt-2">
                    <svg width="100%" height="4" viewBox="0 0 100 4" preserveAspectRatio="none">
                        <rect x="0" y="0" width="100" height="4" rx="2" fill="#21262d" />
                        <rect x="0" y="0" width={ring} height="4" rx="2" fill={color} style={{ filter: `drop-shadow(0 0 3px ${color})` }} />
                    </svg>
                </div>
            )}
        </div>
    );
}

function IconSmall({ icon, color }: { icon: string; color: string }) {
    return (
        <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: `${color}20` }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {icon === "dollar" && <><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>}
                {icon === "trending" && <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></>}
                {icon === "gauge" && <><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" /></>}
                {icon === "pause" && <><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></>}
                {icon === "chart" && <><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></>}
                {icon === "target" && <><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></>}
            </svg>
        </div>
    );
}
