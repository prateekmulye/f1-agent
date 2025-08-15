"use client";
import { useEffect, useState } from "react";

type Factor = { feature: string; contribution: number };
type Explanation = { top_factors: Factor[] };

export default function WhyDialog({ raceId, driverId}: { raceId: string; driverId: string }) {
  const [explanation, setExplanation] = useState<Explanation | null>(null);

  useEffect(() => {
    const fetchExplanation = async () => {
      const response = await fetch(`/api/explain?raceId=${raceId}&driverId=${driverId}`);
      const data = await response.json();
      const parsed = typeof data.explanation === "string" ? JSON.parse(data.explanation) : data.explanation;
      setExplanation(parsed);
    };

    fetchExplanation();
  }, [raceId, driverId]);

  if (!explanation) return null;

  return (
    <div className="text-sm">
      <div className="font-medium mb-1">Why {driverId}?</div>
      <ul className="list-disc ml-5">
        {explanation.top_factors.map((f: Factor) => (
          <li key={f.feature}>
            <span className="font-mono">{f.feature}</span>: {f.contribution.toFixed(3)}
          </li>
        ))}
      </ul>
      <div className="text-xs text-zinc-500 mt-2">Sources: Jolpica (historical), seeded deltas (demo). Live: OpenF1 when enabled.</div>
    </div>
  );
}