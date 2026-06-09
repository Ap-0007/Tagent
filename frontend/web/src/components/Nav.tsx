"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard, Server, Network, AlertTriangle, Activity,
    ScrollText, ShieldAlert, MessageSquare, Video, Wrench,
    Moon, BookOpen, FileText, Settings, GitBranch, DollarSign,
    Zap, ClipboardList, Terminal, Box, Scaling, Bell, User,
    HardDrive, Cpu,
} from "lucide-react";

const links = [
    {
        group: "Infrastructure", items: [
            { href: "/", icon: LayoutDashboard, label: "Dashboard" },
            { href: "/clusters", icon: Server, label: "Clusters" },
            { href: "/nodes", icon: HardDrive, label: "Nodes" },
            { href: "/pods", icon: Box, label: "Workloads" },
            { href: "/deployments", icon: GitBranch, label: "Deployments" },
            { href: "/topology", icon: Network, label: "Service Graph" },
        ]
    },
    {
        group: "Intelligence", items: [
            { href: "/incidents", icon: AlertTriangle, label: "Incidents", badge: 12 },
            { href: "/ai", icon: MessageSquare, label: "AI Insights" },
            { href: "/models", icon: Cpu, label: "AI Models" },
            { href: "/risks", icon: ShieldAlert, label: "Risk Scanner" },
            { href: "/reports", icon: BookOpen, label: "Knowledge" },
            { href: "/metrics", icon: Activity, label: "Metrics" },
        ]
    },
    {
        group: "Recovery", items: [
            { href: "/remediation", icon: Wrench, label: "Remediation" },
            { href: "/night-guardian", icon: Moon, label: "Night Guardian" },
            { href: "/autoscaling", icon: Cpu, label: "Runbooks" },
            { href: "/cost", icon: DollarSign, label: "Automation" },
        ]
    },
    {
        group: "Operations", items: [
            { href: "/logs", icon: Bell, label: "Alerts", badge: 3 },
            { href: "/briefing", icon: User, label: "On-call" },
            { href: "/cost", icon: FileText, label: "Reports" },
            { href: "/integrations", icon: Settings, label: "Integrations" },
            { href: "/admin/users", icon: User, label: "User Management", adminOnly: true },
        ]
    },
];

export function Nav() {
    const path = usePathname();
    const [admin, setAdmin] = useState<{ name: string; role: string } | null>(null);
    const [isAdminUser, setIsAdminUser] = useState(true);

    useEffect(() => {
        const data = localStorage.getItem("tagent_admin");
        if (data) {
            const parsed = JSON.parse(data);
            setAdmin({ name: parsed.name, role: parsed.role });
        }
        // Check if current session is admin (not a user via unique link)
        const currentUser = localStorage.getItem("tagent_current_user");
        if (currentUser) {
            const user = JSON.parse(currentUser);
            setIsAdminUser(user.isAdmin === true);
        } else {
            // No current_user means they're the admin (accessed directly)
            setIsAdminUser(true);
        }
    }, []);
    return (
        <aside className="w-[200px] bg-navy-900/90 backdrop-blur-xl border-r border-[rgba(59,130,246,0.06)] flex flex-col shrink-0 relative z-10">
            {/* Logo */}
            <div className="px-4 py-3 border-b border-[rgba(59,130,246,0.06)]">
                <Link href="/" className="flex items-center gap-2.5">
                    <img src="/logo.png" alt="Tagent" width={32} height={32} className="rounded-lg" />
                    <div>
                        <span className="text-sm font-semibold text-slate-100 tracking-tight">Tagent</span>
                        <p className="text-[9px] text-slate-500">AI Operations Command</p>
                    </div>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto scrollbar py-3 px-2.5 space-y-1">
                {links.map((g, gi) => (
                    <div key={gi} className={g.group ? "mt-4" : gi > 0 ? "mt-2 pt-2 border-t border-[rgba(59,130,246,0.05)]" : ""}>
                        {g.group && (
                            <p className="px-2.5 mb-1.5 text-[9px] font-semibold uppercase tracking-[0.15em] text-slate-600">
                                {g.group}
                            </p>
                        )}
                        <div className="space-y-0.5">
                            {g.items.map((l) => {
                                const active = path === l.href || (l.href !== "/" && path.startsWith(l.href));
                                return (
                                    <Link key={l.href} href={l.href} className={cn(
                                        "flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] transition-all duration-200 group relative",
                                        active
                                            ? "bg-blue-500/10 text-blue-300 font-medium"
                                            : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]"
                                    )}>
                                        {active && (
                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-blue-400" style={{ boxShadow: "0 0 8px rgba(59,130,246,0.5)" }} />
                                        )}
                                        <l.icon className={cn(
                                            "w-4 h-4 transition-colors shrink-0",
                                            active ? "text-blue-400" : "text-slate-500 group-hover:text-slate-400"
                                        )} strokeWidth={active ? 2 : 1.5} />
                                        <span className="truncate">{l.label}</span>
                                        {"badge" in l && l.badge && (
                                            <span className={cn(
                                                "ml-auto w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0",
                                                l.badge > 5
                                                    ? "bg-red-500/20 border border-red-500/30 text-red-400"
                                                    : "bg-amber-500/20 border border-amber-500/30 text-amber-400"
                                            )}>
                                                {l.badge}
                                            </span>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Bottom - User */}
            <div className="px-3 py-3 border-t border-[rgba(59,130,246,0.06)] space-y-2.5">

                {/* User */}
                <div className="flex items-center gap-2.5 px-2 py-1.5">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 border border-blue-500/20 flex items-center justify-center">
                        <User className="w-3.5 h-3.5 text-blue-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-300 font-medium truncate">{admin?.name || "Admin"}</p>
                        <p className="text-[9px] text-slate-500">{admin?.role || "Administrator"}</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
