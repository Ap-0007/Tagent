"use client";

import { useEffect, useState } from "react";
import { getIntegrations, testIntegration, type IntegrationInfo } from "@/lib/api";
import { Plug, Loader2, WifiOff, CheckCircle, XCircle } from "lucide-react";

export default function IntegrationsPage() {
    const [integrations, setIntegrations] = useState<IntegrationInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [testing, setTesting] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            try {
                const data = await getIntegrations();
                setIntegrations(data.integrations || []);
                setError(null);
            } catch (e: any) { setError(e.message); }
            finally { setLoading(false); }
        }
        load();
    }, []);

    async function handleTest(id: string) {
        setTesting(id);
        try {
            await testIntegration(id);
            // Refresh
            const data = await getIntegrations();
            setIntegrations(data.integrations || []);
        } catch { }
        finally { setTesting(null); }
    }

    const connected = integrations.filter(i => i.configured);
    const notConnected = integrations.filter(i => !i.configured);

    return (
        <div className="flex-1 overflow-y-auto scrollbar bg-[#0d1117]">
            <header className="px-6 py-5 border-b border-zinc-800/60">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-zinc-100">Integrations</h1>
                        <p className="text-sm text-zinc-500 mt-0.5">{connected.length} connected · {notConnected.length} available</p>
                    </div>
                    {loading && <Loader2 className="w-4 h-4 text-zinc-500 animate-spin" />}
                    {error && <WifiOff className="w-4 h-4 text-amber-400" />}
                </div>
            </header>
            <div className="px-6 py-5 space-y-4">
                {integrations.length === 0 && !loading ? (
                    <div className="text-center py-12">
                        <Plug className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
                        <p className="text-sm text-zinc-400">{error ? "Cannot reach notification service" : "No integrations available"}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {integrations.map(int => (
                            <div key={int.id} className="rounded-lg border border-[#21262d] bg-[#161b22] p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        {int.configured ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-zinc-500" />}
                                        <span className="text-[13px] text-[#e6edf3] font-medium">{int.name}</span>
                                    </div>
                                    <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${int.configured ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-800 text-zinc-500"}`}>
                                        {int.configured ? "Connected" : "Not configured"}
                                    </span>
                                </div>
                                <p className="text-[11px] text-[#8b949e] mb-3">Setup: {int.setup_type}</p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleTest(int.id)}
                                        disabled={!int.configured || testing === int.id}
                                        className="px-3 py-1.5 text-[10px] font-medium text-zinc-300 bg-zinc-800 border border-zinc-700 rounded hover:bg-zinc-700 disabled:opacity-40"
                                    >
                                        {testing === int.id ? "Testing..." : "Test Connection"}
                                    </button>
                                    {!int.configured && (
                                        <span className="text-[9px] text-zinc-500">Set env vars: {int.env_vars?.slice(0, 2).join(", ")}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
