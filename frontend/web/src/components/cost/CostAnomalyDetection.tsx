"use client";

const ANOMALIES = [
    { title: "Cluster spend increased", sub: "Production-us-east-1", change: "↑ 18%", period: "vs last 7d", rootCause: "Node autoscaling due to traffic spike", confidence: 95, cost: "$2,120", color: "#f85149" },
    { title: "AI workload cost surge", sub: "tagent-ai-engine", change: "↑ 42%", period: "vs last 24h", rootCause: "Extended inference workload", confidence: 91, cost: "$1,780", color: "#f0883e" },
    { title: "Unexpected network egress", sub: "us-west-2", change: "↑ 27%", period: "vs last 7d", rootCause: "High external API data transfer", confidence: 90, cost: "$620", color: "#f0883e" },
];

export function CostAnomalyDetection() {
    return (
        <div className="rounded-[12px] border border-[#21262d] bg-[#161b22] p-3.5">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-semibold text-[#e6edf3]">Cost Anomaly Detection</h3>
                <button className="text-[10px] text-[#58a6ff]">View all</button>
            </div>
            <div className="space-y-2.5">
                {ANOMALIES.map((a, i) => (
                    <div key={i} className="rounded-md bg-[#0d1117] border border-[#21262d] p-2.5">
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                            <div className="flex items-start gap-2">
                                <span className="w-2 h-2 rounded-full mt-1 shrink-0" style={{ background: a.color, boxShadow: `0 0 4px ${a.color}` }} />
                                <div>
                                    <p className="text-[11px] font-semibold text-[#e6edf3]">{a.title}</p>
                                    <p className="text-[10px] text-[#8b949e]">{a.sub}</p>
                                </div>
                            </div>
                            <div className="text-right shrink-0">
                                <p className="text-[14px] font-bold text-[#e6edf3] font-mono">{a.cost}</p>
                                <p className="text-[9px] text-[#8b949e] font-mono">Impact</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between text-[10px]">
                            <span style={{ color: a.color }} className="font-semibold">{a.change} <span className="text-[#8b949e] font-normal">{a.period}</span></span>
                            <span className="text-[#8b949e]">{a.confidence}% <span className="text-[#6e7681]">Confidence</span></span>
                        </div>
                        <p className="text-[10px] text-[#8b949e] mt-1.5 border-t border-[#21262d] pt-1.5">Root cause: <span className="text-[#e6edf3]">{a.rootCause}</span></p>
                    </div>
                ))}
            </div>
        </div>
    );
}
