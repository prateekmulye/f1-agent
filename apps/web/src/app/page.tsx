"use client";
import { useState } from "react";

export default function Home() {
  const [q, setQ] = useState("");
  const [out, setOut] = useState("");

  async function ask() {
    setOut("");
    const res = await fetch("/api/agent", {
      method: "POST",
      body: JSON.stringify({query: q})
    });
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    for (;;) {
      const {value, done} = await reader.read();
      if (done) break;
      setOut((prev) => prev + decoder.decode(value));
    }  
  }
  
  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">F1 Race Predictor</h1>
      <div className="grid md:grid-cols-3 gap-4">
        <section className="md:col-span-2 p-4 bg-white rounded shadow">
          <div className="mb-3 flex gap-2">
            <input className="border p-2 flex-1" value={q} onChange={e=>setQ(e.target.value)} placeholder="Ask: What are Driver X's total points in 2025 season?"/>
            <button className="px-3 py-2 bg-blue text-white rounded" onClick={ask}>Go</button>
          </div>
          <pre className="whitespace-pre-wrap text-sm">{out}</pre>
        </section>
        <aside className="p-4 bg-white rounded shadow">
          <h2 className="font-medium mb-2">Upcoming Race</h2>
          <div className="text-sm text-zinc-700">Predictions render here...</div>
        </aside>
      </div>
    </main>
  );
}