"use client";

import { useState } from "react";

const HEAT_COLORS = ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"];

const DATA: Record<string, { ns: string; cells: number[] }[]> = {
    Namespaces: [
        { ns: "production", cells: [4, 5, 3, 5, 4] },
        { ns: "ai-engine", cells: [5, 4, 5, 3, 4] },
        { ns: "monitoring", cells: [2, 3, 2, 3, 2] },
        { ns: "platform", cells: [3, 2, 3, 2, 3] },
        { ns: "staging", cells: [1, 2, 1, 2, 1] },
        { ns: "development", cells: [1, 1, 1, 1, 1] },
    ],
    Deployments: [
        { ns: "api-gateway", cells: [5, 4, 5, 4, 5] },
        { ns: "ai-engine", cells: [4, 5, 4, 5, 4] },
        { ns: "monitoring", cells: [3, 3, 3, 2, 3] },
        { ns: "notification", cells: [2, 3, 2, 3, 2] },
        { ns: "remediation", cells: [2, 2, 2, 2, 2] },
        { ns: "ollama", cells: [1, 1, 2, 1, 1] },
    ],
    Services: [
        { ns: "load-balancer", cells: [5, 5, 4, 5, 5] },
        { ns: "api-svc", cells: [4, 4, 4, 3, 4] },
        { ns: "db-svc", cells: [3, 4, 3, 4, 3] },
        { ns: "cache-svc", cells: [2, 2, 3, 2, 2] },
        { ns: "queue-svc", cells: [2, 2, 2, 2, 2] },
        { ns: "dns-svc", cells: [1, 1, 1, 1, 1] },
    ],
    Clusters: [
        { ns: "prod-east", cells: [5, 5, 5, 4, 5] },
        { ns: "prod-west", cells: [4, 4, 4, 4, 4] },
        { ns: "staging", cells: [2, 3, 2, 3, 2] },
        { ns: "dev", cells: [1, 2, 1, 2, 1] },
    ],
};

export function KubernetesCostHeatmap() {
    const [tab, setTab] = useState("Namespaces");
    const rows = DATA[tab] || DATA["Namespaces"];

    return (
        <div className="rounded-[12px] border border-[#21262d] bg-[#161b22] p-3.5">
            <h3 className="text-[13px] font-semibold text-[#e6edf3] mb-3">Kubernetes Cost Heatmap</h3>

            {/* Tab bar */}
            <div className="flex items-center gap-0.5 p-0.5 rounded-md bg-[#0d1117] border border-[#30363d] mb-3 w-fit">
                {Object.keys(DATA).map(t => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`px-2.5 h-6 rounded text-[10px] transition-colors ${tab === t ? "bg-[#1f6feb]/20 text-[#58a6ff] font-medium" : "text-[#8b949e] hover:text-[#e6edf3]"}`}
                    >
                        {t}
                    </button>
                ))}
            </div>

            {/* Heatmap grid */}
            <div className="space-y-1">
                {rows.map((row, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <span className="text-[10px] text-[#8b949e] w-[80px] truncate font-mono">{row.ns}</span>
                        <div className="flex gap-1 flex-1">
                            {row.cells.map((v, j) => (
                                <div key={j} className="flex-1 h-5 rounded-sm transition-colors" style={{ background: HEAT_COLORS[v - 1] || HEAT_COLORS[0], border: "1px solid #21262d" }} title={`Cost level: ${v}/5`} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-2 mt-3">
                <span className="text-[9px] text-[#8b949e]">Low Cost</span>
                <div className="flex gap-0.5">
                    {HEAT_COLORS.map((c, i) => (
                        <div key={i} className="w-4 h-3 rounded-sm" style={{ background: c }} />
                    ))}
                </div>
                <span className="text-[9px] text-[#8b949e]">High Cost</span>
            </div>
        </div>
    );
}
