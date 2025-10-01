import React, { useState } from 'react';

interface QueryStats {
  total_plays: number;
  avg_yards_gained: number;
  success_rate: number;
  formations_count: number;
  play_types_count: number;
}

interface AdvancedChartBuilderProps {
  queryResults: any[];
  onClose: () => void;
  gameId: number | null;
  queryStats: QueryStats | null;
}

interface ChartConfig {
  chartType: string;
  xAxis: string;
  yAxis: string;
  aggregation: string;
  groupBy?: string;
  colorBy?: string;
  title: string;
}

const AdvancedChartBuilder: React.FC<AdvancedChartBuilderProps> = ({
  queryResults,
  onClose,
  gameId,
  queryStats
}) => {
  const [chartConfig, setChartConfig] = useState<ChartConfig>({
    chartType: 'bar',
    xAxis: 'formation',
    yAxis: 'yards_gained',
    aggregation: 'avg',
    title: 'Custom Analysis'
  });
  const [chartImage, setChartImage] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const chartTypes = [
    { value: 'bar', label: 'Bar Chart', icon: '📊', description: 'Compare categories' },
    { value: 'line', label: 'Line Chart', icon: '📈', description: 'Show trends over time' },
    { value: 'scatter', label: 'Scatter Plot', icon: '⚡', description: 'Show relationships' },
    { value: 'pie', label: 'Pie Chart', icon: '🥧', description: 'Show proportions' },
    { value: 'heatmap', label: 'Heat Map', icon: '🔥', description: 'Show intensity patterns' },
    { value: 'histogram', label: 'Histogram', icon: '📊', description: 'Show distributions' }
  ];

  const numericFields = [
    { value: 'yards_gained', label: 'Yards Gained' },
    { value: 'yard_line', label: 'Yard Line' },
    { value: 'down', label: 'Down' },
    { value: 'distance', label: 'Distance' },
    { value: 'play_id', label: 'Play Number' }
  ];

  const categoricalFields = [
    { value: 'formation', label: 'Formation' },
    { value: 'play_type', label: 'Play Type' },
    { value: 'result_of_play', label: 'Result' },
    { value: 'play_name', label: 'Play Name' }
  ];

  const aggregationTypes = [
    { value: 'avg', label: 'Average', description: 'Mean value' },
    { value: 'sum', label: 'Sum', description: 'Total value' },
    { value: 'count', label: 'Count', description: 'Number of plays' },
    { value: 'max', label: 'Maximum', description: 'Highest value' },
    { value: 'min', label: 'Minimum', description: 'Lowest value' },
    { value: 'median', label: 'Median', description: 'Middle value' }
  ];

  const generateChart = async () => {
    setLoading(true);
    // In a real implementation, this would call the FootballViz API
    // to generate a custom chart based on the query results and configuration
    
    // Simulate chart generation
    setTimeout(() => {
      // This would be replaced with actual chart generation
      setChartImage('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
      setLoading(false);
    }, 2000);
  };

  const getFieldsForAxis = (isXAxis: boolean) => {
    if (chartConfig.chartType === 'scatter') {
      return numericFields; // Both axes should be numeric for scatter plots
    }
    
    if (isXAxis) {
      // X-axis typically categorical for most chart types
      return chartConfig.chartType === 'histogram' ? numericFields : categoricalFields;
    } else {
      // Y-axis typically numeric
      return numericFields;
    }
  };

  const exportChart = () => {
    if (!chartImage) return;
    
    const link = document.createElement('a');
    link.href = chartImage;
    link.download = `${chartConfig.title.replace(/\s+/g, '_').toLowerCase()}_custom_chart.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      zIndex: 1000
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
              📊 Custom Chart Builder
            </h2>
            <p style={{
              color: '#94A3B8',
              fontSize: '14px',
              margin: 0
            }}>
              Create visualizations from your {queryResults.length} filtered plays
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

        {/* Content */}
        <div style={{ padding: '24px', display: 'flex', gap: '24px', flex: 1 }}>
          {/* Configuration Panel */}
          <div style={{ 
            width: '300px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            {/* Chart Type Selection */}
            <div>
              <h3 style={{ color: '#FFFFFF', margin: '0 0 12px 0', fontSize: '16px' }}>
                Chart Type
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {chartTypes.map(type => (
                  <button
                    key={type.value}
                    onClick={() => setChartConfig(prev => ({ ...prev, chartType: type.value }))}
                    style={{
                      padding: '12px 8px',
                      backgroundColor: chartConfig.chartType === type.value ? '#3B82F6' : '#374151',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>{type.icon}</span>
                    <span>{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Chart Title */}
            <div>
              <label style={{ color: '#FFFFFF', fontSize: '14px', fontWeight: '600' }}>
                Chart Title
              </label>
              <input
                type="text"
                value={chartConfig.title}
                onChange={(e) => setChartConfig(prev => ({ ...prev, title: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#0F172A',
                  color: '#FFFFFF',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                  fontSize: '14px',
                  marginTop: '8px'
                }}
                placeholder="Enter chart title..."
              />
            </div>

            {/* X-Axis Configuration */}
            <div>
              <label style={{ color: '#FFFFFF', fontSize: '14px', fontWeight: '600' }}>
                X-Axis (Horizontal)
              </label>
              <select
                value={chartConfig.xAxis}
                onChange={(e) => setChartConfig(prev => ({ ...prev, xAxis: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#0F172A',
                  color: '#FFFFFF',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                  fontSize: '14px',
                  marginTop: '8px'
                }}
              >
                {getFieldsForAxis(true).map(field => (
                  <option key={field.value} value={field.value}>
                    {field.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Y-Axis Configuration */}
            <div>
              <label style={{ color: '#FFFFFF', fontSize: '14px', fontWeight: '600' }}>
                Y-Axis (Vertical)
              </label>
              <select
                value={chartConfig.yAxis}
                onChange={(e) => setChartConfig(prev => ({ ...prev, yAxis: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#0F172A',
                  color: '#FFFFFF',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                  fontSize: '14px',
                  marginTop: '8px'
                }}
              >
                {getFieldsForAxis(false).map(field => (
                  <option key={field.value} value={field.value}>
                    {field.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Aggregation */}
            <div>
              <label style={{ color: '#FFFFFF', fontSize: '14px', fontWeight: '600' }}>
                Aggregation
              </label>
              <select
                value={chartConfig.aggregation}
                onChange={(e) => setChartConfig(prev => ({ ...prev, aggregation: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#0F172A',
                  color: '#FFFFFF',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                  fontSize: '14px',
                  marginTop: '8px'
                }}
              >
                {aggregationTypes.map(agg => (
                  <option key={agg.value} value={agg.value}>
                    {agg.label} - {agg.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Group By (Optional) */}
            <div>
              <label style={{ color: '#FFFFFF', fontSize: '14px', fontWeight: '600' }}>
                Group By (Optional)
              </label>
              <select
                value={chartConfig.groupBy || ''}
                onChange={(e) => setChartConfig(prev => ({ 
                  ...prev, 
                  groupBy: e.target.value || undefined 
                }))}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#0F172A',
                  color: '#FFFFFF',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                  fontSize: '14px',
                  marginTop: '8px'
                }}
              >
                <option value="">No grouping</option>
                {categoricalFields.map(field => (
                  <option key={field.value} value={field.value}>
                    {field.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Generate Button */}
            <button
              onClick={generateChart}
              disabled={loading}
              style={{
                padding: '16px',
                backgroundColor: loading ? '#6B7280' : '#10B981',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: 'auto'
              }}
            >
              {loading ? '🔄 Generating...' : '✨ Generate Chart'}
            </button>
          </div>

          {/* Chart Preview */}
          <div style={{ 
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            {/* Data Summary */}
            <div style={{
              backgroundColor: '#374151',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid #4B5563'
            }}>
              <h4 style={{ color: '#FFFFFF', margin: '0 0 12px 0', fontSize: '14px' }}>
                📈 Data Summary
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#94A3B8', fontSize: '12px' }}>Total Plays</div>
                  <div style={{ color: '#FFFFFF', fontSize: '18px', fontWeight: '600' }}>
                    {queryStats?.total_plays || queryResults.length}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#94A3B8', fontSize: '12px' }}>Avg Yards</div>
                  <div style={{ color: '#FFFFFF', fontSize: '18px', fontWeight: '600' }}>
                    {queryStats?.avg_yards_gained?.toFixed(1) || 'N/A'}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#94A3B8', fontSize: '12px' }}>Success Rate</div>
                  <div style={{ 
                    color: (queryStats?.success_rate || 0) >= 50 ? '#10B981' : '#EF4444', 
                    fontSize: '18px', 
                    fontWeight: '600' 
                  }}>
                    {queryStats?.success_rate?.toFixed(1) || 0}%
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#94A3B8', fontSize: '12px' }}>Formations</div>
                  <div style={{ color: '#FFFFFF', fontSize: '18px', fontWeight: '600' }}>
                    {queryStats?.formations_count || 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            {/* Chart Display */}
            <div style={{
              flex: 1,
              backgroundColor: '#374151',
              borderRadius: '8px',
              border: '1px solid #4B5563',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '400px',
              position: 'relative'
            }}>
              {loading ? (
                <div style={{ textAlign: 'center', color: '#94A3B8' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    border: '4px solid #3B82F6',
                    borderTop: '4px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 16px'
                  }} />
                  <p>Generating your custom chart...</p>
                </div>
              ) : chartImage ? (
                <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                  <img
                    src={chartImage}
                    alt={chartConfig.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      borderRadius: '8px'
                    }}
                  />
                  <button
                    onClick={exportChart}
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      padding: '8px 12px',
                      backgroundColor: '#059669',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    📥 Export
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: '#6B7280' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
                  <p style={{ margin: '0 0 8px 0', fontSize: '16px' }}>
                    Chart Preview
                  </p>
                  <p style={{ margin: 0, fontSize: '14px' }}>
                    Configure your chart options and click "Generate Chart" to see the visualization
                  </p>
                </div>
              )}
            </div>
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

export default AdvancedChartBuilder;