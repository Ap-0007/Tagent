"use client";

import { useState } from "react";
import { sendChat } from "@/lib/api";
import { Send, Sparkles } from "lucide-react";

export default function AIPage() {
    const [messages, setMessages] = useState<{ role: string; text: string }[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSend() {
        if (!input.trim() || loading) return;
        const q = input.trim();
        setMessages(m => [...m, { role: "user", text: q }]);
        setInput("");
        setLoading(true);

        try {
            const result = await sendChat(q);
            setMessages(m => [...m, { role: "ai", text: result.response }]);
        } catch (e: any) {
            setMessages(m => [...m, { role: "ai", text: `Error: ${e.message}. Make sure Ollama is running.` }]);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-[#0d1117]">
            <header className="px-6 py-4 border-b border-zinc-800/60 shrink-0">
                <h1 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-emerald-400" />AI Assistant
                </h1>
                <p className="text-sm text-zinc-500 mt-0.5">Ask questions about your cluster using natural language</p>
            </header>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto scrollbar px-6 py-5 space-y-4">
                {messages.length === 0 && (
                    <div className="text-center py-12">
                        <Sparkles className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
                        <p className="text-sm text-zinc-400">Ask me anything about your cluster</p>
                        <div className="mt-4 flex flex-wrap justify-center gap-2">
                            {["How many pods are failing?", "What is the cluster health?", "Show me high-restart pods", "Why is my service slow?"].map(q => (
                                <button key={q} onClick={() => { setInput(q); }} className="px-3 py-1.5 text-[11px] text-zinc-400 bg-zinc-800 border border-zinc-700 rounded-md hover:text-zinc-200 hover:border-zinc-600">
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                {messages.map((m, i) => (
                    <div key={i} className={m.role === "user" ? "ml-auto max-w-[75%]" : "max-w-[85%]"}>
                        <p className="text-[9px] text-zinc-500 uppercase font-semibold mb-1">{m.role === "user" ? "You" : "Tagent AI"}</p>
                        <div className={`px-4 py-3 rounded-lg text-[13px] leading-relaxed whitespace-pre-wrap ${m.role === "user" ? "bg-emerald-500/10 border border-emerald-500/20 text-zinc-200" : "bg-zinc-900 border border-zinc-800 text-zinc-300"}`}>
                            {m.text}
                        </div>
                    </div>
                ))}
                {loading && <p className="text-[11px] text-zinc-500 animate-pulse">Tagent is thinking...</p>}
            </div>

            {/* Input */}
            <div className="px-6 py-4 border-t border-zinc-800/60 shrink-0">
                <div className="flex gap-2">
                    <input
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleSend()}
                        placeholder="Ask about your cluster..."
                        className="flex-1 h-10 bg-zinc-900 border border-zinc-800 rounded-lg px-4 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50"
                    />
                    <button onClick={handleSend} disabled={loading || !input.trim()} className="h-10 px-5 bg-emerald-500 text-zinc-900 text-sm font-medium rounded-lg hover:bg-emerald-400 disabled:opacity-50 flex items-center gap-2">
                        <Send className="w-4 h-4" />Ask
                    </button>
                </div>
            </div>
        </div>
    );
}
