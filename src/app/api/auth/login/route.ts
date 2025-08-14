import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, UserStatus } from '@/generated/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// POST /api/auth/login - 用户登录
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, password } = body;
    const loginIdentifier = username || email;

    // 验证必填字段
    if (!loginIdentifier || !password) {
      return NextResponse.json(
        { error: '用户名和密码为必填字段' },
        { status: 400 }
      );
    }

    // 查找用户（支持用户名或邮箱登录）
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: loginIdentifier },
          { email: loginIdentifier }
        ]
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: '用户名或密码错误' },
        { status: 401 }
      );
    }

    // 检查用户状态
    if (user.status !== UserStatus.ACTIVE) {
      return NextResponse.json(
        { error: '账户已被禁用，请联系管理员' },
        { status: 403 }
      );
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: '用户名或密码错误' },
        { status: 401 }
      );
    }

    // 更新最后登录时间
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    // 生成JWT token
    const token = jwt.sign(
      { 
        userId: user.id,
        username: user.username,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 返回用户信息（不包含密码）
    const userResponse = {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      role: user.role,
      status: user.status,
      gender: user.gender,
      avatar: user.avatar,
      bio: user.bio,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLogin: new Date()
    };

    // 设置HTTP-only cookie
    const response = NextResponse.json({
      user: userResponse,
      token
    });

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    return response;
  } catch (error) {
    console.error('登录失败:', error);
    return NextResponse.json(
      { error: '登录失败，请稍后重试' },
      { status: 500 }
    );
  }
}