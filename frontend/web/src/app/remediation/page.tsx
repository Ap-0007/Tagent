export default function RemediationPage() {
    const pending = [
        { action: "Restart pod checkout-api-7d8f4", risk: "low", conf: 87 },
        { action: "Scale postgres pool 20 → 50", risk: "medium", conf: 81 },
    ];
    const history = [
        { action: "Rollback payment-service to v2.4.1", status: "executed", risk: "medium" },
        { action: "Drain node ip-10-0-3-21", status: "executed", risk: "high" },
    ];

    return (
        <div className="flex-1 overflow-y-auto scrollbar">
            <header className="px-6 py-5 border-b border-zinc-800/60">
                <h1 className="text-lg font-semibold text-zinc-100">Remediation</h1>
                <p className="text-sm text-zinc-500 mt-0.5">Approval queue and execution history</p>
            </header>
            <div className="px-6 py-5 space-y-5">
                <Section title={`Pending Approval · ${pending.length}`}>
                    {pending.map((p, i) => (
                        <div key={i} className="flex items-center justify-between py-3 border-b border-zinc-800/50 last:border-0">
                            <div>
                                <p className="text-[13px] text-zinc-200 font-medium">{p.action}</p>
                                <p className="text-[11px] text-zinc-500 font-mono mt-0.5">risk: {p.risk} · confidence: {p.conf}%</p>
                            </div>
                            <div className="flex gap-2">
                                <button className="h-7 px-3 bg-emerald-500 text-zinc-900 text-xs font-medium rounded-md hover:bg-emerald-400">Approve</button>
                                <button className="h-7 px-3 border border-zinc-700 text-zinc-300 text-xs rounded-md hover:bg-zinc-800">Reject</button>
                            </div>
                        </div>
                    ))}
                </Section>
                <Section title="History">
                    {history.map((h, i) => (
                        <div key={i} className="flex items-center justify-between py-3 border-b border-zinc-800/50 last:border-0">
                            <p className="text-[13px] text-zinc-300">{h.action}</p>
                            <span className="text-[11px] text-zinc-500 font-mono">{h.status} · {h.risk}</span>
                        </div>
                    ))}
                </Section>
            </div>
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg">
            <div className="px-5 py-3 border-b border-zinc-800"><h2 className="text-sm font-medium text-zinc-200">{title}</h2></div>
            <div className="px-5">{children}</div>
        </div>
    );
}
