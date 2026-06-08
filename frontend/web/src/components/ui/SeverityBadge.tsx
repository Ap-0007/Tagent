"use client";

import { cn } from "@/lib/utils";

const severityStyles = {
    critical: "bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_8px_-2px_rgba(239,68,68,0.3)]",
    high: "bg-orange-500/10 text-orange-400 border-orange-500/20 shadow-[0_0_8px_-2px_rgba(249,115,22,0.3)]",
    medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    low: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    info: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

interface SeverityBadgeProps {
    severity: keyof typeof severityStyles;
    className?: string;
}

export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
    return (
        <span className={cn(
            "inline-flex items-center px-2 py-0.5 text-2xs font-semibold border rounded-md uppercase tracking-wide",
            severityStyles[severity] || severityStyles.info,
            className
        )}>
            {severity}
        </span>
    );
}
