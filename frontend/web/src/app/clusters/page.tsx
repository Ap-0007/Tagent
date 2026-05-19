"use client";

import { useEffect, useState } from "react";
import { getClusterState, type ClusterState } from "@/lib/api";
import { Loader2, WifiOff } from "lucide-react";

export default function ClustersPage() {
    const [state, setState] = useState<ClusterState | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        async function fetchData() {
            try {
                const data = await getClusterState();
                setState(data);
                setError(null);
            } catch (e: any) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
        interval = setInterval(fetchData, 15000);
        return () => clearInterval(interval);
    }, []);

    const summary = state?.summary;

    return (
        <div className="flex-1 overflow-y-auto scrollbar">
            <header className="px-6 py-5 border-b border-zinc-800/60">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-zinc-100">Clusters</h1>
                        <p className="text-sm text-zinc-500 mt-0.5">{state ? `Last scan ${new Date(state.scanned_at).toLocaleString()}` : "Live Discovery Service cluster snapshot"}</p>
                    </div>
                    {loading && <Loader2 className="w-4 h-4 text-zinc-500 animate-spin" />}
                    {error && <span className="flex items-center gap-1 text-[10px] text-amber-400"><WifiOff className="w-3 h-3" />offline</span>}
                </div>
            </header>
            <div className="px-6 py-5">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg overflow-hidden">
                    {!summary && !loading ? (
                        <div className="px-6 py-12 text-center text-sm text-zinc-500">
                            {error ? "Start Discovery Service and API Gateway to see cluster data." : "No cluster data returned."}
                        </div>
                    ) : (
                        <table className="w-full text-[13px]">
                            <thead><tr className="border-b border-zinc-800 text-zinc-500 text-[11px] uppercase tracking-wider">
                                <th className="text-left px-5 py-2.5 font-medium">Name</th>
                                <th className="text-left px-3 py-2.5 font-medium">Namespaces</th>
                                <th className="text-left px-3 py-2.5 font-medium">Pods</th>
                                <th className="text-left px-3 py-2.5 font-medium">Nodes</th>
                                <th className="text-right px-5 py-2.5 font-medium">Status</th>
                            </tr></thead>
                            <tbody className="divide-y divide-zinc-800/50">
                                {summary && (
                                    <tr className="hover:bg-zinc-800/20 transition-colors">
                                        <td className="px-5 py-3 text-zinc-200 font-mono font-medium">current-context</td>
                                        <td className="px-3 py-3 text-zinc-500 text-[11px]">{state?.namespaces?.length || 0}</td>
                                        <td className="px-3 py-3 text-zinc-400 text-[11px] font-mono">{summary.running_pods}/{summary.total_pods}</td>
                                        <td className="px-3 py-3 text-zinc-400 text-[11px] font-mono">{summary.ready_nodes}/{summary.total_nodes}</td>
                                        <td className="px-5 py-3 text-right">
                                            <span className={`${summary.failed_pods > 0 || summary.ready_nodes < summary.total_nodes ? "text-amber-400" : "text-emerald-400"} text-[11px]`}>
                                                {summary.failed_pods > 0 || summary.ready_nodes < summary.total_nodes ? "degraded" : "healthy"}
                                            </span>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
