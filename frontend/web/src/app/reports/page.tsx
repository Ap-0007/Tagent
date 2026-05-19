"use client";

import { useEffect, useState } from "react";
import { getReports, type ReportsResponse } from "@/lib/api";
import { FileText, Loader2, WifiOff } from "lucide-react";

export default function ReportsPage() {
    const [data, setData] = useState<ReportsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const reports = await getReports();
                setData(reports);
                setError(null);
            } catch (e: any) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const reports = data?.reports || [];

    return (
        <div className="flex-1 overflow-y-auto scrollbar">
            <header className="px-6 py-5 border-b border-zinc-800/60">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-zinc-100">Incident Reports</h1>
                        <p className="text-sm text-zinc-500 mt-0.5">Auto-generated postmortems from Documentation Service</p>
                    </div>
                    {loading && <Loader2 className="w-4 h-4 text-zinc-500 animate-spin" />}
                    {error && <span className="flex items-center gap-1 text-[10px] text-amber-400"><WifiOff className="w-3 h-3" />offline</span>}
                </div>
            </header>
            <div className="px-6 py-5 space-y-3">
                {reports.length === 0 && !loading ? (
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg px-6 py-12 text-center">
                        <FileText className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
                        <p className="text-sm text-zinc-400">No reports returned</p>
                        <p className="text-[11px] text-zinc-600 mt-1">{error ? "Start Documentation Service and API Gateway to see reports." : "Reports will appear after incident report generation is implemented."}</p>
                    </div>
                ) : reports.map((r, i) => (
                    <div key={r.id || i} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-colors">
                        <div className="flex items-center gap-3">
                            <FileText className="w-4 h-4 text-zinc-500 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-[13px] text-zinc-200 font-medium truncate">{r.title || r.id || "Untitled report"}</p>
                                <p className="text-[11px] text-zinc-500 font-mono mt-0.5">duration {r.duration || "-"} - resolved {r.resolved_at || "-"}</p>
                            </div>
                            <span className="px-1.5 py-0.5 text-[10px] font-medium border rounded bg-zinc-800 text-zinc-400 border-zinc-700">{r.severity || "unknown"}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
