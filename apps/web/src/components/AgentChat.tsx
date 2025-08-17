/**
 * Legacy predictions panel (kept for reference)
 *
 * Renders a top-10 list with simple bars. Superseded by the newer
 * components but retained to avoid losing prior work and for side-by-side
 * comparisons when iterating on the UI.
 */
"use client";
import { useEffect, useMemo, useState } from "react";

type Row = { driver_id: string; prob_points: number; score: number };

const TEAM_COLORS: Record<string, string> = {
  VER: "#0600EF", PER: "#0600EF",
  LEC: "#F91536", SAI: "#F91536",
  NOR: "#FF8000", PIA: "#FF8000",
  HAM: "#00D2BE", RUS: "#00D2BE",
  ALO: "#006F62", STR: "#006F62",
  GAS: "#0096FF", OCO: "#0096FF",
  ALB: "#005AFF", SAR: "#005AFF",
  TSU: "#2B4562", RIC: "#2B4562",
  BOT: "#00E701", ZHO: "#00E701",
  HUL: "#B6BABD", MAG: "#B6BABD",
};

function DriverAvatar({ code }: { code: string }) {
  const bg = TEAM_COLORS[code] ?? "#444";
  return (
    <div
      className="w-7 h-7 rounded-full grid place-items-center text-[11px] font-semibold text-white shadow"
      style={{ backgroundColor: bg }}
      aria-label={`${code} avatar`}
    >
      {code}
    </div>
  );
}

export default function PredictionsPanel({ raceId }: { raceId: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  useEffect(() => {
    fetch(`/api/predict?race_id=${raceId}`)
      .then((r) => r.json())
      .then((d: Row[]) => setRows(d));
  }, [raceId]);

  const top10 = useMemo(() => rows.slice(0, 10), [rows]);

  return (
    <ul className="space-y-2">
      {top10.map((r, i) => {
        const pct = Math.round(r.prob_points * 1000) / 10;
        const code = r.driver_id.toUpperCase();
        const team = TEAM_COLORS[code] ? Object.keys(TEAM_COLORS).find(k => k === code) : undefined;
        const chipColor = TEAM_COLORS[code] ?? "#444";
        return (
          <li key={r.driver_id} className="p-2 rounded-lg bg-zinc-900/60 border border-zinc-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-5 text-zinc-400">{i + 1}</span>
                <DriverAvatar code={code} />
                <span className="font-medium">{r.driver_id}</span>
                <span
                  className="chip"
                  style={{ borderColor: chipColor, color: chipColor }}
                >
                  {/* team chip uses driver code color */}
                  {code}
                </span>
              </div>
              <span className="tabular-nums">{pct.toFixed(1)}%</span>
            </div>
            <div className="mt-2 h-2 rounded bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-red-600"
                style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}