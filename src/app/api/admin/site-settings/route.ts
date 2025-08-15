import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/admin/site-settings - 获取网站设置
export async function GET() {
  try {
    // 查找网站设置
    const siteSettings = await prisma.siteSettings.findFirst({
      where: {
        key: 'site_config'
      }
    });

    // 如果没有设置，返回默认值
    if (!siteSettings) {
      return NextResponse.json({
        siteName: 'Study Together',
        siteDescription: '情侣共同学习平台',
        siteUrl: 'https://study-together.com',
        logoUrl: '',
        faviconUrl: '',
        contactEmail: 'admin@study-together.com',
        contactPhone: '',
        address: '',
        socialLinks: {
          github: '',
          twitter: '',
          instagram: '',
          wechat: ''
        },
        seo: {
          keywords: '学习,情侣,共同进步,任务管理',
          author: 'Study Together Team',
          ogImage: ''
        },
        analytics: {
          googleAnalyticsId: '',
          baiduAnalyticsId: ''
        }
      });
    }

    const settings = JSON.parse(siteSettings.value);
    return NextResponse.json(settings);

  } catch (error) {
    console.error('获取网站设置失败:', error);
    return NextResponse.json(
      { error: '获取网站设置失败' },
      { status: 500 }
    );
  }
}

// POST /api/admin/site-settings - 更新网站设置
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
    const {
      siteName,
      siteDescription,
      siteUrl,
      logoUrl,
      faviconUrl,
      contactEmail,
      contactPhone,
      address,
      socialLinks,
      seo,
      analytics
    } = body;

    // 验证必填字段
    if (!siteName || typeof siteName !== 'string' || siteName.trim().length === 0) {
      return NextResponse.json(
        { error: '网站名称不能为空' },
        { status: 400 }
      );
    }

    if (!siteDescription || typeof siteDescription !== 'string' || siteDescription.trim().length === 0) {
      return NextResponse.json(
        { error: '网站描述不能为空' },
        { status: 400 }
      );
    }

    const settings = {
      siteName: siteName.trim(),
      siteDescription: siteDescription.trim(),
      siteUrl: siteUrl || '',
      logoUrl: logoUrl || '',
      faviconUrl: faviconUrl || '',
      contactEmail: contactEmail || '',
      contactPhone: contactPhone || '',
      address: address || '',
      socialLinks: socialLinks || {
        github: '',
        twitter: '',
        instagram: '',
        wechat: ''
      },
      seo: seo || {
        keywords: '',
        author: '',
        ogImage: ''
      },
      analytics: analytics || {
        googleAnalyticsId: '',
        baiduAnalyticsId: ''
      }
    };

    // 更新或创建网站设置
    await prisma.siteSettings.upsert({
      where: {
        key: 'site_config'
      },
      update: {
        value: JSON.stringify(settings),
        updatedAt: new Date()
      },
      create: {
        key: 'site_config',
        value: JSON.stringify(settings)
      }
    });

    return NextResponse.json({
      success: true,
      message: '网站设置已更新',
      settings
    });

  } catch (error) {
    console.error('更新网站设置失败:', error);
    return NextResponse.json(
      { error: '更新网站设置失败' },
      { status: 500 }
    );
  }
}