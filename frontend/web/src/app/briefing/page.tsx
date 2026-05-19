"use client";

import { useEffect, useState } from "react";
import { getIncidents, sendChat, type Incident } from "@/lib/api";
import { AlertTriangle, CheckCircle, Loader2, Send, WifiOff } from "lucide-react";

export default function BriefingPage() {
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [selected, setSelected] = useState<Incident | null>(null);
    const [q, setQ] = useState("");
    const [chat, setChat] = useState<{ who: string; text: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [asking, setAsking] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const data = await getIncidents();
                setIncidents(data.incidents || []);
                setError(null);
            } catch (e: any) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    function selectIncident(inc: Incident) {
        setSelected(inc);
        setChat([
            { who: "ai", text: `Briefing for ${inc.title}.` },
            { who: "ai", text: inc.rootCause || "The backend has not produced an RCA yet." },
            { who: "ai", text: `Evidence: ${(inc.evidence || []).join(", ") || "none returned"}` },
        ]);
    }

    async function ask() {
        if (!q.trim() || asking) return;
        const question = selected ? `${q.trim()}\n\nIncident context: ${JSON.stringify(selected)}` : q.trim();
        setChat((c) => [...c, { who: "user", text: q.trim() }]);
        setQ("");
        setAsking(true);
        try {
            const answer = await sendChat(question);
            setChat((c) => [...c, { who: "ai", text: answer.response }]);
        } catch (e: any) {
            setChat((c) => [...c, { who: "ai", text: `AI Engine unavailable: ${e.message}` }]);
        } finally {
            setAsking(false);
        }
    }

    return (
        <div className="flex-1 flex overflow-hidden">
            <div className="w-[320px] shrink-0 border-r border-zinc-800/60 bg-[#0c0c0f] flex flex-col">
                <div className="px-5 py-4 border-b border-zinc-800/60">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-sm font-semibold text-zinc-100">Live Activity</h2>
                            <p className="text-[11px] text-zinc-500 mt-0.5">{loading ? "Loading..." : `${incidents.length} incidents`}</p>
                        </div>
                        {loading && <Loader2 className="w-4 h-4 text-zinc-500 animate-spin" />}
                        {error && <WifiOff className="w-4 h-4 text-amber-400" />}
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto scrollbar divide-y divide-zinc-800/40">
                    {incidents.length === 0 && !loading ? (
                        <div className="px-5 py-8 text-center text-[12px] text-zinc-500">
                            {error ? "Backend offline." : "No live incidents to brief."}
                        </div>
                    ) : incidents.map((inc) => (
                        <button
                            key={inc.id}
                            onClick={() => selectIncident(inc)}
                            className={`w-full text-left px-5 py-3.5 transition-colors ${selected?.id === inc.id ? "bg-emerald-500/5 border-l-2 border-emerald-500" : "hover:bg-zinc-800/30 border-l-2 border-transparent"}`}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className={`px-1.5 py-0.5 text-[9px] font-semibold uppercase rounded ${inc.severity === "critical" ? "bg-red-500/10 text-red-400" : inc.severity === "high" ? "bg-orange-500/10 text-orange-400" : "bg-amber-500/10 text-amber-400"}`}>
                                    {inc.severity}
                                </span>
                                <span className="text-[10px] text-zinc-500 font-mono">{new Date(inc.startedAt).toLocaleTimeString()}</span>
                            </div>
                            <p className="text-[13px] text-zinc-200 font-medium truncate">{inc.title}</p>
                            <div className="flex items-center gap-2 mt-1.5">
                                <span className="text-[10px] text-zinc-500 font-mono">{inc.service}</span>
                                <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                                    <CheckCircle className="w-3 h-3" />{inc.status}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
                {!selected ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <AlertTriangle className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
                            <p className="text-sm text-zinc-400">Select an incident to start the briefing</p>
                            <p className="text-[11px] text-zinc-600 mt-1">Briefings are generated from live incident and AI data.</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="px-6 py-4 border-b border-zinc-800/60 shrink-0">
                            <h1 className="text-base font-semibold text-zinc-100">{selected.title}</h1>
                            <p className="text-[12px] text-zinc-500 font-mono mt-0.5">{selected.id} - {selected.namespace}/{selected.service}</p>
                        </div>
                        <div className="flex-1 overflow-y-auto scrollbar px-6 py-5 space-y-3">
                            {chat.map((m, i) => (
                                <div key={i} className={m.who === "user" ? "ml-auto max-w-[70%]" : "max-w-[85%]"}>
                                    <p className="text-[9px] text-zinc-500 uppercase font-semibold tracking-wider mb-1">{m.who === "user" ? "You" : "Tagent"}</p>
                                    <div className={`px-4 py-2.5 rounded-lg text-[13px] leading-relaxed whitespace-pre-wrap ${m.who === "user" ? "bg-emerald-500/10 border border-emerald-500/20 text-zinc-200" : "bg-zinc-900/80 border border-zinc-800 text-zinc-300"}`}>
                                        {m.text}
                                    </div>
                                </div>
                            ))}
                            {asking && <div className="text-[12px] text-zinc-500">Asking AI Engine...</div>}
                        </div>
                        <div className="px-6 py-3 border-t border-zinc-800/60 shrink-0">
                            <div className="flex gap-2">
                                <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && ask()} placeholder="Ask about this incident..." className="flex-1 h-9 bg-zinc-900 border border-zinc-800 rounded-md px-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50" />
                                <button onClick={ask} disabled={asking || !q.trim()} className="h-9 px-4 bg-emerald-500 text-zinc-900 text-xs font-medium rounded-md hover:bg-emerald-400 disabled:opacity-50 flex items-center gap-1.5">
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
