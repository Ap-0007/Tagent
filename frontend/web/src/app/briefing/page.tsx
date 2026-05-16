"use client";

import { useState } from "react";
import { Video, VideoOff, Mic, MicOff, Phone, Users, Send, CheckCircle, AlertTriangle, Clock, FileText } from "lucide-react";

interface OvernightIncident {
    id: string;
    title: string;
    severity: "critical" | "high" | "medium";
    time: string;
    status: "auto-fixed" | "needs-review" | "escalated";
    service: string;
    duration: string;
    summary: string;
    rootCause: string;
    fix: string;
    prevention: string;
    willRecur: string;
}

const overnightIncidents: OvernightIncident[] = [
    {
        id: "INC-0142",
        title: "checkout-api CrashLoopBackOff",
        severity: "high",
        time: "02:14 AM",
        status: "auto-fixed",
        service: "checkout-api",
        duration: "4 min",
        summary: "Database connection pool exhausted causing pod crashes.",
        rootCause: "Pool configured for 20 connections. Traffic spike demanded 47 concurrent connections at 02:14 AM.",
        fix: "Scaled connection pool from 20 to 50. Restarted 3 affected pods. All recovered in 4 minutes.",
        prevention: "Permanently increase pool to 80 in Helm values. Add HPA rule for database proxy. Set alert at 70% pool utilization.",
        willRecur: "High probability (4th occurrence in 30 days). Without permanent fix, expect recurrence within 1 week during traffic spikes.",
    },
    {
        id: "INC-0143",
        title: "payment-service memory pressure",
        severity: "medium",
        time: "03:47 AM",
        status: "auto-fixed",
        service: "payment-service",
        duration: "8 min",
        summary: "Memory usage hit 95% after v2.5.0 deploy, causing latency spikes.",
        rootCause: "New version introduced a memory leak in the request serializer. Garbage collection couldn't keep up under load.",
        fix: "Rolled back to v2.4.1. Memory stabilized within 3 minutes. Latency returned to baseline.",
        prevention: "Add memory profiling to CI pipeline. Set memory limit alert at 80%. Review v2.5.0 serializer code before re-deploy.",
        willRecur: "Will recur if v2.5.0 is re-deployed without the fix. v2.4.1 is stable.",
    },
    {
        id: "INC-0144",
        title: "Redis connection timeout",
        severity: "medium",
        time: "04:22 AM",
        status: "auto-fixed",
        service: "redis-cache",
        duration: "2 min",
        summary: "Redis maxed out connections causing cache misses across 4 services.",
        rootCause: "Connection leak in orders-api not releasing connections after timeout. Accumulated over 6 hours.",
        fix: "Restarted orders-api pods to release stale connections. Redis recovered immediately.",
        prevention: "Add connection pool health check to orders-api. Set Redis maxclients alert. Implement connection timeout in client config.",
        willRecur: "Will recur every ~6 hours until orders-api connection handling is patched.",
    },
];

