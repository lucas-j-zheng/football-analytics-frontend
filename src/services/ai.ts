import api from './api';

export interface AIResponse {
  response: string;
  query: string;
}

export interface LangChainTranslationResult {
  success: boolean;
  filters?: {
    conditions: Array<{
      field: string;
      operator: string;
      value: any;
    }>;
    logic: string;
    confidence: number;
    interpretation: string;
  };
  confidence_score: number;
  difficulty_analysis?: {
    difficulty: 'easy' | 'medium' | 'hard';
    complexity_score: number;
    football_terms: number;
    word_count: number;
  };
  error_message?: string;
  suggested_corrections?: string[];
}

export interface LangChainQueryResult {
  success: boolean;
  response?: string;
  analysis?: any;
  error_message?: string;
  data_count?: number;
  metadata?: {
    query_type: string;
    confidence: number;
    processing_time: number;
  };
}

export interface LangChainStatus {
  status: string;
  service_stats: {
    is_available: boolean;
    model: string;
    base_url: string;
    conversation_length: number;
  };
  capabilities: {
    natural_language_queries: boolean;
    query_translation: boolean;
    multi_step_analysis: boolean;
    conversation_memory: boolean;
  };
  available_workflows: {
    [key: string]: string[];
  };
  query_examples: {
    [key: string]: string;
  };
}

export const aiService = {
  // Original AI endpoint
  async askQuestion(query: string): Promise<AIResponse> {
    const response = await api.post('/ai/query', { query });
    return response.data;
  },

  // New LangChain endpoints
  async translateQuery(query: string): Promise<LangChainTranslationResult> {
    const response = await api.post('/langchain/translate', { query });
    return response.data;
  },

  async askLangChainQuery(query: string, gameId?: number): Promise<LangChainQueryResult> {
    const response = await api.post('/langchain/query', { 
      query,
      ...(gameId && { game_id: gameId })
    });
    return response.data;
  },

  async getLangChainStatus(): Promise<LangChainStatus> {
    const response = await api.get('/langchain/status');
    return response.data;
  },

  async runWorkflow(workflowName: string, gameId?: number) {
    const response = await api.post('/langchain/workflow', {
      workflow_name: workflowName,
      ...(gameId && { game_id: gameId })
    });
    return response.data;
  },

  async getConversationHistory() {
    const response = await api.get('/langchain/conversation/history');
    return response.data;
  }
};