"use client";

import { useState } from "react";

// ─── Tagent AI Chat Page ─────────────────────────────────────────────────────

const SUGGESTIONS = [
    { icon: "search", title: "Why is checkout latency increasing?", confidence: 94, time: "2 min", color: "#58a6ff" },
    { icon: "analyze", title: "Analyze unhealthy workloads", confidence: 97, time: "3 min", color: "#58a6ff" },
    { icon: "db", title: "Investigate database bottlenecks", confidence: 92, time: "3 min", color: "#3fb950" },
    { icon: "deploy", title: "Show deployment risks", confidence: 95, time: "2 min", color: "#f0883e" },
    { icon: "scale", title: "Predict scaling events", confidence: 91, time: "2 min", color: "#a371f7" },
];

const CONTEXT_TAGS = ["Production Cluster", "Live Telemetry", "Logs", "Metrics", "Traces"];

const QUICK_ACTIONS = ["Logs", "Metrics", "Incidents", "Deployments", "Remediation", "More"];

const HISTORY_GROUPS = [
    {
        label: "Today",
        items: [
            { id: "rca-payment", icon: "incident", title: "Incident RCA: Payment Service", subtitle: "Investigate memory pressure and latency", time: "10:24 AM" },
            { id: "checkout-latency", icon: "search", title: "Checkout Latency Investigation", subtitle: "Analyze p95 latency spike in checkout", time: "9:15 AM" },
            { id: "failed-deploy", icon: "deploy", title: "Failed Deployment Analysis", subtitle: "Why did v2.4.1 rollout fail?", time: "8:42 AM" },
            { id: "db-connection", icon: "db", title: "Database Connection Issues", subtitle: "Investigate connection pool exhaustion", time: "7:30 AM" },
        ],
    },
    {
        label: "Yesterday",
        items: [
            { id: "cost-review", icon: "cost", title: "Cost Optimization Review", subtitle: "Analyze cluster costs and waste", time: "Yesterday" },
            { id: "blast-radius", icon: "blast", title: "Blast Radius Investigation", subtitle: "Impact analysis for payment outage", time: "Yesterday" },
            { id: "postmortem", icon: "doc", title: "Postmortem Draft: INC-2471", subtitle: "Generate postmortem for payment incident", time: "Yesterday" },
        ],
    },
    {
        label: "Last 7 days",
        items: [
            { id: "scaling", icon: "scale", title: "Scaling Analysis", subtitle: "Predict scaling events for AI Engine", time: "2 days ago" },
            { id: "network-latency", icon: "network", title: "Network Latency Issues", subtitle: "Investigate cross-region latency", time: "3 days ago" },
        ],
    },
];

