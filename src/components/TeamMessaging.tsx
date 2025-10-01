import React, { useState, useEffect, useRef } from 'react';
import { useCollaboration } from './CollaborationProvider';
import { gameService } from '../services/game';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  sender_type: 'team' | 'consultant';
  timestamp: string;
  game_id?: string;
  chart_id?: string;
  message_type: 'text' | 'insight' | 'suggestion' | 'question';
}

interface TeamMessagingProps {
  teamId: string;
  gameId?: string;
  consultantId?: string;
}

const TeamMessaging: React.FC<TeamMessagingProps> = ({ teamId, gameId, consultantId }) => {
  const { isConnected, joinRoom, leaveRoom, sendNotification } = useCollaboration();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [messageType, setMessageType] = useState<'text' | 'insight' | 'suggestion' | 'question'>('text');
  const [isTyping, setIsTyping] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState<string[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const roomId = gameId ? `game_${gameId}` : `team_${teamId}`;
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isConnected) {
      joinRoom(roomId, gameId ? 'game' : 'team');
      loadMessages();
    }

    return () => {
      leaveRoom(roomId);
    };
  }, [isConnected, roomId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      // In a real implementation, you'd load messages from your backend
      // For now, we'll simulate with some sample messages
      const sampleMessages: Message[] = [
        {
          id: '1',
          content: 'Our red zone efficiency looks concerning this week. What do you think?',
          sender_id: teamId,
          sender_type: 'team',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          game_id: gameId,
          message_type: 'question'
        },
        {
          id: '2',
          content: 'I noticed that too. Your conversion rate dropped to 45% compared to 78% last week. I suggest focusing on short-yardage plays.',
          sender_id: consultantId || 'consultant1',
          sender_type: 'consultant',
          timestamp: new Date(Date.now() - 3300000).toISOString(),
          game_id: gameId,
          message_type: 'suggestion'
        }
      ];
      setMessages(sampleMessages);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      content: newMessage,
      sender_id: teamId,
      sender_type: 'team',
      timestamp: new Date().toISOString(),
      game_id: gameId,
      message_type: messageType
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    // Send notification to consultant if they're not in the room
    if (consultantId) {
      sendNotification(consultantId, 'message', `New ${messageType}: ${newMessage.substring(0, 50)}${newMessage.length > 50 ? '...' : ''}`);
    }

    // In a real implementation, save to backend here
    try {
      // await messageService.sendMessage(message);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      // Send typing indicator
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      // Send stop typing indicator
    }, 1000);
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'insight':
        return '💡';
      case 'suggestion':
        return '💭';
      case 'question':
        return '❓';
      default:
        return '💬';
    }
  };

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case 'insight':
        return '#f59e0b';
      case 'suggestion':
        return '#10b981';
      case 'question':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '600px',
      backgroundColor: 'white',
      borderRadius: '12px',
      border: '1px solid #e5e7eb',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid #e5e7eb',
        backgroundColor: '#f9fafb'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
            {gameId ? 'Game Discussion' : 'Team Chat'}
          </h3>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isConnected ? '#10b981' : '#ef4444'
            }} />
            {isConnected ? 'Connected' : 'Disconnected'}
            {connectedUsers.length > 0 && (
              <span>• {connectedUsers.length} online</span>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px 20px'
      }}>
        {messages.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: '#6b7280',
            marginTop: '40px'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
            <p style={{ fontSize: '16px', fontWeight: '500', margin: 0 }}>
              Start the conversation
            </p>
            <p style={{ fontSize: '14px', margin: '8px 0 0 0' }}>
              Share insights, ask questions, or discuss game performance
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              style={{
                marginBottom: '16px',
                display: 'flex',
                flexDirection: message.sender_type === 'team' ? 'row-reverse' : 'row',
                alignItems: 'flex-start',
                gap: '12px'
              }}
            >
              {/* Avatar */}
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: message.sender_type === 'consultant' ? '#3b82f6' : '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                flexShrink: 0
              }}>
                {message.sender_type === 'consultant' ? 'C' : 'T'}
              </div>

              {/* Message */}
              <div style={{
                maxWidth: '70%',
                backgroundColor: message.sender_type === 'team' ? '#3b82f6' : '#f3f4f6',
                color: message.sender_type === 'team' ? 'white' : '#111827',
                padding: '12px 16px',
                borderRadius: '16px',
                borderTopLeftRadius: message.sender_type === 'team' ? '16px' : '4px',
                borderTopRightRadius: message.sender_type === 'team' ? '4px' : '16px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '4px'
                }}>
                  <span style={{ fontSize: '16px' }}>
                    {getMessageIcon(message.message_type)}
                  </span>
                  <span style={{
                    fontSize: '12px',
                    opacity: 0.8,
                    textTransform: 'capitalize'
                  }}>
                    {message.message_type}
                  </span>
                </div>
                <div style={{
                  fontSize: '14px',
                  lineHeight: '1.4',
                  marginBottom: '4px'
                }}>
                  {message.content}
                </div>
                <div style={{
                  fontSize: '11px',
                  opacity: 0.7,
                  textAlign: 'right'
                }}>
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div style={{
        padding: '16px 20px',
        borderTop: '1px solid #e5e7eb',
        backgroundColor: '#fafafa'
      }}>
        {/* Message Type Selector */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '12px'
        }}>
          {(['text', 'question', 'insight', 'suggestion'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setMessageType(type)}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                backgroundColor: messageType === type ? getMessageTypeColor(type) : '#e5e7eb',
                color: messageType === type ? 'white' : '#6b7280',
                border: 'none',
                borderRadius: '16px',
                cursor: 'pointer',
                textTransform: 'capitalize',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              {getMessageIcon(type)}
              {type}
            </button>
          ))}
        </div>

        {/* Input */}
        <div style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-end'
        }}>
          <textarea
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            placeholder={`Type your ${messageType}...`}
            style={{
              flex: 1,
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              resize: 'none',
              minHeight: '40px',
              maxHeight: '120px',
              outline: 'none'
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            style={{
              padding: '12px 16px',
              backgroundColor: newMessage.trim() ? '#3b82f6' : '#d1d5db',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeamMessaging;