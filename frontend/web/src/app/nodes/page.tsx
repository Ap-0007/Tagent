import { Server, Cpu, HardDrive, MemoryStick, Globe, Lock } from "lucide-react";

const nodes = [
    { name: "ip-10-0-1-12", status: "Ready", role: "worker", zone: "us-east-1a", instance: "m5.xlarge", cpu: { used: "2.8", total: "4", pct: 70 }, mem: { used: "12.4Gi", total: "16Gi", pct: 77 }, disk: { used: "42Gi", total: "100Gi", pct: 42 }, pods: { running: 28, max: 58 }, network: "private", ip: "10.0.1.12", age: "45d", os: "Amazon Linux 2023", kernel: "6.1.82", kubelet: "v1.30.2", runtime: "containerd://1.7.11" },
    { name: "ip-10-0-2-8", status: "Ready", role: "worker", zone: "us-east-1b", instance: "m5.xlarge", cpu: { used: "3.1", total: "4", pct: 78 }, mem: { used: "13.8Gi", total: "16Gi", pct: 86 }, disk: { used: "56Gi", total: "100Gi", pct: 56 }, pods: { running: 34, max: 58 }, network: "private", ip: "10.0.2.8", age: "45d", os: "Amazon Linux 2023", kernel: "6.1.82", kubelet: "v1.30.2", runtime: "containerd://1.7.11" },
    { name: "ip-10-0-3-21", status: "NotReady", role: "worker", zone: "us-east-1c", instance: "m5.xlarge", cpu: { used: "0", total: "4", pct: 0 }, mem: { used: "0Gi", total: "16Gi", pct: 0 }, disk: { used: "91Gi", total: "100Gi", pct: 91 }, pods: { running: 0, max: 58 }, network: "private", ip: "10.0.3.21", age: "45d", os: "Amazon Linux 2023", kernel: "6.1.82", kubelet: "v1.30.2", runtime: "containerd://1.7.11" },
    { name: "ip-10-0-1-5", status: "Ready", role: "worker", zone: "us-east-1a", instance: "m5.large", cpu: { used: "1.2", total: "2", pct: 60 }, mem: { used: "5.8Gi", total: "8Gi", pct: 72 }, disk: { used: "28Gi", total: "50Gi", pct: 56 }, pods: { running: 18, max: 29 }, network: "private", ip: "10.0.1.5", age: "30d", os: "Amazon Linux 2023", kernel: "6.1.82", kubelet: "v1.30.2", runtime: "containerd://1.7.11" },
    { name: "ip-10-0-2-14", status: "Ready", role: "worker", zone: "us-east-1b", instance: "m5.large", cpu: { used: "0.9", total: "2", pct: 45 }, mem: { used: "4.2Gi", total: "8Gi", pct: 52 }, disk: { used: "22Gi", total: "50Gi", pct: 44 }, pods: { running: 14, max: 29 }, network: "private", ip: "10.0.2.14", age: "30d", os: "Amazon Linux 2023", kernel: "6.1.82", kubelet: "v1.30.2", runtime: "containerd://1.7.11" },
    { name: "ip-10-0-3-9", status: "Ready", role: "control-plane", zone: "us-east-1c", instance: "m5.large", cpu: { used: "0.6", total: "2", pct: 30 }, mem: { used: "3.1Gi", total: "8Gi", pct: 38 }, disk: { used: "18Gi", total: "50Gi", pct: 36 }, pods: { running: 12, max: 29 }, network: "public", ip: "54.210.33.12", age: "60d", os: "Amazon Linux 2023", kernel: "6.1.82", kubelet: "v1.30.2", runtime: "containerd://1.7.11" },
];

function Bar({ pct }: { pct: number }) {
    const color = pct > 85 ? "bg-red-500" : pct > 65 ? "bg-amber-500" : "bg-emerald-500";
    return (
        <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
        </div>
    );
}

