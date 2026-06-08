"use client";

// ─── Autonomous Operations (bottom-left) ─────────────────────────────────────

const OPS = [
    { action: "Restarted unhealthy pod", target: "orders-api-7d50dc", confidence: 96, risk: "Low Risk", riskColor: "#3fb950", status: "Success", statusColor: "#3fb950" },
    { action: "Scaled deployment", target: "payment-service", confidence: 94, risk: "Medium Risk", riskColor: "#f0883e", status: "Success", statusColor: "#3fb950" },
    { action: "Cleared failed workload", target: "job-processor-2f1a7", confidence: 92, risk: "Low Risk", riskColor: "#3fb950", status: "Success", statusColor: "#3fb950" },
    { action: "Increased HPA limits", target: "analytics-worker", confidence: 91, risk: "Medium Risk", riskColor: "#f0883e", status: "Completed", statusColor: "#3fb950" },
    { action: "Database connection pool scaled", target: "postgresql-primary", confidence: 89, risk: "High Risk", riskColor: "#f85149", status: "Auditing", statusColor: "#f0883e" },
];

export function AutonomousOperations() {
    return (
        <div className="rounded-[12px] border border-[#21262d] bg-[#161b22] p-3.5">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <h3 className="text-[13px] font-semibold text-[#e6edf3]">Autonomous Operations</h3>
                    <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#3fb950]/10 border border-[#3fb950]/30">
                        <span className="w-1 h-1 rounded-full bg-[#3fb950]" style={{ boxShadow: "0 0 4px #3fb950", animation: "wi-pulse 2s infinite" }} />
                        <span className="text-[9px] text-[#3fb950] font-semibold">Live</span>
                    </div>
                </div>
                <button className="text-[10px] text-[#58a6ff] hover:text-[#79c0ff]">View all</button>
            </div>
            <div className="space-y-1.5">
                {OPS.map((op, i) => (
                    <div key={i} className="flex items-center gap-2 text-[10.5px] py-1.5 border-b border-[#21262d] last:border-0">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: op.statusColor, boxShadow: `0 0 3px ${op.statusColor}` }} />
                        <span className="text-[#e6edf3] font-medium truncate flex-1">{op.action}</span>
                        <span className="text-[#8b949e] font-mono truncate max-w-[90px]">{op.target}</span>
                        <span className="text-[#8b949e] font-mono shrink-0">{op.confidence}%</span>
                        <span className="text-[9.5px] font-semibold px-1.5 py-0.5 rounded shrink-0" style={{ background: `${op.riskColor}18`, color: op.riskColor }}>{op.risk}</span>
                        <span className="text-[9.5px] font-semibold shrink-0" style={{ color: op.statusColor }}>{op.status}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
