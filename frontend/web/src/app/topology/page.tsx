"use client";

import { TopologyStatsRow } from "@/components/topology/TopologyStatsRow";
import { LiveServiceTopology } from "@/components/topology/LiveServiceTopology";
import { AIRootCausePanel } from "@/components/topology/AIRootCausePanel";
import { OperationalTimeline } from "@/components/topology/OperationalTimeline";
import { AIInsightsPanel } from "@/components/topology/AIInsightsPanel";

export default function TopologyPage() {
    return (
        <div className="flex-1 overflow-y-auto wi-scrollbar bg-[#0d1117]">
            <style jsx global>{`
                .wi-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
                .wi-scrollbar::-webkit-scrollbar-track { background: #161b22; }
                .wi-scrollbar::-webkit-scrollbar-thumb { background: #30363d; border-radius: 3px; }
                .wi-scrollbar::-webkit-scrollbar-thumb:hover { background: #484f58; }
                @keyframes wi-dash { to { stroke-dashoffset: -24; } }
                .wi-flow-high { stroke-dasharray: 8 4; animation: wi-dash 0.8s linear infinite; }
                .wi-flow-medium { stroke-dasharray: 6 4; animation: wi-dash 1.2s linear infinite; }
                .wi-flow-low { stroke-dasharray: 4 4; animation: wi-dash 1.8s linear infinite; }
                @keyframes wi-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
            `}</style>

            <div className="px-4 pt-4 pb-6 space-y-3">
                {/* 4 Stat Cards */}
                <TopologyStatsRow />

                {/* Live Service Topology + AI Root Cause Analysis */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-3">
                    <LiveServiceTopology />
                    <AIRootCausePanel />
                </div>

                {/* Operational Timeline + AI Insights */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-3">
                    <OperationalTimeline />
                    <AIInsightsPanel />
                </div>
            </div>
        </div>
    );
}
