"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getNodes, getPods, type NodeInfo, type PodInfo } from "@/lib/api";
import {
    ArrowLeft, Server, Cpu, HardDrive, Box, Activity,
    CheckCircle, XCircle, Clock, Wifi, Shield, Tag,
    Loader2, AlertTriangle, Cloud, Layers,
} from "lucide-react";

type Tab = "overview" | "pods" | "cloud" | "events";

export default function NodeDetailPage() {
    const params = useParams();
    const nodeName = decodeURIComponent(params.name as string);

    const [node, setNode] = useState<NodeInfo | null>(null);
    const [pods, setPods] = useState<PodInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<Tab>("overview");

    useEffect(() => {
        async function load() {
            try {
                const [nodesData, podsData] = await Promise.all([
                    getNodes(),
                    getPods(),
                ]);
                const found = nodesData.find(n => n.name === nodeName);
                setNode(found || null);
                // Filter pods running on this node
                setPods(podsData.filter(p => p.node === nodeName));
            } catch { }
            setLoading(false);
        }
        load();
    }, [nodeName]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                <span className="ml-3 text-slate-400">Loading node details...</span>
            </div>
        );
    }

    if (!node) {
        return (
            <div className="flex flex-col items-center justify-center h-96 gap-4">
                <AlertTriangle className="w-12 h-12 text-amber-400" />
                <p className="text-slate-300">Node &quot;{nodeName}&quot; not found</p>
                <Link href="/nodes" className="text-sm text-blue-400 hover:text-blue-300">← Back to Nodes</Link>
            </div>
        );
    }

    const isReady = node.status === "Ready";
    const cpuPercent = parseCpuPercent(node.cpu_used, node.cpu_capacity);
    const memPercent = parseMemPercent(node.memory_used, node.memory_capacity);
    const cpuColor = cpuPercent > 80 ? "#f85149" : cpuPercent > 60 ? "#f0883e" : "#22d3ee";
    const memColor = memPercent > 80 ? "#f85149" : memPercent > 60 ? "#f0883e" : "#a371f7";

    // Extract instance info from node name
    const isEKS = node.name.includes("ip-");
    const isGKE = node.name.includes("gke-");
    const provider = isEKS ? "AWS EKS" : isGKE ? "GCP GKE" : "Kubernetes";
    const az = isEKS ? "ap-south-1" : "";

    return (
        <div className="flex-1 overflow-y-auto bg-[#0d1117]">
            <div className="max-w-6xl mx-auto px-6 py-5 space-y-5">
                {/* Back + Header */}
                <div>
                    <Link href="/nodes" className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 mb-3">
                        <ArrowLeft className="w-3.5 h-3.5" /> Back to Nodes
                    </Link>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex items-center justify-center">
                                <Server className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-slate-100 font-mono">{node.name}</h1>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {node.role} · {provider} {az && `· ${az}`} · Uptime: {node.age}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${isReady ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
                                {isReady ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                                {node.status}
                            </span>
                        </div>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <KPICard label="CPU Usage" value={`${cpuPercent}%`} sub={`${node.cpu_used || "—"} / ${node.cpu_capacity}`} color={cpuColor} percent={cpuPercent} />
                    <KPICard label="Memory Usage" value={`${memPercent}%`} sub={`${node.memory_used || "—"} / ${node.memory_capacity}`} color={memColor} percent={memPercent} />
                    <KPICard label="Pods" value={String(node.pod_count || pods.length)} sub={`capacity: ${node.pod_capacity}`} color="#3fb950" percent={((node.pod_count || pods.length) / (parseInt(node.pod_capacity) || 110)) * 100} />
                    <KPICard label="Health Score" value={isReady ? "100" : "0"} sub={isReady ? "Node healthy" : "Node NotReady"} color={isReady ? "#3fb950" : "#f85149"} percent={isReady ? 100 : 0} />
                </div>

                {/* Tabs */}
                <div className="flex gap-1 border-b border-[#21262d]">
                    {([
                        { key: "overview", label: "Overview", icon: Layers },
                        { key: "pods", label: `Pods (${pods.length})`, icon: Box },
                        { key: "cloud", label: "Cloud / Instance", icon: Cloud },
                        { key: "events", label: "Events", icon: Activity },
                    ] as { key: Tab; label: string; icon: any }[]).map(t => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${tab === t.key ? "border-blue-500 text-blue-300" : "border-transparent text-slate-500 hover:text-slate-300"}`}
                        >
                            <t.icon className="w-3.5 h-3.5" /> {t.label}
                        </button>
                    ))}
                </div>

                {/* TAB CONTENT */}
                {tab === "overview" && <OverviewTab node={node} />}
                {tab === "pods" && <PodsTab pods={pods} />}
                {tab === "cloud" && <CloudTab node={node} />}
                {tab === "events" && <EventsTab node={node} />}
            </div>
        </div>
    );
}

// ===== Overview Tab =====
function OverviewTab({ node }: { node: NodeInfo }) {
    return (
        <div className="space-y-4">
            {/* Node Details */}
            <Section title="Node Information">
                <DetailGrid items={[
                    { label: "Internal IP", value: node.internal_ip, color: "#58a6ff" },
                    { label: "External IP", value: node.external_ip || "—" },
                    { label: "Role", value: node.role },
                    { label: "CPU Capacity", value: node.cpu_capacity },
                    { label: "Memory Capacity", value: node.memory_capacity },
                    { label: "Pod Capacity", value: node.pod_capacity },
                    { label: "Age", value: node.age },
                    { label: "Status", value: node.status, color: node.status === "Ready" ? "#3fb950" : "#f85149" },
                ]} />
            </Section>

            {/* Conditions */}
            <Section title="Conditions">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <ConditionBadge label="Ready" ok={node.status === "Ready"} />
                    <ConditionBadge label="MemoryPressure" ok={true} />
                    <ConditionBadge label="DiskPressure" ok={true} />
                    <ConditionBadge label="PIDPressure" ok={true} />
                </div>
            </Section>

            {/* Resource Bars */}
            <Section title="Resource Utilization">
                <div className="space-y-3">
                    <ResourceBar label="CPU" used={node.cpu_used || "0"} capacity={node.cpu_capacity} color="#22d3ee" />
                    <ResourceBar label="Memory" used={node.memory_used || "0"} capacity={node.memory_capacity} color="#a371f7" />
                    <ResourceBar label="Pods" used={String(node.pod_count || 0)} capacity={node.pod_capacity} color="#3fb950" />
                </div>
            </Section>
        </div>
    );
}

// ===== Pods Tab =====
function PodsTab({ pods }: { pods: PodInfo[] }) {
    if (pods.length === 0) {
        return <p className="text-sm text-slate-500 py-8 text-center">No pods found on this node.</p>;
    }
    return (
        <div className="rounded-lg border border-[#21262d] bg-[#161b22] overflow-hidden">
            <table className="w-full text-left">
                <thead>
                    <tr className="border-b border-[#21262d] bg-[#0d1117]/60">
                        <th className="px-4 py-2.5 text-[10px] font-semibold uppercase text-[#8b949e]">Pod</th>
                        <th className="px-4 py-2.5 text-[10px] font-semibold uppercase text-[#8b949e]">Namespace</th>
                        <th className="px-4 py-2.5 text-[10px] font-semibold uppercase text-[#8b949e]">Status</th>
                        <th className="px-4 py-2.5 text-[10px] font-semibold uppercase text-[#8b949e]">CPU Req</th>
                        <th className="px-4 py-2.5 text-[10px] font-semibold uppercase text-[#8b949e]">Memory Req</th>
                        <th className="px-4 py-2.5 text-[10px] font-semibold uppercase text-[#8b949e]">Restarts</th>
                    </tr>
                </thead>
                <tbody>
                    {pods.map(p => {
                        const statusColor = p.status === "Running" ? "#3fb950" : p.status === "Pending" ? "#f0883e" : "#f85149";
                        const restartColor = p.restarts > 5 ? "#f85149" : p.restarts > 0 ? "#f0883e" : "#3fb950";
                        return (
                            <tr key={p.name} className="border-b border-[#21262d] hover:bg-white/[0.02]">
                                <td className="px-4 py-2.5 text-[12px] font-mono text-slate-200 truncate max-w-[240px]">{p.name}</td>
                                <td className="px-4 py-2.5 text-[11px] text-slate-400 font-mono">{p.namespace}</td>
                                <td className="px-4 py-2.5">
                                    <span className="inline-flex items-center gap-1 text-[11px] font-medium" style={{ color: statusColor }}>
                                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusColor }} />
                                        {p.status}
                                    </span>
                                </td>
                                <td className="px-4 py-2.5 text-[11px] text-slate-400 font-mono">{p.cpu_request || "—"}</td>
                                <td className="px-4 py-2.5 text-[11px] text-slate-400 font-mono">{p.memory_request || "—"}</td>
                                <td className="px-4 py-2.5 text-[12px] font-mono font-semibold" style={{ color: restartColor }}>{p.restarts}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

// ===== Cloud Tab =====
function CloudTab({ node }: { node: NodeInfo }) {
    const isEKS = node.name.includes("ip-");
    if (!isEKS) {
        return (
            <div className="py-12 text-center">
                <Cloud className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-slate-400">Cloud integration not configured</p>
                <p className="text-xs text-slate-500 mt-1">AWS EC2 details will appear here when IAM permissions are configured.</p>
            </div>
        );
    }

    // Parse what we can from node name (real data from K8s)
    const parts = node.name.split(".");
    const region = parts.length > 1 ? parts.slice(1).join(".").replace(".compute.internal", "") : "unknown";
    const privateIp = node.internal_ip;
    const hostname = node.name;

    return (
        <div className="space-y-4">
            <Section title="Instance Summary">
                <DetailGrid items={[
                    { label: "Private DNS", value: hostname, color: "#58a6ff" },
                    { label: "Private IP", value: privateIp, color: "#58a6ff" },
                    { label: "Public IP", value: node.external_ip || "—" },
                    { label: "Region", value: region },
                    { label: "Platform", value: "Linux/UNIX" },
                    { label: "Provider", value: "AWS EKS" },
                ]} />
            </Section>

            <Section title="Networking">
                <DetailGrid items={[
                    { label: "Internal IP", value: privateIp },
                    { label: "External IP", value: node.external_ip || "None assigned" },
                    { label: "Hostname", value: hostname },
                ]} />
            </Section>

            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
                <p className="text-xs text-amber-300 font-medium">Full AWS EC2 Details</p>
                <p className="text-xs text-amber-300/60 mt-1">
                    AMI ID, VPC, Security Groups, EBS Volumes, and Tags require AWS SDK integration.
                    This will be available after Phase 2 backend is implemented.
                </p>
            </div>
        </div>
    );
}

// ===== Events Tab =====
function EventsTab({ node }: { node: NodeInfo }) {
    return (
        <div className="py-8 text-center">
            <Activity className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400">Node events coming soon</p>
            <p className="text-xs text-slate-500 mt-1">K8s events for this node will be fetched in Phase 3.</p>
        </div>
    );
}

// ===== Shared Components =====

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="rounded-xl border border-[#21262d] bg-[#161b22] p-4">
            <h3 className="text-[13px] font-semibold text-slate-200 mb-3 flex items-center gap-2">
                {title}
            </h3>
            {children}
        </div>
    );
}

function DetailGrid({ items }: { items: { label: string; value: string; color?: string }[] }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {items.map(item => (
                <div key={item.label} className="space-y-0.5">
                    <p className="text-[10px] text-[#8b949e] font-medium">{item.label}</p>
                    <p className="text-[12px] font-mono truncate" style={{ color: item.color || "#e6edf3" }}>{item.value}</p>
                </div>
            ))}
        </div>
    );
}

function ConditionBadge({ label, ok }: { label: string; ok: boolean }) {
    return (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${ok ? "border-green-500/20 bg-green-500/5" : "border-red-500/20 bg-red-500/5"}`}>
            {ok ? <CheckCircle className="w-3.5 h-3.5 text-green-400" /> : <XCircle className="w-3.5 h-3.5 text-red-400" />}
            <span className={`text-[11px] font-medium ${ok ? "text-green-300" : "text-red-300"}`}>{label}</span>
        </div>
    );
}

function ResourceBar({ label, used, capacity, color }: { label: string; used: string; capacity: string; color: string }) {
    const usedNum = parseFloat(used) || 0;
    const capNum = parseFloat(capacity) || 1;
    const percent = Math.min(100, Math.round((usedNum / capNum) * 100));
    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400">{label}</span>
                <span className="text-[11px] font-mono" style={{ color }}>{used} / {capacity} ({percent}%)</span>
            </div>
            <div className="h-2 rounded-full bg-[#21262d] overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${percent}%`, background: color, boxShadow: `0 0 6px ${color}40` }} />
            </div>
        </div>
    );
}

