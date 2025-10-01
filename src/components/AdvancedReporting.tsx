import React, { useState } from 'react';
import api from '../services/api';

interface AdvancedReportingProps {
  teamId?: string;
  consultantId?: string;
  userType: 'team' | 'consultant';
}

const AdvancedReporting: React.FC<AdvancedReportingProps> = ({ 
  teamId, 
  consultantId, 
  userType 
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'excel'>('pdf');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [error, setError] = useState('');

  const handleGenerateTeamReport = async () => {
    if (!teamId) return;
    
    setIsGenerating(true);
    setError('');
    
    try {
      const params = new URLSearchParams({
        format: selectedFormat
      });
      
      if (dateRange.startDate) params.append('start_date', dateRange.startDate);
      if (dateRange.endDate) params.append('end_date', dateRange.endDate);
      
      const response = await fetch(`/api/reports/team/${teamId}?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate report');
      }
      
      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const contentDisposition = response.headers.get('content-disposition');
      const filename = contentDisposition 
        ? contentDisposition.split('filename=')[1].replace(/"/g, '')
        : `team_report.${selectedFormat}`;
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
    } catch (error: any) {
      setError(error.message || 'Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateConsultantReport = async () => {
    if (!consultantId || selectedTeams.length === 0) return;
    
    setIsGenerating(true);
    setError('');
    
    try {
      const response = await fetch(`/api/reports/consultant/${consultantId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          team_ids: selectedTeams.map(id => parseInt(id)),
          format: selectedFormat
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate consultant report');
      }
      
      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const contentDisposition = response.headers.get('content-disposition');
      const filename = contentDisposition 
        ? contentDisposition.split('filename=')[1].replace(/"/g, '')
        : `consultant_report.${selectedFormat}`;
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
    } catch (error: any) {
      setError(error.message || 'Failed to generate consultant report');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportGameData = async (gameId: string, format: 'csv' | 'json' | 'excel') => {
    try {
      const response = await fetch(`/api/exports/game-data/${gameId}?format=${format}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to export game data');
      }
      
      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const contentDisposition = response.headers.get('content-disposition');
      const filename = contentDisposition 
        ? contentDisposition.split('filename=')[1].replace(/"/g, '')
        : `game_data.${format}`;
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
    } catch (error: any) {
      setError(error.message || 'Failed to export game data');
    }
  };

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '24px',
      border: '1px solid #e5e7eb'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div style={{ fontSize: '24px', marginRight: '12px' }}>📊</div>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
          Advanced Reporting & Export
        </h2>
      </div>

      {error && (
        <div style={{
          color: '#dc2626',
          backgroundColor: '#fef2f2',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #fecaca'
        }}>
          {error}
        </div>
      )}

      {/* Format Selection */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{
          display: 'block',
          marginBottom: '8px',
          fontSize: '14px',
          fontWeight: '500',
          color: '#374151'
        }}>
          Report Format
        </label>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setSelectedFormat('pdf')}
            style={{
              padding: '10px 16px',
              backgroundColor: selectedFormat === 'pdf' ? '#3b82f6' : '#f3f4f6',
              color: selectedFormat === 'pdf' ? 'white' : '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            📄 PDF Report
          </button>
          <button
            onClick={() => setSelectedFormat('excel')}
            style={{
              padding: '10px 16px',
              backgroundColor: selectedFormat === 'excel' ? '#3b82f6' : '#f3f4f6',
              color: selectedFormat === 'excel' ? 'white' : '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            📈 Excel Workbook
          </button>
        </div>
      </div>

      {/* Date Range Filter */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{
          display: 'block',
          marginBottom: '8px',
          fontSize: '14px',
          fontWeight: '500',
          color: '#374151'
        }}>
          Date Range (Optional)
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
              End Date
            </label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
          </div>
        </div>
      </div>

      {/* Team Performance Report */}
      {userType === 'team' && (
        <div style={{
          padding: '20px',
          backgroundColor: '#f8fafc',
          borderRadius: '8px',
          marginBottom: '24px'
        }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600' }}>
            📋 Team Performance Report
          </h3>
          <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#6b7280' }}>
            Generate comprehensive performance analysis including game-by-game breakdown, 
            trends, formation analysis, and key insights.
          </p>
          <button
            onClick={handleGenerateTeamReport}
            disabled={isGenerating}
            style={{
              padding: '12px 20px',
              backgroundColor: isGenerating ? '#9ca3af' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {isGenerating ? (
              <>
                <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span>
                Generating...
              </>
            ) : (
              <>
                🚀 Generate Report
              </>
            )}
          </button>
        </div>
      )}

      {/* Consultant Multi-Team Report */}
      {userType === 'consultant' && (
        <div style={{
          padding: '20px',
          backgroundColor: '#f0f9ff',
          borderRadius: '8px',
          marginBottom: '24px'
        }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600' }}>
            📊 Consultant Multi-Team Report
          </h3>
          <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#6b7280' }}>
            Generate comparative analysis across multiple teams with performance benchmarks
            and insights for strategic recommendations.
          </p>
          
          {/* Team Selection */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151'
            }}>
              Select Teams
            </label>
            <div style={{
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              padding: '12px',
              backgroundColor: 'white'
            }}>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                {/* This would be populated with actual team data */}
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
                  <input
                    type="checkbox"
                    value="1"
                    checked={selectedTeams.includes('1')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTeams(prev => [...prev, '1']);
                      } else {
                        setSelectedTeams(prev => prev.filter(id => id !== '1'));
                      }
                    }}
                  />
                  Sample Team 1
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
                  <input
                    type="checkbox"
                    value="2"
                    checked={selectedTeams.includes('2')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTeams(prev => [...prev, '2']);
                      } else {
                        setSelectedTeams(prev => prev.filter(id => id !== '2'));
                      }
                    }}
                  />
                  Sample Team 2
                </label>
              </div>
            </div>
          </div>
          
          <button
            onClick={handleGenerateConsultantReport}
            disabled={isGenerating || selectedTeams.length === 0}
            style={{
              padding: '12px 20px',
              backgroundColor: isGenerating || selectedTeams.length === 0 ? '#9ca3af' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: isGenerating || selectedTeams.length === 0 ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {isGenerating ? (
              <>
                <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span>
                Generating...
              </>
            ) : (
              <>
                🎯 Generate Multi-Team Report
              </>
            )}
          </button>
        </div>
      )}

      {/* Quick Export Options */}
      <div style={{
        padding: '20px',
        backgroundColor: '#fefce8',
        borderRadius: '8px'
      }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600' }}>
          ⚡ Quick Data Exports
        </h3>
        <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#6b7280' }}>
          Export individual game data in various formats for further analysis.
        </p>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '12px'
        }}>
          <button
            onClick={() => handleExportGameData('1', 'csv')}
            style={{
              padding: '10px 14px',
              backgroundColor: '#059669',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            📄 CSV
          </button>
          <button
            onClick={() => handleExportGameData('1', 'json')}
            style={{
              padding: '10px 14px',
              backgroundColor: '#7c3aed',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            🔗 JSON
          </button>
          <button
            onClick={() => handleExportGameData('1', 'excel')}
            style={{
              padding: '10px 14px',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            📊 Excel
          </button>
        </div>
        
        <p style={{ 
          margin: '12px 0 0 0', 
          fontSize: '12px', 
          color: '#8b5cf6',
          fontStyle: 'italic'
        }}>
          * Sample exports for the latest game. Select specific games from your dashboard for targeted exports.
        </p>
      </div>

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

export default AdvancedReporting;