export default function AuditPage() {
    const logs = [
        { ts: "10:24:33", actor: "tagent/auto-fix", action: "Restart pod checkout-api-7d8f4", target: "production/checkout-api", result: "success", incident: "INC-0142" },
        { ts: "10:24:30", actor: "tagent/auto-fix", action: "Scale connection pool 20→50", target: "data/postgres-primary", result: "success", incident: "INC-0142" },
        { ts: "10:20:18", actor: "tagent/detection", action: "Incident created", target: "INC-0142", result: "created", incident: "INC-0142" },
        { ts: "09:47:12", actor: "tagent/auto-fix", action: "Rollback deployment v2.5.0→v2.4.1", target: "production/payment-service", result: "success", incident: "INC-0143" },
        { ts: "09:47:00", actor: "tagent/detection", action: "Incident created", target: "INC-0143", result: "created", incident: "INC-0143" },
        { ts: "08:22:45", actor: "tagent/auto-fix", action: "Restart pods orders-api", target: "production/orders-api", result: "success", incident: "INC-0144" },
        { ts: "06:00:00", actor: "system", action: "Night Guardian mode activated", target: "global", result: "enabled", incident: "-" },
        { ts: "05:55:00", actor: "yaswanth@company.com", action: "Updated escalation settings", target: "settings/escalation", result: "saved", incident: "-" },
    ];

    return (
        <div className="flex-1 overflow-y-auto scrollbar">
            <header className="px-6 py-5 border-b border-zinc-800/60">
                <h1 className="text-lg font-semibold text-zinc-100">Audit Log</h1>
                <p className="text-sm text-zinc-500 mt-0.5">Every action Tagent takes is logged here. Immutable and tamper-evident.</p>
            </header>
            <div className="px-6 py-5">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg overflow-hidden">
                    <table className="w-full text-[12px]">
                        <thead>
                            <tr className="border-b border-zinc-800 text-zinc-500 text-[10px] uppercase tracking-wider">
                                <th className="text-left px-4 py-2.5 font-medium">Time</th>
                                <th className="text-left px-3 py-2.5 font-medium">Actor</th>
                                <th className="text-left px-3 py-2.5 font-medium">Action</th>
                                <th className="text-left px-3 py-2.5 font-medium">Target</th>
                                <th className="text-left px-3 py-2.5 font-medium">Result</th>
                                <th className="text-left px-3 py-2.5 font-medium">Incident</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50 font-mono">
                            {logs.map((l, i) => (
                                <tr key={i} className="hover:bg-zinc-800/20">
                                    <td className="px-4 py-2.5 text-zinc-500">{l.ts}</td>
                                    <td className="px-3 py-2.5 text-zinc-400">{l.actor}</td>
                                    <td className="px-3 py-2.5 text-zinc-200">{l.action}</td>
                                    <td className="px-3 py-2.5 text-zinc-500">{l.target}</td>
                                    <td className="px-3 py-2.5">
                                        <span className={l.result === "success" || l.result === "enabled" || l.result === "saved" ? "text-emerald-400" : l.result === "created" ? "text-blue-400" : "text-red-400"}>{l.result}</span>
                                    </td>
                                    <td className="px-3 py-2.5 text-zinc-500">{l.incident}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
