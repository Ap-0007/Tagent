"use client";

import { useEffect, useState } from "react";
import { getRemediationHistory, type RemediationResult } from "@/lib/api";
import { Loader2, WifiOff } from "lucide-react";

export default function AuditPage() {
    const [logs, setLogs] = useState<RemediationResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const data = await getRemediationHistory();
                setLogs(data.history || []);
                setError(null);
            } catch (e: any) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    return (
        <div className="flex-1 overflow-y-auto scrollbar">
            <header className="px-6 py-5 border-b border-zinc-800/60">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-zinc-100">Audit Log</h1>
                        <p className="text-sm text-zinc-500 mt-0.5">Remediation action attempts returned by the backend</p>
                    </div>
                    {loading && <Loader2 className="w-4 h-4 text-zinc-500 animate-spin" />}
                    {error && <span className="flex items-center gap-1 text-[10px] text-amber-400"><WifiOff className="w-3 h-3" />offline</span>}
                </div>
            </header>
            <div className="px-6 py-5">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg overflow-hidden">
                    {logs.length === 0 && !loading ? (
                        <div className="px-6 py-12 text-center text-sm text-zinc-500">
                            {error ? "Start Remediation Service and API Gateway to see audit entries." : "No remediation audit entries returned yet."}
                        </div>
                    ) : (
                        <table className="w-full text-[12px]">
                            <thead>
                                <tr className="border-b border-zinc-800 text-zinc-500 text-[10px] uppercase tracking-wider">
                                    <th className="text-left px-4 py-2.5 font-medium">Time</th>
                                    <th className="text-left px-3 py-2.5 font-medium">Actor</th>
                                    <th className="text-left px-3 py-2.5 font-medium">Action</th>
                                    <th className="text-left px-3 py-2.5 font-medium">Target</th>
                                    <th className="text-left px-3 py-2.5 font-medium">Result</th>
                                    <th className="text-left px-3 py-2.5 font-medium">Mode</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/50 font-mono">
                                {logs.map((l, i) => (
                                    <tr key={`${l.timestamp}-${i}`} className="hover:bg-zinc-800/20">
                                        <td className="px-4 py-2.5 text-zinc-500">{l.timestamp || "-"}</td>
                                        <td className="px-3 py-2.5 text-zinc-400">tagent/remediation</td>
                                        <td className="px-3 py-2.5 text-zinc-200">{l.action}</td>
                                        <td className="px-3 py-2.5 text-zinc-500">{l.target}</td>
                                        <td className="px-3 py-2.5">
                                            <span className={l.status === "success" || l.status === "dry-run" ? "text-emerald-400" : "text-red-400"}>{l.status}</span>
                                        </td>
                                        <td className="px-3 py-2.5 text-zinc-500">{l.dry_run ? "dry-run" : "live"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
