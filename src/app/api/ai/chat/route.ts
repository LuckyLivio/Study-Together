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
import { PrismaClient } from '@/generated/prisma';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
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
    const { messages, userId, coupleId, conversationId } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Messages are required' },
        { status: 400 }
      );
    }

    // Verify user ID matches authenticated user
    if (userId && userId !== user.userId) {
      return NextResponse.json(
        { success: false, error: 'User ID mismatch' },
        { status: 403 }
      );
    }

    // Get or create conversation
    let conversation;
    if (conversationId) {
      // Verify conversation ownership
      conversation = await prisma.chatConversation.findFirst({
        where: {
          id: conversationId,
          userId: user.userId
        }
      });
      
      if (!conversation) {
        return NextResponse.json(
          { success: false, error: 'Conversation not found' },
          { status: 404 }
        );
      }
    } else {
      // Create new conversation
      conversation = await prisma.chatConversation.create({
        data: {
          title: '新对话',
          userId: user.userId
        }
      });
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

    // Save user message to database (only the latest one)
    const userMessage = messages[messages.length - 1];
    const savedUserMessage = await prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        userId: user.userId,
        role: userMessage.role,
        content: userMessage.content
      }
    });

    // Save assistant message to database
    const assistantContent = deepSeekResponse.choices[0].message.content;
    const savedAssistantMessage = await prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        userId: user.userId,
        role: 'assistant',
        content: assistantContent
      }
    });

    // Update conversation timestamp
    await prisma.chatConversation.update({
      where: {
        id: conversation.id
      },
      data: {
        updatedAt: new Date()
      }
    });

    // Create response message
    const assistantMessage = {
      id: savedAssistantMessage.id,
      role: 'assistant' as const,
      content: assistantContent,
      timestamp: savedAssistantMessage.createdAt
    };

    const chatResponse: ChatResponse = {
      message: assistantMessage,
      conversationId: conversation.id,
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