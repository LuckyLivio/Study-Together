import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/generated/prisma'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// 验证JWT token的辅助函数
function verifyToken(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '')
  
  if (!token) {
    return null
  }

  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; username: string; role: string }
  } catch (error) {
    return null
  }
}

// GET - 获取对话中的消息
export async function GET(request: NextRequest) {
  const user = verifyToken(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const conversationId = searchParams.get('conversationId')

  if (!conversationId) {
    return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 })
  }

  try {
    // 验证对话所有权
    const conversation = await prisma.chatConversation.findFirst({
      where: {
        id: conversationId,
        userId: user.userId
      }
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    const messages = await prisma.chatMessage.findMany({
      where: {
        conversationId: conversationId
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - 发送新消息
export async function POST(request: NextRequest) {
  const user = verifyToken(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { conversationId, role, content } = await request.json()

    if (!conversationId || !role || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 验证对话所有权
    const conversation = await prisma.chatConversation.findFirst({
      where: {
        id: conversationId,
        userId: user.userId
      }
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // 创建消息
    const message = await prisma.chatMessage.create({
      data: {
        conversationId: conversationId,
        userId: user.userId,
        role: role,
        content: content
      }
    })

    // 更新对话的最后更新时间
    await prisma.chatConversation.update({
      where: {
        id: conversationId
      },
      data: {
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ message })
  } catch (error) {
    console.error('Error creating message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - 删除消息
export async function DELETE(request: NextRequest) {
  const user = verifyToken(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const messageId = searchParams.get('messageId')

  if (!messageId) {
    return NextResponse.json({ error: 'Message ID is required' }, { status: 400 })
  }

  try {
    // 验证消息所有权
    const message = await prisma.chatMessage.findFirst({
      where: {
        id: messageId,
        userId: user.userId
      }
    })

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    await prisma.chatMessage.delete({
      where: {
        id: messageId
      }
    })

    return NextResponse.json({ message: 'Message deleted successfully' })
  } catch (error) {
    console.error('Error deleting message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}