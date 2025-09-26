'use client';
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  alpha,
  Skeleton,
  Chip,
  Avatar,
  IconButton,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  ExpandLess,
  ExpandMore,
} from '@mui/icons-material';
import { f1Colors, getTeamColorByConstructor } from '@/theme/f1Theme';
import { apiGet } from '@/lib/api';

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
  number: number;
  name: string;
  constructor: string;
  constructorPoints: number;
  nationality: string;
  flag: string;
}

interface PredictionResult {
  driver_id: string;
  race_id: string;
  prob_points: number;
  score: number;
  top_factors?: Array<{
    feature: string;
    contribution: number;
  }>;
}

interface DriverPrediction extends Driver {
  prediction?: PredictionResult;
  predictedPosition?: number;
  actualPosition?: number | null;
  probability?: number;
}

interface TeamGroup {
  constructor: string;
  constructorPoints: number;
  drivers: DriverPrediction[];
  teamColor: { main: string; light: string; dark: string };
  expanded: boolean;
}

// Team logos mapping
const getTeamLogo = (constructor: string) => {
  const logos: { [key: string]: string } = {
    'Red Bull Racing': '🏆',
    'McLaren': '🧡',
    'Ferrari': '🏎️',
    'Mercedes': '⭐',
    'Aston Martin': '💚',
    'RB': '🔵',
    'Alpine': '🇫🇷',
    'Williams': '🔷',
    'Haas': '🇺🇸',
    'Sauber': '🇨🇭'
  };
  return logos[constructor] || '🏁';
};

