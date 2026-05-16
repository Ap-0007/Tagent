import { GitBranch, AlertTriangle, CheckCircle } from "lucide-react";

const deploys = [
    { service: "checkout-api", version: "v2.5.2", time: "2h ago", by: "ci/github-actions", status: "healthy", incident: null },
    { service: "payment-service", version: "v2.4.1", time: "8h ago", by: "tagent/rollback", status: "rollback", incident: "INC-0143" },
    { service: "orders-api", version: "v3.1.0", time: "1d ago", by: "ci/github-actions", status: "healthy", incident: null },
    { service: "payment-service", version: "v2.5.0", time: "1d ago", by: "ci/github-actions", status: "caused-incident", incident: "INC-0143" },
    { service: "checkout-api", version: "v2.5.1", time: "3d ago", by: "ci/github-actions", status: "healthy", incident: null },
    { service: "notifications", version: "v1.8.0", time: "5d ago", by: "ci/github-actions", status: "healthy", incident: null },
];

export default function DeploymentsPage() {
    return (
        <div className="flex-1 overflow-y-auto scrollbar">
            <header className="px-6 py-5 border-b border-zinc-800/60">
                <h1 className="text-lg font-semibold text-zinc-100">Deployments</h1>
                <p className="text-sm text-zinc-500 mt-0.5">Recent deploys correlated with incidents</p>
            </header>
            <div className="px-6 py-5 space-y-3">
                {deploys.map((d, i) => (
                    <div key={i} className={`bg-zinc-900/50 border rounded-lg p-4 ${d.incident ? "border-amber-500/30" : "border-zinc-800"}`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <GitBranch className="w-4 h-4 text-zinc-500" />
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[13px] text-zinc-200 font-medium">{d.service}</span>
                                        <span className="text-[11px] text-zinc-500 font-mono">{d.version}</span>
                                    </div>
                                    <p className="text-[11px] text-zinc-500 mt-0.5">by {d.by} · {d.time}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {d.incident && (
                                    <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded font-mono">
                                        <AlertTriangle className="w-3 h-3" />{d.incident}
                                    </span>
                                )}
                                <span className={`flex items-center gap-1 text-[11px] ${d.status === "healthy" ? "text-emerald-400" : d.status === "rollback" ? "text-blue-400" : "text-red-400"}`}>
                                    {d.status === "healthy" && <CheckCircle className="w-3 h-3" />}
                                    {d.status === "rollback" && <GitBranch className="w-3 h-3" />}
                                    {d.status === "caused-incident" && <AlertTriangle className="w-3 h-3" />}
                                    {d.status}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
