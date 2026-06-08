"use client";

import { useState } from "react";
import { Dropdown } from "@/components/workload/Dropdown";

// ─── Node Data ───────────────────────────────────────────────────────────────

interface NodeRow {
    name: string;
    role: "Worker" | "System";
    roleColor: string;
    statusDot: string;
    statusBadge: string;
    statusBadgeColor: string;
    instanceType: string;
    region: string;
    uptime: string;
    kubelet: string;
    cpu: { percent: number; spark: string; sparkColor: string };
    memory: { percent: number; usage: string; spark: string; sparkColor: string };
    disk: { read: string; readIops: string; write: string; writeIops: string };
    pods: { count: number; capacity: number };
    health: { score: number; label: string; description: string; color: string };
}

const NODES: NodeRow[] = [
    {
        name: "ip-10-0-1-23",
        role: "Worker", roleColor: "#58a6ff",
        statusDot: "#3fb950", statusBadge: "✓", statusBadgeColor: "#3fb950",
        instanceType: "m6i.4xlarge", region: "us-east-1a",
        uptime: "18d 6h 24m", kubelet: "v1.29.3",
        cpu: { percent: 42, spark: "0,16 12,14 24,15 36,12 48,13 60,10 72,11 84,8 96,9", sparkColor: "#3fb950" },
        memory: { percent: 68, usage: "21.8 / 32 GB", spark: "0,14 12,12 24,13 36,11 48,12 60,10 72,11 84,9 96,10", sparkColor: "#a371f7" },
        disk: { read: "1.2k", readIops: "98 Mbps", write: "870", writeIops: "Write IOPS" },
        pods: { count: 32, capacity: 80 },
        health: { score: 96, label: "Excellent", description: "Node is healthy and performing optimally.", color: "#3fb950" },
    },
    {
        name: "ip-10-0-2-15",
        role: "Worker", roleColor: "#58a6ff",
        statusDot: "#f0883e", statusBadge: "!", statusBadgeColor: "#f0883e",
        instanceType: "m6i.4xlarge", region: "us-east-1b",
        uptime: "12d 3h 11m", kubelet: "v1.29.3",
        cpu: { percent: 78, spark: "0,12 12,10 24,11 36,8 48,9 60,6 72,7 84,4 96,5", sparkColor: "#f0883e" },
        memory: { percent: 82, usage: "26.3 / 32 GB", spark: "0,10 12,9 24,10 36,7 48,8 60,5 72,6 84,3 96,4", sparkColor: "#f85149" },
        disk: { read: "2.8k", readIops: "150 Mbps", write: "1.9k", writeIops: "Write IOPS" },
        pods: { count: 38, capacity: 95 },
        health: { score: 72, label: "Warning", description: "High CPU usage identified.", color: "#f0883e" },
    },
    {
        name: "ip-10-0-3-47",
        role: "System", roleColor: "#a371f7",
        statusDot: "#3fb950", statusBadge: "✓", statusBadgeColor: "#3fb950",
        instanceType: "m6i.2xlarge", region: "eu-central-1a",
        uptime: "25d 14h 9m", kubelet: "v1.29.3",
        cpu: { percent: 24, spark: "0,17 12,16 24,17 36,15 48,16 60,14 72,15 84,13 96,14", sparkColor: "#3fb950" },
        memory: { percent: 45, usage: "14.2 / 32 GB", spark: "0,14 12,13 24,14 36,12 48,13 60,11 72,12 84,10 96,11", sparkColor: "#3fb950" },
        disk: { read: "78", readIops: "64 Mbps", write: "420", writeIops: "Write IOPS" },
        pods: { count: 18, capacity: 45 },
        health: { score: 91, label: "Excellent", description: "Stable node with low resource usage.", color: "#3fb950" },
    },
];

// ─── Component ───────────────────────────────────────────────────────────────

