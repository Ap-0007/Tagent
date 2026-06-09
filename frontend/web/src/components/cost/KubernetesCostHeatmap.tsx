"use client";

import { useEffect, useState } from "react";
import { getCostSummary, type CostSummary } from "@/lib/api";

const HEAT_COLORS = ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"];

type HeatRow = { ns: string; cells: number[] };
type HeatData = Record<string, HeatRow[]>;

function buildHeatData(data: CostSummary | null): HeatData {
    if (!data || data.items.length === 0) {
        return { Namespaces: [{ ns: "loading…", cells: [1, 1, 1, 1, 1] }] };
    }

    const byNamespace: Record<string, number> = {};
    const byKind: Record<string, number> = {};
    data.items.forEach(item => {
        const est = parseFloat(item.estimate.replace(/[^0-9.]/g, "")) || 0;
        byNamespace[item.namespace] = (byNamespace[item.namespace] || 0) + est;
        byKind[item.kind] = (byKind[item.kind] || 0) + est;
    });

    const toHeatLevel = (val: number, max: number): number => {
        if (max === 0) return 1;
        const ratio = val / max;
        if (ratio >= 0.8) return 5;
        if (ratio >= 0.6) return 4;
        if (ratio >= 0.4) return 3;
        if (ratio >= 0.2) return 2;
        return 1;
    };

    const buildRows = (grouped: Record<string, number>): HeatRow[] => {
        const entries = Object.entries(grouped).sort(([, a], [, b]) => b - a).slice(0, 6);
        const max = entries.length > 0 ? entries[0][1] : 1;
        return entries.map(([key, val]) => {
            const level = toHeatLevel(val, max);
            const cells = Array.from({ length: 5 }, (_, i) => Math.max(1, Math.min(5, level + (i % 2 === 0 ? 0 : -1))));
            return { ns: key, cells };
        });
    };

    return {
        Namespaces: buildRows(byNamespace),
        Kinds: buildRows(byKind),
    };
}

export function KubernetesCostHeatmap() {
    const [tab, setTab] = useState("Namespaces");
    const [heatData, setHeatData] = useState<HeatData>({ Namespaces: [{ ns: "loading…", cells: [1, 1, 1, 1, 1] }] });

    useEffect(() => {
        const load = () => {
            getCostSummary()
                .then((data: CostSummary) => { setHeatData(buildHeatData(data)); })
                .catch(() => null);
        };
        load();
        const id = setInterval(load, 15000);
        return () => clearInterval(id);
    }, []);

    const tabs = Object.keys(heatData);
    const rows = heatData[tab] || heatData[tabs[0]] || [];

    return (
        <div className="rounded-[12px] border border-[#21262d] bg-[#161b22] p-3.5">
            <h3 className="text-[13px] font-semibold text-[#e6edf3] mb-3">Kubernetes Cost Heatmap</h3>

            {/* Tab bar */}
            <div className="flex items-center gap-0.5 p-0.5 rounded-md bg-[#0d1117] border border-[#30363d] mb-3 w-fit">
                {tabs.map(t => (
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
