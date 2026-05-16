"use client";

import { DollarSign, TrendingDown, TrendingUp, Lightbulb } from "lucide-react";

const services = [
    { name: "postgres-primary", cost: "$142/mo", trend: "+12%", direction: "up" },
    { name: "checkout-api", cost: "$89/mo", trend: "-3%", direction: "down" },
    { name: "payment-service", cost: "$76/mo", trend: "+8%", direction: "up" },
    { name: "orders-api", cost: "$54/mo", trend: "0%", direction: "flat" },
    { name: "redis-cache", cost: "$32/mo", trend: "-5%", direction: "down" },
    { name: "kafka-broker", cost: "$28/mo", trend: "0%", direction: "flat" },
    { name: "notifications", cost: "$12/mo", trend: "0%", direction: "flat" },
];

const recommendations = [
    { title: "Right-size postgres-primary", saving: "$38/mo", desc: "CPU request is 4 cores but P95 usage is 1.8 cores. Reduce to 2 cores." },
    { title: "Scale down staging cluster nights/weekends", saving: "$120/mo", desc: "Staging has zero traffic 18h/day. Scale to 0 replicas during off-hours." },
    { title: "Switch redis to spot instances", saving: "$14/mo", desc: "Redis is stateless with persistence. Safe for spot with proper failover." },
];

export default function CostPage() {
    const total = "$433/mo";

    return (
        <div className="flex-1 overflow-y-auto scrollbar">
            <header className="px-6 py-5 border-b border-zinc-800/60">
                <h1 className="text-lg font-semibold text-zinc-100">Cost Dashboard</h1>
                <p className="text-sm text-zinc-500 mt-0.5">Infrastructure spend and optimization opportunities</p>
            </header>
            <div className="px-6 py-5 space-y-5">
                {/* Summary */}
                <div className="grid grid-cols-3 gap-3">
                    <Stat icon={DollarSign} label="Monthly Spend" value={total} />
                    <Stat icon={TrendingUp} label="vs Last Month" value="+4.2%" sub="$18 increase" />
                    <Stat icon={Lightbulb} label="Potential Savings" value="$172/mo" sub="3 recommendations" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Per-service cost */}
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg">
                        <div className="px-5 py-3 border-b border-zinc-800"><h2 className="text-sm font-medium text-zinc-200">Cost by Service</h2></div>
                        <div className="divide-y divide-zinc-800/50">
                            {services.map((s) => (
                                <div key={s.name} className="px-5 py-3 flex items-center justify-between">
                                    <span className="text-[13px] text-zinc-300 font-mono">{s.name}</span>
                                    <div className="flex items-center gap-3">
                                        <span className={`text-[11px] flex items-center gap-0.5 ${s.direction === "up" ? "text-red-400" : s.direction === "down" ? "text-emerald-400" : "text-zinc-500"}`}>
                                            {s.direction === "up" && <TrendingUp className="w-3 h-3" />}
                                            {s.direction === "down" && <TrendingDown className="w-3 h-3" />}
                                            {s.trend}
                                        </span>
                                        <span className="text-[13px] text-zinc-200 font-mono w-20 text-right">{s.cost}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recommendations */}
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg">
                        <div className="px-5 py-3 border-b border-zinc-800"><h2 className="text-sm font-medium text-zinc-200">Optimization Recommendations</h2></div>
                        <div className="divide-y divide-zinc-800/50">
                            {recommendations.map((r, i) => (
                                <div key={i} className="px-5 py-3">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[13px] text-zinc-200 font-medium">{r.title}</span>
                                        <span className="text-[11px] text-emerald-400 font-mono">save {r.saving}</span>
                                    </div>
                                    <p className="text-[11px] text-zinc-500">{r.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Stat({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string; sub?: string }) {
    return (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-zinc-400">{label}</span>
                <Icon className="w-4 h-4 text-zinc-600" />
            </div>
            <p className="text-xl font-semibold text-zinc-100 font-mono">{value}</p>
            {sub && <p className="text-[11px] text-zinc-500 mt-0.5">{sub}</p>}
        </div>
    );
}