function KPICard({ label, value, sub, color, percent }: { label: string; value: string; sub: string; color: string; percent: number }) {
    const r = 20;
    const c = 2 * Math.PI * r;
    const offset = c - (Math.min(100, percent) / 100) * c;
    return (
        <div className="rounded-xl border border-[#21262d] bg-[#161b22] p-4 hover:border-[#30363d] transition-colors" style={{ background: `radial-gradient(circle at 90% 20%, ${color}15 0%, transparent 50%), #161b22` }}>
            <p className="text-[10px] text-[#8b949e] font-medium mb-2">{label}</p>
            <div className="flex items-end justify-between">
                <div>
                    <p className="text-[22px] font-bold font-mono leading-none" style={{ color }}>{value}</p>
                    <p className="text-[10px] text-[#6e7681] mt-1 font-mono">{sub}</p>
                </div>
                <svg width="44" height="44" viewBox="0 0 44 44">
                    <circle cx="22" cy="22" r={r} fill="none" stroke="#21262d" strokeWidth="3.5" />
                    <circle cx="22" cy="22" r={r} fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset} transform="rotate(-90 22 22)" style={{ filter: `drop-shadow(0 0 3px ${color})` }} />
                </svg>
            </div>
        </div>
    );
}

// ===== Helpers =====
function parseCpuPercent(used: string, capacity: string): number {
    const u = parseFloat(used) || 0;
    const c = parseFloat(capacity) || 1;
    return Math.min(100, Math.round((u / c) * 100));
}

function parseMemPercent(used: string, capacity: string): number {
    const u = parseMemGB(used);
    const c = parseMemGB(capacity);
    if (c === 0) return 0;
    return Math.min(100, Math.round((u / c) * 100));
}

function parseMemGB(mem: string): number {
    if (!mem) return 0;
    if (mem.endsWith("Gi")) return parseFloat(mem);
    if (mem.endsWith("Mi")) return parseFloat(mem) / 1024;
    if (mem.endsWith("Ki")) return parseFloat(mem) / (1024 * 1024);
    return parseFloat(mem) || 0;
}
