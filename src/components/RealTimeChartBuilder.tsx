import React, { useState, useEffect, useRef } from 'react';
import { useCollaboration } from './CollaborationProvider';
import { socketService } from '../services/socket';

interface RealTimeChartBuilderProps {
  gameId: string;
  onSave: (chartConfig: any) => void;
  onCancel: () => void;
}

interface ChartConfig {
  title: string;
  type: 'line' | 'bar' | 'pie' | 'scatter';
  xAxis: string;
  yAxis: string;
  filters: any;
  style: any;
}

interface ActiveUser {
  user_id: string;
  user_type: 'team' | 'consultant';
  position?: { x: number; y: number; element?: string };
  is_typing?: boolean;
  typing_field?: string;
}

const RealTimeChartBuilder: React.FC<RealTimeChartBuilderProps> = ({ 
  gameId, 
  onSave, 
  onCancel 
}) => {
  const { isConnected, activeUsers, joinRoom, leaveRoom, sendChartUpdate } = useCollaboration();
  const [chartConfig, setChartConfig] = useState<ChartConfig>({
    title: '',
    type: 'bar',
    xAxis: 'formation',
    yAxis: 'yards_gained',
    filters: {},
    style: {}
  });
  
  const [collaborators, setCollaborators] = useState<{ [userId: string]: ActiveUser }>({});
  const [showCursors, setShowCursors] = useState(true);
  const [typingIndicators, setTypingIndicators] = useState<{ [field: string]: string[] }>({});
  
  const roomId = `chart_${gameId}`;
  const titleInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<{ [field: string]: NodeJS.Timeout }>({});

  useEffect(() => {
    if (isConnected) {
      joinRoom(roomId, 'chart');
      
      // Request browser notification permission
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }

    return () => {
      leaveRoom(roomId);
    };
  }, [isConnected, roomId]);

  useEffect(() => {
    // Listen for real-time chart updates
    socketService.onChartUpdated((data) => {
      if (data.room_id === roomId) {
        setChartConfig(prev => ({
          ...prev,
          ...data.changes
        }));
        
        // Show notification about the update
        if (Notification.permission === 'granted') {
          new Notification(
            `Chart updated by ${data.updated_by.type === 'consultant' ? 'Consultant' : 'Team'}`,
            {
              body: `Changes made to: ${Object.keys(data.changes).join(', ')}`,
              icon: '/favicon.ico'
            }
          );
        }
      }
    });

    // Listen for cursor movements
    socketService.onCursorMoved((data) => {
      setCollaborators(prev => ({
        ...prev,
        [data.user_id]: {
          user_id: data.user_id,
          user_type: data.user_type,
          position: data.position
        }
      }));
    });

    // Listen for typing indicators
    socketService.onUserTyping((data) => {
      const field = data.field || 'general';
      const userId = data.user_id;
      
      setTypingIndicators(prev => {
        const updated = { ...prev };
        if (!updated[field]) updated[field] = [];
        
        if (data.is_typing) {
          if (!updated[field].includes(userId)) {
            updated[field] = [...updated[field], userId];
          }
        } else {
          updated[field] = updated[field].filter(id => id !== userId);
        }
        
        return updated;
      });

      // Auto-clear typing indicator after timeout
      if (data.is_typing) {
        if (typingTimeoutRef.current[field + userId]) {
          clearTimeout(typingTimeoutRef.current[field + userId]);
        }
        
        typingTimeoutRef.current[field + userId] = setTimeout(() => {
          setTypingIndicators(prev => {
            const updated = { ...prev };
            if (updated[field]) {
              updated[field] = updated[field].filter(id => id !== userId);
            }
            return updated;
          });
        }, 3000);
      }
    });

    return () => {
      socketService.removeAllListeners();
      Object.values(typingTimeoutRef.current).forEach(timeout => clearTimeout(timeout));
    };
  }, [roomId]);

  const handleConfigChange = (field: string, value: any) => {
    const changes = { [field]: value };
    setChartConfig(prev => ({ ...prev, ...changes }));
    
    // Broadcast changes to other users
    sendChartUpdate(roomId, changes);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (showCursors) {
      const rect = e.currentTarget.getBoundingClientRect();
      const position = {
        x: ((e.clientX - rect.left) / rect.width) * 100,
        y: ((e.clientY - rect.top) / rect.height) * 100,
        element: (e.target as HTMLElement).tagName.toLowerCase()
      };
      
      socketService.sendCursorPosition(roomId, position);
    }
  };

  const handleTyping = (field: string, isTyping: boolean) => {
    socketService.sendTypingIndicator(roomId, isTyping, field);
  };

  const renderTypingIndicator = (field: string) => {
    const typingUsers = typingIndicators[field];
    if (!typingUsers || typingUsers.length === 0) return null;
    
    return (
      <div style={{
        fontSize: '12px',
        color: '#6b7280',
        fontStyle: 'italic',
        marginTop: '4px'
      }}>
        {typingUsers.length === 1 
          ? `Someone is typing...` 
          : `${typingUsers.length} people are typing...`
        }
      </div>
    );
  };

  const renderCursors = () => {
    if (!showCursors) return null;
    
    return Object.values(collaborators).map(user => {
      if (!user.position) return null;
      
      return (
        <div
          key={user.user_id}
          style={{
            position: 'absolute',
            left: `${user.position.x}%`,
            top: `${user.position.y}%`,
            pointerEvents: 'none',
            zIndex: 1000,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: user.user_type === 'consultant' ? '#3b82f6' : '#10b981',
            border: '2px solid white',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }} />
          <div style={{
            marginTop: '2px',
            fontSize: '10px',
            backgroundColor: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '2px 4px',
            borderRadius: '4px',
            whiteSpace: 'nowrap'
          }}>
            {user.user_type === 'consultant' ? 'Consultant' : 'Team'}
          </div>
        </div>
      );
    });
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          width: '800px',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
          position: 'relative'
        }}
        onMouseMove={handleMouseMove}
      >
        {renderCursors()}
        
        {/* Header with collaboration status */}
        <div style={{
          padding: '24px 32px 16px 32px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
              Collaborative Chart Builder
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', marginTop: '8px' }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: isConnected ? '#10b981' : '#ef4444',
                marginRight: '8px'
              }} />
              <span style={{ fontSize: '14px', color: '#6b7280' }}>
                {isConnected ? 'Connected' : 'Disconnected'} • {
                  Object.keys(activeUsers[roomId] || {}).length
                } collaborators
              </span>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              onClick={() => setShowCursors(!showCursors)}
              style={{
                padding: '8px 12px',
                fontSize: '12px',
                backgroundColor: showCursors ? '#3b82f6' : '#e5e7eb',
                color: showCursors ? 'white' : '#374151',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              {showCursors ? 'Hide Cursors' : 'Show Cursors'}
            </button>
            <button
              onClick={onCancel}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                color: '#6b7280',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Chart Configuration Form */}
        <div style={{ padding: '24px 32px' }}>
          {/* Title */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151'
            }}>
              Chart Title
            </label>
            <input
              ref={titleInputRef}
              type="text"
              value={chartConfig.title}
              onChange={(e) => handleConfigChange('title', e.target.value)}
              onFocus={() => handleTyping('title', true)}
              onBlur={() => handleTyping('title', false)}
              placeholder="Enter chart title..."
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none'
              }}
            />
            {renderTypingIndicator('title')}
          </div>

          {/* Chart Type */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151'
            }}>
              Chart Type
            </label>
            <select
              value={chartConfig.type}
              onChange={(e) => handleConfigChange('type', e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: 'white'
              }}
            >
              <option value="bar">Bar Chart</option>
              <option value="line">Line Chart</option>
              <option value="pie">Pie Chart</option>
              <option value="scatter">Scatter Plot</option>
            </select>
          </div>

          {/* Axes Configuration */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '6px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151'
              }}>
                X-Axis
              </label>
              <select
                value={chartConfig.xAxis}
                onChange={(e) => handleConfigChange('xAxis', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: 'white'
                }}
              >
                <option value="formation">Formation</option>
                <option value="play_type">Play Type</option>
                <option value="down">Down</option>
                <option value="quarter">Quarter</option>
              </select>
            </div>
            
            <div>
              <label style={{
                display: 'block',
                marginBottom: '6px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151'
              }}>
                Y-Axis
              </label>
              <select
                value={chartConfig.yAxis}
                onChange={(e) => handleConfigChange('yAxis', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: 'white'
                }}
              >
                <option value="yards_gained">Yards Gained</option>
                <option value="points_scored">Points Scored</option>
                <option value="play_count">Play Count</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              onClick={onCancel}
              style={{
                padding: '10px 20px',
                backgroundColor: 'transparent',
                color: '#6b7280',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(chartConfig)}
              style={{
                padding: '10px 24px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Save Chart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTimeChartBuilder;