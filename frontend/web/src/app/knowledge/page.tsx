"use client";

import { useEffect, useMemo, useState } from "react";
import { getIncidents, type Incident } from "@/lib/api";
import { Search, BookOpen, Loader2, WifiOff } from "lucide-react";

export default function KnowledgePage() {
    const [q, setQ] = useState("");
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

    const patterns = useMemo(() => incidents.map((i) => ({
        title: i.rootCause || i.title,
        count: 1,
        last: new Date(i.startedAt).toLocaleString(),
        fix: i.severity === "critical" || i.severity === "high" ? "Open incident detail, review evidence, and run a dry-run remediation first." : "Monitor until backend RCA provides a recommendation.",
        rate: i.confidence ? Math.round(i.confidence * 100) : 0,
    })).filter((p) => p.title.toLowerCase().includes(q.toLowerCase())), [incidents, q]);

    return (
        <div className="flex-1 overflow-y-auto scrollbar">
            <header className="px-6 py-5 border-b border-zinc-800/60">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-zinc-100">Knowledge Base</h1>
                        <p className="text-sm text-zinc-500 mt-0.5">Current incident patterns from live backend data</p>
                    </div>
                    {loading && <Loader2 className="w-4 h-4 text-zinc-500 animate-spin" />}
                    {error && <span className="flex items-center gap-1 text-[10px] text-amber-400"><WifiOff className="w-3 h-3" />offline</span>}
                </div>
            </header>
            <div className="px-6 py-5 space-y-4">
                <div className="relative">
                    <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search patterns..." className="w-full h-9 bg-zinc-900 border border-zinc-800 rounded-md pl-9 pr-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50" />
                </div>
                {patterns.length === 0 && !loading ? (
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg px-6 py-12 text-center text-sm text-zinc-500">
                        {error ? "Start API Gateway and Discovery Service to build live patterns." : "No incident patterns returned yet."}
                    </div>
                ) : patterns.map((p, i) => (
                    <div key={`${p.title}-${i}`} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <BookOpen className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                            <div className="flex-1">
                                <p className="text-[13px] text-zinc-200 font-medium">{p.title}</p>
                                <p className="text-[11px] text-zinc-500 font-mono mt-1">seen {p.count}x - last {p.last} - confidence <span className="text-emerald-400">{p.rate}%</span></p>
                                <p className="text-[12px] text-zinc-400 border-l-2 border-emerald-500/40 pl-2 mt-2">{p.fix}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
