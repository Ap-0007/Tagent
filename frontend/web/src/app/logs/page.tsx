"use client";

import { useEffect, useMemo, useState } from "react";
import { getIncidents, type Incident } from "@/lib/api";
import { Loader2, WifiOff } from "lucide-react";

export default function LogsPage() {
    const [filter, setFilter] = useState("");
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [loading, setLoading] = useState(true);
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

    const rows = useMemo(() => incidents.flatMap((incident) => (
        incident.evidence || []
    ).map((line) => ({
        ts: incident.startedAt,
        lvl: incident.severity === "critical" || incident.severity === "high" ? "ERROR" : "WARN",
        svc: incident.service,
        msg: line,
    }))).filter((l) => !filter || `${l.svc} ${l.msg}`.toLowerCase().includes(filter.toLowerCase())), [filter, incidents]);

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            <header className="px-6 py-5 border-b border-zinc-800/60 shrink-0">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-zinc-100">Logs</h1>
                        <p className="text-sm text-zinc-500 mt-0.5">Incident evidence returned by the backend</p>
                    </div>
                    {loading && <Loader2 className="w-4 h-4 text-zinc-500 animate-spin" />}
                    {error && <span className="flex items-center gap-1 text-[10px] text-amber-400"><WifiOff className="w-3 h-3" />offline</span>}
                </div>
            </header>
            <div className="px-6 py-3 border-b border-zinc-800/60 flex items-center gap-2 shrink-0">
                <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter..." className="flex-1 h-8 bg-zinc-900 border border-zinc-800 rounded-md px-3 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50" />
                <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />live</span>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar font-mono text-[11px]">
                {rows.length === 0 && !loading ? (
                    <div className="px-6 py-12 text-center text-sm text-zinc-500">
                        {error ? "Start API Gateway and Discovery Service to show incident evidence." : "No incident evidence returned. Loki log ingestion is not implemented yet."}
                    </div>
                ) : rows.map((l, i) => (
                    <div key={`${l.ts}-${i}`} className="grid grid-cols-[170px_50px_160px_1fr] gap-3 px-6 py-1 hover:bg-zinc-800/20 border-b border-zinc-800/30">
                        <span className="text-zinc-500">{new Date(l.ts).toLocaleString()}</span>
                        <span className={l.lvl === "ERROR" ? "text-red-400" : "text-amber-400"}>{l.lvl}</span>
                        <span className="text-zinc-400 truncate">{l.svc}</span>
                        <span className="text-zinc-300 truncate">{l.msg}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
