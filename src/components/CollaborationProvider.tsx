import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { socketService } from '../services/socket';
import { Socket } from 'socket.io-client';

interface CollaborationContextType {
  socket: Socket | null;
  isConnected: boolean;
  activeUsers: { [roomId: string]: any[] };
  notifications: Notification[];
  joinRoom: (roomId: string, type?: 'chart' | 'game' | 'team') => void;
  leaveRoom: (roomId: string) => void;
  sendChartUpdate: (roomId: string, changes: any) => void;
  sendNotification: (targetUserId: string, type: string, message: string) => void;
  clearNotifications: () => void;
}

interface Notification {
  id: string;
  type: string;
  message: string;
  from_user?: any;
  timestamp: string;
  read: boolean;
}

const CollaborationContext = createContext<CollaborationContextType | undefined>(undefined);

interface CollaborationProviderProps {
  children: ReactNode;
}

export const CollaborationProvider: React.FC<CollaborationProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState<{ [roomId: string]: any[] }>({});
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const socketInstance = socketService.connect(token);
      setSocket(socketInstance);

      // Set up event listeners
      socketInstance.on('connect', () => {
        setIsConnected(true);
      });

      socketInstance.on('disconnect', () => {
        setIsConnected(false);
      });

      socketService.onUserJoined((data) => {
        setActiveUsers(prev => ({
          ...prev,
          [data.room_id]: data.active_users
        }));
      });

      socketService.onUserLeft((data) => {
        setActiveUsers(prev => ({
          ...prev,
          [data.room_id]: data.active_users
        }));
      });

      socketService.onCollaborationJoined((data) => {
        setActiveUsers(prev => ({
          ...prev,
          [data.room_id]: data.active_users
        }));
      });

      socketService.onNotificationReceived((data) => {
        const notification: Notification = {
          id: Date.now().toString(),
          ...data,
          read: false
        };
        setNotifications(prev => [notification, ...prev]);

        // Show browser notification if permission granted
        if (Notification.permission === 'granted') {
          new Notification(data.message, {
            icon: '/favicon.ico',
            tag: notification.id
          });
        }
      });

      return () => {
        socketService.disconnect();
        setSocket(null);
        setIsConnected(false);
      };
    }
  }, []);

  const joinRoom = (roomId: string, type: 'chart' | 'game' | 'team' = 'chart') => {
    socketService.joinCollaboration(roomId, type);
  };

  const leaveRoom = (roomId: string) => {
    socketService.leaveCollaboration(roomId);
    setActiveUsers(prev => {
      const updated = { ...prev };
      delete updated[roomId];
      return updated;
    });
  };

  const sendChartUpdate = (roomId: string, changes: any) => {
    socketService.sendChartUpdate(roomId, changes);
  };

  const sendNotification = (targetUserId: string, type: string, message: string) => {
    socketService.sendNotification(targetUserId, type, message);
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const value: CollaborationContextType = {
    socket,
    isConnected,
    activeUsers,
    notifications,
    joinRoom,
    leaveRoom,
    sendChartUpdate,
    sendNotification,
    clearNotifications
  };

  return (
    <CollaborationContext.Provider value={value}>
      {children}
    </CollaborationContext.Provider>
  );
};

export const useCollaboration = (): CollaborationContextType => {
  const context = useContext(CollaborationContext);
  if (!context) {
    throw new Error('useCollaboration must be used within a CollaborationProvider');
  }
  return context;
};