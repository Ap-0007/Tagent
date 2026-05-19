"use client";

import { useEffect, useState } from "react";
import {
    getNightGuardianReports,
    getNightGuardianStatus,
    runNightGuardianNow,
    updateNightGuardianConfig,
    type NightGuardianConfig,
    type NightGuardianReport,
    type NightGuardianStatus,
} from "@/lib/api";
import { Loader2, Moon, Play, Shield, WifiOff, Zap } from "lucide-react";

const fallbackConfig: NightGuardianConfig = {
    enabled: false,
    auto_fix: false,
    confidence: 85,
    interval_seconds: 60,
    min_restarts: 3,
    protected_namespace: "kube-system,kube-public,kube-node-lease",
};

export default function NightGuardianPage() {
    const [status, setStatus] = useState<NightGuardianStatus | null>(null);
    const [config, setConfig] = useState<NightGuardianConfig>(fallbackConfig);
    const [reports, setReports] = useState<NightGuardianReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [running, setRunning] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function load() {
        try {
            const [statusData, reportsData] = await Promise.all([
                getNightGuardianStatus(),
                getNightGuardianReports(),
            ]);
            setStatus(statusData);
            setConfig(statusData.config);
            setReports(reportsData.reports || []);
            setError(null);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
        const interval = setInterval(load, 15000);
        return () => clearInterval(interval);
    }, []);

    async function save(next: NightGuardianConfig) {
        setConfig(next);
        setSaving(true);
        try {
            const saved = await updateNightGuardianConfig(next);
            setConfig(saved);
            await load();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    }

    async function runNow() {
        setRunning(true);
        try {
            await runNightGuardianNow();
            await load();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setRunning(false);
        }
    }

    return (
        <div className="flex-1 overflow-y-auto scrollbar">
            <header className="px-6 py-5 border-b border-zinc-800/60">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-zinc-100">Night Guardian</h1>
                        <p className="text-sm text-zinc-500 mt-0.5">Background detection, safe auto-fix, and incident documentation</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {loading && <Loader2 className="w-4 h-4 text-zinc-500 animate-spin" />}
                        {error && <span className="flex items-center gap-1 text-[10px] text-amber-400"><WifiOff className="w-3 h-3" />offline</span>}
                        <button onClick={runNow} disabled={running} className="h-8 px-3 bg-emerald-500 text-zinc-950 text-xs font-medium rounded-md hover:bg-emerald-400 disabled:opacity-50 flex items-center gap-1.5">
                            {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                            Run scan
                        </button>
                    </div>
                </div>
            </header>

            <div className="px-6 py-5 space-y-4 max-w-5xl">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <Stat label="Mode" value={status?.mode || "-"} />
                    <Stat label="Runs" value={String(status?.run_count ?? "-")} />
                    <Stat label="Reports" value={String(status?.report_count ?? "-")} />
                    <Stat label="Last Findings" value={String(status?.latest_run?.findings ?? 0)} />
                </div>

                <Card>
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center"><Moon className="w-5 h-5 text-emerald-400" /></div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-zinc-200">Night Guardian Mode</p>
                            <p className="text-[12px] text-zinc-500 mt-0.5">Runs a backend loop that scans pods, chooses safe remediation, and writes reports.</p>
                        </div>
                        <Toggle on={config.enabled} disabled={saving} onToggle={() => save({ ...config, enabled: !config.enabled })} />
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center gap-4 mb-4">
                        <Zap className="w-5 h-5 text-amber-400" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-zinc-200">Auto-Fix</p>
                            <p className="text-[12px] text-zinc-500">Executes only when Night Guardian is enabled, mode is auto, and confidence is high enough.</p>
                        </div>
                        <Toggle on={config.auto_fix} disabled={saving} onToggle={() => save({ ...config, auto_fix: !config.auto_fix })} />
                    </div>
                    <div className="pl-9 space-y-3">
                        <div>
                            <label className="text-xs text-zinc-400 block mb-1">Minimum confidence: <span className="text-emerald-400 font-mono">{config.confidence}%</span></label>
                            <input type="range" min={50} max={100} value={config.confidence} onChange={(e) => setConfig({ ...config, confidence: +e.target.value })} onMouseUp={() => save(config)} className="w-full accent-emerald-500" />
                        </div>
                        <div>
                            <label className="text-xs text-zinc-400 block mb-1">Restart threshold: <span className="text-emerald-400 font-mono">{config.min_restarts}</span></label>
                            <input type="number" min={1} value={config.min_restarts} onChange={(e) => setConfig({ ...config, min_restarts: +e.target.value })} onBlur={() => save(config)} className="w-24 h-8 bg-zinc-950 border border-zinc-800 rounded-md px-2 text-xs text-zinc-200" />
                        </div>
                        <p className="text-[11px] text-zinc-500">Read-only mode always records a dry-run report instead of mutating the cluster.</p>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center gap-4 mb-3">
                        <Shield className="w-5 h-5 text-blue-400" />
                        <div>
                            <p className="text-sm font-medium text-zinc-200">Protected Namespaces</p>
                            <p className="text-[12px] text-zinc-500">Pods in these namespaces are never auto-fixed.</p>
                        </div>
                    </div>
                    <input value={config.protected_namespace} onChange={(e) => setConfig({ ...config, protected_namespace: e.target.value })} onBlur={() => save(config)} className="w-full h-9 bg-zinc-950 border border-zinc-800 rounded-md px-3 text-xs font-mono text-zinc-200" />
                </Card>

                <Card>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-sm font-medium text-zinc-200">Generated Reports</h2>
                        <span className="text-[10px] text-zinc-500 font-mono">{reports.length} total</span>
                    </div>
                    {reports.length === 0 ? (
                        <div className="py-8 text-center text-sm text-zinc-500">No Night Guardian reports yet. Run a scan to test detection.</div>
                    ) : (
                        <div className="divide-y divide-zinc-800/50">
                            {reports.map((r) => (
                                <div key={`${r.id}-${r.created_at}`} className="py-3">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[13px] text-zinc-200 font-medium">{r.title}</p>
                                        <span className={`text-[10px] font-mono ${r.dry_run ? "text-amber-400" : "text-emerald-400"}`}>{r.dry_run ? "dry-run" : "live"}</span>
                                    </div>
                                    <p className="text-[11px] text-zinc-500 font-mono mt-0.5">{r.namespace}/{r.target} - {r.detected_status} - {r.result.status}</p>
                                    <p className="text-[12px] text-zinc-400 mt-1">{r.recommendation}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}

function Card({ children }: { children: React.ReactNode }) {
    return <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-5">{children}</div>;
}

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
            <p className="text-xs text-zinc-400">{label}</p>
            <p className="text-xl font-semibold text-zinc-100 font-mono mt-1">{value}</p>
        </div>
    );
}

function Toggle({ on, disabled, onToggle }: { on: boolean; disabled?: boolean; onToggle: () => void }) {
    return (
        <button disabled={disabled} onClick={onToggle} className={`w-9 h-5 rounded-full relative transition-colors disabled:opacity-50 ${on ? "bg-emerald-500" : "bg-zinc-700"}`}>
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${on ? "translate-x-4" : "translate-x-0.5"}`} />
        </button>
    );
}
