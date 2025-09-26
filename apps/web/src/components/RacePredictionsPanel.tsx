'use client';
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  LinearProgress,
  Chip,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  Grid,
  useTheme,
  alpha,
  Skeleton,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  Refresh as RefreshIcon,
  EmojiEvents as TrophyIcon,
} from '@mui/icons-material';
import { f1Colors, getTeamColorByConstructor } from '@/theme/f1Theme';

interface Race {
  id: string;
  name: string;
  date: string;
  country: string;
  season: number;
}

interface Driver {
  id: string;
  code: string;
  name: string;
  constructor: string;
}

interface PredictionResult {
  driver_id: string;
  race_id: string;
  prob_points: number;
  score: number;
  top_factors: Array<{
    feature: string;
    contribution: number;
  }>;
}

interface DriverWithPrediction extends Driver {
  prediction?: PredictionResult;
}

export default function RacePredictionsPanel() {
  const theme = useTheme();
  const [races, setRaces] = useState<Race[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedRaceId, setSelectedRaceId] = useState<string>('');
  const [predictions, setPredictions] = useState<DriverWithPrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch races and drivers on component mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [racesRes, driversRes] = await Promise.all([
          fetch('/api/races'),
          fetch('/api/drivers')
        ]);

        const racesData = await racesRes.json();
        const driversData = await driversRes.json();

        // Filter to 2025 races and sort by date
        const races2025 = racesData
          .filter((race: Race) => race.season === 2025)
          .sort((a: Race, b: Race) => new Date(a.date).getTime() - new Date(b.date).getTime());

        setRaces(races2025);
        setDrivers(driversData);

        // Select the next upcoming race, or the most recent race if all have passed
        const now = new Date();
        const upcomingRace = races2025.find((race: Race) => new Date(race.date) > now);
        const mostRecentRace = races2025
          .filter((race: Race) => new Date(race.date) <= now)
          .sort((a: Race, b: Race) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

        // Prefer upcoming race, fallback to most recent, then first race
        const defaultRace = upcomingRace || mostRecentRace || races2025[0];
        setSelectedRaceId(defaultRace?.id || '');

      } catch (err) {
        console.error('Error fetching initial data:', err);
        setError('Failed to load race and driver data');
      }
    };

    fetchInitialData();
  }, []);

  // Fetch predictions when race is selected
  useEffect(() => {
    if (!selectedRaceId) return;

    const fetchPredictions = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/predict?race_id=${selectedRaceId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch predictions');
        }

        const predictionsData = await response.json();

        // Combine drivers with their predictions
        const driversWithPredictions = drivers.map(driver => {
          const prediction = predictionsData.find((p: PredictionResult) =>
            p.driver_id === driver.code || p.driver_id === driver.id
          );
          return { ...driver, prediction };
        }).filter(driver => driver.prediction) // Only show drivers with predictions
          .sort((a, b) => (b.prediction?.prob_points || 0) - (a.prediction?.prob_points || 0)); // Sort by probability

        setPredictions(driversWithPredictions);
      } catch (err) {
        console.error('Error fetching predictions:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch predictions');
      } finally {
        setLoading(false);
      }
    };

    fetchPredictions();
  }, [selectedRaceId, drivers]);

  const getTrendIcon = (probability: number) => {
    if (probability > 0.7) return <TrendingUpIcon sx={{ color: '#4caf50' }} />;
    if (probability > 0.3) return <TrendingFlatIcon sx={{ color: '#ff9800' }} />;
    return <TrendingDownIcon sx={{ color: '#f44336' }} />;
  };

  const selectedRace = races.find(race => race.id === selectedRaceId);

  return (
    <Paper
      elevation={0}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: alpha('#000000', 0.6),
        backdropFilter: 'blur(20px)',
        border: `1px solid ${alpha('#ffffff', 0.1)}`,
        borderRadius: 3,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: `1px solid ${alpha('#ffffff', 0.1)}`,
          backgroundColor: alpha('#1a1a1a', 0.4),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: f1Colors.mclaren.main }}>
            <TrophyIcon />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Race Predictions
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              AI-powered points scoring probability
            </Typography>
          </Box>
        </Box>

        <IconButton
          onClick={() => {
            if (selectedRaceId) {
              const event = new Event('raceChange');
              window.dispatchEvent(event);
            }
          }}
          disabled={loading}
          sx={{ color: 'text.secondary' }}
        >
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Race Selector */}
      <Box sx={{ p: 2, borderBottom: `1px solid ${alpha('#ffffff', 0.05)}` }}>
        <FormControl fullWidth size="small">
          <InputLabel>Select Race</InputLabel>
          <Select
            value={selectedRaceId}
            onChange={(e) => setSelectedRaceId(e.target.value)}
            label="Select Race"
            sx={{
              backgroundColor: alpha('#000000', 0.3),
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: alpha('#ffffff', 0.2),
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: alpha('#ffffff', 0.4),
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: f1Colors.ferrari.main,
              },
            }}
          >
            {races.map((race) => (
              <MenuItem key={race.id} value={race.id}>
                <Box>
                  <Typography variant="body2">{race.name}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {new Date(race.date).toLocaleDateString()} • {race.country}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Predictions List */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 2,
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: alpha('#ffffff', 0.05),
            borderRadius: '10px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: alpha('#ffffff', 0.2),
            borderRadius: '10px',
            '&:hover': {
              backgroundColor: alpha('#ffffff', 0.3),
            },
          },
        }}
      >
        {error && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          </Box>
        )}

        {loading && (
          <Box sx={{ space: 2 }}>
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Skeleton variant="circular" width={40} height={40} />
                    <Box sx={{ flex: 1 }}>
                      <Skeleton variant="text" width="60%" />
                      <Skeleton variant="text" width="40%" />
                    </Box>
                    <Skeleton variant="text" width="20%" />
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}

        {!loading && !error && predictions.length > 0 && (
          <Box sx={{ space: 1 }}>
            {predictions.map((driver, index) => {
              const teamColors = getTeamColorByConstructor(driver.constructor);
              const probability = Math.round((driver.prediction?.prob_points || 0) * 100);

              return (
                <Card
                  key={driver.id}
                  sx={{
                    mb: 2,
                    backgroundColor: alpha('#1a1a1a', 0.4),
                    border: `1px solid ${alpha(teamColors.main, 0.3)}`,
                    borderLeft: `4px solid ${teamColors.main}`,
                    '&:hover': {
                      backgroundColor: alpha('#1a1a1a', 0.6),
                      borderColor: alpha(teamColors.main, 0.5),
                    },
                  }}
                >
                  <CardContent sx={{ py: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Typography
                        variant="h6"
                        sx={{
                          minWidth: '24px',
                          fontWeight: 700,
                          color: teamColors.main,
                        }}
                      >
                        #{index + 1}
                      </Typography>

                      <Avatar
                        sx={{
                          width: 40,
                          height: 40,
                          bgcolor: teamColors.main,
                          fontSize: '0.875rem',
                          fontWeight: 600,
                        }}
                      >
                        {driver.code}
                      </Avatar>

                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {driver.name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          {driver.constructor}
                        </Typography>
                      </Box>

                      <Box sx={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getTrendIcon(driver.prediction?.prob_points || 0)}
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            {probability}%
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            Points Prob.
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    <LinearProgress
                      variant="determinate"
                      value={probability}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: alpha('#ffffff', 0.1),
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: teamColors.main,
                          borderRadius: 3,
                        },
                      }}
                    />

                    {driver.prediction?.top_factors && (
                      <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {driver.prediction.top_factors.slice(0, 3).map((factor, factorIndex) => (
                          <Chip
                            key={factorIndex}
                            label={factor.feature.replace('_', ' ')}
                            size="small"
                            sx={{
                              backgroundColor: alpha(teamColors.main, 0.1),
                              border: `1px solid ${alpha(teamColors.main, 0.3)}`,
                              color: 'text.secondary',
                              fontSize: '0.75rem',
                            }}
                          />
                        ))}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        )}

        {!loading && !error && predictions.length === 0 && selectedRaceId && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              No predictions available for this race
            </Typography>
          </Box>
        )}
      </Box>

      {/* Race Info Footer */}
      {selectedRace && (
        <Box
          sx={{
            p: 2,
            borderTop: `1px solid ${alpha('#ffffff', 0.1)}`,
            backgroundColor: alpha('#1a1a1a', 0.4),
            textAlign: 'center',
          }}
        >
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {selectedRace.name} • {new Date(selectedRace.date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Typography>
        </Box>
      )}
    </Paper>
  );
}