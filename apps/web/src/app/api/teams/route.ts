/**
 * Teams API (GET /api/teams)
 * Returns all F1 teams with their colors, logos, and current standings
 */
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.NEON_DATABASE_URL!);

export async function GET() {
  try {
    // Query teams from database (basic info only)
    const teamsFromDB = await sql`
      SELECT
        d.constructor as name,
        COUNT(*) as driver_count,
        ARRAY_AGG(d.name) as drivers,
        ARRAY_AGG(d.code) as driver_codes
      FROM drivers d
      GROUP BY d.constructor
      ORDER BY d.constructor
    `;

    // Add constructor standings based on 2024 season end results
    const constructorStandings = {
      'Red Bull Racing': 589,
      'McLaren': 544,
      'Ferrari': 537,
      'Mercedes': 382,
      'Aston Martin': 94,
      'Alpine': 65,
      'Haas': 54,
      'RB': 46,
      'Williams': 17,
      'Sauber': 0
    };

    // Enhanced teams data
    const teams = teamsFromDB.map(team => ({
      ...team,
      points: constructorStandings[team.name as keyof typeof constructorStandings] || 0
    })).sort((a, b) => b.points - a.points);

    // Add team colors and logos (hardcoded for now, can be moved to database later)
    const teamColors = {
      'Red Bull Racing': { main: '#1E41FF', light: '#4B6BFF', dark: '#0A2EE6', logo: '🏆' },
      'McLaren': { main: '#FF8700', light: '#FFB347', dark: '#E6760A', logo: '🧡' },
      'Ferrari': { main: '#E8002D', light: '#FF4D6D', dark: '#C4002A', logo: '🏎️' },
      'Mercedes': { main: '#27F4D2', light: '#5EF7DE', dark: '#1DD1B0', logo: '⭐' },
      'Aston Martin': { main: '#229971', light: '#4CAF50', dark: '#1B7A5A', logo: '💚' },
      'RB': { main: '#6692FF', light: '#8BB0FF', dark: '#4A7AE6', logo: '🔵' },
      'Alpine': { main: '#FF87BC', light: '#FFB3D1', dark: '#E665A0', logo: '🇫🇷' },
      'Williams': { main: '#64C4FF', light: '#8AD4FF', dark: '#4AB8E6', logo: '🔷' },
      'Haas': { main: '#B6BABD', light: '#D0D3D6', dark: '#9CA0A3', logo: '🇺🇸' },
      'Sauber': { main: '#52E252', light: '#7AE67A', dark: '#2ECC2E', logo: '🇨🇭' }
    };

    const enrichedTeams = teams.map((team: any, index: number) => ({
      id: team.name.toLowerCase().replace(/\s+/g, '_'),
      name: team.name,
      position: index + 1,
      points: team.points,
      driverCount: team.driver_count,
      drivers: team.drivers,
      driverCodes: team.driver_codes,
      driverNumbers: team.driver_numbers,
      colors: teamColors[team.name as keyof typeof teamColors] || {
        main: '#ffffff',
        light: '#f0f0f0',
        dark: '#e0e0e0',
        logo: '🏁'
      }
    }));

    console.log(`✅ Fetched ${enrichedTeams.length} teams from database`);
    return Response.json(enrichedTeams);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("/api/teams error:", msg);
    return new Response("internal error", { status: 500 });
  }
}