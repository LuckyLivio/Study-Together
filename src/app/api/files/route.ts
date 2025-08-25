import { NextRequest, NextResponse } from 'next/server';
import { verifyUserAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// GET /api/files - 获取用户文件列表
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyUserAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get('folderId');
    const tag = searchParams.get('tag');
    const visibility = searchParams.get('visibility');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // 构建查询条件
    const where: any = {
      OR: [
        { userId: authResult.userId!, visibility: 'PRIVATE' },
        { 
          userId: authResult.userId!, 
          visibility: 'COUPLE',
          user: {
            coupleId: { not: null }
          }
        },
        {
          visibility: 'COUPLE',
          user: {
            coupleId: authResult.user.coupleId
          }
        }
      ]
    };

    if (folderId) {
      where.folderId = folderId;
    } else {
      // 如果没有指定文件夹，只显示根目录下的文件（folderId 为 null）
      where.folderId = null;
    }

    if (tag) {
      where.tags = {
        some: {
          name: {
            contains: tag,
            mode: 'insensitive'
          }
        }
      };
    }

    if (visibility && ['PRIVATE', 'COUPLE'].includes(visibility)) {
      where.visibility = visibility;
    }

    // 获取文件列表
    const [files, total] = await Promise.all([
      prisma.file.findMany({
        where,
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
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: offset,
        take: limit
      }),
      prisma.file.count({ where })
    ]);

    return NextResponse.json({
      files,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching files:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/files - 上传文件
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyUserAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const folderId = formData.get('folderId') as string;
    const visibility = formData.get('visibility') as string;
    const tags = formData.get('tags') as string; // JSON字符串

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!visibility) {
      return NextResponse.json({ error: 'Visibility is required' }, { status: 400 });
    }

    // 验证文件类型
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'text/plain'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
    }

    // 验证文件大小 (50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large (max 50MB)' }, { status: 400 });
    }

    // 确定文件类型
    let fileType: 'PDF' | 'WORD' | 'IMAGE' | 'TEXT';
    if (file.type === 'application/pdf') {
      fileType = 'PDF';
    } else if (file.type.includes('word') || file.type.includes('document')) {
      fileType = 'WORD';
    } else if (file.type.startsWith('image/')) {
      fileType = 'IMAGE';
    } else {
      fileType = 'TEXT';
    }

    // 生成文件名
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const fileName = `${timestamp}-${Math.random().toString(36).substring(2)}.${extension}`;
    
    // 确定上传目录
    const uploadDir = 'files';
    const uploadPath = join(process.cwd(), 'public', 'uploads', uploadDir);
    
    // 确保目录存在
    if (!existsSync(uploadPath)) {
      await mkdir(uploadPath, { recursive: true });
    }

    // 保存文件
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = join(uploadPath, fileName);
    await writeFile(filePath, buffer);

    // 保存文件信息到数据库
    const fileUrl = `/uploads/${uploadDir}/${fileName}`;
    
    if (!authResult.userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 401 });
    }
    
    const savedFile = await prisma.file.create({
      data: {
        displayName: title || file.name, // 如果没有提供title，使用文件名
        description: description || null,
        filename: file.name,
        filePath: fileUrl,
        fileSize: file.size,
        fileType,
        mimeType: file.type,
        visibility: visibility as any,
        userId: authResult.userId,
        folderId: folderId || null
      },
      include: {
        folder: true,
        user: {
          select: {
            id: true,
            displayName: true,
            username: true
          }
        }
      }
    });

    // 处理标签
    if (tags) {
      try {
        const tagNames = JSON.parse(tags) as string[];
        if (Array.isArray(tagNames) && tagNames.length > 0) {
          // 创建标签
          const tagPromises = tagNames.map(async (tagName) => {
            return prisma.fileTag.create({
              data: {
                tag: tagName.trim(),
                fileId: savedFile.id
              }
            });
          });
          
          await Promise.all(tagPromises);
        }
      } catch (error) {
        console.error('Error processing tags:', error);
      }
    }

    // 重新获取包含标签的文件信息
    const fileWithTags = await prisma.file.findUnique({
      where: { id: savedFile.id },
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
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}