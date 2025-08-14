import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, UserStatus } from '@/generated/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getClientIP, getUserAgent } from '@/lib/auth';
import { 
  recordLoginAttempt, 
  checkUserLockout, 
  incrementFailedAttempts, 
  clearFailedAttempts,
  checkIPWhitelist 
} from '@/lib/security';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// POST /api/auth/login - 用户登录
export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request)
  const userAgent = getUserAgent(request)
  let userId: string | null = null
  
  try {
    const body = await request.json();
    const { username, email, password } = body;
    const loginIdentifier = username || email;

    // 验证必填字段
    if (!loginIdentifier || !password) {
      await recordLoginAttempt(request, false, undefined, undefined, '缺少必填字段')
      return NextResponse.json(
        { error: '用户名和密码为必填字段' },
        { status: 400 }
      );
    }

    // 检查IP白名单（对普通用户登录可选，这里先注释掉）
    // const ipAllowed = await checkIPWhitelist(request)
    // if (!ipAllowed) {
    //   await recordLoginAttempt(request, false, undefined, undefined, 'IP地址不在白名单中')
    //   return NextResponse.json(
    //     { error: 'IP地址不在允许范围内' },
    //     { status: 403 }
    //   )
    // }

    // 查找用户（支持用户名或邮箱登录）
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: loginIdentifier },
          { email: loginIdentifier }
        ]
      },
      include: {
        couple: true
      }
    });

    if (!user) {
      await recordLoginAttempt(request, false, undefined, loginIdentifier, '用户不存在')
      return NextResponse.json(
        { error: '用户名或密码错误' },
        { status: 401 }
      );
    }

    userId = user.id

    // 检查用户是否被锁定
    const lockoutResult = await checkUserLockout(userId, clientIP)
    if (lockoutResult.isLocked) {
      await recordLoginAttempt(request, false, userId, user.username, '账户已被锁定')
      return NextResponse.json(
        { error: '账户已被锁定，请稍后再试' },
        { status: 423 }
      );
    }

    // 检查用户状态
    if (user.status !== UserStatus.ACTIVE) {
      await recordLoginAttempt(request, false, userId, user.username, '账户已被禁用')
      return NextResponse.json(
        { error: '账户已被禁用，请联系管理员' },
        { status: 403 }
      );
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      // 记录失败的登录尝试并增加失败次数
      await Promise.all([
        recordLoginAttempt(request, false, userId, user.username, '密码错误'),
        incrementFailedAttempts(request, userId, user.username)
      ])
      return NextResponse.json(
        { error: '用户名或密码错误' },
        { status: 401 }
      );
    }

    // 登录成功，清除失败尝试记录并更新最后登录时间
    await Promise.all([
      clearFailedAttempts(request, userId),
      prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
      }),
      recordLoginAttempt(request, true, userId, user.username, '登录成功')
    ]);

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

    // 获取伴侣信息
    let partnerInfo = null;
    if (user.coupleId && user.couple) {
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
      lastLogin: new Date(),
      coupleId: user.coupleId,
      partnerId: partnerInfo?.id || null,
      partnerName: partnerInfo?.name || null
    };

    // 设置HTTP-only cookie
    const response = NextResponse.json({
      user: userResponse,
      couple: user.couple || null,
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