"use client";

import { useState } from "react";
import { Moon, Shield, Zap, Phone, Mail, MessageSquare } from "lucide-react";

export default function NightGuardianPage() {
    const [enabled, setEnabled] = useState(false);
    const [autoFix, setAutoFix] = useState(false);
    const [confidence, setConfidence] = useState(85);

    return (
        <div className="flex-1 overflow-y-auto scrollbar">
            <header className="px-6 py-5 border-b border-zinc-800/60">
                <h1 className="text-lg font-semibold text-zinc-100">Night Guardian</h1>
                <p className="text-sm text-zinc-500 mt-0.5">Autonomous overnight incident management</p>
            </header>
            <div className="px-6 py-5 space-y-4 max-w-4xl">
                {/* Main toggle */}
                <Card>
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center"><Moon className="w-5 h-5 text-emerald-400" /></div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-zinc-200">Night Guardian Mode</p>
                            <p className="text-[12px] text-zinc-500 mt-0.5">Tagent monitors and responds to incidents while your team sleeps.</p>
                        </div>
                        <Toggle on={enabled} onToggle={() => setEnabled(!enabled)} />
                    </div>
                </Card>

                {/* Auto-Fix */}
                <Card>
                    <div className="flex items-center gap-4 mb-4">
                        <Zap className="w-5 h-5 text-amber-400" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-zinc-200">Auto-Fix</p>
                            <p className="text-[12px] text-zinc-500">Automatically execute remediation without waiting for approval.</p>
                        </div>
                        <Toggle on={autoFix} onToggle={() => setAutoFix(!autoFix)} />
                    </div>
                    {autoFix && (
                        <div className="pl-9 space-y-3">
                            <div>
                                <label className="text-xs text-zinc-400 block mb-1">Minimum confidence: <span className="text-emerald-400 font-mono">{confidence}%</span></label>
                                <input type="range" min={50} max={100} value={confidence} onChange={(e) => setConfidence(+e.target.value)} className="w-full accent-emerald-500" />
                            </div>
                            <p className="text-[11px] text-zinc-500">Only actions above this confidence run autonomously. Below = escalate to human.</p>
                            <div className="text-[11px] text-zinc-500 space-y-1">
                                <p>✓ Low-risk (restart pod, clear queue) — auto-execute</p>
                                <p>✓ Medium-risk (scale, rollback) — auto-execute if confidence met</p>
                                <p>✗ High-risk (delete, drain) — always requires approval</p>
                            </div>
                        </div>
                    )}
                </Card>

                {/* Escalation */}
                <Card>
                    <div className="flex items-center gap-4 mb-4">
                        <Shield className="w-5 h-5 text-blue-400" />
                        <div>
                            <p className="text-sm font-medium text-zinc-200">Escalation Chain</p>
                            <p className="text-[12px] text-zinc-500">How Tagent reaches you when an incident occurs.</p>
                        </div>
                    </div>
                    <div className="space-y-2 pl-9">
                        <Step icon={MessageSquare} time="T+0s" text="Slack notification" />
                        <Step icon={Mail} time="T+0s" text="Email alert" />
                        <Step icon={Phone} time="T+3min" text="Phone call (if no acknowledgment)" />
                        <Step icon={Zap} time="T+10min" text={autoFix ? "Auto-fix executes" : "Escalate to secondary contact"} />
                    </div>
                </Card>
            </div>
        </div>
    );
}

function Card({ children }: { children: React.ReactNode }) {
    return <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-5">{children}</div>;
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
    return (
        <button onClick={onToggle} className={`w-9 h-5 rounded-full relative transition-colors ${on ? "bg-emerald-500" : "bg-zinc-700"}`}>
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${on ? "translate-x-4" : "translate-x-0.5"}`} />
        </button>
    );
}

function Step({ icon: Icon, time, text }: { icon: any; time: string; text: string }) {
    return (
        <div className="flex items-center gap-3 text-[12px]">
            <Icon className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-zinc-500 font-mono w-14">{time}</span>
            <span className="text-zinc-300">{text}</span>
        </div>
    );
}
