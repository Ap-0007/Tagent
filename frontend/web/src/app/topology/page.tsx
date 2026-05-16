export default function TopologyPage() {
    return (
        <div className="flex-1 overflow-y-auto scrollbar">
            <header className="px-6 py-5 border-b border-zinc-800/60">
                <h1 className="text-lg font-semibold text-zinc-100">Service Topology</h1>
                <p className="text-sm text-zinc-500 mt-0.5">Dependency graph with health status</p>
            </header>
            <div className="px-6 py-5">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-5">
                    <div className="flex gap-4 mb-4 text-[11px] text-zinc-500">
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400" />Healthy</span>
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400" />Degraded</span>
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400" />Unhealthy</span>
                    </div>
                    <svg viewBox="0 0 800 400" className="w-full" style={{ minWidth: 600 }}>
                        <Line x1={200} y1={100} x2={400} y2={60} /><Line x1={200} y1={100} x2={400} y2={180} />
                        <Line x1={400} y1={60} x2={600} y2={120} /><Line x1={400} y1={180} x2={600} y2={120} />
                        <Line x1={400} y1={180} x2={600} y2={260} /><Line x1={200} y1={300} x2={400} y2={340} />
                        <Node x={200} y={100} label="checkout-api" color="#ef4444" risk={82} />
                        <Node x={400} y={60} label="payment-service" color="#f59e0b" risk={64} />
                        <Node x={400} y={180} label="orders-api" color="#22c55e" risk={28} />
                        <Node x={600} y={120} label="postgres" color="#f59e0b" risk={71} />
                        <Node x={600} y={260} label="redis" color="#22c55e" risk={12} />
                        <Node x={200} y={300} label="notifications" color="#22c55e" risk={18} />
                        <Node x={400} y={340} label="kafka" color="#22c55e" risk={22} />
                    </svg>
                </div>
            </div>
        </div>
    );
}

function Line({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
    return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#27272a" strokeWidth={1.5} strokeDasharray="4 4" />;
}

function Node({ x, y, label, color, risk }: { x: number; y: number; label: string; color: string; risk: number }) {
    return (
        <g transform={`translate(${x},${y})`}>
            <circle r={22} fill="#09090b" stroke={color} strokeWidth={2} />
            <circle r={4} fill={color} />
            <text y={40} textAnchor="middle" fontSize={11} fill="#e4e4e7" fontFamily="var(--font-mono)">{label}</text>
            <text y={54} textAnchor="middle" fontSize={9} fill="#71717a" fontFamily="var(--font-mono)">risk {risk}</text>
        </g>
    );
}
