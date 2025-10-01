import { User as SupabaseUser, Session } from '@supabase/supabase-js'

export interface Team {
  id: string;
  team_name: string;
  email: string;
  sport: string;
  league?: string;
  contact_person: string;
  created_at: string;
  updated_at: string;
}

export interface Consultant {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  specializations: string[];
  experience_years: number;
  hourly_rate?: number;
  bio?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  user: SupabaseUser | null;
  session: Session | null;
  error?: any;
}

export interface User {
  id: string;
  email?: string;
  type: 'team' | 'consultant';
  role?: 'team' | 'consultant';
  profile?: Team | Consultant;
}

export interface AuthContextType {
  user: User | null;
  team: Team | null;
  consultant: Consultant | null;
  loading: boolean;
  login: (email: string, password: string, userType: 'team' | 'consultant') => Promise<void>;
  register: (data: RegisterData, userType: 'team' | 'consultant') => Promise<void>;
  logout: () => void;
}

export interface RegisterTeamData {
  email: string;
  password: string;
  team_name: string;
  sport: string;
  league?: string;
  contact_person: string;
}

export interface RegisterConsultantData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  specializations: string[];
  experience_years: number;
  hourly_rate?: number;
  bio?: string;
}

export type RegisterData = RegisterTeamData | RegisterConsultantData;