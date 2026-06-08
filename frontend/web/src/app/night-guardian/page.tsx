"use client";

import { useState } from "react";

export default function NightGuardianPage() {
    return (
        <div className="flex-1 overflow-y-auto wi-scrollbar bg-[#0d1117]">
            <style jsx global>{`
                .wi-scrollbar::-webkit-scrollbar { width: 6px; }
                .wi-scrollbar::-webkit-scrollbar-track { background: #161b22; }
                .wi-scrollbar::-webkit-scrollbar-thumb { background: #30363d; border-radius: 3px; }
                @keyframes wi-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
            `}</style>
            <div className="px-4 pt-4 pb-6 space-y-3">
                <GuardianStatsRow />
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-3">
                    <GuardianOverview />
                    <RecentActions />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    <ProtectionConfig />
                    <GeneratedReports />
                </div>
            </div>
        </div>
    );
}

function GuardianStatsRow() {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
                { label: "Protection Status", value: "Active", sub: "All systems protected", color: "#3fb950" },
                { label: "Services Protected", value: "47", sub: "100% of critical services", color: "#58a6ff" },
                { label: "Pods Monitored", value: "312", sub: "Across 24 namespaces", color: "#a371f7" },
                { label: "Last Scan", value: "12s ago", sub: "Continuous scanning", color: "#22d3ee" },
                { label: "AI Confidence", value: "96%", sub: "High confidence", color: "#3fb950" },
                { label: "Auto Remediation", value: "Enabled", sub: "24 actions executed", color: "#3fb950" },
            ].map((s, i) => (
                <div key={i} className="rounded-[10px] border border-[#21262d] bg-[#161b22] p-3 flex items-center gap-3" style={{ background: `radial-gradient(circle at 85% 25%, ${s.color}12 0%, transparent 55%), #161b22` }}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: `${s.color}15`, border: `1.5px solid ${s.color}40` }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            {i === 0 && <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" /></>}
                            {i === 1 && <><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /></>}
                            {i === 2 && <><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></>}
                            {i === 3 && <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>}
                            {i === 4 && <><path d="M12 0L14 9L24 12L14 15L12 24L10 15L0 12L10 9Z" fill={s.color} stroke="none" /></>}
                            {i === 5 && <><polyline points="20 6 9 17 4 12" /></>}
                        </svg>
                    </div>
                    <div>
                        <p className="text-[9.5px] text-[#8b949e]">{s.label}</p>
                        <p className="text-[16px] font-bold text-[#e6edf3] font-mono leading-none" style={{ color: i === 0 || i === 5 ? s.color : "#e6edf3" }}>{s.value}</p>
                        <p className="text-[9px] text-[#6e7681] mt-0.5">{s.sub}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

function GuardianOverview() {
    const pipeline = ["Monitoring", "Detection", "Analysis", "Remediation", "Documentation"];
    const pipelineDesc = [
        "Continuously observes infrastructure, logs, metrics and traces",
        "Detects anomalies and unusual behavior in real time",
        "AI analyzes signals and identifies root causes",
        "Executes safe, tested actions to restore health",
        "Creates incident report, postmortem and stores learnings",
    ];
    const modules = [
        { title: "Anomaly Detection", sub: "Detects performance issues, errors, resource pressure and unusual behavior.", status: "Always On", color: "#3fb950" },
        { title: "Root Cause Analysis", sub: "Correlates signals across logs, metrics, traces and topology to find the true cause.", status: "Always On", color: "#3fb950" },
        { title: "Safe Auto Remediation", sub: "Executes pre-approved, safe actions to recover services without human intervention.", status: "Enabled", color: "#3fb950" },
        { title: "Incident Documentation", sub: "Auto-generates incident reports, postmortems and actionable learnings.", status: "Always On", color: "#3fb950" },
    ];

    return (
        <div className="space-y-3">
            <div className="rounded-[12px] border border-[#21262d] bg-[#161b22] p-4">
                <h3 className="text-[14px] font-semibold text-[#e6edf3] mb-1">Night Guardian Overview</h3>
                <p className="text-[11px] text-[#8b949e] mb-4">Tagent continuously protects infrastructure during low-activity periods without requiring human intervention.</p>
                {/* Pipeline */}
                <div className="flex items-start justify-between mb-6">
                    {pipeline.map((step, i) => (
                        <div key={i} className="flex flex-col items-center w-[18%]">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-2" style={{ background: "rgba(88,166,255,0.08)", border: "1.5px solid rgba(88,166,255,0.3)" }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#58a6ff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                    {i === 0 && <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>}
                                    {i === 1 && <><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></>}
                                    {i === 2 && <><path d="M12 0L14 9L24 12L14 15L12 24L10 15L0 12L10 9Z" fill="#58a6ff" stroke="none" /></>}
                                    {i === 3 && <><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></>}
                                    {i === 4 && <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></>}
                                </svg>
                            </div>
                            <p className="text-[11px] font-semibold text-[#e6edf3] text-center">{step}</p>
                            <p className="text-[9.5px] text-[#8b949e] text-center mt-0.5 leading-snug">{pipelineDesc[i]}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Protection Modules */}
            <div className="rounded-[12px] border border-[#21262d] bg-[#161b22] p-4">
                <h3 className="text-[13px] font-semibold text-[#e6edf3] mb-3">Protection Modules</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5">
                    {modules.map((m, i) => (
                        <div key={i} className="rounded-lg bg-[#0d1117] border border-[#21262d] p-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center mb-2" style={{ background: "rgba(88,166,255,0.1)", border: "1.5px solid rgba(88,166,255,0.3)" }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#58a6ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                </svg>
                            </div>
                            <p className="text-[11px] font-semibold text-[#e6edf3] mb-0.5">{m.title}</p>
                            <p className="text-[10px] text-[#8b949e] leading-snug mb-2">{m.sub}</p>
                            <span className="text-[9px] text-[#3fb950] font-semibold">● {m.status}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function RecentActions() {
    const actions = [
        { title: "Latency anomaly detected in payment-service", sub: "P95 latency increased by 42%", time: "12s ago", color: "#f85149" },
        { title: "Database saturation identified", sub: "Connection pool usage at 92%", time: "24s ago", color: "#f0883e" },
        { title: "Connection pool scaled automatically", sub: "Increased max connections from 50 to 120", time: "36s ago", color: "#3fb950" },
        { title: "Service health restored", sub: "Latency returned to normal baseline", time: "48s ago", color: "#3fb950" },
        { title: "Incident documented and postmortem generated", sub: "Knowledge saved to Incident Intelligence Archive", time: "1m ago", color: "#58a6ff" },
    ];
    return (
        <div className="rounded-[12px] border border-[#21262d] bg-[#161b22] p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-[14px] font-semibold text-[#e6edf3]">Recent Autonomous Actions</h3>
                <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#3fb950]/10 border border-[#3fb950]/30">
                    <span className="w-1 h-1 rounded-full bg-[#3fb950]" style={{ boxShadow: "0 0 4px #3fb950", animation: "wi-pulse 2s infinite" }} />
                    <span className="text-[9px] text-[#3fb950] font-semibold">Live Feed</span>
                </div>
            </div>
            <div className="space-y-3">
                {actions.map((a, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full mt-1 shrink-0" style={{ background: a.color, boxShadow: `0 0 4px ${a.color}` }} />
                        <div className="flex-1 min-w-0">
                            <p className="text-[11.5px] font-semibold text-[#e6edf3]">{a.title}</p>
                            <p className="text-[10px] text-[#8b949e] mt-0.5">{a.sub}</p>
                        </div>
                        <span className="text-[9.5px] text-[#6e7681] font-mono shrink-0">{a.time}</span>
                    </div>
                ))}
            </div>
            <button className="mt-3 w-full flex items-center justify-between py-2 text-[11px] text-[#58a6ff] hover:text-[#79c0ff] border-t border-[#21262d] pt-3">
                <span>View All Activity</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
            </button>
        </div>
    );
}

function ProtectionConfig() {
    const [autoFix, setAutoFix] = useState(true);
    return (
        <div className="rounded-[12px] border border-[#21262d] bg-[#161b22] p-4">
            <h3 className="text-[14px] font-semibold text-[#e6edf3] mb-4">Autonomous Protection Configuration</h3>
            <div className="grid grid-cols-4 gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-[11px] text-[#8b949e]">Auto Fix</span>
                        <button onClick={() => setAutoFix(!autoFix)} className={`w-9 h-5 rounded-full transition-colors ${autoFix ? "bg-[#1f6feb]" : "bg-[#21262d]"}`}>
                            <div className={`w-4 h-4 rounded-full bg-white transition-transform ${autoFix ? "translate-x-4" : "translate-x-0.5"}`} />
                        </button>
                    </div>
                    <p className="text-[10px] text-[#8b949e] leading-relaxed">Allow Night Guardian to execute remediation actions automatically.</p>
                    <p className="text-[9px] text-[#3fb950] font-semibold mt-2">● Enabled</p>
                </div>
                <div>
                    <p className="text-[11px] text-[#8b949e] mb-2">Confidence Threshold</p>
                    <p className="text-[24px] font-bold text-[#e6edf3] font-mono">90%</p>
                    <div className="w-full h-1.5 rounded-full bg-[#21262d] mt-2 overflow-hidden">
                        <div className="h-full rounded-full bg-[#1f6feb]" style={{ width: "90%", boxShadow: "0 0 4px #1f6feb" }} />
                    </div>
                    <p className="text-[9px] text-[#8b949e] mt-1.5">Minimum confidence required to execute actions.</p>
                </div>
                <div>
                    <p className="text-[11px] text-[#8b949e] mb-2">Protected Namespaces</p>
                    <p className="text-[24px] font-bold text-[#e6edf3] font-mono">12</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                        {["prod", "staging", "monitoring", "kube-system"].map((ns, i) => (
                            <span key={i} className="w-5 h-5 rounded-full bg-[#21262d] border border-[#30363d] flex items-center justify-center">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#8b949e" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                            </span>
                        ))}
                    </div>
                    <p className="text-[9px] text-[#8b949e] mt-1.5">All critical namespaces are protected.</p>
                </div>
                <div>
                    <p className="text-[11px] text-[#8b949e] mb-2">Escalation Rules</p>
                    <p className="text-[24px] font-bold text-[#e6edf3] font-mono">2 <span className="text-[12px] text-[#8b949e] font-normal">Active</span></p>
                    <p className="text-[10px] text-[#8b949e] mt-2 leading-relaxed">Escalate to human if confidence is below threshold or action fails.</p>
                </div>
            </div>
        </div>
    );
}

function GeneratedReports() {
    const reports = [
        { incident: "Payment Service Failure", severity: "Critical", sevColor: "#f85149", rootCause: "Database Connection Pool Saturation", action: "Scaled Connection Pool\nRestarted Connections", recovery: "2m 14s", confidence: 96, time: "5m ago" },
        { incident: "API Gateway Latency Spike", severity: "High", sevColor: "#f0883e", rootCause: "Upstream Dependency Timeouts", action: "Optimized Timeouts\nCircuit Breaker Enabled", recovery: "4m 32s", confidence: 94, time: "45m ago" },
        { incident: "Worker Memory Pressure", severity: "High", sevColor: "#f0883e", rootCause: "Memory Leak in Background Job", action: "Restarted Workers\nPatched Memory Leak", recovery: "3m 08s", confidence: 92, time: "2h ago" },
        { incident: "Redis Connection Errors", severity: "Medium", sevColor: "#f0883e", rootCause: "Redis Connection Exhaustion", action: "Increased Connection Limits\nCleared Stale Connections", recovery: "1m 47s", confidence: 91, time: "4h ago" },
    ];
    return (
        <div className="rounded-[12px] border border-[#21262d] bg-[#161b22] p-4">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-[14px] font-semibold text-[#e6edf3]">Generated Reports</h3>
                <button className="text-[10px] text-[#58a6ff] flex items-center gap-1">View All Reports →</button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-[10.5px]">
                    <thead><tr className="border-b border-[#21262d] text-[#8b949e]">
                        <th className="text-left py-2 font-medium">Incident</th>
                        <th className="text-left py-2 font-medium">Root Cause</th>
                        <th className="text-left py-2 font-medium">Action Taken</th>
                        <th className="text-left py-2 font-medium">Recovery</th>
                        <th className="text-left py-2 font-medium">Confidence</th>
                        <th className="text-left py-2 font-medium">Generated</th>
                    </tr></thead>
                    <tbody>
                        {reports.map((r, i) => (
                            <tr key={i} className="border-b border-[#21262d] last:border-0 hover:bg-[#0d1117] transition-colors">
                                <td className="py-2.5">
                                    <p className="text-[#e6edf3] font-medium">{r.incident}</p>
                                    <span className="text-[9px] px-1 py-0.5 rounded font-bold" style={{ background: `${r.sevColor}18`, color: r.sevColor }}>{r.severity}</span>
                                </td>
                                <td className="py-2.5 text-[#8b949e]">{r.rootCause}</td>
                                <td className="py-2.5 text-[#e6edf3] whitespace-pre-line">{r.action}</td>
                                <td className="py-2.5 text-[#e6edf3] font-mono">{r.recovery}</td>
                                <td className="py-2.5">
                                    <div className="flex items-center gap-1">
                                        <svg width="16" height="16" viewBox="0 0 16 16">
                                            <circle cx="8" cy="8" r="6" fill="none" stroke="#21262d" strokeWidth="2" />
                                            <circle cx="8" cy="8" r="6" fill="none" stroke="#3fb950" strokeWidth="2" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 6 * (r.confidence / 100)} ${2 * Math.PI * 6 * (1 - r.confidence / 100)}`} transform="rotate(-90 8 8)" />
                                        </svg>
                                        <span className="text-[#e6edf3] font-mono">{r.confidence}%</span>
                                    </div>
                                </td>
                                <td className="py-2.5 text-[#6e7681]">{r.time}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
