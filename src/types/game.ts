export interface Team {
  id: number;
  team_name: string;
  email: string;
  created_at: string;
}

export interface Game {
  id: number;
  team_id: number;
  week: number;
  opponent: string;
  location: 'Home' | 'Away';
  analytics_focus_notes?: string;
  csv_file_path?: string;
  submission_timestamp: string;
}

export interface PlayData {
  id: number;
  game_id: number;
  play_id: number;
  down: number;
  distance: number;
  yard_line: number;
  formation: string;
  play_type: string;
  play_name: string;
  result_of_play: string;
  yards_gained: number;
  points_scored: number;
}

export interface GameUploadData {
  week: number;
  opponent: string;
  location: 'Home' | 'Away';
  analytics_focus_notes?: string;
  csv_file: File;
}