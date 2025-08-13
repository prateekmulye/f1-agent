import { NextRequest } from "next/server";
import { sql } from "@/lib/db";

type Coeff = { feature: string; weight: number };
type Features = {
  race_id: string; driver_id: string;
  quali_pos: number; avg_fp_longrun_delta: number;
  constructor_form: number; driver_form: number;
  circuit_effect: number; weather_risk: number;
};

function sigmoid(z: number) { return 1 / (1 + Math.exp(-z)); }

function score(feat: Features, coeffs: Coeff[]) {
  let s = 0;
  for (const c of coeffs) s += (feat as any)[c.feature] * c.weight;
  return s;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const race_id = searchParams.get("race_id");
  const driver_id = searchParams.get("driver_id");
  if (!race_id) return new Response("race_id required", { status: 400 });

  const coeffRows = await sql`select feature, weight from model_coeffs where model='baseline_v1'`;
  if (coeffRows.length === 0) return new Response("no coefficients loaded", { status: 500 });
  const coeffs: Coeff[] = coeffRows.map((row: any) => ({
    feature: row.feature,
    weight: Number(row.weight),
  }));

  const feats = driver_id
    ? await sql`select * from features_current where race_id=${race_id} and driver_id=${driver_id}`
    : await sql`select * from features_current where race_id=${race_id}`;

  const rows = feats.map(f => {
    const sc = score(f as Features, coeffs);
    const prob_points = sigmoid(sc);
    const contribs = coeffs.map(c => ({ feature: c.feature, contribution: (f as any)[c.feature] * c.weight }));
    contribs.sort((a,b)=>Math.abs(b.contribution)-Math.abs(a.contribution));
    return { driver_id: f.driver_id, race_id: f.race_id, prob_points, score: sc, top_factors: contribs.slice(0,5) };
  });

  return Response.json(driver_id ? rows[0] : rows.sort((a,b)=>b.prob_points-a.prob_points));
}
