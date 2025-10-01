import { supabase } from '../lib/supabase';
import { AuthResponse, RegisterTeamData, RegisterConsultantData, Team, Consultant } from '../types/auth';

export const authService = {
  async signUp(email: string, password: string, userData: RegisterTeamData | RegisterConsultantData, userType: 'team' | 'consultant'): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: userType,
            ...userData
          }
        }
      });

      if (error) {
        return { user: null, session: null, error };
      }

      // Create profile in appropriate table
      if (data.user && userType === 'team') {
        const teamData = userData as RegisterTeamData;
        const { error: profileError } = await supabase
          .from('teams')
          .insert({
            id: data.user.id,
            email: teamData.email,
            team_name: teamData.team_name,
            sport: teamData.sport,
            league: teamData.league,
            contact_person: teamData.contact_person
          });

        if (profileError) {
          return { user: data.user, session: data.session, error: profileError };
        }
      } else if (data.user && userType === 'consultant') {
        const consultantData = userData as RegisterConsultantData;
        const { error: profileError } = await supabase
          .from('consultants')
          .insert({
            id: data.user.id,
            email: consultantData.email,
            first_name: consultantData.first_name,
            last_name: consultantData.last_name,
            specializations: consultantData.specializations,
            experience_years: consultantData.experience_years,
            hourly_rate: consultantData.hourly_rate,
            bio: consultantData.bio
          });

        if (profileError) {
          return { user: data.user, session: data.session, error: profileError };
        }
      }

      return { user: data.user, session: data.session };
    } catch (error) {
      return { user: null, session: null, error };
    }
  },

  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      return { user: data.user, session: data.session, error };
    } catch (error) {
      return { user: null, session: null, error };
    }
  },

  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return { error };
  },

  async getCurrentSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
  },

  async getUserProfile(userId: string, role: 'team' | 'consultant'): Promise<Team | Consultant | null> {
    if (role === 'team') {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching team profile:', error);
        return null;
      }
      return data as Team;
    } else {
      const { data, error } = await supabase
        .from('consultants')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching consultant profile:', error);
        return null;
      }
      return data as Consultant;
    }
  },

  // OAuth providers
  async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    return { data, error };
  },

  async signInWithGitHub() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    return { data, error };
  },

  async verifyToken() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) {
      throw new Error('Invalid token');
    }
    return { user: session.user };
  },

  async loginTeam(email: string, password: string) {
    const response = await this.signIn(email, password);
    if (response.error || !response.user) {
      throw response.error;
    }
    const team = await this.getUserProfile(response.user.id, 'team') as Team;
    return { access_token: response.session?.access_token || '', team };
  },

  async loginConsultant(email: string, password: string) {
    const response = await this.signIn(email, password);
    if (response.error || !response.user) {
      throw response.error;
    }
    const consultant = await this.getUserProfile(response.user.id, 'consultant') as Consultant;
    return { access_token: response.session?.access_token || '', consultant };
  },

  async registerTeam(data: RegisterTeamData) {
    const response = await this.signUp(data.email, data.password, data, 'team');
    if (response.error || !response.user) {
      throw response.error;
    }
    const team = await this.getUserProfile(response.user.id, 'team') as Team;
    return { access_token: response.session?.access_token || '', team };
  },

  async registerConsultant(data: RegisterConsultantData) {
    const response = await this.signUp(data.email, data.password, data, 'consultant');
    if (response.error || !response.user) {
      throw response.error;
    }
    const consultant = await this.getUserProfile(response.user.id, 'consultant') as Consultant;
    return { access_token: response.session?.access_token || '', consultant };
  }
};