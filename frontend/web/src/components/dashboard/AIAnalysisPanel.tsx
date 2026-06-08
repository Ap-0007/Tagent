"use client";

import { type Incident } from "@/lib/api";
import { AlertTriangle, Clock, Target, Zap, Brain, TrendingUp } from "lucide-react";

// Hardcoded demo data - will be replaced with backend data when connected
const DEMO_INCIDENT = {
    id: "INC-48291",
    title: "High Error Rate in Payment Service",
    severity: "critical" as const,
    status: "active" as const,
    service: "payment-service",
    namespace: "production",
    startedAt: new Date(Date.now() - 7 * 60 * 1000).toISOString(),
    rootCause: "Connection pool exhaustion in PostgreSQL caused by slow queries after recent deployment.",
    confidence: 96,
};

const DEMO_TIMELINE = [
    { time: "7m ago", event: "Error rate spike detected", status: "critical" as const },
    { time: "6m ago", event: "Latency increase — Confidence Query", status: "warning" as const },
    { time: "5m ago", event: "Connection pool saturation", status: "warning" as const },
    { time: "4m ago", event: "Automatic mitigation triggered", status: "info" as const },
];

const DEMO_BLAST_RADIUS = [
    { label: "Services Impacted", value: "1" },
    { label: "Pods Affected", value: "12" },
    { label: "Requests/Min Affected", value: "248" },
];

interface AIAnalysisPanelProps {
    incidents: Incident[];
}

export function AIAnalysisPanel({ incidents }: AIAnalysisPanelProps) {
    // Use real incident if available, otherwise use demo
    const activeIncident = incidents.find(i => i.status === "active" || i.status === "investigating") || null;
    const incident = activeIncident || DEMO_INCIDENT;
    const confidence = activeIncident?.confidence || DEMO_INCIDENT.confidence;
    const rootCause = activeIncident?.rootCause || DEMO_INCIDENT.rootCause;

    return (
        <div className="h-full flex flex-col overflow-y-auto scrollbar pr-1">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2 py-0.5 text-2xs font-semibold border rounded-md uppercase tracking-wide ${incident.severity === "critical"
                            ? "bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_8px_-2px_rgba(239,68,68,0.3)]"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        }`}>
                        {incident.severity}
                    </span>
                </div>
                <span className="text-2xs text-slate-500 font-mono">Incident ID: {incident.id || DEMO_INCIDENT.id}</span>
            </div>

            {/* Incident title + confidence */}
            <div className="flex items-start gap-3 mb-4 p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-slate-200 font-medium leading-snug">{incident.title || DEMO_INCIDENT.title}</p>
                    <p className="text-2xs text-slate-500 mt-1">
                        Started 7m ago · Affecting 1 service
                    </p>
                </div>
                <div className="text-right shrink-0">
                    <p className="text-xl font-bold text-blue-400 font-mono">{confidence}%</p>
                    <p className="text-2xs text-slate-500">Confidence</p>
                </div>
            </div>

            {/* Incident Timeline */}
            <div className="mb-4">
                <div className="flex items-center gap-2 mb-2.5">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <h4 className="text-xs font-semibold text-slate-300">Incident Timeline</h4>
                </div>
                <div className="space-y-2 pl-1">
                    {DEMO_TIMELINE.map((item, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                            <span className="text-2xs text-slate-500 font-mono w-12 shrink-0 mt-0.5">{item.time}</span>
                            <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${item.status === "critical" ? "bg-red-400" : item.status === "warning" ? "bg-amber-400" : "bg-blue-400"
                                }`} />
                            <span className="text-xs text-slate-400 leading-relaxed">{item.event}</span>
                        </div>
                    ))}
                    <div className="flex items-start gap-2.5">
                        <span className="text-2xs text-slate-500 font-mono w-12 shrink-0 mt-0.5">Now</span>
                        <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 bg-emerald-400 animate-pulse" />
                        <span className="text-xs text-emerald-400 leading-relaxed font-medium">Issue identified</span>
                    </div>
                </div>
                <button className="mt-2 text-2xs text-blue-400 hover:text-blue-300 flex items-center gap-1 ml-1">
                    View full analysis →
                </button>
            </div>

            {/* Root Cause Analysis */}
            <div className="mb-4">
                <div className="flex items-center gap-2 mb-2.5">
                    <Brain className="w-3.5 h-3.5 text-purple-400" />
                    <h4 className="text-xs font-semibold text-slate-300">Root Cause Analysis</h4>
                </div>
                <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/10">
                    <p className="text-xs text-slate-300 leading-relaxed">{rootCause}</p>
                </div>
            </div>

            {/* Blast Radius */}
            <div className="mb-4">
                <div className="flex items-center gap-2 mb-2.5">
                    <Target className="w-3.5 h-3.5 text-red-400" />
                    <h4 className="text-xs font-semibold text-slate-300">Blast Radius</h4>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    {DEMO_BLAST_RADIUS.map((item, i) => (
                        <div key={i} className="p-2.5 rounded-lg bg-navy-800/60 border border-[rgba(59,130,246,0.08)] text-center">
                            <p className="text-sm font-bold text-blue-300 font-mono">{item.value}</p>
                            <p className="text-2xs text-slate-500 mt-0.5 leading-tight">{item.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* AI Recommendations */}
            <div className="mt-auto">
                <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                        <Zap className="w-3.5 h-3.5 text-emerald-400" />
                        <h4 className="text-xs font-semibold text-slate-300">AI Recommendations</h4>
                    </div>
                    <span className="px-2 py-0.5 rounded-md text-2xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Recommended
                    </span>
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 space-y-1.5">
                    <p className="text-xs text-slate-300">Increase connection pool size and optimize slow queries.</p>
                    <p className="text-xs text-slate-300">Auto-scaling database recommended.</p>
                </div>
                <div className="flex items-center justify-between mt-3">
                    <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 text-xs font-medium text-blue-300 hover:from-blue-500/30 hover:to-purple-500/30 transition-all hover:shadow-glow-sm">
                        Apply Remediation
                    </button>
                    <div className="text-right">
                        <p className="text-2xs text-slate-500">Confidence</p>
                        <p className="text-sm font-bold text-emerald-400 font-mono">94%</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
