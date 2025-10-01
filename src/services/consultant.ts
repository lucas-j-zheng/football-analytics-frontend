import api from './api';
import { Team, Game } from '../types/game';

export interface GameAnalytics {
  game: Game;
  summary: {
    total_plays: number;
    total_yards: number;
    total_points: number;
    avg_yards_per_play: number;
  };
  play_type_stats: Record<string, { count: number; yards: number; avg_yards: number }>;
  formation_stats: Record<string, { count: number; yards: number; avg_yards: number }>;
  down_stats: Record<string, { count: number; yards: number; avg_yards: number }>;
  plays: any[];
}

export interface PlayData {
  id: number;
  play_id: number;
  down: number | null;
  distance: number | null;
  yard_line: number;
  formation: string;
  play_type: string;
  play_name: string;
  result_of_play: string;
  yards_gained: number;
  points_scored: number;
  unit: string;
  quarter?: number;
  time_remaining?: string;
  game_id: number;
  game_week: number;
  game_opponent: string;
}

export interface FilterCondition {
  field: string;
  operator: string;
  value: any;
}

export const consultantService = {
  async getTeams(): Promise<{ teams: Team[] }> {
    const response = await api.get('/consultant/teams');
    return response.data;
  },

  async getTeamGames(teamId: number): Promise<{ team: Team; games: Game[] }> {
    const response = await api.get(`/consultant/teams/${teamId}/games`);
    return response.data;
  },

  async getGameAnalytics(gameId: number): Promise<GameAnalytics> {
    const response = await api.get(`/consultant/analytics/${gameId}`);
    return response.data;
  },

  async getTeamPlayData(teamId: number): Promise<{ plays: PlayData[] }> {
    const response = await api.get(`/consultant/team/${teamId}/play-data`);
    return response.data;
  },

  async filterPlayData(teamId: number, filters: FilterCondition[]): Promise<{ plays: PlayData[] }> {
    const response = await api.post(`/consultant/data/filter`, {
      team_id: teamId,
      filters
    });
    return response.data;
  },

  async generateStatisticalChart(teamId: number, chartType: string, filters: FilterCondition[] = [], options: any = {}): Promise<{ chart_image: string; chart_type: string; plays_analyzed: number }> {
    const response = await api.post('/consultant/charts/statistical', {
      team_id: teamId,
      chart_type: chartType,
      filters,
      options
    });
    return response.data;
  },

  async getChartRecommendations(teamId: number, filters: FilterCondition[] = [], selectedPlays: number = 0): Promise<{ recommendations: any[]; data_summary: any }> {
    const response = await api.post('/consultant/charts/recommend', {
      team_id: teamId,
      filters,
      selected_plays: selectedPlays
    });
    return response.data;
  },
};