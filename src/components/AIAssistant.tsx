import React, { useState } from 'react';
import { aiService, AIResponse } from '../services/ai';

interface AIAssistantProps {
  onClose: () => void;
}

interface ChatMessage {
  type: 'user' | 'ai';
  message: string;
  timestamp: Date;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ onClose }) => {
const [messages, setMessages] = useState<ChatMessage[]>([
    {
      type: 'ai',
      message: 'Hi! I\'m your advanced football analytics assistant with natural language processing. I can analyze your game data and provide insights. Try asking:\n\n• "What were the total yards against Test Opponent?"\n• "How are we trending this season?"\n• "What are our weaknesses?"\n• "How is our red zone performance?"\n• "What\'s our third down conversion rate?"\n• "What are our coach\'s focus areas?"',
      timestamp: new Date()
    }
  ]);
  const [currentQuery, setCurrentQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const suggestedQuestions = [
    "What were the total yards against Test Opponent?",
    "How many total plays were run in week 1?",
    "How many points were scored?",
    "What was the average yards per play for pass plays?",
    "What is our best formation?",
    "Is our run or pass game more efficient?"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentQuery.trim() || loading) return;

    const userMessage: ChatMessage = {
      type: 'user',
      message: currentQuery,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentQuery('');
    setLoading(true);

    try {
      const response = await aiService.askQuestion(currentQuery);
      const aiMessage: ChatMessage = {
        type: 'ai',
        message: response.response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error: any) {
      const errorMessage: ChatMessage = {
        type: 'ai',
        message: 'Sorry, I encountered an error processing your question. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setCurrentQuery(question);
  };

  const formatMessage = (message: string) => {
    // Convert newlines to line breaks for display
    return message.split('\\n').map((line, index) => (
      <React.Fragment key={index}>
        {line}
        {index < message.split('\\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      backgroundColor: 'rgba(0,0,0,0.5)', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '8px', 
        width: '700px',
        height: '600px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{ 
          padding: '20px', 
          borderBottom: '1px solid #ddd',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ margin: 0 }}>🤖 AI Analytics Assistant</h2>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>

        {/* Chat Messages */}
        <div style={{ 
          flex: 1,
          padding: '20px',
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '15px'
        }}>
          {messages.map((msg, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start'
              }}
            >
              <div style={{
                maxWidth: '80%',
                padding: '12px 16px',
                borderRadius: '12px',
                backgroundColor: msg.type === 'user' ? '#007bff' : '#f8f9fa',
                color: msg.type === 'user' ? 'white' : '#333',
                border: msg.type === 'ai' ? '1px solid #ddd' : 'none'
              }}>
                <div style={{ fontSize: '14px', lineHeight: '1.4' }}>
                  {formatMessage(msg.message)}
                </div>
                <div style={{ 
                  fontSize: '11px', 
                  opacity: 0.7, 
                  marginTop: '4px',
                  textAlign: 'right'
                }}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
          
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{
                padding: '12px 16px',
                borderRadius: '12px',
                backgroundColor: '#f8f9fa',
                border: '1px solid #ddd'
              }}>
                <div style={{ fontSize: '14px' }}>Thinking...</div>
              </div>
            </div>
          )}
        </div>

        {/* Suggested Questions */}
        {messages.length <= 1 && (
          <div style={{ 
            padding: '0 20px 10px 20px',
            borderTop: '1px solid #eee'
          }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
              Try these example questions:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              {suggestedQuestions.slice(0, 3).map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestedQuestion(question)}
                  style={{
                    padding: '4px 8px',
                    fontSize: '11px',
                    backgroundColor: '#e9ecef',
                    border: '1px solid #ddd',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    color: '#495057'
                  }}
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} style={{ 
          padding: '20px', 
          borderTop: '1px solid #ddd',
          display: 'flex',
          gap: '10px'
        }}>
          <input
            type="text"
            value={currentQuery}
            onChange={(e) => setCurrentQuery(e.target.value)}
            placeholder="Ask me about your football analytics..."
            disabled={loading}
            style={{
              flex: 1,
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
          <button
            type="submit"
            disabled={loading || !currentQuery.trim()}
            style={{
              padding: '12px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: loading || !currentQuery.trim() ? 'not-allowed' : 'pointer',
              fontSize: '14px'
            }}
          >
            {loading ? '...' : 'Ask'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIAssistant;