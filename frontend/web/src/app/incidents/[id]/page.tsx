"use client";

import { useParams } from "next/navigation";
import { incidents } from "@/lib/mock";
import { timeAgo } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, FileText, CheckCircle, XCircle } from "lucide-react";

const timeline = [
    { t: "+00:00", event: "Anomaly detected: pod restart count exceeded threshold", type: "detect" },
    { t: "+00:12", event: "Logs analyzed: connection refused errors to postgres-primary", type: "analyze" },
    { t: "+00:18", event: "Correlation: matches pattern from INC-0089 (4th occurrence)", type: "correlate" },
    { t: "+00:24", event: "Root cause identified: database connection pool exhausted", type: "rca" },
    { t: "+00:30", event: "Remediation suggested: scale pool 20 → 50", type: "suggest" },
    { t: "+00:32", event: "Auto-approved (confidence 87%, low-risk action)", type: "approve" },
    { t: "+00:33", event: "Executed: pool scaled, 3 pods restarted", type: "execute" },
    { t: "+00:37", event: "Verification: all pods Ready, error rate 0%", type: "verify" },
];

const evidence = [
    { ts: "02:14:18", lvl: "ERROR", msg: "could not acquire connection from pool, timeout 5000ms" },
    { ts: "02:14:17", lvl: "ERROR", msg: "could not acquire connection from pool, timeout 5000ms" },
    { ts: "02:14:16", lvl: "WARN", msg: "connection pool at 95% utilization (19/20)" },
    { ts: "02:14:14", lvl: "WARN", msg: "slow query (2.4s): SELECT * FROM orders WHERE..." },
];

export default function IncidentDetailPage() {
    const params = useParams();
    const incident = incidents.find((i) => i.id === params.id);

    if (!incident) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <p className="text-zinc-500">Incident not found</p>
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
                        <p className="text-[12px] text-zinc-500 font-mono mt-0.5">{incident.id} · {incident.namespace}/{incident.service} · {timeAgo(incident.startedAt)}</p>
                    </div>
                    <div className="flex gap-2">
                        <span className={`px-2 py-1 text-[10px] font-semibold uppercase rounded ${incident.severity === "critical" ? "bg-red-500/10 text-red-400" : incident.severity === "high" ? "bg-orange-500/10 text-orange-400" : "bg-amber-500/10 text-amber-400"}`}>{incident.severity}</span>
                        <span className={`px-2 py-1 text-[10px] font-medium rounded ${incident.status === "resolved" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>{incident.status}</span>
                    </div>
                </div>
            </header>

            <div className="px-6 py-5 space-y-5">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Timeline */}
                    <div className="lg:col-span-2 space-y-4">
                        <Card title="Timeline">
                            <div className="space-y-2">
                                {timeline.map((t, i) => (
                                    <div key={i} className="flex gap-3 text-[12px]">
                                        <span className="text-emerald-400 font-mono w-14 shrink-0">{t.t}</span>
                                        <span className="text-zinc-300">{t.event}</span>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        <Card title="Evidence (Logs)">
                            <div className="space-y-1 font-mono text-[11px]">
                                {evidence.map((l, i) => (
                                    <div key={i} className="flex gap-3">
                                        <span className="text-zinc-500 w-16 shrink-0">{l.ts}</span>
                                        <span className={`w-12 shrink-0 ${l.lvl === "ERROR" ? "text-red-400" : "text-amber-400"}`}>{l.lvl}</span>
                                        <span className="text-zinc-300 truncate">{l.msg}</span>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        <Card title="Blast Radius">
                            <div className="flex flex-wrap gap-2">
                                {(incident.blastRadius || []).map((b) => (
                                    <span key={b} className="px-2.5 py-1 text-[11px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded">{b}</span>
                                ))}
                            </div>
                            <p className="text-[11px] text-zinc-500 mt-2">Services downstream of the failure point.</p>
                        </Card>
                    </div>

                    {/* Right column */}
                    <div className="space-y-4">
                        <Card title="Root Cause">
                            <p className="text-[13px] text-zinc-300 leading-relaxed mb-3">{incident.rootCause}</p>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-[10px] text-zinc-500">Confidence</span>
                                <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(incident.confidence || 0) * 100}%` }} />
                                </div>
                                <span className="text-[11px] text-emerald-400 font-mono">{Math.round((incident.confidence || 0) * 100)}%</span>
                            </div>
                        </Card>

                        <Card title="Suggested Action">
                            <p className="text-[13px] text-zinc-300 mb-3">Scale postgres connection pool 20 → 50</p>
                            <div className="flex gap-2">
                                <button className="flex-1 h-8 bg-emerald-500 text-zinc-900 text-xs font-medium rounded-md hover:bg-emerald-400 flex items-center justify-center gap-1.5">
                                    <CheckCircle className="w-3.5 h-3.5" />Approve
                                </button>
                                <button className="flex-1 h-8 border border-zinc-700 text-zinc-300 text-xs rounded-md hover:bg-zinc-800 flex items-center justify-center gap-1.5">
                                    <XCircle className="w-3.5 h-3.5" />Reject
                                </button>
                            </div>
                        </Card>

                        <Card title="Similar Incidents">
                            <div className="space-y-2">
                                {["INC-0089: Same pool exhaustion (14d ago)", "INC-0076: Pool timeout under load (28d ago)", "INC-0051: DB connection leak (45d ago)"].map((s, i) => (
                                    <p key={i} className="text-[12px] text-zinc-400">{s}</p>
                                ))}
                            </div>
                        </Card>

                        <button className="w-full h-9 border border-zinc-700 text-zinc-300 text-xs rounded-md hover:bg-zinc-800 flex items-center justify-center gap-1.5">
                            <FileText className="w-3.5 h-3.5" />Generate Report
                        </button>
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
