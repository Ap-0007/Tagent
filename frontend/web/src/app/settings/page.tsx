"use client";

import { useState } from "react";
import { Save, TestTube, Phone, Mail, MessageSquare, Clock, Users } from "lucide-react";

export default function SettingsPage() {
    const [slack, setSlack] = useState({ webhook: "", channel: "#incidents", enabled: false });
    const [email, setEmail] = useState({ smtp: "", port: "587", user: "", pass: "", from: "", to: "", enabled: false });
    const [phone, setPhone] = useState({ twilioSid: "", twilioToken: "", twilioFrom: "", primary: "", secondary: "", enabled: false });
    const [escalation, setEscalation] = useState({ phoneDelay: "3", autoFixDelay: "10", quietStart: "22:00", quietEnd: "06:00" });
    const [ollama, setOllama] = useState({ endpoint: "http://localhost:11434", model: "llama3.1:8b", embedding: "nomic-embed-text" });
    const [saved, setSaved] = useState(false);

    function save() { setSaved(true); setTimeout(() => setSaved(false), 2000); }

    return (
        <div className="flex-1 overflow-y-auto scrollbar">
            <header className="px-6 py-5 border-b border-zinc-800/60 flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-semibold text-zinc-100">Settings</h1>
                    <p className="text-sm text-zinc-500 mt-0.5">Configure integrations and escalation chain</p>
                </div>
                <button onClick={save} className="h-8 px-4 bg-emerald-500 text-zinc-900 text-xs font-medium rounded-md hover:bg-emerald-400 flex items-center gap-1.5">
                    <Save className="w-3.5 h-3.5" />{saved ? "Saved!" : "Save All"}
                </button>
            </header>

            <div className="px-6 py-5 space-y-6 max-w-4xl">

                {/* Slack */}
                <Section icon={MessageSquare} title="Slack Integration" enabled={slack.enabled} onToggle={() => setSlack({ ...slack, enabled: !slack.enabled })}>
                    <Field label="Webhook URL" placeholder="https://hooks.slack.com/services/T.../B.../xxx" value={slack.webhook} onChange={(v) => setSlack({ ...slack, webhook: v })} />
                    <Field label="Channel" placeholder="#incidents" value={slack.channel} onChange={(v) => setSlack({ ...slack, channel: v })} />
                    <TestBtn label="Send Test Message" />
                </Section>

                {/* Email */}
                <Section icon={Mail} title="Email Notifications" enabled={email.enabled} onToggle={() => setEmail({ ...email, enabled: !email.enabled })}>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="SMTP Host" placeholder="smtp.gmail.com" value={email.smtp} onChange={(v) => setEmail({ ...email, smtp: v })} />
                        <Field label="Port" placeholder="587" value={email.port} onChange={(v) => setEmail({ ...email, port: v })} />
                        <Field label="Username" placeholder="alerts@yourcompany.com" value={email.user} onChange={(v) => setEmail({ ...email, user: v })} />
                        <Field label="Password" placeholder="••••••••" value={email.pass} onChange={(v) => setEmail({ ...email, pass: v })} type="password" />
                        <Field label="From Address" placeholder="tagent@yourcompany.com" value={email.from} onChange={(v) => setEmail({ ...email, from: v })} />
                        <Field label="To (comma-separated)" placeholder="oncall@company.com, lead@company.com" value={email.to} onChange={(v) => setEmail({ ...email, to: v })} />
                    </div>
                    <TestBtn label="Send Test Email" />
                </Section>

                {/* Phone */}
                <Section icon={Phone} title="Phone Call Escalation" enabled={phone.enabled} onToggle={() => setPhone({ ...phone, enabled: !phone.enabled })}>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Twilio Account SID" placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" value={phone.twilioSid} onChange={(v) => setPhone({ ...phone, twilioSid: v })} />
                        <Field label="Twilio Auth Token" placeholder="••••••••" value={phone.twilioToken} onChange={(v) => setPhone({ ...phone, twilioToken: v })} type="password" />
                        <Field label="Twilio From Number" placeholder="+1234567890" value={phone.twilioFrom} onChange={(v) => setPhone({ ...phone, twilioFrom: v })} />
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-3">
                        <Field label="Primary On-Call Phone" placeholder="+1234567890" value={phone.primary} onChange={(v) => setPhone({ ...phone, primary: v })} />
                        <Field label="Secondary On-Call Phone" placeholder="+0987654321" value={phone.secondary} onChange={(v) => setPhone({ ...phone, secondary: v })} />
                    </div>
                    <TestBtn label="Send Test Call" />
                </Section>

                {/* Escalation Timing */}
                <Section icon={Clock} title="Escalation Timing" enabled={true} onToggle={() => { }}>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Phone call delay (minutes)" placeholder="3" value={escalation.phoneDelay} onChange={(v) => setEscalation({ ...escalation, phoneDelay: v })} />
                        <Field label="Auto-fix delay (minutes)" placeholder="10" value={escalation.autoFixDelay} onChange={(v) => setEscalation({ ...escalation, autoFixDelay: v })} />
                        <Field label="Quiet hours start (UTC)" placeholder="22:00" value={escalation.quietStart} onChange={(v) => setEscalation({ ...escalation, quietStart: v })} />
                        <Field label="Quiet hours end (UTC)" placeholder="06:00" value={escalation.quietEnd} onChange={(v) => setEscalation({ ...escalation, quietEnd: v })} />
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-3">
                        During quiet hours: Slack + Email immediately → Phone at T+{escalation.phoneDelay}min → Auto-fix at T+{escalation.autoFixDelay}min (if enabled in Night Guardian).
                    </p>
                </Section>

                {/* On-Call Team */}
                <Section icon={Users} title="On-Call Contacts" enabled={true} onToggle={() => { }}>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Primary Name" placeholder="Yaswanth Reddy" value="" onChange={() => { }} />
                        <Field label="Primary Email" placeholder="yaswanth@company.com" value="" onChange={() => { }} />
                        <Field label="Secondary Name" placeholder="Team Lead" value="" onChange={() => { }} />
                        <Field label="Secondary Email" placeholder="lead@company.com" value="" onChange={() => { }} />
                    </div>
                </Section>

                {/* AI Engine */}
                <Section icon={MessageSquare} title="AI Engine (Local)" enabled={true} onToggle={() => { }}>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Ollama Endpoint" placeholder="http://localhost:11434" value={ollama.endpoint} onChange={(v) => setOllama({ ...ollama, endpoint: v })} />
                        <Field label="Chat Model" placeholder="llama3.1:8b" value={ollama.model} onChange={(v) => setOllama({ ...ollama, model: v })} />
                        <Field label="Embedding Model" placeholder="nomic-embed-text" value={ollama.embedding} onChange={(v) => setOllama({ ...ollama, embedding: v })} />
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-3">All AI runs locally. No data leaves your cluster.</p>
                    <TestBtn label="Test Connection" />
                </Section>

            </div>
        </div>
    );
}

