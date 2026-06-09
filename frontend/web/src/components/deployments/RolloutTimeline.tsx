"use client";

import { useEffect, useState } from "react";
import { getDeployments, DeploymentInfo } from "@/lib/api";

interface Step {
    label: string;
    time: string;
    desc: string;
    color: string;
    done: boolean;
}

function deriveSteps(deployment: DeploymentInfo): Step[] {
    const { name, replicas, ready, available } = deployment;
    const now = new Date();
    const fmt = (offset: number) => {
        const d = new Date(now.getTime() - offset * 60000);
        return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    };

    const created = true;
    const rolloutStarted = replicas > 0;
    const replicaUpdated = ready > 0;
    const readinessAchieved = ready === replicas && replicas > 0;
    const stabilized = available === replicas && replicas > 0;

    return [
        {
            label: "Created",
            time: fmt(5),
            desc: `Deployment created. Name: ${name}`,
            color: "#58a6ff",
            done: created,
        },
        {
            label: "Rollout Started",
            time: fmt(4),
            desc: `Rolling update started. Strategy: RollingUpdate. Replicas: ${replicas}`,
            color: "#22d3ee",
            done: rolloutStarted,
        },
        {
            label: "Replica Updated",
            time: fmt(3),
            desc: `Pods updated. ${ready}/${replicas} replicas ready.`,
            color: "#a371f7",
            done: replicaUpdated,
        },
        {
            label: "Readiness Achieved",
            time: fmt(2),
            desc: readinessAchieved
                ? `All pods ready. Available: ${available}/${replicas}. Probes passed.`
                : `Waiting for readiness. Ready: ${ready}/${replicas}`,
            color: "#3fb950",
            done: readinessAchieved,
        },
        {
            label: "Stabilized",
            time: fmt(0),
            desc: stabilized
                ? `Deployment stable. All ${replicas} replicas available.`
                : `Stabilizing... Available: ${available}/${replicas}`,
            color: "#3fb950",
            done: stabilized,
        },
    ];
}

export function RolloutTimeline() {
    const [steps, setSteps] = useState<Step[] | null>(null);

    useEffect(() => {
        function fetchData() {
            getDeployments()
                .then((data) => {
                    if (data.length > 0) {
                        setSteps(deriveSteps(data[0]));
                    } else {
                        setSteps([]);
                    }
                })
                .catch(() => setSteps([]));
        }
        fetchData();
        const interval = setInterval(fetchData, 15000);
        return () => clearInterval(interval);
    }, []);

    const items = steps ?? [];

    return (
        <div className="rounded-[12px] border border-[#21262d] bg-[#161b22] p-3.5">
            <div className="flex items-center gap-2.5 mb-3">
                <h3 className="text-[13px] font-semibold text-[#e6edf3]">Rollout Timeline</h3>
                <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#3fb950]/10 border border-[#3fb950]/30">
                    <span className="w-1 h-1 rounded-full bg-[#3fb950]" style={{ boxShadow: "0 0 4px #3fb950", animation: "wi-pulse 2s infinite" }} />
                    <span className="text-[9px] text-[#3fb950] font-semibold">Live</span>
                </div>
            </div>

            {steps === null && (
                <div className="py-4 text-center">
                    <p className="text-[11px] text-[#8b949e]">—</p>
                </div>
            )}

            {steps !== null && items.length === 0 && (
                <div className="py-4 text-center">
                    <p className="text-[11px] text-[#8b949e]">No deployments found</p>
                </div>
            )}

            {items.length > 0 && (
                <>
                    {/* Horizontal step indicators */}
                    <div className="flex items-center gap-1 mb-3 overflow-x-auto pb-1">
                        {items.map((s, i) => (
                            <div key={i} className="flex items-center gap-1 shrink-0">
                                <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: s.done ? `${s.color}20` : "#21262d20", border: `2px solid ${s.done ? s.color : "#30363d"}` }}>
                                    {s.done ? (
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    ) : (
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#30363d" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="4" />
                                        </svg>
                                    )}
                                </div>
                                {i < items.length - 1 && <div className="w-6 h-0.5 rounded-full" style={{ background: s.done ? s.color : "#30363d", opacity: 0.5 }} />}
                            </div>
                        ))}
                    </div>

                    {/* Step details */}
                    <div className="space-y-2">
                        {items.map((s, i) => (
                            <div key={i} className="flex items-start gap-2">
                                <span className="text-[9px] text-[#6e7681] font-mono w-12 shrink-0 mt-0.5">{s.time}</span>
                                <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: s.done ? s.color : "#30363d" }} />
                                <div>
                                    <p className="text-[10.5px] font-semibold" style={{ color: s.done ? s.color : "#6e7681" }}>{s.label}</p>
                                    <p className="text-[9.5px] text-[#8b949e] leading-snug">{s.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
