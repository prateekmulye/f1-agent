"use client";
import { useState } from "react";

export default function AgentChat() {
    const [q, setQ] = useState("");
    const [out, setOut] = useState("");
    async function ask() {
        setOut("");
        const res = await fetch("/api/agent/", {
            method: "POST",
            body: JSON.stringify({ query: q})
        });
        const reader = res.body?.getReader();
        if (!reader) {
            setOut("Error: Cannot read response");
            return;
        }
        const decoder = new TextDecoder();
        for (;;) {
            const { value, done } = await reader.read();
            if (done) break;
            setOut(prev => prev + decoder.decode(value))
        }
    }

    return (
        <div>
            <div className="flex gap-2">
                <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Ask predictions or run eval…" className="flex-1 bg-zinc-900 border border-zinc-700 rounded-md px-3 py-2" />
                <button onClick={ask} className="px-3 py-2 rounded-md bg-f1-red text-white">Ask</button>
            </div>
            <pre className="mt-3 text-sm whitespace-pre-wrap text-zinc-200">{out}</pre>
        </div>
    );
}