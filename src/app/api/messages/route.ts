import { NextRequest, NextResponse } from 'next/server';
import { verifyUserAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// 获取留言列表
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyUserAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = authResult;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // 获取用户的情侣关系
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

    // 获取情侣双方的ID
    const coupleUserIds = user.couple.users.map(u => u.id);
    
    // 获取留言类型参数
    const visibility = searchParams.get('visibility') || 'all'; // 'all', 'private', 'public'
    
    // 构建查询条件
    let whereCondition: any = {
      AND: [
        { isDeleted: false }
      ]
    };
    
    if (visibility === 'private') {
      // 情侣留言：仅显示情侣双方的私密留言
      whereCondition.AND.push(
        { senderId: { in: coupleUserIds } },
        { receiverId: { in: coupleUserIds } },
        { visibility: 'PRIVATE' }
      );
    } else if (visibility === 'public') {
      // 个人留言：显示所有公开留言
      whereCondition.AND.push(
        { visibility: 'PUBLIC' }
      );
    } else {
      // 显示所有留言：情侣私密留言 + 所有公开留言
      whereCondition = {
        AND: [
          { isDeleted: false },
          {
            OR: [
              {
                AND: [
                  { senderId: { in: coupleUserIds } },
                  { receiverId: { in: coupleUserIds } },
                  { visibility: 'PRIVATE' }
                ]
              },
              { visibility: 'PUBLIC' }
            ]
          }
        ]
      };
    }
    
    // 获取留言列表
    const messages = await prisma.messageWallPost.findMany({
      where: whereCondition,
      include: {
        sender: {
          select: {
            id: true,
            displayName: true,
            avatar: true
          }
        },
        receiver: {
          select: {
            id: true,
            displayName: true,
            avatar: true
          }
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    });

    // 获取总数
    const total = await prisma.messageWallPost.count({
      where: whereCondition
    });

    return NextResponse.json({
      messages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 发送留言
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyUserAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = authResult;
    const body = await request.json();
    const { content, messageType = 'TEXT', attachments = [], surpriseType, surpriseData, visibility = 'PRIVATE' } = body;

    if (!content && (!attachments || attachments.length === 0)) {
      return NextResponse.json({ error: 'Content or attachments required' }, { status: 400 });
    }

    // 获取用户的情侣关系
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

    // 找到接收者（情侣中的另一个人）
    const receiver = user.couple.users.find(u => u.id !== userId);
    if (!receiver) {
      return NextResponse.json({ error: 'Receiver not found' }, { status: 400 });
    }

    // 根据visibility确定接收者
    let receiverId = receiver.id;
    if (visibility === 'PUBLIC') {
      // 公开留言可以设置为发送给自己，表示这是一条公开留言
      receiverId = userId!;
    }
    
    // 创建留言
    const message = await prisma.messageWallPost.create({
      data: {
        senderId: userId!,
        receiverId,
        content: content || '',
        messageType,
        attachments,
        surpriseType,
        surpriseData,
        visibility
      },
      include: {
        sender: {
          select: {
            id: true,
            displayName: true,
            avatar: true
          }
        },
        receiver: {
          select: {
            id: true,
            displayName: true,
            avatar: true
          }
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}