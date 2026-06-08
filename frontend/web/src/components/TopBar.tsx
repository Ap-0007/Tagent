"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Search, Bell, Radio, ChevronDown, Clock } from "lucide-react";

const pageTitles: Record<string, { title: string; description: string; aiBadge?: boolean }> = {
    "/": { title: "Dashboard", description: "AI-powered Kubernetes incident intelligence, operational insights, and autonomous remediation." },
    "/incidents": { title: "Incident Intelligence", description: "AI-powered analysis, root cause detection, and automated remediation for Kubernetes environments." },
    "/clusters": { title: "Cluster Intelligence Center", description: "Real-time Kubernetes fleet visibility, AI health analysis, incident intelligence, and autonomous operations.", aiBadge: false },
    "/topology": { title: "Service Graph", description: "Live service relationships, AI analysis, failure propagation, and operational health.", aiBadge: false },
    "/ai": { title: "Tagent AI", description: "Your Kubernetes assistant with real-time infrastructure awareness." },
    "/metrics": { title: "Metrics Intelligence", description: "Correlating telemetry, identifying patterns, and predicting outcomes." },
    "/remediation": { title: "AI Remediation Center", description: "AI-powered recovery and autonomous remediation for Kubernetes infrastructure." },
    "/night-guardian": { title: "Night Guardian — Autonomous Protection", description: "Watching 47 services · Monitoring 312 pods · Last analysis 12 seconds ago" },
    "/nodes": { title: "Infrastructure Compute Layer", description: "Real-time Kubernetes node telemetry, AI health analysis, and workload intelligence." },
    "/pods": { title: "Workload Intelligence", description: "Real-time Kubernetes workload health, AI analysis, and operational insights.", aiBadge: true },
    "/deployments": { title: "Deployment Intelligence", description: "Real-time rollout visibility, workload health analysis, AI deployment risk detection, and operational intelligence.", aiBadge: true },
    "/autoscaling": { title: "Autonomous Scaling Intelligence", description: "Real-time workload elasticity, predictive scaling analysis, capacity forecasting, and AI optimization." },
    "/cost": { title: "Cloud Cost Intelligence", description: "Real-time Kubernetes cost visibility, AI optimization insights, resource efficiency analysis, and infrastructure forecasting." },
    "/logs": { title: "Log Investigation", description: "AI-assisted log analysis and intelligent incident investigation." },
    "/risks": { title: "Infrastructure Risk Intelligence", description: "Predicting operational failures before they impact production." },
    "/chaos": { title: "Chaos Testing", description: "Controlled failure injection experiments." },
    "/briefing": { title: "Video Briefing", description: "AI-generated incident video summaries." },
    "/knowledge": { title: "Knowledge", description: "Operational knowledge base and runbooks." },
    "/reports": { title: "AI Incident Knowledge Center", description: "AI-generated postmortems, learnings and operational intelligence from every incident." },
    "/audit": { title: "Audit Log", description: "System activity and change tracking." },
    "/settings": { title: "Settings", description: "Platform configuration and preferences." },
    "/integrations": { title: "Integrations Command Center", description: "Configure, test and manage all your notification and escalation integrations." },
    "/admin/users": { title: "User Management", description: "Create and manage team members who can access this dashboard." },
};

