/**
 * Drivers API (GET /api/drivers)
 * Returns driver data from JSON files as fallback when Python API is not available
 */
import { NextRequest } from 'next/server';

// Driver data for 2025 season (matches the Python API structure)
const DRIVERS_2025 = [
  { "id": "VER", "code": "VER", "name": "Max Verstappen", "constructor": "Red Bull Racing", "number": 1, "nationality": "Dutch", "flag": "🇳🇱", "season": 2025 },
  { "id": "LEC", "code": "LEC", "name": "Charles Leclerc", "constructor": "Ferrari", "number": 16, "nationality": "Monégasque", "flag": "🇲🇨", "season": 2025 },
  { "id": "NOR", "code": "NOR", "name": "Lando Norris", "constructor": "McLaren", "number": 4, "nationality": "British", "flag": "🇬🇧", "season": 2025 },
  { "id": "PIA", "code": "PIA", "name": "Oscar Piastri", "constructor": "McLaren", "number": 81, "nationality": "Australian", "flag": "🇦🇺", "season": 2025 },
  { "id": "HAM", "code": "HAM", "name": "Lewis Hamilton", "constructor": "Ferrari", "number": 44, "nationality": "British", "flag": "🇬🇧", "season": 2025 },
  { "id": "RUS", "code": "RUS", "name": "George Russell", "constructor": "Mercedes", "number": 63, "nationality": "British", "flag": "🇬🇧", "season": 2025 },
  { "id": "ANT", "code": "ANT", "name": "Kimi Antonelli", "constructor": "Mercedes", "number": 12, "nationality": "Italian", "flag": "🇮🇹", "season": 2025 },
  { "id": "TSU", "code": "TSU", "name": "Yuki Tsunoda", "constructor": "Red Bull Racing", "number": 22, "nationality": "Japanese", "flag": "🇯🇵", "season": 2025 },
  { "id": "ALO", "code": "ALO", "name": "Fernando Alonso", "constructor": "Aston Martin", "number": 14, "nationality": "Spanish", "flag": "🇪🇸", "season": 2025 },
  { "id": "STR", "code": "STR", "name": "Lance Stroll", "constructor": "Aston Martin", "number": 18, "nationality": "Canadian", "flag": "🇨🇦", "season": 2025 },
  { "id": "GAS", "code": "GAS", "name": "Pierre Gasly", "constructor": "Alpine", "number": 10, "nationality": "French", "flag": "🇫🇷", "season": 2025 },
  { "id": "OCO", "code": "OCO", "name": "Esteban Ocon", "constructor": "Haas", "number": 31, "nationality": "French", "flag": "🇫🇷", "season": 2025 },
  { "id": "HUL", "code": "HUL", "name": "Nico Hülkenberg", "constructor": "Sauber", "number": 27, "nationality": "German", "flag": "🇩🇪", "season": 2025 },
  { "id": "MAG", "code": "MAG", "name": "Kevin Magnussen", "constructor": "Haas", "number": 20, "nationality": "Danish", "flag": "🇩🇰", "season": 2025 },
  { "id": "ALB", "code": "ALB", "name": "Alexander Albon", "constructor": "Williams", "number": 23, "nationality": "Thai", "flag": "🇹🇭", "season": 2025 },
  { "id": "SAR", "code": "SAR", "name": "Logan Sargeant", "constructor": "Williams", "number": 2, "nationality": "American", "flag": "🇺🇸", "season": 2025 },
  { "id": "RIC", "code": "RIC", "name": "Daniel Ricciardo", "constructor": "RB", "number": 3, "nationality": "Australian", "flag": "🇦🇺", "season": 2025 },
  { "id": "LAW", "code": "LAW", "name": "Liam Lawson", "constructor": "RB", "number": 40, "nationality": "New Zealander", "flag": "🇳🇿", "season": 2025 },
  { "id": "BEA", "code": "BEA", "name": "Ollie Bearman", "constructor": "Sauber", "number": 87, "nationality": "British", "flag": "🇬🇧", "season": 2025 },
  { "id": "DOR", "code": "DOR", "name": "Jack Doohan", "constructor": "Alpine", "number": 7, "nationality": "Australian", "flag": "🇦🇺", "season": 2025 }
];

const DRIVERS_2024 = [
  { "id": "VER", "code": "VER", "name": "Max Verstappen", "constructor": "Red Bull Racing", "number": 1, "nationality": "Dutch", "flag": "🇳🇱", "season": 2024 },
  { "id": "PER", "code": "PER", "name": "Sergio Pérez", "constructor": "Red Bull Racing", "number": 11, "nationality": "Mexican", "flag": "🇲🇽", "season": 2024 },
  { "id": "LEC", "code": "LEC", "name": "Charles Leclerc", "constructor": "Ferrari", "number": 16, "nationality": "Monégasque", "flag": "🇲🇨", "season": 2024 },
  { "id": "SAI", "code": "SAI", "name": "Carlos Sainz Jr.", "constructor": "Ferrari", "number": 55, "nationality": "Spanish", "flag": "🇪🇸", "season": 2024 },
  { "id": "HAM", "code": "HAM", "name": "Lewis Hamilton", "constructor": "Mercedes", "number": 44, "nationality": "British", "flag": "🇬🇧", "season": 2024 },
  { "id": "RUS", "code": "RUS", "name": "George Russell", "constructor": "Mercedes", "number": 63, "nationality": "British", "flag": "🇬🇧", "season": 2024 },
  { "id": "NOR", "code": "NOR", "name": "Lando Norris", "constructor": "McLaren", "number": 4, "nationality": "British", "flag": "🇬🇧", "season": 2024 },
  { "id": "PIA", "code": "PIA", "name": "Oscar Piastri", "constructor": "McLaren", "number": 81, "nationality": "Australian", "flag": "🇦🇺", "season": 2024 },
  { "id": "ALO", "code": "ALO", "name": "Fernando Alonso", "constructor": "Aston Martin", "number": 14, "nationality": "Spanish", "flag": "🇪🇸", "season": 2024 },
  { "id": "STR", "code": "STR", "name": "Lance Stroll", "constructor": "Aston Martin", "number": 18, "nationality": "Canadian", "flag": "🇨🇦", "season": 2024 }
];

const ALL_DRIVERS = [...DRIVERS_2025, ...DRIVERS_2024];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const season = searchParams.get('season');

    if (season) {
      const seasonNum = parseInt(season);
      const drivers = ALL_DRIVERS.filter(d => d.season === seasonNum);

      if (drivers.length === 0) {
        // Default to 2025 if season not found
        return Response.json(DRIVERS_2025);
      }

      return Response.json(drivers);
    }

    // Return all drivers if no season specified
    return Response.json(ALL_DRIVERS);
  } catch (error) {
    console.error('Error in drivers API:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}