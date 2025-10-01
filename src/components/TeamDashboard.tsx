import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { gameService } from '../services/game';
import { visualizationService } from '../services/visualization';
import { Game } from '../types/game';
import { Visualization } from '../types/visualization';
import GameUpload from './GameUpload';
import VisualizationDisplay from './VisualizationDisplay';
import CustomChartBuilder from './CustomChartBuilder';
import AIAssistant from './AIAssistant';
import LangChainAssistant from './LangChainAssistant';
import ChartComponent from './ChartComponent';

const TeamDashboard: React.FC = () => {
  const { team, logout } = useAuth();
  const [games, setGames] = useState<Game[]>([]);
  const [visualizations, setVisualizations] = useState<Visualization[]>([]);
const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [showChartBuilder, setShowChartBuilder] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showLangChainAssistant, setShowLangChainAssistant] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'games' | 'insights' | 'charts'>('insights');
  const [expandedInsight, setExpandedInsight] = useState<number | null>(null);
  const [insightInNewTab, setInsightInNewTab] = useState<number | null>(null);

const loadGames = async () => {
    try {
      setLoading(true);
      const response = await gameService.getGames();
      setGames(response.games);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to load games');
    } finally {
      setLoading(false);
    }
  };

  const loadVisualizations = async () => {
    if (!team) return;
    
    try {
      const response = await visualizationService.getTeamVisualizations(parseInt(team.id));
      setVisualizations(response.visualizations);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to load insights');
    }
  };

useEffect(() => {
    loadGames();
    loadVisualizations();
  }, [team]);