export default function AIPage() {
    const [input, setInput] = useState("");
    const [searchHistory, setSearchHistory] = useState("");
    const [activeChat, setActiveChat] = useState("rca-payment");
    const [contextOpen, setContextOpen] = useState(true);
    const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string; time?: string; analysis?: boolean }[]>([
        { role: "user", text: "Why is the payment service experiencing memory pressure?", time: "10:24 AM" },
        { role: "ai", text: "I've analyzed the payment service and identified the root cause.", time: "10:24 AM", analysis: true },
    ]);

    const handleSend = () => {
        if (!input.trim()) return;
        setMessages(m => [...m, { role: "user", text: input, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
        setInput("");
        // Simulate AI response
        setTimeout(() => {
            setMessages(m => [...m, { role: "ai", text: "I'm analyzing your request. This would connect to the local Ollama instance for real responses.", time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
        }, 1500);
    };

    return (
        <div className="flex-1 flex overflow-hidden bg-[#0d1117]">
            {/* Left: Conversation History Sidebar */}
            <div className="w-[280px] border-r border-[#21262d] bg-[#0d1117] flex flex-col shrink-0 hidden lg:flex">
                {/* New Investigation button */}
                <div className="p-3">
                    <button
                        onClick={() => { setMessages([]); setActiveChat("new"); }}
                        className="w-full flex items-center justify-between h-10 px-4 rounded-lg text-[13px] font-semibold text-white transition-all hover:opacity-90"
                        style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)", boxShadow: "0 0 12px rgba(124,58,237,0.3)" }}
                    >
                        <span className="flex items-center gap-2">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                            New Investigation
                        </span>
                        <span className="text-[10px] text-white/70 font-mono">⌘ N</span>
                    </button>
                </div>

                {/* Search */}
                <div className="px-3 pb-3">
                    <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6e7681" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <input
                            value={searchHistory}
                            onChange={e => setSearchHistory(e.target.value)}
                            placeholder="Search conversations"
                            className="w-full h-8 pl-9 pr-10 rounded-lg bg-[#161b22] border border-[#30363d] text-[12px] text-[#e6edf3] placeholder:text-[#6e7681] focus:outline-none focus:border-[#58a6ff]/50"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#6e7681] font-mono">⌘ K</span>
                    </div>
                </div>

                {/* Chat history list */}
                <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-4">
                    {HISTORY_GROUPS.filter(g => {
                        if (!searchHistory) return true;
                        return g.items.some(item => item.title.toLowerCase().includes(searchHistory.toLowerCase()));
                    }).map((group, gi) => (
                        <div key={gi}>
                            <p className="text-[11px] text-[#8b949e] font-medium px-2 mb-1.5">{group.label}</p>
                            <div className="space-y-0.5">
                                {group.items
                                    .filter(item => !searchHistory || item.title.toLowerCase().includes(searchHistory.toLowerCase()))
                                    .map((item, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setActiveChat(item.id)}
                                            className={`w-full flex items-start gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors ${activeChat === item.id
                                                ? "bg-[#a371f7]/10 border border-[#a371f7]/30"
                                                : "hover:bg-[#161b22] border border-transparent"
                                                }`}
                                        >
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${activeChat === item.id ? "bg-[#a371f7]/20 border border-[#a371f7]/40" : "bg-[#161b22] border border-[#21262d]"}`}>
                                                <HistoryIcon icon={item.icon} active={activeChat === item.id} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className={`text-[12px] font-semibold truncate ${activeChat === item.id ? "text-[#e6edf3]" : "text-[#e6edf3]"}`}>{item.title}</p>
                                                    <span className="text-[9.5px] text-[#6e7681] shrink-0">{item.time}</span>
                                                </div>
                                                <p className="text-[10.5px] text-[#8b949e] truncate mt-0.5">{item.subtitle}</p>
                                            </div>
                                        </button>
                                    ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main chat area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Chat content */}
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                    {/* Welcome section (shown when few messages) */}
                    {messages.length <= 2 && (
                        <div className="text-center pt-8 pb-4">
                            <div className="w-10 h-10 mx-auto mb-4 flex items-center justify-center">
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="#a371f7"><path d="M12 0L14 9L24 12L14 15L12 24L10 15L0 12L10 9Z" /></svg>
                            </div>
                            <h2 className="text-[22px] font-bold text-[#e6edf3] mb-1">How can I help you today?</h2>
                            <p className="text-[13px] text-[#8b949e]">Ask anything about your Kubernetes environment.</p>
                        </div>
                    )}

                    {/* Suggestion cards */}
                    {messages.length <= 2 && (
                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5 mb-6">
                            {SUGGESTIONS.map((s, i) => (
                                <button
                                    key={i}
                                    onClick={() => { setInput(s.title); }}
                                    className="rounded-xl bg-[#161b22] border border-[#21262d] p-3.5 text-left hover:border-[#30363d] hover:bg-[#161b22]/80 transition-all group"
                                >
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2.5" style={{ background: `${s.color}15`, border: `1px solid ${s.color}40` }}>
                                        <SuggestionIcon icon={s.icon} color={s.color} />
                                    </div>
                                    <p className="text-[12px] text-[#e6edf3] font-medium leading-snug mb-2">{s.title}</p>
                                    <p className="text-[10px] text-[#8b949e]">AI Confidence: {s.confidence}%</p>
                                    <p className="text-[10px] text-[#8b949e]">Est. time: {s.time}</p>
                                    <div className="flex items-center justify-end mt-2">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8b949e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:stroke-[#58a6ff] transition-colors">
                                            <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                                        </svg>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Recent conversations label */}
                    {messages.length <= 2 && (
                        <div className="flex items-center justify-center gap-2 text-[11px] text-[#8b949e] mb-4">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                            Your recent conversations
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /></svg>
                        </div>
                    )}

                    {/* Messages */}
                    {messages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                            {msg.role === "user" ? (
                                <div className="max-w-[70%] rounded-2xl bg-[#1f6feb]/20 border border-[#1f6feb]/30 px-4 py-2.5">
                                    <p className="text-[13px] text-[#e6edf3]">{msg.text}</p>
                                    <p className="text-[9px] text-[#8b949e] mt-1 text-right">{msg.time} ✓✓</p>
                                </div>
                            ) : (
                                <div className="max-w-[80%]">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-6 h-6 rounded-full bg-[#a371f7]/20 border border-[#a371f7]/40 flex items-center justify-center">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="#a371f7"><path d="M12 0L14 9L24 12L14 15L12 24L10 15L0 12L10 9Z" /></svg>
                                        </div>
                                        <span className="text-[12px] font-semibold text-[#e6edf3]">Tagent AI</span>
                                        <span className="text-[10px] text-[#8b949e]">{msg.time}</span>
                                    </div>
                                    <p className="text-[13px] text-[#e6edf3] mb-3">{msg.text}</p>

                                    {/* Root Cause Analysis card (for the demo message) */}
                                    {msg.analysis && <RootCauseCard />}

                                    {msg.analysis && (
                                        <p className="text-[13px] text-[#e6edf3] mt-3">Would you like me to recommend remediation actions?</p>
                                    )}

                                    {/* Reaction buttons */}
                                    <div className="flex items-center gap-2 mt-3">
                                        {["😊", "👍", "💬", "🔄"].map((emoji, j) => (
                                            <button key={j} className="w-7 h-7 rounded-md bg-[#161b22] border border-[#21262d] flex items-center justify-center text-[12px] hover:border-[#484f58] transition-colors">
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Input bar */}
                <div className="px-6 pb-4 pt-2 border-t border-[#21262d]">
                    <div className="relative">
                        <div className="flex items-center gap-2 rounded-xl bg-[#161b22] border border-[#30363d] px-4 py-3 focus-within:border-[#58a6ff]/50 transition-colors">
                            <button className="text-[#8b949e] hover:text-[#e6edf3] transition-colors shrink-0">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                            </button>
                            <input
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && handleSend()}
                                placeholder="Ask anything about your Kubernetes environment..."
                                className="flex-1 bg-transparent text-[13px] text-[#e6edf3] placeholder:text-[#6e7681] focus:outline-none"
                            />
                            <div className="flex items-center gap-2 shrink-0">
                                <button className="text-[#8b949e] hover:text-[#e6edf3]">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /></svg>
                                </button>
                                <span className="text-[10px] text-[#6e7681] font-mono">⌘ + ↵</span>
                                <button
                                    onClick={handleSend}
                                    className="w-9 h-9 rounded-full flex items-center justify-center text-white transition-all"
                                    style={{ background: input.trim() ? "linear-gradient(135deg, #7c3aed, #a855f7)" : "#21262d" }}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                                </button>
                            </div>
                        </div>
                        {/* Quick action chips */}
                        <div className="flex items-center gap-1.5 mt-2">
                            {QUICK_ACTIONS.map((a, i) => (
                                <button key={i} className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#161b22] border border-[#21262d] text-[10.5px] text-[#8b949e] hover:text-[#e6edf3] hover:border-[#484f58] transition-colors">
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /></svg>
                                    {a}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Context Sidebar */}
            {contextOpen && (
                <div className="w-[280px] border-l border-[#21262d] bg-[#161b22] overflow-y-auto shrink-0 hidden xl:block">
                    <div className="p-4 space-y-5">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <h3 className="text-[13px] font-semibold text-[#e6edf3]">Context</h3>
                            <button onClick={() => setContextOpen(false)} className="text-[#8b949e] hover:text-[#e6edf3] transition-colors">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                        </div>

                        {/* Current Incident */}
                        <div>
                            <h4 className="text-[11px] font-semibold text-[#8b949e] uppercase tracking-wider mb-2">Current Incident</h4>
                            <div className="rounded-md bg-[#0d1117] border border-[#21262d] p-2.5">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-[#f85149]" style={{ boxShadow: "0 0 4px #f85149" }} />
                                        <span className="text-[11px] text-[#e6edf3] font-mono font-semibold">INC-2487</span>
                                    </div>
                                    <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold" style={{ background: "rgba(248,81,73,0.15)", color: "#f85149" }}>High</span>
                                </div>
                                <p className="text-[11px] text-[#e6edf3] font-medium">Payment Service Memory Pressure</p>
                                <p className="text-[10px] text-[#8b949e] mt-0.5">Started 45m ago · Ongoing</p>
                            </div>
                        </div>

                        {/* Related Deployments */}
                        <div>
                            <h4 className="text-[11px] font-semibold text-[#8b949e] uppercase tracking-wider mb-2">Related Deployments</h4>
                            <div className="space-y-1.5">
                                {[
                                    { name: "payment-service", version: "v2.4.1 · 3 replicas", status: "Healthy", statusColor: "#3fb950" },
                                    { name: "checkout-service", version: "v2.4.0 · 5 replicas", status: "Healthy", statusColor: "#3fb950" },
                                ].map((d, i) => (
                                    <div key={i} className="flex items-center justify-between py-1.5">
                                        <div>
                                            <p className="text-[11px] text-[#e6edf3] font-medium">{d.name}</p>
                                            <p className="text-[9.5px] text-[#8b949e]">{d.version}</p>
                                        </div>
                                        <span className="text-[10px] font-semibold" style={{ color: d.statusColor }}>{d.status}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Active Alerts */}
                        <div>
                            <h4 className="text-[11px] font-semibold text-[#8b949e] uppercase tracking-wider mb-2">Active Alerts <span className="text-[#f85149] ml-1">2</span></h4>
                            <div className="space-y-2">
                                {[
                                    { title: "Memory usage high", sub: "payment-service · 45m", color: "#f85149" },
                                    { title: "GC frequency elevated", sub: "payment-service · 45m", color: "#f0883e" },
                                ].map((a, i) => (
                                    <div key={i} className="flex items-start gap-2">
                                        <span className="w-2 h-2 rounded-full mt-1 shrink-0" style={{ background: a.color, boxShadow: `0 0 4px ${a.color}` }} />
                                        <div>
                                            <p className="text-[11px] text-[#e6edf3] font-medium">{a.title}</p>
                                            <p className="text-[9.5px] text-[#8b949e]">{a.sub}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Related Services */}
                        <div>
                            <h4 className="text-[11px] font-semibold text-[#8b949e] uppercase tracking-wider mb-2">Related Services</h4>
                            <div className="space-y-1.5">
                                {[
                                    { name: "Checkout Service", latency: "p95: 312ms", color: "#58a6ff" },
                                    { name: "Order Service", latency: "p95: 120ms", color: "#58a6ff" },
                                    { name: "Notification Service", latency: "p95: 98ms", color: "#3fb950" },
                                    { name: "PostgreSQL", latency: "Healthy", color: "#3fb950" },
                                ].map((s, i) => (
                                    <div key={i} className="flex items-center justify-between py-1">
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
                                            <span className="text-[11px] text-[#e6edf3]">{s.name}</span>
                                        </div>
                                        <span className="text-[10px] text-[#8b949e] font-mono">{s.latency}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* AI Confidence */}
                        <div>
                            <h4 className="text-[11px] font-semibold text-[#8b949e] uppercase tracking-wider mb-2">AI Confidence</h4>
                            <div className="flex items-center gap-3">
                                <svg width="48" height="48" viewBox="0 0 48 48">
                                    <circle cx="24" cy="24" r="20" fill="none" stroke="#21262d" strokeWidth="4" />
                                    <circle cx="24" cy="24" r="20" fill="none" stroke="#a371f7" strokeWidth="4" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 20 * 0.96} ${2 * Math.PI * 20 * 0.04}`} transform="rotate(-90 24 24)" style={{ filter: "drop-shadow(0 0 3px #a371f7)" }} />
                                </svg>
                                <div>
                                    <p className="text-[18px] font-bold text-[#a371f7] font-mono">96%</p>
                                    <p className="text-[10px] text-[#3fb950]">High Confidence</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Context toggle button (when sidebar is closed) */}
            {!contextOpen && (
                <button
                    onClick={() => setContextOpen(true)}
                    className="hidden xl:flex w-10 border-l border-[#21262d] bg-[#161b22] items-center justify-center shrink-0 hover:bg-[#21262d] transition-colors"
                    title="Open context panel"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8b949e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                </button>
            )}
        </div>
    );
}

// ─── Root Cause Analysis Card ────────────────────────────────────────────────

function RootCauseCard() {
    return (
        <div className="rounded-xl bg-[#161b22] border border-[#21262d] p-4">
            <div className="flex items-center gap-2 mb-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f0883e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <span className="text-[13px] font-semibold text-[#e6edf3]">Root Cause Analysis</span>
            </div>

            <div className="grid grid-cols-[1fr_auto] gap-4">
                <div>
                    <p className="text-[11px] text-[#f85149] font-semibold mb-1">Root Cause</p>
                    <p className="text-[12px] text-[#e6edf3] leading-relaxed">Memory leak in payment processing module causing gradual memory accumulation.</p>

                    <p className="text-[11px] text-[#8b949e] font-semibold mt-3 mb-1">Evidence</p>
                    <ul className="space-y-1">
                        {[
                            "Memory usage increasing steadily for 45m",
                            "Heap dump shows uncollected objects",
                            "GC frequency increased by 4.2x",
                            "No traffic spike detected",
                        ].map((e, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-[11px] text-[#8b949e]">
                                <span className="text-[#a371f7] mt-0.5">◆</span>{e}
                            </li>
                        ))}
                    </ul>

                    <p className="text-[10px] text-[#8b949e] mt-3">First Detected <span className="text-[#e6edf3] ml-1">● 45 minutes ago</span></p>
                </div>

                <div className="space-y-3">
                    <div>
                        <p className="text-[10px] text-[#8b949e] mb-1">Confidence</p>
                        <div className="flex items-center gap-2">
                            <svg width="36" height="36" viewBox="0 0 36 36">
                                <circle cx="18" cy="18" r="14" fill="none" stroke="#21262d" strokeWidth="3" />
                                <circle cx="18" cy="18" r="14" fill="none" stroke="#a371f7" strokeWidth="3" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 14 * 0.94} ${2 * Math.PI * 14 * 0.06}`} transform="rotate(-90 18 18)" />
                            </svg>
                            <div>
                                <p className="text-[16px] font-bold text-[#e6edf3] font-mono">94%</p>
                                <p className="text-[9px] text-[#3fb950]">High</p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <p className="text-[10px] text-[#8b949e] mb-1">Impact</p>
                        <div className="space-y-1">
                            <p className="text-[10.5px]"><span className="text-[#f85149]">●</span> <span className="text-[#e6edf3]">Payment Service</span> <span className="text-[#f85149]">(High)</span></p>
                            <p className="text-[10.5px]"><span className="text-[#f0883e]">●</span> <span className="text-[#e6edf3]">Checkout Service</span> <span className="text-[#f0883e]">(Medium)</span></p>
                            <p className="text-[10.5px]"><span className="text-[#3fb950]">●</span> <span className="text-[#e6edf3]">Notification Service</span> <span className="text-[#3fb950]">(Low)</span></p>
                        </div>
                    </div>

                    <p className="text-[10px] text-[#8b949e]">Status <span className="text-[#f0883e] ml-1">● Ongoing</span></p>
                </div>
            </div>
        </div>
    );
}

// ─── Suggestion Icons ────────────────────────────────────────────────────────

function SuggestionIcon({ icon, color }: { icon: string; color: string }) {
    const props = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
    if (icon === "search") return (<svg {...props}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>);
    if (icon === "analyze") return (<svg {...props}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="8" y1="11" x2="14" y2="11" /><line x1="11" y1="8" x2="11" y2="14" /></svg>);
    if (icon === "db") return (<svg {...props}><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" /><path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3" /></svg>);
    if (icon === "deploy") return (<svg {...props}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>);
    // scale
    return (<svg {...props}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>);
}

// ─── History Sidebar Icons ───────────────────────────────────────────────────

function HistoryIcon({ icon, active }: { icon: string; active: boolean }) {
    const color = active ? "#a371f7" : "#8b949e";
    const props = { width: 14, height: 14, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
    if (icon === "incident") return (<svg {...props}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>);
    if (icon === "search") return (<svg {...props}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>);
    if (icon === "deploy") return (<svg {...props}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33" /></svg>);
    if (icon === "db") return (<svg {...props}><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" /></svg>);
    if (icon === "cost") return (<svg {...props}><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>);
    if (icon === "blast") return (<svg {...props}><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>);
    if (icon === "doc") return (<svg {...props}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>);
    if (icon === "scale") return (<svg {...props}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>);
    if (icon === "network") return (<svg {...props}><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10" /></svg>);
    // default
    return (<svg {...props}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>);
}
