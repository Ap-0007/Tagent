"use client";

export function AutoscalingStatsRow() {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard label="Current Replicas" value="78" trend="↗ 12% vs yesterday" trendColor="#3fb950" color="#3fb950" />
            <StatCard label="Scale Events Today" value="24" trend="+ 33% vs yesterday" trendColor="#f0883e" color="#58a6ff" sparkline />
            <StatCard label="Predicted Scale Events" value="9" trend="Next 24 hours" trendColor="#8b949e" color="#a371f7" />
            <StatCard label="Efficiency Score" value="94%" trend="Excellent" trendColor="#3fb950" color="#3fb950" ring={94} />
            <StatCard label="Resource Savings" value="$4,280" trend="↗ vs last month" trendColor="#3fb950" color="#22d3ee" />
            <StatCard label="AI Confidence" value="96%" trend="High Confidence" trendColor="#3fb950" color="#a371f7" ring={96} />
        </div>
    );
}

function StatCard({ label, value, trend, trendColor, color, ring, sparkline }: {
    label: string; value: string; trend: string; trendColor: string; color: string; ring?: number; sparkline?: boolean;
}) {
    const r = 18; const c = 2 * Math.PI * r;
    const offset = ring ? c - (ring / 100) * c : 0;
    return (
        <div className="rounded-[10px] border border-[#21262d] bg-[#161b22] p-3 hover:border-[#30363d] transition-colors" style={{ background: `radial-gradient(circle at 85% 25%, ${color}15 0%, transparent 55%), #161b22` }}>
            <p className="text-[10.5px] text-[#8b949e] font-medium mb-1.5">{label}</p>
            <div className="flex items-end justify-between gap-2">
                <div>
                    <span className="text-[24px] font-bold text-[#e6edf3] leading-none font-mono">{value}</span>
                    <p className="text-[10px] mt-1.5 font-medium" style={{ color: trendColor }}>{trend}</p>
                </div>
                {ring !== undefined && (
                    <svg width="44" height="44" viewBox="0 0 44 44" className="shrink-0">
                        <circle cx="22" cy="22" r={r} fill="none" stroke="#21262d" strokeWidth="4" />
                        <circle cx="22" cy="22" r={r} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset} transform="rotate(-90 22 22)" style={{ filter: `drop-shadow(0 0 3px ${color})` }} />
                    </svg>
                )}
                {sparkline && (
                    <svg width="60" height="28" viewBox="0 0 60 20" className="shrink-0">
                        <polyline points="0,16 8,12 16,14 24,8 32,10 40,5 48,7 56,3 60,4" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                )}
            </div>
        </div>
    );
}
