export default function ClustersPage() {
    return (
        <div className="flex-1 overflow-y-auto scrollbar">
            <header className="px-6 py-5 border-b border-zinc-800/60">
                <h1 className="text-lg font-semibold text-zinc-100">Clusters</h1>
            </header>
            <div className="px-6 py-5">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg overflow-hidden">
                    <table className="w-full text-[13px]">
                        <thead><tr className="border-b border-zinc-800 text-zinc-500 text-[11px] uppercase tracking-wider">
                            <th className="text-left px-5 py-2.5 font-medium">Name</th>
                            <th className="text-left px-3 py-2.5 font-medium">Region</th>
                            <th className="text-left px-3 py-2.5 font-medium">Version</th>
                            <th className="text-left px-3 py-2.5 font-medium">Nodes</th>
                            <th className="text-right px-5 py-2.5 font-medium">Status</th>
                        </tr></thead>
                        <tbody className="divide-y divide-zinc-800/50">
                            <Row name="production-eks" region="us-east-1" ver="1.30" nodes="6/6" status="healthy" />
                            <Row name="staging-eks" region="us-east-1" ver="1.30" nodes="3/3" status="healthy" />
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function Row({ name, region, ver, nodes, status }: { name: string; region: string; ver: string; nodes: string; status: string }) {
    return (
        <tr className="hover:bg-zinc-800/20 transition-colors">
            <td className="px-5 py-3 text-zinc-200 font-mono font-medium">{name}</td>
            <td className="px-3 py-3 text-zinc-500 text-[11px]">{region}</td>
            <td className="px-3 py-3 text-zinc-500 text-[11px]">{ver}</td>
            <td className="px-3 py-3 text-zinc-400 text-[11px] font-mono">{nodes}</td>
            <td className="px-5 py-3 text-right"><span className="text-emerald-400 text-[11px]">● {status}</span></td>
        </tr>
    );
}
