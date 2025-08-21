import { NextRequest, NextResponse } from 'next/server';
import { verifyUserAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/folders/[id] - 获取单个文件夹详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await verifyUserAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const folder = await prisma.folder.findFirst({
      where: {
        id: params.id,
        userId: authResult.user.id
      },
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
        files: {
          select: {
            id: true,
            displayName: true,
            filename: true,
            fileSize: true,
            fileType: true,
            mimeType: true,
            visibility: true,
            createdAt: true,
            downloadCount: true
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
      }
    });

    if (!folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    return NextResponse.json({ folder });
  } catch (error) {
    console.error('Error fetching folder:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/folders/[id] - 更新文件夹
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await verifyUserAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, color, icon, parentId } = body;

    // 验证文件夹是否存在且属于当前用户
    const existingFolder = await prisma.folder.findFirst({
      where: {
        id: params.id,
        userId: authResult.user.id
      }
    });

    if (!existingFolder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    // 如果更新名称，检查同级文件夹名称是否重复
    if (name && name.trim() !== existingFolder.name) {
      const duplicateFolder = await prisma.folder.findFirst({
        where: {
          name: name.trim(),
          userId: authResult.user.id,
          parentId: parentId !== undefined ? parentId : existingFolder.parentId,
          id: { not: params.id }
        }
      });

      if (duplicateFolder) {
        return NextResponse.json({ error: 'Folder name already exists in this location' }, { status: 400 });
      }
    }

    // 如果移动文件夹，验证新的父文件夹
    if (parentId !== undefined && parentId !== existingFolder.parentId) {
      if (parentId) {
        // 检查父文件夹是否存在且属于当前用户
        const parentFolder = await prisma.folder.findFirst({
          where: {
            id: parentId,
            userId: authResult.user.id
          }
        });

        if (!parentFolder) {
          return NextResponse.json({ error: 'Parent folder not found' }, { status: 404 });
        }

        // 防止循环引用（不能将文件夹移动到自己的子文件夹中）
        const isDescendant = await checkIfDescendant(params.id, parentId);
        if (isDescendant) {
          return NextResponse.json({ error: 'Cannot move folder to its own descendant' }, { status: 400 });
        }
      }
    }

    const updatedFolder = await prisma.folder.update({
      where: { id: params.id },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(color && { color }),
        ...(icon && { icon }),
        ...(parentId !== undefined && { parentId: parentId || null })
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

    return NextResponse.json({ folder: updatedFolder });
  } catch (error) {
    console.error('Error updating folder:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/folders/[id] - 删除文件夹
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await verifyUserAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 验证文件夹是否存在且属于当前用户
    const folder = await prisma.folder.findFirst({
      where: {
        id: params.id,
        userId: authResult.user.id
      },
      include: {
        children: true,
        files: true
      }
    });

    if (!folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    // 检查文件夹是否为空
    if (folder.children.length > 0 || folder.files.length > 0) {
      return NextResponse.json({ error: 'Cannot delete non-empty folder' }, { status: 400 });
    }

    await prisma.folder.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Folder deleted successfully' });
  } catch (error) {
    console.error('Error deleting folder:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 辅助函数：检查是否为子文件夹（防止循环引用）
async function checkIfDescendant(folderId: string, potentialParentId: string): Promise<boolean> {
  const descendants = await prisma.folder.findMany({
    where: {
      parentId: folderId
    },
    select: {
      id: true
    }
  });

  for (const descendant of descendants) {
    if (descendant.id === potentialParentId) {
      return true;
    }
    if (await checkIfDescendant(descendant.id, potentialParentId)) {
      return true;
    }
  }

  return false;
}