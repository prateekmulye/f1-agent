"use client";
import { useState } from "react";
import NavBar from "@/components/NavBar";
import { Card, CardBody, CardHeader } from "@/components/Card";
import RaceSelect from "@/components/RaceSelect";
import PredictionsPanel from "@/components/PredictionsPanel";
import ProbabilityChart from "@/components/ProbabilityChart";
import AgentChat from "@/components/AgentChat";

export default function Home() {
  const [raceId, setRaceId] = useState("2024_gbr");

  const share = () => {
    const url = new URL(window.location.href);
    url.searchParams.set("race", raceId);
    navigator.clipboard.writeText(url.toString());
    alert("Share link copied!");
  };

  return (
    <main>
      <NavBar />
      <section className="bg-gradient-to-r from-f1-gray to-f1-carbon border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-semibold">Race Predictor & Explainable Agent</h1>
          <p className="text-zinc-300 mt-1">Historical model + live deltas (seeded) with tool-using AI explanations.</p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-6 grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 flex flex-col gap-4">
          <Card>
            <CardHeader title="Race" action={<RaceSelect value={raceId} onChange={setRaceId} />} />
            <CardBody>
              <ProbabilityChart raceId={raceId} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Agent Chat" action={<button onClick={share} className="text-xs px-2 py-1 rounded bg-zinc-800 border border-zinc-700">Copy Share Link</button>} />
            <CardBody><AgentChat /></CardBody>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader title="Top Scorers (probability to score points)" />
            <CardBody><PredictionsPanel raceId={raceId} /></CardBody>
          </Card>

          <Card>
            <CardHeader title="About" />
            <CardBody>
              <p>Data: Jolpica (historical), seeded deltas (demo). Live: OpenF1 (to enable). All LLM runs traced to LangSmith.</p>
            </CardBody>
          </Card>
        </div>
      </div>
    </main>
  );
}
