"use client";
import { useEffect, useState } from "react";

type Position = {
  session_key: number; driver_number: number; position: number; interval: string | null;
  gap_to_leader: string | null; date: string | null;
};
type Weather = {
  air_temperature: number | null; track_temperature: number | null; humidity: number | null;
  rainfall: string | null; wind_speed: number | null; wind_direction: number | null; date: string | null;
};

export default function LiveSnapshot() {
  const [data, setData] = useState<{ positions: Position[]; weather: Weather | null } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    try {
      const r = await fetch("/api/data/openf1/latest?limit=1", { cache: "no-store" });
      if (!r.ok) throw new Error(String(r.status));
      const arr = await r.json();
      const first = arr?.[0] ?? null;
      setData(first ? { positions: first.positions ?? [], weather: first.weather ?? null } : { positions: [], weather: null });
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 60_000); // refresh each minute
    return () => clearInterval(id);
  }, []);

  if (err) return <div className="text-xs text-zinc-400">Live snapshot unavailable: {err}. Try running the ingestor at /api/data/openf1 first.</div>;
  if (!data) return <div className="text-xs text-zinc-400">Loading live snapshot…</div>;
  if (!data.positions?.length)
    return <div className="text-xs text-zinc-400">No positions yet. Run /api/data/openf1 to ingest recent sessions.</div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm text-zinc-300">Latest positions</div>
        {data.weather && (
          <div className="chip">
            <span>Air {data.weather.air_temperature ?? "-"}°C</span>
            <span>Track {data.weather.track_temperature ?? "-"}°C</span>
            <span>Hum {data.weather.humidity ?? "-"}%</span>
          </div>
        )}
      </div>
      <ol className="grid grid-cols-2 gap-2 text-sm">
        {data.positions.slice(0, 10).map((p) => (
          <li key={p.driver_number} className="bg-zinc-900/60 border border-zinc-800 rounded-md px-2 py-1 flex items-center justify-between">
            <span className="text-zinc-400 w-5">{p.position ?? "-"}</span>
            <span className="font-medium">#{p.driver_number}</span>
            <span className="text-zinc-500 text-xs">{p.gap_to_leader ?? p.interval ?? ""}</span>
          </li>
        ))}
      </ol>
      <div className="text-[11px] text-zinc-500">Source: OpenF1 (cached; refreshes every minute)</div>
    </div>
  );
}
