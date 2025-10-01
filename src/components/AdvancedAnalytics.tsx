import React, { useState, useEffect } from 'react';
import { consultantService, GameAnalytics } from '../services/consultant';
import { gameService } from '../services/game';
import { Game, PlayData } from '../types/game';
import ChartComponent from './ChartComponent';

interface AdvancedAnalyticsProps {
  teamId: number;
  onBack: () => void;
}

interface AnalyticsFilters {
  gameIds: number[];
  playTypes: string[];
  formations: string[];
  downs: number[];
  distanceRange: { min?: number; max?: number };
  yardLineRange: { min?: number; max?: number };
}

const AdvancedAnalytics: React.FC<AdvancedAnalyticsProps> = ({ teamId, onBack }) => {
  const [games, setGames] = useState<Game[]>([]);
  const [allPlays, setAllPlays] = useState<PlayData[]>([]);
  const [filteredPlays, setFilteredPlays] = useState<PlayData[]>([]);
  const [filters, setFilters] = useState<AnalyticsFilters>({
    gameIds: [],
    playTypes: [],
    formations: [],
    downs: [],
    distanceRange: {},
    yardLineRange: {}
  });
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    loadTeamData();
  }, [teamId]);

  useEffect(() => {
    applyFilters();
  }, [filters, allPlays]);

  const loadTeamData = async () => {
    try {
      setLoading(true);
      const response = await consultantService.getTeamGames(teamId);
      setGames(response.games);

      // Load all play data for the team
      const allPlaysData: PlayData[] = [];
      for (const game of response.games) {
        const playsResponse = await gameService.getGamePlays(game.id);
        allPlaysData.push(...playsResponse.plays);
      }
      setAllPlays(allPlaysData);
      
      // Initialize filters with all games selected
      setFilters(prev => ({ ...prev, gameIds: response.games.map(g => g.id) }));
    } catch (error) {
      console.error('Failed to load team data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = allPlays.filter(play => {
      // Game filter
      if (filters.gameIds.length > 0 && !filters.gameIds.includes(play.game_id)) {
        return false;
      }
      
      // Play type filter
      if (filters.playTypes.length > 0 && !filters.playTypes.includes(play.play_type)) {
        return false;
      }
      
      // Formation filter
      if (filters.formations.length > 0 && !filters.formations.includes(play.formation)) {
        return false;
      }
      
      // Down filter
      if (filters.downs.length > 0 && !filters.downs.includes(play.down)) {
        return false;
      }
      
      // Distance range filter
      if (filters.distanceRange.min !== undefined && play.distance < filters.distanceRange.min) {
        return false;
      }
      if (filters.distanceRange.max !== undefined && play.distance > filters.distanceRange.max) {
        return false;
      }
      
      // Yard line range filter
      if (filters.yardLineRange.min !== undefined && play.yard_line < filters.yardLineRange.min) {
        return false;
      }
      if (filters.yardLineRange.max !== undefined && play.yard_line > filters.yardLineRange.max) {
        return false;
      }
      
      return true;
    });

    setFilteredPlays(filtered);
    generateAnalytics(filtered);
  };

  const generateAnalytics = (plays: PlayData[]) => {
    const analytics = {
      summary: {
        totalPlays: plays.length,
        totalYards: plays.reduce((sum, p) => sum + (p.yards_gained || 0), 0),
        totalPoints: plays.reduce((sum, p) => sum + (p.points_scored || 0), 0),
        avgYardsPerPlay: plays.length > 0 ? plays.reduce((sum, p) => sum + (p.yards_gained || 0), 0) / plays.length : 0
      },
      byPlayType: {} as Record<string, { count: number; yards: number; points: number }>,
      byFormation: {} as Record<string, { count: number; yards: number; points: number }>,
      byDown: {} as Record<string, { count: number; yards: number; points: number }>,
      byDistance: {} as Record<string, { count: number; yards: number; points: number }>,
      efficiency: {}
    };

    // Group by play type
    plays.forEach(play => {
      if (!analytics.byPlayType[play.play_type]) {
        analytics.byPlayType[play.play_type] = { count: 0, yards: 0, points: 0 };
      }
      analytics.byPlayType[play.play_type].count++;
      analytics.byPlayType[play.play_type].yards += play.yards_gained || 0;
      analytics.byPlayType[play.play_type].points += play.points_scored || 0;
    });

    // Group by formation
    plays.forEach(play => {
      if (!analytics.byFormation[play.formation]) {
        analytics.byFormation[play.formation] = { count: 0, yards: 0, points: 0 };
      }
      analytics.byFormation[play.formation].count++;
      analytics.byFormation[play.formation].yards += play.yards_gained || 0;
      analytics.byFormation[play.formation].points += play.points_scored || 0;
    });

    // Group by down
    plays.forEach(play => {
      const down = `Down ${play.down}`;
      if (!analytics.byDown[down]) {
        analytics.byDown[down] = { count: 0, yards: 0, points: 0 };
      }
      analytics.byDown[down].count++;
      analytics.byDown[down].yards += play.yards_gained || 0;
      analytics.byDown[down].points += play.points_scored || 0;
    });

    // Distance ranges
    plays.forEach(play => {
      let range = '';
      if (play.distance <= 3) range = 'Short (1-3)';
      else if (play.distance <= 7) range = 'Medium (4-7)';
      else if (play.distance <= 10) range = 'Long (8-10)';
      else range = 'Very Long (11+)';

      if (!analytics.byDistance[range]) {
        analytics.byDistance[range] = { count: 0, yards: 0, points: 0 };
      }
      analytics.byDistance[range].count++;
      analytics.byDistance[range].yards += play.yards_gained || 0;
      analytics.byDistance[range].points += play.points_scored || 0;
    });

    setAnalytics(analytics);
  };

  const uniquePlayTypes = Array.from(new Set(allPlays.map(p => p.play_type)));
  const uniqueFormations = Array.from(new Set(allPlays.map(p => p.formation)));
  const uniqueDowns = Array.from(new Set(allPlays.map(p => p.down))).sort();

  const renderChart = (data: any, title: string, chartType: 'bar' | 'pie' = 'bar') => (
    <div style={{ marginBottom: '30px' }}>
      <ChartComponent
        chartData={data}
        chartType={chartType}
        title={title}
        dataType="custom"
      />
    </div>
  );

  if (loading) {
    return <div>Loading advanced analytics...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <button
        onClick={onBack}
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
        ← Back to Team Dashboard
      </button>

      <h2>Advanced Analytics & Filtering</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '30px' }}>
        {/* Filters Panel */}
        <div style={{ 
          border: '1px solid #ddd', 
          borderRadius: '8px', 
          padding: '20px',
          height: 'fit-content'
        }}>
          <h3>Filters</h3>

          {/* Game Selection */}
          <div style={{ marginBottom: '20px' }}>
            <h4>Games</h4>
            <div style={{ maxHeight: '120px', overflow: 'auto' }}>
              {games.map(game => (
                <label key={game.id} style={{ display: 'block', marginBottom: '5px' }}>
                  <input
                    type="checkbox"
                    checked={filters.gameIds.includes(game.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFilters(prev => ({ ...prev, gameIds: [...prev.gameIds, game.id] }));
                      } else {
                        setFilters(prev => ({ ...prev, gameIds: prev.gameIds.filter(id => id !== game.id) }));
                      }
                    }}
                    style={{ marginRight: '8px' }}
                  />
                  Week {game.week} vs {game.opponent}
                </label>
              ))}
            </div>
          </div>

          {/* Play Type Filter */}
          <div style={{ marginBottom: '20px' }}>
            <h4>Play Types</h4>
            {uniquePlayTypes.map(type => (
              <label key={type} style={{ display: 'block', marginBottom: '5px' }}>
                <input
                  type="checkbox"
                  checked={filters.playTypes.includes(type)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFilters(prev => ({ ...prev, playTypes: [...prev.playTypes, type] }));
                    } else {
                      setFilters(prev => ({ ...prev, playTypes: prev.playTypes.filter(t => t !== type) }));
                    }
                  }}
                  style={{ marginRight: '8px' }}
                />
                {type}
              </label>
            ))}
          </div>

          {/* Formation Filter */}
          <div style={{ marginBottom: '20px' }}>
            <h4>Formations</h4>
            {uniqueFormations.map(formation => (
              <label key={formation} style={{ display: 'block', marginBottom: '5px' }}>
                <input
                  type="checkbox"
                  checked={filters.formations.includes(formation)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFilters(prev => ({ ...prev, formations: [...prev.formations, formation] }));
                    } else {
                      setFilters(prev => ({ ...prev, formations: prev.formations.filter(f => f !== formation) }));
                    }
                  }}
                  style={{ marginRight: '8px' }}
                />
                {formation}
              </label>
            ))}
          </div>

          {/* Down Filter */}
          <div style={{ marginBottom: '20px' }}>
            <h4>Downs</h4>
            {uniqueDowns.map(down => (
              <label key={down} style={{ display: 'block', marginBottom: '5px' }}>
                <input
                  type="checkbox"
                  checked={filters.downs.includes(down)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFilters(prev => ({ ...prev, downs: [...prev.downs, down] }));
                    } else {
                      setFilters(prev => ({ ...prev, downs: prev.downs.filter(d => d !== down) }));
                    }
                  }}
                  style={{ marginRight: '8px' }}
                />
                Down {down}
              </label>
            ))}
          </div>

          {/* Distance Range */}
          <div style={{ marginBottom: '20px' }}>
            <h4>Distance Range</h4>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="number"
                placeholder="Min"
                value={filters.distanceRange.min || ''}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  distanceRange: { ...prev.distanceRange, min: e.target.value ? parseInt(e.target.value) : undefined }
                }))}
                style={{ width: '70px', padding: '4px' }}
              />
              <input
                type="number"
                placeholder="Max"
                value={filters.distanceRange.max || ''}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  distanceRange: { ...prev.distanceRange, max: e.target.value ? parseInt(e.target.value) : undefined }
                }))}
                style={{ width: '70px', padding: '4px' }}
              />
            </div>
          </div>

          <button
            onClick={() => setFilters({
              gameIds: games.map(g => g.id),
              playTypes: [],
              formations: [],
              downs: [],
              distanceRange: {},
              yardLineRange: {}
            })}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: '#ffc107',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Reset Filters
          </button>
        </div>

        {/* Analytics Panel */}
        <div>
          {analytics && (
            <>
              {/* Summary Cards */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(4, 1fr)', 
                gap: '20px',
                marginBottom: '30px'
              }}>
                <div style={{ padding: '20px', backgroundColor: '#e3f2fd', borderRadius: '8px', textAlign: 'center' }}>
                  <h4>Filtered Plays</h4>
                  <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{analytics.summary.totalPlays}</div>
                </div>
                <div style={{ padding: '20px', backgroundColor: '#e8f5e8', borderRadius: '8px', textAlign: 'center' }}>
                  <h4>Total Yards</h4>
                  <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{analytics.summary.totalYards}</div>
                </div>
                <div style={{ padding: '20px', backgroundColor: '#fff3e0', borderRadius: '8px', textAlign: 'center' }}>
                  <h4>Total Points</h4>
                  <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{analytics.summary.totalPoints}</div>
                </div>
                <div style={{ padding: '20px', backgroundColor: '#fce4ec', borderRadius: '8px', textAlign: 'center' }}>
                  <h4>Avg Yards/Play</h4>
                  <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{analytics.summary.avgYardsPerPlay.toFixed(2)}</div>
                </div>
              </div>

              {/* Charts */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                {renderChart(analytics.byPlayType, 'Performance by Play Type')}
                {renderChart(analytics.byFormation, 'Performance by Formation')}
                {renderChart(analytics.byDown, 'Performance by Down')}
                {renderChart(analytics.byDistance, 'Performance by Distance Range')}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalytics;