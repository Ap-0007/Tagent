"use client";

import { useState } from "react";
import { Send } from "lucide-react";

interface Msg { role: "user" | "ai"; text: string; }

export default function AIPage() {
    const [input, setInput] = useState("");
    const [msgs, setMsgs] = useState<Msg[]>([
        { role: "ai", text: "I'm Tagent. Ask me anything about your cluster — incidents, metrics, deployments, or request a remediation." },
    ]);

    function send(t: string) {
        if (!t.trim()) return;
        setMsgs((m) => [...m, { role: "user", text: t }, { role: "ai", text: "AI Engine is not connected yet. Once Ollama is running, I'll answer with real cluster data." }]);
        setInput("");
    }

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            <header className="px-6 py-5 border-b border-zinc-800/60 shrink-0">
                <h1 className="text-lg font-semibold text-zinc-100">AI Assistant</h1>
                <p className="text-sm text-zinc-500 mt-0.5">Powered by local Ollama · llama3.1:8b</p>
            </header>
            <div className="flex-1 overflow-y-auto scrollbar px-6 py-5 space-y-4">
                {msgs.map((m, i) => (
                    <div key={i} className={m.role === "user" ? "ml-auto max-w-[70%]" : "max-w-[80%]"}>
                        <p className="text-[10px] text-zinc-500 uppercase font-medium mb-1">{m.role === "user" ? "You" : "Tagent"}</p>
                        <div className={`px-4 py-3 rounded-lg text-[13px] leading-relaxed ${m.role === "user" ? "bg-emerald-500/10 border border-emerald-500/20 text-zinc-200" : "bg-zinc-900/50 border border-zinc-800 text-zinc-300"}`}>
                            {m.text}
                        </div>
                    </div>
                ))}
            </div>
            <div className="px-6 py-3 border-t border-zinc-800/60 shrink-0">
                <div className="flex gap-2">
                    <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send(input)} placeholder="Ask about your cluster..." className="flex-1 h-9 bg-zinc-900 border border-zinc-800 rounded-md px-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50" />
                    <button onClick={() => send(input)} className="h-9 px-4 bg-emerald-500 text-zinc-900 text-xs font-medium rounded-md hover:bg-emerald-400 flex items-center gap-1.5">
                        <Send className="w-3.5 h-3.5" />Send
                    </button>
                </div>
            </div>
        </div>
    );
}
