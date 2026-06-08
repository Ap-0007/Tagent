"use client";

const ACTIVITIES = [
    { action: "Deployment completed", desc: "tagent-monitoring successfully deployed v1.9.3", time: "1m ago", color: "#3fb950" },
    { action: "Replica healthy", desc: "All replicas ready for tagent-api-gateway", time: "2m ago", color: "#3fb950" },
    { action: "Readiness probe failure", desc: "Ollama pod readiness probe failed", time: "3m ago", color: "#f85149" },
    { action: "Scaling action executed", desc: "Scaled tagent-notification from 2 to 3 replicas", time: "4m ago", color: "#f0883e" },
    { action: "Recovery successful", desc: "Ollama deployment recovering...", time: "5m ago", color: "#3fb950" },
];

export function LiveActivityFeed() {
    return (
        <div className="rounded-[12px] border border-[#21262d] bg-[#161b22] p-3.5">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <h3 className="text-[13px] font-semibold text-[#e6edf3]">Live Activity Feed</h3>
                    <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#3fb950]/10 border border-[#3fb950]/30">
                        <span className="w-1 h-1 rounded-full bg-[#3fb950]" style={{ boxShadow: "0 0 4px #3fb950", animation: "wi-pulse 2s infinite" }} />
                        <span className="text-[9px] text-[#3fb950] font-semibold">Live</span>
                    </div>
                </div>
                <button className="text-[10px] text-[#58a6ff] hover:text-[#79c0ff]">View all</button>
            </div>

            <div className="space-y-2">
                {ACTIVITIES.map((a, i) => (
                    <div key={i} className="flex items-start gap-2 py-1.5 border-b border-[#21262d] last:border-0">
                        <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: a.color, boxShadow: `0 0 3px ${a.color}` }} />
                        <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-semibold" style={{ color: a.color }}>{a.action}</p>
                            <p className="text-[10px] text-[#8b949e] truncate">{a.desc}</p>
                        </div>
                        <span className="text-[9px] text-[#6e7681] font-mono shrink-0">{a.time}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
