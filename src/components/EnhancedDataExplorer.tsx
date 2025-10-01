import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { consultantService, PlayData, FilterCondition } from '../services/consultant';

interface LocalFilterCondition extends FilterCondition {
  id: string;
  label: string;
}

interface Column {
  key: string;
  label: string;
  type: 'number' | 'string';
  width?: number;
  visible: boolean;
  pinned?: 'left' | 'right' | null;
}

interface SavedView {
  id: string;
  name: string;
  description: string;
  columns: Column[];
  filters: LocalFilterCondition[];
  sort: { field: string; direction: 'asc' | 'desc' };
  created_at: string;
}

interface EnhancedDataExplorerProps {
  teamId: number;
  teamName: string;
}

const EnhancedDataExplorer: React.FC<EnhancedDataExplorerProps> = ({ teamId, teamName }) => {
  const [playData, setPlayData] = useState<PlayData[]>([]);
  const [filteredData, setFilteredData] = useState<PlayData[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // View management
  const [activeView, setActiveView] = useState<'table' | 'summary' | 'export'>('table');
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [currentViewName, setCurrentViewName] = useState('');
  
  // Filter states
  const [activeFilters, setActiveFilters] = useState<LocalFilterCondition[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  
  // Column management
  const [columns, setColumns] = useState<Column[]>([
    { key: 'play_id', label: 'Play #', type: 'number', width: 80, visible: true, pinned: 'left' },
    { key: 'game_week', label: 'Week', type: 'number', width: 80, visible: true },
    { key: 'game_opponent', label: 'Opponent', type: 'string', width: 120, visible: true },
    { key: 'down', label: 'Down', type: 'number', width: 80, visible: true },
    { key: 'distance', label: 'Distance', type: 'number', width: 100, visible: true },
    { key: 'yard_line', label: 'Yard Line', type: 'number', width: 100, visible: true },
    { key: 'formation', label: 'Formation', type: 'string', width: 140, visible: true },
    { key: 'play_type', label: 'Play Type', type: 'string', width: 120, visible: true },
    { key: 'play_name', label: 'Play Name', type: 'string', width: 180, visible: false },
    { key: 'result_of_play', label: 'Result', type: 'string', width: 150, visible: false },
    { key: 'yards_gained', label: 'Yards', type: 'number', width: 80, visible: true },
    { key: 'points_scored', label: 'Points', type: 'number', width: 80, visible: false },
    { key: 'unit', label: 'Unit', type: 'string', width: 80, visible: true },
    { key: 'quarter', label: 'Quarter', type: 'number', width: 80, visible: false },
    { key: 'time_remaining', label: 'Time', type: 'string', width: 100, visible: false }
  ]);
  
  const [showColumnManager, setShowColumnManager] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  
  // Sorting
  const [sortField, setSortField] = useState<string>('play_id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    loadTeamPlayData();
    loadSavedViews();
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

  const loadSavedViews = () => {
    // Mock saved views - in real app this would be an API call
    const mockViews: SavedView[] = [
      {
        id: '1',
        name: 'Red Zone Analysis',
        description: 'Plays in the red zone with key metrics',
        columns: columns.map(col => ({ ...col, visible: ['play_id', 'yard_line', 'play_type', 'yards_gained', 'points_scored'].includes(col.key) })),
        filters: [{ id: '1', field: 'yard_line', operator: 'greater_equal', value: 80, label: 'Red Zone (80+ yard line)' }],
        sort: { field: 'yard_line', direction: 'desc' },
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Third Down Situations',
        description: 'All third down plays with context',
        columns: columns.map(col => ({ ...col, visible: ['play_id', 'down', 'distance', 'formation', 'play_type', 'yards_gained'].includes(col.key) })),
        filters: [{ id: '2', field: 'down', operator: 'equals', value: 3, label: 'Third Down' }],
        sort: { field: 'distance', direction: 'asc' },
        created_at: new Date(Date.now() - 86400000).toISOString()
      }
    ];
    setSavedViews(mockViews);
  };

  const applyFilters = useCallback(() => {
    let filtered = [...playData];
    
    activeFilters.forEach(filter => {
      if (!filter.field || !filter.operator) return;
      
      filtered = filtered.filter(play => {
        const value = play[filter.field as keyof PlayData];
        const filterValue = filter.value;
        
        switch (filter.operator) {
          case 'equals':
            return value == filterValue;
          case 'not_equals':
            return value != filterValue;
          case 'greater_than':
            return Number(value) > Number(filterValue);
          case 'less_than':
            return Number(value) < Number(filterValue);
          case 'greater_equal':
            return Number(value) >= Number(filterValue);
          case 'less_equal':
            return Number(value) <= Number(filterValue);
          case 'contains':
            return String(value).toLowerCase().includes(String(filterValue).toLowerCase());
          default:
            return true;
        }
      });
    });
    
    setFilteredData(filtered);
    setCurrentPage(1);
  }, [playData, activeFilters]);

  const visibleColumns = useMemo(() => 
    columns.filter(col => col.visible).sort((a, b) => {
      if (a.pinned === 'left' && b.pinned !== 'left') return -1;
      if (b.pinned === 'left' && a.pinned !== 'left') return 1;
      if (a.pinned === 'right' && b.pinned !== 'right') return 1;
      if (b.pinned === 'right' && a.pinned !== 'right') return -1;
      return 0;
    }), 
    [columns]
  );

  const sortedAndPaginatedData = useMemo(() => {
    let sorted = [...filteredData];
    
    if (sortField) {
      sorted.sort((a, b) => {
        const aVal = a[sortField as keyof PlayData];
        const bVal = b[sortField as keyof PlayData];
        
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;
        
        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    return sorted.slice(startIndex, endIndex);
  }, [filteredData, sortField, sortDirection, currentPage, itemsPerPage]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const toggleColumnVisibility = (columnKey: string) => {
    setColumns(columns.map(col => 
      col.key === columnKey ? { ...col, visible: !col.visible } : col
    ));
  };

  const addFilter = () => {
    const newFilter: LocalFilterCondition = {
      id: Date.now().toString(),
      field: '',
      operator: '',
      value: '',
      label: ''
    };
    setActiveFilters([...activeFilters, newFilter]);
  };

  const updateFilter = (id: string, updates: Partial<LocalFilterCondition>) => {
    setActiveFilters(activeFilters.map(filter => 
      filter.id === id ? { ...filter, ...updates } : filter
    ));
  };

  const removeFilter = (id: string) => {
    setActiveFilters(activeFilters.filter(filter => filter.id !== id));
  };

  const saveCurrentView = () => {
    if (!currentViewName.trim()) return;
    
    const newView: SavedView = {
      id: Date.now().toString(),
      name: currentViewName.trim(),
      description: `Custom view with ${activeFilters.length} filters`,
      columns: [...columns],
      filters: [...activeFilters],
      sort: { field: sortField, direction: sortDirection },
      created_at: new Date().toISOString()
    };
    
    setSavedViews([newView, ...savedViews]);
    setCurrentViewName('');
  };

  const loadView = (view: SavedView) => {
    setColumns([...view.columns]);
    setActiveFilters([...view.filters]);
    setSortField(view.sort.field);
    setSortDirection(view.sort.direction);
  };

  const exportData = () => {
    const csvContent = [
      visibleColumns.map(col => col.label).join(','),
      ...sortedAndPaginatedData.map(row =>
        visibleColumns.map(col => row[col.key as keyof PlayData] || '').join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${teamName}_play_data_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // Summary statistics
  const summaryStats = useMemo(() => {
    if (filteredData.length === 0) return null;
    
    const totalYards = filteredData.reduce((sum, play) => sum + (play.yards_gained || 0), 0);
    const totalPlays = filteredData.length;
    const avgYards = totalYards / totalPlays;
    
    const byPlayType = filteredData.reduce((acc, play) => {
      acc[play.play_type] = (acc[play.play_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const successfulPlays = filteredData.filter(play => (play.yards_gained || 0) > 0).length;
    const successRate = (successfulPlays / totalPlays) * 100;
    
    return {
      totalPlays,
      totalYards,
      avgYards,
      successRate,
      byPlayType
    };
  }, [filteredData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="spinner spinner-lg"></div>
        <span className="ml-3 text-gray-600">Loading play data...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Data Explorer</h2>
          <p className="text-gray-600">
            Explore and analyze play-by-play data for {teamName} • {filteredData.length} of {playData.length} plays
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn ${activeFilters.length > 0 ? 'btn-primary' : 'btn-secondary'}`}
          >
            🔍 Filters {activeFilters.length > 0 && `(${activeFilters.length})`}
          </button>
          <button
            onClick={() => setShowColumnManager(!showColumnManager)}
            className="btn btn-secondary"
          >
            📋 Columns
          </button>
          <button
            onClick={exportData}
            className="btn btn-success"
          >
            📥 Export CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-error/10 border border-error/20 text-error p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* View Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {[
          { id: 'table', label: 'Table View', icon: '📊' },
          { id: 'summary', label: 'Summary', icon: '📈' },
          { id: 'export', label: 'Export & Save', icon: '💾' }
        ].map((view) => (
          <button
            key={view.id}
            onClick={() => setActiveView(view.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeView === view.id
                ? 'bg-white shadow-sm text-primary border border-gray-200'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <span>{view.icon}</span>
            {view.label}
          </button>
        ))}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-800">Active Filters</h3>
            <button onClick={addFilter} className="btn btn-primary btn-sm">
              + Add Filter
            </button>
          </div>
          
          {activeFilters.map(filter => (
            <div key={filter.id} className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white p-3 rounded-md">
              <select
                value={filter.field}
                onChange={(e) => updateFilter(filter.id, { field: e.target.value })}
                className="form-input"
              >
                <option value="">Select Field</option>
                {columns.map(col => (
                  <option key={col.key} value={col.key}>{col.label}</option>
                ))}
              </select>
              
              <select
                value={filter.operator}
                onChange={(e) => updateFilter(filter.id, { operator: e.target.value })}
                className="form-input"
                disabled={!filter.field}
              >
                <option value="">Operator</option>
                <option value="equals">Equals</option>
                <option value="not_equals">Not Equals</option>
                <option value="greater_than">Greater Than</option>
                <option value="less_than">Less Than</option>
                <option value="contains">Contains</option>
              </select>
              
              <input
                type="text"
                value={filter.value}
                onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                placeholder="Value"
                className="form-input"
                disabled={!filter.operator}
              />
              
              <button
                onClick={() => removeFilter(filter.id)}
                className="btn btn-error btn-sm"
              >
                Remove
              </button>
            </div>
          ))}
          
          {activeFilters.length === 0 && (
            <p className="text-gray-500 text-center py-4">No filters applied</p>
          )}
        </div>
      )}

      {/* Column Manager */}
      {showColumnManager && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Column Management</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {columns.map(column => (
              <label key={column.key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={column.visible}
                  onChange={() => toggleColumnVisibility(column.key)}
                  className="rounded"
                />
                <span className="text-sm">{column.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Content based on active view */}
      {activeView === 'table' && (
        <div className="space-y-4">
          {/* Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    {visibleColumns.map(column => (
                      <th
                        key={column.key}
                        onClick={() => handleSort(column.key)}
                        className="cursor-pointer hover:bg-gray-100 select-none"
                        style={{ width: column.width }}
                      >
                        <div className="flex items-center gap-1">
                          {column.label}
                          {sortField === column.key && (
                            <span className="text-primary">
                              {sortDirection === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedAndPaginatedData.map((play, index) => (
                    <tr key={play.play_id || index}>
                      {visibleColumns.map(column => (
                        <td key={column.key}>
                          {play[column.key as keyof PlayData] ?? '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} plays
              </span>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="form-input w-auto"
              >
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="btn btn-secondary btn-sm"
              >
                Previous
              </button>
              <span className="flex items-center px-3 text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="btn btn-secondary btn-sm"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {activeView === 'summary' && summaryStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card">
            <h3 className="font-medium text-gray-600 mb-1">Total Plays</h3>
            <p className="text-3xl font-bold text-primary">{summaryStats.totalPlays}</p>
          </div>
          
          <div className="card">
            <h3 className="font-medium text-gray-600 mb-1">Total Yards</h3>
            <p className="text-3xl font-bold text-success">{summaryStats.totalYards}</p>
          </div>
          
          <div className="card">
            <h3 className="font-medium text-gray-600 mb-1">Avg Yards/Play</h3>
            <p className="text-3xl font-bold text-accent">{summaryStats.avgYards.toFixed(1)}</p>
          </div>
          
          <div className="card">
            <h3 className="font-medium text-gray-600 mb-1">Success Rate</h3>
            <p className="text-3xl font-bold text-warning">{summaryStats.successRate.toFixed(1)}%</p>
          </div>
          
          <div className="card md:col-span-2 lg:col-span-4">
            <h3 className="font-medium text-gray-800 mb-4">Plays by Type</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(summaryStats.byPlayType).map(([type, count]) => (
                <div key={type} className="text-center">
                  <p className="text-2xl font-bold text-primary">{count}</p>
                  <p className="text-sm text-gray-600">{type}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeView === 'export' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Save Current View */}
            <div className="card">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Save Current View</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  value={currentViewName}
                  onChange={(e) => setCurrentViewName(e.target.value)}
                  placeholder="Enter view name..."
                  className="form-input"
                />
                <button
                  onClick={saveCurrentView}
                  disabled={!currentViewName.trim()}
                  className="btn btn-primary w-full"
                >
                  Save View
                </button>
              </div>
            </div>

            {/* Export Options */}
            <div className="card">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Export Data</h3>
              <div className="space-y-3">
                <button onClick={exportData} className="btn btn-success w-full">
                  📥 Export as CSV
                </button>
                <p className="text-sm text-gray-600">
                  Exports {filteredData.length} plays with {visibleColumns.length} columns
                </p>
              </div>
            </div>
          </div>

          {/* Saved Views */}
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-4">Saved Views</h3>
            {savedViews.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-600">No saved views yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedViews.map(view => (
                  <div key={view.id} className="card card-interactive" onClick={() => loadView(view)}>
                    <h4 className="font-medium text-gray-800 mb-2">{view.name}</h4>
                    <p className="text-sm text-gray-600 mb-3">{view.description}</p>
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>{view.filters.length} filters</span>
                      <span>{new Date(view.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedDataExplorer;