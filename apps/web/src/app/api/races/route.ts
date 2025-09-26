/**
 * Races API (GET /api/races)
 * Returns races with id/name/season/round for dropdowns and normalization.
 */
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET() {
  try {
    // Read the JSON file dynamically
    const filePath = join(process.cwd(), 'data/races.json');
    const fileContents = readFileSync(filePath, 'utf8');
    const racesData = JSON.parse(fileContents);

    // Return the JSON races data directly, sorted by season and round
    const sortedRaces = racesData.sort((a: any, b: any) => {
      if (a.season !== b.season) return b.season - a.season; // Newest season first
      return a.round - b.round; // Earlier rounds first within season
    });

    return Response.json(sortedRaces);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("/api/races error:", msg);
    return new Response("internal error", { status: 500 });
  }
}
