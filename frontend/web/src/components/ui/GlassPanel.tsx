"use client";

import { cn } from "@/lib/utils";

interface GlassPanelProps {
    title?: string;
    subtitle?: string;
    live?: boolean;
    action?: React.ReactNode;
    className?: string;
    children: React.ReactNode;
    noPadding?: boolean;
}

export function GlassPanel({ title, subtitle, live, action, className, children, noPadding }: GlassPanelProps) {
    return (
        <div className={cn("glass-card-elevated overflow-hidden", className)}>
            {(title || action) && (
                <div className="px-5 py-3.5 border-b border-[rgba(59,130,246,0.08)] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div>
                            <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
                            {subtitle && <p className="text-2xs text-slate-500 mt-0.5">{subtitle}</p>}
                        </div>
                        {live && (
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                <span className="text-2xs text-emerald-400 font-medium">Live</span>
                            </div>
                        )}
                    </div>
                    {action}
                </div>
            )}
            <div className={cn(!noPadding && "p-5")}>
                {children}
            </div>
        </div>
    );
}
