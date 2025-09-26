"use client";
import { useState, useEffect } from "react";
import ModernNavbar from "@/components/ModernNavbar";
import FloatingChat from "@/components/FloatingChat";
import ProbabilityChart from "@/components/ProbabilityChart";

// Mock prediction data with enhanced details
const mockRacePredictions = {
  "2025_bahrain": {
    race: "Bahrain Grand Prix 2025",
    circuit: "Bahrain International Circuit",
    date: "2025-03-16",
    flag: "🇧🇭",
    weather: {
      condition: "Clear",
      temperature: "32°C",
      humidity: "45%",
      rainChance: "0%"
    },
    predictions: [
      {
        driver: "VER",
        name: "Max Verstappen",
        team: "Red Bull Racing",
        teamColor: "#3671C6",
        winProbability: 62.8,
        podiumProbability: 87.4,
        pointsProbability: 93.2,
        qualifyingPosition: 2,
        trend: "stable",
        factors: {
          trackRecord: 92,
          carPerformance: 96,
          driverForm: 95,
          weather: 95
        }
      },
      {
        driver: "HAM",
        name: "Lewis Hamilton",
        team: "Ferrari",
        teamColor: "#E8002D",
        winProbability: 21.3,
        podiumProbability: 58.7,
        pointsProbability: 82.1,
        qualifyingPosition: 2,
        trend: "up",
        factors: {
          trackRecord: 85,
          carPerformance: 88,
          driverForm: 90,
          weather: 92
        }
      },
      {
        driver: "LEC",
        name: "Charles Leclerc",
        team: "Ferrari",
        teamColor: "#E8002D",
        winProbability: 11.8,
        podiumProbability: 48.2,
        pointsProbability: 76.5,
        qualifyingPosition: 3,
        trend: "stable",
        factors: {
          trackRecord: 82,
          carPerformance: 88,
          driverForm: 87,
          weather: 90
        }
      },
      {
        driver: "NOR",
        name: "Lando Norris",
        team: "McLaren",
        teamColor: "#FF8000",
        winProbability: 4.1,
        podiumProbability: 32.6,
        pointsProbability: 68.9,
        qualifyingPosition: 3,
        trend: "stable",
        factors: {
          trackRecord: 75,
          carPerformance: 85,
          driverForm: 88,
          weather: 85
        }
      }
    ]
  },
  "2024_hun": {
    race: "Hungarian Grand Prix 2024",
    circuit: "Hungaroring",
    date: "2024-07-21",
    flag: "🇭🇺",
    weather: {
      condition: "Partly Cloudy",
      temperature: "28°C",
      humidity: "65%",
      rainChance: "15%"
    },
    predictions: [
      {
        driver: "VER",
        name: "Max Verstappen",
        team: "Red Bull Racing",
        teamColor: "#3671C6",
        winProbability: 67.3,
        podiumProbability: 89.2,
        pointsProbability: 94.8,
        qualifyingPosition: 1,
        trend: "stable",
        factors: {
          trackRecord: 95,
          carPerformance: 98,
          driverForm: 96,
          weather: 85
        }
      },
      {
        driver: "HAM",
        name: "Lewis Hamilton",
        team: "Mercedes",
        teamColor: "#27F4D2",
        winProbability: 18.4,
        podiumProbability: 52.6,
        pointsProbability: 78.3,
        qualifyingPosition: 3,
        trend: "up",
        factors: {
          trackRecord: 88,
          carPerformance: 82,
          driverForm: 89,
          weather: 92
        }
      },
      {
        driver: "LEC",
        name: "Charles Leclerc",
        team: "Ferrari",
        teamColor: "#E8002D",
        winProbability: 12.1,
        podiumProbability: 45.8,
        pointsProbability: 71.2,
        qualifyingPosition: 2,
        trend: "down",
        factors: {
          trackRecord: 78,
          carPerformance: 79,
          driverForm: 84,
          weather: 75
        }
      },
      {
        driver: "NOR",
        name: "Lando Norris",
        team: "McLaren",
        teamColor: "#FF8000",
        winProbability: 2.2,
        podiumProbability: 15.4,
        pointsProbability: 45.7,
        qualifyingPosition: 4,
        trend: "up",
        factors: {
          trackRecord: 65,
          carPerformance: 74,
          driverForm: 81,
          weather: 88
        }
      }
    ]
  }
};

const availableRaces = [
  { id: "2025_bahrain", name: "Bahrain GP", date: "2025-03-16", flag: "🇧🇭" },
  { id: "2025_saudi", name: "Saudi Arabian GP", date: "2025-03-23", flag: "🇸🇦" },
  { id: "2025_australia", name: "Australian GP", date: "2025-04-06", flag: "🇦🇺" },
  { id: "2025_japan", name: "Japanese GP", date: "2025-04-13", flag: "🇯🇵" },
  { id: "2025_china", name: "Chinese GP", date: "2025-04-20", flag: "🇨🇳" },
  { id: "2024_hun", name: "Hungarian GP", date: "2024-07-21", flag: "🇭🇺" },
  { id: "2024_bel", name: "Belgian GP", date: "2024-07-28", flag: "🇧🇪" },
  { id: "2024_ned", name: "Dutch GP", date: "2024-08-25", flag: "🇳🇱" },
  { id: "2024_ita", name: "Italian GP", date: "2024-09-01", flag: "🇮🇹" },
];

