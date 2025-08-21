import { NextRequest, NextResponse } from 'next/server';
import { verifyUserAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

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
        isDeleted: false,
        OR: [
          { userId: authResult.userId },
          {
            visibility: 'COUPLE',
            user: {
              coupleId: authResult.user?.coupleId
            }
          }
        ]
      }
    });

    if (!file) {
      return NextResponse.json({ error: '文件不存在' }, { status: 404 });
    }

    // 检查文件是否支持预览
    const isImage = file.mimeType.startsWith('image/');
    const isPDF = file.mimeType === 'application/pdf';
    
    if (!isImage && !isPDF) {
      return NextResponse.json({ error: '文件类型不支持预览' }, { status: 400 });
    }

    // 检查文件是否存在
    const filePath = path.join(process.cwd(), 'public', file.filePath);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: '文件不存在' }, { status: 404 });
    }

    // 读取文件
    const fileBuffer = fs.readFileSync(filePath);

    // 设置响应头
    const headers = new Headers();
    headers.set('Content-Type', file.mimeType);
    headers.set('Content-Length', fileBuffer.length.toString());
    
    // 对于PDF，设置为内联显示
    if (isPDF) {
      headers.set('Content-Disposition', `inline; filename="${encodeURIComponent(file.displayName)}"`);
    }

    return new NextResponse(fileBuffer, {
      status: 200,
      headers
    });
  } catch (error) {
    console.error('文件预览错误:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}