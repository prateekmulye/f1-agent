/**
 * OpenF1 data ingestor (GET /api/data/openf1)
 *
 * - Pulls recent/active sessions and latest position + weather snapshots
 * - Upserts into Neon (Postgres) tables, creating them if missing
 * - Safe to run via Vercel Cron every 1–5 minutes
 *
 * Notes
 * - Historical access is free. Live/real‑time may require OpenF1 auth. If
 *   OPENF1_API_KEY is set, it will be sent as a Bearer token.
 * - Protect this route with CRON_SECRET when exposed publicly.
 */

import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

const OPENF1_BASE = process.env.OPENF1_BASE ?? "https://api.openf1.org/v1";
const OPENF1_API_KEY = process.env.OPENF1_API_KEY; // optional
const CRON_SECRET = process.env.CRON_SECRET; // recommended

function qs(params: Record<string, string | number | undefined | null>): string {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    u.append(k, String(v));
  }
  return u.toString();
}

async function of1<T = any>(path: string, params: Record<string, any> = {}): Promise<T[]> {
  const url = `${OPENF1_BASE}${path}?${qs(params)}`;
  const headers: Record<string, string> = {};
  if (OPENF1_API_KEY) headers["Authorization"] = `Bearer ${OPENF1_API_KEY}`;
  const res = await fetch(url, { headers, next: { revalidate: 0 }, cache: "no-store" });
  if (!res.ok) throw new Error(`OpenF1 ${path} ${res.status}`);
  return res.json();
}

async function ensureTables() {
  await sql`
    create table if not exists openf1_meetings (
      meeting_key int primary key,
      year int,
      country_name text,
      location text,
      meeting_name text
    );
  `;
  await sql`
    create table if not exists openf1_sessions (
      session_key int primary key,
      meeting_key int references openf1_meetings(meeting_key),
      session_name text,
      date_start timestamptz,
      date_end timestamptz
    );
  `;
  await sql`
    create table if not exists openf1_drivers (
      driver_number int primary key,
      driver_id text,
      full_name text,
      name_acronym text,
      team_name text
    );
  `;
  await sql`
    create table if not exists openf1_positions_latest (
      session_key int,
      driver_number int,
      position int,
      interval text,
      gap_to_leader text,
      date timestamptz,
      primary key (session_key, driver_number)
    );
  `;
  await sql`
    create table if not exists openf1_weather_latest (
      session_key int primary key,
      air_temperature float,
      track_temperature float,
      humidity float,
      rainfall text,
      wind_speed float,
      wind_direction float,
      date timestamptz
    );
  `;
  await sql`
    create table if not exists openf1_cursors (
      session_key int primary key,
      last_position_date timestamptz
    );
  `;
}

function iso(d: Date) { return d.toISOString(); }

