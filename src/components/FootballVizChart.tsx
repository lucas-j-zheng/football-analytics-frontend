import React, { useState, useEffect } from 'react';
import api from '../services/api';

interface FootballVizChartProps {
  chartType: string;
  gameId: number;
  theme?: string;
  teamColors?: {
    primary?: string;
    secondary?: string;
  };
  options?: {
    show_comparison?: boolean;
    comparison_game_id?: number;
    show_league_average?: boolean;
    show_performance_zones?: boolean;
  };
  onError?: (error: string) => void;
}

interface ChartData {
  chart_image: string;
  chart_config: any;
  processed_data: any;
}

const FootballVizChart: React.FC<FootballVizChartProps> = ({
  chartType,
  gameId,
  theme = 'charcoal_professional',
  teamColors,
  options = {},
  onError
}) => {
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    generateChart();
  }, [chartType, gameId, theme, JSON.stringify(teamColors), JSON.stringify(options)]);

  const generateChart = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/footballviz/charts/generate', {
        chart_type: chartType,
        game_id: gameId,
        theme,
        team_colors: teamColors,
        options
      });

      setChartData(response.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to generate chart';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: string = 'png') => {
    if (!chartData) return;

    try {
      // Create download link for base64 image
      const link = document.createElement('a');
      link.href = chartData.chart_image;
      link.download = `football_chart_${chartType}_${gameId}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '400px',
        backgroundColor: '#1C1C1E',
        borderRadius: '12px',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{ textAlign: 'center', color: '#FFFFFF' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #3b82f6',
            borderTop: '4px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p>Generating chart...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: '24px',
        backgroundColor: '#1C1C1E',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
        <h3 style={{ color: '#FFFFFF', margin: '0 0 8px 0' }}>Chart Generation Failed</h3>
        <p style={{ color: '#E5E5E7', margin: '0 0 16px 0' }}>{error}</p>
        <button
          onClick={generateChart}
          style={{
            padding: '10px 16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!chartData) {
    return null;
  }

  return (
    <div style={{
      backgroundColor: '#1C1C1E',
      borderRadius: '12px',
      border: '1px solid #e5e7eb',
      overflow: 'hidden'
    }}>
      {/* Chart Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 20px',
        borderBottom: '1px solid #2D3E2F',
        backgroundColor: '#2D3E2F'
      }}>
        <div>
          <h3 style={{
            margin: 0,
            color: '#FFFFFF',
            fontSize: '16px',
            fontWeight: '600'
          }}>
            {chartType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Analysis
          </h3>
          <p style={{
            margin: '4px 0 0 0',
            color: '#E5E5E7',
            fontSize: '12px'
          }}>
            Game ID: {gameId} | Theme: {theme}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => handleExport('png')}
            style={{
              padding: '8px 12px',
              backgroundColor: '#059669',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            📥 Export PNG
          </button>
          <button
            onClick={generateChart}
            style={{
              padding: '8px 12px',
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Chart Image */}
      <div style={{ padding: '0' }}>
        <img
          src={chartData.chart_image}
          alt={`${chartType} chart`}
          style={{
            width: '100%',
            height: 'auto',
            display: 'block'
          }}
        />
      </div>

      {/* Chart Info */}
      {chartData.processed_data && (
        <div style={{
          padding: '16px 20px',
          backgroundColor: '#2D3E2F',
          borderTop: '1px solid #374151'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '16px',
            fontSize: '12px'
          }}>
            <div>
              <span style={{ color: '#9CA3AF' }}>Total Plays: </span>
              <span style={{ color: '#FFFFFF', fontWeight: '600' }}>
                {chartData.processed_data.summary?.total_plays || 'N/A'}
              </span>
            </div>
            <div>
              <span style={{ color: '#9CA3AF' }}>Formations: </span>
              <span style={{ color: '#FFFFFF', fontWeight: '600' }}>
                {chartData.processed_data.formations_count || 0}
              </span>
            </div>
            <div>
              <span style={{ color: '#9CA3AF' }}>Play Types: </span>
              <span style={{ color: '#FFFFFF', fontWeight: '600' }}>
                {chartData.processed_data.play_types_count || 0}
              </span>
            </div>
            <div>
              <span style={{ color: '#9CA3AF' }}>Success Rate: </span>
              <span style={{ color: '#FFFFFF', fontWeight: '600' }}>
                {chartData.processed_data.summary?.success_rate?.toFixed(1) || 0}%
              </span>
            </div>
          </div>
        </div>
      )}

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
  );
};

export default FootballVizChart;