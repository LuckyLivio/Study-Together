import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';
import { verifyAdminAuth } from '@/lib/auth';

const prisma = new PrismaClient();

// GET /api/admin/maintenance - 获取维护模式状态
export async function GET() {
  try {
    // 查找维护模式设置
    let maintenanceSettings = await prisma.siteSettings.findFirst({
      where: {
        key: 'maintenance'
      }
    });

    // 如果没有设置，返回默认值
    if (!maintenanceSettings) {
      return NextResponse.json({
        enabled: false,
        message: '网站正在维护中，请稍后访问'
      });
    }

    const settings = JSON.parse(maintenanceSettings.value);
    return NextResponse.json(settings);

  } catch (error) {
    console.error('获取维护模式状态失败:', error);
    return NextResponse.json(
      { error: '获取维护模式状态失败' },
      { status: 500 }
    );
  }
}

// POST /api/admin/maintenance - 更新维护模式状态
export async function POST(request: NextRequest) {
  try {
    // 验证管理员权限
    const authResult = await verifyAdminAuth(request);
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || '需要管理员权限' },
        { status: 403 }
      );
    }
    
    if (!authResult.user?.isAdmin && authResult.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '需要管理员权限' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { enabled, message } = body;

    // 验证输入
    if (typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: '维护模式状态必须是布尔值' },
        { status: 400 }
      );
    }

    if (typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: '维护信息不能为空' },
        { status: 400 }
      );
    }

    const settings = {
      enabled,
      message: message.trim()
    };

    // 更新或创建维护模式设置
    await prisma.siteSettings.upsert({
      where: {
        key: 'maintenance'
      },
      update: {
        value: JSON.stringify(settings),
        updatedAt: new Date()
      },
      create: {
        key: 'maintenance',
        value: JSON.stringify(settings)
      }
    });

    return NextResponse.json({
      success: true,
      message: '维护模式设置已更新',
      settings
    });

  } catch (error) {
    console.error('更新维护模式状态失败:', error);
    return NextResponse.json(
      { error: '更新维护模式状态失败' },
      { status: 500 }
    );
  }
}