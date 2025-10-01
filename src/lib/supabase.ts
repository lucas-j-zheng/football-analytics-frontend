import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

export type Database = {
  public: {
    Tables: {
      teams: {
        Row: {
          id: string
          email: string
          team_name: string
          sport: string
          league: string | null
          contact_person: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          team_name: string
          sport: string
          league?: string | null
          contact_person: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          team_name?: string
          sport?: string
          league?: string | null
          contact_person?: string
          created_at?: string
          updated_at?: string
        }
      }
      consultants: {
        Row: {
          id: string
          email: string
          first_name: string
          last_name: string
          specializations: string[]
          experience_years: number
          hourly_rate: number | null
          bio: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          first_name: string
          last_name: string
          specializations: string[]
          experience_years: number
          hourly_rate?: number | null
          bio?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string
          last_name?: string
          specializations?: string[]
          experience_years?: number
          hourly_rate?: number | null
          bio?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'team' | 'consultant'
    }
  }
}