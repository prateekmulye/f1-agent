"use client";
import { useEffect, useMemo, useState } from "react";

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
  const [drivers, setDrivers] = useState<Record<string, { name: string; code: string; constructor: string; country?: string }> | null>(null);

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

  // load driver lookup from OpenF1 table
  useEffect(() => {
    fetch("/api/data/openf1/drivers")
      .then((r) => (r.ok ? r.json() : []))
      .then((arr: Array<{ driver_number: number; full_name: string; name_acronym: string; team_name: string; country_code?: string; country_name?: string }>) => {
        const map: Record<string, { name: string; code: string; constructor: string; country?: string }> = {};
        for (const d of arr) map[String(d.driver_number)] = { name: d.full_name ?? d.name_acronym, code: d.name_acronym, constructor: d.team_name, country: d.country_code || d.country_name };
        setDrivers(map);
      })
      .catch(() => setDrivers({} as any));
  }, []);

  if (err) return <div className="text-xs text-zinc-400">Live snapshot unavailable: {err}. Try running the ingestor at /api/data/openf1 first.</div>;
  if (!data) return <div className="text-xs text-zinc-400">Loading live snapshot…</div>;
  if (!data.positions?.length)
    return <div className="text-xs text-zinc-400">No positions yet. Run /api/data/openf1 to ingest recent sessions.</div>;

  // Simple helper to guess a flag emoji by ISO country code (no hooks; safe across early returns)
  const flagFor = (numStr: string) => {
    const cc = drivers?.[numStr]?.country?.toUpperCase() || "";
    if (cc.length === 2) {
      const codePoints = [...cc].map((c) => 127397 + c.charCodeAt(0));
      return String.fromCodePoint(...codePoints);
    }
    return "🏁";
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm text-zinc-300">Leaders on track (updates every minute)</div>
        {data.weather && (
          <div className="chip">
            <span>Air {data.weather.air_temperature ?? "-"}°C</span>
            <span>Track {data.weather.track_temperature ?? "-"}°C</span>
            <span>Hum {data.weather.humidity ?? "-"}%</span>
          </div>
        )}
      </div>
      {/* marquee style band */}
      <div className="overflow-hidden">
        <div className="flex gap-2 animate-[marquee_20s_linear_infinite] hover:[animation-play-state:paused]">
          {data.positions.slice(0, 12).map((p) => (
            <div key={p.driver_number} className="min-w-[180px] bg-zinc-900/60 border border-zinc-800 rounded-md px-3 py-2 flex items-center gap-3">
              <span className="text-zinc-400 w-5 text-right">{p.position ?? "-"}</span>
        <span className="text-lg">{flagFor(String(p.driver_number))}</span>
              <div className="truncate">
                <div className="font-medium leading-tight">
                  #{p.driver_number}
                </div>
                <div className="text-[11px] text-zinc-400 leading-none">
          {drivers?.[String(p.driver_number)]?.name ?? "Driver"}
                </div>
              </div>
              <span className="ml-auto text-zinc-500 text-xs">{p.gap_to_leader ?? p.interval ?? ""}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="text-[11px] text-zinc-500">Source: OpenF1 (cached; refreshes every minute)</div>
    </div>
  );
}
