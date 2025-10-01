import React, { useState, useEffect, useMemo } from 'react';
import { consultantService, PlayData, FilterCondition } from '../services/consultant';
import AdvancedFilterBuilder from './AdvancedFilterBuilder';
import StatisticalChartViewer from './StatisticalChartViewer';

interface LocalFilterCondition extends FilterCondition {
  label: string;
}

interface DataExplorerProps {
  teamId: number;
  onClose: () => void;
}

const ConsultantDataExplorer: React.FC<DataExplorerProps> = ({ teamId, onClose }) => {
  const [playData, setPlayData] = useState<PlayData[]>([]);
  const [filteredData, setFilteredData] = useState<PlayData[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [highlightedRows, setHighlightedRows] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filter states
  const [activeFilters, setActiveFilters] = useState<LocalFilterCondition[]>([]);
  const [showFilterBuilder, setShowFilterBuilder] = useState(false);
  const [showStatisticalCharts, setShowStatisticalCharts] = useState(false);
  
  // Column visibility
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set([
    'play_id', 'down', 'distance', 'yard_line', 'formation', 
    'play_type', 'yards_gained', 'game_week', 'game_opponent'
  ]));
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  
  // Sorting
  const [sortField, setSortField] = useState<string>('play_id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const columns = [
    { key: 'play_id', label: 'Play #', type: 'number' },
    { key: 'game_week', label: 'Week', type: 'number' },
    { key: 'game_opponent', label: 'Opponent', type: 'string' },
    { key: 'down', label: 'Down', type: 'number' },
    { key: 'distance', label: 'Distance', type: 'number' },
    { key: 'yard_line', label: 'Yard Line', type: 'number' },
    { key: 'formation', label: 'Formation', type: 'string' },
    { key: 'play_type', label: 'Play Type', type: 'string' },
    { key: 'play_name', label: 'Play Name', type: 'string' },
    { key: 'result_of_play', label: 'Result', type: 'string' },
    { key: 'yards_gained', label: 'Yards', type: 'number' },
    { key: 'points_scored', label: 'Points', type: 'number' },
    { key: 'unit', label: 'Unit', type: 'string' },
    { key: 'quarter', label: 'Quarter', type: 'number' },
    { key: 'time_remaining', label: 'Time', type: 'string' }
  ];

  useEffect(() => {
    loadTeamPlayData();
  }, [teamId]);

  useEffect(() => {
    applyFilters();
  }, [playData, activeFilters]);

  const loadTeamPlayData = async () => {
    try {
      setLoading(true);
      const response = await consultantService.getTeamPlayData(teamId);
      setPlayData(response.plays);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to load play data');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...playData];
    
    activeFilters.forEach(filter => {
      filtered = filtered.filter(play => {
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
    
    setFilteredData(filtered);
    setCurrentPage(1);
  };

  const sortedData = useMemo(() => {
    const sorted = [...filteredData].sort((a, b) => {
      const aValue = a[sortField as keyof PlayData];
      const bValue = b[sortField as keyof PlayData];
      
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();
      
      if (sortDirection === 'asc') {
        return aStr.localeCompare(bStr);
      } else {
        return bStr.localeCompare(aStr);
      }
    });
    
    return sorted;
  }, [filteredData, sortField, sortDirection]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleRowClick = (playId: number, event: React.MouseEvent) => {
    if (event.ctrlKey || event.metaKey) {
      // Multi-select with Ctrl/Cmd
      const newSelected = new Set(selectedRows);
      if (newSelected.has(playId)) {
        newSelected.delete(playId);
      } else {
        newSelected.add(playId);
      }
      setSelectedRows(newSelected);
    } else if (event.shiftKey && selectedRows.size > 0) {
      // Range select with Shift
      const lastSelected = Math.max(...Array.from(selectedRows));
      const currentIndex = paginatedData.findIndex(play => play.id === playId);
      const lastIndex = paginatedData.findIndex(play => play.id === lastSelected);
      
      const start = Math.min(currentIndex, lastIndex);
      const end = Math.max(currentIndex, lastIndex);
      
      const newSelected = new Set(selectedRows);
      for (let i = start; i <= end; i++) {
        newSelected.add(paginatedData[i].id);
      }
      setSelectedRows(newSelected);
    } else {
      // Single select
      setSelectedRows(new Set([playId]));
    }
  };

  const handleHighlight = (playId: number) => {
    const newHighlighted = new Set(highlightedRows);
    if (newHighlighted.has(playId)) {
      newHighlighted.delete(playId);
    } else {
      newHighlighted.add(playId);
    }
    setHighlightedRows(newHighlighted);
  };

  const handleApplyAdvancedFilters = (filters: FilterCondition[]) => {
    const labeledFilters: LocalFilterCondition[] = filters.map(filter => {
      const column = columns.find(col => col.key === filter.field);
      const operatorLabels: Record<string, string> = {
        'equals': '=',
        'not_equals': '≠',
        'greater_than': '>',
        'less_than': '<',
        'greater_equal': '≥',
        'less_equal': '≤',
        'contains': 'contains',
        'in': 'in'
      };
      
      const label = `${column?.label} ${operatorLabels[filter.operator]} ${filter.value}`;
      
      return {
        ...filter,
        label
      };
    });
    
    setActiveFilters(labeledFilters);
  };

  const addFilter = (field: string, operator: string, value: any) => {
    const column = columns.find(col => col.key === field);
    const label = `${column?.label} ${operator} ${value}`;
    
    const newFilter: LocalFilterCondition = {
      field,
      operator,
      value,
      label
    };
    
    setActiveFilters([...activeFilters, newFilter]);
  };

  const removeFilter = (index: number) => {
    setActiveFilters(activeFilters.filter((_, i) => i !== index));
  };

  const toggleColumnVisibility = (columnKey: string) => {
    const newVisible = new Set(visibleColumns);
    if (newVisible.has(columnKey)) {
      newVisible.delete(columnKey);
    } else {
      newVisible.add(columnKey);
    }
    setVisibleColumns(newVisible);
  };

  const getSummaryStats = () => {
    const selected = selectedRows.size > 0 
      ? filteredData.filter(play => selectedRows.has(play.id))
      : filteredData;
    
    if (selected.length === 0) return null;
    
    const totalYards = selected.reduce((sum, play) => sum + play.yards_gained, 0);
    const totalPoints = selected.reduce((sum, play) => sum + play.points_scored, 0);
    const avgYards = totalYards / selected.length;
    
    return {
      plays: selected.length,
      totalYards,
      avgYards: avgYards.toFixed(1),
      totalPoints
    };
  };

  const stats = getSummaryStats();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        backgroundColor: '#0F172A',
        color: '#FFFFFF'
      }}>
        Loading play data...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: '20px',
        backgroundColor: '#0F172A',
        color: '#EF4444',
        textAlign: 'center'
      }}>
        Error: {error}
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: '#0F172A',
      minHeight: '100vh',
      padding: '24px'
    }}>
      <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <div>
            <h1 style={{
              color: '#FFFFFF',
              fontSize: '32px',
              fontWeight: '700',
              margin: '0 0 8px 0'
            }}>
              📊 Interactive Data Explorer
            </h1>
            <p style={{
              color: '#94A3B8',
              fontSize: '16px',
              margin: 0
            }}>
              Explore, filter, and analyze play data to create custom visualizations
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '12px 24px',
              backgroundColor: '#6B7280',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            ✕ Close
          </button>
        </div>

        {/* Controls Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto auto',
          gap: '16px',
          marginBottom: '20px'
        }}>
          {/* Summary Stats */}
          {stats && (
            <div style={{
              backgroundColor: '#1E293B',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid #334155'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '16px',
                color: '#FFFFFF'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#94A3B8' }}>Plays</div>
                  <div style={{ fontSize: '18px', fontWeight: '600' }}>{stats.plays}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#94A3B8' }}>Total Yards</div>
                  <div style={{ fontSize: '18px', fontWeight: '600' }}>{stats.totalYards}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#94A3B8' }}>Avg Yards</div>
                  <div style={{ fontSize: '18px', fontWeight: '600' }}>{stats.avgYards}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#94A3B8' }}>Points</div>
                  <div style={{ fontSize: '18px', fontWeight: '600' }}>{stats.totalPoints}</div>
                </div>
              </div>
            </div>
          )}

          {/* Column Visibility */}
          <div style={{ position: 'relative' }}>
            <button
              style={{
                padding: '12px 16px',
                backgroundColor: '#374151',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              🔧 Columns
            </button>
          </div>

          {/* Statistical Analysis */}
          <button
            onClick={() => setShowStatisticalCharts(true)}
            style={{
              padding: '12px 16px',
              backgroundColor: '#7C3AED',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            📊 Statistical Analysis
          </button>

          {/* Filter Builder */}
          <button
            onClick={() => setShowFilterBuilder(true)}
            style={{
              padding: '12px 16px',
              backgroundColor: '#3B82F6',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            🔍 Add Filter
          </button>
        </div>

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div style={{
            marginBottom: '20px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            {activeFilters.map((filter, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '6px 12px',
                  backgroundColor: '#3B82F6',
                  color: '#FFFFFF',
                  borderRadius: '20px',
                  fontSize: '12px'
                }}
              >
                <span>{filter.label}</span>
                <button
                  onClick={() => removeFilter(index)}
                  style={{
                    marginLeft: '8px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#FFFFFF',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Data Table */}
        <div style={{
          backgroundColor: '#1E293B',
          borderRadius: '12px',
          border: '1px solid #334155',
          overflow: 'hidden'
        }}>
          {/* Table Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: `40px repeat(${Array.from(visibleColumns).length}, 1fr)`,
            backgroundColor: '#374151',
            padding: '12px',
            borderBottom: '1px solid #4B5563',
            fontSize: '12px',
            fontWeight: '600',
            color: '#FFFFFF'
          }}>
            <div></div>
            {columns
              .filter(col => visibleColumns.has(col.key))
              .map(column => (
                <div
                  key={column.key}
                  onClick={() => handleSort(column.key)}
                  style={{
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {column.label}
                  {sortField === column.key && (
                    <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              ))
            }
          </div>

          {/* Table Body */}
          <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {paginatedData.map((play) => (
              <div
                key={play.id}
                onClick={(e) => handleRowClick(play.id, e)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: `40px repeat(${Array.from(visibleColumns).length}, 1fr)`,
                  padding: '12px',
                  borderBottom: '1px solid #374151',
                  backgroundColor: selectedRows.has(play.id) 
                    ? '#1E40AF' 
                    : highlightedRows.has(play.id) 
                      ? '#7C2D12' 
                      : 'transparent',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!selectedRows.has(play.id) && !highlightedRows.has(play.id)) {
                    e.currentTarget.style.backgroundColor = '#2D3748';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!selectedRows.has(play.id) && !highlightedRows.has(play.id)) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleHighlight(play.id);
                    }}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: highlightedRows.has(play.id) ? '#FCD34D' : '#6B7280',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    ⭐
                  </button>
                </div>
                {columns
                  .filter(col => visibleColumns.has(col.key))
                  .map(column => (
                    <div key={column.key}>
                      {play[column.key as keyof PlayData] ?? 'N/A'}
                    </div>
                  ))
                }
              </div>
            ))}
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '16px',
            marginTop: '20px',
            color: '#FFFFFF'
          }}>
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              style={{
                padding: '8px 16px',
                backgroundColor: '#374151',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '6px',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                opacity: currentPage === 1 ? 0.5 : 1
              }}
            >
              Previous
            </button>
            
            <span>
              Page {currentPage} of {totalPages} ({sortedData.length} plays)
            </span>
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              style={{
                padding: '8px 16px',
                backgroundColor: '#374151',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '6px',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                opacity: currentPage === totalPages ? 0.5 : 1
              }}
            >
              Next
            </button>
          </div>
        )}

        {/* Selection Actions */}
        {selectedRows.size > 0 && (
          <div style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: '#1E40AF',
            color: '#FFFFFF',
            padding: '16px 24px',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <span>{selectedRows.size} plays selected</span>
            <button
              onClick={() => setShowStatisticalCharts(true)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#3B82F6',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              📊 Create Chart
            </button>
          </div>
        )}

        {/* Advanced Filter Builder Modal */}
        {showFilterBuilder && (
          <AdvancedFilterBuilder
            playData={playData}
            onApplyFilters={handleApplyAdvancedFilters}
            onClose={() => setShowFilterBuilder(false)}
            existingFilters={activeFilters}
          />
        )}

        {/* Statistical Chart Viewer Modal */}
        {showStatisticalCharts && (
          <StatisticalChartViewer
            teamId={teamId}
            filters={activeFilters}
            selectedPlays={selectedRows.size}
            onClose={() => setShowStatisticalCharts(false)}
          />
        )}
      </div>
    </div>
  );
};

export default ConsultantDataExplorer;