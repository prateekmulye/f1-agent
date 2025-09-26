"use client";
import { useState } from "react";
import ModernNavbar from "@/components/ModernNavbar";
import FloatingChat from "@/components/FloatingChat";

// Enhanced mock data with more details
const mockDriverStandings = [
  {
    position: 1,
    driver: "VER",
    number: 1,
    name: "Max Verstappen",
    team: "Red Bull Racing",
    points: 393,
    wins: 12,
    podiums: 15,
    poles: 8,
    teamColor: "#3671C6",
    countryFlag: "🇳🇱",
    pointsChange: "+25",
    positionChange: 0
  },
  {
    position: 2,
    driver: "HAM",
    number: 44,
    name: "Lewis Hamilton",
    team: "Mercedes",
    points: 284,
    wins: 3,
    podiums: 8,
    poles: 2,
    teamColor: "#27F4D2",
    countryFlag: "🇬🇧",
    pointsChange: "+18",
    positionChange: 0
  },
  {
    position: 3,
    driver: "LEC",
    number: 16,
    name: "Charles Leclerc",
    team: "Ferrari",
    points: 252,
    wins: 2,
    podiums: 6,
    poles: 4,
    teamColor: "#E8002D",
    countryFlag: "🇲🇨",
    pointsChange: "+15",
    positionChange: 1
  },
  {
    position: 4,
    driver: "NOR",
    number: 4,
    name: "Lando Norris",
    team: "McLaren",
    points: 234,
    wins: 1,
    podiums: 5,
    poles: 1,
    teamColor: "#FF8000",
    countryFlag: "🇬🇧",
    pointsChange: "+12",
    positionChange: -1
  },
  {
    position: 5,
    driver: "SAI",
    number: 55,
    name: "Carlos Sainz",
    team: "Ferrari",
    points: 212,
    wins: 1,
    podiums: 4,
    poles: 0,
    teamColor: "#E8002D",
    countryFlag: "🇪🇸",
    pointsChange: "+10",
    positionChange: 0
  },
  {
    position: 6,
    driver: "RUS",
    number: 63,
    name: "George Russell",
    team: "Mercedes",
    points: 198,
    wins: 0,
    podiums: 3,
    poles: 1,
    teamColor: "#27F4D2",
    countryFlag: "🇬🇧",
    pointsChange: "+8",
    positionChange: 0
  }
];

const mockConstructorStandings = [
  {
    position: 1,
    team: "Red Bull Racing",
    points: 567,
    wins: 12,
    podiums: 21,
    poles: 9,
    color: "#3671C6",
    logo: "🏎️",
    drivers: ["VER", "PER"],
    pointsChange: "+37",
    positionChange: 0
  },
  {
    position: 2,
    team: "Mercedes",
    points: 409,
    wins: 3,
    podiums: 11,
    poles: 3,
    color: "#27F4D2",
    logo: "⭐",
    drivers: ["HAM", "RUS"],
    pointsChange: "+26",
    positionChange: 0
  },
  {
    position: 3,
    team: "Ferrari",
    points: 398,
    wins: 3,
    podiums: 10,
    poles: 4,
    color: "#E8002D",
    logo: "🐎",
    drivers: ["LEC", "SAI"],
    pointsChange: "+25",
    positionChange: 1
  },
  {
    position: 4,
    team: "McLaren",
    points: 312,
    wins: 1,
    podiums: 7,
    poles: 1,
    color: "#FF8000",
    logo: "🧡",
    drivers: ["NOR", "PIA"],
    pointsChange: "+18",
    positionChange: -1
  },
  {
    position: 5,
    team: "Alpine",
    points: 167,
    wins: 0,
    podiums: 1,
    poles: 0,
    color: "#0093CC",
    logo: "🔵",
    drivers: ["GAS", "OCO"],
    pointsChange: "+3",
    positionChange: 0
  }
];

interface StandingsTableProps {
  type: 'drivers' | 'constructors';
}

