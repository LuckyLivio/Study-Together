import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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

// GET /api/auth/me - 获取当前用户信息
export async function GET(request: NextRequest) {
  try {
    const tokenData = verifyToken(request);
    if (!tokenData) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }

    // 获取用户信息，包括情侣关系
    const user = await prisma.user.findUnique({
      where: { id: tokenData.userId },
      include: {
        couple: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }

    // 获取伴侣信息
    let partnerInfo = null;
    if (user.couple && user.couple.isComplete) {
      const partnerId = user.couple.person1Id === user.id ? user.couple.person2Id : user.couple.person1Id;
      if (partnerId) {
        const partner = await prisma.user.findUnique({
          where: { id: partnerId },
          select: { id: true, displayName: true, username: true }
        });
        if (partner) {
          partnerInfo = {
            id: partner.id,
            name: partner.displayName || partner.username
          };
        }
      }
    }

    // 确定用户在情侣关系中的角色
    let coupleRole = null;
    if (user.couple && user.couple.isComplete) {
      coupleRole = user.couple.person1Id === user.id ? 'person1' : 'person2';
    }

    // 构建返回的用户数据
    const userData = {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      role: coupleRole || user.role, // 优先使用情侣角色
      status: user.status,
      gender: user.gender,
      bio: user.bio,
      avatar: user.avatar,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLogin: user.lastLogin,
      coupleId: user.coupleId,
      partnerId: partnerInfo?.id || null,
      partnerName: partnerInfo?.name || null
    };

    return NextResponse.json({
      user: userData,
      couple: user.couple
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    return NextResponse.json(
      { error: '获取用户信息失败' },
      { status: 500 }
    );
  }
}