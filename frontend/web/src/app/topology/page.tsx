"use client";

import { useEffect, useMemo, useState } from "react";
import { getClusterState, type ClusterState } from "@/lib/api";
import { Loader2, WifiOff } from "lucide-react";

export default function TopologyPage() {
    const [state, setState] = useState<ClusterState | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const data = await getClusterState();
                setState(data);
                setError(null);
            } catch (e: any) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const nodes = useMemo(() => {
        const deployments = (state?.deployments || []).slice(0, 12);
        return deployments.map((d: any, i: number) => {
            const cols = 4;
            const x = 120 + (i % cols) * 180;
            const y = 90 + Math.floor(i / cols) * 120;
            const healthy = d.ready === d.replicas;
            return {
                id: `${d.namespace}/${d.name}`,
                x,
                y,
                label: d.name,
                color: healthy ? "#22c55e" : "#f59e0b",
                detail: `${d.ready}/${d.replicas} ready`,
            };
        });
    }, [state]);

    return (
        <div className="flex-1 overflow-y-auto scrollbar">
            <header className="px-6 py-5 border-b border-zinc-800/60">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-zinc-100">Service Topology</h1>
                        <p className="text-sm text-zinc-500 mt-0.5">Deployment health layout from live Discovery data</p>
                    </div>
                    {loading && <Loader2 className="w-4 h-4 text-zinc-500 animate-spin" />}
                    {error && <span className="flex items-center gap-1 text-[10px] text-amber-400"><WifiOff className="w-3 h-3" />offline</span>}
                </div>
            </header>
            <div className="px-6 py-5">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-5">
                    <div className="flex gap-4 mb-4 text-[11px] text-zinc-500">
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400" />Ready</span>
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400" />Degraded</span>
                    </div>
                    {nodes.length === 0 && !loading ? (
                        <div className="px-6 py-12 text-center text-sm text-zinc-500">
                            {error ? "Start Discovery Service and API Gateway to see topology." : "No deployments returned for topology."}
                        </div>
                    ) : (
                        <svg viewBox="0 0 800 420" className="w-full" style={{ minWidth: 600 }}>
                            {nodes.map((n, i) => i > 0 ? <Line key={`${n.id}-line`} x1={nodes[0].x} y1={nodes[0].y} x2={n.x} y2={n.y} /> : null)}
                            {nodes.map((n) => <Node key={n.id} x={n.x} y={n.y} label={n.label} color={n.color} detail={n.detail} />)}
                        </svg>
                    )}
                </div>
            </div>
        </div>
    );
}

function Line({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
    return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#27272a" strokeWidth={1.5} strokeDasharray="4 4" />;
}

function Node({ x, y, label, color, detail }: { x: number; y: number; label: string; color: string; detail: string }) {
    return (
        <g transform={`translate(${x},${y})`}>
            <circle r={22} fill="#09090b" stroke={color} strokeWidth={2} />
            <circle r={4} fill={color} />
            <text y={40} textAnchor="middle" fontSize={11} fill="#e4e4e7" fontFamily="var(--font-mono)">{label}</text>
            <text y={54} textAnchor="middle" fontSize={9} fill="#71717a" fontFamily="var(--font-mono)">{detail}</text>
        </g>
    );
}
