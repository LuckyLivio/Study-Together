import { NextRequest, NextResponse } from 'next/server';
import { verifyUserAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// GET /api/files/[id] - 获取单个文件信息
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await verifyUserAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const file = await prisma.file.findFirst({
      where: {
        id: resolvedParams.id,
        OR: [
          { userId: authResult.user.id },
          {
            visibility: 'COUPLE',
            user: {
              coupleId: authResult.user.coupleId
            }
          }
        ]
      },
      include: {
        folder: true,
        tags: true,
        user: {
          select: {
            id: true,
            displayName: true,
            username: true
          }
        }
      }
    });

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    return NextResponse.json({ file });
  } catch (error) {
    console.error('Error fetching file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/files/[id] - 更新文件信息
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await verifyUserAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const { title, description, visibility, tags } = await request.json();

    // 检查文件是否存在且用户有权限
    const existingFile = await prisma.file.findFirst({
      where: {
        id: resolvedParams.id,
        userId: authResult.user.id
      }
    });

    if (!existingFile) {
      return NextResponse.json({ error: 'File not found or no permission' }, { status: 404 });
    }

    // 更新文件信息
    const updatedFile = await prisma.file.update({
      where: { id: resolvedParams.id },
      data: {
        displayName: title || existingFile.displayName,
        description: description !== undefined ? description : existingFile.description,
        visibility: visibility || existingFile.visibility
      },
      include: {
        folder: true,
        tags: true,
        user: {
          select: {
            id: true,
            displayName: true,
            username: true
          }
        }
      }
    });

    // 处理标签更新
    if (tags !== undefined && Array.isArray(tags)) {
      // 先移除所有现有标签关联
      await prisma.file.update({
        where: { id: params.id },
        data: {
          tags: {
            set: []
          }
        }
      });

      // 添加新标签
      if (tags.length > 0) {
        const tagPromises = tags.map(async (tagName: string) => {
          return prisma.fileTag.upsert({
            where: {
              id: `${tagName.trim()}_${authResult.user.id}`
            },
            update: {},
            create: {
              id: `${tagName.trim()}_${authResult.user.id}`,
              tag: tagName.trim(),
              fileId: params.id
            }
          });
        });
        
        const createdTags = await Promise.all(tagPromises);
        
        // 关联标签到文件
        await prisma.file.update({
          where: { id: params.id },
          data: {
            tags: {
              connect: createdTags.map(tag => ({ id: tag.id }))
            }
          }
        });
      }
    }

    // 重新获取包含更新标签的文件信息
    const fileWithTags = await prisma.file.findUnique({
      where: { id: resolvedParams.id },
      include: {
        folder: true,
        tags: true,
        user: {
          select: {
            id: true,
            displayName: true,
            username: true
          }
        }
      }
    });

    return NextResponse.json({ file: fileWithTags });
  } catch (error) {
    console.error('Error updating file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/files/[id] - 删除文件
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await verifyUserAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    // 检查文件是否存在且用户有权限
    const file = await prisma.file.findFirst({
      where: {
        id: resolvedParams.id,
        userId: authResult.user.id
      }
    });

    if (!file) {
      return NextResponse.json({ error: 'File not found or no permission' }, { status: 404 });
    }

    // 删除物理文件
    try {
      const filePath = join(process.cwd(), 'public', file.filePath);
      if (existsSync(filePath)) {
        await unlink(filePath);
      }
    } catch (error) {
      console.error('Error deleting physical file:', error);
      // 继续删除数据库记录，即使物理文件删除失败
    }

    // 删除数据库记录
    await prisma.file.delete({
      where: { id: resolvedParams.id }
    });

    return NextResponse.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}