export function KubernetesNodesTable() {
    const [search, setSearch] = useState("");
    const [region, setRegion] = useState("all");
    const [status, setStatus] = useState("all");
    const [role, setRole] = useState("all");
    const [view, setView] = useState<"list" | "grid">("list");

    const filtered = NODES.filter(n => {
        if (search && !n.name.toLowerCase().includes(search.toLowerCase())) return false;
        if (region !== "all" && n.region !== region) return false;
        if (status !== "all" && n.statusBadgeColor !== (status === "healthy" ? "#3fb950" : status === "warning" ? "#f0883e" : "#f85149")) return false;
        if (role !== "all" && n.role.toLowerCase() !== role) return false;
        return true;
    });

    return (
        <div className="rounded-[12px] border border-[#21262d] bg-[#161b22] p-3.5">
            {/* Header + Filters */}
            <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
                <h3 className="text-[14px] font-semibold text-[#e6edf3]">Kubernetes Nodes</h3>
                <div className="flex items-center gap-1.5 flex-wrap">
                    <div className="relative">
                        <svg className="absolute left-2.5 top-1/2 -translate-y-1/2" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6e7681" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search nodes..."
                            className="w-[160px] h-7 pl-8 pr-3 rounded-md bg-[#0d1117] border border-[#30363d] text-[11px] text-[#e6edf3] placeholder:text-[#6e7681] focus:outline-none focus:border-[#58a6ff]/50"
                        />
                    </div>
                    <Dropdown
                        label="All Regions"
                        value={region}
                        options={[
                            { value: "all", label: "All Regions" },
                            { value: "us-east-1a", label: "us-east-1a" },
                            { value: "us-east-1b", label: "us-east-1b" },
                            { value: "eu-central-1a", label: "eu-central-1a" },
                        ]}
                        onChange={setRegion}
                        width={160}
                    />
                    <Dropdown
                        label="All Status"
                        value={status}
                        options={[
                            { value: "all", label: "All Status" },
                            { value: "healthy", label: "Healthy" },
                            { value: "warning", label: "Warning" },
                            { value: "critical", label: "Critical" },
                        ]}
                        onChange={setStatus}
                        width={150}
                    />
                    <Dropdown
                        label="All Roles"
                        value={role}
                        options={[
                            { value: "all", label: "All Roles" },
                            { value: "worker", label: "Worker" },
                            { value: "system", label: "System" },
                        ]}
                        onChange={setRole}
                        width={140}
                    />
                    <button className="flex items-center gap-1 h-7 px-2.5 rounded-md bg-[#0d1117] border border-[#30363d] text-[11px] text-[#8b949e] hover:text-[#e6edf3] hover:border-[#484f58] transition-colors">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="3" y1="6" x2="21" y2="6" />
                            <line x1="3" y1="12" x2="21" y2="12" />
                            <line x1="3" y1="18" x2="21" y2="18" />
                        </svg>
                        Columns
                        <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                    <div className="flex items-center gap-0.5 p-0.5 rounded-md bg-[#0d1117] border border-[#30363d]">
                        <button
                            onClick={() => setView("list")}
                            title="List view"
                            className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${view === "list" ? "bg-[#1f6feb]/20 text-[#58a6ff]" : "text-[#6e7681] hover:text-[#e6edf3]"}`}
                        >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="8" y1="6" x2="21" y2="6" />
                                <line x1="8" y1="12" x2="21" y2="12" />
                                <line x1="8" y1="18" x2="21" y2="18" />
                                <line x1="3" y1="6" x2="3.01" y2="6" />
                                <line x1="3" y1="12" x2="3.01" y2="12" />
                                <line x1="3" y1="18" x2="3.01" y2="18" />
                            </svg>
                        </button>
                        <button
                            onClick={() => setView("grid")}
                            title="Grid view"
                            className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${view === "grid" ? "bg-[#1f6feb]/20 text-[#58a6ff]" : "text-[#6e7681] hover:text-[#e6edf3]"}`}
                        >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="7" height="7" />
                                <rect x="14" y="3" width="7" height="7" />
                                <rect x="3" y="14" width="7" height="7" />
                                <rect x="14" y="14" width="7" height="7" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                    <thead>
                        <tr className="border-b border-[#21262d]">
                            <Th>Node</Th>
                            <Th>Role &amp; Info</Th>
                            <Th>CPU</Th>
                            <Th>Memory</Th>
                            <Th>Disk I/O</Th>
                            <Th>Pods</Th>
                            <Th>Health &amp; AI Analysis</Th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((n, i) => (
                            <NodeTableRow key={n.name} node={n} isLast={i === filtered.length - 1} />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function Th({ children }: { children: React.ReactNode }) {
    return <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-[#8b949e]">{children}</th>;
}

// ─── Node Row ────────────────────────────────────────────────────────────────

function NodeTableRow({ node, isLast }: { node: NodeRow; isLast: boolean }) {
    return (
        <tr className={`hover:bg-white/[0.025] transition-colors ${!isLast ? "border-b border-[#21262d]" : ""}`}>
            {/* Node */}
            <td className="px-3 py-3">
                <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: node.statusDot, boxShadow: `0 0 4px ${node.statusDot}` }} />
                    <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                            <p className="text-[12px] font-mono font-semibold text-[#58a6ff]">{node.name}</p>
                            <span className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold" style={{ background: node.statusBadgeColor, color: "#0a0e15" }}>
                                {node.statusBadge}
                            </span>
                        </div>
                        <p className="text-[10px] text-[#8b949e] mt-0.5">{node.role} Node</p>
                    </div>
                </div>
            </td>
            {/* Role & Info */}
            <td className="px-3 py-3">
                <div className="flex flex-col gap-0.5">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold w-fit" style={{ background: `${node.roleColor}20`, color: node.roleColor, border: `1px solid ${node.roleColor}40` }}>
                        {node.role}
                    </span>
                    <p className="text-[10.5px] text-[#8b949e] mt-1">
                        Uptime <span className="text-[#e6edf3] font-mono ml-1">{node.uptime}</span>
                    </p>
                    <p className="text-[10.5px] text-[#8b949e]">
                        K8s <span className="text-[#e6edf3] font-mono ml-1">{node.kubelet}</span>
                    </p>
                </div>
            </td>
            {/* CPU */}
            <td className="px-3 py-3">
                <div className="flex items-center gap-2.5">
                    <PercentDonut value={node.cpu.percent} color={node.cpu.sparkColor} />
                    <Sparkline points={node.cpu.spark} color={node.cpu.sparkColor} width={70} />
                </div>
            </td>
            {/* Memory */}
            <td className="px-3 py-3">
                <div className="flex items-center gap-2.5">
                    <PercentDonut value={node.memory.percent} color={node.memory.sparkColor} />
                    <div className="flex flex-col">
                        <Sparkline points={node.memory.spark} color={node.memory.sparkColor} width={70} />
                        <p className="text-[9.5px] text-[#8b949e] font-mono mt-0.5">{node.memory.usage}</p>
                    </div>
                </div>
            </td>
            {/* Disk I/O */}
            <td className="px-3 py-3">
                <div className="text-[10.5px] font-mono">
                    <p><span className="text-[#3fb950] font-semibold">↓ {node.disk.read}</span> <span className="text-[#8b949e]">{node.disk.readIops}</span></p>
                    <p className="mt-0.5"><span className="text-[#58a6ff] font-semibold">↑ {node.disk.write}</span> <span className="text-[#8b949e]">Write IOPS</span></p>
                </div>
            </td>
            {/* Pods */}
            <td className="px-3 py-3">
                <p className="text-[16px] font-bold text-[#e6edf3] leading-none">{node.pods.count}</p>
                <p className="text-[9.5px] text-[#8b949e] mt-0.5">Pods</p>
                <p className="text-[10.5px] font-semibold text-[#3fb950] mt-1">{node.pods.capacity}%</p>
                <p className="text-[9.5px] text-[#8b949e]">Capacity</p>
            </td>
            {/* Health & AI Analysis */}
            <td className="px-3 py-3">
                <div className="flex items-center gap-2.5">
                    <HealthCircle score={node.health.score} color={node.health.color} />
                    <div className="min-w-0">
                        <p className="text-[12px] font-semibold" style={{ color: node.health.color }}>{node.health.label}</p>
                        <p className="text-[10px] text-[#8b949e] leading-snug">{node.health.description}</p>
                    </div>
                </div>
            </td>
        </tr>
    );
}

// ─── Percent Donut ───────────────────────────────────────────────────────────

function PercentDonut({ value, color }: { value: number; color: string }) {
    const r = 18;
    const c = 2 * Math.PI * r;
    const offset = c - (value / 100) * c;
    return (
        <div className="relative shrink-0">
            <svg width="44" height="44" viewBox="0 0 44 44">
                <circle cx="22" cy="22" r={r} fill="none" stroke="#21262d" strokeWidth="3" />
                <circle
                    cx="22" cy="22" r={r}
                    fill="none"
                    stroke={color}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={c}
                    strokeDashoffset={offset}
                    transform="rotate(-90 22 22)"
                    style={{ filter: `drop-shadow(0 0 3px ${color}80)` }}
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10.5px] font-bold font-mono" style={{ color }}>{value}%</span>
            </div>
        </div>
    );
}

function HealthCircle({ score, color }: { score: number; color: string }) {
    return (
        <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-[11.5px] font-bold font-mono shrink-0"
            style={{
                border: `2px solid ${color}`,
                color,
                background: `${color}10`,
                boxShadow: `0 0 8px ${color}40`,
            }}
        >
            {score}
        </div>
    );
}

function Sparkline({ points, color, width = 96 }: { points: string; color: string; width?: number }) {
    const id = color.replace("#", "") + "-tl";
    return (
        <svg width={width} height="22" viewBox="0 0 96 20" preserveAspectRatio="none" className="shrink-0">
            <defs>
                <linearGradient id={`gn-${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={color} stopOpacity="0.35" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <polygon points={`${points} 96,20 0,20`} fill={`url(#gn-${id})`} />
            <polyline points={points} fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}
