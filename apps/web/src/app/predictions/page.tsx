"use client";
import { useState, useEffect } from "react";
import ModernNavbar from "@/components/ModernNavbar";
import FloatingChat from "@/components/FloatingChat";
import { apiGet } from "@/lib/api";

// Types for API data
interface Driver {
  id: string;
  code: string;
  name: string;
  constructor: string;
  number: number;
  nationality: string;
  flag: string;
  constructorPoints?: number;
}

interface Race {
  id: string;
  name: string;
  season: number;
  round: number;
  date: string;
  country: string;
  circuit?: string;
}

interface Prediction {
  driver_id: string;
  race_id: string;
  prob_points: number;
  score: number;
  top_factors: Array<{
    feature: string;
    contribution: number;
  }>;
}

interface PredictionWithDriver extends Prediction {
  driver: Driver;
}

// Team colors mapping
const TEAM_COLORS: { [key: string]: string } = {
  "Red Bull Racing": "#3671C6",
  "Ferrari": "#E8002D",
  "Mercedes": "#27F4D2",
  "McLaren": "#FF8000",
  "Aston Martin": "#229971",
  "Alpine": "#0093CC",
  "Williams": "#64C4FF",
  "AlphaTauri": "#5E8FAA",
  "Alfa Romeo": "#C92D4B",
  "Haas F1 Team": "#B6BABD",
  "RB": "#6692FF",
  "Sauber": "#52C41A"
};

// Country flags mapping
const COUNTRY_FLAGS: { [key: string]: string } = {
  "Bahrain": "🇧🇭",
  "Saudi Arabia": "🇸🇦",
  "Australia": "🇦🇺",
  "Japan": "🇯🇵",
  "China": "🇨🇳",
  "USA": "🇺🇸",
  "Italy": "🇮🇹",
  "Monaco": "🇲🇨",
  "Spain": "🇪🇸",
  "Canada": "🇨🇦",
  "Austria": "🇦🇹",
  "United Kingdom": "🇬🇧",
  "Hungary": "🇭🇺",
  "Belgium": "🇧🇪",
  "Netherlands": "🇳🇱",
  "Azerbaijan": "🇦🇿",
  "Singapore": "🇸🇬",
  "Mexico": "🇲🇽",
  "Brazil": "🇧🇷",
  "Qatar": "🇶🇦",
  "UAE": "🇦🇪"
};

interface PredictionCardProps {
  prediction: PredictionWithDriver;
  rank: number;
}

