"use client";

import { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { sendChat } from "@/lib/api";

interface Msg { role: "user" | "ai"; text: string; }

export default function AIPage() {
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [msgs, setMsgs] = useState<Msg[]>([
        { role: "ai", text: "I'm Tagent. I can see your entire cluster — pods, nodes, metrics, incidents. Ask me anything and I'll give you accurate answers based on real data.\n\nPowered by local Ollama (llama3.1:8b). No data leaves your cluster." },
    ]);

    async function send(t: string) {
        if (!t.trim() || loading) return;
        const userMsg = t.trim();
        setInput("");
        setMsgs((m) => [...m, { role: "user", text: userMsg }]);
        setLoading(true);

        try {
            const data = await sendChat(userMsg);
            setMsgs((m) => [...m, { role: "ai", text: data.response }]);
        } catch (e: any) {
            setMsgs((m) => [...m, { role: "ai", text: `Error: ${e.message}\n\nMake sure the API Gateway and AI Engine are running:\n• API Gateway: go run cmd/server/main.go (port 8080)\n• AI Engine: uvicorn app.main:app --port 8083\n• Ollama: docker compose up ollama` }]);
        } finally {
            setLoading(false);
        }
    }

    const suggestions = [
        "How many pods are running?",
        "Which pods are failing and why?",
        "What is the CPU usage on each node?",
        "How do I fix the checkout-api crash?",
        "Is any node running out of disk?",
        "What happened in the last incident?",
    ];

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            <header className="px-6 py-5 border-b border-zinc-800/60 shrink-0">
                <h1 className="text-lg font-semibold text-zinc-100">AI Assistant</h1>
                <p className="text-sm text-zinc-500 mt-0.5">Answers based on real cluster data · Ollama llama3.1:8b · local only</p>
            </header>
            <div className="flex-1 overflow-y-auto scrollbar px-6 py-5 space-y-4">
                {msgs.map((m, i) => (
                    <div key={i} className={m.role === "user" ? "ml-auto max-w-[70%]" : "max-w-[85%]"}>
                        <p className="text-[10px] text-zinc-500 uppercase font-medium mb-1">{m.role === "user" ? "You" : "Tagent"}</p>
                        <div className={`px-4 py-3 rounded-lg text-[13px] leading-relaxed whitespace-pre-wrap ${m.role === "user" ? "bg-emerald-500/10 border border-emerald-500/20 text-zinc-200" : "bg-zinc-900/50 border border-zinc-800 text-zinc-300"}`}>
                            {m.text}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="max-w-[85%]">
                        <p className="text-[10px] text-zinc-500 uppercase font-medium mb-1">Tagent</p>
                        <div className="px-4 py-3 rounded-lg bg-zinc-900/50 border border-zinc-800 flex items-center gap-2 text-zinc-400 text-[13px]">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Analyzing cluster data...
                        </div>
                    </div>
                )}
                {msgs.length === 1 && (
                    <div className="pt-2">
                        <p className="text-[11px] text-zinc-500 mb-2">Try asking:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {suggestions.map((s) => (
                                <button key={s} onClick={() => send(s)} className="text-left px-3 py-2 text-[12px] text-zinc-400 border border-zinc-800 rounded-md hover:bg-zinc-800/50 hover:text-zinc-200 transition-colors">
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            <div className="px-6 py-3 border-t border-zinc-800/60 shrink-0">
                <div className="flex gap-2">
                    <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send(input)} placeholder="Ask about your cluster..." disabled={loading} className="flex-1 h-9 bg-zinc-900 border border-zinc-800 rounded-md px-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 disabled:opacity-50" />
                    <button onClick={() => send(input)} disabled={loading || !input.trim()} className="h-9 px-4 bg-emerald-500 text-zinc-900 text-xs font-medium rounded-md hover:bg-emerald-400 flex items-center gap-1.5 disabled:opacity-50">
                        <Send className="w-3.5 h-3.5" />Send
                    </button>
                </div>
            </div>
        </div>
    );
}
