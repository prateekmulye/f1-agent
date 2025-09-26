/**
 * Races API (GET /api/races)
 * Returns races with id/name/season/round for dropdowns and normalization from database
 */
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.NEON_DATABASE_URL!);

export async function GET() {
  try {
    // Query races from the database
    const races = await sql`
      SELECT
        r.id,
        r.name,
        r.season,
        r.round,
        r.date,
        r.country
      FROM races r
      ORDER BY r.season DESC, r.round ASC
    `;

    console.log(`✅ Fetched ${races.length} races from database`);
    return Response.json(races);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("/api/races error:", msg);
    return new Response("internal error", { status: 500 });
  }
}
