import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

const hpas = [
    { name: "checkout-api", ns: "production", min: 2, max: 10, current: 3, desired: 5, cpu: "61%", target: "50%", status: "scaling-up", lastScale: "4m ago" },
    { name: "payment-service", ns: "production", min: 2, max: 8, current: 2, desired: 2, cpu: "77%", target: "70%", status: "at-limit", lastScale: "8h ago" },
    { name: "orders-api", ns: "production", min: 2, max: 6, current: 2, desired: 2, cpu: "22%", target: "50%", status: "stable", lastScale: "5d ago" },
    { name: "notifications", ns: "production", min: 1, max: 4, current: 1, desired: 1, cpu: "5%", target: "50%", status: "stable", lastScale: "never" },
];

const vpas = [
    { name: "postgres-primary", ns: "data", mode: "Off (recommend only)", cpuReq: "1000m", cpuRec: "1800m", memReq: "2Gi", memRec: "2.5Gi" },
    { name: "redis-cache", ns: "data", mode: "Auto", cpuReq: "100m", cpuRec: "50m", memReq: "256Mi", memRec: "128Mi" },
    { name: "kafka-broker", ns: "data", mode: "Off (recommend only)", cpuReq: "500m", cpuRec: "400m", memReq: "2Gi", memRec: "1.5Gi" },
];

const events = [
    { time: "4m ago", type: "HPA", msg: "checkout-api scaled from 3 to 5 replicas (CPU above 50% target)" },
    { time: "8h ago", type: "HPA", msg: "payment-service scaled from 3 to 2 replicas (CPU below target)" },
    { time: "1d ago", type: "VPA", msg: "redis-cache memory request adjusted 256Mi → 128Mi (auto mode)" },
    { time: "3d ago", type: "HPA", msg: "checkout-api scaled from 2 to 3 replicas (traffic spike)" },
];

export default function AutoscalingPage() {
    return (
        <div className="flex-1 overflow-y-auto scrollbar">
            <header className="px-6 py-5 border-b border-zinc-800/60">
                <h1 className="text-lg font-semibold text-zinc-100">Autoscaling</h1>
                <p className="text-sm text-zinc-500 mt-0.5">HPA and VPA status across all workloads</p>
            </header>
            <div className="px-6 py-5 space-y-5">
                {/* HPA */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg">
                    <div className="px-5 py-3 border-b border-zinc-800"><h2 className="text-sm font-medium text-zinc-200">Horizontal Pod Autoscalers (HPA)</h2></div>
                    <table className="w-full text-[12px]">
                        <thead><tr className="border-b border-zinc-800 text-zinc-500 text-[10px] uppercase tracking-wider">
                            <th className="text-left px-5 py-2 font-medium">Workload</th>
                            <th className="text-left px-3 py-2 font-medium">Replicas</th>
                            <th className="text-left px-3 py-2 font-medium">Min/Max</th>
                            <th className="text-left px-3 py-2 font-medium">CPU (current/target)</th>
                            <th className="text-left px-3 py-2 font-medium">Status</th>
                            <th className="text-right px-5 py-2 font-medium">Last Scale</th>
                        </tr></thead>
                        <tbody className="divide-y divide-zinc-800/50 font-mono">
                            {hpas.map((h) => (
                                <tr key={h.name} className="hover:bg-zinc-800/20">
                                    <td className="px-5 py-2.5">
                                        <span className="text-zinc-200">{h.name}</span>
                                        <span className="text-zinc-600 ml-1.5 text-[10px]">{h.ns}</span>
                                    </td>
                                    <td className="px-3 py-2.5">
                                        <span className="text-zinc-200">{h.current}</span>
                                        {h.desired !== h.current && <span className="text-amber-400 ml-1">→ {h.desired}</span>}
                                    </td>
                                    <td className="px-3 py-2.5 text-zinc-500">{h.min}/{h.max}</td>
                                    <td className="px-3 py-2.5">
                                        <span className={parseInt(h.cpu) > parseInt(h.target) ? "text-amber-400" : "text-zinc-300"}>{h.cpu}</span>
                                        <span className="text-zinc-600"> / {h.target}</span>
                                    </td>
                                    <td className="px-3 py-2.5">
                                        <span className={`flex items-center gap-1 ${h.status === "scaling-up" ? "text-amber-400" : h.status === "at-limit" ? "text-red-400" : "text-emerald-400"}`}>
                                            {h.status === "scaling-up" && <ArrowUpRight className="w-3 h-3" />}
                                            {h.status === "at-limit" && <ArrowDownRight className="w-3 h-3" />}
                                            {h.status === "stable" && <Minus className="w-3 h-3" />}
                                            {h.status}
                                        </span>
                                    </td>
                                    <td className="px-5 py-2.5 text-right text-zinc-500">{h.lastScale}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* VPA */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg">
                    <div className="px-5 py-3 border-b border-zinc-800"><h2 className="text-sm font-medium text-zinc-200">Vertical Pod Autoscalers (VPA)</h2></div>
                    <table className="w-full text-[12px]">
                        <thead><tr className="border-b border-zinc-800 text-zinc-500 text-[10px] uppercase tracking-wider">
                            <th className="text-left px-5 py-2 font-medium">Workload</th>
                            <th className="text-left px-3 py-2 font-medium">Mode</th>
                            <th className="text-left px-3 py-2 font-medium">CPU (request → recommended)</th>
                            <th className="text-left px-3 py-2 font-medium">Memory (request → recommended)</th>
                        </tr></thead>
                        <tbody className="divide-y divide-zinc-800/50 font-mono">
                            {vpas.map((v) => (
                                <tr key={v.name} className="hover:bg-zinc-800/20">
                                    <td className="px-5 py-2.5"><span className="text-zinc-200">{v.name}</span><span className="text-zinc-600 ml-1.5 text-[10px]">{v.ns}</span></td>
                                    <td className="px-3 py-2.5 text-zinc-400 text-[11px]">{v.mode}</td>
                                    <td className="px-3 py-2.5"><span className="text-zinc-400">{v.cpuReq}</span><span className="text-zinc-600"> → </span><span className={v.cpuRec > v.cpuReq ? "text-amber-400" : "text-emerald-400"}>{v.cpuRec}</span></td>
                                    <td className="px-3 py-2.5"><span className="text-zinc-400">{v.memReq}</span><span className="text-zinc-600"> → </span><span className={v.memRec > v.memReq ? "text-amber-400" : "text-emerald-400"}>{v.memRec}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Scaling events */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg">
                    <div className="px-5 py-3 border-b border-zinc-800"><h2 className="text-sm font-medium text-zinc-200">Recent Scaling Events</h2></div>
                    <div className="divide-y divide-zinc-800/50">
                        {events.map((e, i) => (
                            <div key={i} className="px-5 py-2.5 flex items-center gap-3 text-[12px]">
                                <span className="text-zinc-500 font-mono w-14 shrink-0">{e.time}</span>
                                <span className={`px-1.5 py-0.5 text-[9px] font-semibold rounded ${e.type === "HPA" ? "bg-blue-500/10 text-blue-400" : "bg-purple-500/10 text-purple-400"}`}>{e.type}</span>
                                <span className="text-zinc-300">{e.msg}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
