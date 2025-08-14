import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Role, UserStatus, Gender } from '@/generated/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// POST /api/auth/register - 用户注册
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('注册请求数据:', body);
    const { username, displayName, name, email, password, gender, bio, inviteCode } = body;

    // 处理前端发送的name字段，将其用作username和displayName
    const finalUsername = username || name;
    const finalDisplayName = displayName || name;
    console.log('处理后的字段:', { finalUsername, finalDisplayName, email, password: '***' });

    // 验证必填字段
    if (!finalUsername || !finalDisplayName || !email || !password) {
      return NextResponse.json(
        { error: '姓名、邮箱和密码为必填字段' },
        { status: 400 }
      );
    }

    // 验证密码强度
    if (password.length < 6) {
      return NextResponse.json(
        { error: '密码长度至少为6位' },
        { status: 400 }
      );
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '邮箱格式不正确' },
        { status: 400 }
      );
    }

    // 检查用户名和邮箱是否已存在
    const [existingUsername, existingEmail] = await Promise.all([
      prisma.user.findUnique({ where: { username: finalUsername } }),
      prisma.user.findUnique({ where: { email } })
    ]);

    if (existingUsername) {
      return NextResponse.json(
        { error: '该用户名已被使用' },
        { status: 400 }
      );
    }

    if (existingEmail) {
      return NextResponse.json(
        { error: '该邮箱已被使用' },
        { status: 400 }
      );
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 12);

    // 处理性别字段，转换为正确的枚举值
    let genderEnum: Gender | null = null;
    if (gender) {
      switch (gender.toLowerCase()) {
        case 'male':
          genderEnum = Gender.MALE;
          break;
        case 'female':
          genderEnum = Gender.FEMALE;
          break;
        case 'other':
          genderEnum = Gender.OTHER;
          break;
        default:
          genderEnum = null;
      }
    }

    // 如果有邀请码，验证邀请码
    let couple = null;
    if (inviteCode) {
      couple = await prisma.couple.findUnique({
        where: { inviteCode }
      });

      if (!couple) {
        return NextResponse.json(
          { error: '邀请码无效' },
          { status: 400 }
        );
      }

      if (couple.isComplete) {
        return NextResponse.json(
          { error: '该邀请码已被使用' },
          { status: 400 }
        );
      }
    }

    // 创建用户
    const user = await prisma.user.create({
      data: {
        username: finalUsername,
        displayName: finalDisplayName,
        email,
        password: hashedPassword,
        role: Role.USER,
        status: UserStatus.ACTIVE,
        gender: genderEnum,
        bio: bio || null,
        coupleId: couple?.id || null
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
        coupleId: true
      }
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

    // 如果有邀请码，更新情侣记录
    if (couple && inviteCode) {
      couple = await prisma.couple.update({
        where: { id: couple.id },
        data: {
          person2Id: user.id,
          person2Name: user.displayName,
          isComplete: true
        }
      });
    }

    // 添加情侣相关字段到用户对象
    const userWithCoupleInfo = {
      ...user,
      partnerId: couple?.person1Id === user.id ? couple?.person2Id : couple?.person1Id,
      partnerName: couple?.person1Id === user.id ? couple?.person2Name : couple?.person1Name
    };

    // 设置HTTP-only cookie
    const response = NextResponse.json({
      user: userWithCoupleInfo,
      couple: couple || null,
      token,
      message: inviteCode ? '注册成功，情侣绑定完成' : '注册成功'
    }, { status: 201 });

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    return response;
  } catch (error) {
    console.error('注册失败:', error);
    return NextResponse.json(
      { error: '注册失败，请稍后重试' },
      { status: 500 }
    );
  }
}