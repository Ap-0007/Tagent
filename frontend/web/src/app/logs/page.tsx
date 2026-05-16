"use client";

import { useState } from "react";

const logs = [
    { ts: "10:24:18.142", lvl: "ERROR", svc: "checkout-api", msg: "could not acquire connection from pool, timeout 5000ms" },
    { ts: "10:24:17.891", lvl: "ERROR", svc: "checkout-api", msg: "could not acquire connection from pool, timeout 5000ms" },
    { ts: "10:24:17.512", lvl: "WARN", svc: "postgres-primary", msg: "connection pool at 95% utilization" },
    { ts: "10:24:16.230", lvl: "INFO", svc: "payment-service", msg: "request POST /charge p99=2841ms" },
    { ts: "10:24:15.892", lvl: "ERROR", svc: "checkout-api", msg: "could not acquire connection from pool, timeout 5000ms" },
    { ts: "10:24:14.011", lvl: "WARN", svc: "postgres-primary", msg: "slow query (2.4s): SELECT * FROM orders WHERE..." },
    { ts: "10:24:13.450", lvl: "INFO", svc: "orders-api", msg: "GET /orders status=200 latency=87ms" },
];

export default function LogsPage() {
    const [filter, setFilter] = useState("");
    const [level, setLevel] = useState("ALL");
    const filtered = logs.filter((l) => (level === "ALL" || l.lvl === level) && (!filter || `${l.svc} ${l.msg}`.toLowerCase().includes(filter.toLowerCase())));

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            <header className="px-6 py-5 border-b border-zinc-800/60 shrink-0">
                <h1 className="text-lg font-semibold text-zinc-100">Logs</h1>
            </header>
            <div className="px-6 py-3 border-b border-zinc-800/60 flex items-center gap-2 shrink-0">
                <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter..." className="flex-1 h-8 bg-zinc-900 border border-zinc-800 rounded-md px-3 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50" />
                {["ALL", "ERROR", "WARN", "INFO"].map((l) => (
                    <button key={l} onClick={() => setLevel(l)} className={`h-8 px-2.5 text-[10px] font-mono border rounded-md ${level === l ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "border-zinc-800 text-zinc-500 hover:text-zinc-300"}`}>{l}</button>
                ))}
                <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />live</span>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar font-mono text-[11px]">
                {filtered.map((l, i) => (
                    <div key={i} className="grid grid-cols-[90px_50px_130px_1fr] gap-3 px-6 py-1 hover:bg-zinc-800/20 border-b border-zinc-800/30">
                        <span className="text-zinc-500">{l.ts}</span>
                        <span className={l.lvl === "ERROR" ? "text-red-400" : l.lvl === "WARN" ? "text-amber-400" : "text-emerald-400"}>{l.lvl}</span>
                        <span className="text-zinc-400 truncate">{l.svc}</span>
                        <span className="text-zinc-300 truncate">{l.msg}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
