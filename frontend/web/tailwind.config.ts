import type { Config } from "tailwindcss";

const config: Config = {
    content: ["./src/**/*.{ts,tsx}"],
    theme: {
        extend: {
            colors: {
                bg: "rgb(var(--bg) / <alpha-value>)",
                elevated: "rgb(var(--bg-elevated) / <alpha-value>)",
                overlay: "rgb(var(--bg-overlay) / <alpha-value>)",
                border: "rgb(var(--border) / <alpha-value>)",
                "border-strong": "rgb(var(--border-strong) / <alpha-value>)",
                fg: "rgb(var(--fg) / <alpha-value>)",
                "fg-muted": "rgb(var(--fg-muted) / <alpha-value>)",
                "fg-subtle": "rgb(var(--fg-subtle) / <alpha-value>)",
                accent: "rgb(var(--accent) / <alpha-value>)",
                warn: "rgb(var(--warn) / <alpha-value>)",
                crit: "rgb(var(--crit) / <alpha-value>)",
                info: "rgb(var(--info) / <alpha-value>)",
            },
            fontFamily: {
                sans: ["var(--font-sans)", "ui-sans-serif", "system-ui"],
                mono: ["var(--font-mono)", "ui-monospace", "Menlo", "Consolas"],
            },
            fontSize: {
                "2xs": ["0.6875rem", { lineHeight: "1rem", letterSpacing: "0.01em" }],
            },
            boxShadow: {
                card: "0 1px 0 0 rgb(var(--border) / 1)",
                elevated: "0 1px 2px 0 rgba(0,0,0,0.4), 0 0 0 1px rgb(var(--border) / 1)",
                glow: "0 0 0 1px rgba(34,197,94,0.3), 0 0 20px -4px rgba(34,197,94,0.2)",
            },
            animation: {
                "fade-in": "fade-in 0.2s ease-out",
                "slide-up": "slide-up 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
            },
            keyframes: {
                "fade-in": {
                    "0%": { opacity: "0" },
                    "100%": { opacity: "1" },
                },
                "slide-up": {
                    "0%": { opacity: "0", transform: "translateY(8px)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
            },
        },
    },
    plugins: [],
};

export default config;