const handleUploadSuccess = () => {
    setShowUpload(false);
    loadGames();
  };

  const handleChartBuilderClose = () => {
    setShowChartBuilder(false);
    loadVisualizations(); // Refresh visualizations after creating new chart
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleInsightExpand = (insightId: number) => {
    setExpandedInsight(expandedInsight === insightId ? null : insightId);
  };

  const handleOpenInNewTab = (insightId: number) => {
    const insight = visualizations.find(v => v.id === insightId);
    if (insight) {
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${insight.title}</title>
              <style>
                body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
                .chart-container { width: 100%; height: 90vh; }
              </style>
            </head>
            <body>
              <h1>${insight.title}</h1>
              <div id="chart-container" class="chart-container"></div>
              <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
              <script>
                const chartData = ${JSON.stringify(insight.configuration.chart_data)};
                // Render chart using Recharts-like structure
                const chartContainer = document.getElementById('chart-container');
                chartContainer.innerHTML = '<div>Chart data: ' + JSON.stringify(chartData, null, 2) + '</div>';
              </script>
            </body>
          </html>
        `);
        newWindow.document.close();
      }
    }
  };

  const renderInsightMatrix = () => {
    const insights = visualizations.filter(v => v.is_highlighted);
    const charts = visualizations.filter(v => !v.created_by_consultant);
    const allInsights = [...insights, ...charts];
    
    if (allInsights.length === 0) {
      return (
        <div style={{ 
          border: '2px dashed #ccc', 
          padding: '40px', 
          textAlign: 'center',
          borderRadius: '8px'
        }}>
          <h4>No insights available yet</h4>
          <p>Upload games and create charts to see your analytics here.</p>
        </div>
      );
    }

    return (
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gridTemplateRows: '1fr 1fr', 
        gap: '20px',
        height: '600px'
      }}>
        {allInsights.slice(0, 4).map((insight, index) => (
          <div 
            key={insight.id} 
            style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '15px',
              backgroundColor: 'white',
              position: 'relative',
              transition: 'all 0.3s ease',
              cursor: expandedInsight === insight.id ? 'default' : 'pointer',
              ...(expandedInsight === insight.id ? {
                position: 'fixed',
                top: '5%',
                left: '5%',
                right: '5%',
                bottom: '5%',
                zIndex: 1000,
                height: 'auto',
                boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
              } : {})
            }}
            onClick={() => expandedInsight !== insight.id && handleInsightExpand(insight.id)}
          >
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '10px'
            }}>
              <h4 style={{ margin: 0, fontSize: expandedInsight === insight.id ? '20px' : '16px' }}>
                {insight.title}
              </h4>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleInsightExpand(insight.id);
                  }}
                  style={{
                    padding: '4px 8px',
                    fontSize: '12px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    backgroundColor: 'white',
                    cursor: 'pointer'
                  }}
                >
                  {expandedInsight === insight.id ? '✕' : '⛶'}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenInNewTab(insight.id);
                  }}
                  style={{
                    padding: '4px 8px',
                    fontSize: '12px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    backgroundColor: 'white',
                    cursor: 'pointer'
                  }}
                >
                  ↗
                </button>
              </div>
            </div>
            <div style={{ 
              height: expandedInsight === insight.id ? 'calc(100% - 60px)' : 'calc(100% - 50px)',
              overflow: 'hidden'
            }}>
              {insight.configuration?.chart_data && (
                <ChartComponent 
                  chartData={insight.configuration.chart_data}
                  chartType={insight.chart_type as 'bar' | 'pie'}
                  title=""
                  dataType={insight.configuration.data_type || "plays"}
                />
              )}
            </div>
          </div>
        ))}
        
        {/* Fill empty slots with placeholder cards */}
        {Array.from({ length: Math.max(0, 4 - allInsights.length) }).map((_, index) => (
          <div 
            key={`placeholder-${index}`}
            style={{
              border: '2px dashed #ccc',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#999',
              backgroundColor: '#f9f9f9'
            }}
          >
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>📊</div>
            <p style={{ margin: 0, textAlign: 'center' }}>Create more charts<br />to fill this space</p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>Team Dashboard</h1>
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

      {/* Decision Dashboard temporarily hidden - ML service needs fixing
      <div style={{ marginBottom: '12px' }}>
        <Link to="/coach/decisions">Go to 4th & Short Coach Dashboard →</Link>
      </div>
      */}

      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Welcome, {team?.team_name}!</h2>
          <p>Email: {team?.email}</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setShowAIAssistant(true)}
            style={{
              padding: '12px 20px',
              backgroundColor: '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            🤖 Basic AI Assistant
          </button>
          <button
            onClick={() => setShowLangChainAssistant(true)}
            style={{
              padding: '12px 20px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              position: 'relative'
            }}
          >
            🚀 LangChain AI
            <span style={{
              position: 'absolute',
              top: '-8px',
              right: '-8px',
              backgroundColor: '#ffc107',
              color: '#000',
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: '10px',
              fontWeight: 'bold'
            }}>
              NEW
            </span>
          </button>
        </div>
      </div>

<div style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '20px' }}>
            <button
              onClick={() => setActiveTab('games')}
              style={{
                padding: '10px 20px',
                backgroundColor: activeTab === 'games' ? '#007bff' : '#f8f9fa',
                color: activeTab === 'games' ? 'white' : '#333',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Your Games ({games.length})
            </button>
            <button
              onClick={() => setActiveTab('insights')}
              style={{
                padding: '10px 20px',
                backgroundColor: activeTab === 'insights' ? '#007bff' : '#f8f9fa',
                color: activeTab === 'insights' ? 'white' : '#333',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Consultant Insights ({visualizations.filter(v => v.is_highlighted).length})
            </button>
            <button
              onClick={() => setActiveTab('charts')}
              style={{
                padding: '10px 20px',
                backgroundColor: activeTab === 'charts' ? '#007bff' : '#f8f9fa',
                color: activeTab === 'charts' ? 'white' : '#333',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              My Charts ({visualizations.filter(v => !v.created_by_consultant).length})
            </button>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {activeTab === 'games' && (
              <button
                onClick={() => setShowUpload(true)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Upload New Game
              </button>
            )}
            {activeTab === 'charts' && (
              <button
                onClick={() => setShowChartBuilder(true)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#ffc107',
                  color: 'black',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Create Custom Chart
              </button>
            )}
          </div>
        </div>

        {error && (
          <div style={{ color: 'red', marginBottom: '10px', padding: '10px', backgroundColor: '#fee', borderRadius: '4px' }}>
            {error}
          </div>
        )}

{activeTab === 'games' ? (
          loading ? (
            <div>Loading games...</div>
          ) : games.length === 0 ? (
            <div style={{ 
              border: '2px dashed #ccc', 
              padding: '40px', 
              textAlign: 'center',
              borderRadius: '8px'
            }}>
              <h4>No games uploaded yet</h4>
              <p>Click "Upload New Game" to get started with your analytics.</p>
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
                </tr>
              </thead>
              <tbody>
                {games.map((game) => (
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )
        ) : activeTab === 'insights' ? (
          renderInsightMatrix()
        ) : (
          renderInsightMatrix()
        )}
      </div>

      <div style={{ marginTop: '30px' }}>
        <h3>Available Features</h3>
        <ul>
          <li>✅ Upload game data</li>
          <li>✅ View consultant insights and highlighted charts</li>
          <li>✅ Custom chart builder with filters and multiple games</li>
          <li>✅ AI assistant for statistical queries</li>
        </ul>
      </div>

      {showUpload && (
        <GameUpload
          onUploadSuccess={handleUploadSuccess}
          onCancel={() => setShowUpload(false)}
        />
      )}

      {showChartBuilder && (
        <CustomChartBuilder onClose={handleChartBuilderClose} />
      )}

      {showAIAssistant && (
        <AIAssistant onClose={() => setShowAIAssistant(false)} />
      )}
      {showLangChainAssistant && (
        <LangChainAssistant 
          onClose={() => setShowLangChainAssistant(false)} 
          gameId={games.length > 0 ? games[0].id : undefined}
        />
      )}

      {/* Backdrop for expanded insight */}
      {expandedInsight && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999
          }}
          onClick={() => setExpandedInsight(null)}
        />
      )}
    </div>
  );
};

export default TeamDashboard;