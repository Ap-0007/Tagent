import { Terminal } from "lucide-react";

const commands = [
    { cmd: "tagent status", desc: "Show cluster health summary (nodes, pods, deployments)" },
    { cmd: "tagent incidents", desc: "List all active incidents" },
    { cmd: "tagent incidents INC-0001", desc: "Show detailed incident with evidence and root cause" },
    { cmd: "tagent chat 'why is checkout slow?'", desc: "Ask AI a question about your cluster" },
    { cmd: "tagent analyze 'high latency on payment service'", desc: "AI analyzes a problem using live cluster data" },
    { cmd: "tagent risks", desc: "Show service risk scores (which services will fail next)" },
    { cmd: "tagent remediate restart-pod -n production -t payment-api-xyz", desc: "Restart a failing pod" },
    { cmd: "tagent remediate restart-pod -n production -t payment-api-xyz --dry-run", desc: "Preview remediation without executing" },
    { cmd: "tagent remediate scale-deployment -n production -t checkout-api", desc: "Scale up a deployment" },
    { cmd: "tagent guardian", desc: "Show Night Guardian autonomous mode status" },
    { cmd: "tagent version", desc: "Show CLI version" },
    { cmd: "tagent --api http://tagent.company.com:8080 status", desc: "Connect to a remote Tagent instance" },
];

export default function CLIPage() {
    return (
        <div className="flex-1 overflow-y-auto scrollbar">
            <header className="px-6 py-5 border-b border-zinc-800/60">
                <h1 className="text-lg font-semibold text-zinc-100">CLI Reference</h1>
                <p className="text-sm text-zinc-500 mt-0.5">Use Tagent from your terminal</p>
            </header>
            <div className="px-6 py-5 space-y-4 max-w-4xl">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <Terminal className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm font-medium text-zinc-200">Install</span>
                    </div>
                    <code className="block bg-zinc-950 border border-zinc-800 rounded p-3 text-[12px] text-emerald-400 font-mono">
                        curl -sSL https://get.tagent.io | sh
                    </code>
                </div>

                <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg">
                    <div className="px-5 py-3 border-b border-zinc-800">
                        <h2 className="text-sm font-medium text-zinc-200">Commands</h2>
                    </div>
                    <div className="divide-y divide-zinc-800/50">
                        {commands.map((c, i) => (
                            <div key={i} className="px-5 py-3 flex items-start gap-4">
                                <code className="text-[12px] text-emerald-400 font-mono bg-zinc-950 px-2 py-0.5 rounded shrink-0">{c.cmd}</code>
                                <span className="text-[12px] text-zinc-400">{c.desc}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
