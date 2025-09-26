/**
 * Races API (GET /api/races)
 * Returns race data from JSON files as fallback when Python API is not available
 */
import { NextRequest } from 'next/server';

// Race data for 2025 season (matches the Python API structure)
const RACES_2025 = [
  { "id": "2025_bahrain", "name": "Bahrain Grand Prix", "season": 2025, "round": 1, "date": "2025-03-16", "country": "Bahrain", "circuit": "Bahrain International Circuit" },
  { "id": "2025_saudi_arabia", "name": "Saudi Arabian Grand Prix", "season": 2025, "round": 2, "date": "2025-03-23", "country": "Saudi Arabia", "circuit": "Jeddah Corniche Circuit" },
  { "id": "2025_australia", "name": "Australian Grand Prix", "season": 2025, "round": 3, "date": "2025-04-06", "country": "Australia", "circuit": "Albert Park Grand Prix Circuit" },
  { "id": "2025_japan", "name": "Japanese Grand Prix", "season": 2025, "round": 4, "date": "2025-04-13", "country": "Japan", "circuit": "Suzuka International Racing Course" },
  { "id": "2025_china", "name": "Chinese Grand Prix", "season": 2025, "round": 5, "date": "2025-04-20", "country": "China", "circuit": "Shanghai International Circuit" },
  { "id": "2025_miami", "name": "Miami Grand Prix", "season": 2025, "round": 6, "date": "2025-05-04", "country": "USA", "circuit": "Miami International Autodrome" },
  { "id": "2025_emilia_romagna", "name": "Emilia Romagna Grand Prix", "season": 2025, "round": 7, "date": "2025-05-18", "country": "Italy", "circuit": "Autodromo Enzo e Dino Ferrari" },
  { "id": "2025_monaco", "name": "Monaco Grand Prix", "season": 2025, "round": 8, "date": "2025-05-25", "country": "Monaco", "circuit": "Circuit de Monaco" },
  { "id": "2025_spain", "name": "Spanish Grand Prix", "season": 2025, "round": 9, "date": "2025-06-01", "country": "Spain", "circuit": "Circuit de Barcelona-Catalunya" },
  { "id": "2025_canada", "name": "Canadian Grand Prix", "season": 2025, "round": 10, "date": "2025-06-15", "country": "Canada", "circuit": "Circuit Gilles-Villeneuve" },
  { "id": "2025_austria", "name": "Austrian Grand Prix", "season": 2025, "round": 11, "date": "2025-06-29", "country": "Austria", "circuit": "Red Bull Ring" },
  { "id": "2025_great_britain", "name": "British Grand Prix", "season": 2025, "round": 12, "date": "2025-07-06", "country": "United Kingdom", "circuit": "Silverstone Circuit" },
  { "id": "2025_belgium", "name": "Belgian Grand Prix", "season": 2025, "round": 13, "date": "2025-07-27", "country": "Belgium", "circuit": "Circuit de Spa-Francorchamps" },
  { "id": "2025_hungary", "name": "Hungarian Grand Prix", "season": 2025, "round": 14, "date": "2025-08-03", "country": "Hungary", "circuit": "Hungaroring" },
  { "id": "2025_netherlands", "name": "Dutch Grand Prix", "season": 2025, "round": 15, "date": "2025-08-31", "country": "Netherlands", "circuit": "Circuit Zandvoort" },
  { "id": "2025_italy", "name": "Italian Grand Prix", "season": 2025, "round": 16, "date": "2025-09-07", "country": "Italy", "circuit": "Autodromo Nazionale di Monza" },
  { "id": "2025_azerbaijan", "name": "Azerbaijan Grand Prix", "season": 2025, "round": 17, "date": "2025-09-21", "country": "Azerbaijan", "circuit": "Baku City Circuit" },
  { "id": "2025_singapore", "name": "Singapore Grand Prix", "season": 2025, "round": 18, "date": "2025-10-05", "country": "Singapore", "circuit": "Marina Bay Street Circuit" },
  { "id": "2025_united_states", "name": "United States Grand Prix", "season": 2025, "round": 19, "date": "2025-10-19", "country": "USA", "circuit": "Circuit of the Americas" },
  { "id": "2025_mexico", "name": "Mexico City Grand Prix", "season": 2025, "round": 20, "date": "2025-10-26", "country": "Mexico", "circuit": "Autódromo Hermanos Rodríguez" },
  { "id": "2025_brazil", "name": "Brazilian Grand Prix", "season": 2025, "round": 21, "date": "2025-11-09", "country": "Brazil", "circuit": "Autodromo José Carlos Pace" },
  { "id": "2025_las_vegas", "name": "Las Vegas Grand Prix", "season": 2025, "round": 22, "date": "2025-11-23", "country": "USA", "circuit": "Las Vegas Street Circuit" },
  { "id": "2025_qatar", "name": "Qatar Grand Prix", "season": 2025, "round": 23, "date": "2025-11-30", "country": "Qatar", "circuit": "Losail International Circuit" },
  { "id": "2025_abu_dhabi", "name": "Abu Dhabi Grand Prix", "season": 2025, "round": 24, "date": "2025-12-07", "country": "UAE", "circuit": "Yas Marina Circuit" }
];

