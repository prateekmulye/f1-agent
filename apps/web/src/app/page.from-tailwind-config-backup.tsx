// @ts-nocheck
/* eslint-disable */
// Backup of UI that was accidentally placed into tailwind.config.ts.
// Keeping this for reference so no work is lost. You can compare/merge into page.tsx as needed.
"use client";
import { useEffect, useState } from "react";
import RaceSelect from "@/components/RaceSelect";
import ProbabilityChart from "@/components/ProbabilityChart";
import PredictionsPanel from "@/components/PredictionsPanel";
import AgentChat from "@/components/AgentChat";
import { apiGet } from "@/lib/api";

type Factor = { feature: string; contribution: number };
type Row = { driver_id: string; prob_points: number; score: number; top_factors?: Factor[] };

function FlagIcon() {
  return (
    <svg className="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 3v18" stroke="#a1a1aa" strokeWidth="2" />
      <path d="M5 4c6-3 8 3 14 0v9c-6 3-8-3-14 0V4Z" fill="#E10600" opacity=".9" />
      <path d="M5 8c6-3 8 3 14 0" stroke="#121212" strokeOpacity=".6" />
    </svg>
  );
}
function TrackIcon() {
  return (
    <svg className="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 12c0-5 3-8 8-8s8 3 8 8-3 8-8 8-8-3-8-8Z" stroke="#e4e4e7" strokeWidth="1.5"/>
      <path d="M7 12c0-3 2-5 5-5s5 2 5 5-2 5-5 5-5-2-5-5Z" stroke="#E10600" strokeWidth="1.5" opacity=".7"/>
    </svg>
  );
}

function WeekendSignals() {
  const chips = ["FP3 complete", "Quali pace loaded", "Light rain risk 20%"];
  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((c) => (
        <span key={c} className="chip">{c}</span>
      ))}
    </div>
  );
}

function EvalSnapshot() {
  return (
    <div className="space-y-2 text-sm">
      <div className="flex items-center justify-between">
        <span className="text-zinc-300">Brier</span>
        <span className="tabular-nums">0.182</span>
      </div>
      <div className="w-full h-2 bg-zinc-800 rounded">
        <div className="h-full bg-red-600 rounded" style={{ width: "72%" }} />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-zinc-300">LogLoss</span>
        <span className="tabular-nums">0.436</span>
      </div>
      <div className="w-full h-2 bg-zinc-800 rounded">
        <div className="h-full bg-zinc-500 rounded" style={{ width: "48%" }} />
      </div>
      <p className="text-xs text-zinc-400">Latest eval via LangSmith + Neon.</p>
    </div>
  );
}

export default function BackupHome() {
  const [raceId, setRaceId] = useState("2024_gbr");
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    apiGet(`predictions/race/${raceId}`)
      .then(setRows)
      .catch(err => {
        console.error('Failed to load predictions:', err);
        setRows([]);
      });
  }, [raceId]);

  const top = rows[0];

  return (
    <main>
      <nav className="sticky top-0 z-50 glass">
        <div className="container-page py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FlagIcon />
            <span className="text-sm font-medium">Slipstream</span>
          </div>
          <div className="flex items-center gap-2">
            <a className="btn-secondary" href="https://github.com/prateekmulye/f1-agent" target="_blank" rel="noreferrer">GitHub</a>
            <a className="btn-secondary" href="https://www.linkedin.com/in/prateekmulye/" target="_blank" rel="noreferrer">LinkedIn</a>
          </div>
        </div>
      </nav>

      <section className="relative h-[260px] md:h-[320px] border-b border-zinc-800 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1517329782449-810562a4ec2a?auto=format&fit=crop&w=1600&q=60"
          alt="F1 car on track"
          className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none select-none"
        />
        <div className="hero-gradient relative h-full">
          <div className="container-page h-full flex flex-col justify-center">
            <div className="flex items-center gap-3 text-zinc-300 text-sm mb-2">
              <TrackIcon />
              <span>Race Dashboard</span>
            </div>
            <h1 className="mb-2">Race Predictor &amp; Explainable Agent</h1>
            <p>Historical model + live signals with tool‑using AI explanations.</p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-zinc-300">Race</span>
                <RaceSelect value={raceId} onChange={setRaceId} />
              </div>
              <span className="chip">Public demo</span>
            </div>
          </div>
        </div>
      </section>

      <div className="container-page py-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 flex flex-col gap-4">
          <div className="card">
            <div className="card-header">
              <h3>Top 10 probability to score points</h3>
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <TrackIcon /> Uncertainty ribbons ±8%
              </div>
            </div>
            <div className="card-body">
              <ProbabilityChart raceId={raceId} />
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3>Agent Chat</h3>
            </div>
            <div className="card-body">
              <AgentChat />
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3>Feature Attributions (leader’s top factors)</h3>
            </div>
            <div className="card-body">
              {!top ? (
                <p className="text-zinc-400">Loading…</p>
              ) : (
                <ul className="space-y-2">
                  {(top.top_factors ?? []).map((f) => {
                    const pct = Math.min(100, Math.max(0, Math.abs(f.contribution) * 100));
                    return (
                      <li key={f.feature}>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-zinc-300 font-mono">{f.feature}</span>
                          <span className="text-zinc-400 tabular-nums">{pct.toFixed(1)}</span>
                        </div>
                        <div className="mt-1 h-2 bg-zinc-800 rounded overflow-hidden">
                          <div
                            className={`h-full ${f.contribution >= 0 ? "bg-red-600" : "bg-zinc-500"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="card">
            <div className="card-header">
              <h3>Leaderboard</h3>
            </div>
            <div className="card-body">
              <PredictionsPanel raceId={raceId} />
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3>Weekend Signals</h3>
            </div>
            <div className="card-body">
              <WeekendSignals />
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3>Eval Snapshot</h3>
            </div>
            <div className="card-body">
              <EvalSnapshot />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
