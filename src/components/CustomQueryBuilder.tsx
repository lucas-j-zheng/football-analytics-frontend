import React, { useState, useEffect } from 'react';
import api from '../services/api';
import FilterCondition from './FilterCondition';
import LogicGroup from './LogicGroup';
import AdvancedChartBuilder from './AdvancedChartBuilder';

interface FilterField {
  field_name: string;
  display_name: string;
  data_type: string;
  ui_type: string;
  description: string;
  required: boolean;
  min_value?: number;
  max_value?: number;
  options?: Array<{value: any, label: string}>;
  default_value?: any;
  group?: string;
  searchable: boolean;
  sortable: boolean;
}

interface FilterSchema {
  fields: Record<string, FilterField>;
  groups: Record<string, string[]>;
  searchable_fields: string[];
  sortable_fields: string[];
}

interface FilterPresets {
  presets: Record<string, {
    name: string;
    description: string;
    filters: Array<{
      field: string;
      operator: string;
      value: any;
    }>;
    icon: string;
    color: string;
  }>;
}

interface QueryCondition {
  field: string;
  operator: string;
  value: any;
}

interface QueryGroup {
  operator: 'and' | 'or' | 'not';
  conditions: Array<QueryCondition | QueryGroup>;
}

interface QueryStats {
  total_plays: number;
  avg_yards_gained: number;
  success_rate: number;
  formations_count: number;
  play_types_count: number;
}

