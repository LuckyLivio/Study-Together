import { NextRequest, NextResponse } from 'next/server';
import { verifyUserAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PATCH /api/files/[id]/move - 移动文件到指定文件夹
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await verifyUserAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const { folderId } = await request.json();

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

    // 如果指定了文件夹ID，验证文件夹是否存在且属于当前用户
    if (folderId) {
      const targetFolder = await prisma.folder.findFirst({
        where: {
          id: folderId,
          userId: authResult.user.id
        }
      });

      if (!targetFolder) {
        return NextResponse.json({ error: 'Target folder not found' }, { status: 404 });
      }
    }

    // 更新文件的文件夹ID
    const updatedFile = await prisma.file.update({
      where: { id: resolvedParams.id },
      data: {
        folderId: folderId || null
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

    return NextResponse.json({ 
      message: 'File moved successfully',
      file: updatedFile 
    });
  } catch (error) {
    console.error('Error moving file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}