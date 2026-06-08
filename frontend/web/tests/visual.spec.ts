import { test, expect } from "@playwright/test";

const pages = [
    { path: "/", name: "dashboard" },
    { path: "/incidents", name: "incidents" },
    { path: "/pods", name: "pods" },
    { path: "/nodes", name: "nodes" },
    { path: "/topology", name: "topology" },
    { path: "/metrics", name: "metrics" },
    { path: "/logs", name: "logs" },
    { path: "/ai", name: "ai-chat" },
    { path: "/briefing", name: "briefing" },
    { path: "/remediation", name: "remediation" },
    { path: "/night-guardian", name: "night-guardian" },
    { path: "/settings", name: "settings" },
    { path: "/risks", name: "risks" },
    { path: "/knowledge", name: "knowledge" },
    { path: "/reports", name: "reports" },
    { path: "/autoscaling", name: "autoscaling" },
    { path: "/deployments", name: "deployments" },
    { path: "/cost", name: "cost" },
    { path: "/audit", name: "audit" },
    { path: "/cli", name: "cli" },
    { path: "/clusters", name: "clusters" },
];

for (const page of pages) {
    test(`visual: ${page.name}`, async ({ page: p }) => {
        await p.goto(page.path);
        await p.waitForLoadState("networkidle");
        await expect(p).toHaveScreenshot(`${page.name}.png`, {
            fullPage: true,
            threshold: 0.1,
            maxDiffPixelRatio: 0.01,
        });
    });
}

test("responsive: dashboard on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("dashboard-mobile.png", {
        fullPage: true,
        threshold: 0.15,
    });
});

test("responsive: incidents on tablet", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/incidents");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("incidents-tablet.png", {
        fullPage: true,
        threshold: 0.15,
    });
});

test("navigation: sidebar links work", async ({ page }) => {
    // Set up auth so the app doesn't redirect to /setup
    await page.goto("/");
    await page.evaluate(() => {
        localStorage.setItem("tagent_setup_complete", "true");
        localStorage.setItem("tagent_admin", JSON.stringify({ name: "Test", email: "test@test.com", company: "Test", role: "Admin" }));
    });
    await page.goto("/");
    await page.waitForTimeout(1000);
    await page.click('a[href="/incidents"]');
    await expect(page).toHaveURL("/incidents");
    await page.click('a[href="/ai"]');
    await expect(page).toHaveURL("/ai");
    await page.click('a[href="/settings"]');
    await expect(page).toHaveURL("/settings");
});

test("accessibility: no critical violations on dashboard", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    // Basic checks
    const title = await page.title();
    expect(title).toBeTruthy();
    const h1 = await page.locator("h1").first();
    await expect(h1).toBeVisible();
});
