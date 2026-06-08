"use client";

// ─── Alert Data ──────────────────────────────────────────────────────────────

interface Alert {
    icon: "warning" | "refresh" | "cpu" | "memory" | "shield";
    title: string;
    description: string;
    confidence: number;
    color: string;
    bgColor: string;
    sparkColor: string;
    sparkPoints: string;
}

const ALERTS: Alert[] = [
    {
        icon: "warning",
        title: "Pending Workloads Spike",
        description: "6 pods pending for >2m in kube-system",
        confidence: 92,
        color: "#f0883e",
        bgColor: "rgba(240,136,62,0.15)",
        sparkColor: "#f0883e",
        sparkPoints: "0,16 8,15 16,12 24,11 32,8 40,5 48,3",
    },
    {
        icon: "refresh",
        title: "Restart Pattern Detected",
        description: "28 pods restarting frequently in last 15m.",
        confidence: 89,
        color: "#f85149",
        bgColor: "rgba(248,81,73,0.15)",
        sparkColor: "#f85149",
        sparkPoints: "0,12 6,4 12,14 18,3 24,11 30,2 36,13 42,5 48,10",
    },
    {
        icon: "cpu",
        title: "CPU Pressure Rising",
        description: "api-gateway experiencing sustained CPU > 80%",
        confidence: 87,
        color: "#f0883e",
        bgColor: "rgba(240,136,62,0.15)",
        sparkColor: "#f0883e",
        sparkPoints: "0,15 8,14 16,12 24,9 32,7 40,5 48,3",
    },
    {
        icon: "memory",
        title: "Memory Anomaly",
        description: "user-service memory usage growing faster than normal",
        confidence: 91,
        color: "#a371f7",
        bgColor: "rgba(163,113,247,0.15)",
        sparkColor: "#a371f7",
        sparkPoints: "0,14 6,11 12,13 18,9 24,11 30,7 36,9 42,5 48,4",
    },
    {
        icon: "shield",
        title: "Workload Stability",
        description: "92% of workloads are stable. No critical incidents detected.",
        confidence: 96,
        color: "#3fb950",
        bgColor: "rgba(63,185,80,0.15)",
        sparkColor: "#3fb950",
        sparkPoints: "0,9 8,8 16,9 24,8 32,9 40,8 48,9",
    },
];

interface Recommendation {
    icon: "warning" | "refresh" | "memory";
    color: string;
    bgColor: string;
    title: string;
    detail: string;
    impact: "High" | "Medium";
}

const RECOMMENDATIONS: Recommendation[] = [
    {
        icon: "warning",
        color: "#f0883e",
        bgColor: "rgba(240,136,62,0.15)",
        title: "Scale api-gateway",
        detail: "CPU expected to hit 95% in 23m",
        impact: "High",
    },
    {
        icon: "refresh",
        color: "#f85149",
        bgColor: "rgba(248,81,73,0.15)",
        title: "Investigate restarts",
        detail: "28 pods with CrashLoopBackOff",
        impact: "High",
    },
    {
        icon: "memory",
        color: "#a371f7",
        bgColor: "rgba(163,113,247,0.15)",
        title: "Increase memory limits",
        detail: "user-service projected to OOM in 34m",
        impact: "Medium",
    },
];

// ─── Component ───────────────────────────────────────────────────────────────