export default function NodesPage() {
    const ready = nodes.filter((n) => n.status === "Ready").length;
    const totalCpu = nodes.reduce((a, n) => a + parseFloat(n.cpu.total), 0);
    const usedCpu = nodes.reduce((a, n) => a + parseFloat(n.cpu.used), 0);

    return (
        <div className="flex-1 overflow-y-auto scrollbar">
            <header className="px-6 py-5 border-b border-zinc-800/60">
                <h1 className="text-lg font-semibold text-zinc-100">Nodes</h1>
                <p className="text-sm text-zinc-500 mt-0.5">{ready}/{nodes.length} ready · {totalCpu} vCPUs total · {usedCpu.toFixed(1)} vCPUs used</p>
            </header>
            <div className="px-6 py-5 space-y-4">
                {nodes.map((n) => (
                    <div key={n.name} className={`bg-zinc-900/50 border rounded-lg p-5 ${n.status === "NotReady" ? "border-red-500/30" : "border-zinc-800"}`}>
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <Server className="w-5 h-5 text-zinc-400" />
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[14px] text-zinc-100 font-mono font-medium">{n.name}</span>
                                        <span className={`px-1.5 py-0.5 text-[9px] font-semibold uppercase rounded ${n.status === "Ready" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>{n.status}</span>
                                        <span className="px-1.5 py-0.5 text-[9px] font-medium uppercase rounded bg-zinc-800 text-zinc-400">{n.role}</span>
                                    </div>
                                    <p className="text-[11px] text-zinc-500 font-mono mt-0.5">{n.instance} · {n.zone} · age {n.age}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {n.network === "private" ? (
                                    <span className="flex items-center gap-1 text-[10px] text-zinc-500"><Lock className="w-3 h-3" />Private · {n.ip}</span>
                                ) : (
                                    <span className="flex items-center gap-1 text-[10px] text-emerald-400"><Globe className="w-3 h-3" />Public · {n.ip}</span>
                                )}
                            </div>
                        </div>

                        {/* Resources */}
                        <div className="grid grid-cols-4 gap-4">
                            <Resource icon={Cpu} label="CPU" used={n.cpu.used} total={`${n.cpu.total} cores`} pct={n.cpu.pct} />
                            <Resource icon={MemoryStick} label="Memory" used={n.mem.used} total={n.mem.total} pct={n.mem.pct} />
                            <Resource icon={HardDrive} label="Disk" used={n.disk.used} total={n.disk.total} pct={n.disk.pct} />
                            <div>
                                <div className="flex items-center gap-1.5 mb-1.5">
                                    <span className="text-[10px] text-zinc-500 uppercase font-medium">Pods</span>
                                </div>
                                <p className="text-[13px] text-zinc-200 font-mono">{n.pods.running}<span className="text-zinc-600">/{n.pods.max}</span></p>
                                <Bar pct={(n.pods.running / n.pods.max) * 100} />
                            </div>
                        </div>

                        {/* System info */}
                        <div className="mt-3 pt-3 border-t border-zinc-800/50 flex gap-6 text-[10px] text-zinc-500 font-mono">
                            <span>OS: {n.os}</span>
                            <span>Kernel: {n.kernel}</span>
                            <span>Kubelet: {n.kubelet}</span>
                            <span>Runtime: {n.runtime}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function Resource({ icon: Icon, label, used, total, pct }: { icon: any; label: string; used: string; total: string; pct: number }) {
    return (
        <div>
            <div className="flex items-center gap-1.5 mb-1.5">
                <Icon className="w-3 h-3 text-zinc-500" />
                <span className="text-[10px] text-zinc-500 uppercase font-medium">{label}</span>
            </div>
            <p className="text-[13px] text-zinc-200 font-mono">{used}<span className="text-zinc-600">/{total}</span></p>
            <Bar pct={pct} />
            <p className="text-[10px] text-zinc-500 mt-0.5">{pct}%</p>
        </div>
    );
}
