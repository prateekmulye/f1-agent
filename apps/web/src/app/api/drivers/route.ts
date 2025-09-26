/**
 * Drivers API (GET /api/drivers)
 * Returns all drivers with their current teams - 2025 season data from database
 */
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.NEON_DATABASE_URL!);

export async function GET() {
  try {
    // Query basic drivers from the database
    const driversFromDB = await sql`
      SELECT
        d.id,
        d.code,
        d.name,
        d.constructor
      FROM drivers d
      ORDER BY d.constructor, d.name ASC
    `;

    // Enhanced driver data with 2025 season information
    const driverEnhancements = {
      'VER': { number: 1, nationality: 'Dutch', flag: '🇳🇱', constructorPoints: 589 },
      'PER': { number: 11, nationality: 'Mexican', flag: '🇲🇽', constructorPoints: 589 },
      'NOR': { number: 4, nationality: 'British', flag: '🇬🇧', constructorPoints: 544 },
      'PIA': { number: 81, nationality: 'Australian', flag: '🇦🇺', constructorPoints: 544 },
      'LEC': { number: 16, nationality: 'Monégasque', flag: '🇲🇨', constructorPoints: 537 },
      'HAM': { number: 44, nationality: 'British', flag: '🇬🇧', constructorPoints: 537 },
      'RUS': { number: 63, nationality: 'British', flag: '🇬🇧', constructorPoints: 382 },
      'ANT': { number: 12, nationality: 'Italian', flag: '🇮🇹', constructorPoints: 382 },
      'ALO': { number: 14, nationality: 'Spanish', flag: '🇪🇸', constructorPoints: 94 },
      'STR': { number: 18, nationality: 'Canadian', flag: '🇨🇦', constructorPoints: 94 },
      'TSU': { number: 22, nationality: 'Japanese', flag: '🇯🇵', constructorPoints: 46 },
      'LAW': { number: 30, nationality: 'New Zealander', flag: '🇳🇿', constructorPoints: 46 },
      'GAS': { number: 10, nationality: 'French', flag: '🇫🇷', constructorPoints: 65 },
      'OCO': { number: 31, nationality: 'French', flag: '🇫🇷', constructorPoints: 65 },
      'ALB': { number: 23, nationality: 'Thai', flag: '🇹🇭', constructorPoints: 17 },
      'DOO': { number: 45, nationality: 'Australian', flag: '🇦🇺', constructorPoints: 17 },
      'HUL': { number: 27, nationality: 'German', flag: '🇩🇪', constructorPoints: 54 },
      'BEA': { number: 50, nationality: 'British', flag: '🇬🇧', constructorPoints: 54 },
      'HAD': { number: 25, nationality: 'Brazilian', flag: '🇧🇷', constructorPoints: 0 },
      'SAI': { number: 55, nationality: 'Spanish', flag: '🇪🇸', constructorPoints: 0 }
    };

    // Merge database data with enhancements
    const enrichedDrivers = driversFromDB.map(driver => {
      const enhancements = driverEnhancements[driver.code as keyof typeof driverEnhancements];
      return {
        ...driver,
        number: enhancements?.number || 99,
        nationality: enhancements?.nationality || 'Unknown',
        flag: enhancements?.flag || '🏁',
        constructorPoints: enhancements?.constructorPoints || 0
      };
    }).sort((a, b) => b.constructorPoints - a.constructorPoints);

    console.log(`✅ Fetched ${enrichedDrivers.length} drivers from database with enhancements`);
    return Response.json(enrichedDrivers);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("/api/drivers error:", msg);
    return new Response("internal error", { status: 500 });
  }
}