const CustomQueryBuilder: React.FC = () => {
  const [schema, setSchema] = useState<FilterSchema | null>(null);
  const [presets, setPresets] = useState<FilterPresets | null>(null);
  const [currentQuery, setCurrentQuery] = useState<QueryGroup>({
    operator: 'and',
    conditions: []
  });
  const [queryStats, setQueryStats] = useState<QueryStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedGame, setSelectedGame] = useState<number | null>(null);
  const [games, setGames] = useState<Array<{id: number, week: number, opponent: string, location: string}>>([]);
  const [showChartBuilder, setShowChartBuilder] = useState(false);
  const [queryResults, setQueryResults] = useState<any[]>([]);

  useEffect(() => {
    loadSchema();
    loadPresets();
    loadGames();
  }, []);

  useEffect(() => {
    if (currentQuery.conditions.length > 0) {
      updateQueryStats();
    } else {
      setQueryStats(null);
    }
  }, [currentQuery, selectedGame]);

  const loadSchema = async () => {
    try {
      const response = await api.get('/footballviz/filters/schema');
      setSchema(response.data);
    } catch (error) {
      console.error('Failed to load filter schema:', error);
    }
  };

  const loadPresets = async () => {
    try {
      const response = await api.get('/footballviz/filters/presets');
      setPresets(response.data);
    } catch (error) {
      console.error('Failed to load filter presets:', error);
    }
  };

  const loadGames = async () => {
    try {
      const response = await api.get('/games');
      setGames(response.data.games);
      if (response.data.games.length > 0) {
        setSelectedGame(response.data.games[0].id);
      }
    } catch (error) {
      console.error('Failed to load games:', error);
    }
  };

  const updateQueryStats = async () => {
    if (currentQuery.conditions.length === 0) return;
    
    try {
      setLoading(true);
      const response = await api.post('/footballviz/query/stats', {
        filter_group: currentQuery,
        game_id: selectedGame
      });
      setQueryStats(response.data.stats);
    } catch (error) {
      console.error('Failed to get query stats:', error);
      setQueryStats(null);
    } finally {
      setLoading(false);
    }
  };

  const executeQuery = async () => {
    if (currentQuery.conditions.length === 0) return;
    
    try {
      setLoading(true);
      const response = await api.post('/footballviz/query/execute', {
        filter_group: currentQuery,
        game_id: selectedGame,
        limit: 50
      });
      setQueryResults(response.data.results);
      setShowChartBuilder(true);
    } catch (error) {
      console.error('Failed to execute query:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyPreset = (presetKey: string) => {
    const preset = presets?.presets[presetKey];
    if (!preset) return;

    const newQuery: QueryGroup = {
      operator: 'and',
      conditions: preset.filters.map(filter => ({
        field: filter.field,
        operator: filter.operator,
        value: filter.value
      }))
    };

    setCurrentQuery(newQuery);
  };

  const addCondition = () => {
    const newCondition: QueryCondition = {
      field: 'play_type',
      operator: 'equals',
      value: 'Pass'
    };

    setCurrentQuery(prev => ({
      ...prev,
      conditions: [...prev.conditions, newCondition]
    }));
  };

  const updateCondition = (index: number, condition: QueryCondition) => {
    setCurrentQuery(prev => ({
      ...prev,
      conditions: prev.conditions.map((c, i) => 
        i === index ? condition : c
      )
    }));
  };

  const removeCondition = (index: number) => {
    setCurrentQuery(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index)
    }));
  };

  const clearQuery = () => {
    setCurrentQuery({
      operator: 'and',
      conditions: []
    });
    setQueryStats(null);
    setQueryResults([]);
    setShowChartBuilder(false);
  };

  if (!schema || !presets) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px',
        backgroundColor: '#0F172A',
        color: '#FFFFFF'
      }}>
        Loading query builder...
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: '#0F172A',
      minHeight: '100vh',
      padding: '24px'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{
            color: '#FFFFFF',
            fontSize: '32px',
            fontWeight: '700',
            margin: '0 0 8px 0'
          }}>
            🔍 Custom Query Builder
          </h1>
          <p style={{
            color: '#94A3B8',
            fontSize: '16px',
            margin: 0
          }}>
            Create complex filters to analyze specific game situations and generate custom visualizations
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '24px' }}>
          {/* Main Query Builder */}
          <div>
            {/* Game Selection */}
            <div style={{
              backgroundColor: '#1E293B',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid #334155',
              marginBottom: '24px'
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

            {/* Quick Presets */}
            <div style={{
              backgroundColor: '#1E293B',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid #334155',
              marginBottom: '24px'
            }}>
              <h3 style={{ color: '#FFFFFF', margin: '0 0 16px 0', fontSize: '16px' }}>
                ⚡ Quick Presets
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px'
              }}>
                {Object.entries(presets.presets).slice(0, 6).map(([key, preset]) => (
                  <button
                    key={key}
                    onClick={() => applyPreset(key)}
                    style={{
                      padding: '12px 16px',
                      backgroundColor: '#374151',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = preset.color}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#374151'}
                  >
                    <span>{preset.icon}</span>
                    <span>{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Conditions */}
            <div style={{
              backgroundColor: '#1E293B',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid #334155',
              marginBottom: '24px'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '16px'
              }}>
                <h3 style={{ color: '#FFFFFF', margin: 0, fontSize: '16px' }}>
                  🔧 Filter Conditions
                </h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={addCondition}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#3B82F6',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    + Add Condition
                  </button>
                  <button
                    onClick={clearQuery}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#EF4444',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {currentQuery.conditions.length === 0 ? (
                <div style={{
                  padding: '40px',
                  textAlign: 'center',
                  color: '#94A3B8',
                  border: '2px dashed #475569',
                  borderRadius: '8px'
                }}>
                  <p style={{ margin: '0 0 16px 0', fontSize: '16px' }}>
                    No filter conditions added yet
                  </p>
                  <p style={{ margin: 0, fontSize: '14px' }}>
                    Use quick presets above or click "Add Condition" to start building your query
                  </p>
                </div>
              ) : (
                <div>
                  <LogicGroup
                    group={currentQuery}
                    schema={schema}
                    onUpdate={setCurrentQuery}
                    onRemoveCondition={removeCondition}
                    onUpdateCondition={updateCondition}
                  />
                </div>
              )}
            </div>

            {/* Execute Query */}
            {currentQuery.conditions.length > 0 && (
              <div style={{
                backgroundColor: '#1E293B',
                padding: '20px',
                borderRadius: '12px',
                border: '1px solid #334155',
                textAlign: 'center'
              }}>
                <button
                  onClick={executeQuery}
                  disabled={loading || !selectedGame}
                  style={{
                    padding: '16px 32px',
                    backgroundColor: loading ? '#6B7280' : '#10B981',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '16px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    margin: '0 auto'
                  }}
                >
                  {loading ? '🔄 Executing...' : '▶️ Execute Query & Build Chart'}
                </button>
              </div>
            )}
          </div>

          {/* Live Preview Sidebar */}
          <div>
            {/* Query Stats */}
            <div style={{
              backgroundColor: '#1E293B',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid #334155',
              marginBottom: '24px'
            }}>
              <h3 style={{ color: '#FFFFFF', margin: '0 0 16px 0', fontSize: '16px' }}>
                📊 Live Preview
              </h3>
              
              {loading ? (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  padding: '20px',
                  color: '#94A3B8'
                }}>
                  🔄 Calculating...
                </div>
              ) : queryStats ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    padding: '8px 0',
                    borderBottom: '1px solid #475569'
                  }}>
                    <span style={{ color: '#94A3B8' }}>Total Plays:</span>
                    <span style={{ color: '#FFFFFF', fontWeight: '600' }}>
                      {queryStats.total_plays}
                    </span>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    padding: '8px 0',
                    borderBottom: '1px solid #475569'
                  }}>
                    <span style={{ color: '#94A3B8' }}>Avg Yards:</span>
                    <span style={{ color: '#FFFFFF', fontWeight: '600' }}>
                      {queryStats.avg_yards_gained}
                    </span>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    padding: '8px 0',
                    borderBottom: '1px solid #475569'
                  }}>
                    <span style={{ color: '#94A3B8' }}>Success Rate:</span>
                    <span style={{ 
                      color: queryStats.success_rate >= 50 ? '#10B981' : '#EF4444', 
                      fontWeight: '600' 
                    }}>
                      {queryStats.success_rate}%
                    </span>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    padding: '8px 0'
                  }}>
                    <span style={{ color: '#94A3B8' }}>Formations:</span>
                    <span style={{ color: '#FFFFFF', fontWeight: '600' }}>
                      {queryStats.formations_count}
                    </span>
                  </div>
                </div>
              ) : (
                <div style={{ 
                  padding: '20px',
                  textAlign: 'center',
                  color: '#6B7280'
                }}>
                  Add filter conditions to see live preview
                </div>
              )}
            </div>

            {/* SQL Preview */}
            {currentQuery.conditions.length > 0 && (
              <div style={{
                backgroundColor: '#1E293B',
                padding: '20px',  
                borderRadius: '12px',
                border: '1px solid #334155'
              }}>
                <h3 style={{ color: '#FFFFFF', margin: '0 0 16px 0', fontSize: '16px' }}>
                  🔍 Query Preview
                </h3>
                <div style={{
                  backgroundColor: '#0F172A',
                  padding: '16px',
                  borderRadius: '8px',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  color: '#94A3B8',
                  border: '1px solid #475569'
                }}>
                  <div>Filter Conditions:</div>
                  {currentQuery.conditions.map((condition, index) => (
                    <div key={index} style={{ marginLeft: '16px', marginTop: '4px' }}>
                      {typeof condition === 'object' && 'field' in condition && (
                        <>
                          {index > 0 && <span style={{ color: '#F59E0B' }}>AND </span>}
                          <span style={{ color: '#3B82F6' }}>{condition.field}</span>
                          <span style={{ color: '#10B981' }}> {condition.operator} </span>
                          <span style={{ color: '#F472B6' }}>"{condition.value}"</span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chart Builder Modal */}
        {showChartBuilder && (
          <AdvancedChartBuilder
            queryResults={queryResults}
            onClose={() => setShowChartBuilder(false)}
            gameId={selectedGame}
            queryStats={queryStats}
          />
        )}
      </div>
    </div>
  );
};

export default CustomQueryBuilder;