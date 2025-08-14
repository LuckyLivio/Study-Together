import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/generated/prisma'
import { verifyToken } from '@/lib/auth'

const prisma = new PrismaClient()

// 获取用户的所有聊天对话
export async function GET(request: NextRequest) {
  try {
    // 验证用户身份
    const user = verifyToken(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // 获取用户的所有对话，按更新时间倒序
    const conversations = await prisma.chatConversation.findMany({
      where: {
        userId: user.userId
      },
      include: {
        messages: {
          orderBy: {
            createdAt: 'asc'
          },
          take: 1 // 只获取第一条消息用于预览
        },
        _count: {
          select: {
            messages: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      conversations: conversations.map(conv => ({
        id: conv.id,
        title: conv.title || (conv.messages[0]?.content.slice(0, 50) + '...' || '新对话'),
        messageCount: conv._count.messages,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt
      }))
    })
  } catch (error) {
    console.error('获取对话列表失败:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch conversations' },
      { status: 500 }
    )
  }
}

// 创建新的聊天对话
export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const user = verifyToken(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { title } = body

    // 创建新对话
    const conversation = await prisma.chatConversation.create({
      data: {
        title: title || null,
        userId: user.userId
      }
    })

    return NextResponse.json({
      success: true,
      conversation: {
        id: conversation.id,
        title: conversation.title,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt
      }
    })
  } catch (error) {
    console.error('创建对话失败:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create conversation' },
      { status: 500 }
    )
  }
}

// 删除聊天对话
export async function DELETE(request: NextRequest) {
  try {
    // 验证用户身份
    const user = verifyToken(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('id')

    if (!conversationId) {
      return NextResponse.json(
        { success: false, error: 'Conversation ID is required' },
        { status: 400 }
      )
    }

    // 验证对话所有权
    const conversation = await prisma.chatConversation.findFirst({
      where: {
        id: conversationId,
        userId: user.userId
      }
    })

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found or access denied' },
        { status: 404 }
      )
    }

    // 删除对话（级联删除消息）
    await prisma.chatConversation.delete({
      where: {
        id: conversationId
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Conversation deleted successfully'
    })
  } catch (error) {
    console.error('删除对话失败:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete conversation' },
      { status: 500 }
    )
  }
}