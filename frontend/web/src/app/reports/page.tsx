"use client";

// ─── AI Incident Knowledge Center ───────────────────────────────────────────

export default function ReportsPage() {
    return (
        <div className="flex-1 overflow-y-auto wi-scrollbar bg-[#0d1117]">
            <style jsx global>{`
                .wi-scrollbar::-webkit-scrollbar { width: 6px; }
                .wi-scrollbar::-webkit-scrollbar-track { background: #161b22; }
                .wi-scrollbar::-webkit-scrollbar-thumb { background: #30363d; border-radius: 3px; }
                @keyframes wi-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
            `}</style>
            <div className="px-4 pt-4 pb-6 space-y-3">
                <KnowledgeOverview />
                <IncidentIntelligenceCards />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                    <OperationalLearnings />
                    <RecurringCategories />
                    <AIKnowledgeInsights />
                </div>
            </div>
        </div>
    );
}

// ─── Knowledge Overview (5 stat cards) ───────────────────────────────────────

function KnowledgeOverview() {
    return (
        <div className="rounded-[12px] border border-[#21262d] bg-[#161b22] p-4">
            <h3 className="text-[13px] font-semibold text-[#e6edf3] mb-3">Knowledge Overview</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                    { label: "Reports Generated", value: "28", trend: "↗ 27% vs last 30 days", color: "#58a6ff" },
                    { label: "Critical Incidents", value: "6", trend: "↗ 20% vs last 30 days", color: "#f85149" },
                    { label: "Auto Resolved", value: "72%", trend: "↗ 18% vs last 30 days", color: "#3fb950" },
                    { label: "Knowledge Entries", value: "156", trend: "↗ 34% vs last 30 days", color: "#a371f7" },
                    { label: "Recurring Patterns", value: "12", trend: "↗ 25% vs last 30 days", color: "#22d3ee" },
                ].map((s, i) => (
                    <div key={i} className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: `${s.color}15`, border: `1.5px solid ${s.color}40` }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                {i === 0 && <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></>}
                                {i === 1 && <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /></>}
                                {i === 2 && <><polyline points="20 6 9 17 4 12" /></>}
                                {i === 3 && <><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /></>}
                                {i === 4 && <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /></>}
                            </svg>
                        </div>
                        <div>
                            <p className="text-[10px] text-[#8b949e]">{s.label}</p>
                            <p className="text-[20px] font-bold text-[#e6edf3] font-mono leading-none">{s.value}</p>
                            <p className="text-[9px] text-[#3fb950] mt-0.5">{s.trend}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── AI Generated Incident Intelligence (5 report cards) ────────────────────

function IncidentIntelligenceCards() {
    const reports = [
        { severity: "Critical", sevColor: "#f85149", title: "Payment Service Failure", date: "May 23, 2024 · 10:24 AM", rootCause: "Database Connection Pool Saturation", affectedCount: 2, resolution: "Scaled connection pool and restarted connections", recoveryTime: "2m 14s", confidence: 96 },
        { severity: "High", sevColor: "#f0883e", title: "API Gateway Latency Spike", date: "May 22, 2024 · 03:18 PM", rootCause: "Upstream Dependency Timeouts", affectedCount: 3, resolution: "Optimized timeouts and implemented circuit breaker", recoveryTime: "7m 32s", confidence: 92 },
        { severity: "High", sevColor: "#f0883e", title: "Worker Memory Pressure", date: "May 20, 2024 · 09:31 AM", rootCause: "Memory Leak in Background Job", affectedCount: 1, resolution: "Patched memory leak and restarted workers", recoveryTime: "11m 48s", confidence: 90 },
        { severity: "Medium", sevColor: "#f0883e", title: "Redis Connection Errors", date: "May 19, 2024 · 08:15 AM", rootCause: "Redis Connection Exhaustion", affectedCount: 2, resolution: "Increased connection limits and added pooling", recoveryTime: "3m 05s", confidence: 88 },
        { severity: "Low", sevColor: "#3fb950", title: "Scheduled Maintenance", date: "May 18, 2024 · 02:00 AM", rootCause: "Planned Maintenance Activity", affectedCount: 0, resolution: "Maintenance completed successfully", recoveryTime: "0m 45s", confidence: 100 },
    ];

    return (
        <div className="rounded-[12px] border border-[#21262d] bg-[#161b22] p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-[14px] font-semibold text-[#e6edf3]">AI Generated Incident Intelligence</h3>
                <button className="text-[10px] text-[#58a6ff] hover:text-[#79c0ff] flex items-center gap-1">View All Reports →</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
                {reports.map((r, i) => (
                    <div key={i} className="rounded-lg bg-[#0d1117] border border-[#21262d] p-3 hover:border-[#30363d] transition-colors flex flex-col">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold w-fit mb-2" style={{ background: `${r.sevColor}18`, color: r.sevColor }}>{r.severity}</span>
                        <p className="text-[12px] font-semibold text-[#e6edf3] mb-0.5">{r.title}</p>
                        <p className="text-[9.5px] text-[#6e7681] mb-2">{r.date}</p>
                        <p className="text-[9.5px] text-[#8b949e]">Root Cause</p>
                        <p className="text-[11px] text-[#e6edf3] font-medium mb-2">{r.rootCause}</p>
                        <p className="text-[9.5px] text-[#8b949e]">Affected Services</p>
                        <div className="flex items-center gap-1 my-1">
                            {Array.from({ length: Math.min(r.affectedCount + 1, 4) }).map((_, j) => (
                                <div key={j} className="w-5 h-5 rounded-full bg-[#21262d] border border-[#30363d] flex items-center justify-center">
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#8b949e" strokeWidth="2"><circle cx="12" cy="12" r="10" /></svg>
                                </div>
                            ))}
                            {r.affectedCount > 0 && <span className="text-[9px] text-[#8b949e] ml-1">+{r.affectedCount}</span>}
                        </div>
                        <p className="text-[9.5px] text-[#8b949e] mt-1">Resolution</p>
                        <p className="text-[10.5px] text-[#e6edf3] mb-2 flex-1">{r.resolution}</p>
                        <div className="flex items-center justify-between mt-auto pt-2 border-t border-[#21262d]">
                            <div>
                                <p className="text-[9px] text-[#8b949e]">Recovery Time</p>
                                <p className="text-[11px] font-bold text-[#e6edf3] font-mono">{r.recoveryTime}</p>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <p className="text-[9px] text-[#8b949e]">AI Confidence</p>
                                <svg width="20" height="20" viewBox="0 0 20 20">
                                    <circle cx="10" cy="10" r="8" fill="none" stroke="#21262d" strokeWidth="2" />
                                    <circle cx="10" cy="10" r="8" fill="none" stroke="#3fb950" strokeWidth="2" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 8 * (r.confidence / 100)} ${2 * Math.PI * 8 * (1 - r.confidence / 100)}`} transform="rotate(-90 10 10)" />
                                </svg>
                                <span className="text-[10px] font-bold text-[#e6edf3] font-mono">{r.confidence}%</span>
                            </div>
                        </div>
                        <button className="mt-2 w-full py-1.5 rounded-md text-[10px] font-semibold text-white flex items-center justify-center gap-1" style={{ background: "linear-gradient(135deg, #1f6feb, #7c3aed)" }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                            Open Report
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Operational Learnings ───────────────────────────────────────────────────

function OperationalLearnings() {
    const learnings = [
        { title: "Increase database connection pool limits", sub: "Prevent connection exhaustion during traffic spikes", impact: "High Impact", impactColor: "#f85149" },
        { title: "Improve deployment rollback strategy", sub: "Automate rollback on high error rate detection", impact: "Medium Impact", impactColor: "#f0883e" },
        { title: "Reduce API retry bursts", sub: "Implement exponential backoff with jitter", impact: "Medium Impact", impactColor: "#f0883e" },
        { title: "Optimize autoscaling thresholds", sub: "Adjust scaling triggers based on memory pressure", impact: "Low Impact", impactColor: "#3fb950" },
    ];
    return (
        <div className="rounded-[12px] border border-[#21262d] bg-[#161b22] p-4">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-semibold text-[#e6edf3]">Operational Learnings</h3>
                <button className="text-[10px] text-[#58a6ff] flex items-center gap-1">View All Learnings →</button>
            </div>
            <div className="space-y-2.5">
                {learnings.map((l, i) => (
                    <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-md bg-[#0d1117] border border-[#21262d] hover:border-[#30363d] transition-colors">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: `${l.impactColor}15`, border: `1.5px solid ${l.impactColor}40` }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={l.impactColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-semibold text-[#e6edf3]">{l.title}</p>
                            <p className="text-[10px] text-[#8b949e]">{l.sub}</p>
                        </div>
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold shrink-0" style={{ background: `${l.impactColor}18`, color: l.impactColor }}>{l.impact}</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#58a6ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><polyline points="9 18 15 12 9 6" /></svg>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Recurring Incident Categories ───────────────────────────────────────────

function RecurringCategories() {
    const categories = [
        { rank: 1, label: "Database Saturation", count: 24, percent: 32, color: "#f85149" },
        { rank: 2, label: "Memory Pressure", count: 18, percent: 24, color: "#f0883e" },
        { rank: 3, label: "Network Failures", count: 12, percent: 16, color: "#58a6ff" },
        { rank: 4, label: "DNS Issues", count: 8, percent: 11, color: "#58a6ff" },
        { rank: 5, label: "Deployment Failures", count: 6, percent: 8, color: "#a371f7" },
    ];
    return (
        <div className="rounded-[12px] border border-[#21262d] bg-[#161b22] p-4">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-semibold text-[#e6edf3]">Recurring Incident Categories</h3>
                <button className="text-[10px] text-[#58a6ff] flex items-center gap-1">View All Patterns →</button>
            </div>
            <div className="space-y-3">
                {categories.map((c, i) => (
                    <div key={i} className="flex items-center gap-3">
                        <span className="text-[12px] font-bold text-[#6e7681] w-4 text-right">{c.rank}</span>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                                <span className="text-[11px] font-semibold text-[#e6edf3]">{c.label}</span>
                                <span className="text-[10px] text-[#8b949e] font-mono">{c.percent}%</span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-[#21262d] overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${c.percent}%`, background: c.color, boxShadow: `0 0 4px ${c.color}40` }} />
                            </div>
                            <p className="text-[9.5px] text-[#6e7681] mt-0.5">{c.count} incidents</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── AI Knowledge Insights ───────────────────────────────────────────────────

function AIKnowledgeInsights() {
    return (
        <div className="rounded-[12px] border border-[#21262d] bg-[#161b22] p-4">
            <h3 className="text-[13px] font-semibold text-[#e6edf3] mb-3">AI Knowledge Insights</h3>
            <div className="flex items-center gap-4 mb-4">
                {/* Brain network visual */}
                <svg width="70" height="70" viewBox="0 0 70 70" className="shrink-0">
                    <defs><radialGradient id="ki-grad"><stop offset="0%" stopColor="#a371f7" stopOpacity="0.4" /><stop offset="100%" stopColor="#a371f7" stopOpacity="0" /></radialGradient></defs>
                    <circle cx="35" cy="35" r="28" fill="url(#ki-grad)" />
                    {[16, 24].map((r, i) => <circle key={i} cx="35" cy="35" r={r} fill="none" stroke="#a371f7" strokeWidth="0.5" strokeOpacity="0.3" />)}
                    {[{ x: 20, y: 20 }, { x: 50, y: 18 }, { x: 55, y: 42 }, { x: 45, y: 55 }, { x: 18, y: 50 }, { x: 15, y: 35 }].map((p, i) => (
                        <g key={i}><line x1="35" y1="35" x2={p.x} y2={p.y} stroke="#a371f7" strokeWidth="0.5" strokeOpacity="0.4" /><circle cx={p.x} cy={p.y} r="2" fill="#a371f7" style={{ filter: "drop-shadow(0 0 2px #a371f7)" }} /></g>
                    ))}
                    <circle cx="35" cy="35" r="4" fill="#a371f7" style={{ filter: "drop-shadow(0 0 4px #a371f7)" }} />
                </svg>
                <div>
                    <p className="text-[12px] font-semibold text-[#e6edf3] mb-1">Tagent AI continuously learns from incidents</p>
                    <p className="text-[10.5px] text-[#8b949e] leading-relaxed">Our AI analyzes patterns, identifies risks, and recommends actions to prevent future incidents.</p>
                </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
                {[
                    { icon: "🔍", label: "Pattern Recognition", sub: "12 patterns detected" },
                    { icon: "⚡", label: "Risk Prediction", sub: "8 high risk areas" },
                    { icon: "🤖", label: "Automated Insights", sub: "Updated daily" },
                ].map((item, i) => (
                    <div key={i} className="rounded-md bg-[#0d1117] border border-[#21262d] p-2.5 text-center">
                        <span className="text-[16px]">{item.icon}</span>
                        <p className="text-[10px] text-[#e6edf3] font-semibold mt-1">{item.label}</p>
                        <p className="text-[9px] text-[#8b949e]">{item.sub}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
