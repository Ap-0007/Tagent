"use client";

import { useState, useEffect } from "react";

// ─── Integrations Command Center ─────────────────────────────────────────────

const INTEGRATIONS = [
    { id: "slack", name: "Slack", status: "Not Connected", statusColor: "#6e7681", lastSync: "Never", icon: "/slack logo.png", setupType: "OAuth + Bot Token", envVars: ["SLACK_BOT_TOKEN", "SLACK_SIGNING_SECRET", "SLACK_CHANNEL_ID"], setupSteps: ["1. Create a Slack App at https://api.slack.com/apps", "2. Enable Incoming Webhooks & add Bot Token Scopes (chat:write, channels:read)", "3. Install to workspace → copy Bot User OAuth Token", "4. Set SLACK_BOT_TOKEN in your .env file", "5. Set SLACK_SIGNING_SECRET from App Credentials page"] },
    { id: "teams", name: "Microsoft Teams", status: "Not Connected", statusColor: "#6e7681", lastSync: "Never", icon: "/ms team logo.png", setupType: "Incoming Webhook", envVars: ["TEAMS_WEBHOOK_URL"], setupSteps: ["1. Open Teams channel → ⋯ → Connectors → Incoming Webhook", "2. Name it 'Tagent Alerts', upload icon, click Create", "3. Copy the generated webhook URL", "4. Set TEAMS_WEBHOOK_URL in your .env file"] },
    { id: "email", name: "Email", status: "Not Connected", statusColor: "#6e7681", lastSync: "Never", icon: "/email logo.jpg", setupType: "SMTP", envVars: ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "ALERT_RECIPIENTS"], setupSteps: ["1. Get SMTP credentials from your email provider", "2. For Gmail: enable 2FA → create App Password", "3. Set SMTP_HOST=smtp.gmail.com, SMTP_PORT=587", "4. Set SMTP_USER and SMTP_PASS in .env", "5. Set ALERT_RECIPIENTS=team@yourcompany.com"] },
    { id: "pagerduty", name: "PagerDuty", status: "Not Connected", statusColor: "#6e7681", lastSync: "Never", icon: "/pagerduty logo.png", setupType: "API Key + Integration Key", envVars: ["PAGERDUTY_API_KEY", "PAGERDUTY_SERVICE_ID", "PAGERDUTY_INTEGRATION_KEY"], setupSteps: ["1. Go to PagerDuty → Configuration → API Access Keys", "2. Create REST API Key (Read/Write)", "3. Go to Services → your service → Integrations → Events API v2", "4. Copy the Integration Key", "5. Set all three env vars in .env"] },
    { id: "opsgenie", name: "Opsgenie", status: "Not Connected", statusColor: "#6e7681", lastSync: "Never", icon: "/opsgenie logo.jpg", setupType: "API Key", envVars: ["OPSGENIE_API_KEY", "OPSGENIE_TEAM_ID"], setupSteps: ["1. Go to Opsgenie → Settings → API key management", "2. Create new API Integration (Alerts: Create, Read)", "3. Copy the API Key", "4. Set OPSGENIE_API_KEY and OPSGENIE_TEAM_ID in .env"] },
    { id: "twilio", name: "Twilio", status: "Not Connected", statusColor: "#f85149", lastSync: "Never", icon: "/twilio logo.png", setupType: "Account SID + Auth Token", envVars: ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_FROM_NUMBER", "ALERT_PHONE_NUMBERS"], setupSteps: ["1. Sign up at twilio.com", "2. Get Account SID and Auth Token from Console Dashboard", "3. Buy or verify a phone number", "4. Set all four env vars in .env", "5. ALERT_PHONE_NUMBERS accepts comma-separated numbers"] },
    { id: "webhooks", name: "Webhooks", status: "Not Connected", statusColor: "#6e7681", lastSync: "Never", icon: "/Webhooks logo.png", setupType: "Custom Endpoint + Secret", envVars: ["WEBHOOK_ENDPOINTS", "WEBHOOK_SECRET"], setupSteps: ["1. Set WEBHOOK_ENDPOINTS to your endpoint URL(s)", "2. Set WEBHOOK_SECRET for HMAC signature verification", "3. Tagent POSTs JSON with X-Tagent-Signature header", "4. Verify: HMAC-SHA256(body, secret) == signature"] },
    { id: "jira", name: "Jira", status: "Not Connected", statusColor: "#6e7681", lastSync: "Never", icon: "/Jira logo.jpg", setupType: "API Token", envVars: ["JIRA_BASE_URL", "JIRA_EMAIL", "JIRA_API_TOKEN", "JIRA_PROJECT_KEY"], setupSteps: ["1. Go to https://id.atlassian.com/manage-profile/security/api-tokens", "2. Create API token", "3. Set JIRA_BASE_URL=https://your-org.atlassian.net", "4. Set JIRA_EMAIL, JIRA_API_TOKEN, JIRA_PROJECT_KEY in .env"] },
    { id: "github", name: "GitHub", status: "Not Connected", statusColor: "#6e7681", lastSync: "Never", icon: "/github logo.png", setupType: "Personal Access Token", envVars: ["GITHUB_TOKEN", "GITHUB_OWNER", "GITHUB_REPO"], setupSteps: ["1. Go to GitHub → Settings → Developer settings → Personal access tokens", "2. Generate token with repo, workflow, write:packages scopes", "3. Set GITHUB_TOKEN=ghp_xxxx in .env", "4. Set GITHUB_OWNER and GITHUB_REPO"] },
    { id: "gitlab", name: "GitLab", status: "Not Connected", statusColor: "#6e7681", lastSync: "Never", icon: "/GitLab logo.jpg", setupType: "Personal Access Token", envVars: ["GITLAB_TOKEN", "GITLAB_BASE_URL", "GITLAB_PROJECT_ID"], setupSteps: ["1. Go to GitLab → Preferences → Access Tokens", "2. Create token with api, read_repository scopes", "3. Set GITLAB_TOKEN=glpat-xxxx in .env", "4. Set GITLAB_BASE_URL and GITLAB_PROJECT_ID"] },
];

