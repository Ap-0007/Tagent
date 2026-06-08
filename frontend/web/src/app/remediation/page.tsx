"use client";

import { useState } from "react";

export default function RemediationPage() {
    return (
        <div className="flex-1 overflow-y-auto wi-scrollbar bg-[#0d1117]">
            <style jsx global>{`
                .wi-scrollbar::-webkit-scrollbar { width: 6px; }
                .wi-scrollbar::-webkit-scrollbar-track { background: #161b22; }
                .wi-scrollbar::-webkit-scrollbar-thumb { background: #30363d; border-radius: 3px; }
                @keyframes wi-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
            `}</style>
            <div className="px-4 pt-4 pb-6 space-y-3">
                <AIRecommendedRecovery />
                <RecoveryStrategy />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                    <RecommendedActions />
                    <ExecutionTimeline />
                    <AIReasoning />
                </div>
                <BottomStatusBar />
            </div>
        </div>
    );
}

function AIRecommendedRecovery() {
    return (
        <div className="rounded-[12px] border border-[#21262d] bg-[#161b22] p-5" style={{ background: "linear-gradient(135deg, rgba(31,111,235,0.04) 0%, #161b22 50%)" }}>
            <div className="flex items-center gap-2 mb-4">
                <h3 className="text-[14px] font-semibold text-[#e6edf3]">AI Recommended Recovery</h3>
                <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold" style={{ background: "rgba(63,185,80,0.15)", color: "#3fb950" }}>Active Recommendation</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div>
                    <p className="text-[10px] text-[#8b949e]">Incident</p>
                    <div className="flex items-center gap-1.5 mt-1">
                        <span className="w-2 h-2 rounded-full bg-[#f85149]" />
                        <p className="text-[12px] font-semibold text-[#e6edf3]">Payment Service Failure</p>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-bold mt-1 inline-block" style={{ background: "rgba(248,81,73,0.15)", color: "#f85149" }}>Critical</span>
                    <p className="text-[9.5px] text-[#8b949e] mt-1">Detected 12 minutes ago</p>
                </div>
                <div>
                    <p className="text-[10px] text-[#8b949e]">Root Cause</p>
                    <p className="text-[13px] font-semibold text-[#58a6ff] mt-1">Database Connection Pool Saturation</p>
                    <p className="text-[10px] text-[#8b949e] mt-1">Connection pool exhausted leading to request failures.</p>
                </div>
                <div>
                    <p className="text-[10px] text-[#8b949e]">Confidence Score</p>
                    <div className="flex items-center gap-2 mt-1">
                        <svg width="36" height="36" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r="14" fill="none" stroke="#21262d" strokeWidth="3" />
                            <circle cx="18" cy="18" r="14" fill="none" stroke="#3fb950" strokeWidth="3" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 14 * 0.96} ${2 * Math.PI * 14 * 0.04}`} transform="rotate(-90 18 18)" style={{ filter: "drop-shadow(0 0 3px #3fb950)" }} />
                        </svg>
                        <div><p className="text-[16px] font-bold text-[#e6edf3] font-mono">96%</p><p className="text-[9px] text-[#3fb950]">High Confidence</p></div>
                    </div>
                </div>
                <div>
                    <p className="text-[10px] text-[#8b949e]">Affected Services</p>
                    <div className="space-y-1 mt-1.5">
                        {[{ s: "payment-service", i: "High", c: "#f85149" }, { s: "checkout-service", i: "Medium", c: "#f0883e" }, { s: "notification-service", i: "Low", c: "#3fb950" }].map((x, i) => (
                            <div key={i} className="flex items-center justify-between text-[10px]">
                                <span className="text-[#e6edf3]">{x.s}</span>
                                <span style={{ color: x.c }}>● {x.i}</span>
                            </div>
                        ))}
                        <p className="text-[9px] text-[#6e7681]">+2 more services</p>
                    </div>
                </div>
                <div>
                    <p className="text-[10px] text-[#8b949e]">Estimated Recovery Time</p>
                    <p className="text-[20px] font-bold text-[#e6edf3] font-mono mt-1">⏱ 2m 14s</p>
                    <p className="text-[9.5px] text-[#8b949e]">At 10:42 AM</p>
                    <p className="text-[10px] text-[#8b949e] mt-2">Impact Reduction</p>
                    <p className="text-[12px] font-bold text-[#3fb950]">High</p>
                </div>
                <div>
                    <p className="text-[10px] text-[#8b949e]">Risk Assessment</p>
                    <p className="text-[16px] font-bold text-[#3fb950] mt-1">Low Risk</p>
                    <p className="text-[10px] text-[#8b949e] mt-1">Minimal impact with high success probability.</p>
                    <a href="/risks" className="text-[10px] text-[#58a6ff] mt-2 inline-block">View Risk Analysis →</a>
                </div>
            </div>
            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-[#21262d]">
                <button className="flex items-center gap-1.5 px-4 py-2 rounded-md text-[11px] font-semibold text-white" style={{ background: "#3fb950" }}>⚡ Approve Remediation</button>
                <button className="flex items-center gap-1.5 px-4 py-2 rounded-md text-[11px] font-semibold text-[#8b949e] border border-[#30363d] hover:text-[#e6edf3]">🔍 Investigate</button>
                <button className="flex items-center gap-1.5 px-4 py-2 rounded-md text-[11px] font-semibold text-[#8b949e] border border-[#30363d] hover:text-[#e6edf3]">📋 View Evidence</button>
            </div>
        </div>
    );
}

function RecoveryStrategy() {
    const steps = [
        { title: "Detection", sub: "Anomaly detected in payment-service latency" },
        { title: "Analysis", sub: "AI correlated signals across 24 data sources" },
        { title: "Root Cause", sub: "Database connection pool saturation" },
        { title: "Risk Validation", sub: "Risk assessed as low. Blast radius: 3 services" },
        { title: "Execution", sub: "Remediation actions ready to execute" },
        { title: "Verification", sub: "System health restored and verified" },
    ];
    return (
        <div className="rounded-[12px] border border-[#21262d] bg-[#161b22] p-4">
            <h3 className="text-[14px] font-semibold text-[#e6edf3] mb-4">Recovery Strategy</h3>
            <div className="flex items-start justify-between relative">
                <div className="absolute top-[22px] left-[50px] right-[50px] h-[2px] rounded-full" style={{ background: "linear-gradient(90deg, #3fb950, #22d3ee, #58a6ff, #a371f7, #f0883e, #3fb950)" }} />
                {steps.map((s, i) => (
                    <div key={i} className="flex flex-col items-center relative z-10 w-[16%]">
                        <div className="w-11 h-11 rounded-full flex items-center justify-center mb-2" style={{ background: "rgba(88,166,255,0.08)", border: "2px solid rgba(88,166,255,0.4)" }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#58a6ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                {i === 0 && <><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></>}
                                {i === 1 && <><path d="M12 0L14 9L24 12L14 15L12 24L10 15L0 12L10 9Z" fill="#58a6ff" stroke="none" /></>}
                                {i === 2 && <><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" /></>}
                                {i === 3 && <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></>}
                                {i === 4 && <><polygon points="5 3 19 12 5 21 5 3" /></>}
                                {i === 5 && <><polyline points="20 6 9 17 4 12" /></>}
                            </svg>
                        </div>
                        <p className="text-[11px] font-semibold text-[#e6edf3] text-center">{s.title}</p>
                        <p className="text-[9.5px] text-[#8b949e] text-center mt-0.5 leading-snug">{s.sub}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

function RecommendedActions() {
    const actions = [
        { rank: 1, title: "Scale Database Connection Pool", sub: "Increase max connections from 50 to 120", confidence: 96, risk: "Low", riskColor: "#3fb950", impact: "High", impactColor: "#f85149", recovery: "~2m", deps: "None Blocking" },
        { rank: 2, title: "Restart Stale Connections", sub: "Terminate idle connections exceeding timeout", confidence: 92, risk: "Low", riskColor: "#3fb950", impact: "Medium", impactColor: "#f0883e", recovery: "~45s", deps: "None Blocking" },
        { rank: 3, title: "Scale HPA for Payment Service", sub: "Increase replicas from 3 to 6", confidence: 88, risk: "Medium", riskColor: "#f0883e", impact: "Medium", impactColor: "#f0883e", recovery: "~1m 30s", deps: "Non Blocking" },
    ];
    return (
        <div className="rounded-[12px] border border-[#21262d] bg-[#161b22] p-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <h3 className="text-[13px] font-semibold text-[#e6edf3]">Recommended Actions</h3>
                    <span className="text-[10px] text-[#8b949e]">3 Actions</span>
                </div>
                <span className="text-[9px] text-[#a371f7] font-semibold">✦ AI Ranked</span>
            </div>
            <div className="space-y-2.5">
                {actions.map((a, i) => (
                    <div key={i} className={`rounded-lg bg-[#0d1117] border p-3 ${i === 0 ? "border-[#3fb950]/30" : "border-[#21262d]"}`}>
                        <div className="flex items-start gap-3">
                            <span className="text-[14px] font-bold text-[#6e7681] mt-0.5">{a.rank}</span>
                            <div className="flex-1 min-w-0">
                                <p className="text-[12px] font-semibold text-[#e6edf3]">{a.title}</p>
                                <p className="text-[10px] text-[#8b949e] mt-0.5">{a.sub}</p>
                                <div className="flex items-center gap-3 mt-2 text-[10px]">
                                    <span className="text-[#e6edf3] font-mono font-bold">{a.confidence}%</span>
                                    <span className="text-[#8b949e]">Confidence</span>
                                    <span style={{ color: a.riskColor }} className="font-semibold">{a.risk}</span>
                                    <span className="text-[#8b949e]">Risk</span>
                                    <span style={{ color: a.impactColor }} className="font-semibold">{a.impact}</span>
                                    <span className="text-[#8b949e]">Impact</span>
                                    <span className="text-[#e6edf3] font-mono">{a.recovery}</span>
                                    <span className="text-[#8b949e]">Recovery</span>
                                </div>
                                <p className="text-[9.5px] text-[#8b949e] mt-1.5">Dependencies: <span className="text-[#e6edf3]">{a.deps}</span></p>
                            </div>
                            <button className="px-3 py-1.5 rounded-md text-[10px] font-semibold text-white shrink-0" style={{ background: "linear-gradient(135deg, #1f6feb, #7c3aed)" }}>Execute ▾</button>
                        </div>
                    </div>
                ))}
            </div>
            <p className="text-[10px] text-[#8b949e] mt-3 flex items-center gap-1">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="#a371f7"><path d="M12 0L14 9L24 12L14 15L12 24L10 15L0 12L10 9Z" /></svg>
                AI Recommendation: Execute actions in the order listed for optimal recovery.
            </p>
        </div>
    );
}

function ExecutionTimeline() {
    const events = [
        { time: "10:39:28 AM", title: "Anomaly Detected", sub: "Latency spiked by 42% in payment-service", color: "#f85149" },
        { time: "10:39:41 AM", title: "Root Cause Identified", sub: "Database connection pool saturation", color: "#a371f7" },
        { time: "10:40:12 AM", title: "Risk Validation Passed", sub: "Low risk confirmed, blast radius: 3 services", color: "#58a6ff" },
        { time: "10:40:25 AM", title: "Action Executed", sub: "Scaled connection pool 50 → 120", color: "#3fb950", badge: "Success" },
        { time: "10:40:48 AM", title: "Action Executed", sub: "Restarted 14 stale connections", color: "#3fb950", badge: "Success" },
        { time: "10:41:15 AM", title: "Verification Passed", sub: "Latency normalized, error rate baseline", color: "#3fb950", badge: "Success" },
        { time: "10:41:42 AM", title: "Recovery Completed", sub: "System stable and fully operational", color: "#3fb950", badge: "Success" },
    ];
    return (
        <div className="rounded-[12px] border border-[#21262d] bg-[#161b22] p-4">
            <div className="flex items-center gap-2 mb-4">
                <h3 className="text-[13px] font-semibold text-[#e6edf3]">Execution Timeline</h3>
                <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#3fb950]/10 border border-[#3fb950]/30">
                    <span className="w-1 h-1 rounded-full bg-[#3fb950]" style={{ animation: "wi-pulse 2s infinite" }} />
                    <span className="text-[9px] text-[#3fb950] font-semibold">Live</span>
                </div>
            </div>
            <div className="relative space-y-3 pl-3">
                <div className="absolute left-[5px] top-2 bottom-2 w-px bg-[#21262d]" />
                {events.map((ev, i) => (
                    <div key={i} className="flex items-start gap-2.5 relative">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0 mt-1 relative z-10" style={{ background: ev.color, boxShadow: `0 0 4px ${ev.color}` }} />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                                <p className="text-[9.5px] text-[#6e7681] font-mono">{ev.time}</p>
                                {ev.badge && <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold" style={{ background: "rgba(63,185,80,0.15)", color: "#3fb950" }}>{ev.badge}</span>}
                            </div>
                            <p className="text-[11px] font-semibold text-[#e6edf3]">{ev.title}</p>
                            <p className="text-[10px] text-[#8b949e]">{ev.sub}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function AIReasoning() {
    return (
        <div className="space-y-3">
            <div className="rounded-[12px] border border-[#21262d] bg-[#161b22] p-4">
                <h3 className="text-[13px] font-semibold text-[#e6edf3] mb-3">AI Reasoning</h3>
                <p className="text-[11px] text-[#8b949e] mb-3">Why this action?</p>
                <div className="space-y-1.5">
                    {[
                        "Similar incident solved using same fix",
                        "High confidence from historical data (96%)",
                        "Blast radius limited to 3 services",
                        "No critical dependency risk detected",
                        "Rollback available and tested",
                    ].map((r, i) => (
                        <div key={i} className="flex items-start gap-2 text-[10.5px]">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3fb950" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><polyline points="20 6 9 17 4 12" /></svg>
                            <span className="text-[#e6edf3]">{r}</span>
                        </div>
                    ))}
                </div>
                <button className="mt-3 text-[10px] text-[#58a6ff] flex items-center gap-1">View Full Reasoning →</button>
            </div>

            <div className="rounded-[12px] border border-[#21262d] bg-[#161b22] p-4">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[13px] font-semibold text-[#e6edf3]">Safety Controls</h3>
                    <span className="text-[9px] text-[#3fb950] font-semibold">Protected by Design</span>
                </div>
                <div className="space-y-2.5">
                    {[
                        { label: "Dry Run", sub: "Simulate actions before execution", hasToggle: true },
                        { label: "Approval Policies", sub: "Auto-approve low risk actions", action: "Config" },
                        { label: "Protected Services", sub: "3 critical services are protected", action: "Manage" },
                        { label: "Rollback Strategy", sub: "Automatic rollback on failure", action: "Config" },
                    ].map((s, i) => (
                        <div key={i} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#58a6ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                                <div>
                                    <p className="text-[11px] text-[#e6edf3] font-medium">{s.label}</p>
                                    <p className="text-[9.5px] text-[#8b949e]">{s.sub}</p>
                                </div>
                            </div>
                            {s.hasToggle ? (
                                <div className="w-8 h-4 rounded-full bg-[#1f6feb]"><div className="w-3 h-3 rounded-full bg-white translate-x-4 mt-0.5" /></div>
                            ) : (
                                <button className="text-[9.5px] text-[#8b949e] px-2 py-0.5 rounded border border-[#30363d] hover:text-[#e6edf3]">{s.action}</button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function BottomStatusBar() {
    return (
        <div className="grid grid-cols-3 gap-3">
            {[
                { label: "Monitoring", sub: "Real-time system monitoring", status: "Active", statusColor: "#3fb950" },
                { label: "AI Guardian", sub: "Continuous protection enabled", status: "Watching", statusColor: "#3fb950" },
                { label: "Auto Remediation", sub: "24 actions executed today", status: "Enabled", statusColor: "#3fb950" },
            ].map((s, i) => (
                <div key={i} className="rounded-[10px] border border-[#21262d] bg-[#161b22] px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: `${s.statusColor}10`, border: `1.5px solid ${s.statusColor}30` }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={s.statusColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                        </div>
                        <div>
                            <p className="text-[11px] font-semibold text-[#e6edf3]">{s.label}</p>
                            <p className="text-[9.5px] text-[#8b949e]">{s.sub}</p>
                        </div>
                    </div>
                    <span className="text-[10px] font-semibold flex items-center gap-1.5" style={{ color: s.statusColor }}>● {s.status}</span>
                </div>
            ))}
        </div>
    );
}
