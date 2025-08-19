import { NextRequest, NextResponse } from 'next/server';
import { verifyUserAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await verifyUserAuth(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 获取用户信息和情侣关系
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        couple: {
          include: {
            users: true
          }
        }
      }
    });

    if (!user?.couple || !user.couple.isComplete) {
      return NextResponse.json({ error: 'No couple relationship found' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const since = searchParams.get('since');
    
    // 获取情侣双方的ID
    const coupleUserIds = user.couple.users.map(u => u.id);
    const partnerId = coupleUserIds.find(id => id !== userId);

    if (!partnerId) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 400 });
    }

    let whereCondition: any = {
      AND: [
        { senderId: partnerId }, // 只获取伴侣发送的留言
        { receiverId: userId },   // 发送给当前用户的留言
        { isDeleted: false }
      ]
    };

    // 如果提供了时间参数，只获取该时间之后的留言
    if (since) {
      const sinceDate = new Date(since);
      if (!isNaN(sinceDate.getTime())) {
        whereCondition.AND.push({
          createdAt: {
            gt: sinceDate
          }
        });
      }
    }

    // 获取新留言
    const newMessages = await prisma.messageWallPost.findMany({
      where: whereCondition,
      include: {
        sender: {
          select: {
            id: true,
            displayName: true,
            avatar: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10 // 最多返回10条新留言
    });

    // 获取未读留言数量
    const unreadCount = await prisma.messageWallPost.count({
      where: {
        AND: [
          { senderId: partnerId },
          { receiverId: userId },
          { isDeleted: false },
          { isRead: false }
        ]
      }
    });

    // 格式化返回数据
    const formattedMessages = newMessages.map(message => ({
      id: message.id,
      senderId: message.senderId,
      senderName: message.sender.displayName,
      content: message.content,
      messageType: message.messageType,
      surpriseType: message.surpriseType,
      createdAt: message.createdAt.toISOString()
    }));

    return NextResponse.json({
      success: true,
      messages: formattedMessages,
      unreadCount,
      hasNewMessages: newMessages.length > 0
    });

  } catch (error) {
    console.error('Error fetching message notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}