import React, { useState, useEffect } from 'react';
import { PlayData, FilterCondition } from '../services/consultant';

interface AdvancedFilterBuilderProps {
  playData: PlayData[];
  onApplyFilters: (filters: FilterCondition[]) => void;
  onClose: () => void;
  existingFilters: FilterCondition[];
}

interface FilterPreset {
  name: string;
  description: string;
  icon: string;
  filters: FilterCondition[];
  color: string;
}

interface FieldStats {
  uniqueValues: any[];
  min?: number;
  max?: number;
  type: 'string' | 'number';
}

const AdvancedFilterBuilder: React.FC<AdvancedFilterBuilderProps> = ({
  playData,
  onApplyFilters,
  onClose,
  existingFilters
}) => {
  const [currentFilters, setCurrentFilters] = useState<FilterCondition[]>([...existingFilters]);
  const [activeField, setActiveField] = useState<string>('');
  const [fieldStats, setFieldStats] = useState<Record<string, FieldStats>>({});
  const [previewStats, setPreviewStats] = useState<{
    totalPlays: number;
    avgYards: number;
    touchdowns: number;
  } | null>(null);

  // Filter field definitions
  const filterFields = [
    { key: 'down', label: 'Down', type: 'number', icon: '🏈' },
    { key: 'distance', label: 'Distance', type: 'number', icon: '📏' },
    { key: 'yard_line', label: 'Yard Line', type: 'number', icon: '📍' },
    { key: 'yards_gained', label: 'Yards Gained', type: 'number', icon: '📈' },
    { key: 'formation', label: 'Formation', type: 'string', icon: '⚡' },
    { key: 'play_type', label: 'Play Type', type: 'string', icon: '🎯' },
    { key: 'unit', label: 'Unit', type: 'string', icon: '👥' },
    { key: 'quarter', label: 'Quarter', type: 'number', icon: '⏰' },
    { key: 'points_scored', label: 'Points Scored', type: 'number', icon: '🏆' },
    { key: 'game_week', label: 'Week', type: 'number', icon: '📅' }
  ];

  // Pre-built filter presets
  const filterPresets: FilterPreset[] = [
    {
      name: 'Red Zone Plays',
      description: 'Plays inside the 20-yard line',
      icon: '🔴',
      color: '#DC2626',
      filters: [
        { field: 'yard_line', operator: 'greater_equal', value: 80 }
      ]
    },
    {
      name: 'Third Down Situations',
      description: 'Critical third down plays',
      icon: '🎯',
      color: '#D97706',
      filters: [
        { field: 'down', operator: 'equals', value: 3 }
      ]
    },
    {
      name: 'Short Yardage',
      description: 'Plays with 3 or fewer yards to go',
      icon: '📏',
      color: '#059669',
      filters: [
        { field: 'distance', operator: 'less_equal', value: 3 }
      ]
    },
    {
      name: 'Big Plays',
      description: 'Plays with 15+ yard gains',
      icon: '💥',
      color: '#7C3AED',
      filters: [
        { field: 'yards_gained', operator: 'greater_equal', value: 15 }
      ]
    },
    {
      name: 'Goal Line',
      description: 'Plays inside the 5-yard line',
      icon: '🥅',
      color: '#BE185D',
      filters: [
        { field: 'yard_line', operator: 'greater_equal', value: 95 }
      ]
    },
    {
      name: 'Passing Plays',
      description: 'All passing attempts',
      icon: '🏈',
      color: '#2563EB',
      filters: [
        { field: 'play_type', operator: 'equals', value: 'Pass' }
      ]
    },
    {
      name: 'Running Plays',
      description: 'All rushing attempts',
      icon: '🏃',
      color: '#16A34A',
      filters: [
        { field: 'play_type', operator: 'equals', value: 'Run' }
      ]
    },
    {
      name: 'Negative Plays',
      description: 'Plays with yards lost',
      icon: '📉',
      color: '#EF4444',
      filters: [
        { field: 'yards_gained', operator: 'less_than', value: 0 }
      ]
    }
  ];

  const operatorOptions = [
    { value: 'equals', label: 'equals', icon: '=' },
    { value: 'not_equals', label: 'not equals', icon: '≠' },
    { value: 'greater_than', label: 'greater than', icon: '>' },
    { value: 'less_than', label: 'less than', icon: '<' },
    { value: 'greater_equal', label: 'greater or equal', icon: '≥' },
    { value: 'less_equal', label: 'less or equal', icon: '≤' },
    { value: 'contains', label: 'contains', icon: '⊃' },
    { value: 'in', label: 'in list', icon: '∈' }
  ];

  useEffect(() => {
    calculateFieldStats();
  }, [playData]);

  useEffect(() => {
    updatePreview();
  }, [currentFilters, playData]);

  const calculateFieldStats = () => {
    const stats: Record<string, FieldStats> = {};
    
    filterFields.forEach(field => {
      const values = playData.map(play => play[field.key as keyof PlayData]).filter(v => v != null);
      
      if (field.type === 'number') {
        const numValues = values.map(v => Number(v)).filter(v => !isNaN(v));
        stats[field.key] = {
          uniqueValues: Array.from(new Set(numValues)).sort((a, b) => Number(a) - Number(b)),
          min: Math.min(...numValues),
          max: Math.max(...numValues),
          type: 'number'
        };
      } else {
        stats[field.key] = {
          uniqueValues: Array.from(new Set(values)).sort(),
          type: 'string'
        };
      }
    });
    
    setFieldStats(stats);
  };

  const updatePreview = () => {
    let filteredData = [...playData];
    
    // Apply all current filters
    currentFilters.forEach(filter => {
      filteredData = filteredData.filter(play => {
        const value = play[filter.field as keyof PlayData];
        
        switch (filter.operator) {
          case 'equals':
            return value === filter.value;
          case 'not_equals':
            return value !== filter.value;
          case 'greater_than':
            return Number(value) > Number(filter.value);
          case 'less_than':
            return Number(value) < Number(filter.value);
          case 'greater_equal':
            return Number(value) >= Number(filter.value);
          case 'less_equal':
            return Number(value) <= Number(filter.value);
          case 'contains':
            return String(value).toLowerCase().includes(String(filter.value).toLowerCase());
          case 'in':
            return Array.isArray(filter.value) && filter.value.includes(value);
          default:
            return true;
        }
      });
    });
    
    if (filteredData.length > 0) {
      const totalYards = filteredData.reduce((sum, play) => sum + play.yards_gained, 0);
      const touchdowns = filteredData.filter(play => play.points_scored >= 6).length;
      
      setPreviewStats({
        totalPlays: filteredData.length,
        avgYards: totalYards / filteredData.length,
        touchdowns
      });
    } else {
      setPreviewStats({
        totalPlays: 0,
        avgYards: 0,
        touchdowns: 0
      });
    }
  };

  const applyPreset = (preset: FilterPreset) => {
    setCurrentFilters([...currentFilters, ...preset.filters]);
  };

  const addFilter = (field: string, operator: string, value: any) => {
    const newFilter: FilterCondition = {
      field,
      operator,
      value
    };
    setCurrentFilters([...currentFilters, newFilter]);
    setActiveField('');
  };

  const removeFilter = (index: number) => {
    setCurrentFilters(currentFilters.filter((_, i) => i !== index));
  };

  const clearAllFilters = () => {
    setCurrentFilters([]);
  };

  const handleApplyFilters = () => {
    onApplyFilters(currentFilters);
    onClose();
  };

  const renderFieldInput = (field: any) => {
    const stats = fieldStats[field.key];
    if (!stats) return null;

    return (
      <div style={{
        backgroundColor: '#374151',
        padding: '16px',
        borderRadius: '8px',
        border: '1px solid #4B5563'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '12px'
        }}>
          <span style={{ fontSize: '18px' }}>{field.icon}</span>
          <h4 style={{ color: '#FFFFFF', margin: 0 }}>{field.label}</h4>
          <button
            onClick={() => setActiveField('')}
            style={{
              marginLeft: 'auto',
              backgroundColor: 'transparent',
              border: 'none',
              color: '#9CA3AF',
              cursor: 'pointer',
              fontSize: '18px'
            }}
          >
            ✕
          </button>
        </div>

        {field.type === 'number' ? (
          <div>
            <div style={{ marginBottom: '12px' }}>
              <span style={{ color: '#9CA3AF', fontSize: '12px' }}>
                Range: {stats.min} - {stats.max}
              </span>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {operatorOptions
                .filter(op => ['equals', 'not_equals', 'greater_than', 'less_than', 'greater_equal', 'less_equal'].includes(op.value))
                .map(operator => (
                <button
                  key={operator.value}
                  onClick={() => {
                    const value = prompt(`Enter value to be ${operator.label}:`);
                    if (value !== null) {
                      addFilter(field.key, operator.value, Number(value));
                    }
                  }}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#1F2937',
                    color: '#FFFFFF',
                    border: '1px solid #4B5563',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>{operator.icon}</span>
                  <span>{operator.label}</span>
                </button>
              ))}
            </div>

            {/* Common values for quick selection */}
            {stats.uniqueValues.length <= 10 && (
              <div style={{ marginTop: '12px' }}>
                <div style={{ color: '#9CA3AF', fontSize: '12px', marginBottom: '6px' }}>
                  Quick select:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {stats.uniqueValues.map(value => (
                    <button
                      key={value}
                      onClick={() => addFilter(field.key, 'equals', value)}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: '#1F2937',
                        color: '#FFFFFF',
                        border: '1px solid #4B5563',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '11px'
                      }}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: '12px' }}>
              <span style={{ color: '#9CA3AF', fontSize: '12px' }}>
                {stats.uniqueValues.length} unique values
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
              {operatorOptions
                .filter(op => ['equals', 'not_equals', 'contains'].includes(op.value))
                .map(operator => (
                <button
                  key={operator.value}
                  onClick={() => {
                    const value = prompt(`Enter value to be ${operator.label}:`);
                    if (value !== null) {
                      addFilter(field.key, operator.value, value);
                    }
                  }}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#1F2937',
                    color: '#FFFFFF',
                    border: '1px solid #4B5563',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>{operator.icon}</span>
                  <span>{operator.label}</span>
                </button>
              ))}
            </div>

            {/* Available values */}
            <div>
              <div style={{ color: '#9CA3AF', fontSize: '12px', marginBottom: '6px' }}>
                Available values:
              </div>
              <div style={{ 
                maxHeight: '120px', 
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px'
              }}>
                {stats.uniqueValues.map(value => (
                  <button
                    key={value}
                    onClick={() => addFilter(field.key, 'equals', value)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#1F2937',
                      color: '#FFFFFF',
                      border: '1px solid #4B5563',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      textAlign: 'left'
                    }}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#1E293B',
        borderRadius: '16px',
        border: '1px solid #334155',
        width: '90%',
        maxWidth: '1200px',
        maxHeight: '90vh',
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '24px',
          borderBottom: '1px solid #334155'
        }}>
          <div>
            <h2 style={{
              color: '#FFFFFF',
              fontSize: '24px',
              fontWeight: '700',
              margin: '0 0 8px 0'
            }}>
              🔍 Advanced Filter Builder
            </h2>
            <p style={{
              color: '#94A3B8',
              fontSize: '14px',
              margin: 0
            }}>
              Create complex filters to narrow down your data analysis
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '12px',
              backgroundColor: '#374151',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '18px'
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: '24px', display: 'flex', gap: '24px', flex: 1 }}>
          {/* Left Panel - Filter Controls */}
          <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Filter Presets */}
            <div>
              <h3 style={{ color: '#FFFFFF', margin: '0 0 12px 0', fontSize: '16px' }}>
                ⚡ Quick Presets
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {filterPresets.slice(0, 8).map((preset, index) => (
                  <button
                    key={index}
                    onClick={() => applyPreset(preset)}
                    style={{
                      padding: '12px 8px',
                      backgroundColor: '#374151',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = preset.color}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#374151'}
                  >
                    <span style={{ fontSize: '16px' }}>{preset.icon}</span>
                    <span style={{ fontWeight: '600' }}>{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Field Selection */}
            <div>
              <h3 style={{ color: '#FFFFFF', margin: '0 0 12px 0', fontSize: '16px' }}>
                🔧 Add Filter
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {filterFields.map(field => (
                  <button
                    key={field.key}
                    onClick={() => setActiveField(activeField === field.key ? '' : field.key)}
                    style={{
                      padding: '12px',
                      backgroundColor: activeField === field.key ? '#3B82F6' : '#374151',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      textAlign: 'left'
                    }}
                  >
                    <span>{field.icon}</span>
                    <span>{field.label}</span>
                    <span style={{ 
                      marginLeft: 'auto', 
                      fontSize: '12px', 
                      color: '#9CA3AF' 
                    }}>
                      {field.type}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Clear All */}
            {currentFilters.length > 0 && (
              <button
                onClick={clearAllFilters}
                style={{
                  padding: '12px',
                  backgroundColor: '#EF4444',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                🗑️ Clear All Filters
              </button>
            )}
          </div>

          {/* Middle Panel - Active Field Input or Filter List */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {activeField ? (
              renderFieldInput(filterFields.find(f => f.key === activeField))
            ) : (
              <div>
                <h3 style={{ color: '#FFFFFF', margin: '0 0 16px 0', fontSize: '16px' }}>
                  🏷️ Active Filters ({currentFilters.length})
                </h3>
                
                {currentFilters.length === 0 ? (
                  <div style={{
                    padding: '40px',
                    textAlign: 'center',
                    color: '#6B7280',
                    border: '2px dashed #4B5563',
                    borderRadius: '8px'
                  }}>
                    <p style={{ margin: '0 0 12px 0', fontSize: '16px' }}>
                      No filters applied
                    </p>
                    <p style={{ margin: 0, fontSize: '14px' }}>
                      Use quick presets or select a field to add filters
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {currentFilters.map((filter, index) => {
                      const field = filterFields.find(f => f.key === filter.field);
                      const operator = operatorOptions.find(op => op.value === filter.operator);
                      
                      return (
                        <div
                          key={index}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '12px 16px',
                            backgroundColor: '#374151',
                            borderRadius: '8px',
                            border: '1px solid #4B5563'
                          }}
                        >
                          <span style={{ fontSize: '16px', marginRight: '8px' }}>
                            {field?.icon}
                          </span>
                          <span style={{ color: '#FFFFFF', fontSize: '14px' }}>
                            <strong>{field?.label}</strong> {operator?.label} <strong>{filter.value}</strong>
                          </span>
                          <button
                            onClick={() => removeFilter(index)}
                            style={{
                              marginLeft: 'auto',
                              backgroundColor: 'transparent',
                              border: 'none',
                              color: '#EF4444',
                              cursor: 'pointer',
                              fontSize: '16px'
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Panel - Preview Stats */}
          <div style={{ width: '250px' }}>
            <h3 style={{ color: '#FFFFFF', margin: '0 0 16px 0', fontSize: '16px' }}>
              📊 Filter Preview
            </h3>
            
            {previewStats && (
              <div style={{
                backgroundColor: '#374151',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #4B5563'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', color: '#94A3B8' }}>Matching Plays</div>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#FFFFFF' }}>
                      {previewStats.totalPlays}
                    </div>
                    <div style={{ fontSize: '11px', color: '#6B7280' }}>
                      of {playData.length} total
                    </div>
                  </div>
                  
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', color: '#94A3B8' }}>Avg Yards</div>
                    <div style={{ fontSize: '18px', fontWeight: '600', color: '#10B981' }}>
                      {previewStats.avgYards.toFixed(1)}
                    </div>
                  </div>
                  
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', color: '#94A3B8' }}>Touchdowns</div>
                    <div style={{ fontSize: '18px', fontWeight: '600', color: '#F59E0B' }}>
                      {previewStats.touchdowns}
                    </div>
                  </div>
                  
                  <div style={{
                    width: '100%',
                    height: '8px',
                    backgroundColor: '#1F2937',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    marginTop: '8px'
                  }}>
                    <div
                      style={{
                        width: `${(previewStats.totalPlays / playData.length) * 100}%`,
                        height: '100%',
                        backgroundColor: '#3B82F6',
                        transition: 'width 0.3s ease'
                      }}
                    />
                  </div>
                  <div style={{ fontSize: '11px', color: '#6B7280', textAlign: 'center' }}>
                    {((previewStats.totalPlays / playData.length) * 100).toFixed(1)}% of data
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '24px',
          borderTop: '1px solid #334155'
        }}>
          <div style={{ color: '#9CA3AF', fontSize: '14px' }}>
            {currentFilters.length} filter{currentFilters.length !== 1 ? 's' : ''} active
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '12px 24px',
                backgroundColor: '#6B7280',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleApplyFilters}
              style={{
                padding: '12px 24px',
                backgroundColor: '#10B981',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedFilterBuilder;