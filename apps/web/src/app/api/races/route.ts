/**
 * Races API (GET /api/races)
 * Returns recent races with id/name/season/round for dropdowns and normalization.
 */
import { sql } from "@/lib/db";

function slugifyId(year: number, name?: string | null, meeting_key?: number): string {
  if (!name) return `live_${year}_${meeting_key ?? "x"}`;
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  return `${year}_${base.slice(0, 8)}`;
}

export async function GET() {
  // Static, seeded races
  const rows = (await sql`select id, name, season, round from races order by season desc, round desc`) as any[];

  // Try to surface the most recent live "Race" session from OpenF1 tables if present
  let live: any | null = null;
  try {
    const s = (await sql`
      select s.session_key, s.meeting_key, s.session_name, s.date_start, m.meeting_name, m.year
      from openf1_sessions s
      join openf1_meetings m on m.meeting_key = s.meeting_key
      where s.session_name = 'Race'
      order by s.date_start desc nulls last
      limit 1
    `) as any[];
    const r = s[0];
    if (r) {
      const id = slugifyId(Number(r.year ?? 0), r.meeting_name, r.meeting_key);
      live = { id, name: r.meeting_name ?? "Live race", season: Number(r.year ?? 0), round: 0 };
    }
  } catch {
    // tables may not exist yet; ignore
  }

  const out = live && !rows.find((x) => x.id === live.id) ? [live, ...rows] : rows;
  return Response.json(out);
}
