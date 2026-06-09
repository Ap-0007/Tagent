"use client";

import { useEffect, useState } from "react";
import { getRecentEvents, getRemediationHistory, getIncidents, getDeployments, type StreamEvent, type RemediationResult, type Incident, type DeploymentInfo } from "@/lib/api";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { AlertTriangle, Wrench, GitBranch, Brain } from "lucide-react";
import Link from "next/link";

type FeedSeverity = "critical" | "warning" | "info" | "success";

interface FeedItemData {
    time: string;
    message: string;
    service?: string;
    severity: FeedSeverity;
}

const dotColors: Record<FeedSeverity, string> = {
    critical: "bg-red-400",
    warning: "bg-amber-400",
    info: "bg-blue-400",
    success: "bg-emerald-400",
};

const badgeColors: Record<FeedSeverity, string> = {
    critical: "bg-red-500/10 text-red-400 border-red-500/20",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    info: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

const badgeLabels: Record<FeedSeverity, string> = {
    critical: "Critical",
    warning: "Warning",
    info: "Info",
    success: "Success",
};

function FeedItem({ time, message, service, severity }: FeedItemData) {
    return (
        <div className="flex items-start gap-2.5 px-3 py-2 hover:bg-white/[0.02] transition-colors rounded-md">
            <span className="text-2xs text-slate-500 font-mono whitespace-nowrap mt-0.5 w-[52px] shrink-0">{time}</span>
            <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${dotColors[severity]}`} />
            <div className="flex-1 min-w-0">
                <p className="text-2xs text-slate-300 leading-relaxed truncate">{message}</p>
                {service && <span className="text-2xs text-slate-600 font-mono">{service}</span>}
            </div>
            <span className={`text-2xs font-medium px-1.5 py-0.5 rounded border shrink-0 ${badgeColors[severity]}`}>
                {badgeLabels[severity]}
            </span>
        </div>
    );
}

interface FeedColumnProps {
    title: string;
    icon: React.ReactNode;
    items: FeedItemData[];
    linkHref: string;
    linkText: string;
}

function FeedColumn({ title, icon, items, linkHref, linkText }: FeedColumnProps) {
    return (
        <div className="glass-card overflow-hidden flex flex-col">
            <div className="px-3.5 py-2.5 border-b border-[rgba(59,130,246,0.08)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {icon}
                    <span className="text-xs font-semibold text-slate-300">{title}</span>
                </div>
                <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-2xs text-emerald-400 font-medium">Live</span>
                </div>
            </div>
            <div className="flex-1 py-1">
                {items.map((item, i) => (
                    <FeedItem key={i} {...item} />
                ))}
            </div>
            <div className="px-3.5 py-2 border-t border-[rgba(59,130,246,0.08)]">
                <Link href={linkHref} className="text-2xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors">
                    {linkText} →
                </Link>
            </div>
        </div>
    );
}

function formatTime(iso: string): string {
    try {
        const d = new Date(iso);
        return d.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
    } catch {
        return "—";
    }
}

function mapEventSeverity(sev: string): FeedSeverity {
    if (sev === "critical" || sev === "error") return "critical";
    if (sev === "warning") return "warning";
    if (sev === "success" || sev === "resolved") return "success";
    return "info";
}

export function OperationsFeed() {
    const [anomalyFeed, setAnomalyFeed] = useState<FeedItemData[]>([]);
    const [remediationFeed, setRemediationFeed] = useState<FeedItemData[]>([]);
    const [deploymentFeed, setDeploymentFeed] = useState<FeedItemData[]>([]);
    const [aiReasoningFeed, setAiReasoningFeed] = useState<FeedItemData[]>([]);

    useEffect(() => {
        async function load() {
            try {
                const [eventsRes, remHistory, incidentsRes, deploymentsRes] = await Promise.all([
                    getRecentEvents().catch(() => ({ events: [], total: 0 })),
                    getRemediationHistory().catch(() => ({ history: [], total: 0 })),
                    getIncidents().catch(() => ({ incidents: [], total: 0 })),
                    getDeployments().catch(() => []),
                ]);

                // Anomaly feed from events
                const anomalies: FeedItemData[] = (eventsRes.events || []).slice(0, 5).map((e: StreamEvent) => ({
                    time: formatTime(e.timestamp),
                    message: e.title || e.detail,
                    service: e.source,
                    severity: mapEventSeverity(e.severity),
                }));
                setAnomalyFeed(anomalies);

                // Remediation feed from history
                const rems: FeedItemData[] = (remHistory.history || []).slice(0, 5).map((r: RemediationResult) => ({
                    time: formatTime(r.timestamp),
                    message: `${r.action}: ${r.message}`,
                    service: r.target,
                    severity: r.status === "success" ? "success" as FeedSeverity : "warning" as FeedSeverity,
                }));
                setRemediationFeed(rems);

                // Deployment feed from deployments
                const deps: FeedItemData[] = (deploymentsRes || []).slice(0, 5).map((d: DeploymentInfo) => ({
                    time: d.age || "—",
                    message: `Deployed ${d.name} (${d.ready}/${d.replicas} ready)`,
                    service: d.namespace,
                    severity: d.ready === d.replicas ? "success" as FeedSeverity : "warning" as FeedSeverity,
                }));
                setDeploymentFeed(deps);

                // AI Reasoning feed from incidents
                const aiItems: FeedItemData[] = (incidentsRes.incidents || []).slice(0, 5).map((inc: Incident) => ({
                    time: formatTime(inc.startedAt),
                    message: `${inc.title} — ${inc.rootCause || "Analyzing..."}`,
                    service: inc.service,
                    severity: mapEventSeverity(inc.severity),
                }));
                setAiReasoningFeed(aiItems);
            } catch { }
        }
        load();
        const interval = setInterval(load, 15000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div>
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-slate-200">Real-time Operations Feed</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                <FeedColumn
                    title="Anomaly Feed"
                    icon={<AlertTriangle className="w-3.5 h-3.5 text-red-400" />}
                    items={anomalyFeed}
                    linkHref="/incidents"
                    linkText="View all anomalies"
                />
                <FeedColumn
                    title="Remediation Feed"
                    icon={<Wrench className="w-3.5 h-3.5 text-emerald-400" />}
                    items={remediationFeed}
                    linkHref="/remediation"
                    linkText="View all remediations"
                />
                <FeedColumn
                    title="Deployment Feed"
                    icon={<GitBranch className="w-3.5 h-3.5 text-blue-400" />}
                    items={deploymentFeed}
                    linkHref="/deployments"
                    linkText="View all deployments"
                />
                <FeedColumn
                    title="AI Reasoning Feed"
                    icon={<Brain className="w-3.5 h-3.5 text-purple-400" />}
                    items={aiReasoningFeed}
                    linkHref="/ai"
                    linkText="View full AI reasoning"
                />
            </div>
        </div>
    );
}
