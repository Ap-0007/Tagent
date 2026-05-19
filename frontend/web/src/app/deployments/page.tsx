"use client";

import { useEffect, useState } from "react";
import { getDeployments, type DeploymentInfo } from "@/lib/api";
import { GitBranch, AlertTriangle, CheckCircle, Loader2, WifiOff } from "lucide-react";

export default function DeploymentsPage() {
    const [deployments, setDeployments] = useState<DeploymentInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        async function fetchData() {
            try {
                const data = await getDeployments();
                setDeployments(data || []);
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

    return (
        <div className="flex-1 overflow-y-auto scrollbar">
            <header className="px-6 py-5 border-b border-zinc-800/60">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-zinc-100">Deployments</h1>
                        <p className="text-sm text-zinc-500 mt-0.5">{loading ? "Loading..." : `${deployments.length} deployments from Discovery Service`}</p>
                    </div>
                    {loading && <Loader2 className="w-4 h-4 text-zinc-500 animate-spin" />}
                    {error && <span className="flex items-center gap-1 text-[10px] text-amber-400"><WifiOff className="w-3 h-3" />offline</span>}
                </div>
            </header>
            <div className="px-6 py-5 space-y-3">
                {deployments.length === 0 && !loading ? (
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg px-6 py-12 text-center text-sm text-zinc-500">
                        {error ? "Start Discovery Service and API Gateway to see deployments." : "No deployments found."}
                    </div>
                ) : deployments.map((d) => {
                    const healthy = d.ready === d.replicas;
                    return (
                        <div key={`${d.namespace}/${d.name}`} className={`bg-zinc-900/50 border rounded-lg p-4 ${healthy ? "border-zinc-800" : "border-amber-500/30"}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <GitBranch className="w-4 h-4 text-zinc-500" />
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[13px] text-zinc-200 font-medium">{d.name}</span>
                                            <span className="text-[11px] text-zinc-500 font-mono">{d.namespace}</span>
                                        </div>
                                        <p className="text-[11px] text-zinc-500 mt-0.5">{d.ready}/{d.replicas} ready - {d.available} available - age {d.age}</p>
                                    </div>
                                </div>
                                <span className={`flex items-center gap-1 text-[11px] ${healthy ? "text-emerald-400" : "text-amber-400"}`}>
                                    {healthy ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                                    {healthy ? "healthy" : "degraded"}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