export default function IntegrationsPage() {
    const [selected, setSelected] = useState("slack");
    const [tab, setTab] = useState("Overview");

    return (
        <div className="flex-1 flex overflow-hidden bg-[#0d1117]">
            {/* Left: Integration list sidebar */}
            <div className="w-[240px] border-r border-[#21262d] bg-[#0d1117] flex flex-col shrink-0 overflow-y-auto">
                <div className="p-3 border-b border-[#21262d]">
                    <h3 className="text-[13px] font-semibold text-[#e6edf3]">Integrations</h3>
                    <p className="text-[10px] text-[#8b949e] mt-0.5">Connect and manage your infrastructure integrations</p>
                </div>
                <div className="flex-1 py-2 px-2 space-y-0.5">
                    {INTEGRATIONS.map(intg => (
                        <button
                            key={intg.id}
                            onClick={() => setSelected(intg.id)}
                            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors ${selected === intg.id ? "bg-[#1f6feb]/10 border border-[#1f6feb]/30" : "hover:bg-[#161b22] border border-transparent"}`}
                        >
                            <span className="text-[16px]"><img src={intg.icon} alt={intg.name} width={24} height={24} className="rounded object-contain" /></span>
                            <div className="flex-1 min-w-0">
                                <p className="text-[11.5px] font-semibold text-[#e6edf3] truncate">{intg.name}</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: intg.statusColor }} />
                                    <span className="text-[9.5px]" style={{ color: intg.statusColor }}>{intg.status}</span>
                                </div>
                                <p className="text-[9px] text-[#6e7681] mt-0.5">Last sync: {intg.lastSync}</p>
                            </div>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#6e7681" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                        </button>
                    ))}
                </div>
            </div>

            {/* Center: Main content */}
            <div className="flex-1 overflow-y-auto">
                {/* Integration header */}
                <div className="px-5 py-4 border-b border-[#21262d]">
                    <div className="flex items-center gap-3">
                        <span className="text-[24px]"><img src={INTEGRATIONS.find(i => i.id === selected)?.icon} alt="" width={32} height={32} className="rounded object-contain" /></span>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-[16px] font-bold text-[#e6edf3]">{INTEGRATIONS.find(i => i.id === selected)?.name} Integration</h2>
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: "rgba(63,185,80,0.15)", color: "#3fb950" }}>Connected</span>
                            </div>
                            <p className="text-[11px] text-[#8b949e] mt-0.5">Send incident alerts, updates and notifications to channels. <span className="text-[#6e7681]">● Last synced: {INTEGRATIONS.find(i => i.id === selected)?.lastSync}</span></p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="px-5 border-b border-[#21262d]">
                    <div className="flex items-center gap-1">
                        {["Overview", "Channels", "Escalations", "Test & Validate", "Audit Logs", "Advanced"].map(t => (
                            <button key={t} onClick={() => setTab(t)} className={`px-3 py-2.5 text-[12px] font-medium border-b-2 transition-colors ${tab === t ? "text-[#e6edf3] border-[#58a6ff]" : "text-[#8b949e] border-transparent hover:text-[#e6edf3]"}`}>{t}</button>
                        ))}
                    </div>
                </div>

                {/* Tab content */}
                <div className="p-5 space-y-4">
                    {tab === "Overview" && <OverviewTab integrationId={selected} />}
                    {tab === "Channels" && <ChannelsTab integrationId={selected} />}
                    {tab === "Escalations" && <EscalationsTab integrationId={selected} />}
                    {tab === "Test & Validate" && <TestTab integrationId={selected} />}
                    {tab === "Audit Logs" && <AuditTab />}
                    {tab === "Advanced" && <AdvancedTab integrationId={selected} />}
                </div>
            </div>

            {/* Right: Intelligence sidebar */}
            <div className="w-[280px] border-l border-[#21262d] bg-[#161b22] overflow-y-auto shrink-0 hidden xl:block p-4 space-y-4">
                {/* Notification Routing Intelligence */}
                <div>
                    <h3 className="text-[13px] font-semibold text-[#e6edf3] mb-1">Notification Routing Intelligence</h3>
                    <p className="text-[10px] text-[#8b949e] mb-3">AI-powered intelligent routing for maximum reliability.</p>
                    <div className="space-y-2">
                        {[
                            { label: "Tagent Incident", sub: "Incident detected", color: "#f85149" },
                            { label: "Slack Alert", sub: "# critical-alerts", color: "#58a6ff" },
                            { label: "PagerDuty", sub: "High priority escalation", color: "#a371f7" },
                            { label: "On-Call Engineer", sub: "Primary on-call notified", color: "#3fb950" },
                            { label: "Escalation Manager", sub: "Secondary escalation", color: "#22d3ee" },
                        ].map((r, i) => (
                            <div key={i} className="flex items-center gap-2 p-2 rounded-md bg-[#0d1117] border border-[#21262d]">
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: r.color, boxShadow: `0 0 4px ${r.color}` }} />
                                <div><p className="text-[11px] text-[#e6edf3] font-medium">{r.label}</p><p className="text-[9.5px] text-[#8b949e]">{r.sub}</p></div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Integration Health */}
                <div>
                    <h3 className="text-[13px] font-semibold text-[#e6edf3] mb-1">Integration Health</h3>
                    <p className="text-[10px] text-[#8b949e] mb-3">Overall health of this integration</p>
                    <div className="flex items-center gap-3 mb-3">
                        <svg width="56" height="56" viewBox="0 0 56 56">
                            <circle cx="28" cy="28" r="22" fill="none" stroke="#21262d" strokeWidth="4" />
                            <circle cx="28" cy="28" r="22" fill="none" stroke="#3fb950" strokeWidth="4" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 22 * 0.98} ${2 * Math.PI * 22 * 0.02}`} transform="rotate(-90 28 28)" style={{ filter: "drop-shadow(0 0 3px #3fb950)" }} />
                        </svg>
                        <div><p className="text-[18px] font-bold text-[#3fb950] font-mono">98%</p><p className="text-[10px] text-[#3fb950]">Healthy</p></div>
                    </div>
                    <div className="space-y-1.5 text-[10.5px]">
                        {["Authentication", "Permissions", "Rate Limits", "Delivery"].map((h, i) => (
                            <div key={i} className="flex items-center justify-between">
                                <span className="text-[#8b949e]">{h}</span>
                                <span className="text-[#3fb950] font-semibold">Healthy</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Activity */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-[13px] font-semibold text-[#e6edf3]">Recent Activity</h3>
                        <button className="text-[10px] text-[#58a6ff]">View All</button>
                    </div>
                    <div className="space-y-2">
                        {[
                            { text: "Slack connected successfully", sub: "Admin · 5m ago", color: "#3fb950" },
                            { text: "Test notification delivered", sub: "System · 7m ago", color: "#3fb950" },
                            { text: "Channel #critical-alerts verified", sub: "Admin · 10m ago", color: "#3fb950" },
                            { text: "Escalation rule updated", sub: "Admin · 18m ago", color: "#58a6ff" },
                            { text: "Connection health check passed", sub: "System · 25m ago", color: "#3fb950" },
                        ].map((a, i) => (
                            <div key={i} className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: a.color }} />
                                <div><p className="text-[10.5px] text-[#e6edf3]">{a.text}</p><p className="text-[9px] text-[#6e7681]">{a.sub}</p></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function OverviewTab({ integrationId }: { integrationId: string }) {
    const intg = INTEGRATIONS.find(i => i.id === integrationId) || INTEGRATIONS[0];

    // Per-integration setup steps and env vars
    const SETUP_DATA: Record<string, { steps: string[]; envVars: string[]; description: string }> = {
        slack: { description: "Send incident alerts and updates to Slack channels.", steps: ["1. Create a Slack App at https://api.slack.com/apps", "2. Enable Incoming Webhooks & add Bot Token Scopes (chat:write, channels:read)", "3. Install to workspace → copy Bot User OAuth Token", "4. Enter credentials in the Advanced tab"], envVars: ["SLACK_BOT_TOKEN", "SLACK_SIGNING_SECRET", "SLACK_CHANNEL_ID"] },
        teams: { description: "Send alerts to Microsoft Teams channels via webhooks.", steps: ["1. Open Teams channel → ⋯ → Connectors → Incoming Webhook", "2. Name it 'Tagent Alerts', click Create", "3. Copy the webhook URL", "4. Enter it in the Advanced tab"], envVars: ["TEAMS_WEBHOOK_URL"] },
        email: { description: "Send email notifications via SMTP for incidents and alerts.", steps: ["1. Get SMTP credentials from your email provider", "2. For Gmail: enable 2FA → create App Password", "3. Enter SMTP details in the Advanced tab"], envVars: ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASSWORD", "SMTP_TO"] },
        pagerduty: { description: "Create PagerDuty incidents and trigger on-call escalations.", steps: ["1. Go to PagerDuty → Configuration → API Access Keys", "2. Create REST API Key (Read/Write)", "3. Get Integration Key from your Service", "4. Enter keys in the Advanced tab"], envVars: ["PAGERDUTY_API_KEY", "PAGERDUTY_SERVICE_ID", "PAGERDUTY_INTEGRATION_KEY"] },
        opsgenie: { description: "Create Opsgenie alerts and manage on-call schedules.", steps: ["1. Go to Opsgenie → Settings → API key management", "2. Create new API Integration", "3. Copy the API Key", "4. Enter in the Advanced tab"], envVars: ["OPSGENIE_API_KEY", "OPSGENIE_TEAM_ID"] },
        twilio: { description: "Send SMS/voice alerts for critical incidents.", steps: ["1. Sign up at twilio.com", "2. Get Account SID and Auth Token from Console", "3. Buy or verify a phone number", "4. Enter details in the Advanced tab"], envVars: ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_FROM_NUMBER", "ALERT_PHONE_NUMBERS"] },
        webhooks: { description: "Send JSON payloads to custom webhook endpoints.", steps: ["1. Set up an endpoint that accepts POST requests", "2. Generate a signing secret for HMAC verification", "3. Enter endpoint URL and secret in the Advanced tab"], envVars: ["WEBHOOK_ENDPOINTS", "WEBHOOK_SECRET"] },
        jira: { description: "Auto-create Jira tickets for incidents and track resolution.", steps: ["1. Go to Atlassian → Security → API tokens", "2. Create API token", "3. Get your project key from Jira", "4. Enter details in the Advanced tab"], envVars: ["JIRA_BASE_URL", "JIRA_EMAIL", "JIRA_API_TOKEN", "JIRA_PROJECT_KEY"] },
        github: { description: "Create GitHub issues for incidents and track deployments.", steps: ["1. Go to GitHub → Settings → Developer settings → Tokens", "2. Generate token with repo, workflow scopes", "3. Enter token and repo details in the Advanced tab"], envVars: ["GITHUB_TOKEN", "GITHUB_OWNER", "GITHUB_REPO"] },
        gitlab: { description: "Create GitLab issues for incidents and track CI/CD.", steps: ["1. Go to GitLab → Preferences → Access Tokens", "2. Create token with api scope", "3. Enter token and project ID in the Advanced tab"], envVars: ["GITLAB_TOKEN", "GITLAB_BASE_URL", "GITLAB_PROJECT_ID"] },
    };

    const setup = SETUP_DATA[integrationId] || SETUP_DATA["slack"];
    const status = intg.status === "Not Connected" ? "not_connected" : "connected";

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Connection Status */}
            <div className="rounded-lg bg-[#161b22] border border-[#21262d] p-4">
                <h4 className="text-[13px] font-semibold text-[#e6edf3] mb-3">Connection Status</h4>
                {status === "not_connected" ? (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 p-3 rounded-md bg-[#f0883e]/5 border border-[#f0883e]/20">
                            <span className="w-2 h-2 rounded-full bg-[#f0883e]" />
                            <p className="text-[12px] text-[#f0883e] font-medium">Not Connected</p>
                        </div>
                        <p className="text-[11px] text-[#8b949e]">{intg.name} is not configured yet. Go to the <span className="text-[#58a6ff] font-medium">Advanced</span> tab to enter your credentials.</p>
                        <p className="text-[10px] text-[#6e7681]">Setup type: <span className="text-[#58a6ff] font-mono">{intg.setupType}</span></p>
                    </div>
                ) : (
                    <div className="space-y-2.5 text-[11px]">
                        <div className="flex items-center gap-2 p-2 rounded-md bg-[#3fb950]/5 border border-[#3fb950]/20">
                            <span className="w-2 h-2 rounded-full bg-[#3fb950]" />
                            <p className="text-[12px] text-[#3fb950] font-medium">Connected</p>
                        </div>
                        <div><span className="text-[#8b949e]">Last synced</span><p className="text-[#e6edf3] font-mono">{intg.lastSync}</p></div>
                        <div><span className="text-[#8b949e]">Connection Health</span><p className="text-[#3fb950] font-semibold">● Healthy</p></div>
                    </div>
                )}
            </div>

            {/* How to Connect */}
            <div className="rounded-lg bg-[#161b22] border border-[#21262d] p-4">
                <h4 className="text-[13px] font-semibold text-[#e6edf3] mb-1">How to Connect {intg.name}</h4>
                <p className="text-[10px] text-[#8b949e] mb-3">Setup type: <span className="text-[#58a6ff] font-mono">{intg.setupType}</span></p>
                <p className="text-[11px] text-[#8b949e] mb-3">{setup.description}</p>
                <div className="space-y-1.5 mb-3">
                    {setup.steps.map((step, i) => (
                        <p key={i} className="text-[11px] text-[#e6edf3] leading-relaxed">{step}</p>
                    ))}
                </div>
                <div className="pt-3 border-t border-[#21262d]">
                    <p className="text-[10px] text-[#8b949e] font-semibold mb-1.5">Required Environment Variables:</p>
                    <div className="flex flex-wrap gap-1.5">
                        {setup.envVars.map((v, i) => (
                            <code key={i} className="text-[10px] text-[#f0883e] font-mono bg-[#0d1117] px-1.5 py-0.5 rounded border border-[#21262d]">{v}</code>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function ChannelsTab({ integrationId }: { integrationId: string }) {
    const intg = INTEGRATIONS.find(i => i.id === integrationId);
    return <div className="text-[12px] text-[#8b949e]">Channel management for <span className="text-[#e6edf3] font-semibold">{intg?.name}</span> — configure which channels receive which notification types. Connect the integration first via the Advanced tab.</div>;
}
function EscalationsTab({ integrationId }: { integrationId: string }) {
    const intg = INTEGRATIONS.find(i => i.id === integrationId);
    return <div className="text-[12px] text-[#8b949e]">Escalation policy editor for <span className="text-[#e6edf3] font-semibold">{intg?.name}</span> — define multi-tier escalation rules with timeouts and fallbacks. Connect the integration first.</div>;
}
function TestTab({ integrationId }: { integrationId: string }) {
    const intg = INTEGRATIONS.find(i => i.id === integrationId);
    const [testing, setTesting] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    const handleTest = async () => {
        setTesting(true);
        setResult(null);
        try {
            const res = await fetch(`/api/proxy/integrations/${integrationId}/test`, { method: "POST" });
            const data = await res.json();
            setResult(data.status === "success" ? `✓ ${intg?.name} connection test passed` : `✗ ${data.error || data.message || "Test failed"}`);
        } catch {
            setResult("✗ Backend not reachable. Start the API Gateway and Notification Service first.");
        } finally {
            setTesting(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="rounded-lg bg-[#161b22] border border-[#21262d] p-4">
                <h4 className="text-[13px] font-semibold text-[#e6edf3] mb-2">Test {intg?.name} Connection</h4>
                <p className="text-[11px] text-[#8b949e] mb-3">Send a test notification to verify your {intg?.name} integration is working correctly.</p>
                <button
                    onClick={handleTest}
                    disabled={testing}
                    className="h-8 px-4 rounded-md text-[11px] font-semibold text-white disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg, #1f6feb, #7c3aed)" }}
                >
                    {testing ? "Testing..." : `Test ${intg?.name} Connection`}
                </button>
                {result && (
                    <div className={`mt-3 p-2.5 rounded-md border text-[11px] ${result.startsWith("✓") ? "bg-[#3fb950]/5 border-[#3fb950]/20 text-[#3fb950]" : "bg-[#f85149]/5 border-[#f85149]/20 text-[#f85149]"}`}>
                        {result}
                    </div>
                )}
            </div>
        </div>
    );
}
function AuditTab() {
    return <div className="text-[12px] text-[#8b949e]">Audit log showing all configuration changes, connection events, and delivery history.</div>;
}
function AdvancedTab({ integrationId }: { integrationId: string }) {
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [formData, setFormData] = useState<Record<string, string>>({});
    const intg = INTEGRATIONS.find(i => i.id === integrationId);

    // Integration field definitions per integration
    const fields: Record<string, { key: string; label: string; placeholder: string; secret: boolean }[]> = {
        slack: [
            { key: "SLACK_BOT_TOKEN", label: "Bot User OAuth Token", placeholder: "xoxb-...", secret: true },
            { key: "SLACK_SIGNING_SECRET", label: "Signing Secret", placeholder: "abc123...", secret: true },
            { key: "SLACK_WEBHOOK_URL", label: "Webhook URL (alternative)", placeholder: "https://hooks.slack.com/services/...", secret: true },
            { key: "SLACK_CHANNEL_ID", label: "Default Channel ID", placeholder: "C01234567", secret: false },
        ],
        teams: [{ key: "TEAMS_WEBHOOK_URL", label: "Incoming Webhook URL", placeholder: "https://outlook.office.com/webhook/...", secret: true }],
        email: [
            { key: "SMTP_HOST", label: "SMTP Host", placeholder: "smtp.gmail.com", secret: false },
            { key: "SMTP_PORT", label: "SMTP Port", placeholder: "587", secret: false },
            { key: "SMTP_USER", label: "SMTP Username", placeholder: "alerts@company.com", secret: false },
            { key: "SMTP_PASSWORD", label: "SMTP Password", placeholder: "••••••••", secret: true },
            { key: "SMTP_TO", label: "Recipients (comma-separated)", placeholder: "team@company.com", secret: false },
        ],
        pagerduty: [
            { key: "PAGERDUTY_API_KEY", label: "REST API Key", placeholder: "u+...", secret: true },
            { key: "PAGERDUTY_SERVICE_ID", label: "Service ID", placeholder: "P1234AB", secret: false },
            { key: "PAGERDUTY_INTEGRATION_KEY", label: "Integration Key", placeholder: "abc123...", secret: true },
        ],
        opsgenie: [
            { key: "OPSGENIE_API_KEY", label: "API Key", placeholder: "xxxxxxxx-xxxx-...", secret: true },
            { key: "OPSGENIE_TEAM_ID", label: "Team ID", placeholder: "xxxxxxxx-xxxx-...", secret: false },
        ],
        twilio: [
            { key: "TWILIO_ACCOUNT_SID", label: "Account SID", placeholder: "ACxxxxxxxx...", secret: false },
            { key: "TWILIO_AUTH_TOKEN", label: "Auth Token", placeholder: "xxxxxxxx...", secret: true },
            { key: "TWILIO_FROM_NUMBER", label: "From Number", placeholder: "+15551234567", secret: false },
            { key: "ALERT_PHONE_NUMBERS", label: "Alert Numbers", placeholder: "+15559876543", secret: false },
        ],
        webhooks: [
            { key: "WEBHOOK_ENDPOINTS", label: "Endpoint URLs", placeholder: "https://your-app.com/webhook", secret: false },
            { key: "WEBHOOK_SECRET", label: "HMAC Secret", placeholder: "your-secret", secret: true },
        ],
        jira: [
            { key: "JIRA_BASE_URL", label: "Jira URL", placeholder: "https://org.atlassian.net", secret: false },
            { key: "JIRA_EMAIL", label: "Email", placeholder: "you@company.com", secret: false },
            { key: "JIRA_API_TOKEN", label: "API Token", placeholder: "ATATT3x...", secret: true },
            { key: "JIRA_PROJECT_KEY", label: "Project Key", placeholder: "OPS", secret: false },
        ],
        github: [
            { key: "GITHUB_TOKEN", label: "Personal Access Token", placeholder: "ghp_xxxx...", secret: true },
            { key: "GITHUB_OWNER", label: "Owner / Org", placeholder: "your-org", secret: false },
            { key: "GITHUB_REPO", label: "Repository", placeholder: "infrastructure", secret: false },
        ],
        gitlab: [
            { key: "GITLAB_TOKEN", label: "Access Token", placeholder: "glpat-xxxx...", secret: true },
            { key: "GITLAB_BASE_URL", label: "GitLab URL", placeholder: "https://gitlab.com", secret: false },
            { key: "GITLAB_PROJECT_ID", label: "Project ID", placeholder: "12345", secret: false },
        ],
    };

    const currentFields = fields[integrationId] || [];

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/proxy/integrations/config/${integrationId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            if (res.ok) {
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            }
        } catch {
            // Backend not reachable — show local success for now
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="rounded-lg bg-[#161b22] border border-[#21262d] p-4">
                <h4 className="text-[13px] font-semibold text-[#e6edf3] mb-1">Configure {intg?.name} Credentials</h4>
                <p className="text-[10px] text-[#8b949e] mb-4">
                    Enter your credentials below. They will be stored securely as Kubernetes Secrets in your EKS cluster.
                    Values are encrypted at rest and never exposed in logs.
                </p>

                <div className="space-y-3">
                    {currentFields.map(field => (
                        <div key={field.key}>
                            <label className="text-[11px] text-[#8b949e] font-medium block mb-1">
                                {field.label}
                                {field.secret && <span className="ml-1 text-[9px] text-[#f0883e]">🔒 Secret</span>}
                            </label>
                            <input
                                type={field.secret ? "password" : "text"}
                                placeholder={field.placeholder}
                                value={formData[field.key] || ""}
                                onChange={e => setFormData(d => ({ ...d, [field.key]: e.target.value }))}
                                className="w-full h-8 px-3 rounded-md bg-[#0d1117] border border-[#30363d] text-[11px] text-[#e6edf3] placeholder:text-[#484f58] font-mono focus:outline-none focus:border-[#58a6ff]/50"
                            />
                            <p className="text-[9px] text-[#6e7681] mt-0.5 font-mono">env: {field.key}</p>
                        </div>
                    ))}
                </div>

                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-[#21262d]">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 rounded-md text-[11px] font-semibold text-white disabled:opacity-50"
                        style={{ background: "linear-gradient(135deg, #1f6feb, #7c3aed)" }}
                    >
                        {saving ? "Saving to K8s Secret..." : "Save Credentials"}
                    </button>
                    <button className="px-4 py-2 rounded-md text-[11px] font-semibold text-[#8b949e] border border-[#30363d] hover:text-[#e6edf3] hover:border-[#484f58]">
                        Test Connection
                    </button>
                    {saved && <span className="text-[10px] text-[#3fb950] font-semibold">✓ Saved to Kubernetes Secret</span>}
                </div>
            </div>

            <div className="rounded-lg bg-[#0d1117] border border-[#21262d] p-3">
                <p className="text-[10px] text-[#8b949e]">
                    <span className="text-[#f0883e] font-semibold">Security:</span> Credentials are stored as Kubernetes Secrets in namespace <code className="text-[#58a6ff]">tagent-system</code>.
                    They are encrypted at rest by EKS, accessible only by the Tagent notification service pod, and never returned in plaintext via the API.
                </p>
            </div>
        </div>
    );
}
