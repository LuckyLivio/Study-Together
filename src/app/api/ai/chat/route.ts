import { NextRequest, NextResponse } from 'next/server';
import { 
  AI_CONFIG, 
  validateAIConfig, 
  generateMessageId,
  ChatRequest, 
  ChatResponse, 
  DeepSeekRequest, 
  DeepSeekResponse,
  SYSTEM_PROMPTS
} from '@/lib/ai-config';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// 验证JWT token的辅助函数
function verifyToken(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return null;
  }

  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; username: string; role: string };
  } catch (error) {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validate AI configuration
    const configValidation = validateAIConfig();
    if (!configValidation.valid) {
      return NextResponse.json(
        { success: false, error: configValidation.error },
        { status: 500 }
      );
    }

    // Get and verify user authentication
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const body: ChatRequest = await request.json();
    const { messages, userId, coupleId } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Messages are required' },
        { status: 400 }
      );
    }

    // Prepare messages for DeepSeek API
    const deepSeekMessages = [
      {
        role: 'system' as const,
        content: SYSTEM_PROMPTS.general
      },
      ...messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    ];

    // Prepare DeepSeek API request
    const deepSeekRequest: DeepSeekRequest = {
      model: AI_CONFIG.model,
      messages: deepSeekMessages,
      max_tokens: AI_CONFIG.maxTokens,
      temperature: AI_CONFIG.temperature,
      stream: false
    };

    // Call DeepSeek API
    const response = await fetch(AI_CONFIG.apiUrl!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_CONFIG.apiKey}`
      },
      body: JSON.stringify(deepSeekRequest)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepSeek API error:', response.status, errorText);
      return NextResponse.json(
        { success: false, error: 'AI service temporarily unavailable' },
        { status: 500 }
      );
    }

    const deepSeekResponse: DeepSeekResponse = await response.json();
    
    if (!deepSeekResponse.choices || deepSeekResponse.choices.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No response from AI service' },
        { status: 500 }
      );
    }

    // Create response message
    const assistantMessage = {
      id: generateMessageId(),
      role: 'assistant' as const,
      content: deepSeekResponse.choices[0].message.content,
      timestamp: new Date()
    };

    const chatResponse: ChatResponse = {
      message: assistantMessage,
      success: true
    };

    return NextResponse.json(chatResponse);

  } catch (error) {
    console.error('AI chat error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  const configValidation = validateAIConfig();
  
  return NextResponse.json({
    status: 'ok',
    aiConfigured: configValidation.valid,
    error: configValidation.error
  });
}