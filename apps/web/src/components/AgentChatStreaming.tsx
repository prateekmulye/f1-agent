/**
 * Agent chat input + output (streaming)
 *
 * Thick rounded input with embedded button, Enter/click parity, and
 * loading spinner while we stream the agent’s response from /api/agent.
 */
"use client";
import { useState, useRef, useEffect } from "react";

export default function AgentChatStreaming() {
  const [q, setQ] = useState("");
  const [out, setOut] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function ask() {
    if (!q.trim()) return;
    setLoading(true);
    setOut("");
    const res = await fetch("/api/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: q }),
    });
    const reader = res.body?.getReader();
    if (!reader) {
      setOut("Error: Cannot read response");
      setLoading(false);
      return;
    }
    const decoder = new TextDecoder();
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      setOut((prev) => prev + decoder.decode(value));
    }
    setLoading(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      void ask();
    }
  }

  return (
    <div className="space-y-3">
      {/* ChatGPT-like input with embedded button */}
      <div className="relative">
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ask predictions (e.g., 'NOR at 2024_gbr') or type 'run eval'"
          className="w-full pr-24 bg-zinc-900 border-2 border-zinc-700 rounded-2xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-red-600"
          aria-label="Agent question"
          disabled={loading}
        />
        <button
          onClick={ask}
          disabled={loading}
          className="absolute top-1/2 -translate-y-1/2 right-2 h-9 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
          aria-label="Ask"
        >
          {loading && (
            <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
          )}
          {loading ? "Asking…" : "Ask…"}
        </button>
      </div>
      <pre className="min-h-24 rounded-lg bg-zinc-900/80 border border-zinc-800 p-3 text-sm whitespace-pre-wrap text-zinc-200">
{out}
      </pre>
  <p className="text-xs text-zinc-400">Tip: Press Enter or click Ask…</p>
    </div>
  );
}
