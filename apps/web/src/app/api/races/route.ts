import { sql } from "@/lib/db";
export async function GET() {
  const rows = await sql`
    select id, name, season, round from races order by season desc, round desc`;
  return Response.json(rows);
}
