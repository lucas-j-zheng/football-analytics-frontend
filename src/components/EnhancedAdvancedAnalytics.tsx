import React, { useState, useEffect, useMemo } from 'react';
import { consultantService, GameAnalytics, FilterCondition } from '../services/consultant';
import { gameService } from '../services/game';
import { Game, PlayData } from '../types/game';
import ChartComponent from './ChartComponent';

interface LocalFilterCondition extends FilterCondition {
  id: string;
  label: string;
}

interface AdvancedAnalyticsProps {
  teamId: number;
  teamName: string;
}

interface AnalyticsFilters {
  gameIds: number[];
  playTypes: string[];
  formations: string[];
  downs: number[];
  distanceRange: { min?: number; max?: number };
  yardLineRange: { min?: number; max?: number };
  dateRange: { start?: string; end?: string };
}

interface Widget {
  id: string;
  title: string;
  type: 'chart' | 'metric' | 'table' | 'insight';
  size: 'small' | 'medium' | 'large';
  position: { x: number; y: number };
  data?: any;
  config?: any;
  visible: boolean;
}

interface DashboardLayout {
  id: string;
  name: string;
  widgets: Widget[];
  created_at: string;
}

const EnhancedAdvancedAnalytics: React.FC<AdvancedAnalyticsProps> = ({ teamId, teamName }) => {
  const [games, setGames] = useState<Game[]>([]);
  const [allPlays, setAllPlays] = useState<PlayData[]>([]);
  const [filteredPlays, setFilteredPlays] = useState<PlayData[]>([]);
  const [filters, setFilters] = useState<AnalyticsFilters>({
    gameIds: [],
    playTypes: [],
    formations: [],
    downs: [],
    distanceRange: {},
    yardLineRange: {},
    dateRange: {}
  });
  
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);
  const [activeView, setActiveView] = useState<'dashboard' | 'insights' | 'comparisons' | 'trends'>('dashboard');
  
  // Dashboard state
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [dashboardLayouts, setDashboardLayouts] = useState<DashboardLayout[]>([]);
  const [currentLayout, setCurrentLayout] = useState<string>('default');
  const [showWidgetSelector, setShowWidgetSelector] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Available widget templates
  const availableWidgets = [
    {
      id: 'offensive_efficiency',
      title: 'Offensive Efficiency',
      type: 'metric' as const,
      size: 'small' as const,
      description: 'Key offensive performance metrics'
    },
    {
      id: 'yards_per_play_trend',
      title: 'Yards Per Play Trend',
      type: 'chart' as const,
      size: 'medium' as const,
      description: 'Trending performance over time'
    },
    {
      id: 'formation_breakdown',
      title: 'Formation Analysis',
      type: 'chart' as const,
      size: 'medium' as const,
      description: 'Performance by formation type'
    },
    {
      id: 'down_distance_heatmap',
      title: 'Down & Distance Heatmap',
      type: 'chart' as const,
      size: 'large' as const,
      description: 'Success rate by situation'
    },
    {
      id: 'red_zone_efficiency',
      title: 'Red Zone Performance',
      type: 'metric' as const,
      size: 'small' as const,
      description: 'Red zone scoring efficiency'
    },
    {
      id: 'third_down_conversions',
      title: 'Third Down Success',
      type: 'metric' as const,
      size: 'small' as const,
      description: 'Third down conversion rate'
    },
    {
      id: 'play_type_distribution',
      title: 'Play Type Distribution',
      type: 'chart' as const,
      size: 'medium' as const,
      description: 'Run vs pass breakdown'
    },
    {
      id: 'field_position_impact',
      title: 'Field Position Impact',
      type: 'chart' as const,
      size: 'large' as const,
      description: 'Performance by field zone'
    },
    {
      id: 'top_plays',
      title: 'Top Performing Plays',
      type: 'table' as const,
      size: 'medium' as const,
      description: 'Highest yardage plays'
    },
    {
      id: 'key_insights',
      title: 'AI Insights',
      type: 'insight' as const,
      size: 'large' as const,
      description: 'Automated performance insights'
    }
  ];

  useEffect(() => {
    loadTeamData();
    initializeDefaultDashboard();
  }, [teamId]);

  useEffect(() => {
    applyFilters();
  }, [filters, allPlays]);

  useEffect(() => {
    if (filteredPlays.length > 0) {
      generateAnalytics();
    }
  }, [filteredPlays]);

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

  const initializeDefaultDashboard = () => {
    const defaultWidgets: Widget[] = [
      {
        id: 'offensive_efficiency',
        title: 'Offensive Efficiency',
        type: 'metric',
        size: 'small',
        position: { x: 0, y: 0 },
        visible: true
      },
      {
        id: 'red_zone_efficiency',
        title: 'Red Zone Performance',
        type: 'metric',
        size: 'small',
        position: { x: 1, y: 0 },
        visible: true
      },
      {
        id: 'third_down_conversions',
        title: 'Third Down Success',
        type: 'metric',
        size: 'small',
        position: { x: 2, y: 0 },
        visible: true
      },
      {
        id: 'yards_per_play_trend',
        title: 'Yards Per Play Trend',
        type: 'chart',
        size: 'medium',
        position: { x: 0, y: 1 },
        visible: true
      },
      {
        id: 'formation_breakdown',
        title: 'Formation Analysis',
        type: 'chart',
        size: 'medium',
        position: { x: 1, y: 1 },
        visible: true
      },
      {
        id: 'down_distance_heatmap',
        title: 'Down & Distance Heatmap',
        type: 'chart',
        size: 'large',
        position: { x: 0, y: 2 },
        visible: true
      }
    ];
    setWidgets(defaultWidgets);
  };

  const applyFilters = () => {
    let filtered = [...allPlays];

    if (filters.gameIds.length > 0) {
      filtered = filtered.filter(play => filters.gameIds.includes(play.game_id));
    }

    if (filters.playTypes.length > 0) {
      filtered = filtered.filter(play => filters.playTypes.includes(play.play_type));
    }

    if (filters.formations.length > 0) {
      filtered = filtered.filter(play => filters.formations.includes(play.formation));
    }

    if (filters.downs.length > 0) {
      filtered = filtered.filter(play => play.down && filters.downs.includes(play.down));
    }

    if (filters.distanceRange.min !== undefined) {
      filtered = filtered.filter(play => play.distance && play.distance >= filters.distanceRange.min!);
    }

    if (filters.distanceRange.max !== undefined) {
      filtered = filtered.filter(play => play.distance && play.distance <= filters.distanceRange.max!);
    }

    if (filters.yardLineRange.min !== undefined) {
      filtered = filtered.filter(play => play.yard_line >= filters.yardLineRange.min!);
    }

    if (filters.yardLineRange.max !== undefined) {
      filtered = filtered.filter(play => play.yard_line <= filters.yardLineRange.max!);
    }

    setFilteredPlays(filtered);
  };

  const generateAnalytics = () => {
    const totalPlays = filteredPlays.length;
    if (totalPlays === 0) return;

    const totalYards = filteredPlays.reduce((sum, play) => sum + (play.yards_gained || 0), 0);
    const avgYardsPerPlay = totalYards / totalPlays;

    const rushingPlays = filteredPlays.filter(play => play.play_type === 'Run');
    const passingPlays = filteredPlays.filter(play => play.play_type === 'Pass');

    const redZonePlays = filteredPlays.filter(play => play.yard_line >= 80);
    const redZoneSuccess = redZonePlays.filter(play => (play.yards_gained || 0) > 0 || (play.points_scored || 0) > 0);

    const thirdDownPlays = filteredPlays.filter(play => play.down === 3);
    const thirdDownSuccess = thirdDownPlays.filter(play => play.distance && (play.yards_gained || 0) >= play.distance);

    const byFormation = filteredPlays.reduce((acc, play) => {
      acc[play.formation] = acc[play.formation] || { count: 0, yards: 0 };
      acc[play.formation].count++;
      acc[play.formation].yards += play.yards_gained || 0;
      return acc;
    }, {} as Record<string, { count: number; yards: number }>);

    setAnalytics({
      totalPlays,
      totalYards,
      avgYardsPerPlay,
      rushingYards: rushingPlays.reduce((sum, play) => sum + (play.yards_gained || 0), 0),
      passingYards: passingPlays.reduce((sum, play) => sum + (play.yards_gained || 0), 0),
      rushingPlaysCount: rushingPlays.length,
      passingPlaysCount: passingPlays.length,
      redZoneEfficiency: redZonePlays.length > 0 ? (redZoneSuccess.length / redZonePlays.length) * 100 : 0,
      thirdDownConversion: thirdDownPlays.length > 0 ? (thirdDownSuccess.length / thirdDownPlays.length) * 100 : 0,
      formationBreakdown: byFormation,
      successfulPlays: filteredPlays.filter(play => (play.yards_gained || 0) > 0).length,
      explosivePlays: filteredPlays.filter(play => (play.yards_gained || 0) >= 15).length,
      negativePlays: filteredPlays.filter(play => (play.yards_gained || 0) < 0).length
    });
  };

  const addWidget = (widgetTemplate: any) => {
    const newWidget: Widget = {
      id: `${widgetTemplate.id}_${Date.now()}`,
      title: widgetTemplate.title,
      type: widgetTemplate.type,
      size: widgetTemplate.size,
      position: { x: 0, y: widgets.length },
      visible: true
    };
    setWidgets([...widgets, newWidget]);
    setShowWidgetSelector(false);
  };

  const removeWidget = (widgetId: string) => {
    setWidgets(widgets.filter(w => w.id !== widgetId));
  };

  const toggleWidgetVisibility = (widgetId: string) => {
    setWidgets(widgets.map(w => 
      w.id === widgetId ? { ...w, visible: !w.visible } : w
    ));
  };

  const renderWidget = (widget: Widget) => {
    if (!widget.visible || !analytics) return null;

    const baseClasses = "card transition-all duration-200 hover:shadow-lg";
    const sizeClasses = {
      small: "col-span-1 row-span-1",
      medium: "col-span-2 row-span-1", 
      large: "col-span-3 row-span-2"
    };

    const content = renderWidgetContent(widget);

    return (
      <div key={widget.id} className={`${baseClasses} ${sizeClasses[widget.size]} relative group`}>
        {/* Widget Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-800">{widget.title}</h3>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <button
              onClick={() => toggleWidgetVisibility(widget.id)}
              className="p-1 text-gray-400 hover:text-gray-600"
              title="Hide widget"
            >
              👁️
            </button>
            <button
              onClick={() => removeWidget(widget.id)}
              className="p-1 text-gray-400 hover:text-red-600"
              title="Remove widget"
            >
              ✕
            </button>
          </div>
        </div>
        
        {/* Widget Content */}
        <div className="h-full">
          {content}
        </div>
      </div>
    );
  };

  const renderWidgetContent = (widget: Widget) => {
    if (!analytics) return <div className="text-gray-500">Loading...</div>;

    switch (widget.id.split('_')[0]) {
      case 'offensive':
        return (
          <div className="grid grid-cols-2 gap-4 h-full">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{analytics.avgYardsPerPlay.toFixed(1)}</p>
              <p className="text-sm text-gray-600">Avg Yards/Play</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-success">{analytics.totalYards}</p>
              <p className="text-sm text-gray-600">Total Yards</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-accent">{analytics.explosivePlays}</p>
              <p className="text-sm text-gray-600">Explosive Plays</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-warning">{((analytics.successfulPlays / analytics.totalPlays) * 100).toFixed(1)}%</p>
              <p className="text-sm text-gray-600">Success Rate</p>
            </div>
          </div>
        );

      case 'red':
        return (
          <div className="text-center h-full flex flex-col justify-center">
            <p className="text-4xl font-bold text-error mb-2">{analytics.redZoneEfficiency.toFixed(1)}%</p>
            <p className="text-sm text-gray-600">Red Zone Efficiency</p>
            <p className="text-xs text-gray-500 mt-2">
              Scoring on {filteredPlays.filter(p => p.yard_line >= 80).length} red zone attempts
            </p>
          </div>
        );

      case 'third':
        return (
          <div className="text-center h-full flex flex-col justify-center">
            <p className="text-4xl font-bold text-warning mb-2">{analytics.thirdDownConversion.toFixed(1)}%</p>
            <p className="text-sm text-gray-600">Third Down Success</p>
            <p className="text-xs text-gray-500 mt-2">
              {filteredPlays.filter(p => p.down === 3).length} third down attempts
            </p>
          </div>
        );

      case 'formation':
        const formationData = Object.entries(analytics.formationBreakdown)
          .sort(([,a], [,b]) => (b as any).count - (a as any).count)
          .slice(0, 5);
        
        return (
          <div className="space-y-3">
            {formationData.map(([formation, data]) => {
              const formationStats = data as { yards: number; count: number };
              return (
                <div key={formation} className="flex justify-between items-center">
                  <span className="text-sm font-medium">{formation}</span>
                  <div className="text-right">
                    <span className="text-sm font-bold">{(formationStats.yards / formationStats.count).toFixed(1)} yds</span>
                    <span className="text-xs text-gray-500 block">{formationStats.count} plays</span>
                  </div>
                </div>
              );
            })}
          </div>
        );

      case 'play':
        const rushPct = ((analytics.rushingPlaysCount / analytics.totalPlays) * 100).toFixed(1);
        const passPct = ((analytics.passingPlaysCount / analytics.totalPlays) * 100).toFixed(1);
        
        return (
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm">Rush</span>
              <span className="font-medium">{rushPct}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full" 
                style={{ width: `${rushPct}%` }}
              ></div>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Pass</span>
              <span className="font-medium">{passPct}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-secondary h-2 rounded-full" 
                style={{ width: `${passPct}%` }}
              ></div>
            </div>
          </div>
        );

      case 'top':
        const topPlays = filteredPlays
          .sort((a, b) => (b.yards_gained || 0) - (a.yards_gained || 0))
          .slice(0, 5);
        
        return (
          <div className="space-y-2">
            {topPlays.map((play, index) => (
              <div key={play.play_id} className="flex justify-between items-center text-sm">
                <span>{play.play_name || play.play_type}</span>
                <span className="font-bold text-primary">{play.yards_gained} yds</span>
              </div>
            ))}
          </div>
        );

      case 'key':
        const insights = [
          `Most effective formation: ${Object.entries(analytics.formationBreakdown)
            .sort(([,a], [,b]) => ((b as any).yards/(b as any).count) - ((a as any).yards/(a as any).count))[0]?.[0] || 'N/A'}`,
          `${analytics.explosivePlays} explosive plays (15+ yards)`,
          `${analytics.negativePlays} negative plays`,
          `Best down for success: ${[1,2,3,4].map(down => ({
            down,
            rate: filteredPlays.filter(p => p.down === down && (p.yards_gained || 0) > 0).length /
                  filteredPlays.filter(p => p.down === down).length
          })).sort((a,b) => (b.rate || 0) - (a.rate || 0))[0]?.down || 'N/A'}`
        ];
        
        return (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-800 mb-3">Key Performance Insights</h4>
            {insights.map((insight, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span className="text-sm text-gray-700">{insight}</span>
              </div>
            ))}
          </div>
        );

      default:
        return <div className="text-gray-500">Chart visualization would go here</div>;
    }
  };

  const FilterPanel = () => (
    <div className="bg-gray-50 p-4 rounded-lg space-y-4">
      <h3 className="font-medium text-gray-800">Analytics Filters</h3>
      
      {/* Game Selection */}
      <div>
        <label className="form-label">Games</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-32 overflow-y-auto">
          {games.map(game => (
            <label key={game.id} className="flex items-center gap-2 text-sm">
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
                className="rounded"
              />
              <span>Week {game.week} vs {game.opponent}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Quick Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="form-label">Downs</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map(down => (
              <label key={down} className="flex items-center gap-1">
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
                  className="rounded"
                />
                <span className="text-sm">{down}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="form-label">Distance Range</label>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Min"
              value={filters.distanceRange.min || ''}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                distanceRange: { ...prev.distanceRange, min: e.target.value ? Number(e.target.value) : undefined }
              }))}
              className="form-input text-sm"
            />
            <input
              type="number"
              placeholder="Max"
              value={filters.distanceRange.max || ''}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                distanceRange: { ...prev.distanceRange, max: e.target.value ? Number(e.target.value) : undefined }
              }))}
              className="form-input text-sm"
            />
          </div>
        </div>

        <div>
          <label className="form-label">Yard Line Range</label>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Min"
              value={filters.yardLineRange.min || ''}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                yardLineRange: { ...prev.yardLineRange, min: e.target.value ? Number(e.target.value) : undefined }
              }))}
              className="form-input text-sm"
            />
            <input
              type="number"
              placeholder="Max"
              value={filters.yardLineRange.max || ''}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                yardLineRange: { ...prev.yardLineRange, max: e.target.value ? Number(e.target.value) : undefined }
              }))}
              className="form-input text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="spinner spinner-lg"></div>
        <span className="ml-3 text-gray-600">Loading advanced analytics...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Advanced Analytics Dashboard</h2>
          <p className="text-gray-600">
            Comprehensive performance analysis for {teamName} • {filteredPlays.length} plays analyzed
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn ${Object.values(filters).some(f => Array.isArray(f) ? f.length > 0 : f !== undefined) ? 'btn-primary' : 'btn-secondary'}`}
          >
            🔍 Filters
          </button>
          <button
            onClick={() => setShowWidgetSelector(!showWidgetSelector)}
            className="btn btn-secondary"
          >
            ➕ Add Widget
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && <FilterPanel />}

      {/* Widget Selector */}
      {showWidgetSelector && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-800 mb-4">Add Widget to Dashboard</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableWidgets.map(widget => (
              <div
                key={widget.id}
                onClick={() => addWidget(widget)}
                className="card card-interactive"
              >
                <h4 className="font-medium text-gray-800 mb-2">{widget.title}</h4>
                <p className="text-sm text-gray-600 mb-3">{widget.description}</p>
                <div className="flex justify-between items-center">
                  <span className={`badge badge-${widget.type === 'metric' ? 'primary' : widget.type === 'chart' ? 'success' : 'secondary'}`}>
                    {widget.type}
                  </span>
                  <span className="text-primary text-sm font-medium">Add Widget →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dashboard Grid */}
      <div className="grid grid-cols-3 gap-6 auto-rows-fr">
        {widgets.map(widget => renderWidget(widget))}
      </div>

      {widgets.filter(w => w.visible).length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="font-medium text-gray-800 mb-2">No Widgets Added</h3>
          <p className="text-gray-600 mb-4">Add widgets to create your custom analytics dashboard.</p>
          <button
            onClick={() => setShowWidgetSelector(true)}
            className="btn btn-primary"
          >
            Add Your First Widget
          </button>
        </div>
      )}
    </div>
  );
};

export default EnhancedAdvancedAnalytics;