export default function BriefingPage() {
    const [selected, setSelected] = useState<OvernightIncident | null>(null);
    const [cam, setCam] = useState(false);
    const [mic, setMic] = useState(true);
    const [q, setQ] = useState("");
    const [chat, setChat] = useState<{ who: string; text: string }[]>([]);

    function selectIncident(inc: OvernightIncident) {
        setSelected(inc);
        setChat([
            { who: "ai", text: `Let me brief you on ${inc.title}.` },
            { who: "ai", text: `This happened at ${inc.time}. ${inc.summary}` },
            { who: "ai", text: `Root cause: ${inc.rootCause}` },
            { who: "ai", text: `What I did: ${inc.fix}` },
            { who: "ai", text: `Will this happen again? ${inc.willRecur}` },
            { who: "ai", text: `My recommendation: ${inc.prevention}` },
        ]);
    }

    function ask() {
        if (!q.trim()) return;
        setChat((c) => [...c, { who: "user", text: q }, { who: "ai", text: "Let me check the telemetry data for that... Based on the metrics and logs from last night, I can confirm this is directly related to the capacity issue. The fix I applied is temporary. For a permanent solution, you'll need to update the Helm values and redeploy." }]);
        setQ("");
    }

    return (
        <div className="flex-1 flex overflow-hidden">
            {/* Left: Incident list */}
            <div className="w-[320px] shrink-0 border-r border-zinc-800/60 bg-[#0c0c0f] flex flex-col">
                <div className="px-5 py-4 border-b border-zinc-800/60">
                    <h2 className="text-sm font-semibold text-zinc-100">Overnight Activity</h2>
                    <p className="text-[11px] text-zinc-500 mt-0.5">{overnightIncidents.length} incidents · all auto-fixed</p>
                </div>
                <div className="flex-1 overflow-y-auto scrollbar divide-y divide-zinc-800/40">
                    {overnightIncidents.map((inc) => (
                        <button
                            key={inc.id}
                            onClick={() => selectIncident(inc)}
                            className={`w-full text-left px-5 py-3.5 transition-colors ${selected?.id === inc.id ? "bg-emerald-500/5 border-l-2 border-emerald-500" : "hover:bg-zinc-800/30 border-l-2 border-transparent"}`}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className={`px-1.5 py-0.5 text-[9px] font-semibold uppercase rounded ${inc.severity === "critical" ? "bg-red-500/10 text-red-400" : inc.severity === "high" ? "bg-orange-500/10 text-orange-400" : "bg-amber-500/10 text-amber-400"}`}>
                                    {inc.severity}
                                </span>
                                <span className="text-[10px] text-zinc-500 font-mono">{inc.time}</span>
                            </div>
                            <p className="text-[13px] text-zinc-200 font-medium truncate">{inc.title}</p>
                            <div className="flex items-center gap-2 mt-1.5">
                                <span className="text-[10px] text-zinc-500 font-mono">{inc.service}</span>
                                <span className="text-[10px] text-zinc-600">·</span>
                                <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                                    <CheckCircle className="w-3 h-3" />{inc.status}
                                </span>
                                <span className="text-[10px] text-zinc-600">·</span>
                                <span className="text-[10px] text-zinc-500">{inc.duration}</span>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Avatar + controls at bottom */}
                <div className="border-t border-zinc-800/60 p-4">
                    <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4 flex flex-col items-center">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center mb-2">
                            <span className="text-xl">🤖</span>
                        </div>
                        <p className="text-xs font-medium text-zinc-200">Tagent</p>
                        {selected && (
                            <p className="text-[10px] text-emerald-400 mt-0.5 animate-pulse">Speaking...</p>
                        )}
                        <div className="flex items-center gap-2 mt-3">
                            <CtrlBtn on={mic} onClick={() => setMic(!mic)} icon={mic ? Mic : MicOff} />
                            <CtrlBtn on={cam} onClick={() => setCam(!cam)} icon={cam ? Video : VideoOff} />
                            <button className="h-7 px-2.5 bg-red-500/90 text-white text-[10px] rounded flex items-center gap-1 hover:bg-red-400">
                                <Phone className="w-3 h-3" />End
                            </button>
                            <button className="h-7 px-2.5 border border-zinc-700 text-zinc-300 text-[10px] rounded flex items-center gap-1 hover:bg-zinc-800">
                                <Users className="w-3 h-3" />Invite
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right: Briefing detail */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {!selected ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <AlertTriangle className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
                            <p className="text-sm text-zinc-400">Select an incident to start the briefing</p>
                            <p className="text-[11px] text-zinc-600 mt-1">Click any incident on the left to hear the full explanation</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-zinc-800/60 shrink-0">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-base font-semibold text-zinc-100">{selected.title}</h1>
                                    <p className="text-[12px] text-zinc-500 font-mono mt-0.5">{selected.id} · {selected.service} · {selected.time} · resolved in {selected.duration}</p>
                                </div>
                                <button className="h-7 px-3 border border-zinc-700 text-zinc-300 text-[11px] rounded flex items-center gap-1.5 hover:bg-zinc-800">
                                    <FileText className="w-3 h-3" />View Report
                                </button>
                            </div>
                        </div>

                        {/* Chat transcript */}
                        <div className="flex-1 overflow-y-auto scrollbar px-6 py-5 space-y-3">
                            {chat.map((m, i) => (
                                <div key={i} className={m.who === "user" ? "ml-auto max-w-[70%]" : "max-w-[85%]"}>
                                    <p className="text-[9px] text-zinc-500 uppercase font-semibold tracking-wider mb-1">{m.who === "user" ? "You" : "Tagent"}</p>
                                    <div className={`px-4 py-2.5 rounded-lg text-[13px] leading-relaxed ${m.who === "user" ? "bg-emerald-500/10 border border-emerald-500/20 text-zinc-200" : "bg-zinc-900/80 border border-zinc-800 text-zinc-300"}`}>
                                        {m.text}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Input */}
                        <div className="px-6 py-3 border-t border-zinc-800/60 shrink-0">
                            <div className="flex gap-2">
                                <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && ask()} placeholder="Ask about this incident..." className="flex-1 h-9 bg-zinc-900 border border-zinc-800 rounded-md px-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50" />
                                <button onClick={ask} className="h-9 px-4 bg-emerald-500 text-zinc-900 text-xs font-medium rounded-md hover:bg-emerald-400 flex items-center gap-1.5">
                                    <Send className="w-3.5 h-3.5" />Ask
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

function CtrlBtn({ on, onClick, icon: Icon }: { on: boolean; onClick: () => void; icon: any }) {
    return (
        <button onClick={onClick} className={`h-7 w-7 flex items-center justify-center rounded border ${on ? "border-zinc-700 text-zinc-200 hover:bg-zinc-800" : "border-red-500/30 bg-red-500/10 text-red-400"}`}>
            <Icon className="w-3.5 h-3.5" />
        </button>
    );
}
