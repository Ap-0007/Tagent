import Link from "next/link";
import { incidents } from "@/lib/mock";
import { timeAgo } from "@/lib/utils";

function SevBadge({ s }: { s: string }) {
    const c = s === "critical" ? "bg-red-500/10 text-red-400 border-red-500/20" : s === "high" ? "bg-orange-500/10 text-orange-400 border-orange-500/20" : s === "medium" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20";
    return <span className={`px-1.5 py-0.5 text-[10px] font-medium border rounded ${c}`}>{s}</span>;
}

export default function IncidentsPage() {
    return (
        <div className="flex-1 overflow-y-auto scrollbar">
            <header className="px-6 py-5 border-b border-zinc-800/60">
                <h1 className="text-lg font-semibold text-zinc-100">Incidents</h1>
            </header>
            <div className="px-6 py-5">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg overflow-hidden">
                    <table className="w-full text-[13px]">
                        <thead>
                            <tr className="border-b border-zinc-800 text-zinc-500 text-[11px] uppercase tracking-wider">
                                <th className="text-left px-5 py-2.5 font-medium">Severity</th>
                                <th className="text-left px-3 py-2.5 font-medium">Title</th>
                                <th className="text-left px-3 py-2.5 font-medium">Service</th>
                                <th className="text-left px-3 py-2.5 font-medium">Status</th>
                                <th className="text-right px-5 py-2.5 font-medium">Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                            {incidents.map((i) => (
                                <tr key={i.id} className="hover:bg-zinc-800/20 transition-colors">
                                    <td className="px-5 py-3"><SevBadge s={i.severity} /></td>
                                    <td className="px-3 py-3 text-zinc-200 font-medium">{i.title}</td>
                                    <td className="px-3 py-3 text-zinc-500 font-mono text-[11px]">{i.namespace}/{i.service}</td>
                                    <td className="px-3 py-3">
                                        <span className={`text-[11px] font-medium ${i.status === "active" ? "text-red-400" : i.status === "investigating" ? "text-amber-400" : "text-zinc-500"}`}>{i.status}</span>
                                    </td>
                                    <td className="px-5 py-3 text-right text-zinc-500 font-mono text-[11px]">{timeAgo(i.startedAt)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
