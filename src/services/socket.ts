import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(token: string): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io('http://localhost:5001', {
      auth: {
        token: token
      },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      timeout: 10000,
    });

    this.setupEventHandlers();
    return this.socket;
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to collaboration server');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from collaboration server:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.socket?.disconnect();
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('Reconnected after', attemptNumber, 'attempts');
      this.reconnectAttempts = 0;
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Collaboration methods
  joinCollaboration(roomId: string, type: 'chart' | 'game' | 'team' = 'chart') {
    this.socket?.emit('join_collaboration', { room_id: roomId, type });
  }

  leaveCollaboration(roomId: string) {
    this.socket?.emit('leave_collaboration', { room_id: roomId });
  }

  sendChartUpdate(roomId: string, changes: any) {
    this.socket?.emit('chart_update', { room_id: roomId, changes });
  }

  sendCursorPosition(roomId: string, position: { x: number; y: number; element?: string }) {
    this.socket?.emit('cursor_position', { room_id: roomId, position });
  }

  sendTypingIndicator(roomId: string, isTyping: boolean, field?: string) {
    this.socket?.emit('typing_indicator', { 
      room_id: roomId, 
      is_typing: isTyping,
      field: field || 'general'
    });
  }

  sendNotification(targetUserId: string, type: string, message: string) {
    this.socket?.emit('notification', {
      target_user_id: targetUserId,
      type,
      message
    });
  }

  // Event listeners
  onUserJoined(callback: (data: any) => void) {
    this.socket?.on('user_joined', callback);
  }

  onUserLeft(callback: (data: any) => void) {
    this.socket?.on('user_left', callback);
  }

  onChartUpdated(callback: (data: any) => void) {
    this.socket?.on('chart_updated', callback);
  }

  onCursorMoved(callback: (data: any) => void) {
    this.socket?.on('cursor_moved', callback);
  }

  onUserTyping(callback: (data: any) => void) {
    this.socket?.on('user_typing', callback);
  }

  onNotificationReceived(callback: (data: any) => void) {
    this.socket?.on('notification_received', callback);
  }

  onCollaborationJoined(callback: (data: any) => void) {
    this.socket?.on('collaboration_joined', callback);
  }

  onError(callback: (data: any) => void) {
    this.socket?.on('error', callback);
  }

  // Remove event listeners
  removeAllListeners() {
    this.socket?.removeAllListeners();
  }

  off(event: string, callback?: (...args: any[]) => void) {
    this.socket?.off(event, callback);
  }
}

export const socketService = new SocketService();
export default socketService;