import { NextRequest, NextResponse } from 'next/server';
import { verifyUserAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/folders - 获取用户的文件夹列表
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyUserAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get('parentId');

    // 获取用户的情侣关系
    const user = await prisma.user.findUnique({
      where: { id: authResult.userId! },
      include: { couple: true }
    });

    // 构建查询条件 - 包括用户自己的文件夹和情侣共享的文件夹
    const where: any = {
      OR: [
        { userId: authResult.userId! }, // 用户自己的文件夹
        ...(user?.couple ? [{
          userId: user.couple.person1Id === authResult.userId! ? user.couple.person2Id : user.couple.person1Id,
          visibility: 'COUPLE'
        }] : []) // 情侣的共享文件夹
      ]
    };

    if (parentId) {
      where.parentId = parentId;
    } else {
      where.parentId = null; // 获取根级文件夹
    }

    const folders = await prisma.folder.findMany({
      where,
      include: {
        parent: true,
        children: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
            createdAt: true,
            _count: {
              select: {
                files: true,
                children: true
              }
            }
          }
        },
        _count: {
          select: {
            files: true,
            children: true
          }
        },
        user: {
          select: {
            id: true,
            displayName: true,
            username: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ folders });
  } catch (error) {
    console.error('Error fetching folders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/folders - 创建新文件夹
export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/folders - Starting request');
    const authResult = await verifyUserAuth(request);
    console.log('Auth result:', authResult);
    if (!authResult.success) {
      console.log('Auth failed:', authResult.error);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('Request body:', body);
    const { name, description, color, icon, parentId, visibility } = body;

    if (!name || name.trim().length === 0) {
      console.log('Folder name validation failed');
      return NextResponse.json({ error: 'Folder name is required' }, { status: 400 });
    }

    // 检查同级文件夹名称是否重复
    const existingFolder = await prisma.folder.findFirst({
      where: {
        name: name.trim(),
        userId: authResult.userId!,
        parentId: parentId || null
      }
    });

    if (existingFolder) {
      return NextResponse.json({ error: 'Folder name already exists in this location' }, { status: 400 });
    }

    // 如果指定了父文件夹，验证父文件夹是否存在且属于当前用户
    if (parentId) {
      const parentFolder = await prisma.folder.findFirst({
        where: {
          id: parentId,
          userId: authResult.userId!
        }
      });

      if (!parentFolder) {
        return NextResponse.json({ error: 'Parent folder not found' }, { status: 404 });
      }
    }

    const folder = await prisma.folder.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        color: color || '#3b82f6',
        icon: icon || 'folder',
        userId: authResult.userId!,
        parentId: parentId || null,
        visibility: visibility || 'PRIVATE'
      },
      include: {
        parent: true,
        _count: {
          select: {
            files: true,
            children: true
          }
        },
        user: {
          select: {
            id: true,
            displayName: true,
            username: true
          }
        }
      }
    });

    return NextResponse.json({ folder });
  } catch (error) {
    console.error('Error creating folder:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}