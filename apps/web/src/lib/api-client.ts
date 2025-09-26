/**
 * API Client for F1 Backend Integration
 * Provides unified access to both Next.js API routes and Python backend
 */

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
}

export interface DriverData {
  id: string;
  code: string;
  name: string;
  constructor: string;
  number: number;
  nationality: string;
  flag: string;
  season: number;
}

export interface RaceData {
  id: string;
  name: string;
  season: number;
  round: number;
  date: string;
  country: string;
  circuit: string;
}

export interface PredictionData {
  driver_id: string;
  race_id: string;
  prob_points: number;
  score: number;
  predicted_position?: number;
  top_factors: Array<{
    feature: string;
    contribution: number;
  }>;
}

export interface TeamData {
  id: string;
  name: string;
  position: number;
  points: number;
  driverCount: number;
  drivers: string[];
  colors: {
    main: string;
    light: string;
    dark: string;
    logo: string;
  };
}

class ApiClient {
  private baseUrl: string;
  private pythonApiUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    this.pythonApiUrl = process.env.NEXT_PUBLIC_PYTHON_API_URL || 'http://localhost:8002';
  }

  private async fetchWithErrorHandling<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { data, success: true };
    } catch (error) {
      console.error('API request failed:', error);
      return {
        data: null as T,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Drivers API
  async getDrivers(season: number = 2025, usePythonApi: boolean = false): Promise<ApiResponse<DriverData[]>> {
    const url = usePythonApi
      ? `${this.pythonApiUrl}/api/v1/drivers?season=${season}`
      : `${this.baseUrl}/api/drivers?season=${season}`;

    return this.fetchWithErrorHandling<DriverData[]>(url);
  }

  async getDriver(driverId: string, season: number = 2025, usePythonApi: boolean = false): Promise<ApiResponse<DriverData>> {
    const url = usePythonApi
      ? `${this.pythonApiUrl}/api/v1/drivers/${driverId}?season=${season}`
      : `${this.baseUrl}/api/drivers/${driverId}?season=${season}`;

    return this.fetchWithErrorHandling<DriverData>(url);
  }

  // Races API
  async getRaces(season?: number, usePythonApi: boolean = false): Promise<ApiResponse<RaceData[]>> {
    const seasonParam = season ? `?season=${season}` : '';
    const url = usePythonApi
      ? `${this.pythonApiUrl}/api/v1/races${seasonParam}`
      : `${this.baseUrl}/api/races${seasonParam}`;

    return this.fetchWithErrorHandling<RaceData[]>(url);
  }

  async getRace(raceId: string, usePythonApi: boolean = false): Promise<ApiResponse<RaceData>> {
    const url = usePythonApi
      ? `${this.pythonApiUrl}/api/v1/races/${raceId}`
      : `${this.baseUrl}/api/races/${raceId}`;

    return this.fetchWithErrorHandling<RaceData>(url);
  }

  // Teams API (Python Backend only)
  async getTeams(season: number = 2025): Promise<ApiResponse<TeamData[]>> {
    const url = `${this.pythonApiUrl}/api/v1/teams?season=${season}`;
    return this.fetchWithErrorHandling<TeamData[]>(url);
  }

  async getTeam(teamId: string, season: number = 2025): Promise<ApiResponse<TeamData>> {
    const url = `${this.pythonApiUrl}/api/v1/teams/${teamId}?season=${season}`;
    return this.fetchWithErrorHandling<TeamData>(url);
  }

  // Predictions API (Python Backend only)
  async getRacePredictions(raceId: string): Promise<ApiResponse<PredictionData[]>> {
    const url = `${this.pythonApiUrl}/api/v1/predictions/race/${raceId}`;
    return this.fetchWithErrorHandling<PredictionData[]>(url);
  }

  async generateRacePredictions(raceId: string): Promise<ApiResponse<PredictionData[]>> {
    const url = `${this.pythonApiUrl}/api/v1/predictions/race/${raceId}`;
    return this.fetchWithErrorHandling<PredictionData[]>(url, { method: 'POST' });
  }

  // Calendar API (Python Backend only)
  async getUpcomingRaces(limit: number = 5): Promise<ApiResponse<RaceData[]>> {
    const url = `${this.pythonApiUrl}/api/v1/races/upcoming?limit=${limit}`;
    return this.fetchWithErrorHandling<RaceData[]>(url);
  }

  async getRecentRaces(limit: number = 5): Promise<ApiResponse<RaceData[]>> {
    const url = `${this.pythonApiUrl}/api/v1/races/recent?limit=${limit}`;
    return this.fetchWithErrorHandling<RaceData[]>(url);
  }

  async getCalendarStats(season: number = 2025): Promise<ApiResponse<Record<string, unknown>>> {
    const url = `${this.pythonApiUrl}/api/v1/calendar/stats?season=${season}`;
    return this.fetchWithErrorHandling<Record<string, unknown>>(url);
  }

  // Standings API (Python Backend only)
  async getStandings(season: number = 2025): Promise<ApiResponse<Record<string, unknown>>> {
    const url = `${this.pythonApiUrl}/api/v1/standings?season=${season}`;
    return this.fetchWithErrorHandling<Record<string, unknown>>(url);
  }

  // Chat API (Python Backend only)
  async sendChatMessage(message: string): Promise<ApiResponse<{ response: string; type: string }>> {
    const url = `${this.pythonApiUrl}/api/v1/chat/message`;
    return this.fetchWithErrorHandling<{ response: string; type: string }>(url, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  // Health checks
  async checkFrontendHealth(): Promise<ApiResponse<{ ok: boolean; ts: number }>> {
    const url = `${this.baseUrl}/api/health`;
    return this.fetchWithErrorHandling<{ ok: boolean; ts: number }>(url);
  }

  async checkBackendHealth(): Promise<ApiResponse<Record<string, unknown>>> {
    const url = `${this.pythonApiUrl}/api/v1/health`;
    return this.fetchWithErrorHandling<Record<string, unknown>>(url);
  }

  // Unified methods that try Python backend first, fall back to Next.js API
  async getDriversWithFallback(season: number = 2025): Promise<ApiResponse<DriverData[]>> {
    const backendResponse = await this.getDrivers(season, true);
    if (backendResponse.success) {
      return backendResponse;
    }

    console.warn('Python backend unavailable, falling back to Next.js API');
    return this.getDrivers(season, false);
  }

  async getRacesWithFallback(season?: number): Promise<ApiResponse<RaceData[]>> {
    const backendResponse = await this.getRaces(season, true);
    if (backendResponse.success) {
      return backendResponse;
    }

    console.warn('Python backend unavailable, falling back to Next.js API');
    return this.getRaces(season, false);
  }

  // Batch operations
  async getBatchData(season: number = 2025): Promise<{
    drivers: ApiResponse<DriverData[]>;
    races: ApiResponse<RaceData[]>;
    teams: ApiResponse<TeamData[]>;
    standings: ApiResponse<Record<string, unknown>>;
  }> {
    const [drivers, races, teams, standings] = await Promise.allSettled([
      this.getDriversWithFallback(season),
      this.getRacesWithFallback(season),
      this.getTeams(season),
      this.getStandings(season),
    ]);

    return {
      drivers: drivers.status === 'fulfilled' ? drivers.value : { data: [], success: false, error: 'Failed to fetch drivers' },
      races: races.status === 'fulfilled' ? races.value : { data: [], success: false, error: 'Failed to fetch races' },
      teams: teams.status === 'fulfilled' ? teams.value : { data: [], success: false, error: 'Failed to fetch teams' },
      standings: standings.status === 'fulfilled' ? standings.value : { data: null, success: false, error: 'Failed to fetch standings' },
    };
  }
}

export const apiClient = new ApiClient();
export default apiClient;