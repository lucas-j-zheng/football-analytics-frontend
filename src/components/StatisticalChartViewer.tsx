import React, { useState, useEffect } from 'react';
import { consultantService, FilterCondition } from '../services/consultant';

interface StatisticalChartViewerProps {
  teamId: number;
  filters: FilterCondition[];
  selectedPlays: number;
  onClose: () => void;
}

interface ChartRecommendation {
  chart_type: string;
  title: string;
  description: string;
  icon: string;
  priority: number;
  reason: string;
}

const StatisticalChartViewer: React.FC<StatisticalChartViewerProps> = ({
  teamId,
  filters,
  selectedPlays,
  onClose
}) => {
  const [recommendations, setRecommendations] = useState<ChartRecommendation[]>([]);
  const [currentChart, setCurrentChart] = useState<{
    image: string;
    type: string;
    plays_analyzed: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingRecommendations, setLoadingRecommendations] = useState(true);
  const [error, setError] = useState('');
  const [dataSummary, setDataSummary] = useState<any>(null);

  useEffect(() => {
    loadRecommendations();
  }, [teamId, filters, selectedPlays]);

  const loadRecommendations = async () => {
    try {
      setLoadingRecommendations(true);
      const response = await consultantService.getChartRecommendations(teamId, filters, selectedPlays);
      setRecommendations(response.recommendations);
      setDataSummary(response.data_summary);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to load recommendations');
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const generateChart = async (chartType: string, options: any = {}) => {
    try {
      setLoading(true);
      setError('');
      const response = await consultantService.generateStatisticalChart(teamId, chartType, filters, options);
      setCurrentChart({
        image: response.chart_image,
        type: response.chart_type,
        plays_analyzed: response.plays_analyzed
      });
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to generate chart');
    } finally {
      setLoading(false);
    }
  };

  const downloadChart = () => {
    if (!currentChart) return;
    
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${currentChart.image}`;
    link.download = `${currentChart.type}_analysis_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatChartType = (chartType: string) => {
    return chartType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
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
        width: '95%',
        maxWidth: '1400px',
        maxHeight: '95vh',
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
              📊 Statistical Analysis Dashboard
            </h2>
            <p style={{
              color: '#94A3B8',
              fontSize: '14px',
              margin: 0
            }}>
              Generate advanced statistical visualizations and insights
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

        <div style={{ display: 'flex', flex: 1 }}>
          {/* Left Panel - Recommendations */}
          <div style={{
            width: '350px',
            padding: '24px',
            borderRight: '1px solid #334155',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            {/* Data Summary */}
            {dataSummary && (
              <div style={{
                backgroundColor: '#374151',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #4B5563'
              }}>
                <h3 style={{ color: '#FFFFFF', margin: '0 0 12px 0', fontSize: '16px' }}>
                  📈 Data Overview
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94A3B8' }}>Total Plays:</span>
                    <span style={{ color: '#FFFFFF', fontWeight: '600' }}>{dataSummary.total_plays}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94A3B8' }}>Formations:</span>
                    <span style={{ color: '#FFFFFF', fontWeight: '600' }}>{dataSummary.formations}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94A3B8' }}>Avg Yards:</span>
                    <span style={{ color: '#FFFFFF', fontWeight: '600' }}>{dataSummary.avg_yards.toFixed(1)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94A3B8' }}>Applied Filters:</span>
                    <span style={{ color: '#FFFFFF', fontWeight: '600' }}>{filters.length}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Chart Recommendations */}
            <div>
              <h3 style={{ color: '#FFFFFF', margin: '0 0 16px 0', fontSize: '16px' }}>
                🎯 Recommended Charts
              </h3>
              
              {loadingRecommendations ? (
                <div style={{ 
                  padding: '40px 20px', 
                  textAlign: 'center', 
                  color: '#94A3B8' 
                }}>
                  Loading recommendations...
                </div>
              ) : recommendations.length === 0 ? (
                <div style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  color: '#6B7280',
                  border: '2px dashed #4B5563',
                  borderRadius: '8px'
                }}>
                  <p style={{ margin: '0 0 8px 0' }}>No recommendations available</p>
                  <p style={{ margin: 0, fontSize: '12px' }}>Try adjusting your filters</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {recommendations.map((rec, index) => (
                    <div
                      key={index}
                      onClick={() => generateChart(rec.chart_type)}
                      style={{
                        padding: '16px',
                        backgroundColor: currentChart?.type === rec.chart_type ? '#3B82F6' : '#374151',
                        borderRadius: '8px',
                        border: '1px solid #4B5563',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px'
                      }}>
                        <span style={{ fontSize: '20px' }}>{rec.icon}</span>
                        <div style={{ flex: 1 }}>
                          <h4 style={{
                            color: '#FFFFFF',
                            margin: '0 0 4px 0',
                            fontSize: '14px',
                            fontWeight: '600'
                          }}>
                            {rec.title}
                          </h4>
                          <p style={{
                            color: '#94A3B8',
                            margin: '0 0 8px 0',
                            fontSize: '12px',
                            lineHeight: '1.4'
                          }}>
                            {rec.description}
                          </p>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <span style={{
                              fontSize: '10px',
                              color: '#6B7280',
                              backgroundColor: '#1F2937',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              {rec.reason}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Chart Display */}
          <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column' }}>
            {loading ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                gap: '16px'
              }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  border: '4px solid #3B82F6',
                  borderTop: '4px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                <p style={{ color: '#94A3B8', fontSize: '16px', margin: 0 }}>
                  Generating statistical analysis...
                </p>
              </div>
            ) : error ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                gap: '16px'
              }}>
                <div style={{ fontSize: '48px' }}>⚠️</div>
                <p style={{ color: '#EF4444', fontSize: '16px', margin: 0, textAlign: 'center' }}>
                  {error}
                </p>
                <button
                  onClick={() => setError('')}
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
                  Dismiss
                </button>
              </div>
            ) : currentChart ? (
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                {/* Chart Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px'
                }}>
                  <div>
                    <h3 style={{
                      color: '#FFFFFF',
                      margin: '0 0 4px 0',
                      fontSize: '18px',
                      fontWeight: '600'
                    }}>
                      {formatChartType(currentChart.type)}
                    </h3>
                    <p style={{
                      color: '#94A3B8',
                      margin: 0,
                      fontSize: '14px'
                    }}>
                      Analyzing {currentChart.plays_analyzed} plays
                    </p>
                  </div>
                  <button
                    onClick={downloadChart}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#059669',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    📥 Download
                  </button>
                </div>

                {/* Chart Image */}
                <div style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#374151',
                  borderRadius: '8px',
                  border: '1px solid #4B5563',
                  padding: '16px',
                  minHeight: '500px'
                }}>
                  <img
                    src={`data:image/png;base64,${currentChart.image}`}
                    alt={`${currentChart.type} chart`}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain'
                    }}
                  />
                </div>
              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                gap: '16px',
                color: '#6B7280'
              }}>
                <div style={{ fontSize: '64px' }}>📊</div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>
                  Statistical Analysis Ready
                </h3>
                <p style={{ margin: 0, fontSize: '14px', textAlign: 'center' }}>
                  Select a recommended chart type from the left panel to generate<br />
                  professional statistical visualizations of your football data.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Loading Animation CSS */}
        <style>
          {`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    </div>
  );
};

export default StatisticalChartViewer;