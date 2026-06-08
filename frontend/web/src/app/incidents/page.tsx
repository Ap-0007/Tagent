"use client";

import { useState } from "react";

// ─── Incident Intelligence Page ──────────────────────────────────────────────

export default function IncidentsPage() {
    return (
        <div className="flex-1 overflow-y-auto wi-scrollbar bg-[#0d1117]">
            <style jsx global>{`
                .wi-scrollbar::-webkit-scrollbar { width: 6px; }
                .wi-scrollbar::-webkit-scrollbar-track { background: #161b22; }
                .wi-scrollbar::-webkit-scrollbar-thumb { background: #30363d; border-radius: 3px; }
                @keyframes wi-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
            `}</style>
            <div className="px-4 pt-4 pb-6 space-y-3">
                <CriticalIncidentHero />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                    <IncidentFeed />
                    <AIReasoningTimeline />
                    <ClusterRiskOverview />
                </div>
            </div>
        </div>
    );
}

// ─── Critical Incident Hero Card ─────────────────────────────────────────────

function CriticalIncidentHero() {
    return (
        <div className="rounded-[12px] border border-[#f85149]/30 p-5" style={{ background: "linear-gradient(135deg, rgba(248,81,73,0.08) 0%, rgba(13,17,23,0.95) 50%, #161b22 100%)" }}>
            <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider" style={{ background: "rgba(248,81,73,0.2)", color: "#f85149", border: "1px solid rgba(248,81,73,0.4)" }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                    Critical Incident Detected
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Service + Confidence */}
                <div>
                    <h2 className="text-[24px] font-bold text-[#e6edf3] mb-1">Payment Service</h2>
                    <p className="text-[11px] text-[#8b949e] flex items-center gap-1.5">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3fb950" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
                        96% Confidence
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#8b949e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /></svg>
                    </p>
                </div>

                {/* Predicted Root Cause */}
                <div>
                    <p className="text-[10px] text-[#8b949e] mb-1">Predicted Root Cause</p>
                    <p className="text-[14px] font-semibold text-[#58a6ff]">Database Connection Pool Saturation</p>
                    <p className="text-[11px] text-[#8b949e] mt-1.5">The database connection pool is exhausted causing increased latency and request failures.</p>
                </div>

                {/* Blast Radius */}
                <div>
                    <p className="text-[10px] text-[#8b949e] mb-2">Blast Radius</p>
                    <div className="space-y-1.5">
                        {[
                            { svc: "Checkout Service", impact: "High Impact", color: "#f85149" },
                            { svc: "Order Service", impact: "Medium Impact", color: "#f0883e" },
                            { svc: "Notification Service", impact: "Low Impact", color: "#3fb950" },
                        ].map((b, i) => (
                            <div key={i} className="flex items-center justify-between">
                                <span className="flex items-center gap-1.5 text-[11px] text-[#e6edf3]">
                                    <span className="w-2 h-2 rounded-full" style={{ background: b.color }} />{b.svc}
                                </span>
                                <span className="text-[9.5px] font-semibold" style={{ color: b.color }}>● {b.impact}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Suggested Remediation */}
                <div>
                    <p className="text-[10px] text-[#8b949e] mb-2">Suggested Remediation</p>
                    <div className="space-y-1.5 mb-3">
                        {[{ action: "Scale Pool", badge: "Auto" }, { action: "Restart Connections", badge: "Auto" }].map((r, i) => (
                            <div key={i} className="flex items-center justify-between px-2.5 py-1.5 rounded-md bg-[#0d1117] border border-[#21262d]">
                                <span className="text-[11px] text-[#e6edf3] flex items-center gap-1.5">
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#3fb950" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                    {r.action}
                                </span>
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#21262d] text-[#8b949e]">{r.badge}</span>
                            </div>
                        ))}
                    </div>
                    <p className="text-[10px] text-[#8b949e]">Estimated Resolution</p>
                    <p className="text-[18px] font-bold text-[#e6edf3] font-mono">2 Minutes <span className="text-[12px] text-[#8b949e]">⏱</span></p>
                </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-[#21262d]">
                <button className="flex items-center gap-1.5 px-4 py-2 rounded-md text-[11px] font-semibold text-white" style={{ background: "#f85149" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                    Investigate
                </button>
                <button className="flex items-center gap-1.5 px-4 py-2 rounded-md text-[11px] font-semibold text-white" style={{ background: "linear-gradient(135deg, #1f6feb, #7c3aed)" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                    Approve Fix
                </button>
                <button className="flex items-center gap-1.5 px-4 py-2 rounded-md text-[11px] font-semibold text-[#8b949e] border border-[#30363d] hover:text-[#e6edf3] hover:border-[#484f58] transition-colors">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                    View Timeline
                </button>
            </div>
        </div>
    );
}

// ─── Incident Feed ───────────────────────────────────────────────────────────

function IncidentFeed() {
    const incidents = [
        { severity: "Critical", sevColor: "#f85149", title: "Payment Service Database Saturation", desc: "Connection pool exhausted causing high latency and intermittent failures.", confidence: 96, services: 3, time: "2m ago" },
        { severity: "High", sevColor: "#f0883e", title: "API Gateway Latency Increase", desc: "Latency p95 is 2.3x higher than baseline due to upstream dependency delay.", confidence: 89, services: 2, time: "8m ago" },
        { severity: "Medium", sevColor: "#f0883e", title: "Worker Memory Pressure", desc: "Memory usage above 85% for more than 10 minutes on worker nodes.", confidence: 82, services: 1, time: "15m ago" },
        { severity: "Low", sevColor: "#3fb950", title: "Redis Eviction Rate Increased", desc: "Eviction rate is slightly above normal but within acceptable limits.", confidence: 78, services: 1, time: "32m ago" },
    ];

    return (
        <div className="rounded-[12px] border border-[#21262d] bg-[#161b22] p-4">
            <h3 className="text-[14px] font-semibold text-[#e6edf3] mb-4">Incident Feed</h3>
            <div className="space-y-3">
                {incidents.map((inc, i) => (
                    <div key={i} className="rounded-lg bg-[#0d1117] border border-[#21262d] p-3 hover:border-[#30363d] transition-colors cursor-pointer">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold mb-1.5" style={{ background: `${inc.sevColor}18`, color: inc.sevColor }}>{inc.severity}</span>
                                <p className="text-[12px] font-semibold text-[#e6edf3]">{inc.title}</p>
                                <p className="text-[10.5px] text-[#8b949e] mt-1 leading-relaxed">{inc.desc}</p>
                            </div>
                            <div className="text-right shrink-0">
                                <p className="text-[9px] text-[#8b949e]">{inc.time}</p>
                                <p className="text-[16px] font-bold text-[#e6edf3] font-mono mt-1">{inc.confidence}%</p>
                                <p className="text-[9px] text-[#8b949e]">Confidence</p>
                                <p className="text-[12px] font-bold text-[#e6edf3] font-mono mt-1">{inc.services}</p>
                                <p className="text-[9px] text-[#8b949e]">Service{inc.services > 1 ? "s" : ""}</p>
                            </div>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#58a6ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-6"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                        </div>
                    </div>
                ))}
            </div>
            <button className="mt-3 w-full flex items-center justify-between py-2 text-[11px] text-[#8b949e] hover:text-[#58a6ff] transition-colors">
                <span>View all incidents</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
            </button>
        </div>
    );
}

// ─── AI Reasoning Timeline ───────────────────────────────────────────────────

function AIReasoningTimeline() {
    const events = [
        { icon: "alert", title: "Anomaly Detected", sub: "Latency and error rate deviation detected", time: "12:04:21", color: "#f85149" },
        { icon: "correlate", title: "Correlation Completed", sub: "Correlated across metrics, logs and traces", time: "12:04:28", color: "#a371f7" },
        { icon: "root", title: "Root Cause Identified", sub: "Database connection pool saturation", time: "12:04:36", color: "#f0883e" },
        { icon: "blast", title: "Blast Radius Calculated", sub: "3 services potentially impacted", time: "12:04:41", color: "#58a6ff" },
        { icon: "fix", title: "Remediation Generated", sub: "AI generated 2 remediation actions", time: "12:04:45", color: "#3fb950" },
    ];

    return (
        <div className="rounded-[12px] border border-[#21262d] bg-[#161b22] p-4">
            <h3 className="text-[14px] font-semibold text-[#e6edf3] mb-4">AI Reasoning Timeline</h3>
            <div className="relative space-y-4 pl-4">
                <div className="absolute left-[7px] top-2 bottom-2 w-px bg-[#21262d]" />
                {events.map((ev, i) => (
                    <div key={i} className="flex items-start gap-3 relative">
                        <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 relative z-10" style={{ background: `${ev.color}20`, border: `2px solid ${ev.color}` }}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: ev.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                                <p className="text-[12px] font-semibold text-[#e6edf3]">{ev.title}</p>
                                <span className="text-[9.5px] text-[#6e7681] font-mono shrink-0">{ev.time}</span>
                            </div>
                            <p className="text-[10.5px] text-[#8b949e] mt-0.5">{ev.sub}</p>
                        </div>
                    </div>
                ))}
            </div>
            <button className="mt-4 w-full flex items-center justify-between py-2 text-[11px] text-[#8b949e] hover:text-[#58a6ff] transition-colors border-t border-[#21262d] pt-3">
                <span>View Full Timeline</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
            </button>
        </div>
    );
}

// ─── Cluster Risk Overview ───────────────────────────────────────────────────

function ClusterRiskOverview() {
    return (
        <div className="space-y-3">
            <div className="rounded-[12px] border border-[#21262d] bg-[#161b22] p-4">
                <h3 className="text-[14px] font-semibold text-[#e6edf3] mb-4">Cluster Risk Overview</h3>
                <div className="space-y-3">
                    {[
                        { label: "Critical Risks", sub: "Issues that can cause immediate service disruption.", count: 2, color: "#f85149" },
                        { label: "High Risks", sub: "Problems that could impact services soon.", count: 4, color: "#f0883e" },
                        { label: "Emerging Risks", sub: "Anomalies trending towards potential issues.", count: 6, color: "#a371f7" },
                    ].map((r, i) => (
                        <div key={i} className="flex items-center gap-3 p-2.5 rounded-md bg-[#0d1117] border border-[#21262d]">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: `${r.color}15`, border: `1.5px solid ${r.color}` }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={r.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[12px] font-semibold text-[#e6edf3]">{r.label}</p>
                                <p className="text-[10px] text-[#8b949e]">{r.sub}</p>
                            </div>
                            <div className="text-right shrink-0">
                                <p className="text-[20px] font-bold font-mono" style={{ color: r.color }}>{r.count}</p>
                                <p className="text-[9px] text-[#8b949e]">Active</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* What Tagent Understands */}
            <div className="rounded-[12px] border border-[#21262d] bg-[#161b22] p-4">
                <h3 className="text-[13px] font-semibold text-[#e6edf3] mb-3">What Tagent Understands</h3>
                <div className="flex items-center gap-4">
                    <div className="flex-1 space-y-2">
                        {[
                            { label: "Kubernetes Services", value: "47" },
                            { label: "Dependencies", value: "128" },
                            { label: "Deployments", value: "31" },
                            { label: "Nodes", value: "16" },
                        ].map((s, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#58a6ff]" />
                                <span className="text-[11px] text-[#8b949e] flex-1">{s.label}</span>
                                <span className="text-[12px] font-bold text-[#e6edf3] font-mono">{s.value}</span>
                            </div>
                        ))}
                    </div>
                    {/* Brain network visual */}
                    <svg width="70" height="70" viewBox="0 0 70 70" className="shrink-0">
                        <defs>
                            <radialGradient id="brain-net">
                                <stop offset="0%" stopColor="#a371f7" stopOpacity="0.4" />
                                <stop offset="100%" stopColor="#a371f7" stopOpacity="0" />
                            </radialGradient>
                        </defs>
                        <circle cx="35" cy="35" r="30" fill="url(#brain-net)" />
                        {[18, 26].map((r, i) => <circle key={i} cx="35" cy="35" r={r} fill="none" stroke="#a371f7" strokeWidth="0.5" strokeOpacity="0.3" />)}
                        {[{ x: 20, y: 20 }, { x: 50, y: 20 }, { x: 55, y: 40 }, { x: 45, y: 55 }, { x: 20, y: 50 }, { x: 15, y: 35 }].map((p, i) => (
                            <g key={i}>
                                <line x1="35" y1="35" x2={p.x} y2={p.y} stroke="#a371f7" strokeWidth="0.5" strokeOpacity="0.4" />
                                <circle cx={p.x} cy={p.y} r="2" fill="#a371f7" style={{ filter: "drop-shadow(0 0 2px #a371f7)" }} />
                            </g>
                        ))}
                        <circle cx="35" cy="35" r="4" fill="#a371f7" style={{ filter: "drop-shadow(0 0 4px #a371f7)" }} />
                    </svg>
                </div>
            </div>
        </div>
    );
}
