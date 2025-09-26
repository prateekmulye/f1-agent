"use client";
import { useEffect, useRef, useState } from "react";
import { apiPost } from "@/lib/api";

type Msg = { role: "user" | "assistant"; content: string };

export default function AgentChatStreaming() {
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "assistant", content: "Ask anything about F1. I can explain results, drivers, or run a quick prediction (try: ‘What are LEC’s odds for 2024_gbr?’)." },
  ]);
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.lastElementChild?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, loading]);

  async function send() {
    const q = input.trim();
    if (!q || loading) return;
    setInput("");
    setMsgs((m) => [...m, { role: "user", content: q }]);
    setLoading(true);
    try {
      const response = await apiPost("chat/message", { query: q });
      const text = typeof response === 'string' ? response : response?.content || response?.message || "(no response)";
      setMsgs((m) => [...m, { role: "assistant", content: text }]);
    } catch (err: any) {
      setMsgs((m) => [
        ...m,
        { role: "assistant", content: `Request failed: ${err?.message ?? String(err)}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.key === "Enter" && !e.shiftKey) || (e.key === "Enter" && (e.metaKey || e.ctrlKey))) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div ref={listRef} className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
        {msgs.map((m, i) => (
          <div key={i} className={m.role === "user" ? "bg-zinc-900/70 border border-zinc-800 rounded-lg p-3" : "bg-zinc-800/60 border border-zinc-700 rounded-lg p-3"}>
            <div className="text-xs mb-1 text-zinc-400">{m.role === "user" ? "You" : "Agent"}</div>
            <div className="whitespace-pre-wrap leading-relaxed text-sm">{m.content}</div>
          </div>
        ))}
        {loading && (
          <div className="chip">Thinking…</div>
        )}
      </div>

      <div className="flex items-end gap-2">
        <textarea
          className="input min-h-[44px] resize-y"
          placeholder="Ask about drivers, teams, races… (Enter to send, Shift+Enter for newline)"
          rows={3}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <button className="btn" onClick={send} disabled={loading || !input.trim()}>Ask</button>
      </div>
      <div className="text-[11px] text-zinc-500">Tip: Use ids like 2024_gbr or driver codes like LEC, NOR.</div>
    </div>
  );
}
