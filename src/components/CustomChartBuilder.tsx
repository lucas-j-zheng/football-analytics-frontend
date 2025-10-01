import React, { useState, useEffect } from 'react';
import { gameService } from '../services/game';
import { visualizationService } from '../services/visualization';
import { useAuth } from '../context/AuthContext';
import { Game } from '../types/game';
import ChartComponent from './ChartComponent';

interface CustomChartBuilderProps {
  onClose: () => void;
}

interface ChartConfig {
  selectedGames: number[];
  dataType: 'play_type' | 'formation' | 'down';
  chartType: 'bar' | 'pie';
  filters: {
    playType?: string;
    formation?: string;
    down?: number;
    distanceMin?: number;
    distanceMax?: number;
  };
  title: string;
}

const CustomChartBuilder: React.FC<CustomChartBuilderProps> = ({ onClose }) => {
  const { team } = useAuth();
  const [games, setGames] = useState<Game[]>([]);
  const [config, setConfig] = useState<ChartConfig>({
    selectedGames: [],
    dataType: 'play_type',
    chartType: 'bar',
    filters: {},
    title: 'My Custom Chart'
  });
  const [previewData, setPreviewData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadGames();
  }, []);

  const loadGames = async () => {
    try {
      const response = await gameService.getGames();
      setGames(response.games);
      if (response.games.length > 0) {
        setConfig(prev => ({ ...prev, selectedGames: [response.games[0].id] }));
      }
    } catch (error: any) {
      setError('Failed to load games');
    }
  };

  const generatePreview = async () => {
    if (config.selectedGames.length === 0) {
      setError('Please select at least one game');
      return;
    }

    setLoading(true);
    try {
      // For simplicity, we'll use the first selected game for preview
      // In a real implementation, we'd aggregate data from multiple games
      const gameId = config.selectedGames[0];
      
      // Fetch play data for the selected game
      const playResponse = await gameService.getGamePlays(gameId);
      const plays = playResponse.plays;
      
      // Apply filters
      let filteredPlays = plays.filter(play => {
        if (config.filters.playType && play.play_type !== config.filters.playType) return false;
        if (config.filters.formation && play.formation !== config.filters.formation) return false;
        if (config.filters.down && play.down !== config.filters.down) return false;
        if (config.filters.distanceMin && play.distance < config.filters.distanceMin) return false;
        if (config.filters.distanceMax && play.distance > config.filters.distanceMax) return false;
        return true;
      });

      // Group data based on dataType
      const chartData: any = {};
      filteredPlays.forEach(play => {
        let key = '';
        if (config.dataType === 'play_type') key = play.play_type;
        else if (config.dataType === 'formation') key = play.formation;
        else if (config.dataType === 'down') key = `Down ${play.down}`;

        if (!chartData[key]) {
          chartData[key] = { count: 0, yards: 0 };
        }
        chartData[key].count += 1;
        chartData[key].yards += play.yards_gained || 0;
      });

      setPreviewData(chartData);
    } catch (error: any) {
      setError('Failed to generate preview');
    } finally {
      setLoading(false);
    }
  };

  const saveChart = async () => {
    if (!team || !previewData) {
      setError('Cannot save chart - missing data');
      return;
    }

    setSaving(true);
    try {
      const chartConfig = {
        data_type: config.dataType,
        chart_type: config.chartType,
        chart_data: previewData,
        filters: config.filters,
        selected_games: config.selectedGames
      };

      await visualizationService.createVisualization({
        team_id: parseInt(team.id),
        chart_type: config.chartType,
        title: config.title,
        configuration: chartConfig,
        description: `Custom ${config.dataType.replace('_', ' ')} analysis`
      });

      onClose();
    } catch (error: any) {
      setError('Failed to save chart');
    } finally {
      setSaving(false);
    }
  };

  const uniquePlayTypes = Array.from(new Set(games.flatMap(g => ['Run', 'Pass']))); // Simplified
  const uniqueFormations = Array.from(new Set(games.flatMap(g => ['I Formation', 'Shotgun', 'Gun Trips']))); // Simplified

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      backgroundColor: 'rgba(0,0,0,0.5)', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{ 
        backgroundColor: 'white', 
        padding: '30px', 
        borderRadius: '8px', 
        width: '900px',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <h2>Custom Chart Builder</h2>
        
        {error && (
          <div style={{ 
            color: 'red', 
            marginBottom: '15px', 
            padding: '10px', 
            backgroundColor: '#fee', 
            borderRadius: '4px' 
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
          {/* Configuration Panel */}
          <div>
            <h3>Chart Configuration</h3>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Chart Title:</label>
              <input
                type="text"
                value={config.title}
                onChange={(e) => setConfig(prev => ({ ...prev, title: e.target.value }))}
                style={{ width: '100%', padding: '8px' }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Select Games:</label>
              <div style={{ maxHeight: '120px', overflow: 'auto', border: '1px solid #ddd', padding: '10px' }}>
                {games.map(game => (
                  <label key={game.id} style={{ display: 'block', marginBottom: '5px' }}>
                    <input
                      type="checkbox"
                      checked={config.selectedGames.includes(game.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setConfig(prev => ({ ...prev, selectedGames: [...prev.selectedGames, game.id] }));
                        } else {
                          setConfig(prev => ({ ...prev, selectedGames: prev.selectedGames.filter(id => id !== game.id) }));
                        }
                      }}
                      style={{ marginRight: '8px' }}
                    />
                    Week {game.week} vs {game.opponent}
                  </label>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Data Type:</label>
              <select
                value={config.dataType}
                onChange={(e) => setConfig(prev => ({ ...prev, dataType: e.target.value as any }))}
                style={{ width: '100%', padding: '8px' }}
              >
                <option value="play_type">Play Type</option>
                <option value="formation">Formation</option>
                <option value="down">Down</option>
              </select>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Chart Type:</label>
              <select
                value={config.chartType}
                onChange={(e) => setConfig(prev => ({ ...prev, chartType: e.target.value as any }))}
                style={{ width: '100%', padding: '8px' }}
              >
                <option value="bar">Bar Chart</option>
                <option value="pie">Pie Chart</option>
              </select>
            </div>

            <h4>Filters</h4>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Play Type:</label>
              <select
                value={config.filters.playType || ''}
                onChange={(e) => setConfig(prev => ({ 
                  ...prev, 
                  filters: { ...prev.filters, playType: e.target.value || undefined }
                }))}
                style={{ width: '100%', padding: '8px' }}
              >
                <option value="">All Play Types</option>
                {uniquePlayTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Formation:</label>
              <select
                value={config.filters.formation || ''}
                onChange={(e) => setConfig(prev => ({ 
                  ...prev, 
                  filters: { ...prev.filters, formation: e.target.value || undefined }
                }))}
                style={{ width: '100%', padding: '8px' }}
              >
                <option value="">All Formations</option>
                {uniqueFormations.map(formation => (
                  <option key={formation} value={formation}>{formation}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Min Distance:</label>
                <input
                  type="number"
                  value={config.filters.distanceMin || ''}
                  onChange={(e) => setConfig(prev => ({ 
                    ...prev, 
                    filters: { ...prev.filters, distanceMin: e.target.value ? parseInt(e.target.value) : undefined }
                  }))}
                  style={{ width: '100%', padding: '8px' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Max Distance:</label>
                <input
                  type="number"
                  value={config.filters.distanceMax || ''}
                  onChange={(e) => setConfig(prev => ({ 
                    ...prev, 
                    filters: { ...prev.filters, distanceMax: e.target.value ? parseInt(e.target.value) : undefined }
                  }))}
                  style={{ width: '100%', padding: '8px' }}
                />
              </div>
            </div>

            <button
              onClick={generatePreview}
              disabled={loading}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginBottom: '10px'
              }}
            >
              {loading ? 'Generating...' : 'Generate Preview'}
            </button>
          </div>

          {/* Preview Panel */}
          <div>
            <h3>Chart Preview</h3>
            {previewData ? (
              <ChartComponent
                chartData={previewData}
                chartType={config.chartType}
                title={config.title}
                dataType={config.dataType}
              />
            ) : (
              <div style={{ 
                border: '2px dashed #ccc', 
                padding: '40px', 
                textAlign: 'center',
                borderRadius: '8px',
                height: '300px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <p>Click "Generate Preview" to see your chart</p>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              padding: '10px 20px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={saveChart}
            disabled={!previewData || saving}
            style={{
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: !previewData || saving ? 'not-allowed' : 'pointer'
            }}
          >
            {saving ? 'Saving...' : 'Save Chart'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomChartBuilder;