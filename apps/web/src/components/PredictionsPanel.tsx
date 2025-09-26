/**
 * PredictionsPanel
 *
 * Simple list representation of top-10 probabilities from the Python backend predictions API.
 */
"use client";
import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";

type Row = { driver_id: string; prob_points: number; score: number };

export default function PredictionsPanel({ raceId }: { raceId: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  useEffect(() => {
    apiGet(`predictions/race/${raceId}`)
      .then(setRows)
      .catch(err => {
        console.error('Failed to load predictions:', err);
        setRows([]);
      });
  }, [raceId]);

  return (
    <ul className="divide-y divide-zinc-800">
      {rows.slice(0,10).map((r, i) => (
        <li key={r.driver_id} className="py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-5 text-zinc-400">{i+1}</span>
            <span className="font-medium">{r.driver_id}</span>
          </div>
          <span className="tabular-nums">{(r.prob_points*100).toFixed(1)}%</span>
        </li>
      ))}
    </ul>
  );
}