export function TopBar() {
    const pathname = usePathname();
    const page = pageTitles[pathname] || pageTitles["/"];
    const [notifOpen, setNotifOpen] = useState(false);
    const [adminInitial, setAdminInitial] = useState("A");

    // Read admin name for avatar
    if (typeof window !== "undefined") {
        const data = localStorage.getItem("tagent_admin");
        if (data) {
            const parsed = JSON.parse(data);
            const initial = parsed.name ? parsed.name.charAt(0).toUpperCase() : "A";
            if (initial !== adminInitial) setAdminInitial(initial);
        }
    }

    return (
        <header className="h-14 border-b border-[rgba(59,130,246,0.06)] bg-navy-900/30 backdrop-blur-md flex items-center justify-between px-5 shrink-0 relative z-10">
            {/* Left: Page title */}
            <div className="flex items-center gap-2.5 min-w-0">
                <h1 className="text-[15px] font-semibold text-slate-100 whitespace-nowrap">{page.title}</h1>
                {page.aiBadge && (
                    <span
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold text-white shrink-0"
                        style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
                    >
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5Z" />
                        </svg>
                        AI
                    </span>
                )}
                <span className="text-2xs text-slate-500 hidden lg:block truncate max-w-[400px]">{page.description}</span>
            </div>

            {/* Center: Search */}
            <div className="flex items-center gap-3 mx-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search anything..."
                        className="search-input w-52 lg:w-64 h-8 pl-9 pr-12 rounded-lg text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none"
                    />
                    <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-2xs text-slate-600 bg-navy-700/50 px-1.5 py-0.5 rounded border border-[rgba(59,130,246,0.1)]">⌘K</kbd>
                </div>
            </div>

            {/* Right: Controls */}
            <div className="flex items-center gap-2.5 shrink-0">
                {/* Environment */}
                <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-navy-800/50 border border-[rgba(59,130,246,0.08)] text-xs cursor-pointer hover:border-[rgba(59,130,246,0.2)] transition-colors">
                    <span className="text-slate-500 text-2xs">Environment</span>
                    <span className="text-slate-200 font-medium text-2xs">Production</span>
                    <ChevronDown className="w-3 h-3 text-slate-500" />
                </div>

                {/* Cluster */}
                <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-navy-800/50 border border-[rgba(59,130,246,0.08)] text-xs cursor-pointer hover:border-[rgba(59,130,246,0.2)] transition-colors">
                    <span className="text-slate-500 text-2xs">Cluster</span>
                    <span className="text-slate-200 font-medium font-mono text-2xs">prod-cluster-01</span>
                    <ChevronDown className="w-3 h-3 text-slate-500" />
                </div>

                {/* Time range */}
                <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-navy-800/50 border border-[rgba(59,130,246,0.08)] text-2xs text-slate-400 cursor-pointer hover:border-[rgba(59,130,246,0.2)] transition-colors">
                    <Clock className="w-3 h-3" />
                    <span>Last 15m</span>
                </div>

                {/* Live indicator */}
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <Radio className="w-3 h-3 text-emerald-400 animate-pulse-glow" />
                    <span className="text-2xs text-emerald-400 font-semibold">Live</span>
                </div>

                {/* Notifications */}
                <div className="relative">
                    <button
                        onClick={() => setNotifOpen(o => !o)}
                        className="relative w-8 h-8 rounded-lg bg-navy-800/40 border border-[rgba(59,130,246,0.08)] flex items-center justify-center hover:bg-navy-700/40 hover:border-[rgba(59,130,246,0.2)] transition-colors"
                    >
                        <Bell className="w-4 h-4 text-slate-400" />
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 border-2 border-navy-900 flex items-center justify-center text-[8px] text-white font-bold">12</span>
                    </button>

                    {/* Notification Panel */}
                    {notifOpen && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                            <div className="absolute top-full mt-2 right-0 z-50 w-[360px] rounded-xl border border-[rgba(59,130,246,0.15)] shadow-[0_16px_48px_rgba(0,0,0,0.6)]" style={{ background: "rgba(15, 26, 53, 0.95)", backdropFilter: "blur(16px)" }}>
                                {/* Header */}
                                <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(59,130,246,0.08)]">
                                    <h3 className="text-[13px] font-semibold text-slate-100">Notifications</h3>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-slate-500">12 unread</span>
                                        <button onClick={() => setNotifOpen(false)} className="text-slate-500 hover:text-slate-200">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                        </button>
                                    </div>
                                </div>
                                {/* Notifications list */}
                                <div className="max-h-[400px] overflow-y-auto">
                                    {[
                                        { title: "Critical: Payment Service Error Rate", sub: "Error rate exceeded 5% threshold", time: "2m ago", color: "#f85149", unread: true },
                                        { title: "High: Database Connection Saturation", sub: "Connection pool at 92% capacity", time: "5m ago", color: "#f0883e", unread: true },
                                        { title: "Remediation Executed", sub: "Scaled connection pool 50 → 120", time: "7m ago", color: "#3fb950", unread: true },
                                        { title: "AI Analysis Complete", sub: "Root cause identified: pool exhaustion", time: "8m ago", color: "#a371f7", unread: true },
                                        { title: "Warning: Memory Pressure", sub: "user-service at 85% memory usage", time: "12m ago", color: "#f0883e", unread: true },
                                        { title: "Deployment Completed", sub: "api-gateway v3.1.0 rolled out successfully", time: "18m ago", color: "#3fb950", unread: false },
                                        { title: "Scaling Event", sub: "AI Engine scaled from 3 to 6 replicas", time: "22m ago", color: "#58a6ff", unread: false },
                                        { title: "Night Guardian Report", sub: "All systems healthy, 0 issues detected", time: "30m ago", color: "#3fb950", unread: false },
                                        { title: "Cost Alert", sub: "Daily spend 12% above forecast", time: "45m ago", color: "#f0883e", unread: false },
                                        { title: "Certificate Renewal", sub: "SSL cert renewed for api.tagent.io", time: "1h ago", color: "#58a6ff", unread: false },
                                        { title: "Incident Resolved", sub: "INC-48289 auto-resolved by AI", time: "2h ago", color: "#3fb950", unread: false },
                                        { title: "New Integration", sub: "Slack integration connected", time: "3h ago", color: "#58a6ff", unread: false },
                                    ].map((n, i) => (
                                        <div key={i} className={`flex items-start gap-3 px-4 py-2.5 border-b border-[rgba(59,130,246,0.05)] hover:bg-white/[0.02] transition-colors cursor-pointer ${n.unread ? "bg-blue-500/[0.03]" : ""}`}>
                                            <span className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: n.color, boxShadow: `0 0 4px ${n.color}` }} />
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-[11.5px] leading-snug ${n.unread ? "text-slate-100 font-semibold" : "text-slate-300"}`}>{n.title}</p>
                                                <p className="text-[10px] text-slate-500 mt-0.5">{n.sub}</p>
                                            </div>
                                            <span className="text-[9px] text-slate-600 font-mono shrink-0 mt-0.5">{n.time}</span>
                                        </div>
                                    ))}
                                </div>
                                {/* Footer */}
                                <div className="px-4 py-2.5 border-t border-[rgba(59,130,246,0.08)] flex items-center justify-between">
                                    <button className="text-[10px] text-blue-400 hover:text-blue-300 font-medium">Mark all as read</button>
                                    <a href="/logs" className="text-[10px] text-blue-400 hover:text-blue-300 font-medium">View all notifications →</a>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/40 to-purple-500/40 border border-blue-500/30 flex items-center justify-center cursor-pointer hover:border-blue-500/50 transition-colors">
                    <span className="text-xs text-blue-200 font-semibold">{adminInitial}</span>
                </div>
            </div>
        </header>
    );
}
