import React, { useState, useEffect, createContext, useContext } from 'react';
import { useAuth } from '../context/AuthContext';
import { consultantService, GameAnalytics } from '../services/consultant';
import { Team, Game } from '../types/game';

// Import existing components - we'll integrate them into tabs
import GameAnalyticsView from './GameAnalyticsView';
import EnhancedAdvancedAnalytics from './EnhancedAdvancedAnalytics';
import EnhancedDataExplorer from './EnhancedDataExplorer';
import EnhancedCustomChartBuilder from './EnhancedCustomChartBuilder';

// Tab types
export type TabType = 'teams' | 'games' | 'charts' | 'explorer' | 'analytics';

// Workspace context for shared state
interface WorkspaceContextType {
  selectedTeam: Team | null;
  setSelectedTeam: (team: Team | null) => void;
  teamGames: Game[];
  setTeamGames: (games: Game[]) => void;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  teams: Team[];
  setTeams: (teams: Team[]) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  error: string;
  setError: (error: string) => void;
  selectedGameAnalytics: GameAnalytics | null;
  setSelectedGameAnalytics: (analytics: GameAnalytics | null) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};

// Tab Bar Component
const TabBar: React.FC = () => {
  const { selectedTeam, activeTab, setActiveTab } = useWorkspace();
  
  const tabs = [
    {
      id: 'teams' as TabType,
      label: 'Teams',
      icon: '👥',
      disabled: false,
      description: 'Select and manage teams'
    },
    {
      id: 'games' as TabType,
      label: 'Games',
      icon: '🎮',
      disabled: !selectedTeam,
      description: 'View team games and analysis'
    },
    {
      id: 'charts' as TabType,
      label: 'Custom Charts',
      icon: '📊',
      disabled: !selectedTeam,
      description: 'Create custom visualizations'
    },
    {
      id: 'explorer' as TabType,
      label: 'Data Explorer',
      icon: '🔍',
      disabled: !selectedTeam,
      description: 'Explore and analyze data'
    },
    {
      id: 'analytics' as TabType,
      label: 'Advanced Analytics',
      icon: '📈',
      disabled: !selectedTeam,
      description: 'Advanced statistical analysis'
    }
  ];

  const handleTabClick = (tabId: TabType) => {
    if (tabs.find(tab => tab.id === tabId)?.disabled) return;
    setActiveTab(tabId);
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      backdropFilter: 'blur(10px)',
      borderRadius: '12px',
      margin: '0 20px 20px 20px',
      padding: '8px',
      boxShadow: '0 8px 32px rgba(102, 126, 234, 0.2)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      position: 'relative'
    }}>
      {/* Team Info Bar */}
      {selectedTeam && (
        <div 
          className="slide-up"
          style={{
            padding: '8px 16px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            color: 'white',
            animation: 'slideUp 0.4s ease-out'
          }}
        >
          <span className="hide-sm" style={{ fontSize: '14px', opacity: 0.8 }}>Current Team:</span>
          <span style={{ marginLeft: '8px', fontWeight: '600' }}>{selectedTeam.team_name}</span>
          <span className="hide-md" style={{ marginLeft: 'auto', fontSize: '12px', opacity: 0.6 }}>{selectedTeam.email}</span>
        </div>
      )}
      
      {/* Tab Navigation */}
      <div 
        className="tab-scroll"
        style={{
          display: 'flex',
          gap: '4px',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          position: 'relative'
        }}
      >
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            disabled={tab.disabled}
            title={tab.description}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              border: 'none',
              borderRadius: '8px',
              background: activeTab === tab.id 
                ? 'rgba(255, 255, 255, 0.9)' 
                : tab.disabled 
                  ? 'rgba(255, 255, 255, 0.05)'
                  : 'rgba(255, 255, 255, 0.1)',
              color: activeTab === tab.id 
                ? '#4c1d95' 
                : tab.disabled 
                  ? 'rgba(255, 255, 255, 0.3)'
                  : 'white',
              cursor: tab.disabled ? 'not-allowed' : 'pointer',
              fontWeight: activeTab === tab.id ? '600' : '500',
              fontSize: '14px',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              whiteSpace: 'nowrap',
              transform: activeTab === tab.id ? 'translateY(-2px) scale(1.02)' : 'translateY(0) scale(1)',
              boxShadow: activeTab === tab.id 
                ? '0 8px 25px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.1)' 
                : 'none',
              zIndex: activeTab === tab.id ? 10 : 1,
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              if (!tab.disabled && activeTab !== tab.id) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.transform = 'translateY(-1px) scale(1.01)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
              }
            }}
            onMouseLeave={(e) => {
              if (!tab.disabled && activeTab !== tab.id) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }
            }}
          >
            {/* Active Tab Glow Effect */}
            {activeTab === tab.id && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(45deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
                  borderRadius: '8px',
                  animation: 'pulse 2s infinite'
                }}
              />
            )}
            
            <span style={{ 
              fontSize: '16px', 
              position: 'relative', 
              zIndex: 2,
              transition: 'transform 0.2s ease',
              transform: activeTab === tab.id ? 'scale(1.1)' : 'scale(1)'
            }}>
              {tab.icon}
            </span>
            <span style={{ position: 'relative', zIndex: 2 }}>{tab.label}</span>
          </button>
        ))}
      </div>
      
      {/* Add pulse animation for active tab indicator */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
};

