import { NextRequest, NextResponse } from 'next/server';
import { UserStatus } from '@/generated/prisma';
import { prisma } from '@/lib/prisma';
import { verifyAdminAuth } from '@/lib/auth';

// PATCH /api/admin/users/[id]/status - 更新用户状态（封禁/解封）
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, reason } = body;

    // 验证状态值
    if (!status || !Object.values(UserStatus).includes(status)) {
      return NextResponse.json(
        { error: '无效的用户状态' },
        { status: 400 }
      );
    }

    // 检查用户是否存在
    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        displayName: true,
        status: true
      }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }

    // 更新用户状态
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        status: status as UserStatus
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        role: true,
        status: true,
        gender: true,
        bio: true,
        avatar: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
        couple: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // 记录状态变更日志
    console.log(`用户状态变更: ${existingUser.username} (${existingUser.displayName}) 从 ${existingUser.status} 变更为 ${status}${reason ? `, 原因: ${reason}` : ''}`);

    return NextResponse.json({
      user: updatedUser,
      message: `用户状态已更新为 ${status === UserStatus.ACTIVE ? '正常' : status === UserStatus.BANNED ? '封禁' : status === UserStatus.INACTIVE ? '暂停' : '待审核'}`
    });
  } catch (error) {
    console.error('更新用户状态失败:', error);
    return NextResponse.json(
      { error: '更新用户状态失败' },
      { status: 500 }
    );
  }
}