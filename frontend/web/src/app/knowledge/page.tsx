"use client";

import { useState } from "react";
import { Search, BookOpen } from "lucide-react";

const patterns = [
    { title: "DB connection pool exhaustion", count: 4, last: "2h ago", fix: "Scale pool from 20 to 50", rate: 92 },
    { title: "OOMKilled after deploy", count: 7, last: "3d ago", fix: "Raise memory limit + rollback", rate: 85 },
    { title: "Disk pressure from log accumulation", count: 3, last: "1w ago", fix: "Cordon, rotate logs, drain", rate: 100 },
    { title: "DNS resolution failures", count: 2, last: "2w ago", fix: "Restart CoreDNS pods", rate: 100 },
];

export default function KnowledgePage() {
    const [q, setQ] = useState("");
    const filtered = patterns.filter((p) => p.title.toLowerCase().includes(q.toLowerCase()));

    return (
        <div className="flex-1 overflow-y-auto scrollbar">
            <header className="px-6 py-5 border-b border-zinc-800/60">
                <h1 className="text-lg font-semibold text-zinc-100">Knowledge Base</h1>
                <p className="text-sm text-zinc-500 mt-0.5">Incident patterns and proven resolutions</p>
            </header>
            <div className="px-6 py-5 space-y-4">
                <div className="relative">
                    <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search patterns..." className="w-full h-9 bg-zinc-900 border border-zinc-800 rounded-md pl-9 pr-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50" />
                </div>
                {filtered.map((p, i) => (
                    <div key={i} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <BookOpen className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                            <div className="flex-1">
                                <p className="text-[13px] text-zinc-200 font-medium">{p.title}</p>
                                <p className="text-[11px] text-zinc-500 font-mono mt-1">seen {p.count}× · last {p.last} · success <span className="text-emerald-400">{p.rate}%</span></p>
                                <p className="text-[12px] text-zinc-400 border-l-2 border-emerald-500/40 pl-2 mt-2">{p.fix}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
