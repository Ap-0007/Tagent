"use client";

import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

interface KPICardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    subtitleColor?: string;
    icon: LucideIcon;
    accentColor?: "blue" | "green" | "purple" | "amber" | "red" | "cyan";
    sparkData?: number[];
    live?: boolean;
    /** Circular progress ring (0-100) */
    progress?: number;
    /** Right side content */
    rightContent?: React.ReactNode;
    /** Additional stats below */
    children?: React.ReactNode;
}

const accentMap = {
    blue: {
        border: "border-blue-500/20",
        bg: "from-blue-500/8 to-transparent",
        text: "text-blue-400",
        ring: "#3b82f6",
        spark: "#3b82f6",
        iconBg: "bg-blue-500/10",
    },
    green: {
        border: "border-emerald-500/20",
        bg: "from-emerald-500/8 to-transparent",
        text: "text-emerald-400",
        ring: "#10b981",
        spark: "#10b981",
        iconBg: "bg-emerald-500/10",
    },
    purple: {
        border: "border-purple-500/20",
        bg: "from-purple-500/8 to-transparent",
        text: "text-purple-400",
        ring: "#8b5cf6",
        spark: "#8b5cf6",
        iconBg: "bg-purple-500/10",
    },
    amber: {
        border: "border-amber-500/20",
        bg: "from-amber-500/8 to-transparent",
        text: "text-amber-400",
        ring: "#f59e0b",
        spark: "#f59e0b",
        iconBg: "bg-amber-500/10",
    },
    red: {
        border: "border-red-500/20",
        bg: "from-red-500/8 to-transparent",
        text: "text-red-400",
        ring: "#ef4444",
        spark: "#ef4444",
        iconBg: "bg-red-500/10",
    },
    cyan: {
        border: "border-cyan-500/20",
        bg: "from-cyan-500/8 to-transparent",
        text: "text-cyan-400",
        ring: "#06b6d4",
        spark: "#06b6d4",
        iconBg: "bg-cyan-500/10",
    },
};

function CircularProgress({ value, color, size = 52 }: { value: number; color: string; size?: number }) {
    const r = (size - 6) / 2;
    const circumference = 2 * Math.PI * r;
    const offset = circumference - (value / 100) * circumference;

    return (
        <svg width={size} height={size} className="transform -rotate-90">
            {/* Background ring */}
            <circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke="rgba(100,116,139,0.1)"
                strokeWidth="3"
            />
            {/* Progress ring */}
            <circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={color}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                className="transition-all duration-1000 ease-out"
                style={{ filter: `drop-shadow(0 0 4px ${color}40)` }}
            />
        </svg>
    );
}

function MiniSparkline({ data, color, width = 80, height = 28 }: { data: number[]; color: string; width?: number; height?: number }) {
    if (!data || data.length < 2) return null;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const points = data.map((v, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((v - min) / range) * (height - 4) - 2;
        return `${x},${y}`;
    }).join(" ");

    const areaPoints = `0,${height} ${points} ${width},${height}`;

    return (
        <svg width={width} height={height} className="shrink-0">
            {/* Area fill */}
            <polyline
                points={areaPoints}
                fill={color}
                fillOpacity="0.08"
                stroke="none"
            />
            {/* Line */}
            <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.7"
            />
        </svg>
    );
}

export function KPICard({
    title,
    value,
    subtitle,
    subtitleColor,
    icon: Icon,
    accentColor = "blue",
    sparkData,
    live,
    progress,
    rightContent,
    children,
}: KPICardProps) {
    const accent = accentMap[accentColor];

    return (
        <div className={cn(
            "glass-card-elevated p-4 relative overflow-hidden group hover:scale-[1.01] transition-transform duration-300",
            accent.border
        )}>
            {/* Gradient background */}
            <div className={cn("absolute inset-0 bg-gradient-to-br opacity-40 pointer-events-none", accent.bg)} />

            {/* Content */}
            <div className="relative z-10 flex items-start justify-between h-full">
                {/* Left side */}
                <div className="flex-1 min-w-0">
                    {/* Title row with icon */}
                    <div className="flex items-center gap-2 mb-2.5">
                        <div className={cn("w-6 h-6 rounded-md flex items-center justify-center", accent.iconBg)}>
                            <Icon className={cn("w-3.5 h-3.5", accent.text)} />
                        </div>
                        <span className="text-xs text-slate-400 font-medium">{title}</span>
                    </div>

                    {/* Value */}
                    <div className="flex items-baseline gap-1">
                        <p className="text-2xl font-bold text-slate-100 font-mono tracking-tight leading-none">{value}</p>
                        {value === "96" && <span className="text-sm text-slate-500 font-mono">/100</span>}
                    </div>

                    {/* Subtitle */}
                    {subtitle && (
                        <p className={cn("text-xs mt-1.5 font-medium", subtitleColor || accent.text)}>
                            {subtitle}
                        </p>
                    )}

                    {/* Children (extra stats) */}
                    {children && <div className="mt-2">{children}</div>}

                    {/* Sparkline at bottom */}
                    {sparkData && (
                        <div className="mt-3">
                            <MiniSparkline data={sparkData} color={accent.spark} />
                        </div>
                    )}
                </div>

                {/* Right side - progress ring or custom content */}
                <div className="shrink-0 ml-3 flex flex-col items-center">
                    {progress !== undefined && (
                        <CircularProgress value={progress} color={accent.ring} />
                    )}
                    {rightContent}
                </div>
            </div>
        </div>
    );
}
