"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Nav } from "@/components/Nav";
import { TopBar } from "@/components/TopBar";

// Routes that don't show the Nav/TopBar shell
const STANDALONE_ROUTES = ["/setup", "/access"];

export function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [checked, setChecked] = useState(false);

    const isStandalone = STANDALONE_ROUTES.some(r => pathname.startsWith(r));

    useEffect(() => {
        // Skip auth check for standalone routes
        if (isStandalone) {
            setChecked(true);
            return;
        }

        // Check if setup is complete
        const setupComplete = localStorage.getItem("tagent_setup_complete");
        if (!setupComplete) {
            router.replace("/setup");
            return;
        }

        setChecked(true);
    }, [pathname, router, isStandalone]);

    // Standalone pages (setup, access) render without Nav/TopBar
    if (isStandalone) {
        return <>{children}</>;
    }

    // Wait for auth check before rendering dashboard
    if (!checked) return null;

    // Normal dashboard layout with Nav + TopBar
    return (
        <div className="flex h-screen overflow-hidden relative">
            <Nav />
            <div className="flex-1 flex flex-col overflow-hidden relative z-[1]">
                <TopBar />
                <main className="flex-1 flex flex-col overflow-hidden">
                    {children}
                </main>
            </div>
        </div>
    );
}
