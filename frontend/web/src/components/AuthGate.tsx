"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

// ─── Auth Gate ───────────────────────────────────────────────────────────────
// Checks if setup is complete. If not, redirects to /setup.
// Public routes (setup, access) bypass this check.

const PUBLIC_ROUTES = ["/setup", "/access"];

export function AuthGate({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [ready, setReady] = useState(false);

    useEffect(() => {
        // Skip auth check for public routes
        if (PUBLIC_ROUTES.some(r => pathname.startsWith(r))) {
            setReady(true);
            return;
        }

        // Check if setup is complete
        const setupComplete = localStorage.getItem("tagent_setup_complete");
        if (!setupComplete) {
            router.replace("/setup");
            return;
        }

        setReady(true);
    }, [pathname, router]);

    if (!ready) return null;
    return <>{children}</>;
}

// ─── Helper: Get current user info ──────────────────────────────────────────

export function getCurrentUser(): { name: string; email: string; company: string; role: string; isAdmin: boolean } | null {
    if (typeof window === "undefined") return null;

    // Check if there's a user session (from unique link access)
    const userStr = localStorage.getItem("tagent_current_user");
    if (userStr) {
        return JSON.parse(userStr);
    }

    // Fall back to admin
    const adminStr = localStorage.getItem("tagent_admin");
    if (adminStr) {
        return { ...JSON.parse(adminStr), isAdmin: true };
    }

    return null;
}

export function isAdmin(): boolean {
    const user = getCurrentUser();
    return user?.isAdmin === true;
}
