/**
 * Home page (dashboard)
 *
 * Presents the race selector, probability chart, leaderboard, and agent chat.
 * Layout favors clarity over flash; all components share the same spacing rhythm.
 */
"use client";
import { useEffect, useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import RaceSelect from "@/components/RaceSelect";
import PredictionsPanel from "@/components/PredictionsPanel";
import ProbabilityChart from "@/components/ProbabilityChart";
import AgentChatStreaming from "@/components/AgentChatStreaming";

function TrophyIcon() {
  return (
    <svg className="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 4h8v3a4 4 0 0 0 4 4h1v2a6 6 0 0 1-6 6H9a6 6 0 0 1-6-6v-2h1a4 4 0 0 0 4-4V4Z" stroke="#e4e4e7" strokeWidth="1.5"/>
      <path d="M10 19v2h4v-2" stroke="#a1a1aa" strokeWidth="1.5"/>
    </svg>
  );
}

type Palette = { a: string; b: string; stripe: string };
function dailyPalette(now = new Date()): Palette {
  const day = Math.floor((now.getTime() / 86400000) % 3);
  // 0 Ferrari, 1 McLaren, 2 Mercedes
  if (day === 1) return { a: "#FFA200", b: "#FF6A00", stripe: "#8a3b00" }; // McLaren papaya
  if (day === 2) return { a: "#00D2BE", b: "#009B8A", stripe: "#0c3a36" }; // Mercedes teal
  return { a: "#FF4D40", b: "#E10600", stripe: "#7a0f0d" }; // Ferrari default
}

export default function Home() {
  const [raceId, setRaceId] = useState("2024_gbr");
  const palette = useMemo(() => dailyPalette(), []);

  useEffect(() => {
    const url = new URL(window.location.href);
    const r = url.searchParams.get("race");
    if (r) setRaceId(r);
  }, []);

  const copyShare = () => {
    const url = new URL(window.location.href);
    url.searchParams.set("race", raceId);
    navigator.clipboard.writeText(url.toString());
    alert("Share link copied!");
  };

  return (
    <main>
      <NavBar />

      {/* HERO */}
      <section className="relative h-[260px] md:h-[320px] border-b border-zinc-800 overflow-hidden">
        {/* background image - local asset to avoid prod issues */}
        <img
          src="/window.svg"
          alt="F1 carbon backdrop"
          className="absolute inset-0 w-full h-full object-cover opacity-5"
        />
        <div className="hero-gradient relative h-full">
          <div className="container-page h-full flex items-end">
            <div className="w-full">
              <div className="flex items-end justify-between gap-4">
                <div className="min-w-0">
                  <h1 className="title-display mb-2">Race Predictor &amp; Explainable Agent</h1>
                  <p className="subtitle">Historical model + live deltas (seeded) with tool‑using AI explanations.</p>

                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-zinc-300">Race</span>
                      <RaceSelect value={raceId} onChange={setRaceId} />
                    </div>
                    <button onClick={copyShare} className="btn-secondary">Copy Share Link</button>
                  </div>
                </div>

                {/* Team car silhouette (palette rotates daily) */}
                <div className="hidden md:block hero-car shrink-0">
                  <svg viewBox="0 0 640 160" className="w-[320px] lg:w-[420px] h-auto opacity-95">
                    <defs>
                      <linearGradient id="carGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0" stopColor={palette.a}/>
                        <stop offset="1" stopColor={palette.b}/>
                      </linearGradient>
                    </defs>
                    {/* tyres */}
                    <circle cx="128" cy="126" r="26" fill="#0b0b0b"/>
                    <circle cx="468" cy="126" r="28" fill="#0b0b0b"/>
                    <circle cx="128" cy="126" r="12" fill="#1f1f1f"/>
                    <circle cx="468" cy="126" r="13" fill="#1f1f1f"/>
                    {/* floor / shadow */}
                    <path d="M40 134h560c12 0 18 6 18 10H20c0-6 8-10 20-10z" fill="#0a0a0a" opacity=".35"/>
                    {/* body */}
                    <path d="M36 110c18-8 48-12 98-16 10-16 28-26 58-34 62-16 126-18 182-18 30 0 48 10 64 22 12 9 22 18 34 18h24c12 0 22 4 30 10l16 12c8 6 14 8 24 8h16c10 0 16 6 16 10H56c-12 0-22-6-22-14 0-6 0-10 2-12z" fill="url(#carGradient)"/>
                    {/* sidepod stripe */}
                    <path d="M150 96c60-18 140-26 260-24 28 0 60 10 88 10h24c14 0 24 4 32 10l8 6H196c-22 0-32-2-46-2-8 0-18 0-26 0z" fill={palette.stripe} opacity=".55"/>
                    {/* cockpit / halo */}
                    <path d="M314 58c-10 2-18 6-24 12 10-2 26-4 46-4-2-6-10-10-22-8z" fill="#1a1a1a"/>
                    {/* nose tip */}
                    <path d="M544 100c10 0 20 2 28 8-10-2-22-4-30-4l2-4z" fill="#1a1a1a"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DASHBOARD GRID */}
      <div className="container-page h-full flex items-end py-6 grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Chart spans two columns on desktop */}
        <div className="md:col-span-2 flex flex-col gap-4">
          <div className="card">
            <div className="card-header">
              <h3>Likelihood to Score Points (Top 10)</h3>
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <TrophyIcon /> Uncertainty ribbons ±8%
              </div>
            </div>
            <div className="card-body max-h-[340px] overflow-hidden">
              <ProbabilityChart raceId={raceId} />
            </div>
          </div>
        </div>

        {/* Right column: Agent chat first (no scrolling to find it) */}
        <div className="flex flex-col gap-4">
          <div className="card">
            <div className="card-header">
              <h3>Agent Chat</h3>
              <button onClick={copyShare} className="text-xs px-2 py-1 rounded bg-zinc-800 border border-zinc-700">Copy Share Link</button>
            </div>
            <div className="card-body">
              <AgentChatStreaming />
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3>Top Scorers (probability to score points)</h3>
            </div>
            <div className="card-body">
              <PredictionsPanel raceId={raceId} />
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3>About</h3>
            </div>
            <div className="card-body">
              <p>Slipstream estimates each driver’s chance to score points in the next race and shows why the model thinks so. It learns from past race results, tracks, and qualifying pace to build a baseline, then updates that view with weekend signals (like practice form or weather risk). You’ll see probabilities with uncertainty ribbons and a simple leaderboard so it’s clear who’s likely to finish in the top ten and how confident we are.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
