/**
 * Drivers API (GET /api/drivers)
 * Returns all drivers with their current teams and stats
 */
import { sql } from "@/lib/db";

export async function GET() {
  try {
    // Get all drivers with their current constructor
    const drivers = await sql`
      SELECT
        id,
        code,
        name,
        constructor
      FROM drivers
      ORDER BY constructor, name
    `;

    return Response.json(drivers);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("/api/drivers error:", msg);
    return new Response("internal error", { status: 500 });
  }
}