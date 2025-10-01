import React from 'react';
import { Visualization } from '../types/visualization';
import ChartComponent from './ChartComponent';

interface VisualizationDisplayProps {
  visualizations: Visualization[];
}

const VisualizationDisplay: React.FC<VisualizationDisplayProps> = ({ visualizations }) => {
  if (visualizations.length === 0) {
    return (
      <div style={{ 
        border: '2px dashed #ccc', 
        padding: '40px', 
        textAlign: 'center',
        borderRadius: '8px'
      }}>
        <h4>No insights available yet</h4>
        <p>Your consultant hasn't highlighted any insights for your games yet.</p>
      </div>
    );
  }

  return (
    <div>
      {visualizations.map((viz) => (
        <div key={viz.id} style={{ 
          marginBottom: '30px', 
          border: '1px solid #ddd', 
          borderRadius: '8px', 
          padding: '20px',
          backgroundColor: viz.is_highlighted ? '#f8f9fa' : 'white'
        }}>
          <div style={{ marginBottom: '15px' }}>
            <h4 style={{ margin: '0 0 5px 0' }}>
              {viz.title}
              {viz.is_highlighted && (
                <span style={{ 
                  marginLeft: '10px', 
                  padding: '2px 8px', 
                  backgroundColor: '#ffc107', 
                  color: '#000',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 'normal'
                }}>
                  Highlighted
                </span>
              )}
            </h4>
            {viz.description && (
              <p style={{ margin: '5px 0', color: '#666' }}>{viz.description}</p>
            )}
            <small style={{ color: '#999' }}>
              Created by consultant on {new Date(viz.created_at).toLocaleDateString()}
            </small>
          </div>
          
          {viz.configuration?.chart_data && (
            <ChartComponent
              chartData={viz.configuration.chart_data}
              chartType={viz.chart_type as 'bar' | 'pie'}
              title=""
              dataType={viz.configuration.data_type}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default VisualizationDisplay;