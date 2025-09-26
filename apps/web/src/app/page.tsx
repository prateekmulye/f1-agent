"use client";
import { useState, useEffect } from "react";
import ModernNavbar from "@/components/ModernNavbar";
import FloatingChat from "@/components/FloatingChat";

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

const getTrend = (probability: number) => {
  if (probability > 0.5) return "up";
  if (probability > 0.2) return "stable";
  return "down";
};

// Interface for API data
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

interface RaceResult {
  race_id: string;
  race_name: string;
  race_date: string;
  season: number;
  results: Array<{
    driver_name: string;
    driver_code: string;
    constructor: string;
    finish_position: number;
  }>;
}

interface NextRacePrediction {
  driver_id: string;
  prob_points: number;
}

interface HeroSectionProps {
  onRaceSelect?: (raceId: string) => void;
}

function HeroSection({ onRaceSelect }: HeroSectionProps) {
  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-px h-32 bg-gradient-to-b from-transparent via-red-500/50 to-transparent rotate-45 animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-px h-24 bg-gradient-to-b from-transparent via-red-500/30 to-transparent -rotate-45 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-1/4 left-1/2 w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
      </div>

      {/* Racing Line Animation */}
      <div className="absolute top-0 left-0 right-0 h-px f1-racing-line"></div>

      <div className="container-fluid text-center z-10">
        <div className="max-w-4xl mx-auto">
          {/* Main Title */}
          <h1 className="text-display f1-gradient-text mb-6 fade-in">
            FORMULA 1
          </h1>
          <h2 className="text-headline text-white/90 mb-8 fade-in stagger-1">
            AI Race Intelligence Platform
          </h2>

          {/* Subtitle */}
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed fade-in stagger-2">
            Advanced machine learning predictions, real-time race analysis, and comprehensive F1 statistics
            powered by cutting-edge AI and live telemetry data.
          </p>

          {/* Key Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              { icon: "🧠", title: "AI Predictions", desc: "Advanced ML models predicting race outcomes with 87% accuracy" },
              { icon: "⚡", title: "Live Data", desc: "Real-time telemetry and race conditions from OpenF1 API" },
              { icon: "📊", title: "Deep Analytics", desc: "Comprehensive driver and constructor performance analysis" }
            ].map((feature, index) => (
              <div
                key={index}
                className="glass-card p-6 text-center group fade-in"
                style={{ animationDelay: `${0.3 + index * 0.1}s` }}
              >
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-400">{feature.desc}</p>
              </div>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="flex justify-center items-center space-x-8 mb-12 fade-in stagger-3">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-500">2025</div>
              <div className="text-sm text-gray-400">Season</div>
            </div>
            <div className="w-px h-12 bg-gray-600"></div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-500">24</div>
              <div className="text-sm text-gray-400">Races</div>
            </div>
            <div className="w-px h-12 bg-gray-600"></div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-500">20</div>
              <div className="text-sm text-gray-400">Drivers</div>
            </div>
            <div className="w-px h-12 bg-gray-600"></div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-500">10</div>
              <div className="text-sm text-gray-400">Teams</div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center fade-in stagger-4">
            <button
              onClick={() => window.location.href = '/results'}
              className="glass-button px-8 py-4 text-lg font-semibold bg-red-600 border-red-500 text-white hover:bg-red-700"
            >
              🏁 View Race Results
            </button>
            <button
              onClick={() => window.location.href = '/standings'}
              className="glass-button px-8 py-4 text-lg font-semibold hover:border-red-400"
            >
              🏆 Championship Standings
            </button>
            <button
              onClick={() => window.location.href = '/predictions'}
              className="glass-button px-8 py-4 text-lg font-semibold hover:border-red-400"
            >
              🔮 AI Predictions
            </button>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-gray-400 rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  );
}

function DriverStandingsSection() {
  const [driverStandings, setDriverStandings] = useState<DriverStanding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDriverStandings = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/standings?type=drivers');
        if (!response.ok) {
          throw new Error('Failed to fetch driver standings');
        }
        const data = await response.json();
        setDriverStandings(data.slice(0, 8)); // Show top 8
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load standings');
        console.error('Error fetching driver standings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDriverStandings();
  }, []);

  if (loading) {
    return (
      <section className="py-20 bg-gradient-to-b from-black to-gray-900">
        <div className="container-fluid">
          <div className="text-center mb-16">
            <h2 className="text-headline text-white mb-4 f1-racing-line">Drivers Championship</h2>
            <p className="text-gray-400">Current 2025 season standings</p>
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="text-center text-gray-400">Loading standings...</div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-20 bg-gradient-to-b from-black to-gray-900">
        <div className="container-fluid">
          <div className="text-center mb-16">
            <h2 className="text-headline text-white mb-4 f1-racing-line">Drivers Championship</h2>
            <p className="text-gray-400">Current 2025 season standings</p>
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="text-center text-red-400">Error: {error}</div>
          </div>
        </div>
      </section>
    );
  }

  const top3 = driverStandings.slice(0, 3);

  return (
    <section className="py-20 bg-gradient-to-b from-black to-gray-900">
      <div className="container-fluid">
        <div className="text-center mb-16">
          <h2 className="text-headline text-white mb-4 f1-racing-line">Drivers Championship</h2>
          <p className="text-gray-400">Current 2025 season standings</p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Top 3 Podium */}
          <div className="grid grid-cols-3 gap-4 mb-12 h-64">
            {[1, 0, 2].map((index) => {
              const driver = top3[index];
              if (!driver) return null;

              const teamColor = getTeamColor(driver.constructor);

              return (
                <div
                  key={driver.driver_id}
                  className={`podium-position podium-${driver.position} glass-card p-6 flex flex-col justify-between`}
                >
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full overflow-hidden border-4 border-white/20">
                      <div
                        className="w-full h-full"
                        style={{ backgroundColor: teamColor }}
                      ></div>
                    </div>
                    <div className="text-2xl font-bold text-white">{driver.driver_code}</div>
                    <div className="text-sm text-white/80">{driver.driver_name}</div>
                    <div className="text-xs text-white/60 mt-1">{driver.constructor}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white">{driver.points}</div>
                    <div className="text-sm text-white/60">points</div>
                    <div className="text-xs text-white/40 mt-1">{driver.wins} wins</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Remaining Positions */}
          <div className="space-y-4">
            {driverStandings.slice(3).map((driver, index) => {
              const teamColor = getTeamColor(driver.constructor);

              return (
                <div key={driver.driver_id} className="driver-card p-4 fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div
                    className="team-accent"
                    style={{ backgroundColor: teamColor }}
                  ></div>

                  <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl font-bold text-white w-8 text-center">
                        {driver.position}
                      </div>
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
                        <div className="text-sm text-gray-400">{driver.constructor}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">{driver.points}</div>
                      <div className="text-sm text-gray-400">points</div>
                      <div className="text-xs text-gray-500">{driver.wins}W • {driver.podiums}P</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function NextRacePredictions() {
  const [predictions, setPredictions] = useState<NextRacePrediction[]>([]);
  const [nextRace, setNextRace] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNextRacePredictions = async () => {
      try {
        setLoading(true);

        // Get next race (first 2025 race for now)
        const racesResponse = await fetch('/api/races');
        const races = await racesResponse.json();
        const next2025Race = races.find((race: any) => race.season === 2025);

        if (!next2025Race) {
          throw new Error('No upcoming races found');
        }

        setNextRace(next2025Race);

        // Get predictions for this race
        const predictionsResponse = await fetch(`/api/predict?race_id=${next2025Race.id}`);
        if (!predictionsResponse.ok) {
          throw new Error('Failed to fetch predictions');
        }

        const predictionsData = await predictionsResponse.json();
        setPredictions(predictionsData.slice(0, 4)); // Top 4 predictions
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load predictions');
        console.error('Error fetching predictions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNextRacePredictions();
  }, []);

  if (loading) {
    return (
      <section className="py-20 bg-gradient-to-b from-gray-900 to-black">
        <div className="container-fluid">
          <div className="text-center mb-16">
            <h2 className="text-headline text-white mb-4 f1-racing-line">Next Race Predictions</h2>
            <p className="text-gray-400">Loading AI predictions...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error || !nextRace) {
    return (
      <section className="py-20 bg-gradient-to-b from-gray-900 to-black">
        <div className="container-fluid">
          <div className="text-center mb-16">
            <h2 className="text-headline text-white mb-4 f1-racing-line">Next Race Predictions</h2>
            <p className="text-red-400">Error: {error}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gradient-to-b from-gray-900 to-black">
      <div className="container-fluid">
        <div className="text-center mb-16">
          <h2 className="text-headline text-white mb-4 f1-racing-line">Next Race Predictions</h2>
          <p className="text-gray-400">AI-powered points probability for {nextRace.name}</p>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="glass-card p-8">
            <div className="space-y-6">
              {predictions.map((prediction, index) => {
                const probability = Math.round(prediction.prob_points * 100);
                const trend = getTrend(prediction.prob_points);

                return (
                  <div
                    key={prediction.driver_id}
                    className="flex items-center justify-between p-4 rounded-lg border border-white/10 hover:border-white/20 transition-all"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="text-xl font-bold text-white w-8 text-center">
                        {index + 1}
                      </div>
                      <div className="w-3 h-8 rounded">
                        {/* Team color accent - would need driver info */}
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-white">{prediction.driver_id}</div>
                        <div className="text-sm text-gray-400">Points probability</div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white">{probability}%</div>
                        <div className={`text-sm ${
                          trend === 'up' ? 'text-green-400' :
                          trend === 'stable' ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {trend === 'up' ? '↗' : trend === 'stable' ? '→' : '↘'} {trend}
                        </div>
                      </div>
                      <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full transition-all duration-1000"
                          style={{ width: `${probability}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  const [selectedRace, setSelectedRace] = useState<string>("2025_bahrain");

  return (
    <div className="min-h-screen bg-black text-white">
      <ModernNavbar />
      <HeroSection onRaceSelect={setSelectedRace} />
      <DriverStandingsSection />
      <NextRacePredictions />
      <FloatingChat />
    </div>
  );
}