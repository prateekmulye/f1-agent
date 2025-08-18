import { sql } from "@/lib/db";

export async function GET() {
  try {
    const rows = await sql`
      select driver_number, full_name, name_acronym, team_name, country_code, country_name
      from openf1_drivers
    `;
    return Response.json(rows);
  } catch {
    return Response.json([]);
  }
}
