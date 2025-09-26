/**
 * Standings API (GET /api/standings)
 * Returns championship standings (drivers and constructors) with real data from database
 */
import { NextRequest } from "next/server";
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.NEON_DATABASE_URL!);

// Mock points data based on team performance and predictions
// In a real scenario, this would come from actual race results
const generateMockStandings = (drivers: any[], season: number = 2025) => {
  const basePoints = {
    "Red Bull Racing": { multiplier: 1.0, base: 400 },
    "Ferrari": { multiplier: 0.85, base: 350 },
    "Mercedes": { multiplier: 0.80, base: 320 },
    "McLaren": { multiplier: 0.88, base: 340 },
    "Aston Martin": { multiplier: 0.65, base: 250 },
    "Alpine": { multiplier: 0.55, base: 200 },
    "Williams": { multiplier: 0.45, base: 150 },
    "RB": { multiplier: 0.60, base: 220 },
    "Kick Sauber": { multiplier: 0.35, base: 100 },
    "Haas": { multiplier: 0.50, base: 180 }
  };

  const driverMultipliers: Record<string, number> = {
    "VER": 1.00, "HAM": 0.90, "LEC": 0.88, "NOR": 0.85, "RUS": 0.82,
    "PER": 0.75, "PIA": 0.78, "ALO": 0.80, "ANT": 0.65, "STR": 0.60,
    "GAS": 0.70, "OCO": 0.68, "ALB": 0.72, "SAR": 0.45, "TSU": 0.67,
    "RIC": 0.65, "BOT": 0.63, "ZHO": 0.50, "HUL": 0.69, "MAG": 0.66
  };

  return drivers.map((driver: any, index: number) => {
    const teamData = basePoints[driver.constructor as keyof typeof basePoints] || { multiplier: 0.5, base: 100 };
    const driverMultiplier = driverMultipliers[driver.id] || 0.5;
    const randomFactor = 0.9 + Math.random() * 0.2; // Add some variation

    const points = Math.round(teamData.base * teamData.multiplier * driverMultiplier * randomFactor);

    return {
      position: index + 1,
      driver_id: driver.id,
      driver_code: driver.code,
      driver_name: driver.name,
      constructor: driver.constructor,
      points: points,
      wins: points > 300 ? Math.floor(points / 40) : Math.floor(Math.random() * 3),
      podiums: points > 200 ? Math.floor(points / 25) : Math.floor(Math.random() * 8),
      season: season
    };
  }).sort((a: any, b: any) => b.points - a.points)
    .map((driver: any, index: number) => ({ ...driver, position: index + 1 }));
};

const generateConstructorStandings = (driverStandings: any[]) => {
  const constructorMap = new Map();

  driverStandings.forEach(driver => {
    if (!constructorMap.has(driver.constructor)) {
      constructorMap.set(driver.constructor, {
        constructor: driver.constructor,
        points: 0,
        wins: 0,
        podiums: 0,
        drivers: []
      });
    }

    const constructor = constructorMap.get(driver.constructor);
    constructor.points += driver.points;
    constructor.wins += driver.wins;
    constructor.podiums += driver.podiums;
    constructor.drivers.push({
      id: driver.driver_id,
      name: driver.driver_name,
      points: driver.points
    });
  });

  return Array.from(constructorMap.values())
    .sort((a: any, b: any) => b.points - a.points)
    .map((constructor: any, index: number) => ({
      ...constructor,
      position: index + 1
    }));
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const season = parseInt(searchParams.get("season") || "2025");
    const type = searchParams.get("type") || "drivers"; // 'drivers' or 'constructors'

    if (type === "constructors") {
      // Get constructor standings from database
      const constructorStandings = await sql`
        SELECT
          ROW_NUMBER() OVER (ORDER BY d.constructor_points DESC) as position,
          d.constructor as name,
          d.constructor_points as points,
          COUNT(*) as driver_count,
          ARRAY_AGG(d.name ORDER BY d.number) as drivers,
          ARRAY_AGG(d.code ORDER BY d.number) as driver_codes,
          ARRAY_AGG(d.flag ORDER BY d.number) as driver_flags,
          0 as wins,
          0 as podiums
        FROM drivers d
        WHERE d.active = true
        GROUP BY d.constructor, d.constructor_points
        ORDER BY d.constructor_points DESC
      `;

      // Add team colors
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

      const enrichedStandings = constructorStandings.map((team: any) => ({
        ...team,
        colors: teamColors[team.name as keyof typeof teamColors] || {
          main: '#ffffff',
          light: '#f0f0f0',
          dark: '#e0e0e0',
          logo: '🏁'
        }
      }));

      return Response.json(enrichedStandings);
    }

    // Get driver standings from database
    const driverStandings = await sql`
      SELECT
        ROW_NUMBER() OVER (ORDER BY d.constructor_points DESC, d.name ASC) as position,
        d.id as driver_id,
        d.code as driver_code,
        d.name as driver_name,
        d.number,
        d.constructor,
        d.constructor_points as points,
        d.nationality,
        d.flag,
        0 as wins,
        0 as podiums,
        ${season} as season
      FROM drivers d
      WHERE d.active = true
      ORDER BY d.constructor_points DESC, d.name ASC
    `;

    if (!driverStandings || driverStandings.length === 0) {
      return new Response("no drivers found", { status: 404 });
    }

    console.log(`✅ Fetched ${type} standings for season ${season}`);
    return Response.json(driverStandings);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("/api/standings error:", msg);
    return new Response("internal error", { status: 500 });
  }
}