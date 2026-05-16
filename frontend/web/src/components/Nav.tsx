"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard, Server, Network, AlertTriangle, Activity,
    ScrollText, ShieldAlert, MessageSquare, Video, Wrench,
    Moon, BookOpen, FileText, Settings,
} from "lucide-react";

const links = [
    {
        group: "Overview", items: [
            { href: "/", icon: LayoutDashboard, label: "Dashboard" },
            { href: "/clusters", icon: Server, label: "Clusters" },
            { href: "/topology", icon: Network, label: "Topology" },
        ]
    },
    {
        group: "Observe", items: [
            { href: "/incidents", icon: AlertTriangle, label: "Incidents" },
            { href: "/metrics", icon: Activity, label: "Metrics" },
            { href: "/logs", icon: ScrollText, label: "Logs" },
            { href: "/risks", icon: ShieldAlert, label: "Risk Scanner" },
        ]
    },
    {
        group: "Respond", items: [
            { href: "/ai", icon: MessageSquare, label: "AI Chat" },
            { href: "/briefing", icon: Video, label: "Video Briefing" },
            { href: "/remediation", icon: Wrench, label: "Remediation" },
            { href: "/night-guardian", icon: Moon, label: "Night Guardian" },
        ]
    },
    {
        group: "Learn", items: [
            { href: "/knowledge", icon: BookOpen, label: "Knowledge" },
            { href: "/reports", icon: FileText, label: "Reports" },
        ]
    },
];

export function Nav() {
    const path = usePathname();
    return (
        <aside className="w-52 bg-[#0c0c0f] border-r border-zinc-800/60 flex flex-col shrink-0">
            <div className="h-14 flex items-center px-5 border-b border-zinc-800/60">
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-emerald-500/10 flex items-center justify-center">
                        <span className="text-emerald-400 font-mono text-[11px] font-bold">T</span>
                    </div>
                    <span className="text-[13px] font-semibold text-zinc-100">Tagent</span>
                </Link>
            </div>
            <nav className="flex-1 overflow-y-auto scrollbar py-4 px-3 space-y-5">
                {links.map((g) => (
                    <div key={g.group}>
                        <p className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                            {g.group}
                        </p>
                        {g.items.map((l) => {
                            const active = path === l.href || (l.href !== "/" && path.startsWith(l.href));
                            return (
                                <Link key={l.href} href={l.href} className={cn(
                                    "flex items-center gap-2.5 px-2 py-[6px] rounded-md text-[13px] transition-colors",
                                    active ? "bg-emerald-500/10 text-emerald-400 font-medium" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                                )}>
                                    <l.icon className="w-[15px] h-[15px]" strokeWidth={active ? 2 : 1.5} />
                                    {l.label}
                                </Link>
                            );
                        })}
                    </div>
                ))}
            </nav>
            <div className="px-5 py-3 border-t border-zinc-800/60">
                <Link href="/settings" className="flex items-center gap-2.5 text-[13px] text-zinc-400 hover:text-zinc-200">
                    <Settings className="w-[15px] h-[15px]" strokeWidth={1.5} />
                    Settings
                </Link>
                <div className="flex items-center gap-1.5 mt-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] text-zinc-500 font-mono">us-east-1 · connected</span>
                </div>
            </div>
        </aside>
    );
}
