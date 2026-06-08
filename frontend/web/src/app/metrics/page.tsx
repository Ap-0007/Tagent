"use client";

import { useState } from "react";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Legend, AreaChart, Area,
} from "recharts";

export default function MetricsPage() {
    return (
        <div className="flex-1 overflow-y-auto wi-scrollbar bg-[#0d1117]">
            <style jsx global>{`
                .wi-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
                .wi-scrollbar::-webkit-scrollbar-track { background: #161b22; }
                .wi-scrollbar::-webkit-scrollbar-thumb { background: #30363d; border-radius: 3px; }
                @keyframes wi-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
                @keyframes wi-dash { to { stroke-dashoffset: -24; } }
                .wi-flow-medium { stroke-dasharray: 6 4; animation: wi-dash 1.2s linear infinite; }
            `}</style>
            <div className="px-4 pt-4 pb-6 space-y-3">
                <MetricsStatsRow />
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px_320px] gap-3">
                    <LiveInfrastructureMap />
                    <AIOperationalInsights />
                    <AnomalyDetection />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
                    <ResourceObservatory />
                    <PredictiveHealthForecast />
                    <ServiceHealthMatrix />
                    <IntelligenceTimeline />
                </div>
                <AIReasoningEngine />
            </div>
        </div>
    );
}

function MetricsStatsRow() {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
                { label: "Cluster Health", value: "98.7%", trend: "↗ 2.4% vs 1h ago", trendColor: "#3fb950", color: "#3fb950" },
                { label: "AI Confidence", value: "96%", trend: "↗ 1.8% vs 1h ago", trendColor: "#3fb950", color: "#a371f7" },
                { label: "Active Services", value: "47", trend: "↗ 3 vs 1h ago", trendColor: "#3fb950", color: "#22d3ee" },
                { label: "Resource Efficiency", value: "92%", trend: "↗ 3.7% vs 1h ago", trendColor: "#3fb950", color: "#3fb950" },
                { label: "Operational Risk", value: "Low", trend: "↗ Improving", trendColor: "#3fb950", color: "#3fb950" },
                { label: "Signals Correlated", value: "847", trend: "↗ 128 vs 1h ago", trendColor: "#3fb950", color: "#58a6ff" },
            ].map((s, i) => (
                <div key={i} className="rounded-[10px] border border-[#21262d] bg-[#161b22] p-3" style={{ background: `radial-gradient(circle at 85% 25%, ${s.color}12 0%, transparent 55%), #161b22` }}>
                    <p className="text-[10.5px] text-[#8b949e] font-medium mb-1.5">{s.label}</p>
                    <p className="text-[22px] font-bold text-[#e6edf3] leading-none font-mono">{s.value}</p>
                    <p className="text-[10px] mt-1.5 font-medium" style={{ color: s.trendColor }}>{s.trend}</p>
                </div>
            ))}
        </div>
    );
}

