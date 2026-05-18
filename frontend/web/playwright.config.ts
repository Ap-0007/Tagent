import { defineConfig, devices } from "@playwright/test";

const VIEWPORT_WIDTH = parseInt(process.env.VIEWPORT_WIDTH || "1440");
const VIEWPORT_HEIGHT = parseInt(process.env.VIEWPORT_HEIGHT || "900");

export default defineConfig({
    testDir: "./tests",
    outputDir: "./test-results",
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 2 : undefined,
    reporter: process.env.CI ? [["html"], ["github"]] : [["html"]],
    use: {
        baseURL: "http://localhost:3000",
        trace: "on-first-retry",
        screenshot: "on",
        video: "on-first-retry",
        viewport: { width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT },
        colorScheme: "dark",
    },
    projects: [
        { name: "chromium", use: { ...devices["Desktop Chrome"] } },
        { name: "firefox", use: { ...devices["Desktop Firefox"] } },
        { name: "mobile-chrome", use: { ...devices["Pixel 5"] } },
        { name: "mobile-safari", use: { ...devices["iPhone 13"] } },
    ],
});
