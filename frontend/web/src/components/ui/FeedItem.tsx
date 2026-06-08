"use client";

import { cn } from "@/lib/utils";

interface FeedItemProps {
    time: string;
    message: string;
    service?: string;
    severity?: "critical" | "warning" | "info" | "success";
    className?: string;
}

const dotColors = {
    critical: "bg-red-400",
    warning: "bg-amber-400",
    info: "bg-blue-400",
    success: "bg-emerald-400",
};

const badgeColors = {
    critical: "bg-red-500/10 text-red-400 border-red-500/20",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    info: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

export function FeedItem({ time, message, service, severity = "info", className }: FeedItemProps) {
    return (
        <div className={cn(
            "feed-item flex items-start gap-3 px-4 py-2.5 hover:bg-white/[0.02] transition-colors rounded-lg",
            className
        )}>
            <span className="text-2xs text-slate-500 font-mono whitespace-nowrap mt-0.5 w-14 shrink-0">{time}</span>
            <div className={cn("w-1.5 h-1.5 rounded-full mt-1.5 shrink-0", dotColors[severity])} />
            <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-300 leading-relaxed truncate">{message}</p>
                {service && (
                    <span className="text-2xs text-slate-500 font-mono">{service}</span>
                )}
            </div>
            <span className={cn(
                "text-2xs font-medium px-1.5 py-0.5 rounded border shrink-0",
                badgeColors[severity]
            )}>
                {severity === "critical" ? "Critical" : severity === "warning" ? "Warning" : severity === "success" ? "Success" : "Info"}
            </span>
        </div>
    );
}
