/**
 * React Hook for F1 API Integration
 * Provides easy access to API data with loading states and error handling
 */

import { useState, useEffect, useCallback } from 'react';
import { apiClient, DriverData, RaceData, TeamData, PredictionData } from '@/lib/api-client';

export interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useDrivers(season: number = 2025): UseApiState<DriverData[]> {
  const [state, setState] = useState<UseApiState<DriverData[]>>({
    data: null,
    loading: true,
    error: null,
    refetch: async () => {},
  });

  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await apiClient.getDriversWithFallback(season);
      if (response.success) {
        setState(prev => ({
          ...prev,
          data: response.data,
          loading: false
        }));
      } else {
        setState(prev => ({
          ...prev,
          error: response.error || 'Failed to fetch drivers',
          loading: false
        }));
      }
    } catch {
      setState(prev => ({
        ...prev,
        error: 'Network error',
        loading: false
      }));
    }
  }, [season]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...state, refetch: fetchData };
}

export function useRaces(season?: number): UseApiState<RaceData[]> {
  const [state, setState] = useState<UseApiState<RaceData[]>>({
    data: null,
    loading: true,
    error: null,
    refetch: async () => {},
  });

  const fetchData = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await apiClient.getRacesWithFallback(season);
      if (response.success) {
        setState(prev => ({
          ...prev,
          data: response.data,
          loading: false
        }));
      } else {
        setState(prev => ({
          ...prev,
          error: response.error || 'Failed to fetch races',
          loading: false
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Network error',
        loading: false
      }));
    }
  };

  useEffect(() => {
    fetchData();
  }, [season]);

  return { ...state, refetch: fetchData };
}

export function useTeams(season: number = 2025): UseApiState<TeamData[]> {
  const [state, setState] = useState<UseApiState<TeamData[]>>({
    data: null,
    loading: true,
    error: null,
    refetch: async () => {},
  });

  const fetchData = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await apiClient.getTeams(season);
      if (response.success) {
        setState(prev => ({
          ...prev,
          data: response.data,
          loading: false
        }));
      } else {
        setState(prev => ({
          ...prev,
          error: response.error || 'Failed to fetch teams',
          loading: false
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Network error',
        loading: false
      }));
    }
  };

  useEffect(() => {
    fetchData();
  }, [season]);

  return { ...state, refetch: fetchData };
}

export function usePredictions(raceId: string | null): UseApiState<PredictionData[]> {
  const [state, setState] = useState<UseApiState<PredictionData[]>>({
    data: null,
    loading: true,
    error: null,
    refetch: async () => {},
  });

  const fetchData = async () => {
    if (!raceId) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await apiClient.getRacePredictions(raceId);
      if (response.success) {
        setState(prev => ({
          ...prev,
          data: response.data,
          loading: false
        }));
      } else {
        setState(prev => ({
          ...prev,
          error: response.error || 'Failed to fetch predictions',
          loading: false
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Network error',
        loading: false
      }));
    }
  };

  useEffect(() => {
    fetchData();
  }, [raceId]);

  return { ...state, refetch: fetchData };
}

export function useUpcomingRaces(limit: number = 5): UseApiState<RaceData[]> {
  const [state, setState] = useState<UseApiState<RaceData[]>>({
    data: null,
    loading: true,
    error: null,
    refetch: async () => {},
  });

  const fetchData = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await apiClient.getUpcomingRaces(limit);
      if (response.success) {
        setState(prev => ({
          ...prev,
          data: response.data,
          loading: false
        }));
      } else {
        setState(prev => ({
          ...prev,
          error: response.error || 'Failed to fetch upcoming races',
          loading: false
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Network error',
        loading: false
      }));
    }
  };

  useEffect(() => {
    fetchData();
  }, [limit]);

  return { ...state, refetch: fetchData };
}

export function useApiHealth() {
  const [state, setState] = useState({
    frontendHealthy: false,
    backendHealthy: false,
    loading: true,
    lastCheck: null as Date | null,
  });

  const checkHealth = async () => {
    setState(prev => ({ ...prev, loading: true }));

    try {
      const [frontendHealth, backendHealth] = await Promise.allSettled([
        apiClient.checkFrontendHealth(),
        apiClient.checkBackendHealth(),
      ]);

      setState({
        frontendHealthy: frontendHealth.status === 'fulfilled' && frontendHealth.value.success,
        backendHealthy: backendHealth.status === 'fulfilled' && backendHealth.value.success,
        loading: false,
        lastCheck: new Date(),
      });
    } catch (error) {
      setState({
        frontendHealthy: false,
        backendHealthy: false,
        loading: false,
        lastCheck: new Date(),
      });
    }
  };

  useEffect(() => {
    checkHealth();

    // Check health every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return { ...state, checkHealth };
}

// Custom hook for batch data loading
export function useBatchData(season: number = 2025) {
  const [state, setState] = useState({
    drivers: null as DriverData[] | null,
    races: null as RaceData[] | null,
    teams: null as TeamData[] | null,
    standings: null as any,
    loading: true,
    errors: [] as string[],
  });

  const fetchBatchData = async () => {
    setState(prev => ({ ...prev, loading: true, errors: [] }));

    try {
      const batchResponse = await apiClient.getBatchData(season);
      const errors: string[] = [];

      if (!batchResponse.drivers.success) {
        errors.push(batchResponse.drivers.error || 'Failed to fetch drivers');
      }
      if (!batchResponse.races.success) {
        errors.push(batchResponse.races.error || 'Failed to fetch races');
      }
      if (!batchResponse.teams.success) {
        errors.push(batchResponse.teams.error || 'Failed to fetch teams');
      }
      if (!batchResponse.standings.success) {
        errors.push(batchResponse.standings.error || 'Failed to fetch standings');
      }

      setState({
        drivers: batchResponse.drivers.success ? batchResponse.drivers.data : null,
        races: batchResponse.races.success ? batchResponse.races.data : null,
        teams: batchResponse.teams.success ? batchResponse.teams.data : null,
        standings: batchResponse.standings.success ? batchResponse.standings.data : null,
        loading: false,
        errors,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        errors: ['Network error while fetching batch data']
      }));
    }
  };

  useEffect(() => {
    fetchBatchData();
  }, [season]);

  return { ...state, refetch: fetchBatchData };
}