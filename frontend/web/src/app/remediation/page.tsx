"use client";

import { useEffect, useState } from "react";
import {
    executeRemediation,
    getRemediationHistory,
    type RemediationRequest,
    type RemediationResult,
} from "@/lib/api";
import { Loader2, Play, WifiOff } from "lucide-react";

export default function RemediationPage() {
    const [action, setAction] = useState<RemediationRequest["action"]>("restart-pod");
    const [namespace, setNamespace] = useState("default");
    const [target, setTarget] = useState("");
    const [dryRun, setDryRun] = useState(true);
    const [history, setHistory] = useState<RemediationResult[]>([]);
    const [result, setResult] = useState<RemediationResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    async function loadHistory() {
        try {
            const data = await getRemediationHistory();
            setHistory(data.history || []);
        } catch {
            setHistory([]);
        } finally {
            setHistoryLoading(false);
        }
    }

    useEffect(() => {
        loadHistory();
    }, []);

    async function submit() {
        if (!target.trim() || loading) return;
        setLoading(true);
        setError(null);
        setResult(null);
        try {
            const data = await executeRemediation({
                action,
                namespace: namespace.trim(),
                target: target.trim(),
                dry_run: dryRun,
            });
            setResult(data);
            await loadHistory();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex-1 overflow-y-auto scrollbar">
            <header className="px-6 py-5 border-b border-zinc-800/60">
                <h1 className="text-lg font-semibold text-zinc-100">Remediation</h1>
                <p className="text-sm text-zinc-500 mt-0.5">Execute actions through the Remediation Service</p>
            </header>
            <div className="px-6 py-5 space-y-5">
                <Section title="Execute Action">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 py-4">
                        <Field label="Action">
                            <select value={action} onChange={(e) => setAction(e.target.value as RemediationRequest["action"])} className="h-9 w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500/50">
                                <option value="restart-pod">restart-pod</option>
                                <option value="scale-deployment">scale-deployment</option>
                                <option value="rollback-deployment">rollback-deployment</option>
                            </select>
                        </Field>
                        <Field label="Namespace">
                            <input value={namespace} onChange={(e) => setNamespace(e.target.value)} className="h-9 w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500/50" />
                        </Field>
                        <Field label="Target">
                            <input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="pod or deployment name" className="h-9 w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50" />
                        </Field>
                        <div className="flex items-end gap-2">
                            <label className="h-9 flex items-center gap-2 px-3 border border-zinc-800 rounded-md text-xs text-zinc-300">
                                <input type="checkbox" checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} className="accent-emerald-500" />
                                Dry run
                            </label>
                            <button onClick={submit} disabled={loading || !target.trim()} className="h-9 px-3 bg-emerald-500 text-zinc-950 text-xs font-medium rounded-md hover:bg-emerald-400 disabled:opacity-50 flex items-center gap-1.5">
                                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                                Run
                            </button>
                        </div>
                    </div>
                    {error && <p className="pb-4 flex items-center gap-1.5 text-[12px] text-amber-400"><WifiOff className="w-3 h-3" />{error}</p>}
                    {result && (
                        <div className="mb-4 rounded-md border border-zinc-800 bg-zinc-950 px-4 py-3">
                            <p className="text-[13px] text-zinc-200">{result.status}: {result.message}</p>
                            <p className="text-[11px] text-zinc-500 font-mono mt-1">{result.action} - {result.target} - {result.timestamp}</p>
                        </div>
                    )}
                </Section>

                <Section title="History">
                    {historyLoading ? (
                        <div className="py-8 text-center text-zinc-500 text-sm">Loading history...</div>
                    ) : history.length === 0 ? (
                        <div className="py-8 text-center text-zinc-500 text-sm">No remediation history returned by backend.</div>
                    ) : history.map((h, i) => (
                        <div key={`${h.timestamp}-${i}`} className="flex items-center justify-between py-3 border-b border-zinc-800/50 last:border-0">
                            <p className="text-[13px] text-zinc-300">{h.action} on {h.target}</p>
                            <span className="text-[11px] text-zinc-500 font-mono">{h.status} - {h.dry_run ? "dry-run" : "live"}</span>
                        </div>
                    ))}
                </Section>
            </div>
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="block">
            <span className="block text-[10px] text-zinc-500 uppercase font-medium mb-1.5">{label}</span>
            {children}
        </label>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg">
            <div className="px-5 py-3 border-b border-zinc-800"><h2 className="text-sm font-medium text-zinc-200">{title}</h2></div>
            <div className="px-5">{children}</div>
        </div>
    );
}
