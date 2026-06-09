"use client";

import { NodesStatsRow } from "@/components/nodes/NodesStatsRow";
import { ClusterTopology3D } from "@/components/nodes/ClusterTopology3D";
import { AIRecommendationsPanel } from "@/components/nodes/AIRecommendationsPanel";
import { KubernetesNodesTable } from "@/components/nodes/KubernetesNodesTable";
import { InfrastructureStatusBar } from "@/components/nodes/InfrastructureStatusBar";

export default function NodesPage() {
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
                {/* Stats row */}
                <NodesStatsRow />

                {/* Topology + AI Recommendations sidebar */}
                <div className="grid grid-cols-1 lg:grid-cols-[480px_1fr] gap-3">
                    <ClusterTopology3D />
                    <AIRecommendationsPanel />
                </div>

                {/* Nodes table */}
                <KubernetesNodesTable />

                {/* Bottom infrastructure status bar */}
                <InfrastructureStatusBar />
            </div>
        </div>
    );
}
