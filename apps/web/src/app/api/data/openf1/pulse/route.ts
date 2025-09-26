import { NextRequest } from "next/server";
import { sql } from "@/lib/db";

async function ensureThrottleTable() {
  await sql`
    create table if not exists openf1_throttle (
      id int primary key default 1,
      last_run timestamptz
    );
  `;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ttlSec = Math.max(60, Math.min(3600, Number(searchParams.get("ttl") ?? 600))); // 1–60 min
    const days = Math.max(1, Math.min(60, Number(searchParams.get("days") ?? 3)));

    await ensureThrottleTable();
    const rows = (await sql`select last_run from openf1_throttle where id=1`) as any[];
    const last = rows[0]?.last_run ? new Date(rows[0].last_run) : null;
    const now = new Date();
    if (last && now.getTime() - last.getTime() < ttlSec * 1000) {
      return Response.json({ ok: true, skipped: true, last_run: last.toISOString(), ttl: ttlSec });
    }

    // Trigger the real ingestor via an internal server-side call with the cron secret
    const origin = new URL(req.url).origin;
    const key = process.env.CRON_SECRET ?? "";
    const res = await fetch(`${origin}/api/data/openf1?days=${days}`, {
      headers: key ? { "x-cron-key": key } : {},
      cache: "no-store",
      next: { revalidate: 0 },
    });
    if (!res.ok) {
      return Response.json({ ok: false, error: `ingest ${res.status}` }, { status: 500 });
    }
    await sql`
      insert into openf1_throttle (id, last_run) values (1, ${now.toISOString()})
      on conflict (id) do update set last_run=excluded.last_run
    `;
    const body = await res.json();
    return Response.json({ ok: true, triggered: true, ingestor: body, ttl: ttlSec });
  } catch (e: any) {
    return Response.json({ ok: false, error: e?.message ?? String(e) }, { status: 500 });
  }
}
