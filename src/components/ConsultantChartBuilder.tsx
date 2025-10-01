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

interface ConsultantChartBuilderProps {
  onClose: () => void;
  teamId?: number;
}

const ConsultantChartBuilder: React.FC<ConsultantChartBuilderProps> = ({ onClose, teamId }) => {
  const { consultant } = useAuth();
  const [step, setStep] = useState<'teams' | 'filters' | 'charts' | 'preview'>('teams');
  const [selectedTeam, setSelectedTeam] = useState<number | null>(teamId || null);
  const [teams, setTeams] = useState<any[]>([]);
  const [filters, setFilters] = useState<Filter[]>([]);
  const [playData, setPlayData] = useState<any[]>([]);
  const [chartRecommendations, setChartRecommendations] = useState<ChartOption[]>([]);
  const [selectedChart, setSelectedChart] = useState<string | null>(null);
  const [generatedChart, setGeneratedChart] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

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

  useEffect(() => {
    if (step === 'teams') {
      loadTeams();
    }
  }, [step]);

  const loadTeams = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/consultant/teams', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      const data = await response.json();
      setTeams(data.teams || []);
    } catch (error) {
      setError('Failed to load teams');
    }
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
    if (!selectedTeam) return;

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5001/api/consultant/charts/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          team_id: selectedTeam,
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
    if (!selectedTeam || !selectedChart) return;

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5001/api/consultant/charts/statistical', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          team_id: selectedTeam,
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

  const nextStep = () => {
    if (step === 'teams' && selectedTeam) {
      setStep('filters');
    } else if (step === 'filters') {
      setStep('charts');
      loadChartRecommendations();
    } else if (step === 'charts' && selectedChart) {
      generateChart();
    }
  };

  const getFieldType = (fieldName: string) => {
    const field = availableFields.find(f => f.value === fieldName);
    return field?.type || 'string';
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '800px',
        height: '80%',
        overflow: 'auto',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #eee',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ margin: 0 }}>Custom Chart Builder</h2>
            <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
              {['teams', 'filters', 'charts', 'preview'].map((s, index) => (
                <div
                  key={s}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '15px',
                    backgroundColor: step === s ? '#007bff' : index < ['teams', 'filters', 'charts', 'preview'].indexOf(step) ? '#28a745' : '#f8f9fa',
                    color: step === s || index < ['teams', 'filters', 'charts', 'preview'].indexOf(step) ? 'white' : '#666',
                    fontSize: '12px',
                    textTransform: 'capitalize'
                  }}
                >
                  {index + 1}. {s}
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#999'
            }}
          >
            ×
          </button>
        </div>

        {error && (
          <div style={{
            margin: '20px',
            padding: '10px',
            backgroundColor: '#fee',
            color: 'red',
            borderRadius: '4px'
          }}>
            {error}
          </div>
        )}

        {/* Content */}
        <div style={{ padding: '20px' }}>
          {step === 'teams' && (
            <div>
              <h3>Select Team</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
                {teams.map(team => (
                  <div
                    key={team.id}
                    onClick={() => setSelectedTeam(team.id)}
                    style={{
                      border: selectedTeam === team.id ? '2px solid #007bff' : '1px solid #ddd',
                      borderRadius: '8px',
                      padding: '15px',
                      cursor: 'pointer',
                      backgroundColor: selectedTeam === team.id ? '#f0f8ff' : 'white'
                    }}
                  >
                    <h4 style={{ margin: '0 0 5px 0' }}>{team.team_name}</h4>
                    <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>{team.email}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 'filters' && (
            <div>
              <h3>Add Filters</h3>
              <p style={{ color: '#666', marginBottom: '20px' }}>
                Create filters to focus your analysis. For example: "Distance to first down less than 5" or "Formation equals Shotgun"
              </p>

              {filters.map(filter => (
                <div key={filter.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '200px 150px 200px 40px',
                  gap: '10px',
                  alignItems: 'center',
                  marginBottom: '10px',
                  padding: '10px',
                  border: '1px solid #eee',
                  borderRadius: '4px'
                }}>
                  <select
                    value={filter.field}
                    onChange={(e) => updateFilter(filter.id, { field: e.target.value })}
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                  >
                    <option value="">Select Field</option>
                    {availableFields.map(field => (
                      <option key={field.value} value={field.value}>{field.label}</option>
                    ))}
                  </select>

                  <select
                    value={filter.operator}
                    onChange={(e) => updateFilter(filter.id, { operator: e.target.value })}
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                    disabled={!filter.field}
                  >
                    <option value="">Operator</option>
                    {filter.field && operators[getFieldType(filter.field)]?.map((op: { value: string; label: string }) => (
                      <option key={op.value} value={op.value}>{op.label}</option>
                    ))}
                  </select>

                  <input
                    type={getFieldType(filter.field) === 'number' ? 'number' : 'text'}
                    value={filter.value}
                    onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                    placeholder="Value"
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                    disabled={!filter.operator}
                  />

                  <button
                    onClick={() => removeFilter(filter.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#dc3545',
                      cursor: 'pointer',
                      fontSize: '18px'
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}

              <button
                onClick={addFilter}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginBottom: '20px'
                }}
              >
                + Add Filter
              </button>

              <div style={{ marginTop: '20px' }}>
                <h4>Filter Summary</h4>
                {filters.filter(f => f.field && f.operator).length === 0 ? (
                  <p style={{ color: '#999' }}>No filters applied - will analyze all plays</p>
                ) : (
                  <ul style={{ margin: 0, paddingLeft: '20px' }}>
                    {filters.filter(f => f.field && f.operator).map(filter => {
                      const field = availableFields.find(f => f.value === filter.field);
                      const operator = operators[getFieldType(filter.field)]?.find((o: { value: string; label: string }) => o.value === filter.operator);
                      return (
                        <li key={filter.id}>
                          <strong>{field?.label}</strong> {operator?.label.toLowerCase()} <strong>{filter.value}</strong>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          )}

          {step === 'charts' && (
            <div>
              <h3>Choose Chart Type</h3>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>Loading recommendations...</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
                  {chartRecommendations.map(chart => (
                    <div
                      key={chart.chart_type}
                      onClick={() => setSelectedChart(chart.chart_type)}
                      style={{
                        border: selectedChart === chart.chart_type ? '2px solid #007bff' : '1px solid #ddd',
                        borderRadius: '8px',
                        padding: '15px',
                        cursor: 'pointer',
                        backgroundColor: selectedChart === chart.chart_type ? '#f0f8ff' : 'white'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontSize: '24px', marginRight: '10px' }}>{chart.icon}</span>
                        <h4 style={{ margin: 0 }}>{chart.title}</h4>
                      </div>
                      <p style={{ margin: '0 0 10px 0', color: '#666' }}>{chart.description}</p>
                      <small style={{ color: '#999' }}>{chart.reason}</small>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 'preview' && (
            <div>
              <h3>Generated Chart</h3>
              {generatedChart ? (
                <div style={{ textAlign: 'center' }}>
                  <img 
                    src={`data:image/png;base64,${generatedChart}`} 
                    alt="Generated Chart"
                    style={{ maxWidth: '100%', height: 'auto', border: '1px solid #ddd', borderRadius: '8px' }}
                  />
                  <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    <button
                      onClick={() => setStep('charts')}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Try Different Chart
                    </button>
                    <button
                      style={{
                        padding: '10px 20px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Save & Highlight
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <p>No chart generated yet</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '20px',
          borderTop: '1px solid #eee',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <button
            onClick={() => {
              if (step === 'filters') setStep('teams');
              else if (step === 'charts') setStep('filters');
              else if (step === 'preview') setStep('charts');
            }}
            style={{
              padding: '10px 20px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
            disabled={step === 'teams'}
          >
            Back
          </button>

          <button
            onClick={nextStep}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
            disabled={
              loading ||
              (step === 'teams' && !selectedTeam) ||
              (step === 'charts' && !selectedChart) ||
              step === 'preview'
            }
          >
            {loading ? 'Loading...' : step === 'charts' ? 'Generate Chart' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConsultantChartBuilder;