// DeepSeek AI API Configuration

export const AI_CONFIG = {
  apiKey: process.env.DEEPSEEK_API_KEY,
  apiUrl: process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions',
  model: 'deepseek-chat',
  maxTokens: 2000,
  temperature: 0.7,
} as const;

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface ChatRequest {
  messages: ChatMessage[];
  userId?: string;
  coupleId?: string;
}

export interface ChatResponse {
  message: ChatMessage;
  success: boolean;
  error?: string;
}

// DeepSeek API request format
export interface DeepSeekMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface DeepSeekRequest {
  model: string;
  messages: DeepSeekMessage[];
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
}

export interface DeepSeekResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// System prompts for different contexts
export const SYSTEM_PROMPTS = {
  general: `你是Study Together应用的AI学习助手。你的任务是帮助情侣用户制定学习计划、解答学习问题、提供学习建议和鼓励。请用友善、专业的语气回答问题，并尽量提供实用的学习建议。`,
  
  studyPlan: `你是一个专业的学习规划师。请根据用户的学习目标、时间安排和能力水平，制定详细的学习计划。计划应该包括具体的学习内容、时间分配和里程碑。`,
  
  motivation: `你是一个学习动力教练。请为用户提供积极的鼓励和动力支持，帮助他们克服学习中的困难和挫折。`,
  
  couple: `你是情侣学习的专家顾问。请为情侣用户提供如何一起学习、相互支持和共同进步的建议。重点关注如何平衡学习和感情关系。`
} as const;

// Utility function to validate API configuration
export function validateAIConfig(): { valid: boolean; error?: string } {
  if (!AI_CONFIG.apiKey) {
    return { valid: false, error: 'DeepSeek API key is not configured' };
  }
  
  if (!AI_CONFIG.apiUrl) {
    return { valid: false, error: 'DeepSeek API URL is not configured' };
  }
  
  return { valid: true };
}

// Generate unique message ID
export function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}