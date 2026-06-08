"use client";

import { GlassPanel } from "@/components/ui/GlassPanel";
import { AlertTriangle, Wrench, GitBranch, Brain } from "lucide-react";
import Link from "next/link";

// Hardcoded demo data - will be replaced with real backend data when connected
const anomalyFeed = [
    { time: "12:31:42", message: "High error rate detected", service: "payment-service", severity: "critical" as const },
    { time: "12:31:18", message: "Abnormal latency detected", service: "database", severity: "warning" as const },
    { time: "12:30:54", message: "CPU saturation increasing", service: "p-10-0-2-15", severity: "warning" as const },
    { time: "12:30:31", message: "Memory usage anomaly", service: "user-service", severity: "info" as const },
    { time: "12:29:47", message: "Network packet loss spike", service: "node-01", severity: "warning" as const },
];

const remediationFeed = [
    { time: "12:31:22", message: "Increased DB connection pool", service: "payment-service", severity: "success" as const },
    { time: "12:30:58", message: "Restarted unhealthy pod", service: "payment-svc-4f02", severity: "success" as const },
    { time: "12:30:33", message: "Scaled deployment", service: "order-service", severity: "success" as const },
    { time: "12:29:38", message: "Cleared stuck jobs", service: "worker-7/hr", severity: "success" as const },
    { time: "12:18:44", message: "Rebalanced traffic", service: "ingress-nginx", severity: "success" as const },
];

const deploymentFeed = [
    { time: "12:31:30", message: "Deployed payment-service v2.16.0", service: undefined, severity: "success" as const },
    { time: "12:21:10", message: "Rolled back inventory v2.7.1", service: undefined, severity: "warning" as const },
    { time: "12:22:10", message: "Deployed user-service v1.34.2", service: undefined, severity: "success" as const },
    { time: "12:28:11", message: "Updated config - feature flags", service: undefined, severity: "success" as const },
    { time: "12:27:45", message: "Deployed analytics-worker v1.9.0", service: undefined, severity: "success" as const },
];

const aiReasoningFeed = [
    { time: "12:31:42", message: "Detected error rate increase in payment-service...", service: undefined, severity: "critical" as const },
    { time: "12:31:42", message: "Correlated with DB connection pool saturation...", service: undefined, severity: "warning" as const },
    { time: "12:31:42", message: "Analyzed slow queries and resource contention...", service: undefined, severity: "info" as const },
    { time: "12:31:42", message: "Predicted saturation in 6-9 minutes...", service: undefined, severity: "info" as const },
    { time: "12:31:42", message: "Recommended auto-scaling and query optimization...", service: undefined, severity: "success" as const },
];

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

export function OperationsFeed() {
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
