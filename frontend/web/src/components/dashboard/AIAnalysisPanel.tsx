"use client";

import { useEffect, useState } from "react";
import { getIncidents, type Incident } from "@/lib/api";
import { AlertTriangle, Clock, Target, Zap, Brain, TrendingUp } from "lucide-react";

interface AIAnalysisPanelProps {
    incidents?: Incident[];
}

export function AIAnalysisPanel({ incidents: propIncidents }: AIAnalysisPanelProps) {
    const [fetchedIncidents, setFetchedIncidents] = useState<Incident[]>([]);

    useEffect(() => {
        if (propIncidents && propIncidents.length > 0) return;
        async function load() {
            try {
                const res = await getIncidents().catch(() => ({ incidents: [], total: 0 }));
                setFetchedIncidents(res.incidents || []);
            } catch { }
        }
        load();
        const interval = setInterval(load, 15000);
        return () => clearInterval(interval);
    }, [propIncidents]);

    const incidents = (propIncidents && propIncidents.length > 0) ? propIncidents : fetchedIncidents;
    const activeIncident = incidents.find(i => i.status === "active" || i.status === "investigating") || incidents[0] || null;

    const title = activeIncident?.title || "No active incidents";
    const severity = activeIncident?.severity || "low";
    const confidence = activeIncident?.confidence || 0;
    const rootCause = activeIncident?.rootCause || "No root cause data available.";
    const blastRadius = activeIncident?.blastRadius || [];
    const incidentId = activeIncident?.id || "—";
    const startedAt = activeIncident?.startedAt;

    const timeAgo = startedAt ? getTimeAgo(startedAt) : "—";

    const timeline = activeIncident?.evidence?.map((e, i) => ({
        time: `${(activeIncident.evidence?.length || 0) - i}m ago`,
        event: e,
        status: i === 0 ? "critical" as const : i < 3 ? "warning" as const : "info" as const,
    })) || [
            { time: timeAgo, event: title, status: "critical" as const },
        ];

    return (
        <div className="h-full flex flex-col overflow-y-auto scrollbar pr-1">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2 py-0.5 text-2xs font-semibold border rounded-md uppercase tracking-wide ${severity === "critical"
                        ? "bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_8px_-2px_rgba(239,68,68,0.3)]"
                        : severity === "high"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        }`}>
                        {severity}
                    </span>
                </div>
                <span className="text-2xs text-slate-500 font-mono">Incident ID: {incidentId}</span>
            </div>

            {/* Incident title + confidence */}
            <div className="flex items-start gap-3 mb-4 p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-slate-200 font-medium leading-snug">{title}</p>
                    <p className="text-2xs text-slate-500 mt-1">
                        Started {timeAgo} · Affecting {blastRadius.length || 1} service{blastRadius.length !== 1 ? "s" : ""}
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
                    {timeline.map((item, i) => (
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
                    <div className="p-2.5 rounded-lg bg-navy-800/60 border border-[rgba(59,130,246,0.08)] text-center">
                        <p className="text-sm font-bold text-blue-300 font-mono">{blastRadius.length || 1}</p>
                        <p className="text-2xs text-slate-500 mt-0.5 leading-tight">Services Impacted</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-navy-800/60 border border-[rgba(59,130,246,0.08)] text-center">
                        <p className="text-sm font-bold text-blue-300 font-mono">{blastRadius.length > 0 ? blastRadius.length * 4 : "—"}</p>
                        <p className="text-2xs text-slate-500 mt-0.5 leading-tight">Pods Affected</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-navy-800/60 border border-[rgba(59,130,246,0.08)] text-center">
                        <p className="text-sm font-bold text-blue-300 font-mono">—</p>
                        <p className="text-2xs text-slate-500 mt-0.5 leading-tight">Requests/Min</p>
                    </div>
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
                    <p className="text-xs text-slate-300">{rootCause !== "No root cause data available." ? "Investigate and apply remediation for root cause." : "No active recommendations."}</p>
                </div>
                <div className="flex items-center justify-between mt-3">
                    <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 text-xs font-medium text-blue-300 hover:from-blue-500/30 hover:to-purple-500/30 transition-all hover:shadow-glow-sm">
                        Apply Remediation
                    </button>
                    <div className="text-right">
                        <p className="text-2xs text-slate-500">Confidence</p>
                        <p className="text-sm font-bold text-emerald-400 font-mono">{confidence}%</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function getTimeAgo(iso: string): string {
    try {
        const diff = Date.now() - new Date(iso).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return "just now";
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        return `${Math.floor(hours / 24)}d ago`;
    } catch {
        return "—";
    }
}
