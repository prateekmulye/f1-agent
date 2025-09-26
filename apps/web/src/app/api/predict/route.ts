/**
 * Predict API (GET /api/predict)
 *
 * Computes probability of scoring points for one or many drivers in a race
 * using a simple logistic baseline and coefficients stored in the database.
 * Returns either a single record (when driver_id is provided) or a sorted list.
 */
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

const featureValue = (f: Features, feature: string): number => {
  switch (feature) {
    case "quali_pos":
      return f.quali_pos;
    case "avg_fp_longrun_delta":
      return f.avg_fp_longrun_delta;
    case "constructor_form":
      return f.constructor_form;
    case "driver_form":
      return f.driver_form;
    case "circuit_effect":
      return f.circuit_effect;
    case "weather_risk":
      return f.weather_risk;
    default:
      return 0;
  }
};

function score(feat: Features, coeffs: Coeff[]) {
  let s = 0;
  for (const c of coeffs) s += featureValue(feat, c.feature) * c.weight;
  return s;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const race_id = searchParams.get("race_id");
    const driver_id = searchParams.get("driver_id");
    if (!race_id) return new Response("race_id required", { status: 400 });

    const coeffRows = await sql`select feature, weight from model_coeffs where model='baseline_v1'`;
    if (coeffRows.length === 0) return new Response("no coefficients loaded", { status: 500 });
    const coeffs = (coeffRows as Array<{ feature: string; weight: number }>).map((row) => ({
      feature: row.feature,
      weight: Number(row.weight),
    }));

    const feats = (driver_id
      ? await sql`select * from features_current where race_id=${race_id} and driver_id=${driver_id}`
      : await sql`select * from features_current where race_id=${race_id}`) as Features[];

    if (!feats || feats.length === 0) {
      const msg = driver_id ? `no features for race_id=${race_id} driver_id=${driver_id}` : `no features for race_id=${race_id}`;
      return new Response(msg, { status: 404 });
    }

  const rows = feats.map((f) => {
      const sc = score(f as Features, coeffs);
      const prob_points = sigmoid(sc);
      const contribs = coeffs
        .map((c) => ({
          feature: c.feature,
      contribution: Number(featureValue(f as Features, c.feature) * c.weight),
        }))
        .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
        .slice(0, 5);

      return {
        driver_id: f.driver_id,
        race_id: f.race_id,
        prob_points: Number(prob_points),
        score: Number(sc),
        top_factors: contribs,
      };
    });

  if (driver_id) return Response.json(rows[0]);

    const sortedRows = rows.sort((a, b) => b.prob_points - a.prob_points);
    return Response.json(sortedRows);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("/api/predict error:", msg);
    return new Response("internal error", { status: 500 });
  }
}