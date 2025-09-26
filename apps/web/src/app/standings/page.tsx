"use client";
import { useState, useEffect } from "react";
import ModernNavbar from "@/components/ModernNavbar";
import FloatingChat from "@/components/FloatingChat";
import { apiGet } from "@/lib/api";

// Team colors mapping
const getTeamColor = (constructor: string) => {
  const colors: Record<string, string> = {
    "Red Bull Racing": "#3671C6",
    "Ferrari": "#E8002D",
    "Mercedes": "#27F4D2",
    "McLaren": "#FF8000",
    "Aston Martin": "#229971",
    "Alpine": "#0093CC",
    "Williams": "#64C4FF",
    "RB": "#6692FF",
    "Kick Sauber": "#52C41A",
    "Haas": "#B6BABD"
  };
  return colors[constructor] || "#666666";
};

const getTeamLogo = (constructor: string) => {
  const logos: Record<string, string> = {
    "Red Bull Racing": "🏎️",
    "Ferrari": "🐎",
    "Mercedes": "⭐",
    "McLaren": "🧡",
    "Aston Martin": "🏁",
    "Alpine": "🔵",
    "Williams": "💙",
    "RB": "⚡",
    "Kick Sauber": "🟢",
    "Haas": "⚪"
  };
  return logos[constructor] || "🏎️";
};

// Interface definitions
interface DriverStanding {
  position: number;
  driver_id: string;
  driver_code: string;
  driver_name: string;
  constructor: string;
  points: number;
  wins: number;
  podiums: number;
  season: number;
}

interface ConstructorStanding {
  position: number;
  constructor: string;
  points: number;
  wins: number;
  podiums: number;
  drivers: Array<{id: string; name: string; points: number}>;
}

