"use client";
import { useEffect, useState } from "react";

type Row = { driver_id: string; prob_points: number; score: number };

export default function PredictionsPanel({ raceId }: { raceId: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/predict?race_id=${raceId}`)
      .then(r => r.json())
      .then((d: Row[]) => setRows(d))
      .finally(() => setLoading(false));
  }, [raceId]);

  if (loading) return <div className="text-sm text-zinc-600">Loading predictions…</div>;

  return (
    <div className="space-y-2">
      <div className="text-sm text-zinc-700">Top 3 likelihood to score points</div>
      <table className="w-full text-sm">
        <thead><tr className="text-left text-zinc-500"><th>Driver</th><th>Prob (points)</th></tr></thead>
        <tbody>
          {rows.slice(0,3).map(r => (
            <tr key={r.driver_id} className="border-b border-zinc-200">
              <td className="py-2 font-medium">{r.driver_id}</td>
              <td className="py-2">{(r.prob_points*100).toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
