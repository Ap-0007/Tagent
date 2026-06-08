"use client";

import { useState } from "react";
import { Dropdown, MultiSelectDropdown } from "./Dropdown";

// ─── Pod Data ────────────────────────────────────────────────────────────────

interface Pod {
    name: string;
    type: string;
    namespace: string;
    status: "Running" | "Pending" | "Restarting";
    cpu: { percent: string; cores: string; spark: number[]; color: string };
    memory: { percent: string; size: string; spark: number[]; color: string };
    restarts: { count: number; bars: number[]; color: string };
    healthScore: number;
    risk: "Low" | "Medium" | "High" | "Critical";
    aiAnalysis: { text: string; color: string; confidence: number; icon?: "refresh" };
}

const PODS: Pod[] = [
    {
        name: "api-gateway-7d5f9c8d6f-2k8li",
        type: "Deployment",
        namespace: "default",
        status: "Running",
        cpu: { percent: "82%", cores: "1.2 cores", spark: [4, 6, 5, 8, 7, 10, 9, 12, 11, 13], color: "#3fb950" },
        memory: { percent: "72%", size: "1.3 GiB", spark: [8, 8, 9, 8, 9, 9, 8, 9, 9, 10], color: "#3fb950" },
        restarts: { count: 0, bars: [3, 5, 4, 6, 5, 7, 6, 8], color: "#3fb950" },
        healthScore: 96,
        risk: "Low",
        aiAnalysis: { text: "Stable ↑", color: "#3fb950", confidence: 96 },
    },
    {
        name: "user-service-5b7d6f9c7f-xm3le",
        type: "Deployment",
        namespace: "default",
        status: "Running",
        cpu: { percent: "64%", cores: "0.9 cores", spark: [5, 6, 7, 6, 8, 7, 8, 9, 8, 9], color: "#3fb950" },
        memory: { percent: "85%", size: "1.9 GiB", spark: [4, 6, 7, 9, 10, 11, 12, 13, 14, 15], color: "#f0883e" },
        restarts: { count: 2, bars: [3, 4, 5, 4, 6, 5, 7, 6], color: "#f0883e" },
        healthScore: 78,
        risk: "Medium",
        aiAnalysis: { text: "Memory growing fast", color: "#f0883e", confidence: 91 },
    },
    {
        name: "order-service-6c8d7e9f2a-vk9pm",
        type: "Deployment",
        namespace: "default",
        status: "Running",
        cpu: { percent: "48%", cores: "0.7 cores", spark: [6, 5, 7, 6, 8, 7, 6, 7, 8, 7], color: "#3fb950" },
        memory: { percent: "61%", size: "1.1 GiB", spark: [7, 7, 8, 7, 8, 8, 8, 8, 9, 8], color: "#3fb950" },
        restarts: { count: 0, bars: [4, 5, 4, 6, 5, 6, 5, 6], color: "#3fb950" },
        healthScore: 94,
        risk: "Low",
        aiAnalysis: { text: "Stable", color: "#3fb950", confidence: 94 },
    },
    {
        name: "payment-svc-9b3e7f1a4d-pl4xc",
        type: "Deployment",
        namespace: "payments",
        status: "Running",
        cpu: { percent: "89%", cores: "1.6 cores", spark: [8, 10, 11, 12, 13, 12, 14, 13, 14, 15], color: "#f85149" },
        memory: { percent: "74%", size: "1.4 GiB", spark: [7, 8, 8, 9, 9, 9, 10, 9, 10, 10], color: "#f0883e" },
        restarts: { count: 5, bars: [6, 8, 7, 10, 9, 11, 12, 14], color: "#f85149" },
        healthScore: 62,
        risk: "High",
        aiAnalysis: { text: "High CPU pressure", color: "#f85149", confidence: 87 },
    },
    {
        name: "notification-svc-7f9e2c3b1d-wn7yz",
        type: "Deployment",
        namespace: "default",
        status: "Pending",
        cpu: { percent: "—", cores: "Scheduling...", spark: [], color: "#6e7681" },
        memory: { percent: "—", size: "—", spark: [], color: "#6e7681" },
        restarts: { count: 0, bars: [0, 0, 0, 0, 0, 0, 0, 0], color: "#484f58" },
        healthScore: 32,
        risk: "Critical",
        aiAnalysis: { text: "Pending >2m", color: "#f0883e", confidence: 92, icon: "refresh" },
    },
    {
        name: "worker-job-4d8f1a3c7e-mn5kp",
        type: "Job",
        namespace: "batch",
        status: "Restarting",
        cpu: { percent: "23%", cores: "0.3 cores", spark: [5, 8, 4, 9, 3, 10, 2, 11, 1, 12], color: "#f85149" },
        memory: { percent: "35%", size: "512 MiB", spark: [6, 5, 6, 5, 6, 5, 6, 5, 6, 5], color: "#f85149" },
        restarts: { count: 7, bars: [12, 14, 11, 15, 13, 16, 14, 18], color: "#f85149" },
        healthScore: 41,
        risk: "High",
        aiAnalysis: { text: "CrashLoopBackOff", color: "#f85149", confidence: 89 },
    },
];