function LiveInfrastructureMap() {
    return (
        <div className="rounded-[12px] border border-[#21262d] bg-[#161b22] p-3.5">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                    <h3 className="text-[14px] font-semibold text-[#e6edf3]">Live Infrastructure Map</h3>
                    <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#3fb950]/10 border border-[#3fb950]/30">
                        <span className="w-1 h-1 rounded-full bg-[#3fb950]" style={{ boxShadow: "0 0 4px #3fb950", animation: "wi-pulse 2s infinite" }} />
                        <span className="text-[9px] text-[#3fb950] font-semibold">Live</span>
                    </div>
                </div>
                <span className="text-[10px] text-[#8b949e]">View: Dependency ▾</span>
            </div>
            <div className="relative h-[240px] rounded-lg overflow-hidden" style={{ background: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(76,29,149,0.12) 0%, transparent 65%), linear-gradient(180deg, #0a0e1d 0%, #0d1124 100%)" }}>
                <svg viewBox="0 0 500 240" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
                    {[
                        { label: "API Gateway", sub: "Healthy", x: 250, y: 50, color: "#3fb950" },
                        { label: "AI Engine", sub: "Healthy", x: 400, y: 50, color: "#3fb950" },
                        { label: "Web Frontend", sub: "Healthy", x: 80, y: 100, color: "#3fb950" },
                        { label: "Payment Service", sub: "Degraded", x: 250, y: 120, color: "#f0883e" },
                        { label: "Order Service", sub: "Healthy", x: 250, y: 190, color: "#3fb950" },
                        { label: "Mobile API", sub: "Healthy", x: 150, y: 190, color: "#3fb950" },
                        { label: "PostgreSQL", sub: "Warning", x: 400, y: 140, color: "#f0883e" },
                        { label: "Redis Cluster", sub: "Healthy", x: 420, y: 210, color: "#3fb950" },
                    ].map((n, i) => (
                        <g key={i}>
                            <circle cx={n.x} cy={n.y} r="16" fill="#0a0e15" stroke={n.color} strokeWidth="1.8" style={{ filter: `drop-shadow(0 0 4px ${n.color})` }} />
                            <text x={n.x} y={n.y + 28} textAnchor="middle" fontSize="9" fontWeight="600" fill="#e6edf3">{n.label}</text>
                            <text x={n.x} y={n.y + 38} textAnchor="middle" fontSize="7.5" fill={n.color}>{n.sub}</text>
                        </g>
                    ))}
                    {[[0, 2], [0, 3], [0, 1], [3, 4], [3, 6], [5, 4], [1, 6], [6, 7]].map(([a, b], i) => {
                        const nodes = [{ x: 250, y: 50 }, { x: 400, y: 50 }, { x: 80, y: 100 }, { x: 250, y: 120 }, { x: 250, y: 190 }, { x: 150, y: 190 }, { x: 400, y: 140 }, { x: 420, y: 210 }];
                        return <line key={i} x1={nodes[a].x} y1={nodes[a].y} x2={nodes[b].x} y2={nodes[b].y} stroke="#22d3ee" strokeWidth="1" strokeOpacity="0.4" className="wi-flow-medium" />;
                    })}
                </svg>
            </div>
        </div>
    );
}

function AIOperationalInsights() {
    const insights = [
        { text: "Resource utilization stable across 89% of workloads", confidence: 96, impact: "Low Impact", impactColor: "#3fb950" },
        { text: "Payment service latency increased 17% in last 15m", confidence: 94, impact: "Medium Impact", impactColor: "#f0883e" },
        { text: "Memory consumption trending upward on 2 nodes", confidence: 92, impact: "Medium Impact", impactColor: "#f0883e" },
        { text: "Network health within baseline", confidence: 98, impact: "Low Impact", impactColor: "#3fb950" },
        { text: "No restart anomalies detected", confidence: 96, impact: "Low Impact", impactColor: "#3fb950" },
    ];
    return (
        <div className="rounded-[12px] border border-[#21262d] bg-[#161b22] p-3.5">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-semibold text-[#e6edf3]">AI Operational Insights</h3>
                <button className="text-[10px] text-[#58a6ff]">Live Analysis</button>
            </div>
            <div className="space-y-2">
                {insights.map((ins, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded-md bg-[#0d1117] border border-[#21262d]">
                        <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: ins.impactColor }} />
                        <div className="flex-1 min-w-0">
                            <p className="text-[11px] text-[#e6edf3] leading-snug">{ins.text}</p>
                            <div className="flex items-center gap-2 mt-1 text-[9.5px]">
                                <span className="text-[#8b949e]">Confidence {ins.confidence}%</span>
                                <span className="px-1.5 py-0.5 rounded font-semibold" style={{ background: `${ins.impactColor}18`, color: ins.impactColor }}>{ins.impact}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function AnomalyDetection() {
    return (
        <div className="rounded-[12px] border border-[#21262d] bg-[#161b22] p-3.5">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-semibold text-[#e6edf3]">Anomaly Detection</h3>
                <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold" style={{ background: "rgba(248,81,73,0.15)", color: "#f85149" }}>Active ●</span>
            </div>
            <div className="rounded-md bg-[#f85149]/5 border border-[#f85149]/20 p-3 mb-3">
                <p className="text-[12px] font-semibold text-[#f85149] mb-1">⚠ Anomaly Detected</p>
                <div className="grid grid-cols-2 gap-2 text-[10px] mt-2">
                    <div><span className="text-[#8b949e]">Service</span><p className="text-[#e6edf3] font-mono">payment-api</p></div>
                    <div><span className="text-[#8b949e]">Metric</span><p className="text-[#e6edf3] font-mono">P95 Latency</p></div>
                    <div><span className="text-[#8b949e]">Deviation</span><p className="text-[#f85149] font-mono font-semibold">+37%</p></div>
                    <div><span className="text-[#8b949e]">Confidence</span><p className="text-[#e6edf3] font-mono">94%</p></div>
                </div>
                <div className="mt-2"><span className="text-[9.5px] text-[#8b949e]">Likely Cause</span><p className="text-[10.5px] text-[#e6edf3]">Database connection saturation</p></div>
                <div className="mt-1.5"><span className="text-[9.5px] text-[#8b949e]">Predicted Impact</span><span className="ml-2 text-[9.5px] px-1.5 py-0.5 rounded font-semibold" style={{ background: "rgba(240,136,62,0.15)", color: "#f0883e" }}>Medium</span></div>
                <div className="mt-2"><span className="text-[9.5px] text-[#8b949e]">Recommended Action</span><p className="text-[10.5px] text-[#e6edf3]">Scale connection pool</p></div>
                <a href="/risks" className="mt-2 inline-flex items-center gap-1 text-[10px] text-[#58a6ff] font-semibold hover:text-[#79c0ff]">Investigate Now →</a>
            </div>
        </div>
    );
}

function ResourceObservatory() {
    const metrics = [
        { label: "CPU Utilization", value: "62%", color: "#3fb950" },
        { label: "Memory Usage", value: "68%", color: "#f0883e" },
        { label: "Network I/O", value: "320 Mbps", color: "#22d3ee" },
        { label: "Storage I/O", value: "1.2K IOPS", color: "#a371f7" },
        { label: "P95 Latency", value: "124 ms", color: "#f0883e" },
        { label: "Error Rate", value: "0.51%", color: "#3fb950" },
    ];
    return (
        <div className="rounded-[12px] border border-[#21262d] bg-[#161b22] p-3.5">
            <div className="flex items-center gap-2 mb-3">
                <h3 className="text-[13px] font-semibold text-[#e6edf3]">Resource Observatory</h3>
                <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#3fb950]/10 border border-[#3fb950]/30">
                    <span className="w-1 h-1 rounded-full bg-[#3fb950]" style={{ animation: "wi-pulse 2s infinite" }} />
                    <span className="text-[9px] text-[#3fb950] font-semibold">Live</span>
                </div>
            </div>
            <div className="space-y-2">
                {metrics.map((m, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: m.color }} />
                        <span className="text-[10.5px] text-[#8b949e] flex-1">{m.label}</span>
                        <span className="text-[11px] font-bold text-[#e6edf3] font-mono">{m.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function PredictiveHealthForecast() {
    const [tab, setTab] = useState("Next 1 Hour");
    return (
        <div className="rounded-[12px] border border-[#21262d] bg-[#161b22] p-3.5">
            <h3 className="text-[13px] font-semibold text-[#e6edf3] mb-2">Predictive Health Forecast</h3>
            <div className="flex items-center gap-0.5 p-0.5 rounded-md bg-[#0d1117] border border-[#30363d] mb-3 w-fit">
                {["Next 1 Hour", "Next 24 Hours", "Next 7 Days"].map(t => (
                    <button key={t} onClick={() => setTab(t)} className={`px-2 h-5 rounded text-[9px] ${tab === t ? "bg-[#1f6feb]/20 text-[#58a6ff] font-medium" : "text-[#8b949e]"}`}>{t}</button>
                ))}
            </div>
            <div className="space-y-1.5 text-[10px]">
                {[
                    { label: "CPU Saturation", value: "48%", color: "#f0883e" },
                    { label: "Memory Pressure", value: "42%", color: "#f0883e" },
                    { label: "Scaling Events", value: "35%", color: "#22d3ee" },
                    { label: "Service Degradation", value: "22%", color: "#3fb950" },
                ].map((p, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <span className="text-[#8b949e] w-[110px]">{p.label}</span>
                        <div className="flex-1 h-1 rounded-full bg-[#21262d] overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: p.value, background: p.color }} />
                        </div>
                        <span className="font-mono font-semibold w-[30px] text-right" style={{ color: p.color }}>{p.value}</span>
                    </div>
                ))}
            </div>
            <p className="text-[10px] text-[#8b949e] mt-3 pt-2 border-t border-[#21262d]">AI Recommendation: High probability of memory pressure in 45-60 minutes on worker nodes.</p>
            <a href="/risks" className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-[#58a6ff] font-semibold">View Recommendation →</a>
        </div>
    );
}

function ServiceHealthMatrix() {
    const services = [
        { name: "API Gateway", health: 98, latency: "78ms", error: "0.12%", traffic: "High", risk: "Low", riskColor: "#3fb950" },
        { name: "Payment Service", health: 76, latency: "342ms", error: "1.42%", traffic: "High", risk: "High", riskColor: "#f85149" },
        { name: "Order Service", health: 94, latency: "112ms", error: "0.21%", traffic: "Medium", risk: "Low", riskColor: "#3fb950" },
        { name: "AI Engine", health: 96, latency: "156ms", error: "0.08%", traffic: "Low", risk: "Low", riskColor: "#3fb950" },
        { name: "Notification", health: 93, latency: "98ms", error: "0.19%", traffic: "Low", risk: "Low", riskColor: "#3fb950" },
        { name: "PostgreSQL", health: 82, latency: "—", error: "0.34%", traffic: "Medium", risk: "Medium", riskColor: "#f0883e" },
        { name: "Redis Cluster", health: 99, latency: "0.3ms", error: "0.01%", traffic: "Low", risk: "Low", riskColor: "#3fb950" },
        { name: "Kafka Cluster", health: 97, latency: "12ms", error: "0.02%", traffic: "Low", risk: "Low", riskColor: "#3fb950" },
    ];
    return (
        <div className="rounded-[12px] border border-[#21262d] bg-[#161b22] p-3.5">
            <div className="flex items-center gap-2 mb-3">
                <h3 className="text-[13px] font-semibold text-[#e6edf3]">Service Health Matrix</h3>
                <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#3fb950]/10 border border-[#3fb950]/30">
                    <span className="w-1 h-1 rounded-full bg-[#3fb950]" style={{ animation: "wi-pulse 2s infinite" }} />
                    <span className="text-[9px] text-[#3fb950] font-semibold">Live</span>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-[10px]">
                    <thead><tr className="border-b border-[#21262d] text-[#8b949e]">
                        <th className="text-left py-1.5 font-medium">Service</th>
                        <th className="text-left py-1.5 font-medium">Health</th>
                        <th className="text-left py-1.5 font-medium">Latency</th>
                        <th className="text-left py-1.5 font-medium">Error Rate</th>
                        <th className="text-left py-1.5 font-medium">Traffic</th>
                        <th className="text-left py-1.5 font-medium">Risk</th>
                    </tr></thead>
                    <tbody>
                        {services.map((s, i) => {
                            const hColor = s.health >= 95 ? "#3fb950" : s.health >= 80 ? "#f0883e" : "#f85149";
                            return (
                                <tr key={i} className="border-b border-[#21262d] last:border-0">
                                    <td className="py-1.5 text-[#e6edf3] font-medium">{s.name}</td>
                                    <td className="py-1.5"><span className="font-mono font-bold" style={{ color: hColor }}>{s.health}</span></td>
                                    <td className="py-1.5 text-[#8b949e] font-mono">{s.latency}</td>
                                    <td className="py-1.5 text-[#8b949e] font-mono">{s.error}</td>
                                    <td className="py-1.5 text-[#8b949e]">{s.traffic}</td>
                                    <td className="py-1.5"><span className="px-1 py-0.5 rounded text-[9px] font-semibold" style={{ background: `${s.riskColor}18`, color: s.riskColor }}>{s.risk}</span></td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function IntelligenceTimeline() {
    const events = [
        { time: "10:24", title: "Latency anomaly detected", sub: "payment-api + P95 latency +37%", color: "#f85149" },
        { time: "10:25", title: "AI correlation in progress", sub: "Analyzing 847 correlated signals", color: "#a371f7" },
        { time: "10:26", title: "Root cause identified", sub: "Database connection saturation", color: "#f0883e" },
        { time: "10:27", title: "Recommendation generated", sub: "Scale connection pool to 150", color: "#58a6ff" },
        { time: "10:28", title: "Auto-remediation initiated", sub: "Scaling connection pool...", color: "#3fb950" },
        { time: "10:29 AM", title: "System stabilizing", sub: "Latency returning to baseline", color: "#3fb950" },
    ];
    return (
        <div className="rounded-[12px] border border-[#21262d] bg-[#161b22] p-3.5">
            <div className="flex items-center gap-2 mb-3">
                <h3 className="text-[13px] font-semibold text-[#e6edf3]">Intelligence Timeline</h3>
                <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#3fb950]/10 border border-[#3fb950]/30">
                    <span className="w-1 h-1 rounded-full bg-[#3fb950]" style={{ animation: "wi-pulse 2s infinite" }} />
                    <span className="text-[9px] text-[#3fb950] font-semibold">Live</span>
                </div>
            </div>
            <div className="space-y-2">
                {events.map((ev, i) => (
                    <div key={i} className="flex items-start gap-2">
                        <span className="text-[9px] text-[#6e7681] font-mono w-[42px] shrink-0 mt-0.5">{ev.time}</span>
                        <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: ev.color }} />
                        <div className="min-w-0">
                            <p className="text-[10.5px] font-semibold text-[#e6edf3]">{ev.title}</p>
                            <p className="text-[9.5px] text-[#8b949e] truncate">{ev.sub}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function AIReasoningEngine() {
    return (
        <div className="rounded-[12px] border border-[#21262d] bg-[#161b22] p-3.5">
            <div className="flex items-center gap-2.5 mb-3">
                <h3 className="text-[14px] font-semibold text-[#e6edf3]">AI Reasoning Engine</h3>
                <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#3fb950]/10 border border-[#3fb950]/30">
                    <span className="w-1 h-1 rounded-full bg-[#3fb950]" style={{ animation: "wi-pulse 2s infinite" }} />
                    <span className="text-[9px] text-[#3fb950] font-semibold">Live</span>
                </div>
            </div>
            <p className="text-[11px] text-[#8b949e] mb-3">Correlating telemetry, identifying patterns, and predicting outcomes.</p>
            <div className="flex items-center gap-4 flex-wrap">
                {[
                    { icon: "📊", label: "Metrics", sub: "Analyzing 12.4K metrics" },
                    { icon: "📋", label: "Logs", sub: "Scanning 8.7K logs" },
                    { icon: "🔍", label: "Traces", sub: "Processing 3.2K traces" },
                    { icon: "⚡", label: "Events", sub: "Correlating 245 events" },
                    { icon: "🚀", label: "Deployments", sub: "Reviewing 7 changes" },
                    { icon: "🔗", label: "Dependencies", sub: "Mapping 99 services" },
                    { icon: "📚", label: "Historical Incidents", sub: "Learning from 231 cases" },
                ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-[#0d1117] border border-[#21262d]">
                        <span className="text-[14px]">{item.icon}</span>
                        <div>
                            <p className="text-[10.5px] text-[#e6edf3] font-medium">{item.label}</p>
                            <p className="text-[9px] text-[#8b949e]">{item.sub}</p>
                        </div>
                    </div>
                ))}
                <div className="ml-auto flex items-center gap-2">
                    <span className="text-[10px] text-[#8b949e]">Confidence</span>
                    <svg width="36" height="36" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="14" fill="none" stroke="#21262d" strokeWidth="3" />
                        <circle cx="18" cy="18" r="14" fill="none" stroke="#3fb950" strokeWidth="3" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 14 * 0.96} ${2 * Math.PI * 14 * 0.04}`} transform="rotate(-90 18 18)" style={{ filter: "drop-shadow(0 0 3px #3fb950)" }} />
                    </svg>
                    <span className="text-[16px] font-bold text-[#3fb950] font-mono">96%</span>
                </div>
            </div>
        </div>
    );
}
