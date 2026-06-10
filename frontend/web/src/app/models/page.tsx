"use client";

import { useEffect, useState, useCallback } from "react";
import {
    getModelCatalog,
    getInstalledModels,
    getActiveModel,
    pullModel,
    getPullStatus,
    switchModel,
    deleteModel,
    storeCloudKey,
    getCloudKeys,
    deleteCloudKey,
    type LocalModelInfo,
    type CloudProviderInfo,
    type InstalledModel,
    type ActiveModelResponse,
    type CloudKeyStatus,
} from "@/lib/api";
import {
    Cpu, Download, Trash2, Check, Loader2, AlertCircle, Key,
    Server, Cloud, Zap, Brain, HardDrive, RefreshCw, Eye, EyeOff,
    ChevronDown, ChevronRight, Star, Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "local" | "cloud";
type PullState = Record<string, { status: string; progress: number; error?: string | null }>;

export default function ModelsPage() {
    const [tab, setTab] = useState<Tab>("local");
    const [catalog, setCatalog] = useState<LocalModelInfo[]>([]);
    const [cloudProviders, setCloudProviders] = useState<CloudProviderInfo[]>([]);
    const [installed, setInstalled] = useState<InstalledModel[]>([]);
    const [active, setActive] = useState<ActiveModelResponse | null>(null);
    const [cloudKeys, setCloudKeys] = useState<CloudKeyStatus[]>([]);
    const [pullStates, setPullStates] = useState<PullState>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedCategory, setExpandedCategory] = useState<string>("medium");

    // Cloud key input state
    const [keyInputs, setKeyInputs] = useState<Record<string, string>>({});
    const [showKey, setShowKey] = useState<Record<string, boolean>>({});
    const [savingKey, setSavingKey] = useState<string | null>(null);
    const [ollamaReady, setOllamaReady] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            // Catalog is served by AI Engine (always available even if Ollama is down)
            const catalogRes = await getModelCatalog();
            setCatalog(catalogRes.local_models);
            setCloudProviders(catalogRes.cloud_providers);

            // These depend on Ollama being reachable — handle gracefully
            try {
                const [installedRes, activeRes] = await Promise.all([
                    getInstalledModels(),
                    getActiveModel(),
                ]);
                setInstalled(installedRes.models);
                setActive(activeRes);
                setOllamaReady(true);
            } catch {
                // Ollama not ready yet — that's OK, show catalog anyway
                setInstalled([]);
                setOllamaReady(false);
            }

            // Cloud keys don't depend on Ollama
            try {
                const cloudKeysRes = await getCloudKeys();
                setCloudKeys(cloudKeysRes.providers);
            } catch { /* ignore */ }

            setError(null);
        } catch (e: any) {
            setError(e.message || "Failed to load model data");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Poll pull status for active pulls
    useEffect(() => {
        const pullingModels = Object.entries(pullStates).filter(([_, s]) => s.status === "pulling");
        if (pullingModels.length === 0) return;

        const interval = setInterval(async () => {
            for (const [modelId] of pullingModels) {
                try {
                    const status = await getPullStatus(modelId);
                    setPullStates(prev => ({ ...prev, [modelId]: status }));
                    if (status.status === "ready" || status.status === "error") {
                        // Refresh installed models
                        const res = await getInstalledModels();
                        setInstalled(res.models);
                    }
                } catch { /* ignore polling errors */ }
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [pullStates]);

    const handlePull = async (modelId: string) => {
        setPullStates(prev => ({ ...prev, [modelId]: { status: "pulling", progress: 0 } }));
        try {
            await pullModel(modelId);
        } catch (e: any) {
            setPullStates(prev => ({ ...prev, [modelId]: { status: "error", progress: 0, error: e.message } }));
        }
    };

    const handleSwitch = async (modelId: string, type: "chat" | "embedding") => {
        try {
            await switchModel(modelId, type);
            setActive(prev => prev ? {
                ...prev,
                [type === "chat" ? "chat_model" : "embedding_model"]: modelId
            } : null);
        } catch (e: any) {
            setError(e.message);
        }
    };

    const handleDelete = async (modelId: string) => {
        if (!confirm(`Delete model "${modelId}"? This will free disk space but you'll need to re-pull it later.`)) return;
        try {
            await deleteModel(modelId);
            setInstalled(prev => prev.filter(m => m.id !== modelId));
            setPullStates(prev => { const n = { ...prev }; delete n[modelId]; return n; });
        } catch (e: any) {
            setError(e.message);
        }
    };

    const handleStoreKey = async (providerId: string) => {
        const key = keyInputs[providerId];
        if (!key?.trim()) return;
        setSavingKey(providerId);
        try {
            await storeCloudKey(providerId, key.trim());
            setCloudKeys(prev => prev.map(p => p.id === providerId ? { ...p, has_key: true } : p));
            setKeyInputs(prev => ({ ...prev, [providerId]: "" }));
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSavingKey(null);
        }
    };

    const handleDeleteKey = async (providerId: string) => {
        if (!confirm("Remove this API key from the cluster?")) return;
        try {
            await deleteCloudKey(providerId);
            setCloudKeys(prev => prev.map(p => p.id === providerId ? { ...p, has_key: false } : p));
        } catch (e: any) {
            setError(e.message);
        }
    };

    const isInstalled = (modelId: string) => installed.some(m => m.id === modelId || m.id.startsWith(modelId.split(":")[0]));
    const isActive = (modelId: string) => active?.chat_model === modelId || active?.embedding_model === modelId;

    const categories = [
        { key: "small", label: "Small Models", icon: Zap, desc: "< 4GB RAM — fast inference" },
        { key: "medium", label: "Medium Models", icon: Brain, desc: "4-10GB RAM — balanced" },
        { key: "large", label: "Large Models", icon: Server, desc: "10GB+ RAM — maximum capability" },
        { key: "embedding", label: "Embedding Models", icon: HardDrive, desc: "For vector search & RAG" },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                <span className="ml-3 text-slate-400">Loading model catalog...</span>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
                        <Cpu className="w-7 h-7 text-blue-400" />
                        AI Model Management
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">
                        Install, switch, and manage AI models. Local models run entirely on your cluster.
                    </p>
                </div>
                <button
                    onClick={() => { setLoading(true); fetchData(); }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition"
                >
                    <RefreshCw className="w-4 h-4" /> Refresh
                </button>
            </div>

            {/* Active Model Banner */}
            {active && (
                <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <Star className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-medium text-slate-200">Active Models</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Chat: <span className="text-blue-300 font-mono">{active.chat_model}</span>
                            {" · "}
                            Embedding: <span className="text-blue-300 font-mono">{active.embedding_model}</span>
                        </p>
                    </div>
                    <div className="text-xs text-slate-500">
                        Endpoint: <span className="font-mono">{active.endpoint}</span>
                    </div>
                </div>
            )}

            {/* Ollama starting up */}
            {!ollamaReady && !error && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-medium text-amber-200">Ollama is starting up...</p>
                        <p className="text-xs text-amber-300/60 mt-0.5">
                            The Ollama pod is still initializing. You can browse the catalog below.
                            Models will be installable once Ollama is ready (usually 30-60 seconds).
                        </p>
                    </div>
                    <button onClick={() => { setLoading(true); fetchData(); }} className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs hover:bg-amber-500/20 transition">
                        Retry
                    </button>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 flex items-center gap-2 text-red-300 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                    <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300">✕</button>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 bg-navy-900/50 p-1 rounded-lg w-fit border border-white/5">
                <button
                    onClick={() => setTab("local")}
                    className={cn(
                        "px-4 py-2 rounded-md text-sm font-medium transition flex items-center gap-2",
                        tab === "local" ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" : "text-slate-400 hover:text-slate-200"
                    )}
                >
                    <Server className="w-4 h-4" /> Local Models (Ollama)
                </button>
                <button
                    onClick={() => setTab("cloud")}
                    className={cn(
                        "px-4 py-2 rounded-md text-sm font-medium transition flex items-center gap-2",
                        tab === "cloud" ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" : "text-slate-400 hover:text-slate-200"
                    )}
                >
                    <Cloud className="w-4 h-4" /> Cloud API Keys
                </button>
            </div>

            {/* LOCAL MODELS TAB */}
            {tab === "local" && (
                <div className="space-y-4">
                    {/* Installed count */}
                    <p className="text-xs text-slate-500">
                        {installed.length} model{installed.length !== 1 ? "s" : ""} installed ·
                        Select a model to install it automatically on your cluster
                    </p>

                    {categories.map(cat => {
                        const models = catalog.filter(m => m.category === cat.key);
                        const isExpanded = expandedCategory === cat.key;
                        return (
                            <div key={cat.key} className="rounded-xl border border-white/5 bg-navy-900/30 overflow-hidden">
                                <button
                                    onClick={() => setExpandedCategory(isExpanded ? "" : cat.key)}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition"
                                >
                                    <cat.icon className="w-5 h-5 text-slate-400" />
                                    <div className="flex-1 text-left">
                                        <span className="text-sm font-medium text-slate-200">{cat.label}</span>
                                        <span className="ml-2 text-xs text-slate-500">{cat.desc}</span>
                                    </div>
                                    <span className="text-xs text-slate-500 mr-2">{models.length} models</span>
                                    {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                                </button>

                                {isExpanded && (
                                    <div className="border-t border-white/5 divide-y divide-white/5">
                                        {models.map(model => {
                                            const modelInstalled = isInstalled(model.id);
                                            const modelActive = isActive(model.id);
                                            const pullState = pullStates[model.id];
                                            const isPulling = pullState?.status === "pulling";
                                            const pullError = pullState?.status === "error";

                                            return (
                                                <div key={model.id} className="flex items-center gap-4 px-4 py-3 hover:bg-white/[0.02] transition">
                                                    {/* Model info */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-medium text-slate-200">{model.name}</span>
                                                            {model.default && (
                                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">DEFAULT</span>
                                                            )}
                                                            {modelActive && (
                                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-300 border border-green-500/30">ACTIVE</span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-slate-500 mt-0.5">{model.description}</p>
                                                        <p className="text-[11px] text-slate-600 font-mono mt-0.5">{model.id} · {model.size}</p>
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        {isPulling && (
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-24 h-2 rounded-full bg-white/10 overflow-hidden">
                                                                    <div
                                                                        className="h-full rounded-full bg-blue-500 transition-all duration-500"
                                                                        style={{ width: `${pullState.progress}%` }}
                                                                    />
                                                                </div>
                                                                <span className="text-xs text-blue-300 w-8">{pullState.progress}%</span>
                                                                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                                                            </div>
                                                        )}

                                                        {pullError && (
                                                            <span className="text-xs text-red-400">Failed</span>
                                                        )}

                                                        {!modelInstalled && !isPulling && (
                                                            <button
                                                                onClick={() => handlePull(model.id)}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-medium hover:bg-blue-500/20 transition"
                                                            >
                                                                <Download className="w-3.5 h-3.5" /> Install
                                                            </button>
                                                        )}

                                                        {modelInstalled && !modelActive && (
                                                            <button
                                                                onClick={() => handleSwitch(model.id, model.category === "embedding" ? "embedding" : "chat")}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/30 text-green-300 text-xs font-medium hover:bg-green-500/20 transition"
                                                            >
                                                                <Check className="w-3.5 h-3.5" /> Activate
                                                            </button>
                                                        )}

                                                        {modelInstalled && (
                                                            <button
                                                                onClick={() => handleDelete(model.id)}
                                                                className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition"
                                                                title="Delete model"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* CLOUD API KEYS TAB */}
            {tab === "cloud" && (
                <div className="space-y-4">
                    <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 flex items-start gap-2">
                        <Shield className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                        <div className="text-xs text-amber-300/80">
                            <p className="font-medium text-amber-300">Optional: Cloud API Keys</p>
                            <p className="mt-0.5">
                                API keys are stored as Kubernetes Secrets in your cluster. They never leave your infrastructure.
                                Cloud models are optional — Tagent works fully with local models.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {(cloudKeys.length > 0 ? cloudKeys : cloudProviders.map(p => ({ ...p, has_key: false }))).map(provider => (
                            <div key={provider.id} className="rounded-xl border border-white/5 bg-navy-900/30 p-4">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={cn(
                                        "w-9 h-9 rounded-lg flex items-center justify-center",
                                        provider.has_key ? "bg-green-500/10 border border-green-500/20" : "bg-white/5 border border-white/10"
                                    )}>
                                        <Key className={cn("w-4 h-4", provider.has_key ? "text-green-400" : "text-slate-500")} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-slate-200">{provider.name}</p>
                                        <p className="text-xs text-slate-500">
                                            Models: {provider.models.slice(0, 3).join(", ")}
                                            {provider.models.length > 3 && ` +${provider.models.length - 3} more`}
                                        </p>
                                    </div>
                                    {provider.has_key && (
                                        <span className="text-[10px] px-2 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 font-medium">
                                            KEY STORED
                                        </span>
                                    )}
                                </div>

                                {/* Key input */}
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <input
                                            type={showKey[provider.id] ? "text" : "password"}
                                            value={keyInputs[provider.id] || ""}
                                            onChange={e => setKeyInputs(prev => ({ ...prev, [provider.id]: e.target.value }))}
                                            placeholder={provider.has_key ? "••••••••••••••• (stored)" : `Enter ${provider.name} API key...`}
                                            className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-sm text-slate-200 placeholder:text-slate-600 focus:border-blue-500/50 focus:outline-none font-mono"
                                        />
                                        <button
                                            onClick={() => setShowKey(prev => ({ ...prev, [provider.id]: !prev[provider.id] }))}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                                        >
                                            {showKey[provider.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => handleStoreKey(provider.id)}
                                        disabled={!keyInputs[provider.id]?.trim() || savingKey === provider.id}
                                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-medium hover:bg-blue-500/20 transition disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        {savingKey === provider.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />}
                                        Save Key
                                    </button>
                                    {provider.has_key && (
                                        <button
                                            onClick={() => handleDeleteKey(provider.id)}
                                            className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition"
                                            title="Remove key"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
