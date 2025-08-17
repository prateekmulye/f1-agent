/**
 * OpenF1 data proxy (GET /api/data/openf1)
 * Placeholder for future data wiring; currently returns a simple ok status.
 */
import { NextRequest } from "next/server";
import { sql } from "@/lib/db";
export async function GET(_req: NextRequest) {
  return Response.json({ status: "ok", note: "Plug OpenF1 here later; tonight we focus on evals/tools." });
}
