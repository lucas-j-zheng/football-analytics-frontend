import api from './api';
import { Game, PlayData, GameUploadData } from '../types/game';

export const gameService = {
  async uploadGame(data: GameUploadData) {
    const formData = new FormData();
    formData.append('week', data.week.toString());
    formData.append('opponent', data.opponent);
    formData.append('location', data.location);
    formData.append('csv_file', data.csv_file);
    
    if (data.analytics_focus_notes) {
      formData.append('analytics_focus_notes', data.analytics_focus_notes);
    }

    const response = await api.post('/games', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async getGames(): Promise<{ games: Game[] }> {
    const response = await api.get('/games');
    return response.data;
  },

  async getGame(gameId: number): Promise<{ game: Game }> {
    const response = await api.get(`/games/${gameId}`);
    return response.data;
  },

  async getGamePlays(gameId: number): Promise<{ plays: PlayData[]; total_plays: number }> {
    const response = await api.get(`/games/${gameId}/plays`);
    return response.data;
  },
};