"use client";

import { useEffect, useState } from "react";
import { ScrollText, Loader2, WifiOff, Search } from "lucide-react";

interface LogEntry {
    id: string;
    timestamp: string;
    pod: string;
    namespace: string;
    message: string;
    level: string;
}

export default function LogsPage() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch("/api/proxy/logs");
                if (res.ok) {
                    const data = await res.json();
                    setLogs(data.logs || []);
                }
                setError(null);
            } catch (e: any) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        }
        load();
        const interval = setInterval(load, 10000);
        return () => clearInterval(interval);
    }, []);

    const filtered = logs.filter(l =>
        !search || l.message.toLowerCase().includes(search.toLowerCase()) || l.pod.includes(search)
    );

    return (
        <div className="flex-1 overflow-y-auto scrollbar bg-[#0d1117]">
            <header className="px-6 py-5 border-b border-zinc-800/60">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-zinc-100">Logs</h1>
                        <p className="text-sm text-zinc-500 mt-0.5">{logs.length} log entries from cluster events</p>
                    </div>
                    {loading && <Loader2 className="w-4 h-4 text-zinc-500 animate-spin" />}
                    {error && <WifiOff className="w-4 h-4 text-amber-400" />}
                </div>
            </header>
            <div className="px-6 py-5 space-y-3">
                <div className="relative">
                    <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter logs..." className="w-full h-9 bg-zinc-900 border border-zinc-800 rounded-md pl-9 pr-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50" />
                </div>

                {filtered.length === 0 && !loading ? (
                    <div className="text-center py-12">
                        <ScrollText className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
                        <p className="text-sm text-zinc-400">{error ? "Cannot reach log service" : "No log entries"}</p>
                    </div>
                ) : (
                    <div className="rounded-lg border border-zinc-800 overflow-hidden font-mono text-[11px]">
                        {filtered.slice(0, 200).map(log => (
                            <div key={log.id} className="flex gap-3 px-3 py-1.5 border-b border-zinc-800/30 hover:bg-[#161b22]">
                                <span className="text-[#8b949e] shrink-0 w-[140px]">{log.timestamp?.slice(0, 19)}</span>
                                <span className={`shrink-0 w-[50px] font-semibold ${log.level === "error" ? "text-red-400" : log.level === "warning" ? "text-amber-400" : "text-zinc-500"}`}>{log.level}</span>
                                <span className="text-[#58a6ff] shrink-0 w-[120px] truncate">{log.namespace}/{log.pod}</span>
                                <span className="text-[#e6edf3] flex-1 truncate">{log.message}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
