/**
 * Race Results API (GET /api/results)
 * Returns race results with optional race_id and season parameters
 */
import { NextRequest } from "next/server";
import { sql } from "@/lib/db";

// Generate realistic race results based on predictions and team performance
const generateRaceResult = (raceId: string, drivers: any[], predictions: any[]) => {
  const predictionMap = new Map(predictions.map(p => [p.driver_id, p.quali_pos || 10]));

  // Generate finishing positions based on prediction probabilities
  const results = drivers.map(driver => {
    const predictionScore = predictionMap.get(driver.id) || 0;
    const teamPerformance = getTeamPerformanceMultiplier(driver.constructor);
    const randomFactor = Math.random();

    const score = (predictionScore * 100) + (teamPerformance * 50) + (randomFactor * 20);

    return {
      race_id: raceId,
      driver_id: driver.id,
      driver_code: driver.code,
      driver_name: driver.name,
      constructor: driver.constructor,
      grid_position: Math.floor(Math.random() * 20) + 1,
      finish_position: 0, // Will be set after sorting
      points: 0, // Will be calculated based on finish position
      fastest_lap: false,
      status: Math.random() > 0.15 ? "Finished" : getRandomDNF(),
      score: score
    };
  });

  // Sort by score and assign finish positions
  results.sort((a, b) => b.score - a.score);

  const pointsSystem = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];

  results.forEach((result, index) => {
    result.finish_position = index + 1;

    if (result.status === "Finished") {
      result.points = pointsSystem[index] || 0;
      if (index === 0 && Math.random() > 0.7) {
        result.fastest_lap = true;
        result.points += 1;
      }
    } else {
      result.finish_position = 999; // DNF
      result.points = 0;
    }

    delete result.score; // Remove internal score
  });

  return results.sort((a, b) => {
    if (a.finish_position === 999 && b.finish_position === 999) return 0;
    if (a.finish_position === 999) return 1;
    if (b.finish_position === 999) return -1;
    return a.finish_position - b.finish_position;
  });
};

const getTeamPerformanceMultiplier = (constructor: string) => {
  const performance: Record<string, number> = {
    "Red Bull Racing": 1.0,
    "Ferrari": 0.85,
    "Mercedes": 0.80,
    "McLaren": 0.88,
    "Aston Martin": 0.65,
    "Alpine": 0.55,
    "Williams": 0.45,
    "RB": 0.60,
    "Kick Sauber": 0.35,
    "Haas": 0.50
  };
  return performance[constructor] || 0.5;
};

const getRandomDNF = () => {
  const dnfReasons = ["Mechanical", "Accident", "Collision", "Engine", "Gearbox", "Suspension"];
  return dnfReasons[Math.floor(Math.random() * dnfReasons.length)];
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const raceId = searchParams.get("race_id");
    const season = parseInt(searchParams.get("season") || "2025");
    const limit = parseInt(searchParams.get("limit") || "10");

    if (raceId) {
      // Get specific race result
      const drivers = await sql`SELECT * FROM drivers ORDER BY constructor, name`;

      // Get predictions for this race to make realistic results
      const predictions = await sql`SELECT driver_id, quali_pos FROM features_current WHERE race_id = ${raceId}`;

      if (predictions.length === 0) {
        return new Response(`no prediction data for race ${raceId}`, { status: 404 });
      }

      const raceResult = generateRaceResult(raceId, drivers, predictions);
      return Response.json(raceResult);
    } else {
      // Get recent race results
      const races = await sql`
        SELECT id, name, date, season
        FROM races
        WHERE season <= ${season}
        ORDER BY season DESC, round DESC
        LIMIT ${limit}
      `;

      const results = await Promise.all(
        races.map(async (race: any) => {
          const drivers = await sql`SELECT * FROM drivers LIMIT 5`; // Just top 5 for overview
          const predictions = await sql`SELECT driver_id, quali_pos FROM features_current WHERE race_id = ${race.id} LIMIT 5`;

          if (predictions.length === 0) {
            return {
              race_id: race.id,
              race_name: race.name,
              race_date: race.date,
              season: race.season,
              results: []
            };
          }

          const raceResults = generateRaceResult(race.id, drivers, predictions);

          return {
            race_id: race.id,
            race_name: race.name,
            race_date: race.date,
            season: race.season,
            results: raceResults.slice(0, 3) // Top 3 for overview
          };
        })
      );

      return Response.json(results.filter(r => r.results.length > 0));
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("/api/results error:", msg);
    return new Response("internal error", { status: 500 });
  }
}