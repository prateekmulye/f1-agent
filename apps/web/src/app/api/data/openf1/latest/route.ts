/**
 * Latest OpenF1 snapshot (GET /api/data/openf1/latest)
 * Returns recent sessions with latest driver positions and weather.
 */
import { NextRequest } from "next/server";
import { sql } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const limit = Number(new URL(req.url).searchParams.get("limit") ?? 3);
    let sessions: any[] = [];
    try {
      sessions = (await sql`
        select s.session_key, s.meeting_key, s.session_name, s.date_start, s.date_end
        from openf1_sessions s
        order by s.session_key desc
        limit ${Math.max(1, Math.min(6, limit))}
      `) as any[];
    } catch {
      // tables probably not created yet
      return Response.json([]);
    }

    const out = [] as any[];
    for (const s of sessions) {
      const positions = (await sql`
        select * from openf1_positions_latest where session_key=${s.session_key} order by position asc
      `) as any[];
      const weather = (await sql`
        select * from openf1_weather_latest where session_key=${s.session_key}
      `) as any[];
      out.push({ session: s, positions, weather: weather[0] ?? null });
    }
    return Response.json(out);
  } catch (e: any) {
    return Response.json({ error: e?.message ?? String(e) }, { status: 500 });
  }
}