export function AIInsightsSidebar() {
    const confidence = 92;
    const circumference = 2 * Math.PI * 24;
    const offset = circumference - (confidence / 100) * circumference;

    return (
        <aside className="rounded-[10px] border border-[#21262d] bg-[#161b22] p-3.5 self-start xl:sticky xl:top-4 max-h-[calc(100vh-90px)] overflow-y-auto wi-scrollbar">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div
                        className="w-7 h-7 rounded-md flex items-center justify-center"
                        style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                            <line x1="12" y1="19" x2="12" y2="22" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-[13px] font-semibold text-[#e6edf3] leading-tight">AI Insights</h3>
                        <p className="text-[9px] text-[#8b949e]">Powered by Tagent AI</p>
                    </div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#a371f7">
                    <path d="M12 0L14 9L24 12L14 15L12 24L10 15L0 12L10 9Z" />
                </svg>
            </div>

            {/* Overall Cluster Confidence */}
            <div className="rounded-lg bg-[#0d1117] border border-[#21262d] p-3 mb-3">
                <div className="flex items-center gap-3">
                    {/* Donut */}
                    <div className="relative shrink-0">
                        <svg width="56" height="56" viewBox="0 0 56 56">
                            <defs>
                                <linearGradient id="conf-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#a371f7" />
                                    <stop offset="100%" stopColor="#3fb950" />
                                </linearGradient>
                            </defs>
                            <circle cx="28" cy="28" r="24" fill="none" stroke="#21262d" strokeWidth="4" />
                            <circle
                                cx="28"
                                cy="28"
                                r="24"
                                fill="none"
                                stroke="url(#conf-grad)"
                                strokeWidth="4"
                                strokeLinecap="round"
                                strokeDasharray={circumference}
                                strokeDashoffset={offset}
                                transform="rotate(-90 28 28)"
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-[14px] font-bold text-[#a371f7]">{confidence}%</span>
                        </div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold text-[#e6edf3]">Overall Cluster Confidence</p>
                        <div className="w-full h-1.5 rounded-full bg-[#21262d] mt-1.5 overflow-hidden">
                            <div
                                className="h-full rounded-full"
                                style={{
                                    width: `${confidence}%`,
                                    background: "linear-gradient(90deg, #a371f7, #3fb950)",
                                }}
                            />
                        </div>
                        <p className="text-[10px] text-[#3fb950] mt-1.5 flex items-center gap-1">
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                            High confidence in analysis
                        </p>
                    </div>
                </div>
            </div>

            {/* Alert Cards */}
            <div className="space-y-2">
                {ALERTS.map((alert, i) => (
                    <AlertCard key={i} alert={alert} />
                ))}
            </div>

            {/* AI Recommendations */}
            <div className="mt-4">
                <div className="flex items-center justify-between mb-2.5">
                    <h4 className="text-[12px] font-semibold text-[#e6edf3]">AI Recommendations</h4>
                    <span
                        className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white"
                        style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
                    >
                        {RECOMMENDATIONS.length}
                    </span>
                </div>
                <div className="space-y-1.5">
                    {RECOMMENDATIONS.map((rec, i) => (
                        <RecommendationRow key={i} rec={rec} />
                    ))}
                </div>
                <button className="mt-2.5 text-[11px] text-[#58a6ff] hover:text-[#79c0ff] transition-colors flex items-center gap-1 font-medium">
                    View all recommendations
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                    </svg>
                </button>
            </div>
        </aside>
    );
}

// ─── Alert Card ──────────────────────────────────────────────────────────────

function AlertCard({ alert }: { alert: Alert }) {
    return (
        <div className="rounded-lg bg-[#0d1117] border border-[#21262d] p-2.5 hover:border-[#30363d] transition-colors group cursor-pointer">
            <div className="flex items-start gap-2">
                <div
                    className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                    style={{ background: alert.bgColor }}
                >
                    <AlertIcon icon={alert.icon} color={alert.color} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                        <p className="text-[11.5px] font-semibold leading-tight" style={{ color: alert.color }}>
                            {alert.title}
                        </p>
                        <Sparkline points={alert.sparkPoints} color={alert.sparkColor} />
                    </div>
                    <p className="text-[10.5px] text-[#8b949e] leading-snug">{alert.description}</p>
                    <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] text-[#6e7681] font-mono">
                            Confidence {alert.confidence}%
                        </span>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#6e7681" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:text-[#e6edf3] transition-colors">
                            <polyline points="9 18 15 12 9 6" />
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Sparkline({ points, color }: { points: string; color: string }) {
    return (
        <svg width="50" height="18" viewBox="0 0 48 18" className="shrink-0">
            <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.85"
            />
        </svg>
    );
}

// ─── Recommendation Row ──────────────────────────────────────────────────────

function RecommendationRow({ rec }: { rec: Recommendation }) {
    const impactStyle = rec.impact === "High"
        ? { bg: "rgba(248,81,73,0.1)", color: "#f85149", border: "rgba(248,81,73,0.3)" }
        : { bg: "rgba(240,136,62,0.1)", color: "#f0883e", border: "rgba(240,136,62,0.3)" };

    return (
        <div className="flex items-center gap-2 p-2 rounded-md bg-[#0d1117] border border-[#21262d] hover:border-[#30363d] transition-colors group cursor-pointer">
            <div
                className="w-6 h-6 rounded flex items-center justify-center shrink-0"
                style={{ background: rec.bgColor }}
            >
                <AlertIcon icon={rec.icon} color={rec.color} size={12} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-[#e6edf3] truncate">{rec.title}</p>
                <p className="text-[10px] text-[#8b949e] truncate">{rec.detail}</p>
            </div>
            <span
                className="text-[9.5px] font-semibold px-1.5 py-0.5 rounded shrink-0"
                style={{
                    background: impactStyle.bg,
                    color: impactStyle.color,
                    border: `1px solid ${impactStyle.border}`,
                }}
            >
                {rec.impact} Impact
            </span>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#6e7681" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 group-hover:text-[#e6edf3] transition-colors">
                <polyline points="9 18 15 12 9 6" />
            </svg>
        </div>
    );
}

// ─── Alert Icons ─────────────────────────────────────────────────────────────

function AlertIcon({ icon, color, size = 14 }: { icon: Alert["icon"]; color: string; size?: number }) {
    const props = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

    if (icon === "warning") {
        return (
            <svg {...props}>
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
        );
    }
    if (icon === "refresh") {
        return (
            <svg {...props}>
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
        );
    }
    if (icon === "cpu") {
        return (
            <svg {...props}>
                <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
                <rect x="9" y="9" width="6" height="6" />
                <line x1="9" y1="1" x2="9" y2="4" />
                <line x1="15" y1="1" x2="15" y2="4" />
                <line x1="9" y1="20" x2="9" y2="23" />
                <line x1="15" y1="20" x2="15" y2="23" />
                <line x1="20" y1="9" x2="23" y2="9" />
                <line x1="20" y1="14" x2="23" y2="14" />
                <line x1="1" y1="9" x2="4" y2="9" />
                <line x1="1" y1="14" x2="4" y2="14" />
            </svg>
        );
    }
    if (icon === "memory") {
        return (
            <svg {...props}>
                <rect x="3" y="6" width="18" height="12" rx="2" />
                <line x1="7" y1="10" x2="7" y2="14" />
                <line x1="11" y1="10" x2="11" y2="14" />
                <line x1="15" y1="10" x2="15" y2="14" />
                <line x1="19" y1="10" x2="19" y2="14" />
            </svg>
        );
    }
    // shield
    return (
        <svg {...props}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <polyline points="9 12 11 14 15 10" />
        </svg>
    );
}