// ─── Component ───────────────────────────────────────────────────────────────

const ALL_COLUMNS = [
    { value: "namespace", label: "Namespace" },
    { value: "status", label: "Status" },
    { value: "cpu", label: "CPU" },
    { value: "memory", label: "Memory" },
    { value: "restarts", label: "Restarts (15m)" },
    { value: "health", label: "Health Score" },
    { value: "risk", label: "Risk Level" },
    { value: "ai", label: "AI Analysis" },
];

export function WorkloadExplorer() {
    const [search, setSearch] = useState("");
    const [namespace, setNamespace] = useState("all");
    const [status, setStatus] = useState("all");
    const [risk, setRisk] = useState("all");
    const [groupBy, setGroupBy] = useState("none");
    const [view, setView] = useState<"list" | "grid">("list");
    const [visibleCols, setVisibleCols] = useState<string[]>(ALL_COLUMNS.map(c => c.value));

    const namespaces = Array.from(new Set(PODS.map(p => p.namespace)));

    const filtered = PODS.filter(p => {
        if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
        if (namespace !== "all" && p.namespace !== namespace) return false;
        if (status !== "all" && p.status.toLowerCase() !== status) return false;
        if (risk !== "all" && p.risk.toLowerCase() !== risk) return false;
        return true;
    });

    // Group rows
    const groups: { key: string; rows: Pod[] }[] = (() => {
        if (groupBy === "none") return [{ key: "", rows: filtered }];
        const map = new Map<string, Pod[]>();
        filtered.forEach(p => {
            const key = groupBy === "namespace" ? p.namespace
                : groupBy === "status" ? p.status
                    : groupBy === "risk" ? p.risk : "";
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(p);
        });
        return Array.from(map.entries()).map(([key, rows]) => ({ key, rows }));
    })();

    const isCol = (c: string) => visibleCols.includes(c);

    return (
        <div className="rounded-[10px] border border-[#21262d] bg-[#161b22] p-3.5">
            {/* Header + Filters */}
            <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
                <h3 className="text-[14px] font-semibold text-[#e6edf3]">Workload Explorer</h3>
                <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Search */}
                    <div className="relative">
                        <svg className="absolute left-2.5 top-1/2 -translate-y-1/2" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6e7681" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search pods..."
                            className="w-[180px] h-7 pl-8 pr-3 rounded-md bg-[#0d1117] border border-[#30363d] text-[11px] text-[#e6edf3] placeholder:text-[#6e7681] focus:outline-none focus:border-[#58a6ff]/50"
                        />
                    </div>
                    <Dropdown
                        label="All namespaces"
                        value={namespace}
                        options={[
                            { value: "all", label: "All namespaces" },
                            ...namespaces.map(n => ({ value: n, label: n })),
                        ]}
                        onChange={setNamespace}
                        width={160}
                    />
                    <Dropdown
                        label="Status"
                        value={status}
                        options={[
                            { value: "all", label: "All statuses" },
                            { value: "running", label: "Running" },
                            { value: "pending", label: "Pending" },
                            { value: "restarting", label: "Restarting" },
                        ]}
                        onChange={setStatus}
                        width={150}
                    />
                    <Dropdown
                        label="Risk level"
                        value={risk}
                        options={[
                            { value: "all", label: "All risk levels" },
                            { value: "low", label: "Low" },
                            { value: "medium", label: "Medium" },
                            { value: "high", label: "High" },
                            { value: "critical", label: "Critical" },
                        ]}
                        onChange={setRisk}
                        width={150}
                    />
                    <Dropdown
                        label="More filters"
                        options={[
                            { value: "node", label: "Filter by node" },
                            { value: "label", label: "Filter by label" },
                            { value: "owner", label: "Filter by owner" },
                            { value: "age", label: "Filter by age" },
                        ]}
                        width={170}
                    />
                    <MultiSelectDropdown
                        label="Columns"
                        options={ALL_COLUMNS}
                        selected={visibleCols}
                        onChange={setVisibleCols}
                        width={180}
                    />
                    <div className="flex items-center gap-1 px-2 h-7 rounded-md bg-[#0d1117] border border-[#30363d]">
                        <span className="text-[10px] text-[#6e7681] font-medium">Group by:</span>
                        <Dropdown
                            label="None"
                            value={groupBy}
                            options={[
                                { value: "none", label: "None" },
                                { value: "namespace", label: "Namespace" },
                                { value: "status", label: "Status" },
                                { value: "risk", label: "Risk Level" },
                            ]}
                            onChange={setGroupBy}
                            width={130}
                        />
                    </div>
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

            {/* Empty state */}
            {filtered.length === 0 && (
                <div className="py-12 text-center">
                    <p className="text-[12px] text-[#8b949e]">No pods match the current filters.</p>
                    <button
                        onClick={() => { setSearch(""); setNamespace("all"); setStatus("all"); setRisk("all"); }}
                        className="mt-2 text-[11px] text-[#58a6ff] hover:text-[#79c0ff]"
                    >
                        Clear filters
                    </button>
                </div>
            )}

            {/* List view */}
            {filtered.length > 0 && view === "list" && (
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                        <thead>
                            <tr className="border-b border-[#21262d]">
                                <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-[#8b949e]">Pod</th>
                                {isCol("namespace") && <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-[#8b949e]">Namespace</th>}
                                {isCol("status") && <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-[#8b949e]">Status</th>}
                                {isCol("cpu") && <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-[#8b949e]">CPU</th>}
                                {isCol("memory") && <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-[#8b949e]">Memory</th>}
                                {isCol("restarts") && <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-[#8b949e]">Restarts (15m)</th>}
                                {isCol("health") && <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-[#8b949e]">Health Score</th>}
                                {isCol("risk") && <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-[#8b949e]">Risk Level</th>}
                                {isCol("ai") && <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-[#8b949e]">AI Analysis</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {groups.flatMap((g, gi) => [
                                ...(g.key ? [
                                    <tr key={`group-${gi}`} className="bg-[#0d1117]/60">
                                        <td colSpan={ALL_COLUMNS.length + 1} className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-[#8b949e] font-semibold">
                                            {g.key} <span className="text-[#6e7681] font-normal">({g.rows.length})</span>
                                        </td>
                                    </tr>
                                ] : []),
                                ...g.rows.map((pod, i) => (
                                    <PodRow
                                        key={pod.name}
                                        pod={pod}
                                        isLast={gi === groups.length - 1 && i === g.rows.length - 1}
                                        visibleCols={visibleCols}
                                    />
                                ))
                            ])}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Grid view */}
            {filtered.length > 0 && view === "grid" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {filtered.map(pod => <PodCard key={pod.name} pod={pod} />)}
                </div>
            )}
        </div>
    );
}

function PodCard({ pod }: { pod: Pod }) {
    const statusColor = pod.status === "Running" ? "#3fb950" : pod.status === "Pending" ? "#f0883e" : "#f85149";
    const healthColor = pod.healthScore >= 80 ? "#3fb950" : pod.healthScore >= 60 ? "#f0883e" : pod.healthScore >= 40 ? "#f0883e" : "#f85149";
    return (
        <div className="rounded-md border border-[#21262d] bg-[#0d1117] p-3 hover:border-[#30363d] transition-colors">
            <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                    <p className="text-[11px] font-mono font-semibold text-[#e6edf3] truncate">{pod.name}</p>
                    <p className="text-[10px] text-[#6e7681] mt-0.5">{pod.namespace} · {pod.type}</p>
                </div>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10.5px] font-bold font-mono shrink-0" style={{ border: `2px solid ${healthColor}`, color: healthColor, background: `${healthColor}10` }}>
                    {pod.healthScore}
                </div>
            </div>
            <div className="flex items-center gap-3 text-[10.5px]">
                <span className="inline-flex items-center gap-1 font-medium" style={{ color: statusColor }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusColor, boxShadow: `0 0 4px ${statusColor}` }} />
                    {pod.status}
                </span>
                <span className="text-[#8b949e]">CPU <span className="font-mono" style={{ color: pod.cpu.color }}>{pod.cpu.percent}</span></span>
                <span className="text-[#8b949e]">MEM <span className="font-mono" style={{ color: pod.memory.color }}>{pod.memory.percent}</span></span>
            </div>
            <p className="mt-1.5 text-[10.5px] font-medium" style={{ color: pod.aiAnalysis.color }}>{pod.aiAnalysis.text}</p>
        </div>
    );
}

// ─── Pod Row ─────────────────────────────────────────────────────────────────

function PodRow({ pod, isLast, visibleCols }: { pod: Pod; isLast: boolean; visibleCols: string[] }) {
    const isCol = (c: string) => visibleCols.includes(c);
    const statusColor = pod.status === "Running" ? "#3fb950" : pod.status === "Pending" ? "#f0883e" : "#f85149";

    const riskStyle = {
        Low: { bg: "rgba(63,185,80,0.1)", color: "#3fb950", border: "rgba(63,185,80,0.3)" },
        Medium: { bg: "rgba(240,136,62,0.1)", color: "#f0883e", border: "rgba(240,136,62,0.3)" },
        High: { bg: "rgba(248,81,73,0.1)", color: "#f85149", border: "rgba(248,81,73,0.3)" },
        Critical: { bg: "rgba(248,81,73,0.18)", color: "#ff7b72", border: "rgba(248,81,73,0.5)" },
    }[pod.risk];

    const healthColor = pod.healthScore >= 80 ? "#3fb950"
        : pod.healthScore >= 60 ? "#f0883e"
            : pod.healthScore >= 40 ? "#f0883e"
                : "#f85149";

    return (
        <tr
            className={`hover:bg-white/[0.025] transition-colors ${!isLast ? "border-b border-[#21262d]" : ""}`}
        >
            {/* Pod */}
            <td className="px-3 py-2.5">
                <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded flex items-center justify-center shrink-0" style={{ background: "rgba(88,166,255,0.12)", border: "1px solid rgba(88,166,255,0.3)" }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#58a6ff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                            <line x1="12" y1="22.08" x2="12" y2="12" />
                        </svg>
                    </div>
                    <div className="min-w-0">
                        <p className="text-[12px] text-[#e6edf3] font-mono font-medium truncate">{pod.name}</p>
                        <p className="text-[10px] text-[#6e7681]">{pod.type}</p>
                    </div>
                </div>
            </td>
            {isCol("namespace") && <td className="px-3 py-2.5 text-[11.5px] text-[#8b949e] font-mono">{pod.namespace}</td>}
            {isCol("status") && (
                <td className="px-3 py-2.5">
                    <span className="inline-flex items-center gap-1.5 text-[11.5px] font-medium" style={{ color: statusColor }}>
                        <span
                            className={`w-1.5 h-1.5 rounded-full ${pod.status !== "Running" ? "wi-live-dot" : ""}`}
                            style={{ background: statusColor, boxShadow: `0 0 4px ${statusColor}` }}
                        />
                        {pod.status}
                    </span>
                </td>
            )}
            {isCol("cpu") && (
                <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                        <div>
                            <p className="text-[11.5px] font-mono font-semibold" style={{ color: pod.cpu.color }}>{pod.cpu.percent}</p>
                            <p className="text-[10px] text-[#6e7681] font-mono">{pod.cpu.cores}</p>
                        </div>
                        {pod.cpu.spark.length > 0 && <MiniLineChart data={pod.cpu.spark} color={pod.cpu.color} />}
                    </div>
                </td>
            )}
            {isCol("memory") && (
                <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                        <div>
                            <p className="text-[11.5px] font-mono font-semibold" style={{ color: pod.memory.color }}>{pod.memory.percent}</p>
                            <p className="text-[10px] text-[#6e7681] font-mono">{pod.memory.size}</p>
                        </div>
                        {pod.memory.spark.length > 0 && <MiniLineChart data={pod.memory.spark} color={pod.memory.color} />}
                    </div>
                </td>
            )}
            {isCol("restarts") && (
                <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                        <span className="text-[12px] font-mono font-semibold" style={{ color: pod.restarts.color }}>{pod.restarts.count}</span>
                        <MiniBarChart data={pod.restarts.bars} color={pod.restarts.color} />
                    </div>
                </td>
            )}
            {isCol("health") && (
                <td className="px-3 py-2.5">
                    <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[10.5px] font-bold font-mono"
                        style={{
                            border: `2px solid ${healthColor}`,
                            color: healthColor,
                            background: `${healthColor}10`,
                        }}
                    >
                        {pod.healthScore}
                    </div>
                </td>
            )}
            {isCol("risk") && (
                <td className="px-3 py-2.5">
                    <span
                        className="inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-semibold"
                        style={{
                            background: riskStyle.bg,
                            color: riskStyle.color,
                            border: `1px solid ${riskStyle.border}`,
                        }}
                    >
                        {pod.risk}
                    </span>
                </td>
            )}
            {isCol("ai") && (
                <td className="px-3 py-2.5">
                    <div className="flex items-start gap-1.5">
                        <div>
                            <p className="text-[11.5px] font-medium" style={{ color: pod.aiAnalysis.color }}>{pod.aiAnalysis.text}</p>
                            <p className="text-[10px] text-[#6e7681] font-mono">Confidence {pod.aiAnalysis.confidence}%</p>
                        </div>
                        {pod.aiAnalysis.icon === "refresh" ? (
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#a371f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5">
                                <polyline points="23 4 23 10 17 10" />
                                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                            </svg>
                        ) : (
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="#a371f7" className="mt-0.5">
                                <path d="M12 0L14 9L24 12L14 15L12 24L10 15L0 12L10 9Z" />
                            </svg>
                        )}
                    </div>
                </td>
            )}
        </tr>
    );
}

// ─── Mini Charts ─────────────────────────────────────────────────────────────

function MiniLineChart({ data, color }: { data: number[]; color: string }) {
    const w = 56, h = 18;
    const max = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    const range = max - min || 1;
    const points = data.map((v, i) => {
        const x = (i / (data.length - 1)) * w;
        const y = h - ((v - min) / range) * (h - 2) - 1;
        return `${x},${y}`;
    }).join(" ");

    return (
        <svg width={w} height={h} className="shrink-0">
            <polyline points={points} fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
        </svg>
    );
}

function MiniBarChart({ data, color }: { data: number[]; color: string }) {
    const w = 50, h = 18;
    const max = Math.max(...data, 1);
    const barW = w / data.length - 1;

    return (
        <svg width={w} height={h} className="shrink-0">
            {data.map((v, i) => {
                const barH = (v / max) * (h - 2);
                return (
                    <rect
                        key={i}
                        x={i * (barW + 1)}
                        y={h - barH}
                        width={barW}
                        height={barH || 1}
                        rx="0.5"
                        fill={color}
                        opacity={0.5 + (v / max) * 0.5}
                    />
                );
            })}
        </svg>
    );
}

// ─── Filter Button ───────────────────────────────────────────────────────────

function FilterButton({ children }: { children: React.ReactNode }) {
    return (
        <button className="flex items-center gap-1 h-7 px-2.5 rounded-md bg-[#0d1117] border border-[#30363d] text-[11px] text-[#8b949e] hover:text-[#e6edf3] hover:border-[#484f58] transition-colors">
            {children}
            <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </button>
    );
}