function StandingsTable({ type }: StandingsTableProps) {
  const isDrivers = type === 'drivers';
  const data = isDrivers ? mockDriverStandings : mockConstructorStandings;

  return (
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white/5">
            <tr className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              <th className="px-6 py-4">Pos</th>
              <th className="px-6 py-4">{isDrivers ? 'Driver' : 'Team'}</th>
              {isDrivers && <th className="px-6 py-4">Team</th>}
              <th className="px-6 py-4">Points</th>
              <th className="px-6 py-4">Wins</th>
              <th className="px-6 py-4">Podiums</th>
              <th className="px-6 py-4">Poles</th>
              <th className="px-6 py-4">Change</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr
                key={isDrivers ? (item as any).driver : (item as any).team}
                className="border-b border-white/5 hover:bg-white/5 transition-colors fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                      item.position === 1 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                      item.position === 2 ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                      item.position === 3 ? 'bg-gradient-to-r from-yellow-600 to-yellow-700' :
                      'bg-gray-700'
                    }`}>
                      {item.position}
                    </div>
                    {item.positionChange !== 0 && (
                      <div className={`text-xs ${item.positionChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {item.positionChange > 0 ? '↗' : '↘'} {Math.abs(item.positionChange)}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-4">
                    {isDrivers ? (
                      <>
                        <div className="text-xl">{(item as any).countryFlag}</div>
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-white/20"
                          style={{ backgroundColor: (item as any).teamColor }}
                        >
                          {(item as any).number}
                        </div>
                        <div>
                          <div className="font-semibold text-white">{(item as any).name}</div>
                          <div className="text-xs text-gray-400">{(item as any).driver}</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-2xl">{(item as any).logo}</div>
                        <div>
                          <div className="font-semibold text-white">{(item as any).team}</div>
                          <div className="text-xs text-gray-400">
                            {(item as any).drivers.join(', ')}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </td>
                {isDrivers && (
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: (item as any).teamColor }}
                      ></div>
                      <span className="text-gray-300">{(item as any).team}</span>
                    </div>
                  </td>
                )}
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <div className="text-2xl font-bold text-white">{item.points}</div>
                    <div className="text-sm text-green-400">{item.pointsChange}</div>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-300 font-mono">{item.wins}</td>
                <td className="px-6 py-4 text-gray-300 font-mono">{item.podiums}</td>
                <td className="px-6 py-4 text-gray-300 font-mono">{item.poles}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-1">
                    {item.positionChange === 0 ? (
                      <span className="text-gray-500">—</span>
                    ) : (
                      <>
                        <span className={item.positionChange > 0 ? 'text-green-400' : 'text-red-400'}>
                          {item.positionChange > 0 ? '↑' : '↓'}
                        </span>
                        <span className={item.positionChange > 0 ? 'text-green-400' : 'text-red-400'}>
                          {Math.abs(item.positionChange)}
                        </span>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ChampionshipProgress() {
  const leader = mockDriverStandings[0];
  const totalRaces = 24;
  const completedRaces = 15;
  const progress = (completedRaces / totalRaces) * 100;

  return (
    <div className="glass-card p-8 mb-8">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-white mb-2">Championship Progress</h3>
        <p className="text-gray-400">2024 Formula 1 World Championship Status</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Season Progress */}
        <div className="text-center">
          <div className="text-4xl font-bold text-red-500 mb-2">{completedRaces}/{totalRaces}</div>
          <div className="text-gray-400 mb-4">Races Completed</div>
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-red-500 to-red-600 h-3 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Championship Leader */}
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-yellow-400 overflow-hidden">
            <div
              className="w-full h-full flex items-center justify-center text-white font-bold text-lg"
              style={{ backgroundColor: leader.teamColor }}
            >
              {leader.driver}
            </div>
          </div>
          <div className="font-bold text-white mb-1">{leader.name}</div>
          <div className="text-gray-400 text-sm">{leader.team}</div>
          <div className="text-2xl font-bold text-yellow-400 mt-2">{leader.points} pts</div>
        </div>

        {/* Points Gap */}
        <div className="text-center">
          <div className="text-4xl font-bold text-white mb-2">
            {leader.points - mockDriverStandings[1].points}
          </div>
          <div className="text-gray-400 mb-2">Point Lead</div>
          <div className="text-sm text-gray-500">
            Over {mockDriverStandings[1].name}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StandingsPage() {
  const [activeTab, setActiveTab] = useState<'drivers' | 'constructors'>('drivers');
  const [selectedSeason, setSelectedSeason] = useState("2024");

  return (
    <div className="min-h-screen bg-black text-white">
      <ModernNavbar />

      {/* Page Header */}
      <div className="pt-24 pb-12 bg-gradient-to-b from-gray-900 to-black">
        <div className="container-fluid">
          <div className="text-center mb-12">
            <h1 className="text-display f1-gradient-text mb-4 fade-in">
              CHAMPIONSHIP STANDINGS
            </h1>
            <p className="text-xl text-gray-400 fade-in stagger-1">
              Current drivers and constructors championship standings for the 2024 season
            </p>
          </div>
        </div>
      </div>

      {/* Championship Progress */}
      <div className="py-8">
        <div className="container-fluid">
          <div className="max-w-6xl mx-auto fade-in">
            <ChampionshipProgress />
          </div>
        </div>
      </div>

      {/* Standings Tables */}
      <div className="pb-12">
        <div className="container-fluid">
          <div className="max-w-6xl mx-auto">
            {/* Tab Navigation */}
            <div className="flex items-center justify-center space-x-1 mb-8">
              <button
                onClick={() => setActiveTab('drivers')}
                className={`glass-button px-8 py-3 text-lg font-semibold transition-all ${
                  activeTab === 'drivers'
                    ? 'bg-red-600 border-red-500 text-white'
                    : 'hover:border-red-400'
                }`}
              >
                🏎️ Drivers Championship
              </button>
              <button
                onClick={() => setActiveTab('constructors')}
                className={`glass-button px-8 py-3 text-lg font-semibold transition-all ${
                  activeTab === 'constructors'
                    ? 'bg-red-600 border-red-500 text-white'
                    : 'hover:border-red-400'
                }`}
              >
                🏆 Constructors Championship
              </button>
            </div>

            {/* Active Table */}
            <div className="fade-in">
              <StandingsTable type={activeTab} />
            </div>

            {/* Additional Stats */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-card p-6 text-center fade-in stagger-1">
                <div className="text-3xl mb-2">🏁</div>
                <div className="text-2xl font-bold text-white mb-1">15</div>
                <div className="text-gray-400">Races Completed</div>
              </div>
              <div className="glass-card p-6 text-center fade-in stagger-2">
                <div className="text-3xl mb-2">🌟</div>
                <div className="text-2xl font-bold text-white mb-1">7</div>
                <div className="text-gray-400">Different Winners</div>
              </div>
              <div className="glass-card p-6 text-center fade-in stagger-3">
                <div className="text-3xl mb-2">⚡</div>
                <div className="text-2xl font-bold text-white mb-1">9</div>
                <div className="text-gray-400">Races Remaining</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <FloatingChat />
    </div>
  );
}