/**
 * OpenF1 Meetings API (GET /api/openf1/meetings)
 * Returns race meetings data with real-time sync capability
 */
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.NEON_DATABASE_URL!);
const OPENF1_BASE_URL = 'https://api.openf1.org/v1';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') || '2025';
    const sync = searchParams.get('sync') === 'true';

    // If sync is requested, fetch fresh data from OpenF1 API
    if (sync) {
      console.log(`🔄 Syncing OpenF1 meetings for year ${year}...`);

      const response = await fetch(`${OPENF1_BASE_URL}/meetings?year=${year}`);
      if (!response.ok) {
        throw new Error(`OpenF1 API error: ${response.status}`);
      }

      const meetings = await response.json();

      // Store/update meetings in our database
      for (const meeting of meetings) {
        await sql`
          INSERT INTO openf1_meetings (
            meeting_key, year, round_number, meeting_name, meeting_official_name,
            country_key, country_name, circuit_key, circuit_short_name,
            date_start, date_end, gmt_offset, location
          )
          VALUES (
            ${meeting.meeting_key}, ${meeting.year}, ${meeting.round_number || 0},
            ${meeting.meeting_name}, ${meeting.meeting_official_name || meeting.meeting_name},
            ${meeting.country_key}, ${meeting.country_name}, ${meeting.circuit_key},
            ${meeting.circuit_short_name}, ${meeting.date_start}, ${meeting.date_end},
            ${meeting.gmt_offset}, ${meeting.location}
          )
          ON CONFLICT (meeting_key) DO UPDATE SET
            year = EXCLUDED.year,
            round_number = EXCLUDED.round_number,
            meeting_name = EXCLUDED.meeting_name,
            meeting_official_name = EXCLUDED.meeting_official_name,
            country_key = EXCLUDED.country_key,
            country_name = EXCLUDED.country_name,
            circuit_key = EXCLUDED.circuit_key,
            circuit_short_name = EXCLUDED.circuit_short_name,
            date_start = EXCLUDED.date_start,
            date_end = EXCLUDED.date_end,
            gmt_offset = EXCLUDED.gmt_offset,
            location = EXCLUDED.location,
            updated_at = CURRENT_TIMESTAMP
        `;
      }

      console.log(`✅ Synced ${meetings.length} meetings from OpenF1`);
    }

    // Query meetings from our database
    const meetings = await sql`
      SELECT
        meeting_key as id,
        meeting_name as name,
        meeting_official_name as "officialName",
        year,
        round_number as round,
        country_name as country,
        country_key as "countryKey",
        circuit_short_name as circuit,
        date_start as "dateStart",
        date_end as "dateEnd",
        gmt_offset as "gmtOffset",
        location
      FROM openf1_meetings
      WHERE year = ${parseInt(year)}
      ORDER BY round_number ASC, date_start ASC
    `;

    console.log(`✅ Fetched ${meetings.length} meetings for year ${year}`);
    return Response.json({
      year: parseInt(year),
      count: meetings.length,
      synced: sync,
      data: meetings
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("/api/openf1/meetings error:", msg);
    return new Response(
      JSON.stringify({ error: "Failed to fetch meetings data", details: msg }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}