interface PredictionCardProps {
  prediction: typeof mockRacePredictions["2024_hun"]["predictions"][0];
  rank: number;
}

function PredictionCard({ prediction, rank }: PredictionCardProps) {
  return (
    <div className="driver-card p-6 mb-4 fade-in" style={{ animationDelay: `${rank * 0.1}s` }}>
      <div
        className="team-accent"
        style={{ backgroundColor: prediction.teamColor }}
      ></div>

      <div className="relative z-10">
        {/* Driver Info */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl border-4 border-white/20"
                style={{ backgroundColor: prediction.teamColor }}
              >
                {prediction.driver}
              </div>
              <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                rank === 1 ? 'bg-yellow-500 text-yellow-900' :
                rank === 2 ? 'bg-gray-400 text-gray-900' :
                rank === 3 ? 'bg-yellow-700 text-yellow-100' :
                'bg-gray-700 text-white'
              }`}>
                {rank}
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{prediction.name}</h3>
              <p className="text-gray-400">{prediction.team}</p>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-sm text-gray-500">Qualifying P{prediction.qualifyingPosition}</span>
                <div className={`text-sm ${
                  prediction.trend === 'up' ? 'text-green-400' :
                  prediction.trend === 'down' ? 'text-red-400' : 'text-gray-400'
                }`}>
                  {prediction.trend === 'up' ? '↗ Trending Up' :
                   prediction.trend === 'down' ? '↘ Trending Down' : '→ Stable'}
                </div>
              </div>
            </div>
          </div>

          {/* Main Probability */}
          <div className="text-right">
            <div className="text-4xl font-bold text-white mb-1">
              {prediction.winProbability.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-400">Win Probability</div>
          </div>
        </div>

        {/* Probability Bars */}
        <div className="space-y-4 mb-6">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Win Probability</span>
              <span className="text-white font-semibold">{prediction.winProbability.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="prediction-bar h-2 rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: `${prediction.winProbability}%`,
                  background: `linear-gradient(90deg, transparent 0%, ${prediction.teamColor} 100%)`
                }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Podium Probability</span>
              <span className="text-white font-semibold">{prediction.podiumProbability.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="prediction-bar h-2 rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: `${prediction.podiumProbability}%`,
                  background: `linear-gradient(90deg, transparent 0%, ${prediction.teamColor}80 100%)`
                }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Points Probability</span>
              <span className="text-white font-semibold">{prediction.pointsProbability.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="prediction-bar h-2 rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: `${prediction.pointsProbability}%`,
                  background: `linear-gradient(90deg, transparent 0%, ${prediction.teamColor}60 100%)`
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Performance Factors */}
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(prediction.factors).map(([factor, score]) => (
            <div key={factor} className="text-center">
              <div className={`text-lg font-bold mb-1 ${
                score >= 90 ? 'text-green-400' :
                score >= 75 ? 'text-yellow-400' :
                score >= 60 ? 'text-orange-400' : 'text-red-400'
              }`}>
                {score}
              </div>
              <div className="text-xs text-gray-400 capitalize">
                {factor.replace(/([A-Z])/g, ' $1').trim()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RaceInfoCard({ raceData }: { raceData: typeof mockRacePredictions["2024_hun"] }) {
  return (
    <div className="glass-card p-8 mb-8 fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div>
          <div className="flex items-center space-x-4 mb-6">
            <div className="text-6xl">{raceData.flag}</div>
            <div>
              <h2 className="text-3xl font-bold text-white">{raceData.race}</h2>
              <p className="text-gray-400 text-lg">{raceData.circuit}</p>
              <p className="text-gray-500">{raceData.date}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-400 mb-1">Weather</div>
              <div className="text-white font-semibold">{raceData.weather.condition}</div>
            </div>
            <div>
              <div className="text-sm text-gray-400 mb-1">Temperature</div>
              <div className="text-white font-semibold">{raceData.weather.temperature}</div>
            </div>
            <div>
              <div className="text-sm text-gray-400 mb-1">Humidity</div>
              <div className="text-white font-semibold">{raceData.weather.humidity}</div>
            </div>
            <div>
              <div className="text-sm text-gray-400 mb-1">Rain Chance</div>
              <div className={`font-semibold ${
                parseInt(raceData.weather.rainChance) > 50 ? 'text-blue-400' :
                parseInt(raceData.weather.rainChance) > 25 ? 'text-yellow-400' : 'text-green-400'
              }`}>
                {raceData.weather.rainChance}
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <h3 className="text-xl font-semibold text-white mb-4">AI Confidence Level</h3>
          <div className="relative w-32 h-32 mx-auto">
            <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 128 128">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="url(#confidenceGradient)"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={`${87 * 3.52} 352`}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="confidenceGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style={{ stopColor: '#10B981' }} />
                  <stop offset="100%" style={{ stopColor: '#059669' }} />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-3xl font-bold text-white">87%</div>
            </div>
          </div>
          <p className="text-gray-400 text-sm mt-2">Based on historical data & current form</p>
        </div>
      </div>
    </div>
  );
}

export default function PredictionsPage() {
  const [selectedRace, setSelectedRace] = useState("2025_bahrain");
  const [sortBy, setSortBy] = useState<'win' | 'podium' | 'points'>('win');

  const raceData = mockRacePredictions[selectedRace as keyof typeof mockRacePredictions];
  const sortedPredictions = [...raceData.predictions].sort((a, b) => {
    switch (sortBy) {
      case 'win':
        return b.winProbability - a.winProbability;
      case 'podium':
        return b.podiumProbability - a.podiumProbability;
      case 'points':
        return b.pointsProbability - a.pointsProbability;
      default:
        return b.winProbability - a.winProbability;
    }
  });

  return (
    <div className="min-h-screen bg-black text-white">
      <ModernNavbar />

      {/* Page Header */}
      <div className="pt-24 pb-12 bg-gradient-to-b from-gray-900 to-black">
        <div className="container-fluid">
          <div className="text-center mb-12">
            <h1 className="text-display f1-gradient-text mb-4 fade-in">
              AI PREDICTIONS
            </h1>
            <p className="text-xl text-gray-400 fade-in stagger-1">
              Advanced machine learning predictions for upcoming Formula 1 races
            </p>
          </div>

          {/* Race Selector */}
          <div className="max-w-md mx-auto fade-in stagger-2">
            <select
              value={selectedRace}
              onChange={(e) => setSelectedRace(e.target.value)}
              className="glass-button w-full px-4 py-3 text-lg font-semibold"
            >
              {availableRaces.map((race) => (
                <option key={race.id} value={race.id}>
                  {race.flag} {race.name} - {race.date}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Race Information */}
      <div className="py-8">
        <div className="container-fluid">
          <div className="max-w-6xl mx-auto">
            <RaceInfoCard raceData={raceData} />
          </div>
        </div>
      </div>

      {/* Predictions */}
      <div className="pb-12">
        <div className="container-fluid">
          <div className="max-w-4xl mx-auto">
            {/* Sort Controls */}
            <div className="flex items-center justify-center space-x-1 mb-8">
              <span className="text-gray-400 text-sm mr-4">Sort by:</span>
              <button
                onClick={() => setSortBy('win')}
                className={`glass-button px-4 py-2 text-sm ${
                  sortBy === 'win' ? 'bg-red-600 border-red-500 text-white' : ''
                }`}
              >
                Win Probability
              </button>
              <button
                onClick={() => setSortBy('podium')}
                className={`glass-button px-4 py-2 text-sm ${
                  sortBy === 'podium' ? 'bg-red-600 border-red-500 text-white' : ''
                }`}
              >
                Podium
              </button>
              <button
                onClick={() => setSortBy('points')}
                className={`glass-button px-4 py-2 text-sm ${
                  sortBy === 'points' ? 'bg-red-600 border-red-500 text-white' : ''
                }`}
              >
                Points
              </button>
            </div>

            {/* Predictions List */}
            <div className="space-y-4">
              {sortedPredictions.map((prediction, index) => (
                <PredictionCard
                  key={prediction.driver}
                  prediction={prediction}
                  rank={index + 1}
                />
              ))}
            </div>

            {/* Model Information */}
            <div className="mt-12 glass-card p-8 fade-in">
              <h3 className="text-2xl font-bold text-white mb-6 text-center">
                How Our AI Predictions Work
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">🧠 Machine Learning Model</h4>
                  <ul className="space-y-2 text-gray-300 text-sm">
                    <li>• Trained on 10+ years of historical F1 data</li>
                    <li>• 87.3% accuracy rate on past predictions</li>
                    <li>• Updates in real-time with new data</li>
                    <li>• Considers 50+ performance factors</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">📊 Key Factors</h4>
                  <ul className="space-y-2 text-gray-300 text-sm">
                    <li>• Qualifying performance & grid position</li>
                    <li>• Historical track performance</li>
                    <li>• Current season form & momentum</li>
                    <li>• Weather conditions & track temperature</li>
                  </ul>
                </div>
              </div>
              <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                <div className="flex items-center space-x-2 text-yellow-400 text-sm">
                  <span>⚠️</span>
                  <span className="font-semibold">Disclaimer:</span>
                </div>
                <p className="text-yellow-300/80 text-sm mt-1">
                  These predictions are for entertainment purposes only. Formula 1 races are unpredictable
                  and actual results may vary significantly from predictions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <FloatingChat />
    </div>
  );
}