export default function StandingsPage() {
  const [activeTab, setActiveTab] = useState<'drivers' | 'constructors'>('drivers');
  const [selectedSeason, setSelectedSeason] = useState(2025);
  const [driverStandings, setDriverStandings] = useState<DriverStanding[]>([]);
  const [constructorStandings, setConstructorStandings] = useState<ConstructorStanding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data when tab or season changes
  useEffect(() => {
    const fetchStandings = async () => {
      try {
        setLoading(true);
        setError(null);

        const [driversData, constructorsData] = await Promise.all([
          apiGet(`standings?type=drivers&season=${selectedSeason}`),
          apiGet(`standings?type=constructors&season=${selectedSeason}`)
        ]);

        setDriverStandings(driversData);
        setConstructorStandings(constructorsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load standings');
        console.error('Error fetching standings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStandings();
  }, [activeTab, selectedSeason]);

  return (
    <div className="min-h-screen bg-black text-white">
      <ModernNavbar />

      <div className="pt-20">
        {/* Header */}
        <section className="py-16 bg-gradient-to-b from-black to-gray-900">
          <div className="container-fluid text-center">
            <h1 className="text-display f1-gradient-text mb-6 fade-in">
              Championship Standings
            </h1>
            <p className="text-xl text-gray-300 mb-8 fade-in stagger-1">
              Live updated standings for drivers and constructors
            </p>

            {/* Season Selector */}
            <div className="flex justify-center mb-8 fade-in stagger-2">
              <select
                value={selectedSeason}
                onChange={(e) => setSelectedSeason(Number(e.target.value))}
                className="glass-button bg-black/50 border-white/20 text-white px-4 py-2 rounded-lg"
              >
                <option value={2025}>2025 Season</option>
                <option value={2024}>2024 Season</option>
              </select>
            </div>

            {/* Tab Navigation */}
            <div className="flex justify-center space-x-4 mb-12 fade-in stagger-3">
              <button
                onClick={() => setActiveTab('drivers')}
                className={`glass-button px-8 py-4 text-lg font-semibold transition-all ${
                  activeTab === 'drivers'
                    ? 'bg-red-600 border-red-500 text-white'
                    : 'hover:border-red-400'
                }`}
              >
                🏆 Drivers
              </button>
              <button
                onClick={() => setActiveTab('constructors')}
                className={`glass-button px-8 py-4 text-lg font-semibold transition-all ${
                  activeTab === 'constructors'
                    ? 'bg-red-600 border-red-500 text-white'
                    : 'hover:border-red-400'
                }`}
              >
                🏎️ Constructors
              </button>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="py-12 bg-gradient-to-b from-gray-900 to-black">
          <div className="container-fluid">
            {loading ? (
              <div className="text-center text-gray-400">
                <div className="animate-pulse">Loading {activeTab} standings...</div>
              </div>
            ) : error ? (
              <div className="text-center text-red-400">
                Error: {error}
              </div>
            ) : (
              <>
                {activeTab === 'drivers' && (
                  <DriversStandingsTable standings={driverStandings} />
                )}
                {activeTab === 'constructors' && (
                  <ConstructorsStandingsTable standings={constructorStandings} />
                )}
              </>
            )}
          </div>
        </section>
      </div>

      <FloatingChat />
    </div>
  );
}

function DriversStandingsTable({ standings }: { standings: DriverStanding[] }) {
  const top3 = standings.slice(0, 3);
  const rest = standings.slice(3);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Top 3 Podium */}
      {top3.length > 0 && (
        <div className="grid grid-cols-3 gap-6 mb-16 h-72">
          {[1, 0, 2].map((index) => {
            const driver = top3[index];
            if (!driver) return null;

            const teamColor = getTeamColor(driver.constructor);
            const heightClass = index === 1 ? 'h-72' : index === 0 ? 'h-64' : 'h-56';

            return (
              <div
                key={driver.driver_id}
                className={`${heightClass} glass-card p-6 flex flex-col justify-between fade-in`}
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden border-4 border-white/20">
                    <div
                      className="w-full h-full"
                      style={{ backgroundColor: teamColor }}
                    ></div>
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">{driver.position}</div>
                  <div className="text-xl font-bold text-white">{driver.driver_code}</div>
                  <div className="text-sm text-white/80">{driver.driver_name}</div>
                  <div className="text-xs text-white/60 mt-2">{driver.constructor}</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-white">{driver.points}</div>
                  <div className="text-sm text-white/60">points</div>
                  <div className="text-xs text-white/40 mt-1">{driver.wins} wins • {driver.podiums} podiums</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rest of standings */}
      {rest.length > 0 && (
        <div className="glass-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-4 text-sm font-medium text-gray-400">Pos</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-400">Driver</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-400">Team</th>
                  <th className="text-right p-4 text-sm font-medium text-gray-400">Points</th>
                  <th className="text-right p-4 text-sm font-medium text-gray-400">Wins</th>
                  <th className="text-right p-4 text-sm font-medium text-gray-400">Podiums</th>
                </tr>
              </thead>
              <tbody>
                {rest.map((driver, index) => {
                  const teamColor = getTeamColor(driver.constructor);

                  return (
                    <tr
                      key={driver.driver_id}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors fade-in"
                      style={{ animationDelay: `${(index + 3) * 0.05}s` }}
                    >
                      <td className="p-4">
                        <div className="text-xl font-bold text-white">{driver.position}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/20">
                            <div
                              className="w-full h-full flex items-center justify-center text-white font-bold text-sm"
                              style={{ backgroundColor: teamColor }}
                            >
                              {driver.driver_code}
                            </div>
                          </div>
                          <div>
                            <div className="text-lg font-semibold text-white">{driver.driver_name}</div>
                            <div className="text-sm text-gray-400">{driver.driver_code}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-white">{driver.constructor}</div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="text-2xl font-bold text-white">{driver.points}</div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="text-lg text-white">{driver.wins}</div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="text-lg text-white">{driver.podiums}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function ConstructorsStandingsTable({ standings }: { standings: ConstructorStanding[] }) {
  const top3 = standings.slice(0, 3);
  const rest = standings.slice(3);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Top 3 Podium */}
      {top3.length > 0 && (
        <div className="grid grid-cols-3 gap-6 mb-16 h-72">
          {[1, 0, 2].map((index) => {
            const constructor = top3[index];
            if (!constructor) return null;

            const teamColor = getTeamColor(constructor.constructor);
            const teamLogo = getTeamLogo(constructor.constructor);
            const heightClass = index === 1 ? 'h-72' : index === 0 ? 'h-64' : 'h-56';

            return (
              <div
                key={constructor.constructor}
                className={`${heightClass} glass-card p-6 flex flex-col justify-between fade-in`}
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <div className="text-center">
                  <div className="text-6xl mb-4">{teamLogo}</div>
                  <div className="text-3xl font-bold text-white mb-1">{constructor.position}</div>
                  <div className="text-lg font-bold text-white">{constructor.constructor}</div>
                  <div className="text-xs text-white/60 mt-2">
                    {constructor.drivers.map(d => d.name.split(' ').pop()).join(' • ')}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-white">{constructor.points}</div>
                  <div className="text-sm text-white/60">points</div>
                  <div className="text-xs text-white/40 mt-1">{constructor.wins} wins • {constructor.podiums} podiums</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rest of standings */}
      {rest.length > 0 && (
        <div className="glass-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-4 text-sm font-medium text-gray-400">Pos</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-400">Constructor</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-400">Drivers</th>
                  <th className="text-right p-4 text-sm font-medium text-gray-400">Points</th>
                  <th className="text-right p-4 text-sm font-medium text-gray-400">Wins</th>
                  <th className="text-right p-4 text-sm font-medium text-gray-400">Podiums</th>
                </tr>
              </thead>
              <tbody>
                {rest.map((constructor, index) => {
                  const teamColor = getTeamColor(constructor.constructor);
                  const teamLogo = getTeamLogo(constructor.constructor);

                  return (
                    <tr
                      key={constructor.constructor}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors fade-in"
                      style={{ animationDelay: `${(index + 3) * 0.05}s` }}
                    >
                      <td className="p-4">
                        <div className="text-xl font-bold text-white">{constructor.position}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="text-3xl">{teamLogo}</div>
                          <div>
                            <div className="text-lg font-semibold text-white">{constructor.constructor}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-gray-300">
                          {constructor.drivers.map(d => d.name.split(' ').pop()).join(' • ')}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="text-2xl font-bold text-white">{constructor.points}</div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="text-lg text-white">{constructor.wins}</div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="text-lg text-white">{constructor.podiums}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}