import { NextRequest, NextResponse } from 'next/server';
import { verifyUserAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/files/categories - 获取用户文件分类列表
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyUserAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const categories = await prisma.fileCategory.findMany({
      where: {
        userId: authResult.user.id
      },
      include: {
        _count: {
          select: {
            files: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/files/categories - 创建文件分类
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyUserAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, description, color } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    // 检查分类名称是否已存在
    const existingCategory = await prisma.fileCategory.findFirst({
      where: {
        name: name.trim(),
        userId: authResult.user.id
      }
    });

    if (existingCategory) {
      return NextResponse.json({ error: 'Category name already exists' }, { status: 400 });
    }

    const category = await prisma.fileCategory.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        color: color || '#3B82F6',
        userId: authResult.user.id
      },
      include: {
        _count: {
          select: {
            files: true
          }
        }
      }
    });

    return NextResponse.json({ category });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}