export default function RacePredictionsPanel() {
  const [races, setRaces] = useState<Race[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedRaceId, setSelectedRaceId] = useState<string>('');
  const [teamGroups, setTeamGroups] = useState<TeamGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch races and drivers on component mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [racesData, driversData] = await Promise.all([
          apiGet('races'),
          apiGet('drivers')
        ]);

        // Filter to 2025 races and sort by date
        const races2025 = racesData
          .filter((race: Race) => race.season === 2025)
          .sort((a: Race, b: Race) => new Date(a.date).getTime() - new Date(b.date).getTime());

        setRaces(races2025);
        setDrivers(driversData);

        // Select the next upcoming race or most recent
        const now = new Date();
        const upcomingRace = races2025.find((race: Race) => new Date(race.date) > now);
        const mostRecentRace = races2025
          .filter((race: Race) => new Date(race.date) <= now)
          .sort((a: Race, b: Race) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

        const defaultRace = upcomingRace || mostRecentRace || races2025[0];
        setSelectedRaceId(defaultRace?.id || '');

      } catch (err) {
        console.error('Error fetching initial data:', err);
        setError('Failed to load race and driver data');
      }
    };

    fetchInitialData();
  }, []);

  // Fetch predictions and organize data when race is selected
  useEffect(() => {
    if (!selectedRaceId || drivers.length === 0) return;

    const fetchPredictions = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch real predictions from the API
        const predictions: PredictionResult[] = await apiGet(`predictions/race/${selectedRaceId}`);
        console.log('Predictions received:', predictions.length, 'predictions');

        // Filter out predictions for non-2025 drivers
        const validDriverCodes = drivers.map(d => d.code);
        const validPredictions = predictions.filter(p => validDriverCodes.includes(p.driver_id));

        console.log('Filtered valid predictions:', validPredictions.length, 'from', predictions.length);

        // Convert predictions to predicted positions (rank by probability)
        const sortedPredictions = validPredictions
          .sort((a, b) => b.prob_points - a.prob_points)
          .map((pred, index) => ({
            ...pred,
            predicted_position: index + 1
          }));

        console.log('Top 5 predictions:', sortedPredictions.slice(0, 5));

        // Create driver predictions with matched data
        const driverPredictions: DriverPrediction[] = drivers.map(driver => {
          // Match prediction using driver code (3-letter abbreviation)
          const prediction = sortedPredictions.find(p => p.driver_id === driver.code);

          return {
            ...driver,
            prediction: prediction,
            predictedPosition: prediction?.predicted_position || null,
            actualPosition: null, // No actual results yet for future races
            probability: prediction?.prob_points || null,
          };
        });

        // Group drivers by constructor and sort by constructor points
        const driversByTeam: { [key: string]: DriverPrediction[] } = {};

        driverPredictions.forEach(driver => {
          if (!driversByTeam[driver.constructor]) {
            driversByTeam[driver.constructor] = [];
          }
          driversByTeam[driver.constructor].push(driver);
        });

        // Create team groups sorted by constructor points
        const groups: TeamGroup[] = Object.entries(driversByTeam)
          .map(([constructor, teamDrivers]) => ({
            constructor,
            constructorPoints: teamDrivers[0]?.constructorPoints || 0,
            drivers: teamDrivers.sort((a, b) => (a.predictedPosition || 99) - (b.predictedPosition || 99)),
            teamColor: getTeamColorByConstructor(constructor),
            expanded: ['Red Bull Racing', 'McLaren', 'Ferrari'].includes(constructor) // Default expand top teams
          }))
          .sort((a, b) => b.constructorPoints - a.constructorPoints);

        console.log('Team groups created:', groups.length);
        setTeamGroups(groups);
      } catch (err) {
        console.error('Error fetching predictions:', err);
        setError('Failed to fetch predictions');
      } finally {
        setLoading(false);
      }
    };

    fetchPredictions();
  }, [selectedRaceId, drivers]);

  const toggleTeam = (teamName: string) => {
    setTeamGroups(prevGroups =>
      prevGroups.map(group =>
        group.constructor === teamName
          ? { ...group, expanded: !group.expanded }
          : group
      )
    );
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
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Avatar sx={{ bgcolor: f1Colors.mclaren.main }}>
            <TrophyIcon />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Race Predictions
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              2025 Championship • Grouped by Teams
            </Typography>
          </Box>
        </Box>

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

      {/* Error Display */}
      {error && (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: '#ff6b6b', mb: 2 }}>
            {error}
          </Typography>
        </Box>
      )}

      {/* Table */}
      <TableContainer
        sx={{
          flex: 1,
          overflow: 'auto',
          '&::-webkit-scrollbar': { width: '6px' },
          '&::-webkit-scrollbar-track': { backgroundColor: alpha('#ffffff', 0.05) },
          '&::-webkit-scrollbar-thumb': { backgroundColor: alpha('#ffffff', 0.2), borderRadius: '10px' },
        }}
      >
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ backgroundColor: alpha('#1a1a1a', 0.9), color: 'text.primary', fontWeight: 600 }}>
                Team
              </TableCell>
              <TableCell sx={{ backgroundColor: alpha('#1a1a1a', 0.9), color: 'text.primary', fontWeight: 600, textAlign: 'center' }}>
                Flag
              </TableCell>
              <TableCell sx={{ backgroundColor: alpha('#1a1a1a', 0.9), color: 'text.primary', fontWeight: 600, textAlign: 'center' }}>
                #
              </TableCell>
              <TableCell sx={{ backgroundColor: alpha('#1a1a1a', 0.9), color: 'text.primary', fontWeight: 600 }}>
                Driver
              </TableCell>
              <TableCell sx={{ backgroundColor: alpha('#1a1a1a', 0.9), color: 'text.primary', fontWeight: 600, textAlign: 'center' }}>
                Team
              </TableCell>
              <TableCell sx={{ backgroundColor: alpha('#1a1a1a', 0.9), color: 'text.primary', fontWeight: 600, textAlign: 'center' }}>
                Predicted Pos.
              </TableCell>
              <TableCell sx={{ backgroundColor: alpha('#1a1a1a', 0.9), color: 'text.primary', fontWeight: 600, textAlign: 'center' }}>
                Actual Result
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && (
              Array.from({ length: 6 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell colSpan={7}>
                    <Skeleton variant="text" width="100%" height={40} />
                  </TableCell>
                </TableRow>
              ))
            )}

            {!loading && teamGroups.map((team) => (
              <React.Fragment key={team.constructor}>
                {/* Team Header Row */}
                <TableRow
                  sx={{
                    cursor: 'pointer',
                    backgroundColor: alpha(team.teamColor.main, 0.1),
                    '&:hover': { backgroundColor: alpha(team.teamColor.main, 0.2) },
                  }}
                >
                  <TableCell
                    sx={{ fontWeight: 600, color: team.teamColor.main }}
                    onClick={() => toggleTeam(team.constructor)}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <IconButton size="small" sx={{ color: team.teamColor.main }}>
                        {team.expanded ? <ExpandLess /> : <ExpandMore />}
                      </IconButton>
                      {team.constructor}
                      <Chip
                        label={`${team.constructorPoints} pts`}
                        size="small"
                        sx={{
                          backgroundColor: alpha(team.teamColor.main, 0.2),
                          color: 'white',
                          fontSize: '0.75rem'
                        }}
                      />
                    </Box>
                  </TableCell>
                  <TableCell colSpan={6} />
                </TableRow>

                {/* Driver Rows */}
                {team.expanded && team.drivers.map((driver) => (
                  <TableRow
                    key={driver.id}
                    sx={{
                      '&:hover': { backgroundColor: alpha(team.teamColor.main, 0.05) },
                      borderLeft: `3px solid ${team.teamColor.main}`,
                    }}
                  >
                    <TableCell sx={{ pl: 4, color: 'text.secondary', fontSize: '0.8rem' }}>
                      {/* Empty for team grouping */}
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center', fontSize: '1.2rem' }}>
                      {driver.flag}
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center', fontWeight: 600, color: team.teamColor.main }}>
                      {driver.number}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>
                      {driver.name}
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center', fontSize: '1.2rem' }}>
                      {getTeamLogo(driver.constructor)}
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      {driver.predictedPosition ? (
                        <Chip
                          label={`P${driver.predictedPosition}`}
                          size="small"
                          sx={{
                            backgroundColor: driver.predictedPosition <= 3 ? f1Colors.ferrari.main :
                                           driver.predictedPosition <= 10 ? f1Colors.mercedes.main :
                                           alpha('#ffffff', 0.2),
                            color: 'white',
                            fontWeight: 600,
                          }}
                        />
                      ) : (
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          No Data
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      {driver.actualPosition ? (
                        <Chip
                          label={`P${driver.actualPosition}`}
                          size="small"
                          sx={{
                            backgroundColor: driver.actualPosition <= 3 ? '#FFD700' :
                                           driver.actualPosition <= 10 ? '#C0C0C0' :
                                           alpha('#ffffff', 0.3),
                            color: driver.actualPosition <= 10 ? '#000' : '#fff',
                            fontWeight: 600,
                          }}
                        />
                      ) : (
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          TBD
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Footer */}
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