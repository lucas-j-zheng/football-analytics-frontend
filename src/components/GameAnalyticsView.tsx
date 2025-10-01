import React, { useState } from 'react';
import { GameAnalytics } from '../services/consultant';
import { visualizationService } from '../services/visualization';
import ChartComponent from './ChartComponent';

interface GameAnalyticsViewProps {
  analytics: GameAnalytics;
  onBack: () => void;
}

const GameAnalyticsView: React.FC<GameAnalyticsViewProps> = ({ analytics, onBack }) => {
  const { game, summary, play_type_stats, formation_stats, down_stats } = analytics;
  const [creating, setCreating] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const createChart = async (dataType: string, chartType: 'bar' | 'pie', highlight: boolean = false) => {
    try {
      setCreating(dataType);
      await visualizationService.createChart(game.id, chartType, dataType, highlight);
      setMessage(`${dataType.replace('_', ' ')} chart created successfully!`);
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to create chart');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setCreating(null);
    }
  };

  const renderStatsTable = (title: string, stats: Record<string, any>) => (
    <div style={{ marginBottom: '30px' }}>
      <h4>{title}</h4>
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
        <thead>
          <tr style={{ backgroundColor: '#f8f9fa' }}>
            <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Category</th>
            <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>Plays</th>
            <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>Total Yards</th>
            <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>Avg Yards</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(stats).map(([key, stat]) => (
            <tr key={key}>
              <td style={{ padding: '8px', border: '1px solid #ddd' }}>{key}</td>
              <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>{stat.count}</td>
              <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>{stat.yards}</td>
              <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>{stat.avg_yards}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div style={{ padding: '20px' }}>
      <button
        onClick={onBack}
        style={{
          padding: '8px 16px',
          backgroundColor: '#6c757d',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginBottom: '20px'
        }}
      >
        ← Back to Games
      </button>

      <div style={{ marginBottom: '30px' }}>
        <h2>Game Analytics</h2>
        <h3>Week {game.week} vs {game.opponent} ({game.location})</h3>
  {game.analytics_focus_notes && (
          <div style={{ 
            backgroundColor: '#f8f9fa', 
            padding: '15px', 
            borderRadius: '4px',
            marginTop: '10px'
          }}>
            <strong>Coach's Focus:</strong> {game.analytics_focus_notes}
          </div>
        )}
        
        {message && (
          <div style={{ 
            backgroundColor: message.includes('successfully') ? '#d4edda' : '#f8d7da', 
            color: message.includes('successfully') ? '#155724' : '#721c24',
            padding: '10px', 
            borderRadius: '4px',
            marginTop: '10px'
          }}>
            {message}
          </div>
        )}
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{ 
          backgroundColor: '#e3f2fd', 
          padding: '20px', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h4 style={{ margin: '0 0 10px 0' }}>Total Plays</h4>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{summary.total_plays}</div>
        </div>
        <div style={{ 
          backgroundColor: '#e8f5e8', 
          padding: '20px', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h4 style={{ margin: '0 0 10px 0' }}>Total Yards</h4>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{summary.total_yards}</div>
        </div>
        <div style={{ 
          backgroundColor: '#fff3e0', 
          padding: '20px', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h4 style={{ margin: '0 0 10px 0' }}>Total Points</h4>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{summary.total_points}</div>
        </div>
        <div style={{ 
          backgroundColor: '#fce4ec', 
          padding: '20px', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h4 style={{ margin: '0 0 10px 0' }}>Avg Yards/Play</h4>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{summary.avg_yards_per_play}</div>
        </div>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h3>Create Visualizations</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => createChart('play_type', 'bar', true)}
            disabled={creating === 'play_type'}
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: creating === 'play_type' ? 'not-allowed' : 'pointer'
            }}
          >
            {creating === 'play_type' ? 'Creating...' : 'Highlight Play Type Chart'}
          </button>
          <button
            onClick={() => createChart('formation', 'bar', true)}
            disabled={creating === 'formation'}
            style={{
              padding: '8px 16px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: creating === 'formation' ? 'not-allowed' : 'pointer'
            }}
          >
            {creating === 'formation' ? 'Creating...' : 'Highlight Formation Chart'}
          </button>
          <button
            onClick={() => createChart('down', 'pie', true)}
            disabled={creating === 'down'}
            style={{
              padding: '8px 16px',
              backgroundColor: '#ffc107',
              color: 'black',
              border: 'none',
              borderRadius: '4px',
              cursor: creating === 'down' ? 'not-allowed' : 'pointer'
            }}
          >
            {creating === 'down' ? 'Creating...' : 'Highlight Down Analysis Pie'}
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h3>Live Preview Charts</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '30px' }}>
          <ChartComponent 
            chartData={play_type_stats} 
            chartType="bar" 
            title="Yards per Play Type" 
            dataType="play_type"
          />
          <ChartComponent 
            chartData={formation_stats} 
            chartType="bar" 
            title="Yards per Formation" 
            dataType="formation"
          />
          <ChartComponent 
            chartData={down_stats} 
            chartType="pie" 
            title="Performance by Down" 
            dataType="down"
          />
        </div>
      </div>

      {renderStatsTable('Performance by Play Type', play_type_stats)}
      {renderStatsTable('Performance by Formation', formation_stats)}
      {renderStatsTable('Performance by Down', down_stats)}

      <div style={{ marginTop: '30px' }}>
        <h4>All Plays ({analytics.plays.length})</h4>
        <div style={{ maxHeight: '400px', overflow: 'auto', border: '1px solid #ddd', borderRadius: '4px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8f9fa' }}>
              <tr>
                <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Play #</th>
                <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Down</th>
                <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Distance</th>
                <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Formation</th>
                <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Play Type</th>
                <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Play</th>
                <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Result</th>
                <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>Yards</th>
              </tr>
            </thead>
            <tbody>
              {analytics.plays.map((play) => (
                <tr key={play.id}>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>{play.play_id}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>{play.down}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>{play.distance}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>{play.formation}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>{play.play_type}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>{play.play_name}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>{play.result_of_play}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>{play.yards_gained}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default GameAnalyticsView;