"use client";

import { useState } from "react";
import { Zap, Play, CheckCircle, XCircle, Clock } from "lucide-react";

const experiments = [
    { id: "ch1", name: "Pod kill — checkout-api", target: "production/checkout-api", type: "pod-kill", lastRun: "3d ago", lastResult: "pass" },
    { id: "ch2", name: "Network latency — payment→postgres", target: "production/payment-service", type: "network-delay", lastRun: "1w ago", lastResult: "pass" },
    { id: "ch3", name: "CPU stress — orders-api", target: "production/orders-api", type: "cpu-stress", lastRun: "2w ago", lastResult: "fail" },
    { id: "ch4", name: "Kafka broker failure", target: "data/kafka-broker", type: "pod-kill", lastRun: "never", lastResult: "pending" },
];

export default function ChaosPage() {
    const [running, setRunning] = useState<string | null>(null);

    function run(id: string) {
        setRunning(id);
        setTimeout(() => setRunning(null), 3000);
    }

    return (
        <div className="flex-1 overflow-y-auto scrollbar">
            <header className="px-6 py-5 border-b border-zinc-800/60">
                <h1 className="text-lg font-semibold text-zinc-100">Chaos Testing</h1>
                <p className="text-sm text-zinc-500 mt-0.5">Validate remediation logic with controlled failure simulations</p>
            </header>
            <div className="px-6 py-5 space-y-3">
                {experiments.map((e) => (
                    <div key={e.id} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Zap className="w-4 h-4 text-amber-400" />
                                <div>
                                    <p className="text-[13px] text-zinc-200 font-medium">{e.name}</p>
                                    <p className="text-[11px] text-zinc-500 font-mono mt-0.5">{e.target} · {e.type}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5 text-[11px]">
                                    {e.lastResult === "pass" && <><CheckCircle className="w-3 h-3 text-emerald-400" /><span className="text-emerald-400">pass</span></>}
                                    {e.lastResult === "fail" && <><XCircle className="w-3 h-3 text-red-400" /><span className="text-red-400">fail</span></>}
                                    {e.lastResult === "pending" && <><Clock className="w-3 h-3 text-zinc-500" /><span className="text-zinc-500">never run</span></>}
                                    <span className="text-zinc-600 ml-1">· {e.lastRun}</span>
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

                <div className="bg-zinc-900/50 border border-dashed border-zinc-700 rounded-lg p-4 text-center">
                    <p className="text-[13px] text-zinc-400">+ Create new experiment</p>
                    <p className="text-[11px] text-zinc-600 mt-0.5">Define pod-kill, network-delay, cpu-stress, or disk-pressure tests</p>
                </div>
            </div>
        </div>
    );
}
