import { NextRequest, NextResponse } from 'next/server';
import { verifyUserAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// 删除留言
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await verifyUserAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = authResult;
    const messageId = params.id;

    // 检查留言是否存在且用户有权限删除
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

    // 只有发送者可以删除留言
    if (message.senderId !== userId) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // 软删除留言
    await prisma.messageWallPost.update({
      where: { id: messageId },
      data: { isDeleted: true }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 标记留言为已读
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await verifyUserAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = authResult;
    const messageId = params.id;
    const body = await request.json();
    const { action } = body;

    if (action === 'mark_read') {
      // 检查留言是否存在且用户是接收者
      const message = await prisma.messageWallPost.findUnique({
        where: { id: messageId }
      });

      if (!message) {
        return NextResponse.json({ error: 'Message not found' }, { status: 404 });
      }

      // 只有接收者可以标记为已读
      if (message.receiverId !== userId) {
        return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
      }

      // 标记为已读
      await prisma.messageWallPost.update({
        where: { id: messageId },
        data: { isRead: true }
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}