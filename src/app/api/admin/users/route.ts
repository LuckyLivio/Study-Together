import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Role, UserStatus } from '@/generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// GET /api/admin/users - 获取所有用户
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') as UserStatus | null;
    const role = searchParams.get('role') as Role | null;

    const skip = (page - 1) * limit;

    // 构建查询条件
    const where: any = {};
    
    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { displayName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (status) {
      where.status = status;
    }
    
    if (role) {
      where.role = role;
    }

    // 获取用户列表和总数
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
      }),
      prisma.user.count({ where })
    ]);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    return NextResponse.json(
      { error: '获取用户列表失败' },
      { status: 500 }
    );
  }
}

// POST /api/admin/users - 创建新用户
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, displayName, email, password, role, status, gender, bio, avatar } = body;

    // 验证必填字段
    if (!username || !displayName || !email || !password || !role) {
      return NextResponse.json(
        { error: '用户名、显示名称、邮箱、密码和角色为必填字段' },
        { status: 400 }
      );
    }

    // 检查用户名和邮箱是否已存在
    const [existingUsername, existingEmail] = await Promise.all([
      prisma.user.findUnique({ where: { username } }),
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

    // 创建用户
    const user = await prisma.user.create({
      data: {
        username,
        displayName,
        email,
        password: hashedPassword,
        role: role as Role,
        status: status as UserStatus || UserStatus.ACTIVE,
        gender: gender || null,
        bio: bio || null,
        avatar: avatar || null
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
        updatedAt: true
      }
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('创建用户失败:', error);
    return NextResponse.json(
      { error: '创建用户失败' },
      { status: 500 }
    );
  }
}