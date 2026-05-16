export default function RisksPage() {
    const risks = [
        { type: "saturation", sev: "high", title: "postgres-primary CPU trending toward 90%", svc: "postgres-primary", rec: "Increase CPU limit or scale read replicas" },
        { type: "deployment", sev: "medium", title: "checkout-api deploy increased error rate 12%", svc: "checkout-api", rec: "Roll back to v2.4.1" },
        { type: "config", sev: "medium", title: "Memory limit below P95 usage on payment-service", svc: "payment-service", rec: "Raise limit from 512Mi to 768Mi" },
        { type: "security", sev: "low", title: "redis-cache:6.2 has 1 known CVE", svc: "redis-cache", rec: "Upgrade to redis:7.2-alpine" },
    ];

    return (
        <div className="flex-1 overflow-y-auto scrollbar">
            <header className="px-6 py-5 border-b border-zinc-800/60">
                <h1 className="text-lg font-semibold text-zinc-100">Risk Scanner</h1>
                <p className="text-sm text-zinc-500 mt-0.5">Preventive findings before incidents happen</p>
            </header>
            <div className="px-6 py-5 space-y-3">
                {risks.map((r, i) => (
                    <div key={i} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`px-1.5 py-0.5 text-[10px] font-medium border rounded ${r.sev === "high" ? "bg-orange-500/10 text-orange-400 border-orange-500/20" : r.sev === "medium" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20"}`}>{r.sev}</span>
                            <span className="text-[10px] text-zinc-500 uppercase font-mono">{r.type}</span>
                            <span className="text-[10px] text-zinc-600 ml-auto font-mono">{r.svc}</span>
                        </div>
                        <p className="text-[13px] text-zinc-200 font-medium mb-2">{r.title}</p>
                        <p className="text-[12px] text-zinc-400 border-l-2 border-emerald-500/40 pl-2">→ {r.rec}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
