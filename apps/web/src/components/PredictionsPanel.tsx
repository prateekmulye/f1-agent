"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const WhyDialog = dynamic(() => import("./WhyDialog"), { ssr: false });

type Row = { driver_id: string; prob_points: number; score: number };

export default function PredictionsPanel({ raceId }: { raceId: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [show, setShow] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/predict?race_id=${raceId}`).then(r => r.json()).then((d: Row[]) => setRows(d));
  }, [raceId]);

  return (
    <div className="space-y-2">
      <div className="text-sm text-zinc-700">Top 3 likelihood to score points</div>
      <table className="w-full text-sm">
        <thead><tr className="text-left text-zinc-500"><th>Driver</th><th>Prob</th><th></th></tr></thead>
        <tbody>
          {rows.slice(0,3).map(r => (
            <tr key={r.driver_id} className="border-b border-zinc-200">
              <td className="py-2 font-medium">{r.driver_id}</td>
              <td className="py-2">{(r.prob_points*100).toFixed(1)}%</td>
              <td className="py-2">
                <button className="text-blue-600 hover:underline" onClick={()=>setShow(r.driver_id)}>Why?</button>
                {show === r.driver_id && (
                  <div className="mt-2 p-2 border rounded bg-zinc-50">
                    <WhyDialog raceId={raceId} driverId={r.driver_id} />
                    <button className="text-xs mt-2 text-zinc-600 hover:underline" onClick={()=>setShow(null)}>Close</button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