export async function GET(req: NextRequest) {
  try {
    const auth = req.nextUrl.searchParams.get("key") ?? req.headers.get("x-cron-key");
    if (CRON_SECRET && auth !== CRON_SECRET) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    await ensureTables();

    const now = new Date();
    const year = now.getUTCFullYear();

    const sessions = await of1("/sessions", { year });
    const recent = (sessions as any[])
      .filter(s => s.session_key && s.meeting_key)
      .filter(s => {
        const ds = s.date_start ? Date.parse(s.date_start) : 0;
        const de = s.date_end ? Date.parse(s.date_end) : 0;
        const threeDays = 3 * 24 * 3600 * 1000;
        return Math.abs((de || ds) - now.getTime()) < threeDays;
      })
      .sort((a,b) => (a.session_key as number) - (b.session_key as number))
      .slice(-4);

    const meetingKeys = new Set<number>();
    for (const s of recent) meetingKeys.add(s.meeting_key);

    if (meetingKeys.size) {
      const meetings = await of1("/meetings", { year });
      const map = new Map<number, any>();
      for (const m of meetings as any[]) map.set(m.meeting_key, m);
      for (const key of meetingKeys) {
        const m = map.get(key);
        if (!m) continue;
        await sql`
          insert into openf1_meetings (meeting_key, year, country_name, location, meeting_name)
          values (${m.meeting_key}, ${m.year ?? year}, ${m.country_name ?? null}, ${m.location ?? null}, ${m.meeting_name ?? null})
          on conflict (meeting_key) do update set year=excluded.year, country_name=excluded.country_name,
            location=excluded.location, meeting_name=excluded.meeting_name;
        `;
      }
    }

    for (const s of recent) {
      await sql`
        insert into openf1_sessions (session_key, meeting_key, session_name, date_start, date_end)
        values (${s.session_key}, ${s.meeting_key}, ${s.session_name ?? null}, ${s.date_start ?? null}, ${s.date_end ?? null})
        on conflict (session_key) do update set meeting_key=excluded.meeting_key, session_name=excluded.session_name,
          date_start=excluded.date_start, date_end=excluded.date_end;
      `;
    }

    const drivers = await of1("/drivers", { year });
    for (const d of drivers as any[]) {
      await sql`
        insert into openf1_drivers (driver_number, driver_id, full_name, name_acronym, team_name)
        values (${d.driver_number}, ${d.driver_id ?? null}, ${d.full_name ?? null}, ${d.name_acronym ?? null}, ${d.team_name ?? null})
        on conflict (driver_number) do update set driver_id=excluded.driver_id, full_name=excluded.full_name,
          name_acronym=excluded.name_acronym, team_name=excluded.team_name;
      `;
    }

    let posInserts = 0;
    let weatherUpserts = 0;

    for (const s of recent) {
      const cursorRows = await sql`
        select last_position_date from openf1_cursors where session_key=${s.session_key}
      ` as unknown as { last_position_date: Date }[];
      const last = cursorRows[0]?.last_position_date;
      const dateFilter = last ? `>=${iso(new Date(last.getTime() - 500))}` : undefined;

      const pos = await of1("/position", {
        session_key: s.session_key,
        ...(dateFilter ? { date: dateFilter } : {}),
      });

      const latestMap = new Map<number, any>();
      for (const p of pos as any[]) {
        const dn = Number(p.driver_number);
        const pd = p.date ? Date.parse(p.date) : 0;
        const prev = latestMap.get(dn);
        if (!prev || pd > (prev._ts ?? 0)) latestMap.set(dn, { ...p, _ts: pd });
      }
      for (const [, p] of latestMap) {
        await sql`
          insert into openf1_positions_latest (session_key, driver_number, position, interval, gap_to_leader, date)
          values (${s.session_key}, ${p.driver_number}, ${p.position ?? null}, ${p.interval ?? null}, ${p.gap_to_leader ?? null}, ${p.date ?? null})
          on conflict (session_key, driver_number) do update set position=excluded.position, interval=excluded.interval,
            gap_to_leader=excluded.gap_to_leader, date=excluded.date;
        `;
        posInserts++;
      }
      const newest = Array.from(latestMap.values()).reduce<number>((mx, r: any) => Math.max(mx, r._ts ?? 0), 0);
      if (newest) {
        await sql`
          insert into openf1_cursors (session_key, last_position_date)
          values (${s.session_key}, ${new Date(newest).toISOString()})
          on conflict (session_key) do update set last_position_date=excluded.last_position_date;
        `;
      }

      const weather = await of1("/weather", { session_key: s.session_key });
      if (weather.length) {
        const w = (weather as any[]).reduce((a, b) => (Date.parse(a.date ?? 0) > Date.parse(b.date ?? 0) ? a : b));
        await sql`
          insert into openf1_weather_latest (session_key, air_temperature, track_temperature, humidity, rainfall, wind_speed, wind_direction, date)
          values (${s.session_key}, ${w.air_temperature ?? null}, ${w.track_temperature ?? null}, ${w.humidity ?? null}, ${w.rainfall ?? null}, ${w.wind_speed ?? null}, ${w.wind_direction ?? null}, ${w.date ?? null})
          on conflict (session_key) do update set air_temperature=excluded.air_temperature, track_temperature=excluded.track_temperature,
            humidity=excluded.humidity, rainfall=excluded.rainfall, wind_speed=excluded.wind_speed, wind_direction=excluded.wind_direction, date=excluded.date;
        `;
        weatherUpserts++;
      }
    }

    return NextResponse.json({ ok: true, recent_sessions: recent.length, pos_upserts: posInserts, weather_upserts: weatherUpserts });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}