const RACES_2024 = [
  { "id": "2024_bahrain", "name": "Bahrain Grand Prix", "season": 2024, "round": 1, "date": "2024-03-02", "country": "Bahrain", "circuit": "Bahrain International Circuit" },
  { "id": "2024_saudi_arabia", "name": "Saudi Arabian Grand Prix", "season": 2024, "round": 2, "date": "2024-03-09", "country": "Saudi Arabia", "circuit": "Jeddah Corniche Circuit" },
  { "id": "2024_australia", "name": "Australian Grand Prix", "season": 2024, "round": 3, "date": "2024-03-24", "country": "Australia", "circuit": "Albert Park Grand Prix Circuit" },
  { "id": "2024_japan", "name": "Japanese Grand Prix", "season": 2024, "round": 4, "date": "2024-04-07", "country": "Japan", "circuit": "Suzuka International Racing Course" },
  { "id": "2024_china", "name": "Chinese Grand Prix", "season": 2024, "round": 5, "date": "2024-04-21", "country": "China", "circuit": "Shanghai International Circuit" },
  { "id": "2024_miami", "name": "Miami Grand Prix", "season": 2024, "round": 6, "date": "2024-05-05", "country": "USA", "circuit": "Miami International Autodrome" },
  { "id": "2024_emilia_romagna", "name": "Emilia Romagna Grand Prix", "season": 2024, "round": 7, "date": "2024-05-19", "country": "Italy", "circuit": "Autodromo Enzo e Dino Ferrari" },
  { "id": "2024_monaco", "name": "Monaco Grand Prix", "season": 2024, "round": 8, "date": "2024-05-26", "country": "Monaco", "circuit": "Circuit de Monaco" },
  { "id": "2024_canada", "name": "Canadian Grand Prix", "season": 2024, "round": 9, "date": "2024-06-09", "country": "Canada", "circuit": "Circuit Gilles-Villeneuve" },
  { "id": "2024_spain", "name": "Spanish Grand Prix", "season": 2024, "round": 10, "date": "2024-06-23", "country": "Spain", "circuit": "Circuit de Barcelona-Catalunya" },
  { "id": "2024_austria", "name": "Austrian Grand Prix", "season": 2024, "round": 11, "date": "2024-06-30", "country": "Austria", "circuit": "Red Bull Ring" },
  { "id": "2024_great_britain", "name": "British Grand Prix", "season": 2024, "round": 12, "date": "2024-07-07", "country": "United Kingdom", "circuit": "Silverstone Circuit" },
  { "id": "2024_hungary", "name": "Hungarian Grand Prix", "season": 2024, "round": 13, "date": "2024-07-21", "country": "Hungary", "circuit": "Hungaroring" },
  { "id": "2024_belgium", "name": "Belgian Grand Prix", "season": 2024, "round": 14, "date": "2024-07-28", "country": "Belgium", "circuit": "Circuit de Spa-Francorchamps" },
  { "id": "2024_netherlands", "name": "Dutch Grand Prix", "season": 2024, "round": 15, "date": "2024-08-25", "country": "Netherlands", "circuit": "Circuit Zandvoort" },
  { "id": "2024_italy", "name": "Italian Grand Prix", "season": 2024, "round": 16, "date": "2024-09-01", "country": "Italy", "circuit": "Autodromo Nazionale di Monza" },
  { "id": "2024_azerbaijan", "name": "Azerbaijan Grand Prix", "season": 2024, "round": 17, "date": "2024-09-15", "country": "Azerbaijan", "circuit": "Baku City Circuit" },
  { "id": "2024_singapore", "name": "Singapore Grand Prix", "season": 2024, "round": 18, "date": "2024-09-22", "country": "Singapore", "circuit": "Marina Bay Street Circuit" },
  { "id": "2024_united_states", "name": "United States Grand Prix", "season": 2024, "round": 19, "date": "2024-10-20", "country": "USA", "circuit": "Circuit of the Americas" },
  { "id": "2024_mexico", "name": "Mexico City Grand Prix", "season": 2024, "round": 20, "date": "2024-10-27", "country": "Mexico", "circuit": "Autódromo Hermanos Rodríguez" },
  { "id": "2024_brazil", "name": "Brazilian Grand Prix", "season": 2024, "round": 21, "date": "2024-11-03", "country": "Brazil", "circuit": "Autodromo José Carlos Pace" },
  { "id": "2024_abu_dhabi", "name": "Abu Dhabi Grand Prix", "season": 2024, "round": 22, "date": "2024-12-08", "country": "UAE", "circuit": "Yas Marina Circuit" }
];

const ALL_RACES = [...RACES_2025, ...RACES_2024];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const season = searchParams.get('season');

    if (season) {
      const seasonNum = parseInt(season);
      const races = ALL_RACES.filter(r => r.season === seasonNum);

      if (races.length === 0) {
        // Default to 2025 if season not found
        return Response.json(RACES_2025);
      }

      return Response.json(races);
    }

    // Return all races if no season specified, sorted by most recent first
    const sortedRaces = ALL_RACES.sort((a, b) => {
      if (a.season !== b.season) {
        return b.season - a.season; // Most recent season first
      }
      return b.round - a.round; // Most recent round first
    });

    return Response.json(sortedRaces);
  } catch (error) {
    console.error('Error in races API:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
