export interface Visualization {
  id: number;
  team_id: number;
  game_id?: number;
  created_by_consultant: boolean;
  is_highlighted: boolean;
  chart_type: string;
  configuration: any;
  title: string;
  description?: string;
  created_at: string;
}

export interface ChartData {
  [key: string]: {
    count: number;
    yards: number;
  };
}