/**
 * Home page (dashboard)
 *
 * Presents the race selector, probability chart, leaderboard, and agent chat.
 * Layout favors clarity over flash; all components share the same spacing rhythm.
 */
"use client";
import { useEffect, useState } from "react";
import NavBar from "@/components/NavBar";
import RaceSelect from "@/components/RaceSelect";
import PredictionsPanel from "@/components/PredictionsPanel";
import ProbabilityChart from "@/components/ProbabilityChart";
import AgentChatStreaming from "@/components/AgentChatStreaming";

function FlagIcon() {
  return (
    <svg className="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 3v18" stroke="#a1a1aa" strokeWidth="2" />
      <path d="M5 4c6-3 8 3 14 0v9c-6 3-8-3-14 0V4Z" fill="#E10600" opacity=".9" />
      <path d="M5 8c6-3 8 3 14 0" stroke="#121212" strokeOpacity=".6" />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg className="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 4h8v3a4 4 0 0 0 4 4h1v2a6 6 0 0 1-6 6H9a6 6 0 0 1-6-6v-2h1a4 4 0 0 0 4-4V4Z" stroke="#e4e4e7" strokeWidth="1.5"/>
      <path d="M10 19v2h4v-2" stroke="#a1a1aa" strokeWidth="1.5"/>
    </svg>
  );
}

export default function Home() {
  const [raceId, setRaceId] = useState("2024_gbr");
  
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
      <section className="relative border-b border-zinc-800 overflow-hidden">
        {/* background image - use local asset to avoid broken image in prod */}
        <img
          src="/window.svg"
          alt="F1 car on track"
          className="absolute inset-0 w-full h-full object-cover opacity-10"
        />
        <div className="hero-gradient relative">
          <div className="container-page py-8 md:py-10">
            <div className="flex items-center gap-2 text-zinc-300 text-sm mb-2">
              <FlagIcon />
              <span>Slipstream</span>
            </div>
            <h1 className="mb-2">Race Predictor &amp; Explainable Agent</h1>
            <p>Historical model + live deltas (seeded) with tool‑using AI explanations.</p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-zinc-300">Race</span>
                <RaceSelect value={raceId} onChange={setRaceId} />
              </div>
              <button onClick={copyShare} className="btn-secondary">Copy Share Link</button>
            </div>
          </div>
        </div>
      </section>

      {/* DASHBOARD GRID */}
  <div className="container-page py-8 grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Left column */}
        <div className="md:col-span-2 flex flex-col gap-4">
          <div className="card">
            <div className="card-header">
              <h3>Likelihood to Score Points (Top 10)</h3>
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <TrophyIcon /> Uncertainty ribbons ±8%
              </div>
            </div>
            <div className="card-body">
              <ProbabilityChart raceId={raceId} />
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3>Agent Chat</h3>
              <button onClick={copyShare} className="text-xs px-2 py-1 rounded bg-zinc-800 border border-zinc-700">
                Copy Share Link
              </button>
            </div>
            <div className="card-body">
              <AgentChatStreaming />
            </div>
          </div>
        </div>

        {/* Right column */}
  <div className="flex flex-col gap-5">
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
