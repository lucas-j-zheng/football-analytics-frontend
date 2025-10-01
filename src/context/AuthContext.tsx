import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/auth';
import { AuthContextType, User, Team, Consultant, RegisterData, RegisterTeamData, RegisterConsultantData } from '../types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [consultant, setConsultant] = useState<Consultant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const userType = localStorage.getItem('user_type') as 'team' | 'consultant' | null;

          if (userType === 'team') {
            const teamData = localStorage.getItem('team_data');
            if (teamData) {
              const teamObj = JSON.parse(teamData);
              setTeam(teamObj);
              setUser({
                id: teamObj.id,
                type: 'team'
              });
            }
          } else if (userType === 'consultant') {
            const consultantData = localStorage.getItem('consultant_data');
            if (consultantData) {
              const consultantObj = JSON.parse(consultantData);
              setConsultant(consultantObj);
              setUser({
                id: consultantObj.id,
                type: 'consultant'
              });
            }
          }
        } catch (error) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('user_type');
          localStorage.removeItem('team_data');
          localStorage.removeItem('consultant_data');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string, userType: 'team' | 'consultant') => {
    try {
      if (userType === 'team') {
        const response = await authService.loginTeam(email, password);
        setTeam(response.team);
        localStorage.setItem('team_data', JSON.stringify(response.team));
        localStorage.setItem('access_token', response.access_token);
        localStorage.setItem('user_type', userType);

        const userData: User = {
          id: response.team.id,
          type: userType
        };
        setUser(userData);
      } else {
        const response = await authService.loginConsultant(email, password);
        setConsultant(response.consultant);
        localStorage.setItem('consultant_data', JSON.stringify(response.consultant));
        localStorage.setItem('access_token', response.access_token);
        localStorage.setItem('user_type', userType);

        const userData: User = {
          id: response.consultant.id,
          type: userType
        };
        setUser(userData);
      }
    } catch (error) {
      throw error;
    }
  };

  const register = async (data: RegisterData, userType: 'team' | 'consultant') => {
    try {
      if (userType === 'team') {
        const response = await authService.registerTeam(data as RegisterTeamData);
        setTeam(response.team);
        localStorage.setItem('team_data', JSON.stringify(response.team));
        localStorage.setItem('access_token', response.access_token);
        localStorage.setItem('user_type', userType);

        const userData: User = {
          id: response.team.id,
          type: userType
        };
        setUser(userData);
      } else {
        const response = await authService.registerConsultant(data as RegisterConsultantData);
        setConsultant(response.consultant);
        localStorage.setItem('consultant_data', JSON.stringify(response.consultant));
        localStorage.setItem('access_token', response.access_token);
        localStorage.setItem('user_type', userType);

        const userData: User = {
          id: response.consultant.id,
          type: userType
        };
        setUser(userData);
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_type');
    localStorage.removeItem('team_data');
    localStorage.removeItem('consultant_data');
    setUser(null);
    setTeam(null);
    setConsultant(null);
  };

  const value: AuthContextType = {
    user,
    team,
    consultant,
    login,
    register,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};