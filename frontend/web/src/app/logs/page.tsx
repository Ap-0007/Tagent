"use client";

import { useState } from "react";

// ─── Log Investigation Page ──────────────────────────────────────────────────

export default function LogsPage() {
    const [search, setSearch] = useState("");
    const [autoRefresh, setAutoRefresh] = useState(true);

    return (
        <div className="flex-1 overflow-y-auto wi-scrollbar bg-[#0d1117]">
            <style jsx global>{`
                .wi-scrollbar::-webkit-scrollbar { width: 6px; }
                .wi-scrollbar::-webkit-scrollbar-track { background: #161b22; }
                .wi-scrollbar::-webkit-scrollbar-thumb { background: #30363d; border-radius: 3px; }
                @keyframes wi-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
            `}</style>
            <div className="px-4 pt-4 pb-6 space-y-3">
                <AIInvestigationSummary />
                <EvidenceTimeline />
                <HighlightedEvidenceLogs />
                <FullLogStream search={search} setSearch={setSearch} autoRefresh={autoRefresh} setAutoRefresh={setAutoRefresh} />
            </div>
        </div>
    );
}

// ─── AI Investigation Summary ────────────────────────────────────────────────

function AIInvestigationSummary() {
    return (
        <div className="rounded-[12px] border border-[#21262d] bg-[#161b22] p-4">
            <div className="flex items-center gap-2 mb-4">
                <h3 className="text-[14px] font-semibold text-[#e6edf3]">AI Investigation Summary</h3>
                <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold" style={{ background: "rgba(63,185,80,0.15)", color: "#3fb950" }}>Completed</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                    <p className="text-[10px] text-[#8b949e]">Incident Name</p>
                    <p className="text-[16px] font-bold text-[#e6edf3] mt-1">Payment Service Failure</p>
                    <p className="text-[10px] text-[#8b949e] mt-1">Started at May 23, 2024 10:24 AM</p>
                    <span className="inline-flex items-center gap-1 mt-2 px-1.5 py-0.5 rounded text-[9px] font-semibold" style={{ background: "rgba(248,81,73,0.15)", color: "#f85149" }}>Critical ⚠</span>
                </div>
                <div>
                    <p className="text-[10px] text-[#8b949e]">Root Cause</p>
                    <p className="text-[13px] font-semibold text-[#58a6ff] mt-1">Database Connection Pool Saturation</p>
                    <p className="text-[10.5px] text-[#8b949e] mt-1">The connection pool reached maximum capacity, causing request failures and latency spikes.</p>
                </div>
                <div>
                    <p className="text-[10px] text-[#8b949e]">Confidence Score</p>
                    <div className="flex items-center gap-2 mt-2">
                        <svg width="44" height="44" viewBox="0 0 44 44">
                            <circle cx="22" cy="22" r="18" fill="none" stroke="#21262d" strokeWidth="4" />
                            <circle cx="22" cy="22" r="18" fill="none" stroke="#3fb950" strokeWidth="4" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 18 * 0.96} ${2 * Math.PI * 18 * 0.04}`} transform="rotate(-90 22 22)" style={{ filter: "drop-shadow(0 0 3px #3fb950)" }} />
                        </svg>
                        <div>
                            <p className="text-[18px] font-bold text-[#e6edf3] font-mono">96%</p>
                            <p className="text-[9px] text-[#3fb950]">High Confidence</p>
                        </div>
                    </div>
                </div>
                <div>
                    <p className="text-[10px] text-[#8b949e]">Affected Services</p>
                    <div className="space-y-1.5 mt-2">
                        {[
                            { svc: "payment-service", impact: "High Impact", color: "#f85149" },
                            { svc: "checkout-service", impact: "Medium Impact", color: "#f0883e" },
                            { svc: "notification-service", impact: "Low Impact", color: "#3fb950" },
                        ].map((s, i) => (
                            <div key={i} className="flex items-center justify-between text-[10.5px]">
                                <span className="flex items-center gap-1.5 text-[#e6edf3]"><span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />{s.svc}</span>
                                <span className="font-semibold" style={{ color: s.color }}>● {s.impact}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div>
                    <p className="text-[10px] text-[#8b949e]">Evidence Count</p>
                    <p className="text-[24px] font-bold text-[#e6edf3] font-mono mt-1">34</p>
                    <p className="text-[10px] text-[#8b949e]">Log events analyzed</p>
                    <p className="text-[10px] text-[#8b949e] mt-2">Suggested Remediation</p>
                    <p className="text-[11px] text-[#e6edf3] font-medium">Scale connection pool</p>
                    <p className="text-[11px] text-[#e6edf3]">Restart idle connections</p>
                    <p className="text-[10px] text-[#8b949e] mt-2">Investigation Status</p>
                    <p className="text-[11px] text-[#3fb950] font-semibold">● Completed</p>
                </div>
            </div>
        </div>
    );
}

// ─── Evidence Timeline ───────────────────────────────────────────────────────

function EvidenceTimeline() {
    const steps = [
        { time: "10:24 AM", title: "Anomaly Detected", sub: "Latency spike detected in payment-service logs", color: "#f85149" },
        { time: "10:25 AM", title: "Root Cause Found", sub: "Database connection pool saturation identified", color: "#f0883e" },
        { time: "10:26 AM", title: "Blast Radius Calculated", sub: "3 dependent services potentially impacted", color: "#58a6ff" },
        { time: "10:27 AM", title: "Remediation Suggested", sub: "Scale pool and restart idle connections", color: "#a371f7" },
        { time: "10:31 AM", title: "Resolution Verified", sub: "Latency normalized and error rate back to baseline", color: "#3fb950" },
    ];
    return (
        <div className="rounded-[12px] border border-[#21262d] bg-[#161b22] p-4">
            <h3 className="text-[14px] font-semibold text-[#e6edf3] mb-4">Evidence Timeline</h3>
            <div className="flex items-start justify-between relative">
                <div className="absolute top-[18px] left-[40px] right-[40px] h-[2px] rounded-full" style={{ background: "linear-gradient(90deg, #f85149, #f0883e, #58a6ff, #a371f7, #3fb950)" }} />
                {steps.map((s, i) => (
                    <div key={i} className="flex flex-col items-center relative z-10 w-[18%]">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center mb-2" style={{ background: `${s.color}15`, border: `2px solid ${s.color}` }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                {i === 0 && <><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></>}
                                {i === 1 && <><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /></>}
                                {i === 2 && <><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" /></>}
                                {i === 3 && <><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></>}
                                {i === 4 && <><polyline points="20 6 9 17 4 12" /></>}
                            </svg>
                        </div>
                        <p className="text-[9.5px] text-[#6e7681] font-mono mb-0.5">{s.time}</p>
                        <p className="text-[11px] font-semibold text-[#e6edf3] text-center leading-tight">{s.title}</p>
                        <p className="text-[9.5px] text-[#8b949e] text-center mt-0.5 leading-snug">{s.sub}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Highlighted Evidence Logs ───────────────────────────────────────────────

function HighlightedEvidenceLogs() {
    const logs = [
        { time: "10:24:18.321", level: "ERROR", msg: "Connection is not available, request timed out after 30000ms", svc: "payment-service", tag: "Root Cause Evidence", tagColor: "#f85149", reason: "Indicates connection pool exhaustion" },
        { time: "10:24:18.322", level: "WARN", msg: "HikariPool-1 - Connection pool is full, active connections: 50/50", svc: "payment-service", tag: "Contributing Signal", tagColor: "#f0883e", reason: "Pool reached maximum capacity" },
        { time: "10:24:18.657", level: "WARN", msg: "Slow query detected: duration=5234ms, table=transactions", svc: "payment-service", tag: "Contributing Signal", tagColor: "#f0883e", reason: "Database saturation causing latency" },
        { time: "10:31:42.001", level: "INFO", msg: "HikariPool-1 - After cleanup stats (total=50, active=12, idle=38)", svc: "payment-service", tag: "Resolution Evidence", tagColor: "#3fb950", reason: "Connection pool normalized" },
        { time: "10:31:42.102", level: "INFO", msg: "Request completed successfully in 152ms", svc: "payment-service", tag: "Resolution Evidence", tagColor: "#3fb950", reason: "System recovered to baseline" },
    ];
    return (
        <div className="rounded-[12px] border border-[#21262d] bg-[#161b22] p-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <h3 className="text-[14px] font-semibold text-[#e6edf3]">Highlighted Evidence Logs</h3>
                    <span className="text-[10px] text-[#8b949e] px-2 py-0.5 rounded-md bg-[#21262d]">34 Relevant Logs</span>
                </div>
                <button className="text-[10px] text-[#58a6ff] hover:text-[#79c0ff]">View All Evidence</button>
            </div>
            <div className="space-y-0.5">
                {logs.map((l, i) => (
                    <div key={i} className="grid grid-cols-[90px_50px_1fr_120px_auto_1fr_24px] gap-2 items-center px-3 py-2 rounded-md hover:bg-[#0d1117] transition-colors text-[11px]">
                        <span className="text-[#6e7681] font-mono">{l.time}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold text-center ${l.level === "ERROR" ? "bg-[#f85149]/15 text-[#f85149]" : l.level === "WARN" ? "bg-[#f0883e]/15 text-[#f0883e]" : "bg-[#58a6ff]/15 text-[#58a6ff]"}`}>{l.level}</span>
                        <span className="text-[#e6edf3] font-mono truncate">{l.msg}</span>
                        <span className="text-[#8b949e] font-mono">{l.svc}</span>
                        <span className="text-[9.5px] px-1.5 py-0.5 rounded font-semibold whitespace-nowrap" style={{ background: `${l.tagColor}15`, color: l.tagColor }}>{l.tag}</span>
                        <span className="text-[#8b949e] truncate">{l.reason}</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6e7681" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Full Log Stream ─────────────────────────────────────────────────────────

function FullLogStream({ search, setSearch, autoRefresh, setAutoRefresh }: { search: string; setSearch: (v: string) => void; autoRefresh: boolean; setAutoRefresh: (v: boolean) => void }) {
    const [selectedLog, setSelectedLog] = useState<number | null>(2); // highlight the ERROR line

    const logs = [
        { time: "10:24:17.854", level: "INFO", svc: "payment-service", msg: "Incoming request POST /api/payments - request_id=8f3a2d9c-1b2e-4f5a-9d0b-8c7e2f1a3b5c" },
        { time: "10:24:18.102", level: "WARN", svc: "payment-service", msg: "HikariPool-1 - Connection acquisition took 5234ms" },
        { time: "10:24:18.321", level: "ERROR", svc: "payment-service", msg: "Connection is not available, request timed out after 30000ms" },
        { time: "10:24:18.322", level: "WARN", svc: "payment-service", msg: "HikariPool-1 - Connection pool is full, active connections: 50/50" },
        { time: "10:24:18.657", level: "WARN", svc: "payment-service", msg: "Slow query detected: duration=5234ms, table=transactions, query=SELECT * FROM payments WHERE user_id = ?" },
        { time: "10:24:19.001", level: "INFO", svc: "payment-service", msg: "Retrying request - attempt 1/3" },
        { time: "10:24:19.856", level: "ERROR", svc: "payment-service", msg: "Request failed after 3 attempts - returning 503" },
    ];

    return (
        <div className="rounded-[12px] border border-[#21262d] bg-[#161b22] p-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <h3 className="text-[14px] font-semibold text-[#e6edf3]">Full Log Stream</h3>
                    <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#3fb950]/10 border border-[#3fb950]/30">
                        <span className="w-1 h-1 rounded-full bg-[#3fb950]" style={{ boxShadow: "0 0 4px #3fb950", animation: "wi-pulse 2s infinite" }} />
                        <span className="text-[9px] text-[#3fb950] font-semibold">Live</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#8b949e]">Auto Refresh</span>
                    <button onClick={() => setAutoRefresh(!autoRefresh)} className={`w-8 h-4 rounded-full transition-colors ${autoRefresh ? "bg-[#1f6feb]" : "bg-[#21262d]"}`}>
                        <div className={`w-3 h-3 rounded-full bg-white transition-transform ${autoRefresh ? "translate-x-4" : "translate-x-0.5"}`} />
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 mb-3">
                <div className="relative flex-1 max-w-[200px]">
                    <svg className="absolute left-2.5 top-1/2 -translate-y-1/2" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6e7681" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search logs..." className="w-full h-7 pl-8 pr-3 rounded-md bg-[#0d1117] border border-[#30363d] text-[10px] text-[#e6edf3] placeholder:text-[#6e7681] focus:outline-none focus:border-[#58a6ff]/50" />
                </div>
                {["All Services", "All Severities", "Last 1 Hour"].map((f, i) => (
                    <button key={i} className="h-7 px-2.5 rounded-md bg-[#0d1117] border border-[#30363d] text-[10px] text-[#8b949e] hover:text-[#e6edf3] hover:border-[#484f58] transition-colors flex items-center gap-1">
                        {f} <svg width="8" height="8" viewBox="0 0 12 12" fill="none"><path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                ))}
                <button className="h-7 px-2.5 rounded-md bg-[#0d1117] border border-[#30363d] text-[10px] text-[#8b949e] hover:text-[#e6edf3] hover:border-[#484f58] transition-colors flex items-center gap-1">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
                    Filters
                </button>
            </div>

            {/* Log lines + detail panel */}
            <div className="flex gap-3">
                <div className="flex-1 font-mono text-[10.5px] space-y-0">
                    {logs.map((l, i) => {
                        const isError = l.level === "ERROR";
                        const isSelected = selectedLog === i;
                        return (
                            <div
                                key={i}
                                onClick={() => setSelectedLog(i)}
                                className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer transition-colors ${isSelected ? "bg-[#1f6feb]/10 border border-[#1f6feb]/30" : isError ? "bg-[#f85149]/5" : "hover:bg-[#0d1117]"} ${isError ? "text-[#f85149]" : ""}`}
                            >
                                <span className="text-[#6e7681] w-[85px] shrink-0">{l.time}</span>
                                <span className={`w-[38px] shrink-0 font-bold ${l.level === "ERROR" ? "text-[#f85149]" : l.level === "WARN" ? "text-[#f0883e]" : "text-[#58a6ff]"}`}>{l.level}</span>
                                <span className={`w-[110px] shrink-0 ${isError ? "text-[#f85149]" : "text-[#8b949e]"}`}>{l.svc}</span>
                                <span className={`truncate ${isError ? "text-[#f85149] font-semibold" : "text-[#e6edf3]"}`}>{l.msg}</span>
                            </div>
                        );
                    })}
                </div>

                {/* Detail panel for selected log */}
                {selectedLog !== null && (
                    <div className="w-[280px] shrink-0 rounded-md bg-[#0d1117] border border-[#21262d] p-3">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#f85149]/15 text-[#f85149]">ERROR</span>
                            <span className="text-[11px] font-semibold text-[#e6edf3]">Connection timeout</span>
                        </div>
                        <div className="space-y-1.5 text-[10px]">
                            {[
                                { label: "Timestamp", value: "May 23, 2024 10:24:18.321" },
                                { label: "Service", value: "payment-service" },
                                { label: "Pod", value: "payment-service-7f8d9e3b7d-xyz12" },
                                { label: "Container", value: "payment-service" },
                                { label: "Trace ID", value: "8f3a2d9c-1b2e-4f5a-9d0b-8c7e2f1a3b5c" },
                                { label: "Span ID", value: "2b1e9f8a3c4d5e6f" },
                            ].map((d, i) => (
                                <div key={i} className="flex items-start gap-2">
                                    <span className="text-[#8b949e] w-[70px] shrink-0">{d.label}</span>
                                    <span className="text-[#e6edf3] font-mono break-all">{d.value}</span>
                                </div>
                            ))}
                        </div>
                        <button className="mt-3 w-full flex items-center justify-center gap-1 py-1.5 rounded-md border border-[#30363d] text-[10px] text-[#58a6ff] hover:border-[#484f58] transition-colors">
                            View in Trace <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