function Section({ icon: Icon, title, enabled, onToggle, children }: { icon: any; title: string; enabled: boolean; onToggle: () => void; children: React.ReactNode }) {
    return (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg">
            <div className="px-5 py-3.5 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-zinc-400" />
                    <h2 className="text-sm font-medium text-zinc-200">{title}</h2>
                </div>
                <button onClick={onToggle} className={`w-9 h-5 rounded-full relative transition-colors ${enabled ? "bg-emerald-500" : "bg-zinc-700"}`}>
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${enabled ? "translate-x-4" : "translate-x-0.5"}`} />
                </button>
            </div>
            <div className="px-5 py-4">{children}</div>
        </div>
    );
}

function Field({ label, placeholder, value, onChange, type = "text" }: { label: string; placeholder: string; value: string; onChange: (v: string) => void; type?: string }) {
    return (
        <div>
            <label className="text-[11px] text-zinc-400 font-medium block mb-1">{label}</label>
            <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full h-8 bg-zinc-900 border border-zinc-800 rounded-md px-3 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50" />
        </div>
    );
}

function TestBtn({ label }: { label: string }) {
    return (
        <button className="mt-3 h-7 px-3 border border-zinc-700 text-zinc-300 text-[11px] rounded-md hover:bg-zinc-800 flex items-center gap-1.5">
            <TestTube className="w-3 h-3" />{label}
        </button>
    );
}