// Enhanced Team Selector Component
const EnhancedTeamSelector: React.FC = () => {
  const { teams, setSelectedTeam, setActiveTab, loading, error } = useWorkspace();

  const handleTeamSelect = (team: Team) => {
    setSelectedTeam(team);
    setActiveTab('games');
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #f3f4f6',
          borderTop: '4px solid #6366f1',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <p style={{ color: '#6b7280' }}>Loading teams...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: '20px',
        background: '#fee2e2',
        border: '1px solid #fecaca',
        borderRadius: '8px',
        color: '#dc2626',
        margin: '20px'
      }}>
        <strong>Error:</strong> {error}
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '60px 20px',
        background: '#f9fafb',
        borderRadius: '12px',
        margin: '20px',
        border: '2px dashed #d1d5db'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
        <h3 style={{ margin: '0 0 8px 0', color: '#374151' }}>No Teams Available</h3>
        <p style={{ margin: 0, color: '#6b7280' }}>
          No teams have registered for analytics services yet.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ 
          margin: '0 0 8px 0', 
          color: '#1f2937',
          fontSize: '24px',
          fontWeight: '700'
        }}>
          Select a Team
        </h2>
        <p style={{ 
          margin: 0, 
          color: '#6b7280',
          fontSize: '16px'
        }}>
          Choose a team to begin analyzing their game data and performance metrics.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '20px'
      }}>
        {teams.map((team) => (
          <div
            key={team.id}
            onClick={() => handleTeamSelect(team)}
            style={{
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '24px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(99, 102, 241, 0.15)';
              e.currentTarget.style.borderColor = '#6366f1';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
              e.currentTarget.style.borderColor = '#e5e7eb';
            }}
          >
            {/* Team Avatar Placeholder */}
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '20px',
              fontWeight: '700',
              marginBottom: '16px'
            }}>
              {team.team_name.charAt(0).toUpperCase()}
            </div>

            <h3 style={{
              margin: '0 0 8px 0',
              color: '#1f2937',
              fontSize: '18px',
              fontWeight: '600'
            }}>
              {team.team_name}
            </h3>

            <p style={{
              margin: '0 0 12px 0',
              color: '#6b7280',
              fontSize: '14px'
            }}>
              {team.email}
            </p>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '12px',
              color: '#9ca3af'
            }}>
              <span>Joined: {new Date(team.created_at).toLocaleDateString()}</span>
              <div style={{
                background: '#f3f4f6',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '500'
              }}>
                Team
              </div>
            </div>

            {/* Hover Arrow */}
            <div style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              color: '#6366f1',
              fontSize: '18px',
              opacity: 0,
              transition: 'opacity 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '1';
            }}>
              →
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Games View Component
const EnhancedGamesView: React.FC = () => {
  const { 
    selectedTeam, 
    teamGames, 
    setSelectedGameAnalytics, 
    loading, 
    error 
  } = useWorkspace();

  const handleGameAnalysis = async (gameId: number) => {
    try {
      const analytics = await consultantService.getGameAnalytics(gameId);
      setSelectedGameAnalytics(analytics);
    } catch (error: any) {
      console.error('Failed to load game analytics:', error);
    }
  };

  if (!selectedTeam) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>Please select a team first.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px' 
      }}>
        <div>Loading games...</div>
      </div>
    );
  }

  if (teamGames.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '60px 20px',
        background: '#f9fafb',
        borderRadius: '12px',
        margin: '20px',
        border: '2px dashed #d1d5db'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎮</div>
        <h3 style={{ margin: '0 0 8px 0', color: '#374151' }}>No Games Available</h3>
        <p style={{ margin: 0, color: '#6b7280' }}>
          {selectedTeam.team_name} hasn't uploaded any game data yet.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ 
          margin: '0 0 8px 0', 
          color: '#1f2937',
          fontSize: '24px',
          fontWeight: '700'
        }}>
          {selectedTeam.team_name} - Games
        </h2>
        <p style={{ 
          margin: 0, 
          color: '#6b7280',
          fontSize: '16px'
        }}>
          Analyze individual games or use the other tabs for comprehensive team analysis.
        </p>
      </div>

      <div style={{
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Week</th>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Opponent</th>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Location</th>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Uploaded</th>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Notes</th>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {teamGames.map((game, index) => (
              <tr 
                key={game.id} 
                style={{ 
                  borderTop: index > 0 ? '1px solid #f3f4f6' : 'none',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <td style={{ padding: '16px', color: '#374151' }}>Week {game.week}</td>
                <td style={{ padding: '16px', color: '#374151', fontWeight: '500' }}>{game.opponent}</td>
                <td style={{ padding: '16px', color: '#374151' }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '500',
                    background: game.location === 'Home' ? '#dcfce7' : '#dbeafe',
                    color: game.location === 'Home' ? '#166534' : '#1e40af'
                  }}>
                    {game.location}
                  </span>
                </td>
                <td style={{ padding: '16px', color: '#6b7280', fontSize: '14px' }}>
                  {new Date(game.submission_timestamp).toLocaleDateString()}
                </td>
                <td style={{ padding: '16px', maxWidth: '200px' }}>
                  {game.analytics_focus_notes ? (
                    <div 
                      title={game.analytics_focus_notes}
                      style={{ 
                        color: '#374151', 
                        fontSize: '14px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {game.analytics_focus_notes.length > 40 
                        ? `${game.analytics_focus_notes.substring(0, 40)}...` 
                        : game.analytics_focus_notes}
                    </div>
                  ) : (
                    <span style={{ color: '#9ca3af', fontSize: '14px' }}>No notes</span>
                  )}
                </td>
                <td style={{ padding: '16px' }}>
                  <button
                    onClick={() => handleGameAnalysis(game.id)}
                    className="btn btn-primary"
                  >
                    Analyze
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Tab Content Component with Animations
const TabContent: React.FC = () => {
  const { 
    activeTab, 
    selectedTeam, 
    selectedGameAnalytics, 
    setSelectedGameAnalytics 
  } = useWorkspace();
  
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [contentKey, setContentKey] = useState(0);

  // Handle tab change animations
  useEffect(() => {
    setIsTransitioning(true);
    setContentKey(prev => prev + 1);
    const timer = setTimeout(() => setIsTransitioning(false), 150);
    return () => clearTimeout(timer);
  }, [activeTab]);

  // Wrapper component for animated content
  const AnimatedContent: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div 
      key={contentKey}
      className="fade-in"
      style={{
        opacity: isTransitioning ? 0 : 1,
        transform: isTransitioning ? 'translateY(10px)' : 'translateY(0)',
        transition: 'all 0.3s ease-out'
      }}
    >
      {children}
    </div>
  );

  // Handle game analytics view
  if (selectedGameAnalytics) {
    return (
      <AnimatedContent>
        <GameAnalyticsView 
          analytics={selectedGameAnalytics} 
          onBack={() => setSelectedGameAnalytics(null)} 
        />
      </AnimatedContent>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'teams':
        return <EnhancedTeamSelector />;
      
      case 'games':
        return <EnhancedGamesView />;
      
      case 'charts':
        return selectedTeam ? (
          <div style={{ margin: '20px' }}>
            <div style={{
              background: 'white',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              overflow: 'hidden'
            }}>
              <EnhancedCustomChartBuilder 
                teamId={selectedTeam.id} 
                teamName={selectedTeam.team_name}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center" style={{ height: '400px' }}>
            <p className="text-gray-500">Please select a team first.</p>
          </div>
        );
      
      case 'explorer':
        return selectedTeam ? (
          <div style={{ margin: '20px' }}>
            <div style={{
              background: 'white',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              overflow: 'hidden'
            }}>
              <EnhancedDataExplorer 
                teamId={selectedTeam.id} 
                teamName={selectedTeam.team_name}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center" style={{ height: '400px' }}>
            <p className="text-gray-500">Please select a team first.</p>
          </div>
        );
      
      case 'analytics':
        return selectedTeam ? (
          <div style={{ margin: '20px' }}>
            <div style={{
              background: 'white',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              overflow: 'hidden'
            }}>
              <EnhancedAdvancedAnalytics 
                teamId={selectedTeam.id} 
                teamName={selectedTeam.team_name}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center" style={{ height: '400px' }}>
            <p className="text-gray-500">Please select a team first.</p>
          </div>
        );
      
      default:
        return <EnhancedTeamSelector />;
    }
  };

  return (
    <AnimatedContent>
      {renderTabContent()}
    </AnimatedContent>
  );
};

// Main Consultant Workspace Component
const ConsultantWorkspace: React.FC = () => {
  const { consultant, logout } = useAuth();
  
  // Workspace state
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamGames, setTeamGames] = useState<Game[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('teams');
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedGameAnalytics, setSelectedGameAnalytics] = useState<GameAnalytics | null>(null);

  // Load teams on mount
  useEffect(() => {
    loadTeams();
  }, []);

  // Load team games when team is selected
  useEffect(() => {
    if (selectedTeam) {
      loadTeamGames(selectedTeam.id);
    } else {
      setTeamGames([]);
    }
  }, [selectedTeam]);

  const loadTeams = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await consultantService.getTeams();
      setTeams(response.teams);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  const loadTeamGames = async (teamId: number) => {
    try {
      setLoading(true);
      setError('');
      const response = await consultantService.getTeamGames(teamId);
      setTeamGames(response.games);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to load team games');
    } finally {
      setLoading(false);
    }
  };

  const workspaceValue: WorkspaceContextType = {
    selectedTeam,
    setSelectedTeam,
    teamGames,
    setTeamGames,
    activeTab,
    setActiveTab,
    teams,
    setTeams,
    loading,
    setLoading,
    error,
    setError,
    selectedGameAnalytics,
    setSelectedGameAnalytics
  };

  return (
    <WorkspaceContext.Provider value={workspaceValue}>
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        {/* Header */}
        <div 
          className="mobile-stack"
          style={{
            background: 'white',
            borderBottom: '1px solid #e5e7eb',
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            gap: '16px'
          }}
        >
          <div>
            <h1 style={{ 
              margin: '0 0 4px 0', 
              color: '#1f2937',
              fontSize: '24px',
              fontWeight: '700'
            }}>
              Consultant Workspace
            </h1>
            <p style={{
              margin: 0,
              color: '#6b7280',
              fontSize: '14px'
            }}>
              Welcome, {consultant?.first_name} {consultant?.last_name} • {consultant?.email}
            </p>
          </div>
          
          <button
            onClick={logout}
            className="btn btn-error"
          >
            Logout
          </button>
        </div>

        {/* Tab Navigation */}
        <TabBar />

        {/* Tab Content */}
        <TabContent />

        {/* Global Styles */}
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          /* Custom scrollbar for tab navigation */
          *::-webkit-scrollbar {
            width: 6px;
            height: 6px;
          }
          
          *::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.1);
            border-radius: 3px;
          }
          
          *::-webkit-scrollbar-thumb {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 3px;
          }
          
          *::-webkit-scrollbar-thumb:hover {
            background: rgba(0, 0, 0, 0.5);
          }
        `}</style>
      </div>
    </WorkspaceContext.Provider>
  );
};

export default ConsultantWorkspace;