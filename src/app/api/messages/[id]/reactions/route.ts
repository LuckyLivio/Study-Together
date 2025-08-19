import { NextRequest, NextResponse } from 'next/server';
import { verifyUserAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// 添加或移除留言反应
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await verifyUserAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = authResult;
    const messageId = params.id;
    const body = await request.json();
    const { emoji } = body;

    if (!emoji) {
      return NextResponse.json({ error: 'Emoji is required' }, { status: 400 });
    }

    // 检查留言是否存在
    const message = await prisma.messageWallPost.findUnique({
      where: { id: messageId },
      include: {
        sender: true,
        receiver: true
      }
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // 检查用户是否有权限添加反应（必须是情侣中的一员）
    if (message.senderId !== userId && message.receiverId !== userId) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // 检查是否已经有相同的反应
    const existingReaction = await prisma.messageReaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId: userId!,
          emoji
        }
      }
    });

    if (existingReaction) {
      // 如果已存在，则删除反应
      await prisma.messageReaction.delete({
        where: { id: existingReaction.id }
      });
      
      return NextResponse.json({ action: 'removed', success: true });
    } else {
      // 如果不存在，则添加反应
      const reaction = await prisma.messageReaction.create({
        data: {
          messageId,
          userId: userId!,
          emoji
        },
        include: {
          user: {
            select: {
              id: true,
              displayName: true
            }
          }
        }
      });
      
      return NextResponse.json({ action: 'added', reaction, success: true });
    }
  } catch (error) {
    console.error('Error handling message reaction:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 获取留言的所有反应
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await verifyUserAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = authResult;
    const messageId = params.id;

    // 检查留言是否存在且用户有权限查看
    const message = await prisma.messageWallPost.findUnique({
      where: { id: messageId }
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // 检查用户是否有权限查看反应
    if (message.senderId !== userId && message.receiverId !== userId) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // 获取所有反应
    const reactions = await prisma.messageReaction.findMany({
      where: { messageId },
      include: {
        user: {
          select: {
            id: true,
            displayName: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    return NextResponse.json({ reactions });
  } catch (error) {
    console.error('Error fetching message reactions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}