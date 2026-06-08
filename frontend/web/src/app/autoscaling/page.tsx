"use client";

import { AutoscalingStatsRow } from "@/components/autoscaling/AutoscalingStatsRow";
import { LiveScalingOverview } from "@/components/autoscaling/LiveScalingOverview";
import { AICapacityInsights } from "@/components/autoscaling/AICapacityInsights";
import { PredictiveDemandForecasting } from "@/components/autoscaling/PredictiveDemandForecasting";
import { WorkloadElasticityMap } from "@/components/autoscaling/WorkloadElasticityMap";
import { CostPerformanceAnalysis } from "@/components/autoscaling/CostPerformanceAnalysis";
import { AutoscalingTimeline } from "@/components/autoscaling/AutoscalingTimeline";
import { ScalingAnomalyDetection } from "@/components/autoscaling/ScalingAnomalyDetection";
import { AIOptimizationRecommendations } from "@/components/autoscaling/AIOptimizationRecommendations";

export default function AutoscalingPage() {
    return (
        <div className="flex-1 overflow-y-auto wi-scrollbar bg-[#0d1117]">
            <style jsx global>{`
                .wi-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
                .wi-scrollbar::-webkit-scrollbar-track { background: #161b22; }
                .wi-scrollbar::-webkit-scrollbar-thumb { background: #30363d; border-radius: 3px; }
                @keyframes wi-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
            `}</style>

            <div className="px-4 pt-4 pb-6 space-y-3">
                <AutoscalingStatsRow />

                {/* Row 2: Live Scaling Overview + AI Capacity Insights */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-3">
                    <LiveScalingOverview />
                    <AICapacityInsights />
                </div>

                {/* Row 3: Predictive Demand + Workload Elasticity + Cost vs Performance */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                    <PredictiveDemandForecasting />
                    <WorkloadElasticityMap />
                    <CostPerformanceAnalysis />
                </div>

                {/* Row 4: Timeline + Anomaly Detection + AI Recommendations */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                    <AutoscalingTimeline />
                    <ScalingAnomalyDetection />
                    <AIOptimizationRecommendations />
                </div>
            </div>
        </div>
    );
}
