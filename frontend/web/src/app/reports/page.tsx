import { FileText } from "lucide-react";

const reports = [
    { id: "rep1", title: "Node disk pressure outage", sev: "critical", dur: "47m", resolved: "2h ago" },
    { id: "rep2", title: "Memory leak in image-processor", sev: "high", dur: "1h 12m", resolved: "1d ago" },
    { id: "rep3", title: "DNS outage affecting external calls", sev: "medium", dur: "23m", resolved: "4d ago" },
];

export default function ReportsPage() {
    return (
        <div className="flex-1 overflow-y-auto scrollbar">
            <header className="px-6 py-5 border-b border-zinc-800/60">
                <h1 className="text-lg font-semibold text-zinc-100">Incident Reports</h1>
                <p className="text-sm text-zinc-500 mt-0.5">Auto-generated postmortems</p>
            </header>
            <div className="px-6 py-5 space-y-3">
                {reports.map((r) => (
                    <div key={r.id} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                            <FileText className="w-4 h-4 text-zinc-500 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-[13px] text-zinc-200 font-medium truncate">{r.title}</p>
                                <p className="text-[11px] text-zinc-500 font-mono mt-0.5">duration {r.dur} · resolved {r.resolved}</p>
                            </div>
                            <span className={`px-1.5 py-0.5 text-[10px] font-medium border rounded ${r.sev === "critical" ? "bg-red-500/10 text-red-400 border-red-500/20" : r.sev === "high" ? "bg-orange-500/10 text-orange-400 border-orange-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"}`}>{r.sev}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
