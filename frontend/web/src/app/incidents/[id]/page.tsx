"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getIncident, type Incident } from "@/lib/api";
import { timeAgo } from "@/lib/utils";
import { ArrowLeft, Loader2, WifiOff } from "lucide-react";

export default function IncidentDetailPage() {
    const params = useParams<{ id: string }>();
    const [incident, setIncident] = useState<Incident | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const data = await getIncident(params.id);
                setIncident(data);
                setError(null);
            } catch (e: any) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [params.id]);

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center text-zinc-500">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />Loading incident...
            </div>
        );
    }

    if (!incident) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
                <WifiOff className="w-6 h-6 text-zinc-600" />
                <p className="text-zinc-500">{error || "Incident not found"}</p>
                <Link href="/incidents" className="text-xs text-emerald-400 hover:underline">Back to incidents</Link>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto scrollbar">
            <header className="px-6 py-5 border-b border-zinc-800/60">
                <Link href="/incidents" className="flex items-center gap-1.5 text-[11px] text-zinc-500 hover:text-zinc-300 mb-2">
                    <ArrowLeft className="w-3 h-3" />Back to incidents
                </Link>
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-zinc-100">{incident.title}</h1>
                        <p className="text-[12px] text-zinc-500 font-mono mt-0.5">{incident.id} - {incident.namespace}/{incident.service} - {timeAgo(incident.startedAt)}</p>
                    </div>
                    <div className="flex gap-2">
                        <span className={`px-2 py-1 text-[10px] font-semibold uppercase rounded ${incident.severity === "critical" ? "bg-red-500/10 text-red-400" : incident.severity === "high" ? "bg-orange-500/10 text-orange-400" : "bg-amber-500/10 text-amber-400"}`}>{incident.severity}</span>
                        <span className={`px-2 py-1 text-[10px] font-medium rounded ${incident.status === "resolved" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>{incident.status}</span>
                    </div>
                </div>
            </header>

            <div className="px-6 py-5 space-y-5">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2 space-y-4">
                        <Card title="Evidence">
                            <div className="space-y-2 font-mono text-[11px]">
                                {(incident.evidence || []).length === 0 ? (
                                    <p className="text-zinc-500">No evidence returned by backend.</p>
                                ) : incident.evidence!.map((line) => (
                                    <div key={line} className="text-zinc-300">{line}</div>
                                ))}
                            </div>
                        </Card>

                        <Card title="Blast Radius">
                            {(incident.blastRadius || []).length === 0 ? (
                                <p className="text-[12px] text-zinc-500">No affected resources reported.</p>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {incident.blastRadius!.map((b) => (
                                        <span key={b} className="px-2.5 py-1 text-[11px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded">{b}</span>
                                    ))}
                                </div>
                            )}
                        </Card>
                    </div>

                    <div className="space-y-4">
                        <Card title="Root Cause">
                            <p className="text-[13px] text-zinc-300 leading-relaxed mb-3">{incident.rootCause || "Backend has not identified a root cause yet."}</p>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-zinc-500">Confidence</span>
                                <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(incident.confidence || 0) * 100}%` }} />
                                </div>
                                <span className="text-[11px] text-emerald-400 font-mono">{Math.round((incident.confidence || 0) * 100)}%</span>
                            </div>
                        </Card>

                        <Card title="Live Source">
                            <p className="text-[12px] text-zinc-400">This incident is derived from the current Discovery Service cluster snapshot.</p>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg">
            <div className="px-4 py-3 border-b border-zinc-800"><h3 className="text-sm font-medium text-zinc-200">{title}</h3></div>
            <div className="px-4 py-3">{children}</div>
        </div>
    );
}
