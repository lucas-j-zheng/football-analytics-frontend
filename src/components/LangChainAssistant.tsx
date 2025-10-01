import React, { useState, useEffect } from 'react';
import { aiService, LangChainStatus, LangChainTranslationResult, LangChainQueryResult } from '../services/ai';

interface LangChainAssistantProps {
  onClose: () => void;
  gameId?: number;
}

interface ChatMessage {
  type: 'user' | 'ai' | 'system';
  message: string;
  timestamp: Date;
  metadata?: {
    translation?: LangChainTranslationResult;
    confidence?: number;
    query_type?: string;
  };
}

const LangChainAssistant: React.FC<LangChainAssistantProps> = ({ onClose, gameId }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentQuery, setCurrentQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<LangChainStatus | null>(null);
  const [selectedMode, setSelectedMode] = useState<'chat' | 'translate' | 'workflow'>('chat');

  // Initialize with welcome message and load status
  useEffect(() => {
    const initializeAssistant = async () => {
      try {
        const langchainStatus = await aiService.getLangChainStatus();
        setStatus(langchainStatus);
        
        const welcomeMessage: ChatMessage = {
          type: 'ai',
          message: `🚀 **Advanced LangChain Assistant Ready!**\n\nI'm powered by AI and can understand natural language queries about your football data. Here's what I can do:\n\n**🏈 Natural Language Queries:**\n• "Show me red zone plays"\n• "Third down conversions with shotgun formation"\n• "Big plays over 20 yards"\n\n**🔧 Available Workflows:**\n${Object.keys(langchainStatus.available_workflows).map(workflow => 
  `• ${workflow.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`
).join('\n')}\n\n**💡 Pro Tips:**\n• I can translate your questions into database filters\n• Ask complex multi-condition queries\n• Try the workflow mode for detailed analysis\n\nWhat would you like to analyze?`,
          timestamp: new Date(),
          metadata: {
            confidence: 1.0,
            query_type: 'welcome'
          }
        };
        setMessages([welcomeMessage]);
      } catch (error) {
        const errorMessage: ChatMessage = {
          type: 'system',
          message: '⚠️ LangChain service is not available. Using basic AI mode.',
          timestamp: new Date()
        };
        setMessages([errorMessage]);
      }
    };

    initializeAssistant();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentQuery.trim() || loading) return;

    const userMessage: ChatMessage = {
      type: 'user',
      message: currentQuery,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const queryToProcess = currentQuery;
    setCurrentQuery('');
    setLoading(true);

    try {
      if (selectedMode === 'translate') {
        // Translation mode - show how query converts to SQL
        const translation = await aiService.translateQuery(queryToProcess);
        
        let responseMessage = '';
        if (translation.success && translation.filters) {
          responseMessage = `🎯 **Query Translation**\n\n**Interpretation:** ${translation.filters.interpretation}\n\n**SQL Conditions:**\n`;
          translation.filters.conditions.forEach((condition, index) => {
            responseMessage += `${index + 1}. ${condition.field} ${condition.operator} ${JSON.stringify(condition.value)}\n`;
          });
          responseMessage += `\n**Confidence:** ${(translation.confidence_score * 100).toFixed(0)}%`;
          responseMessage += `\n**Logic:** ${translation.filters.logic.toUpperCase()}`;
          
          if (translation.difficulty_analysis) {
            responseMessage += `\n**Difficulty:** ${translation.difficulty_analysis.difficulty} (${translation.difficulty_analysis.football_terms} football terms)`;
          }
        } else {
          responseMessage = `❌ **Translation Failed**\n\n${translation.error_message || 'Unable to translate query'}`;
          if (translation.suggested_corrections) {
            responseMessage += `\n\n**Suggestions:**\n${translation.suggested_corrections.map(s => `• ${s}`).join('\n')}`;
          }
        }

        const aiMessage: ChatMessage = {
          type: 'ai',
          message: responseMessage,
          timestamp: new Date(),
          metadata: {
            translation,
            confidence: translation.confidence_score,
            query_type: 'translation'
          }
        };
        setMessages(prev => [...prev, aiMessage]);

      } else if (selectedMode === 'workflow') {
        // Workflow mode - check if query matches a workflow
        const availableWorkflows = status?.available_workflows || {};
        const workflowName = Object.keys(availableWorkflows).find(workflow =>
          queryToProcess.toLowerCase().includes(workflow.replace(/_/g, ' '))
        );

        if (workflowName) {
          const workflowResult = await aiService.runWorkflow(workflowName, gameId);
          const aiMessage: ChatMessage = {
            type: 'ai',
            message: `🔧 **Workflow: ${workflowName.replace(/_/g, ' ').toUpperCase()}**\n\n${JSON.stringify(workflowResult, null, 2)}`,
            timestamp: new Date(),
            metadata: {
              confidence: 1.0,
              query_type: 'workflow'
            }
          };
          setMessages(prev => [...prev, aiMessage]);
        } else {
          const aiMessage: ChatMessage = {
            type: 'ai',
            message: `Available workflows:\n${Object.keys(availableWorkflows).map(w => `• ${w.replace(/_/g, ' ')}`).join('\n')}\n\nPlease specify which workflow you'd like to run.`,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, aiMessage]);
        }

      } else {
        // Chat mode - full LangChain natural language processing
        const result = await aiService.askLangChainQuery(queryToProcess, gameId);
        
        let responseMessage = '';
        if (result.success) {
          responseMessage = result.response || result.analysis || 'Query processed successfully';
          if (result.metadata) {
            responseMessage += `\n\n*Confidence: ${(result.metadata.confidence * 100).toFixed(0)}% | Processing: ${result.metadata.processing_time}ms*`;
          } else if (result.data_count) {
            responseMessage += `\n\n*Analyzed ${result.data_count} plays*`;
          }
        } else {
          responseMessage = `❌ ${result.error_message || 'Query failed'}`;
        }

        const aiMessage: ChatMessage = {
          type: 'ai',
          message: responseMessage,
          timestamp: new Date(),
          metadata: {
            confidence: result.metadata?.confidence || 0,
            query_type: 'chat'
          }
        };
        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (error: any) {
      const errorMessage: ChatMessage = {
        type: 'ai',
        message: `❌ **Error:** ${error.message || 'Something went wrong'}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const quickQueries = [
    "Show me red zone plays",
    "Third down conversions",
    "Shotgun formation passes", 
    "Big plays over 15 yards",
    "Running plays more than 5 yards"
  ];

  const formatMessage = (message: string) => {
    return message.split('\n').map((line, index) => {
      // Handle bold markdown
      const boldFormatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      return (
        <div key={index} dangerouslySetInnerHTML={{ __html: boldFormatted }} />
      );
    });
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'chat': return '💬';
      case 'translate': return '🔄';
      case 'workflow': return '⚙️';
      default: return '🤖';
    }
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
        borderRadius: '12px', 
        width: '800px',
        height: '700px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
      }}>
        {/* Header */}
        <div style={{ 
          padding: '20px', 
          borderBottom: '1px solid #e9ecef',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: '12px 12px 0 0'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px' }}>🚀 LangChain AI Assistant</h2>
            <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '4px' }}>
              {status?.service_stats.is_available ? 
                `✅ Connected to ${status.service_stats.model}` : 
                '⚠️ Service unavailable'
              }
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Close
          </button>
        </div>

        {/* Mode Selection */}
        <div style={{
          padding: '15px 20px',
          borderBottom: '1px solid #e9ecef',
          display: 'flex',
          gap: '10px',
          backgroundColor: '#f8f9fa'
        }}>
          {[
            { key: 'chat', label: 'Smart Chat', desc: 'Natural language queries' },
            { key: 'translate', label: 'Query Translator', desc: 'See SQL translation' },
            { key: 'workflow', label: 'Workflows', desc: 'Predefined analysis' }
          ].map(mode => (
            <button
              key={mode.key}
              onClick={() => setSelectedMode(mode.key as any)}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #ddd',
                backgroundColor: selectedMode === mode.key ? '#007bff' : 'white',
                color: selectedMode === mode.key ? 'white' : '#495057',
                cursor: 'pointer',
                fontSize: '12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minWidth: '100px'
              }}
            >
              <div style={{ fontSize: '16px', marginBottom: '2px' }}>
                {getModeIcon(mode.key)}
              </div>
              <div style={{ fontWeight: 'bold' }}>{mode.label}</div>
              <div style={{ fontSize: '10px', opacity: 0.8 }}>{mode.desc}</div>
            </button>
          ))}
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
                maxWidth: '85%',
                padding: '12px 16px',
                borderRadius: '12px',
                backgroundColor: msg.type === 'user' ? '#007bff' : 
                                msg.type === 'system' ? '#ffc107' : '#f8f9fa',
                color: msg.type === 'user' ? 'white' : '#333',
                border: msg.type === 'ai' ? '1px solid #e9ecef' : 'none',
                position: 'relative'
              }}>
                <div style={{ fontSize: '14px', lineHeight: '1.5' }}>
                  {formatMessage(msg.message)}
                </div>
                <div style={{ 
                  fontSize: '11px', 
                  opacity: 0.7, 
                  marginTop: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span>{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {msg.metadata?.confidence && (
                    <span style={{ 
                      backgroundColor: 'rgba(0,123,255,0.1)', 
                      padding: '2px 6px', 
                      borderRadius: '10px',
                      fontSize: '10px'
                    }}>
                      {(msg.metadata.confidence * 100).toFixed(0)}% confidence
                    </span>
                  )}
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
                border: '1px solid #e9ecef',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <div style={{ 
                  width: '20px', 
                  height: '20px', 
                  border: '2px solid #007bff', 
                  borderTop: '2px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                <div style={{ fontSize: '14px' }}>Processing your query...</div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Queries */}
        {messages.length <= 1 && (
          <div style={{ 
            padding: '10px 20px',
            borderTop: '1px solid #e9ecef',
            backgroundColor: '#f8f9fa'
          }}>
            <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '8px' }}>
              💡 Try these example queries:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {quickQueries.map((query, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentQuery(query)}
                  style={{
                    padding: '6px 10px',
                    fontSize: '11px',
                    backgroundColor: 'white',
                    border: '1px solid #dee2e6',
                    borderRadius: '15px',
                    cursor: 'pointer',
                    color: '#495057',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#e9ecef';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                  }}
                >
                  {query}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} style={{ 
          padding: '20px', 
          borderTop: '1px solid #e9ecef',
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-end'
        }}>
          <div style={{ flex: 1 }}>
            <textarea
              value={currentQuery}
              onChange={(e) => setCurrentQuery(e.target.value)}
              placeholder={`Ask me about your football data using natural language...`}
              disabled={loading}
              rows={2}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ced4da',
                borderRadius: '8px',
                fontSize: '14px',
                resize: 'none',
                fontFamily: 'inherit'
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !currentQuery.trim()}
            style={{
              padding: '12px 24px',
              backgroundColor: loading || !currentQuery.trim() ? '#6c757d' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading || !currentQuery.trim() ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              minWidth: '80px'
            }}
          >
            {loading ? '...' : 'Send'}
          </button>
        </form>
      </div>

      {/* CSS for spinner animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LangChainAssistant;