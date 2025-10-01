import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface Filter {
  id: string;
  field: string;
  operator: string;
  value: any;
  label: string;
}

interface ChartOption {
  chart_type: string;
  title: string;
  description: string;
  icon: string;
  priority: number;
  reason: string;
}

interface ChartTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  chart_type: string;
  preset_filters: Filter[];
  category: 'offensive' | 'defensive' | 'special_teams' | 'general';
}

interface SavedChart {
  id: string;
  name: string;
  chart_type: string;
  filters: Filter[];
  created_at: string;
  chart_image?: string;
  team_name: string;
}

interface EnhancedCustomChartBuilderProps {
  teamId: number;
  teamName: string;
}

const EnhancedCustomChartBuilder: React.FC<EnhancedCustomChartBuilderProps> = ({ teamId, teamName }) => {
  const { consultant } = useAuth();
  const [activeSection, setActiveSection] = useState<'templates' | 'custom' | 'history'>('templates');
  const [step, setStep] = useState<'filters' | 'charts' | 'preview'>('filters');
  const [filters, setFilters] = useState<Filter[]>([]);
  const [chartRecommendations, setChartRecommendations] = useState<ChartOption[]>([]);
  const [selectedChart, setSelectedChart] = useState<string | null>(null);
  const [generatedChart, setGeneratedChart] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [savedCharts, setSavedCharts] = useState<SavedChart[]>([]);
  const [chartName, setChartName] = useState('');

  const availableFields = [
    { value: 'down', label: 'Down', type: 'number' },
    { value: 'distance', label: 'Distance to First Down', type: 'number' },
    { value: 'yard_line', label: 'Yard Line', type: 'number' },
    { value: 'formation', label: 'Formation', type: 'string' },
    { value: 'play_type', label: 'Play Type', type: 'string' },
    { value: 'play_name', label: 'Play Name', type: 'string' },
    { value: 'result_of_play', label: 'Result of Play', type: 'string' },
    { value: 'yards_gained', label: 'Yards Gained', type: 'number' },
    { value: 'points_scored', label: 'Points Scored', type: 'number' },
    { value: 'unit', label: 'Unit (O/D/ST)', type: 'string' },
    { value: 'game_week', label: 'Game Week', type: 'number' },
    { value: 'game_opponent', label: 'Opponent', type: 'string' }
  ];

  const operators: Record<string, { value: string; label: string }[]> = {
    number: [
      { value: 'equals', label: 'Equals' },
      { value: 'not_equals', label: 'Not Equals' },
      { value: 'greater_than', label: 'Greater Than' },
      { value: 'less_than', label: 'Less Than' },
      { value: 'greater_equal', label: 'Greater or Equal' },
      { value: 'less_equal', label: 'Less or Equal' }
    ],
    string: [
      { value: 'equals', label: 'Equals' },
      { value: 'not_equals', label: 'Not Equals' },
      { value: 'contains', label: 'Contains' },
      { value: 'in', label: 'In List' }
    ]
  };

  // Chart Templates
  const chartTemplates: ChartTemplate[] = [
    {
      id: 'run_vs_pass',
      name: 'Run vs Pass',
      description: 'How well do we run vs pass?',
      icon: '🏃',
      chart_type: 'play_type_comparison',
      preset_filters: [],
      category: 'offensive'
    },
    {
      id: 'red_zone_scoring',
      name: 'Red Zone Scoring',
      description: 'Do we score touchdowns in the red zone?',
      icon: '🎯',
      chart_type: 'situational',
      preset_filters: [
        { id: '1', field: 'yard_line', operator: 'greater_equal', value: 80, label: 'Red Zone (80+ yard line)' }
      ],
      category: 'offensive'
    },
    {
      id: 'third_down_success',
      name: 'Third Down Success',
      description: 'Are we converting third downs?',
      icon: '🔄',
      chart_type: 'situational',
      preset_filters: [
        { id: '2', field: 'down', operator: 'equals', value: 3, label: 'Third Down' }
      ],
      category: 'offensive'
    },
    {
      id: 'big_plays',
      name: 'Big Plays',
      description: 'How often do we get big gains?',
      icon: '💥',
      chart_type: 'distribution',
      preset_filters: [
        { id: '3', field: 'yards_gained', operator: 'greater_equal', value: 15, label: 'Big Plays (15+ yards)' }
      ],
      category: 'offensive'
    },
    {
      id: 'by_opponent',
      name: 'By Opponent',
      description: 'How did we do against each team?',
      icon: '🏈',
      chart_type: 'opponent_comparison',
      preset_filters: [],
      category: 'general'
    },
    {
      id: 'formation_success',
      name: 'Best Formations',
      description: 'Which formations work best for us?',
      icon: '📐',
      chart_type: 'formation_comparison',
      preset_filters: [],
      category: 'offensive'
    },
    {
      id: 'short_yardage',
      name: 'Short Yardage',
      description: 'Do we get the tough yards when we need them?',
      icon: '⚡',
      chart_type: 'situational',
      preset_filters: [
        { id: '4', field: 'distance', operator: 'less_equal', value: 3, label: 'Short yardage (3 yards or less)' }
      ],
      category: 'offensive'
    },
    {
      id: 'by_quarter',
      name: 'By Quarter',
      description: 'How do we perform in each quarter?',
      icon: '⏱️',
      chart_type: 'quarter_comparison',
      preset_filters: [],
      category: 'general'
    },
    {
      id: 'home_vs_away',
      name: 'Home vs Away',
      description: 'Do we play better at home or away?',
      icon: '🏟️',
      chart_type: 'location_comparison',
      preset_filters: [],
      category: 'general'
    }
  ];

  useEffect(() => {
    loadSavedCharts();
  }, [teamId]);

  const loadSavedCharts = async () => {
    // Mock data for now - in real app this would be an API call
    const mockSavedCharts: SavedChart[] = [
      {
        id: '1',
        name: 'Red Zone Success - First 5 Games',
        chart_type: 'situational',
        filters: [{ id: '1', field: 'yard_line', operator: 'greater_equal', value: 80, label: 'Red Zone' }],
        created_at: new Date().toISOString(),
        team_name: teamName
      },
      {
        id: '2',
        name: 'How We Did vs Eagles',
        chart_type: 'opponent_comparison',
        filters: [{ id: '2', field: 'game_opponent', operator: 'equals', value: 'Eagles', label: 'vs Eagles' }],
        created_at: new Date(Date.now() - 86400000).toISOString(),
        team_name: teamName
      },
      {
        id: '3',
        name: 'Third Down Conversions - Home Games',
        chart_type: 'situational',
        filters: [
          { id: '3a', field: 'down', operator: 'equals', value: 3, label: 'Third Down' },
          { id: '3b', field: 'location', operator: 'equals', value: 'Home', label: 'Home Games' }
        ],
        created_at: new Date(Date.now() - 172800000).toISOString(),
        team_name: teamName
      }
    ];
    setSavedCharts(mockSavedCharts);
  };

  const applyTemplate = (template: ChartTemplate) => {
    setFilters(template.preset_filters);
    setSelectedChart(template.chart_type);
    setActiveSection('custom');
    setStep('charts');
  };

  const addFilter = () => {
    const newFilter: Filter = {
      id: Date.now().toString(),
      field: '',
      operator: '',
      value: '',
      label: ''
    };
    setFilters([...filters, newFilter]);
  };

  const updateFilter = (id: string, updates: Partial<Filter>) => {
    setFilters(filters.map(filter => 
      filter.id === id ? { ...filter, ...updates } : filter
    ));
  };

  const removeFilter = (id: string) => {
    setFilters(filters.filter(filter => filter.id !== id));
  };

  const loadChartRecommendations = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5001/api/consultant/charts/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          team_id: teamId,
          filters: filters.filter(f => f.field && f.operator)
        })
      });

      const data = await response.json();
      if (response.ok) {
        setChartRecommendations(data.recommendations || []);
      } else {
        setError(data.message || 'Failed to load recommendations');
      }
    } catch (error) {
      setError('Failed to load chart recommendations');
    } finally {
      setLoading(false);
    }
  };

  const generateChart = async () => {
    if (!selectedChart) return;

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5001/api/consultant/charts/statistical', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          team_id: teamId,
          chart_type: selectedChart,
          filters: filters.filter(f => f.field && f.operator),
          options: {}
        })
      });

      const data = await response.json();
      if (response.ok) {
        setGeneratedChart(data.chart_image);
        setStep('preview');
      } else {
        setError(data.message || 'Failed to generate chart');
      }
    } catch (error) {
      setError('Failed to generate chart');
    } finally {
      setLoading(false);
    }
  };

  const saveChart = async () => {
    if (!generatedChart || !chartName.trim()) return;

    const newSavedChart: SavedChart = {
      id: Date.now().toString(),
      name: chartName.trim(),
      chart_type: selectedChart || '',
      filters: filters.filter(f => f.field && f.operator),
      created_at: new Date().toISOString(),
      chart_image: generatedChart,
      team_name: teamName
    };

    setSavedCharts([newSavedChart, ...savedCharts]);
    setChartName('');
    setActiveSection('history');
  };

  const loadSavedChart = (chart: SavedChart) => {
    setFilters(chart.filters);
    setSelectedChart(chart.chart_type);
    if (chart.chart_image) {
      setGeneratedChart(chart.chart_image);
      setStep('preview');
    } else {
      setStep('charts');
    }
    setActiveSection('custom');
  };

  const getFieldType = (fieldName: string) => {
    const field = availableFields.find(f => f.value === fieldName);
    return field?.type || 'string';
  };

  // Section Navigation
  const SectionTabs = () => (
    <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg">
      {[
        { id: 'templates', label: 'Templates', icon: '📋' },
        { id: 'custom', label: 'Custom Builder', icon: '🛠️' },
        { id: 'history', label: 'Chart History', icon: '📚' }
      ].map((section) => (
        <button
          key={section.id}
          onClick={() => setActiveSection(section.id as any)}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
            activeSection === section.id
              ? 'bg-white shadow-sm text-primary border border-gray-200'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
          }`}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'scale(0.98)';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
          style={{
            boxShadow: activeSection === section.id ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none'
          }}
        >
          <span>{section.icon}</span>
          {section.label}
        </button>
      ))}
    </div>
  );

  // Templates Section - 3x3 Grid Layout
  const TemplatesSection = () => {
    // Arrange templates in logical order for 3x3 grid
    const gridTemplates = [
      // Row 1: Core Offensive Analysis
      chartTemplates.find(t => t.id === 'run_vs_pass'),
      chartTemplates.find(t => t.id === 'red_zone_scoring'),
      chartTemplates.find(t => t.id === 'third_down_success'),
      // Row 2: Situational Analysis
      chartTemplates.find(t => t.id === 'big_plays'),
      chartTemplates.find(t => t.id === 'formation_success'),
      chartTemplates.find(t => t.id === 'short_yardage'),
      // Row 3: Game Context Analysis
      chartTemplates.find(t => t.id === 'by_opponent'),
      chartTemplates.find(t => t.id === 'by_quarter'),
      chartTemplates.find(t => t.id === 'home_vs_away')
    ];

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Chart Templates</h3>
          <p className="text-gray-600">
            Quick-start templates for common football analytics scenarios.
          </p>
        </div>

        {/* 3x3 Grid */}
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-3 gap-6">
            {gridTemplates.map((template, index) => (
              <button
                key={template?.id || `template-${index}`}
                onClick={() => template && applyTemplate(template)}
                className="chart-template-btn group"
              >
                {template && (
                  <>
                    {/* Icon */}
                    <div className="text-4xl mb-3 group-hover:scale-110 group-active:scale-105 transition-transform duration-200">
                      {template.icon}
                    </div>
                    
                    {/* Title */}
                    <h4 className="text-base font-semibold text-gray-800 text-center mb-2 group-hover:text-blue-700 group-active:text-blue-800 transition-colors duration-200">
                      {template.name}
                    </h4>
                    
                    {/* Description */}
                    <p className="text-sm text-gray-500 text-center leading-tight line-clamp-2 mb-3 group-hover:text-gray-600 transition-colors duration-200">
                      {template.description}
                    </p>
                    
                    {/* Filter indicator */}
                    <div className="mt-auto">
                      <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium group-hover:bg-blue-200 group-hover:text-blue-800 group-active:bg-blue-300 transition-all duration-200">
                        {template.preset_filters.length} {template.preset_filters.length === 1 ? 'filter' : 'filters'}
                      </span>
                    </div>
                  </>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Row Labels */}
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-3 gap-6 text-center">
            <div className="space-y-1">
              <h5 className="text-sm font-medium text-gray-600">Core Offense</h5>
              <p className="text-xs text-gray-400">Run/Pass • Red Zone • 3rd Down</p>
            </div>
            <div className="space-y-1">
              <h5 className="text-sm font-medium text-gray-600">Situational</h5>
              <p className="text-xs text-gray-400">Big Plays • Formations • Short Yardage</p>
            </div>
            <div className="space-y-1">
              <h5 className="text-sm font-medium text-gray-600">Game Context</h5>
              <p className="text-xs text-gray-400">Opponents • Quarters • Home/Away</p>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            Click any template to get started • 9 templates organized by analysis type
          </p>
        </div>
      </div>
    );
  };

  // Custom Builder Section
  const CustomBuilderSection = () => (
    <div className="space-y-6">
      {/* Step Progress */}
      <div className="flex items-center gap-4 mb-6">
        {[
          { id: 'filters', label: 'Filters', number: 1 },
          { id: 'charts', label: 'Chart Type', number: 2 },
          { id: 'preview', label: 'Preview', number: 3 }
        ].map((stepItem, index) => (
          <div key={stepItem.id} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === stepItem.id 
                ? 'bg-primary text-white' 
                : index < ['filters', 'charts', 'preview'].indexOf(step)
                  ? 'bg-success text-white'
                  : 'bg-gray-200 text-gray-600'
            }`}>
              {index < ['filters', 'charts', 'preview'].indexOf(step) ? '✓' : stepItem.number}
            </div>
            <span className={`text-sm font-medium ${
              step === stepItem.id ? 'text-primary' : 'text-gray-600'
            }`}>
              {stepItem.label}
            </span>
            {index < 2 && <div className="w-8 h-px bg-gray-300" />}
          </div>
        ))}
      </div>

      {/* Step Content */}
      {step === 'filters' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Add Filters</h3>
            <p className="text-gray-600 text-sm mb-4">
              Create filters to focus your analysis. For example: "Distance to first down less than 5" or "Formation equals Shotgun"
            </p>
          </div>

          {filters.map(filter => (
            <div key={filter.id} className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                <div>
                  <label className="form-label">Field</label>
                  <select
                    value={filter.field}
                    onChange={(e) => updateFilter(filter.id, { field: e.target.value })}
                    className="form-input"
                  >
                    <option value="">Select Field</option>
                    {availableFields.map(field => (
                      <option key={field.value} value={field.value}>{field.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">Operator</label>
                  <select
                    value={filter.operator}
                    onChange={(e) => updateFilter(filter.id, { operator: e.target.value })}
                    className="form-input"
                    disabled={!filter.field}
                  >
                    <option value="">Operator</option>
                    {filter.field && operators[getFieldType(filter.field)]?.map((op: { value: string; label: string }) => (
                      <option key={op.value} value={op.value}>{op.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">Value</label>
                  <input
                    type={getFieldType(filter.field) === 'number' ? 'number' : 'text'}
                    value={filter.value}
                    onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                    placeholder="Value"
                    className="form-input"
                    disabled={!filter.operator}
                  />
                </div>

                <button
                  onClick={() => removeFilter(filter.id)}
                  className="btn btn-error btn-sm self-end"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={addFilter}
            className="btn btn-secondary"
          >
            + Add Filter
          </button>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-800 mb-2">Filter Summary</h4>
            {filters.filter(f => f.field && f.operator).length === 0 ? (
              <p className="text-gray-600 text-sm">No filters applied - will analyze all plays</p>
            ) : (
              <ul className="space-y-1">
                {filters.filter(f => f.field && f.operator).map(filter => {
                  const field = availableFields.find(f => f.value === filter.field);
                  const operator = operators[getFieldType(filter.field)]?.find((o: { value: string; label: string }) => o.value === filter.operator);
                  return (
                    <li key={filter.id} className="text-sm">
                      <strong>{field?.label}</strong> {operator?.label.toLowerCase()} <strong>{filter.value}</strong>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => {
                setStep('charts');
                loadChartRecommendations();
              }}
              className="btn btn-primary"
            >
              Next: Choose Chart Type
            </button>
          </div>
        </div>
      )}

      {step === 'charts' && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-800">Choose Chart Type</h3>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="spinner spinner-lg"></div>
              <span className="ml-3 text-gray-600">Loading recommendations...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {chartRecommendations.map(chart => (
                <div
                  key={chart.chart_type}
                  onClick={() => setSelectedChart(chart.chart_type)}
                  className={`card card-interactive ${
                    selectedChart === chart.chart_type ? 'border-primary bg-primary/5' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{chart.icon}</span>
                    <h4 className="font-medium">{chart.title}</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{chart.description}</p>
                  <small className="text-gray-500">{chart.reason}</small>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-between">
            <button
              onClick={() => setStep('filters')}
              className="btn btn-secondary"
            >
              Back
            </button>
            <button
              onClick={generateChart}
              disabled={!selectedChart || loading}
              className="btn btn-primary"
            >
              {loading ? 'Generating...' : 'Generate Chart'}
            </button>
          </div>
        </div>
      )}

      {step === 'preview' && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-800">Generated Chart</h3>
          {generatedChart ? (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <img 
                  src={`data:image/png;base64,${generatedChart}`} 
                  alt="Generated Chart"
                  className="w-full h-auto rounded-md"
                />
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="form-label">Save Chart (Optional)</label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={chartName}
                    onChange={(e) => setChartName(e.target.value)}
                    placeholder="Enter chart name..."
                    className="form-input flex-1"
                  />
                  <button
                    onClick={saveChart}
                    disabled={!chartName.trim()}
                    className="btn btn-success"
                  >
                    Save Chart
                  </button>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep('charts')}
                  className="btn btn-secondary"
                >
                  Try Different Chart
                </button>
                <button
                  onClick={() => {
                    setStep('filters');
                    setGeneratedChart(null);
                    setSelectedChart(null);
                  }}
                  className="btn btn-primary"
                >
                  Create New Chart
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">No chart generated yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // History Section
  const HistorySection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Chart History</h3>
        <p className="text-gray-600 text-sm">
          Previously created charts for {teamName}
        </p>
      </div>

      {savedCharts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="text-4xl mb-4">📊</div>
          <h4 className="font-medium text-gray-800 mb-2">No Saved Charts</h4>
          <p className="text-gray-600 text-sm">Create and save charts to see them here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {savedCharts.map((chart) => (
            <div
              key={chart.id}
              className="card card-interactive"
              onClick={() => loadSavedChart(chart)}
            >
              <div className="flex items-start justify-between mb-3">
                <h5 className="font-medium text-gray-800">{chart.name}</h5>
                <span className="text-xs text-gray-500">
                  {new Date(chart.created_at).toLocaleDateString()}
                </span>
              </div>
              
              {chart.chart_image && (
                <div className="mb-3">
                  <img 
                    src={`data:image/png;base64,${chart.chart_image}`}
                    alt={chart.name}
                    className="w-full h-24 object-cover rounded-md bg-gray-100"
                  />
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="badge badge-primary">{chart.chart_type}</span>
                  <span className="text-xs text-gray-500">
                    {chart.filters.length} filter{chart.filters.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <p className="text-primary text-sm font-medium">Load Chart →</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Custom Chart Builder</h2>
        <p className="text-gray-600">
          Create custom visualizations for {teamName} using templates, custom filters, or saved charts.
        </p>
      </div>

      {error && (
        <div className="bg-error/10 border border-error/20 text-error p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      <SectionTabs />

      {activeSection === 'templates' && <TemplatesSection />}
      {activeSection === 'custom' && <CustomBuilderSection />}
      {activeSection === 'history' && <HistorySection />}
    </div>
  );
};

export default EnhancedCustomChartBuilder;