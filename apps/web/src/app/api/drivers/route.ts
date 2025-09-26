/**
 * Drivers API (GET /api/drivers)
 * Returns all drivers with their current teams
 */
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET() {
  try {
    // Read the JSON file dynamically
    const filePath = join(process.cwd(), 'data/drivers.json');
    const fileContents = readFileSync(filePath, 'utf8');
    const driversData = JSON.parse(fileContents);

    // Return the JSON driver data directly
    return Response.json(driversData);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("/api/drivers error:", msg);
    return new Response("internal error", { status: 500 });
  }
}