"use client";

import { useEffect, useState } from "react";
import { getChaosExperiments, runChaosExperiment, type ChaosExperiment } from "@/lib/api";
import { Zap, Play, CheckCircle, Clock, Loader2, WifiOff } from "lucide-react";

export default function ChaosPage() {
    const [experiments, setExperiments] = useState<ChaosExperiment[]>([]);
    const [running, setRunning] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    async function load() {
        try {
            const data = await getChaosExperiments();
            setExperiments(data.experiments || []);
            setError(null);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    async function run(id: string) {
        setRunning(id);
        setMessage(null);
        try {
            const result = await runChaosExperiment(id);
            setMessage(result.message);
            await load();
        } catch (e: any) {
            setMessage(e.message);
        } finally {
            setRunning(null);
        }
    }

    return (
        <div className="flex-1 overflow-y-auto scrollbar">
            <header className="px-6 py-5 border-b border-zinc-800/60">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-zinc-100">Chaos Testing</h1>
                        <p className="text-sm text-zinc-500 mt-0.5">Backend-driven dry-run failure simulations</p>
                    </div>
                    {loading && <Loader2 className="w-4 h-4 text-zinc-500 animate-spin" />}
                    {error && <span className="flex items-center gap-1 text-[10px] text-amber-400"><WifiOff className="w-3 h-3" />offline</span>}
                </div>
            </header>
            <div className="px-6 py-5 space-y-3">
                {message && <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-3 text-[12px] text-zinc-300">{message}</div>}
                {experiments.length === 0 && !loading ? (
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg px-6 py-12 text-center text-sm text-zinc-500">
                        {error ? "Start API Gateway to see chaos experiments." : "No chaos experiments returned."}
                    </div>
                ) : experiments.map((e) => (
                    <div key={e.id} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Zap className="w-4 h-4 text-amber-400" />
                                <div>
                                    <p className="text-[13px] text-zinc-200 font-medium">{e.name}</p>
                                    <p className="text-[11px] text-zinc-500 font-mono mt-0.5">{e.target} - {e.type}</p>
                                    <p className="text-[11px] text-zinc-600 mt-0.5">{e.description}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5 text-[11px]">
                                    {e.last_result !== "never-run" ? <CheckCircle className="w-3 h-3 text-emerald-400" /> : <Clock className="w-3 h-3 text-zinc-500" />}
                                    <span className={e.last_result !== "never-run" ? "text-emerald-400" : "text-zinc-500"}>{e.last_result}</span>
                                </div>
                                <button
                                    onClick={() => run(e.id)}
                                    disabled={running === e.id}
                                    className="h-7 px-3 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[11px] font-medium rounded hover:bg-amber-500/20 disabled:opacity-50 flex items-center gap-1.5"
                                >
                                    {running === e.id ? <><Clock className="w-3 h-3 animate-spin" />Running...</> : <><Play className="w-3 h-3" />Run</>}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
