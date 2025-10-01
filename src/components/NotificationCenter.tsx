import React, { useState, useEffect } from 'react';
import { useCollaboration } from './CollaborationProvider';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
  const { notifications, clearNotifications } = useCollaboration();
  const [filter, setFilter] = useState<'all' | 'unread'>('unread');

  const filteredNotifications = notifications.filter(notification => 
    filter === 'all' || !notification.read
  );

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'chart_update':
        return '📊';
      case 'collaboration':
        return '👥';
      case 'data_upload':
        return '📁';
      case 'ai_insight':
        return '🤖';
      case 'comment':
        return '💬';
      default:
        return '🔔';
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      width: '400px',
      height: '100vh',
      backgroundColor: 'white',
      boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.1)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
          Notifications
        </h3>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '20px',
            color: '#6b7280',
            cursor: 'pointer',
            padding: '4px'
          }}
        >
          ×
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <button
          onClick={() => setFilter('unread')}
          style={{
            flex: 1,
            padding: '12px',
            backgroundColor: filter === 'unread' ? '#f3f4f6' : 'transparent',
            border: 'none',
            borderBottom: filter === 'unread' ? '2px solid #3b82f6' : '2px solid transparent',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: filter === 'unread' ? '600' : '400'
          }}
        >
          Unread ({notifications.filter(n => !n.read).length})
        </button>
        <button
          onClick={() => setFilter('all')}
          style={{
            flex: 1,
            padding: '12px',
            backgroundColor: filter === 'all' ? '#f3f4f6' : 'transparent',
            border: 'none',
            borderBottom: filter === 'all' ? '2px solid #3b82f6' : '2px solid transparent',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: filter === 'all' ? '600' : '400'
          }}
        >
          All ({notifications.length})
        </button>
      </div>

      {/* Notifications List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '0'
      }}>
        {filteredNotifications.length === 0 ? (
          <div style={{
            padding: '40px 20px',
            textAlign: 'center',
            color: '#6b7280'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔔</div>
            <p style={{ margin: 0, fontSize: '16px', fontWeight: '500' }}>
              No notifications
            </p>
            <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>
              You're all caught up!
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #f3f4f6',
                backgroundColor: notification.read ? 'white' : '#f8fafc',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f9fafb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = notification.read ? 'white' : '#f8fafc';
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px'
              }}>
                <div style={{ fontSize: '20px', marginTop: '2px' }}>
                  {getNotificationIcon(notification.type)}
                </div>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#111827',
                    marginBottom: '4px',
                    lineHeight: '1.4'
                  }}>
                    {notification.message}
                  </div>
                  
                  {notification.from_user && (
                    <div style={{
                      fontSize: '12px',
                      color: '#6b7280',
                      marginBottom: '6px'
                    }}>
                      From: {notification.from_user.type === 'consultant' ? 'Consultant' : 'Team'}
                    </div>
                  )}
                  
                  <div style={{
                    fontSize: '12px',
                    color: '#9ca3af'
                  }}>
                    {formatTimeAgo(notification.timestamp)}
                  </div>
                </div>
                
                {!notification.read && (
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#3b82f6',
                    marginTop: '6px'
                  }} />
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Actions */}
      {filteredNotifications.length > 0 && (
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid #e5e7eb'
        }}>
          <button
            onClick={clearNotifications}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Clear All Notifications
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;