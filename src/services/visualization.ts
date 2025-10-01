import api from './api';
import { Visualization, ChartData } from '../types/visualization';

export const visualizationService = {
  async createChart(gameId: number, chartType: string, dataType: string, highlight: boolean = false) {
    const response = await api.post('/consultant/visualizations/create-chart', {
      game_id: gameId,
      chart_type: chartType,
      data_type: dataType,
      highlight
    });
    return response.data;
  },

  async toggleHighlight(visualizationId: number) {
    const response = await api.put(`/visualizations/${visualizationId}/highlight`);
    return response.data;
  },

  async getTeamVisualizations(teamId: number): Promise<{ visualizations: Visualization[] }> {
    const response = await api.get(`/teams/${teamId}/visualizations`);
    return response.data;
  },

  async createVisualization(data: {
    team_id: number;
    game_id?: number;
    chart_type: string;
    title: string;
    configuration: any;
    description?: string;
    is_highlighted?: boolean;
  }) {
    const response = await api.post('/visualizations', data);
    return response.data;
  },
};