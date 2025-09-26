"use client";
import { useState, useEffect } from "react";
import ModernNavbar from "@/components/ModernNavbar";
import FloatingChat from "@/components/FloatingChat";

// Mock race results data
const mockRaceResults = [
  {
    race: "British Grand Prix 2024",
    date: "2024-07-07",
    circuit: "Silverstone Circuit",
    flag: "🇬🇧",
    weather: "Dry",
    results: [
      { position: 1, driver: "VER", name: "Max Verstappen", team: "Red Bull Racing", time: "1:25:30.123", points: 25, teamColor: "#3671C6", fastestLap: false },
      { position: 2, driver: "HAM", name: "Lewis Hamilton", team: "Mercedes", time: "+2.456", points: 18, teamColor: "#27F4D2", fastestLap: true },
      { position: 3, driver: "LEC", name: "Charles Leclerc", team: "Ferrari", time: "+8.901", points: 15, teamColor: "#E8002D", fastestLap: false },
      { position: 4, driver: "NOR", name: "Lando Norris", team: "McLaren", time: "+12.345", points: 12, teamColor: "#FF8000", fastestLap: false },
      { position: 5, driver: "SAI", name: "Carlos Sainz", team: "Ferrari", time: "+18.678", points: 10, teamColor: "#E8002D", fastestLap: false },
      { position: 6, driver: "RUS", name: "George Russell", team: "Mercedes", time: "+25.432", points: 8, teamColor: "#27F4D2", fastestLap: false },
      { position: 7, driver: "PIA", name: "Oscar Piastri", team: "McLaren", time: "+31.876", points: 6, teamColor: "#FF8000", fastestLap: false },
      { position: 8, driver: "ALO", name: "Fernando Alonso", team: "Aston Martin", time: "+45.123", points: 4, teamColor: "#229971", fastestLap: false },
      { position: 9, driver: "STR", name: "Lance Stroll", team: "Aston Martin", time: "+52.789", points: 2, teamColor: "#229971", fastestLap: false },
      { position: 10, driver: "GAS", name: "Pierre Gasly", team: "Alpine", time: "+58.456", points: 1, teamColor: "#0093CC", fastestLap: false },
    ],
    lapRecord: {
      driver: "HAM",
      time: "1:26.897",
      year: "2024"
    }
  },
  {
    race: "Austrian Grand Prix 2024",
    date: "2024-06-30",
    circuit: "Red Bull Ring",
    flag: "🇦🇹",
    weather: "Dry",
    results: [
      { position: 1, driver: "VER", name: "Max Verstappen", team: "Red Bull Racing", time: "1:20:45.678", points: 26, teamColor: "#3671C6", fastestLap: true },
      { position: 2, driver: "NOR", name: "Lando Norris", team: "McLaren", time: "+5.432", points: 18, teamColor: "#FF8000", fastestLap: false },
      { position: 3, driver: "LEC", name: "Charles Leclerc", team: "Ferrari", time: "+11.234", points: 15, teamColor: "#E8002D", fastestLap: false },
      // ... more results
    ],
    lapRecord: {
      driver: "VER",
      time: "1:05.619",
      year: "2024"
    }
  }
];

interface RaceResultsProps {
  raceData: typeof mockRaceResults[0];
}

function RaceResultsCard({ raceData }: RaceResultsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="glass-card overflow-hidden mb-8">
      {/* Race Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-4xl">{raceData.flag}</div>
            <div>
              <h3 className="text-xl font-bold text-white">{raceData.race}</h3>
              <div className="flex items-center space-x-4 text-sm text-gray-400 mt-1">
                <span>{raceData.circuit}</span>
                <span>•</span>
                <span>{raceData.date}</span>
                <span>•</span>
                <span>{raceData.weather} conditions</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="glass-button px-4 py-2 text-sm"
          >
            {isExpanded ? 'Show Less' : 'Show All Results'}
          </button>
        </div>
      </div>

      {/* Race Results */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white/5">
            <tr className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              <th className="px-6 py-4">Pos</th>
              <th className="px-6 py-4">Driver</th>
              <th className="px-6 py-4">Team</th>
              <th className="px-6 py-4">Time/Retired</th>
              <th className="px-6 py-4">Pts</th>
              <th className="px-6 py-4">FL</th>
            </tr>
          </thead>
          <tbody>
            {raceData.results.slice(0, isExpanded ? undefined : 5).map((result, index) => (
              <tr
                key={result.position}
                className="border-b border-white/5 hover:bg-white/5 transition-colors fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                      result.position === 1 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                      result.position === 2 ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                      result.position === 3 ? 'bg-gradient-to-r from-yellow-600 to-yellow-700' :
                      'bg-gray-700'
                    }`}>
                      {result.position}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: result.teamColor }}
                    >
                      {result.driver}
                    </div>
                    <div>
                      <div className="font-semibold text-white">{result.name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-300">{result.team}</td>
                <td className="px-6 py-4">
                  <div className="font-mono text-white">{result.time}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-bold text-white">{result.points}</div>
                </td>
                <td className="px-6 py-4">
                  {result.fastestLap && (
                    <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">FL</span>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Race Stats */}
      <div className="p-6 bg-white/5 border-t border-white/10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-gray-400">Winner</div>
            <div className="text-white font-semibold">{raceData.results[0].name}</div>
          </div>
          <div>
            <div className="text-gray-400">Fastest Lap</div>
            <div className="text-white font-semibold">
              {raceData.results.find(r => r.fastestLap)?.driver} - {raceData.lapRecord.time}
            </div>
          </div>
          <div>
            <div className="text-gray-400">Weather</div>
            <div className="text-white font-semibold">{raceData.weather}</div>
          </div>
          <div>
            <div className="text-gray-400">Total Laps</div>
            <div className="text-white font-semibold">52</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  const [selectedSeason, setSelectedSeason] = useState("2024");
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="min-h-screen bg-black text-white">
      <ModernNavbar />

      {/* Page Header */}
      <div className="pt-24 pb-12 bg-gradient-to-b from-gray-900 to-black">
        <div className="container-fluid">
          <div className="text-center mb-12">
            <h1 className="text-display f1-gradient-text mb-4 fade-in">
              RACE RESULTS
            </h1>
            <p className="text-xl text-gray-400 fade-in stagger-1">
              Complete race results and statistics from the 2024 Formula 1 season
            </p>
          </div>

          {/* Filters */}
          <div className="max-w-2xl mx-auto fade-in stagger-2">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search races, drivers, or teams..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                />
              </div>
              <select
                value={selectedSeason}
                onChange={(e) => setSelectedSeason(e.target.value)}
                className="glass-button px-4 py-3 min-w-[120px]"
              >
                <option value="2024">2024</option>
                <option value="2023">2023</option>
                <option value="2022">2022</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Race Results */}
      <div className="py-12">
        <div className="container-fluid">
          <div className="max-w-6xl mx-auto">
            {mockRaceResults.map((race, index) => (
              <div
                key={index}
                className="fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <RaceResultsCard raceData={race} />
              </div>
            ))}
          </div>

          {/* Load More */}
          <div className="text-center mt-12">
            <button className="glass-button px-8 py-4 text-lg font-semibold hover:border-red-400">
              Load More Results
            </button>
          </div>
        </div>
      </div>

      <FloatingChat />
    </div>
  );
}