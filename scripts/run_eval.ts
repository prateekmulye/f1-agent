#!/usr/bin/env -S node --loader tsx
import { neon } from "@neondatabase/serverless";
import fs from "node:fs/promises";
import fetch from "node-fetch";

if (!process.env.NEON_DATABASE_URL) {
  console.error("NEON_DATABASE_URL is not set. Export it in your shell or pass inline before the command.");
  process.exit(1);
}
const sql = neon(process.env.NEON_DATABASE_URL);

type Row = { race_id: string; driver_id: string; points: number;
  quali_pos:number; avg_fp_longrun_delta:number; constructor_form:number; driver_form:number; circuit_effect:number; weather_risk:number };

function brier(y: number[], p: number[]) {
  let s = 0; for (let i=0;i<y.length;i++) s += (p[i]-y[i])**2; return s / y.length;
}

function logloss(y: number[], p: number[]) {
  const eps = 1e-7;
  let s = 0;
  for (let i=0;i<y.length;i++){
    const pi = Math.min(1-eps, Math.max(eps, p[i]));
    s += y[i] ? -Math.log(pi) : -Math.log(1-pi);
  }
  return s / y.length;
}

async function main() {
  // quick connectivity check
  try {
    await sql`SELECT 1`;
  } catch (e) {
    console.error("Failed to connect to Neon. Check NEON_DATABASE_URL and network access.");
    throw e;
  }
  const csv = await fs.readFile("data/historical_features.csv","utf8");
  const lines = csv.trim().split("\n");
  const hdr = lines[0].split(",");
  const idx = (k:string)=>hdr.indexOf(k);
  const rows: Row[] = lines.slice(1).slice(-200).map(l => {
    const c = l.split(",");
    return {
      race_id: c[idx("race_id")],
      driver_id: c[idx("driver_id")],
      points: Number(c[idx("points")]),
      quali_pos: Number(c[idx("quali_pos")]),
      avg_fp_longrun_delta: Number(c[idx("avg_fp_longrun_delta")]),
      constructor_form: Number(c[idx("constructor_form")]),
      driver_form: Number(c[idx("driver_form")]),
      circuit_effect: Number(c[idx("circuit_effect")]),
      weather_risk: Number(c[idx("weather_risk")]),
    };
  });

  const yTrue = rows.map(r => (r.points>0?1:0));
  const yProb: number[] = [];

  const base = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  for (const r of rows) {
    const url = new URL("/api/predict", base);
    url.searchParams.set("race_id", r.race_id);
    url.searchParams.set("driver_id", r.driver_id);
    const res = await fetch(url.toString());
    if (!res.ok) {
      const body = await res.text().catch(() => "<no-body>");
      throw new Error(`predict failed ${res.status} ${res.statusText}: ${body}`);
    }
    const js: any = await res.json();

    // API may return a single object when driver_id is provided; accept either
    const rec = Array.isArray(js) ? js[0] : js;
    if (!rec || typeof rec.prob_points === "undefined") {
      throw new Error(`predict returned unexpected shape for ${r.race_id}/${r.driver_id}: ${JSON.stringify(js)}`);
    }
    yProb.push(Number(rec.prob_points));
  }

  const bs = brier(yTrue, yProb);
  const ll = logloss(yTrue, yProb);

  const run = await sql`
    INSERT INTO eval_runs(label, dataset, brier, logloss, notes)
    VALUES ('baseline_v1', 'historical_features:last200', ${bs}, ${ll}, 'api/predict-based eval')
    RETURNING id`;

  const runId = run[0].id;
  const inserts: Promise<any>[] = [];
  for (let i=0;i<rows.length;i++){
    inserts.push(sql`
      INSERT INTO eval_samples(run_id, race_id, driver_id, y_true, y_prob)
      VALUES (${runId}, ${rows[i].race_id}, ${rows[i].driver_id}, ${yTrue[i]}, ${yProb[i]})`);
  }
  await Promise.all(inserts);
  console.log("Eval complete:", { runId, brier: bs.toFixed(4), logloss: ll.toFixed(4) });
}
main().catch(e => { console.error(e); process.exit(1); });
