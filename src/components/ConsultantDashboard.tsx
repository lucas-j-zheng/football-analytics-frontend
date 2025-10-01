import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { consultantService, GameAnalytics } from '../services/consultant';
import { Team, Game } from '../types/game';
import GameAnalyticsView from './GameAnalyticsView';
import AdvancedAnalytics from './AdvancedAnalytics';
import ConsultantDataExplorer from './ConsultantDataExplorer';
import ConsultantChartBuilder from './ConsultantChartBuilder';

const ConsultantDashboard: React.FC = () => {
  const { consultant, logout } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamGames, setTeamGames] = useState<Game[]>([]);
  const [selectedGameAnalytics, setSelectedGameAnalytics] = useState<GameAnalytics | null>(null);
  const [showAdvancedAnalytics, setShowAdvancedAnalytics] = useState<number | null>(null);
  const [showDataExplorer, setShowDataExplorer] = useState<number | null>(null);
  const [showChartBuilder, setShowChartBuilder] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadTeams = async () => {
    try {
      setLoading(true);
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
      const response = await consultantService.getTeamGames(teamId);
      setSelectedTeam(response.team);
      setTeamGames(response.games);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to load team games');
    } finally {
      setLoading(false);
    }
  };

  const loadGameAnalytics = async (gameId: number) => {
    try {
      setLoading(true);
      const analytics = await consultantService.getGameAnalytics(gameId);
      setSelectedGameAnalytics(analytics);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to load game analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeams();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

const goBackToTeams = () => {
    setSelectedTeam(null);
    setTeamGames([]);
    setSelectedGameAnalytics(null);
    setShowAdvancedAnalytics(null);
  };

  const goBackToGames = () => {
    setSelectedGameAnalytics(null);
  };

  const goBackToTeamView = () => {
    setShowAdvancedAnalytics(null);
    setShowDataExplorer(null);
    setSelectedGameAnalytics(null);
  };

if (selectedGameAnalytics) {
    return <GameAnalyticsView analytics={selectedGameAnalytics} onBack={goBackToGames} />;
  }

  if (showAdvancedAnalytics) {
    return <AdvancedAnalytics teamId={showAdvancedAnalytics} onBack={goBackToTeamView} />;
  }

  if (showDataExplorer) {
    return <ConsultantDataExplorer teamId={showDataExplorer} onClose={goBackToTeamView} />;
  }

  if (showChartBuilder) {
    return <ConsultantChartBuilder teamId={showChartBuilder} onClose={goBackToTeamView} />;
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>Consultant Dashboard</h1>
        <button
          onClick={logout}
          style={{
            padding: '8px 16px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Welcome, {consultant?.first_name} {consultant?.last_name}!</h2>
        <p>Email: {consultant?.email}</p>
      </div>

      {error && (
        <div style={{ color: 'red', marginBottom: '10px', padding: '10px', backgroundColor: '#fee', borderRadius: '4px' }}>
          {error}
        </div>
      )}

      {selectedTeam ? (
        <div>
          <button
            onClick={goBackToTeams}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginBottom: '20px'
            }}
          >
            ← Back to Teams
          </button>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3>{selectedTeam.team_name} - Games</h3>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowChartBuilder(selectedTeam.id)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#FF6B6B',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                📈 Custom Charts
              </button>
              <button
                onClick={() => setShowDataExplorer(selectedTeam.id)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#8B5CF6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                📊 Data Explorer
              </button>
              <button
                onClick={() => setShowAdvancedAnalytics(selectedTeam.id)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#17a2b8',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Advanced Analytics
              </button>
            </div>
          </div>
          
          {loading ? (
            <div>Loading games...</div>
          ) : teamGames.length === 0 ? (
            <div style={{ 
              border: '2px dashed #ccc', 
              padding: '40px', 
              textAlign: 'center',
              borderRadius: '8px'
            }}>
              <h4>No games uploaded yet</h4>
              <p>This team hasn't uploaded any game data yet.</p>
            </div>
          ) : (
            <div style={{ border: '1px solid #ddd', borderRadius: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Week</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Opponent</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Location</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Uploaded</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Notes</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teamGames.map((game) => (
                    <tr key={game.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '12px' }}>Week {game.week}</td>
                      <td style={{ padding: '12px' }}>{game.opponent}</td>
                      <td style={{ padding: '12px' }}>{game.location}</td>
                      <td style={{ padding: '12px' }}>{formatDate(game.submission_timestamp)}</td>
                      <td style={{ padding: '12px', maxWidth: '200px' }}>
                        {game.analytics_focus_notes ? (
                          <div title={game.analytics_focus_notes}>
                            {game.analytics_focus_notes.length > 50 
                              ? `${game.analytics_focus_notes.substring(0, 50)}...` 
                              : game.analytics_focus_notes}
                          </div>
                        ) : (
                          <span style={{ color: '#999' }}>No notes</span>
                        )}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <button
                          onClick={() => loadGameAnalytics(game.id)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Analyze
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div>
          <h3>Client Teams</h3>
          
          {loading ? (
            <div>Loading teams...</div>
          ) : teams.length === 0 ? (
            <div style={{ 
              border: '2px dashed #ccc', 
              padding: '40px', 
              textAlign: 'center',
              borderRadius: '8px'
            }}>
              <h4>No teams registered yet</h4>
              <p>No teams have registered for analytics services yet.</p>
            </div>
          ) : (
            <div style={{ border: '1px solid #ddd', borderRadius: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Team Name</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Email</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Joined</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map((team) => (
                    <tr key={team.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '12px' }}>{team.team_name}</td>
                      <td style={{ padding: '12px' }}>{team.email}</td>
                      <td style={{ padding: '12px' }}>{formatDate(team.created_at)}</td>
                      <td style={{ padding: '12px' }}>
                        <button
                          onClick={() => loadTeamGames(team.id)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          View Games
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ marginTop: '30px' }}>
            <h3>Available Tools</h3>
            <ul>
              <li>✅ View client data and game analytics</li>
              <li>✅ Create insights and highlights with visualization</li>
              <li>✅ Advanced filtering and cross-game analysis tools</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsultantDashboard;