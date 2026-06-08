"use client";

import { useEffect, useState } from "react";
import {
    getLatestBriefing,
    generateBriefing,
    sendChat,
    type BriefingResponse,
} from "@/lib/api";
import { Sun, Moon, RefreshCw, Loader2, WifiOff, Send, Shield, AlertTriangle, CheckCircle, Sparkles } from "lucide-react";

export default function BriefingPage() {
    const [briefing, setBriefing] = useState<BriefingResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [q, setQ] = useState("");
    const [chat, setChat] = useState<{ who: string; text: string }[]>([]);
    const [asking, setAsking] = useState(false);

    useEffect(() => {
        fetchBriefing();
    }, []);

    async function fetchBriefing() {
        setLoading(true);
        try {
            const data = await getLatestBriefing();
            setBriefing(data);
            setError(null);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleGenerate() {
        setGenerating(true);
        try {
            const data = await generateBriefing();
            setBriefing(data);
            setError(null);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setGenerating(false);
        }
    }

    async function ask() {
        if (!q.trim() || asking) return;
        const question = q.trim();
        setChat((c) => [...c, { who: "user", text: question }]);
        setQ("");
        setAsking(true);
        try {
            const answer = await sendChat(question);
            setChat((c) => [...c, { who: "ai", text: answer.response }]);
        } catch (e: any) {
            setChat((c) => [...c, { who: "ai", text: `AI unavailable: ${e.message}` }]);
        } finally {
            setAsking(false);
        }
    }

    const hour = new Date().getHours();
    const isNight = hour < 6 || hour > 20;

    return (
        <div className="flex-1 overflow-y-auto scrollbar bg-[#0d1117]">
            <header className="px-6 py-5 border-b border-zinc-800/60">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {isNight ? <Moon className="w-5 h-5 text-blue-400" /> : <Sun className="w-5 h-5 text-amber-400" />}
                        <div>
                            <h1 className="text-lg font-semibold text-zinc-100">
                                {briefing?.greeting || "Morning Briefing"}
                            </h1>
                            <p className="text-sm text-zinc-500 mt-0.5">Here's what happened and what to watch today</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {loading && <Loader2 className="w-4 h-4 text-zinc-500 animate-spin" />}
                        {error && <WifiOff className="w-4 h-4 text-amber-400" />}
                        <button
                            onClick={handleGenerate}
                            disabled={generating}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-md hover:bg-emerald-500/20 disabled:opacity-50"
                        >
                            <RefreshCw className={`w-3 h-3 ${generating ? "animate-spin" : ""}`} />
                            {generating ? "Generating..." : "Refresh Briefing"}
                        </button>
                    </div>
                </div>
            </header>

            <div className="px-6 py-5 space-y-4">
                {/* AI Summary */}
                {briefing && (
                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <Sparkles className="w-4 h-4 text-emerald-400" />
                            <span className="text-[12px] font-semibold text-emerald-400">AI Briefing Summary</span>
                            <span className="text-[9px] text-zinc-500 font-mono ml-auto">{briefing.model} · {briefing.generated_at?.slice(11, 19)}</span>
                        </div>
                        <p className="text-[14px] text-zinc-200 leading-relaxed">{briefing.summary}</p>
                    </div>
                )}

                {/* Stats Row */}
                {briefing?.stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <StatCard label="Incidents" value={briefing.stats.total_incidents} color={briefing.stats.critical_incidents > 0 ? "#f85149" : "#3fb950"} sub={`${briefing.stats.critical_incidents} critical`} />
                        <StatCard label="Remediations" value={briefing.stats.remediations_executed} color="#58a6ff" sub={`${briefing.stats.successful_remediations} successful`} />
                        <StatCard label="Guardian Runs" value={briefing.stats.guardian_runs} color="#a371f7" sub={briefing.stats.guardian_active ? "Active" : "Disabled"} />
                        <StatCard label="Failed Actions" value={briefing.stats.failed_remediations} color={briefing.stats.failed_remediations > 0 ? "#f0883e" : "#3fb950"} sub="need attention" />
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
                    {/* Left: Incidents + Remediations */}
                    <div className="space-y-4">
                        {/* Incidents */}
                        {briefing?.sections?.incidents && briefing.sections.incidents.length > 0 && (
                            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                                <h3 className="text-[13px] font-semibold text-zinc-200 mb-3 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-amber-400" />Overnight Incidents
                                </h3>
                                <div className="space-y-2">
                                    {briefing.sections.incidents.map((inc) => (
                                        <div key={inc.id} className="flex items-center gap-3 p-2.5 rounded-md bg-[#0d1117] border border-zinc-800">
                                            <span className={`w-2 h-2 rounded-full shrink-0 ${inc.severity === "critical" ? "bg-red-500" : inc.severity === "high" ? "bg-orange-400" : "bg-amber-400"}`} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[12px] text-zinc-200 truncate">{inc.title}</p>
                                                <p className="text-[10px] text-zinc-500 font-mono">{inc.service} · {inc.status}</p>
                                            </div>
                                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${inc.severity === "critical" ? "bg-red-500/10 text-red-400" : "bg-amber-500/10 text-amber-400"}`}>{inc.severity}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Remediations */}
                        {briefing?.sections?.remediations && briefing.sections.remediations.length > 0 && (
                            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                                <h3 className="text-[13px] font-semibold text-zinc-200 mb-3 flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-emerald-400" />Actions Executed
                                </h3>
                                <div className="space-y-2">
                                    {briefing.sections.remediations.map((rem, i) => (
                                        <div key={i} className="flex items-center gap-3 p-2.5 rounded-md bg-[#0d1117] border border-zinc-800">
                                            <span className={`w-2 h-2 rounded-full shrink-0 ${rem.status === "success" ? "bg-emerald-400" : rem.status === "failed" ? "bg-red-400" : "bg-zinc-500"}`} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[12px] text-zinc-200">{rem.action} → {rem.target}</p>
                                                <p className="text-[10px] text-zinc-500">{rem.message}</p>
                                            </div>
                                            <span className={`text-[10px] ${rem.status === "success" ? "text-emerald-400" : "text-red-400"}`}>{rem.status}{rem.dry_run ? " (dry-run)" : ""}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Recommendations */}
                        {briefing?.sections?.recommendations && briefing.sections.recommendations.length > 0 && (
                            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                                <h3 className="text-[13px] font-semibold text-zinc-200 mb-3 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-purple-400" />Today's Recommendations
                                </h3>
                                <div className="space-y-2">
                                    {briefing.sections.recommendations.map((rec, i) => (
                                        <div key={i} className="flex items-start gap-2 text-[12px]">
                                            <span className="text-purple-400 shrink-0 mt-0.5">→</span>
                                            <span className="text-zinc-300">{rec}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Guardian Status */}
                        {briefing?.sections?.guardian && (
                            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                                <h3 className="text-[13px] font-semibold text-zinc-200 mb-2 flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-blue-400" />Night Guardian
                                </h3>
                                <p className="text-[12px] text-zinc-400">
                                    Status: <span className={briefing.sections.guardian.enabled ? "text-emerald-400" : "text-zinc-500"}>{briefing.sections.guardian.enabled ? "Active" : "Disabled"}</span>
                                    {briefing.sections.guardian.enabled && ` · ${briefing.sections.guardian.runs} runs · ${briefing.sections.guardian.reports} reports · Confidence: ${briefing.sections.guardian.confidence}%`}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Right: Follow-up Chat */}
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg flex flex-col h-[500px]">
                        <div className="px-4 py-3 border-b border-zinc-800 shrink-0">
                            <h3 className="text-[13px] font-semibold text-zinc-200">Ask Follow-up Questions</h3>
                            <p className="text-[10px] text-zinc-500 mt-0.5">Chat with AI about overnight activity</p>
                        </div>
                        <div className="flex-1 overflow-y-auto scrollbar px-4 py-3 space-y-2">
                            {chat.length === 0 && (
                                <p className="text-[11px] text-zinc-600 text-center py-8">Ask anything about your cluster or overnight incidents...</p>
                            )}
                            {chat.map((m, i) => (
                                <div key={i} className={m.who === "user" ? "ml-auto max-w-[80%]" : "max-w-[90%]"}>
                                    <div className={`px-3 py-2 rounded-lg text-[12px] leading-relaxed ${m.who === "user" ? "bg-emerald-500/10 border border-emerald-500/20 text-zinc-200" : "bg-zinc-800 border border-zinc-700 text-zinc-300"}`}>
                                        {m.text}
                                    </div>
                                </div>
                            ))}
                            {asking && <p className="text-[11px] text-zinc-500">Thinking...</p>}
                        </div>
                        <div className="px-4 py-3 border-t border-zinc-800 shrink-0">
                            <div className="flex gap-2">
                                <input
                                    value={q}
                                    onChange={(e) => setQ(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && ask()}
                                    placeholder="Ask about overnight activity..."
                                    className="flex-1 h-8 bg-[#0d1117] border border-zinc-800 rounded-md px-3 text-[12px] text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50"
                                />
                                <button onClick={ask} disabled={asking || !q.trim()} className="h-8 px-3 bg-emerald-500 text-zinc-900 text-[11px] font-medium rounded-md hover:bg-emerald-400 disabled:opacity-50 flex items-center gap-1">
                                    <Send className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* No data state */}
                {!briefing && !loading && (
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg px-6 py-12 text-center">
                        <Sun className="w-8 h-8 text-amber-400 mx-auto mb-3" />
                        <p className="text-sm text-zinc-400">No briefing available yet.</p>
                        <p className="text-[11px] text-zinc-600 mt-1">Click "Refresh Briefing" to generate one from current cluster data.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function StatCard({ label, value, color, sub }: { label: string; value: number; color: string; sub: string }) {
    return (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3">
            <p className="text-[10px] text-zinc-500 mb-1">{label}</p>
            <p className="text-[22px] font-bold font-mono" style={{ color }}>{value}</p>
            <p className="text-[10px] text-zinc-500 mt-0.5">{sub}</p>
        </div>
    );
}
