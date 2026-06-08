"use client";

export function VersionIntelligence() {
    return (
        <div className="rounded-[12px] border border-[#21262d] bg-[#161b22] p-3.5">
            <h3 className="text-[13px] font-semibold text-[#e6edf3] mb-3">Version Intelligence</h3>

            <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="rounded-md bg-[#0d1117] border border-[#21262d] p-2.5 text-center">
                    <p className="text-[9px] text-[#8b949e]">Current Version</p>
                    <p className="text-[20px] font-bold text-[#e6edf3] font-mono leading-none mt-1">v2.4.1</p>
                    <p className="text-[9px] text-[#8b949e] mt-1">Deployed 2h 15m ago</p>
                </div>
                <div className="rounded-md bg-[#0d1117] border border-[#21262d] p-2.5 text-center">
                    <p className="text-[9px] text-[#8b949e]">Previous Version</p>
                    <p className="text-[20px] font-bold text-[#6e7681] font-mono leading-none mt-1">v2.4.0</p>
                    <p className="text-[9px] text-[#8b949e] mt-1">Deployed 6h ago</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md bg-[#0d1117] border border-[#21262d] p-2.5 text-center">
                    <p className="text-[9px] text-[#8b949e]">Rollout History</p>
                    <p className="text-[20px] font-bold text-[#22d3ee] font-mono leading-none mt-1">2</p>
                    <p className="text-[9px] text-[#8b949e] mt-1">in last 24h</p>
                </div>
                <div className="rounded-md bg-[#0d1117] border border-[#21262d] p-2.5 text-center">
                    <p className="text-[9px] text-[#8b949e]">Failed Rollouts</p>
                    <p className="text-[20px] font-bold text-[#f85149] font-mono leading-none mt-1">0</p>
                    <p className="text-[9px] text-[#8b949e] mt-1">Failed history</p>
                </div>
            </div>

            <div className="mt-3 pt-3 border-t border-[#21262d]">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#f0883e] font-semibold">⚠ Rollback Available</span>
                    <button className="text-[10px] text-[#58a6ff] hover:text-[#79c0ff]">Instant rollback ready</button>
                </div>
            </div>
        </div>
    );
}
