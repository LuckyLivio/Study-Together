import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { validatePasswordPolicy } from '@/lib/security';
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

// GET /api/auth/profile - 获取用户资料
export async function GET(request: NextRequest) {
  try {
    const tokenData = verifyToken(request);
    if (!tokenData) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: tokenData.userId },
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        role: true,
        status: true,
        gender: true,
        avatar: true,
        bio: true,
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

    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('获取用户资料失败:', error);
    return NextResponse.json(
      { error: '获取用户资料失败' },
      { status: 500 }
    );
  }
}

// PUT /api/auth/profile - 更新用户资料
export async function PUT(request: NextRequest) {
  try {
    const tokenData = verifyToken(request);
    if (!tokenData) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, displayName, bio, avatar, gender, currentPassword, newPassword } = body;

    // 如果要更改密码，需要验证当前密码
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: '更改密码需要提供当前密码' },
          { status: 400 }
        );
      }

      // 验证新密码策略
      const passwordValidation = await validatePasswordPolicy(newPassword);
      if (!passwordValidation.valid) {
        return NextResponse.json(
          { error: `新密码不符合安全策略: ${passwordValidation.errors.join(', ')}` },
          { status: 400 }
        );
      }

      // 验证当前密码
      const user = await prisma.user.findUnique({
        where: { id: tokenData.userId }
      });

      if (!user) {
        return NextResponse.json(
          { error: '用户不存在' },
          { status: 404 }
        );
      }

      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return NextResponse.json(
          { error: '当前密码错误' },
          { status: 400 }
        );
      }
    }

    // 准备更新数据
    const updateData: any = {
      updatedAt: new Date()
    };

    if (name !== undefined) updateData.displayName = name;
    if (displayName !== undefined) updateData.displayName = displayName;
    if (bio !== undefined) updateData.bio = bio;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (gender !== undefined) updateData.gender = gender;
    
    if (newPassword) {
      updateData.password = await bcrypt.hash(newPassword, 12);
    }

    // 更新用户资料
    const updatedUser = await prisma.user.update({
      where: { id: tokenData.userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        role: true,
        status: true,
        gender: true,
        avatar: true,
        bio: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true
      }
    });

    return NextResponse.json({
      user: updatedUser,
      message: '资料更新成功'
    });
  } catch (error) {
    console.error('更新用户资料失败:', error);
    return NextResponse.json(
      { error: '更新用户资料失败' },
      { status: 500 }
    );
  }
}