function PredictionCard({ prediction, rank }: PredictionCardProps) {
  const teamColor = TEAM_COLORS[prediction.driver.constructor] || "#666666";

  return (
    <div className="driver-card p-6 mb-4 fade-in" style={{ animationDelay: `${rank * 0.1}s` }}>
      <div
        className="team-accent"
        style={{ backgroundColor: teamColor }}
      ></div>

      <div className="relative z-10">
        {/* Driver Info */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl border-4 border-white/20"
                style={{ backgroundColor: teamColor }}
              >
                {prediction.driver.code}
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
              <h3 className="text-xl font-bold text-white">{prediction.driver.name}</h3>
              <p className="text-gray-400">{prediction.driver.constructor}</p>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-sm text-gray-500">#{prediction.driver.number}</span>
                <span className="text-sm text-gray-500">{prediction.driver.flag} {prediction.driver.nationality}</span>
              </div>
            </div>
          </div>

          {/* Main Probability */}
          <div className="text-right">
            <div className="text-4xl font-bold text-white mb-1">
              {(prediction.prob_points * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-400">Points Probability</div>
          </div>
        </div>

        {/* Probability Bars */}
        <div className="space-y-4 mb-6">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Points Probability</span>
              <span className="text-white font-semibold">{(prediction.prob_points * 100).toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="prediction-bar h-2 rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: `${prediction.prob_points * 100}%`,
                  background: `linear-gradient(90deg, transparent 0%, ${teamColor} 100%)`
                }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Performance Score</span>
              <span className="text-white font-semibold">{prediction.score.toFixed(2)}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="prediction-bar h-2 rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: `${Math.min(100, (prediction.score + 2) * 25)}%`,
                  background: `linear-gradient(90deg, transparent 0%, ${teamColor}80 100%)`
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Performance Factors */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-300 mb-3">Key Factors</h4>
          {prediction.top_factors.slice(0, 3).map((factor, index) => (
            <div key={index} className="flex justify-between items-center">
              <span className="text-xs text-gray-400">{factor.feature}</span>
              <span className={`text-sm font-semibold ${
                factor.contribution > 0.2 ? 'text-green-400' :
                factor.contribution > 0.1 ? 'text-yellow-400' :
                factor.contribution > 0 ? 'text-blue-400' : 'text-red-400'
              }`}>
                {factor.contribution > 0 ? '+' : ''}{factor.contribution.toFixed(3)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RaceInfoCard({ race, isLoading }: { race: Race | null; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="glass-card p-8 mb-8 fade-in">
        <div className="animate-pulse">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-gray-600 rounded"></div>
            <div className="space-y-2">
              <div className="h-6 bg-gray-600 rounded w-48"></div>
              <div className="h-4 bg-gray-600 rounded w-32"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!race) {
    return (
      <div className="glass-card p-8 mb-8 fade-in">
        <div className="text-center text-gray-400">
          <p>No race data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-8 mb-8 fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div>
          <div className="flex items-center space-x-4 mb-6">
            <div className="text-6xl">{COUNTRY_FLAGS[race.country] || '🏁'}</div>
            <div>
              <h2 className="text-3xl font-bold text-white">{race.name}</h2>
              <p className="text-gray-400 text-lg">{race.circuit || 'Circuit TBA'}</p>
              <p className="text-gray-500">{new Date(race.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-400 mb-1">Season</div>
              <div className="text-white font-semibold">{race.season}</div>
            </div>
            <div>
              <div className="text-sm text-gray-400 mb-1">Round</div>
              <div className="text-white font-semibold">R{race.round}</div>
            </div>
            <div>
              <div className="text-sm text-gray-400 mb-1">Country</div>
              <div className="text-white font-semibold">{race.country}</div>
            </div>
            <div>
              <div className="text-sm text-gray-400 mb-1">Status</div>
              <div className={`font-semibold ${
                new Date(race.date) > new Date() ? 'text-blue-400' : 'text-green-400'
              }`}>
                {new Date(race.date) > new Date() ? 'Upcoming' : 'Completed'}
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <h3 className="text-xl font-semibold text-white mb-4">Data Status</h3>
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
                strokeDasharray={`${95 * 3.52} 352`}
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
              <div className="text-3xl font-bold text-white">LIVE</div>
            </div>
          </div>
          <p className="text-gray-400 text-sm mt-2">
            {new Date(race.date) > new Date() ? 'ML Predictions' : 'Historical Results'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PredictionsPage() {
  const [selectedRace, setSelectedRace] = useState("");
  const [races, setRaces] = useState<Race[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [predictions, setPredictions] = useState<PredictionWithDriver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'score' | 'probability'>('probability');

  // Load races and drivers on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [racesResponse, driversResponse] = await Promise.all([
          apiGet('/races?season=2025'),
          apiGet('/drivers?season=2025')
        ]);

        setRaces(racesResponse || []);
        setDrivers(driversResponse || []);

        // Set default selected race to the first upcoming race
        if (racesResponse && racesResponse.length > 0) {
          const now = new Date();
          const upcomingRace = racesResponse.find((race: Race) => new Date(race.date) > now);
          setSelectedRace(upcomingRace?.id || racesResponse[0].id);
        }
      } catch (err) {
        console.error('Failed to load data:', err);
        setError('Failed to load race and driver data. Please check your API connection.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Load predictions when race is selected
  useEffect(() => {
    if (!selectedRace) return;

    const loadPredictions = async () => {
      try {
        setIsLoading(true);
        const predictionsResponse = await apiGet(`/predictions/race/${selectedRace}`);

        // Merge predictions with driver data
        const predictionsWithDrivers = (predictionsResponse || []).map((prediction: Prediction) => {
          const driver = drivers.find(d => d.id === prediction.driver_id || d.code === prediction.driver_id);
          return {
            ...prediction,
            driver: driver || {
              id: prediction.driver_id,
              code: prediction.driver_id,
              name: prediction.driver_id,
              constructor: 'Unknown',
              number: 0,
              nationality: 'Unknown',
              flag: '🏁'
            }
          };
        });

        setPredictions(predictionsWithDrivers);
      } catch (err) {
        console.error('Failed to load predictions:', err);
        setError('Failed to load predictions for this race.');
        setPredictions([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (drivers.length > 0) {
      loadPredictions();
    }
  }, [selectedRace, drivers]);

  const selectedRaceData = races.find(race => race.id === selectedRace);

  const sortedPredictions = [...predictions].sort((a, b) => {
    switch (sortBy) {
      case 'score':
        return b.score - a.score;
      case 'probability':
        return b.prob_points - a.prob_points;
      default:
        return b.prob_points - a.prob_points;
    }
  });

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white">
        <ModernNavbar />
        <div className="pt-24 pb-12">
          <div className="container-fluid">
            <div className="max-w-4xl mx-auto text-center">
              <div className="glass-card p-8">
                <h1 className="text-4xl font-bold text-red-400 mb-4">⚠️ Error</h1>
                <p className="text-gray-300 mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="glass-button px-6 py-3 text-lg font-semibold"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
              Live race predictions and historical results from our F1 API
            </p>
          </div>

          {/* Race Selector */}
          <div className="max-w-md mx-auto fade-in stagger-2">
            {isLoading ? (
              <div className="animate-pulse">
                <div className="h-12 bg-gray-600 rounded"></div>
              </div>
            ) : (
              <select
                value={selectedRace}
                onChange={(e) => setSelectedRace(e.target.value)}
                className="glass-button w-full px-4 py-3 text-lg font-semibold"
                disabled={races.length === 0}
              >
                {races.map((race) => (
                  <option key={race.id} value={race.id}>
                    {COUNTRY_FLAGS[race.country] || '🏁'} {race.name} - R{race.round}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Race Information */}
      <div className="py-8">
        <div className="container-fluid">
          <div className="max-w-6xl mx-auto">
            <RaceInfoCard race={selectedRaceData || null} isLoading={isLoading} />
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
                onClick={() => setSortBy('probability')}
                className={`glass-button px-4 py-2 text-sm ${
                  sortBy === 'probability' ? 'bg-red-600 border-red-500 text-white' : ''
                }`}
              >
                Points Probability
              </button>
              <button
                onClick={() => setSortBy('score')}
                className={`glass-button px-4 py-2 text-sm ${
                  sortBy === 'score' ? 'bg-red-600 border-red-500 text-white' : ''
                }`}
              >
                Performance Score
              </button>
            </div>

            {/* Predictions List */}
            <div className="space-y-4">
              {isLoading ? (
                // Loading skeletons
                Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="driver-card p-6 mb-4 animate-pulse">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gray-600 rounded-full"></div>
                        <div className="space-y-2">
                          <div className="h-6 bg-gray-600 rounded w-32"></div>
                          <div className="h-4 bg-gray-600 rounded w-24"></div>
                        </div>
                      </div>
                      <div className="h-12 w-20 bg-gray-600 rounded"></div>
                    </div>
                  </div>
                ))
              ) : sortedPredictions.length > 0 ? (
                sortedPredictions.map((prediction, index) => (
                  <PredictionCard
                    key={prediction.driver_id}
                    prediction={prediction}
                    rank={index + 1}
                  />
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-400 text-lg">No predictions available for this race.</p>
                  <p className="text-gray-500 text-sm mt-2">Please select a different race or check your API connection.</p>
                </div>
              )}
            </div>

            {/* Model Information */}
            <div className="mt-12 glass-card p-8 fade-in">
              <h3 className="text-2xl font-bold text-white mb-6 text-center">
                {selectedRaceData && new Date(selectedRaceData.date) > new Date()
                  ? 'How Our AI Predictions Work'
                  : 'Historical Race Results'
                }
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">
                    {selectedRaceData && new Date(selectedRaceData.date) > new Date()
                      ? '🧠 Live ML Predictions'
                      : '📊 Actual Race Data'
                    }
                  </h4>
                  <ul className="space-y-2 text-gray-300 text-sm">
                    {selectedRaceData && new Date(selectedRaceData.date) > new Date() ? (
                      <>
                        <li>• Live data from {drivers.length} drivers</li>
                        <li>• Real-time API integration</li>
                        <li>• ML model predictions</li>
                        <li>• Updated every page load</li>
                      </>
                    ) : (
                      <>
                        <li>• Historical race results</li>
                        <li>• Actual finishing positions</li>
                        <li>• Real championship points</li>
                        <li>• Official F1 data</li>
                      </>
                    )}
                  </ul>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">🔄 Data Source</h4>
                  <ul className="space-y-2 text-gray-300 text-sm">
                    <li>• Python FastAPI backend</li>
                    <li>• JSON file fallback system</li>
                    <li>• Real-time race detection</li>
                    <li>• {races.length} races in database</li>
                  </ul>
                </div>
              </div>
              <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <div className="flex items-center space-x-2 text-blue-400 text-sm">
                  <span>💡</span>
                  <span className="font-semibold">Live Data:</span>
                </div>
                <p className="text-blue-300/80 text-sm mt-1">
                  This page automatically loads live data from our API. Future races show ML predictions,
                  while past races display actual historical results.
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