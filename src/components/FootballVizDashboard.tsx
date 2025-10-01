import React, { useState, useEffect } from 'react';
import api from '../services/api';
import FootballVizChart from './FootballVizChart';
import AdvancedQueryBuilder from './AdvancedQueryBuilder';

interface Game {
  id: number;
  week: number;
  opponent: string;
  location: string;
}

interface ChartTemplate {
  name: string;
  title: string;
  description: string;
  icon: string;
}

const FootballVizDashboard: React.FC = () => {
  const [selectedGame, setSelectedGame] = useState<number | null>(null);
  const [selectedChart, setSelectedChart] = useState<string>('offensive_efficiency');
  const [selectedTheme, setSelectedTheme] = useState<string>('charcoal_professional');
  const [games, setGames] = useState<Game[]>([]);
  const [availableCharts, setAvailableCharts] = useState<ChartTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonGame, setComparisonGame] = useState<number | null>(null);
  const [showCustomQueryBuilder, setShowCustomQueryBuilder] = useState(false);

  // Default chart templates
  const defaultCharts: ChartTemplate[] = [
    {
      name: 'offensive_efficiency',
      title: 'Offensive Efficiency',
      description: 'Red zone %, 3rd down conversion, and overall offensive performance metrics',
      icon: '⚡'
    },
    {
      name: 'defensive_breakdown',
      title: 'Defensive Breakdown',
      description: 'Rush defense, pass defense, and situational defensive performance',
      icon: '🛡️'
    },
    {
      name: 'situational_analysis',
      title: 'Situational Analysis',
      description: 'Performance in critical game situations (red zone, goal line, etc.)',
      icon: '🎯'
    },
    {
      name: 'performance_comparison',
      title: 'Performance Comparison',
      description: 'Side-by-side comparison of team vs opponent metrics',
      icon: '⚖️'
    }
  ];

  const themes = [
    { value: 'charcoal_professional', label: 'Professional Dark', description: 'Dark charcoal with high contrast' },
    { value: 'field_turf', label: 'Field Turf', description: 'Football field inspired green theme' },
    { value: 'chalkboard', label: 'Chalkboard', description: 'Tactical chalkboard style' },
    { value: 'press_box', label: 'Press Box', description: 'Stadium night lighting theme' }
  ];

  useEffect(() => {
    loadGames();
    setAvailableCharts(defaultCharts);
  }, []);

  const loadGames = async () => {
    setLoading(true);
    try {
      const response = await api.get('/games');
      setGames(response.data.games);
      
      // Auto-select first game if available
      if (response.data.games.length > 0) {
        setSelectedGame(response.data.games[0].id);
      }
    } catch (error) {
      console.error('Failed to load games:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartOptions = {
    show_comparison: showComparison,
    comparison_game_id: comparisonGame || undefined,
    show_league_average: true,
    show_performance_zones: true
  };

  return (
    <div style={{
      padding: '24px',
      backgroundColor: '#0F172A',
      minHeight: '100vh'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ 
          marginBottom: '32px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start' 
        }}>
          <div>
            <h1 style={{
              color: '#FFFFFF',
              fontSize: '32px',
              fontWeight: '700',
              margin: '0 0 8px 0'
            }}>
              FootballViz Analytics Dashboard
            </h1>
            <p style={{
              color: '#94A3B8',
              fontSize: '16px',
              margin: 0
            }}>
              Professional football analytics visualization powered by advanced data science
            </p>
          </div>
          <button
            onClick={() => setShowCustomQueryBuilder(true)}
            style={{
              padding: '12px 24px',
              backgroundColor: '#8B5CF6',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '8px'
            }}
          >
            🔍 Custom Query Builder
          </button>
        </div>

        {/* Controls */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
          marginBottom: '32px'
        }}>
          {/* Game Selection */}
          <div style={{
            backgroundColor: '#1E293B',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid #334155'
          }}>
            <h3 style={{ color: '#FFFFFF', margin: '0 0 16px 0', fontSize: '16px' }}>
              📊 Select Game
            </h3>
            <select
              value={selectedGame || ''}
              onChange={(e) => setSelectedGame(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#0F172A',
                color: '#FFFFFF',
                border: '1px solid #475569',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            >
              <option value="">Select a game...</option>
              {games.map(game => (
                <option key={game.id} value={game.id}>
                  Week {game.week} vs {game.opponent} ({game.location})
                </option>
              ))}
            </select>
          </div>

          {/* Chart Type Selection */}
          <div style={{
            backgroundColor: '#1E293B',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid #334155'
          }}>
            <h3 style={{ color: '#FFFFFF', margin: '0 0 16px 0', fontSize: '16px' }}>
              📈 Chart Type
            </h3>
            <select
              value={selectedChart}
              onChange={(e) => setSelectedChart(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#0F172A',
                color: '#FFFFFF',
                border: '1px solid #475569',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            >
              {availableCharts.map(chart => (
                <option key={chart.name} value={chart.name}>
                  {chart.icon} {chart.title}
                </option>
              ))}
            </select>
            <p style={{
              margin: '8px 0 0 0',
              fontSize: '12px',
              color: '#94A3B8',
              lineHeight: '1.4'
            }}>
              {availableCharts.find(c => c.name === selectedChart)?.description}
            </p>
          </div>

          {/* Theme Selection */}
          <div style={{
            backgroundColor: '#1E293B',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid #334155'
          }}>
            <h3 style={{ color: '#FFFFFF', margin: '0 0 16px 0', fontSize: '16px' }}>
              🎨 Theme
            </h3>
            <select
              value={selectedTheme}
              onChange={(e) => setSelectedTheme(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#0F172A',
                color: '#FFFFFF',
                border: '1px solid #475569',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            >
              {themes.map(theme => (
                <option key={theme.value} value={theme.value}>
                  {theme.label}
                </option>
              ))}
            </select>
            <p style={{
              margin: '8px 0 0 0',
              fontSize: '12px',
              color: '#94A3B8'
            }}>
              {themes.find(t => t.value === selectedTheme)?.description}
            </p>
          </div>

          {/* Comparison Options */}
          <div style={{
            backgroundColor: '#1E293B',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid #334155'
          }}>
            <h3 style={{ color: '#FFFFFF', margin: '0 0 16px 0', fontSize: '16px' }}>
              ⚖️ Comparison
            </h3>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '12px',
              color: '#FFFFFF',
              fontSize: '14px',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={showComparison}
                onChange={(e) => setShowComparison(e.target.checked)}
                style={{ width: '16px', height: '16px' }}
              />
              Enable comparison mode
            </label>

            {showComparison && (
              <select
                value={comparisonGame || ''}
                onChange={(e) => setComparisonGame(Number(e.target.value) || null)}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#0F172A',
                  color: '#FFFFFF',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              >
                <option value="">Select comparison game...</option>
                {games.filter(g => g.id !== selectedGame).map(game => (
                  <option key={game.id} value={game.id}>
                    Week {game.week} vs {game.opponent}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Chart Display */}
        {selectedGame && (
          <div style={{
            backgroundColor: '#1E293B',
            borderRadius: '12px',
            border: '1px solid #334155',
            overflow: 'hidden'
          }}>
            <FootballVizChart
              chartType={selectedChart}
              gameId={selectedGame}
              theme={selectedTheme}
              options={chartOptions}
              onError={(error) => {
                console.error('Chart error:', error);
                // Could show a toast notification here
              }}
            />
          </div>
        )}

        {/* Chart Gallery */}
        <div style={{ marginTop: '48px' }}>
          <h2 style={{
            color: '#FFFFFF',
            fontSize: '24px',
            fontWeight: '600',
            margin: '0 0 24px 0'
          }}>
            Available Chart Types
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px'
          }}>
            {availableCharts.map(chart => (
              <div
                key={chart.name}
                onClick={() => setSelectedChart(chart.name)}
                style={{
                  backgroundColor: selectedChart === chart.name ? '#3B82F6' : '#1E293B',
                  padding: '20px',
                  borderRadius: '12px',
                  border: '1px solid #334155',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{
                  fontSize: '32px',
                  marginBottom: '12px'
                }}>
                  {chart.icon}
                </div>
                <h3 style={{
                  color: '#FFFFFF',
                  margin: '0 0 8px 0',
                  fontSize: '16px',
                  fontWeight: '600'
                }}>
                  {chart.title}
                </h3>
                <p style={{
                  color: '#94A3B8',
                  margin: 0,
                  fontSize: '14px',
                  lineHeight: '1.5'
                }}>
                  {chart.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Custom Query Builder Modal */}
        {showCustomQueryBuilder && (
          <AdvancedQueryBuilder 
            onClose={() => setShowCustomQueryBuilder(false)}
          />
        )}
      </div>
    </div>
  );
};

export default FootballVizDashboard;