"use client";
import { useState, useEffect } from 'react';
import { apiGet } from '@/lib/api';
import { slipstreamColors } from '@/theme/f1Theme';

// Types
interface Race {
  id: string;
  name: string;
  season: number;
  round: number;
  date: string;
  country: string;
  circuit?: string;
}

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

interface RaceCardProps {
  race: Race;
  isNext?: boolean;
  isPast?: boolean;
}

function RaceCard({ race, isNext, isPast }: RaceCardProps) {
  const raceDate = new Date(race.date);
  const now = new Date();
  const isCompleted = raceDate < now;
  const isUpcoming = raceDate > now;

  // Calculate time until/since race
  const timeDiff = Math.abs(raceDate.getTime() - now.getTime());
  const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

  return (
    <div className={`race-card p-6 rounded-xl border transition-all duration-300 hover:scale-105 ${
      isNext ? 'bg-gradient-to-r from-blue-900/30 to-slate-800/30 border-blue-400/50 shadow-blue-400/20' :
      isCompleted ? 'bg-slate-800/50 border-slate-600/30' :
      'bg-slate-900/50 border-slate-700/50'
    } shadow-lg`} style={{
      backgroundColor: isNext ? slipstreamColors.accent + '40' :
                      isCompleted ? slipstreamColors.surface + '80' :
                      slipstreamColors.secondary + '60',
      borderColor: isNext ? slipstreamColors.light + '80' :
                   isCompleted ? slipstreamColors.border + '60' :
                   slipstreamColors.border + '50',
    }}>

      {/* Race Status Badge */}
      {isNext && (
        <div className="absolute -top-2 -right-2 px-3 py-1 rounded-full text-xs font-bold text-white"
             style={{ backgroundColor: slipstreamColors.accent }}>
          NEXT RACE
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className="text-4xl">{COUNTRY_FLAGS[race.country] || '🏁'}</div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400 font-medium">R{race.round}</span>
              <h3 className="text-xl font-bold text-white">{race.name}</h3>
            </div>
            <p className="text-gray-400">{race.circuit || 'Circuit TBA'}</p>
          </div>
        </div>

        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
          isCompleted ? 'bg-green-500/20 text-green-400' :
          isUpcoming ? 'bg-blue-500/20 text-blue-400' :
          'bg-gray-500/20 text-gray-400'
        }`}>
          {isCompleted ? 'COMPLETED' : 'UPCOMING'}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-gray-400 mb-1">Date</div>
          <div className="text-white font-semibold">
            {raceDate.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </div>
        </div>

        <div>
          <div className="text-gray-400 mb-1">
            {isCompleted ? 'Days Ago' : 'Days Left'}
          </div>
          <div className={`font-semibold ${
            isNext ? 'text-red-400' :
            isCompleted ? 'text-gray-400' :
            daysLeft <= 7 ? 'text-yellow-400' :
            'text-blue-400'
          }`}>
            {daysLeft} {daysLeft === 1 ? 'day' : 'days'}
          </div>
        </div>
      </div>

      {/* Race Weekend Countdown */}
      {isNext && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-red-400 text-sm font-semibold">Next Race Weekend</span>
            <span className="text-red-300 text-lg font-bold">
              {daysLeft}d {Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))}h
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RaceCalendar() {
  const [races, setRaces] = useState<Race[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'upcoming' | 'all' | 'completed'>('upcoming');

  useEffect(() => {
    const loadRaces = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const racesResponse = await apiGet('/races?season=2025');

        if (racesResponse && Array.isArray(racesResponse)) {
          // Sort races by date
          const sortedRaces = racesResponse.sort((a: Race, b: Race) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
          );
          setRaces(sortedRaces);
        } else {
          setError('No race data available');
        }
      } catch (err) {
        console.error('Failed to load races:', err);
        setError('Failed to load race calendar. Please check your API connection.');
      } finally {
        setIsLoading(false);
      }
    };

    loadRaces();
  }, []);

  const now = new Date();
  const upcomingRaces = races.filter(race => new Date(race.date) > now);
  const completedRaces = races.filter(race => new Date(race.date) <= now);
  const nextRace = upcomingRaces[0];

  const getDisplayRaces = () => {
    switch (view) {
      case 'upcoming':
        return upcomingRaces.slice(0, 6); // Show next 6 races
      case 'completed':
        return completedRaces.slice(-6).reverse(); // Show last 6 completed races
      case 'all':
        return races.slice(0, 12); // Show first 12 races
      default:
        return upcomingRaces.slice(0, 6);
    }
  };

  if (isLoading) {
    return (
      <section className="py-16 bg-gradient-to-b from-gray-900 to-black">
        <div className="container-fluid">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold f1-gradient-text mb-4">F1 2025 CALENDAR</h2>
            <p className="text-xl text-gray-400">Loading race schedule...</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-gray-800 rounded-xl p-6 h-48">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-gray-600 rounded"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-600 rounded mb-2"></div>
                      <div className="h-3 bg-gray-600 rounded w-2/3"></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-12 bg-gray-600 rounded"></div>
                    <div className="h-12 bg-gray-600 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 bg-gradient-to-b from-gray-900 to-black">
        <div className="container-fluid">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-red-400 mb-4">⚠️ Calendar Error</h2>
            <p className="text-gray-300 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="glass-button px-6 py-3 text-lg font-semibold"
            >
              Retry Loading
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16" style={{
      background: `linear-gradient(180deg, ${slipstreamColors.primary} 0%, ${slipstreamColors.secondary} 100%)`
    }}>
      <div className="container-fluid">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 fade-in" style={{
            background: `linear-gradient(45deg, ${slipstreamColors.light}, ${slipstreamColors.accent})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            F1 2025 CALENDAR
          </h2>
          <p className="text-xl mb-6 fade-in stagger-1" style={{ color: slipstreamColors.text.secondary }}>
            Live race schedule with real-time status updates
          </p>

          {/* View Selector */}
          <div className="flex items-center justify-center space-x-1 fade-in stagger-2">
            <button
              onClick={() => setView('upcoming')}
              className={`glass-button px-4 py-2 text-sm ${
                view === 'upcoming' ? 'bg-red-600 border-red-500 text-white' : ''
              }`}
            >
              Upcoming ({upcomingRaces.length})
            </button>
            <button
              onClick={() => setView('all')}
              className={`glass-button px-4 py-2 text-sm ${
                view === 'all' ? 'bg-red-600 border-red-500 text-white' : ''
              }`}
            >
              All Races
            </button>
            <button
              onClick={() => setView('completed')}
              className={`glass-button px-4 py-2 text-sm ${
                view === 'completed' ? 'bg-red-600 border-red-500 text-white' : ''
              }`}
            >
              Completed ({completedRaces.length})
            </button>
          </div>
        </div>

        {/* Calendar Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12 max-w-4xl mx-auto">
          <div className="glass-card p-4 text-center">
            <div className="text-2xl font-bold text-white">{races.length}</div>
            <div className="text-sm text-gray-400">Total Races</div>
          </div>
          <div className="glass-card p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{upcomingRaces.length}</div>
            <div className="text-sm text-gray-400">Upcoming</div>
          </div>
          <div className="glass-card p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{completedRaces.length}</div>
            <div className="text-sm text-gray-400">Completed</div>
          </div>
          <div className="glass-card p-4 text-center">
            <div className="text-2xl font-bold text-red-400">
              {nextRace ? Math.ceil((new Date(nextRace.date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0}
            </div>
            <div className="text-sm text-gray-400">Days to Next</div>
          </div>
        </div>

        {/* Race Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {getDisplayRaces().map((race, index) => (
            <div key={race.id} className="fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
              <RaceCard
                race={race}
                isNext={race.id === nextRace?.id}
                isPast={new Date(race.date) <= now}
              />
            </div>
          ))}
        </div>

        {/* Next Race Highlight */}
        {nextRace && view === 'upcoming' && (
          <div className="mt-16 max-w-4xl mx-auto">
            <div className="glass-card p-8 border-2 border-red-500/50 bg-gradient-to-r from-red-600/10 to-orange-600/10">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">🏁 NEXT RACE WEEKEND</h3>
                <div className="text-6xl mb-4">{COUNTRY_FLAGS[nextRace.country] || '🏁'}</div>
                <h4 className="text-3xl font-bold f1-gradient-text">{nextRace.name}</h4>
                <p className="text-gray-300 text-lg">{nextRace.circuit}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-gray-400 text-sm mb-1">Round</div>
                  <div className="text-white text-2xl font-bold">R{nextRace.round}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm mb-1">Date</div>
                  <div className="text-white text-2xl font-bold">
                    {new Date(nextRace.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm mb-1">Days Left</div>
                  <div className="text-red-400 text-2xl font-bold">
                    {Math.ceil((new Date(nextRace.date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Calendar Footer */}
        <div className="text-center mt-12">
          <p className="text-gray-500 text-sm">
            Race schedule automatically updates based on current date • Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    </section>
  );
}