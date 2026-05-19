"use client";

import { useEffect, useMemo, useState } from "react";
import { getClusterState, type ClusterState } from "@/lib/api";
import { Loader2, WifiOff } from "lucide-react";

export default function RisksPage() {
    const [state, setState] = useState<ClusterState | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
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
    }, []);

    const risks = useMemo(() => {
        if (!state) return [];
        const podRisks = state.pods
            .filter((p) => p.status !== "Running" && p.status !== "Succeeded")
            .map((p) => ({
                type: "pod",
                sev: p.status === "Failed" || p.status === "Error" ? "high" : "medium",
                title: `${p.namespace}/${p.name} is ${p.status}`,
                svc: p.name,
                rec: p.status === "CrashLoopBackOff" ? "Inspect logs, then dry-run restart-pod from Remediation." : "Inspect pod events and scheduling constraints.",
            }));
        const nodeRisks = state.nodes
            .filter((n) => n.status !== "Ready")
            .map((n) => ({
                type: "node",
                sev: "high",
                title: `${n.name} is ${n.status}`,
                svc: n.name,
                rec: "Check node conditions, disk pressure, kubelet health, and workloads scheduled on this node.",
            }));
        const deploymentRisks = state.deployments
            .filter((d) => d.ready < d.replicas)
            .map((d) => ({
                type: "deployment",
                sev: "medium",
                title: `${d.namespace}/${d.name} has ${d.ready}/${d.replicas} replicas ready`,
                svc: d.name,
                rec: "Inspect rollout status and failing pods before scaling or restarting.",
            }));
        return [...nodeRisks, ...podRisks, ...deploymentRisks];
    }, [state]);

    return (
        <div className="flex-1 overflow-y-auto scrollbar">
            <header className="px-6 py-5 border-b border-zinc-800/60">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-zinc-100">Risk Scanner</h1>
                        <p className="text-sm text-zinc-500 mt-0.5">Preventive findings derived from live cluster state</p>
                    </div>
                    {loading && <Loader2 className="w-4 h-4 text-zinc-500 animate-spin" />}
                    {error && <span className="flex items-center gap-1 text-[10px] text-amber-400"><WifiOff className="w-3 h-3" />offline</span>}
                </div>
            </header>
            <div className="px-6 py-5 space-y-3">
                {risks.length === 0 && !loading ? (
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg px-6 py-12 text-center text-sm text-zinc-500">
                        {error ? "Start Discovery Service and API Gateway to calculate risks." : "No live risks detected from current Discovery data."}
                    </div>
                ) : risks.map((r, i) => (
                    <div key={`${r.type}-${r.svc}-${i}`} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`px-1.5 py-0.5 text-[10px] font-medium border rounded ${r.sev === "high" ? "bg-orange-500/10 text-orange-400 border-orange-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"}`}>{r.sev}</span>
                            <span className="text-[10px] text-zinc-500 uppercase font-mono">{r.type}</span>
                            <span className="text-[10px] text-zinc-600 ml-auto font-mono">{r.svc}</span>
                        </div>
                        <p className="text-[13px] text-zinc-200 font-medium mb-2">{r.title}</p>
                        <p className="text-[12px] text-zinc-400 border-l-2 border-emerald-500/40 pl-2">{r.rec}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
